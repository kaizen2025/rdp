// electron/services/excelService.js - Version optimisée avec mise à jour mots de passe

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
        console.log('🔦 Utilisation cache mémoire Excel');
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

/**
 * Sauvegarde ou met à jour un utilisateur dans Excel
 * @param {Object} options - { user, isEdit }
 * @returns {Promise}
 */
async function saveUserToExcel({ user, isEdit, excelPath }) {
    const finalPath = excelPath || configService.appConfig?.defaultExcelPath;
    
    try {
        if (!finalPath) {
            throw new Error('Chemin Excel non configuré');
        }

        if (!fs.existsSync(finalPath)) {
            throw new Error(`Fichier introuvable: ${finalPath}`);
        }

        const workbook = XLSX.readFile(finalPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Mapper les propriétés de l'utilisateur vers les colonnes Excel
        // En inverse : userKey => excelHeader
        const reverseMapping = {};
        for (const [excelHeader, userKey] of Object.entries(configService.EXCEL_CONFIG.columnMapping)) {
            reverseMapping[userKey] = excelHeader;
        }

        const excelRow = {};
        for (const [userKey, userValue] of Object.entries(user)) {
            const excelHeader = reverseMapping[userKey];
            if (excelHeader) {
                excelRow[excelHeader] = userValue;
            }
        }

        // Trouver l'utilisateur dans Excel
        const excelUsername = user.username;
        const index = data.findIndex(row => {
            const rowUsername = row[reverseMapping.username] || row['Identifiant'];
            return rowUsername === excelUsername;
        });
        
        if (isEdit && index !== -1) {
            // Mettre à jour la ligne existante
            data[index] = { ...data[index], ...excelRow };
            console.log(`✅ Utilisateur ${excelUsername} mis à jour dans Excel`);
        } else if (!isEdit) {
            // Ajouter une nouvelle ligne
            data.push(excelRow);
            console.log(`✅ Utilisateur ${excelUsername} ajouté dans Excel`);
        } else {
            throw new Error(`Utilisateur ${excelUsername} non trouvé dans Excel`);
        }

        // Écrire dans le fichier Excel
        const newWb = XLSX.utils.book_new();
        const newWs = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(newWb, newWs, sheetName);
        XLSX.writeFile(newWb, finalPath);

        // Invalider les caches
        invalidateCache();

        return { success: true, message: `${isEdit ? 'Mis à jour' : 'Ajouté'} avec succès` };

    } catch (error) {
        console.error('❌ Erreur sauvegarde Excel:', error.message);
        return { success: false, error: `Erreur sauvegarde Excel: ${error.message}` };
    }
}

/**
 * Supprime un utilisateur du fichier Excel
 * @param {Object} options - { username, excelPath }
 * @returns {Promise}
 */
async function deleteUserFromExcel({ username, excelPath }) {
    const finalPath = excelPath || configService.appConfig?.defaultExcelPath;
    
    try {
        if (!finalPath) {
            throw new Error('Chemin Excel non configuré');
        }

        if (!fs.existsSync(finalPath)) {
            throw new Error(`Fichier introuvable: ${finalPath}`);
        }

        const workbook = XLSX.readFile(finalPath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const reverseMapping = {};
        for (const [excelHeader, userKey] of Object.entries(configService.EXCEL_CONFIG.columnMapping)) {
            reverseMapping[userKey] = excelHeader;
        }

        const usernameColumn = reverseMapping.username || 'Identifiant';
        const updatedData = data.filter(row => row[usernameColumn] !== username);

        if (updatedData.length === data.length) {
            throw new Error(`Utilisateur ${username} non trouvé`);
        }

        const newWb = XLSX.utils.book_new();
        const newWs = XLSX.utils.json_to_sheet(updatedData);
        XLSX.utils.book_append_sheet(newWb, newWs, sheetName);
        XLSX.writeFile(newWb, finalPath);

        invalidateCache();

        console.log(`✅ Utilisateur ${username} supprimé d'Excel`);
        return { success: true, message: 'Supprimé avec succès' };

    } catch (error) {
        console.error('❌ Erreur suppression Excel:', error.message);
        return { success: false, error: `Erreur suppression Excel: ${error.message}` };
    }
}

/**
 * Invalide les caches en mémoire et fichier
 */
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