// electron/services/excelService.js - Version optimisée

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const configService = require('./configService');
const { safeReadJsonFile, safeWriteJsonFile } = require('./fileService');

const LOCAL_EXCEL_CACHE_PATH = path.join(configService.userDataPath, 'cache-excel.json');

// Cache en mémoire pour éviter les lectures répétées
let memoryCache = null;
let memoryCacheTimestamp = null;
const MEMORY_CACHE_TTL = 30000; // 30 secondes

async function readExcelFileAsync(excelPath) {
    const finalPath = excelPath || configService.appConfig?.defaultExcelPath;

    // Vérifier le cache mémoire d'abord
    const now = Date.now();
    if (memoryCache && memoryCacheTimestamp && (now - memoryCacheTimestamp) < MEMORY_CACHE_TTL) {
        console.log('📦 Utilisation cache mémoire Excel');
        return { success: true, users: memoryCache, fromMemoryCache: true };
    }

    try {
        if (!finalPath || !fs.existsSync(finalPath)) {
            throw new Error(`Fichier Excel introuvable: ${finalPath || 'chemin non configuré'}`);
        }

        // Lecture optimisée avec options
        const workbook = XLSX.readFile(finalPath, {
            cellDates: true,
            cellNF: false,
            cellStyles: false,
        });

        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            raw: false,
            defval: '',
        });

        const usersByServer = {};
        
        // Traitement optimisé
        for (const row of data) {
            const user = {};
            for (const [excelHeader, userKey] of Object.entries(configService.EXCEL_CONFIG.columnMapping)) {
                if (row[excelHeader] !== undefined) {
                    user[userKey] = String(row[excelHeader]).trim();
                }
            }

            if (user.username) {
                const server = user.server || 'SRV-RDS-1';
                if (!usersByServer[server]) {
                    usersByServer[server] = [];
                }
                usersByServer[server].push(user);
            }
        }

        // Mettre en cache (fichier et mémoire)
        await safeWriteJsonFile(LOCAL_EXCEL_CACHE_PATH, usersByServer);
        memoryCache = usersByServer;
        memoryCacheTimestamp = now;

        console.log(`✅ Excel chargé: ${Object.values(usersByServer).flat().length} utilisateurs`);
        return { success: true, users: usersByServer };

    } catch (error) {
        console.warn('⚠️ Erreur lecture Excel, utilisation du cache:', error.message);
        
        // Essayer le cache fichier
        const cachedData = await safeReadJsonFile(LOCAL_EXCEL_CACHE_PATH, {});
        
        if (Object.keys(cachedData).length > 0) {
            memoryCache = cachedData;
            memoryCacheTimestamp = now;
            return { success: true, users: cachedData, fromCache: true };
        }
        
        return { success: false, error: error.message, users: {} };
    }
}

async function saveUserToExcel({ excelPath, user, isEdit }) {
    const finalPath = excelPath || configService.appConfig?.defaultExcelPath;
    
    try {
        if (!fs.existsSync(finalPath)) {
            throw new Error(`Fichier introuvable: ${finalPath}`);
        }

        const workbook = XLSX.readFile(finalPath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const excelRow = {
            'Identifiant': user.identifiant,
            'Mot de passe': user.motdepasse,
            'Office': user.office,
            'Nom complet': user.nomcomplet,
            'Service': user.service,
            'Email': user.email,
            'Serveur': user.serveur,
        };

        const index = data.findIndex(row => row['Identifiant'] === excelRow['Identifiant']);
        
        if (isEdit && index !== -1) {
            data[index] = excelRow;
        } else {
            data.push(excelRow);
        }

        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(data), sheetName);
        XLSX.writeFile(newWb, finalPath);

        // Invalider les caches
        memoryCache = null;
        memoryCacheTimestamp = null;

        return { success: true };
    } catch (error) {
        return { success: false, error: `Erreur sauvegarde Excel: ${error.message}` };
    }
}

async function deleteUserFromExcel({ excelPath, username }) {
    const finalPath = excelPath || configService.appConfig?.defaultExcelPath;
    
    try {
        if (!fs.existsSync(finalPath)) {
            throw new Error(`Fichier introuvable: ${finalPath}`);
        }

        const workbook = XLSX.readFile(finalPath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const updatedData = data.filter(row => row['Identifiant'] !== username);

        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(updatedData), sheetName);
        XLSX.writeFile(newWb, finalPath);

        // Invalider les caches
        memoryCache = null;
        memoryCacheTimestamp = null;

        return { success: true };
    } catch (error) {
        return { success: false, error: `Erreur suppression Excel: ${error.message}` };
    }
}

// Fonction pour invalider manuellement le cache si nécessaire
function invalidateCache() {
    memoryCache = null;
    memoryCacheTimestamp = null;
}

module.exports = {
    readExcelFileAsync,
    saveUserToExcel,
    deleteUserFromExcel,
    invalidateCache,
};