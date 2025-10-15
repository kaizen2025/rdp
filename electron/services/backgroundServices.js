// electron/services/backgroundServices.js - Version améliorée avec mode hors-ligne

const fs = require('fs');
const path = require('path');
const { safeReadJsonFile, safeWriteJsonFile, ensureDirectoryExists } = require('./fileService');
const configService = require('./configService');
const { readExcelFileAsync } = require('./excelService');
const dataService = require('./dataService');
const { updateTechnicianPresence, cleanupTechnicianPresence } = require('./technicianService');
const notificationService = require('./notificationService');
const sessionState = require('./sessionState');

// Référence à la fenêtre principale
let mainWindow = null;

// Tâches en cours
const runningTasks = new Set();

// Surveillance des fichiers
const fileWatchers = [];

// État de la connexion réseau
let isNetworkAvailable = true;
let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

/**
 * Wrapper pour empêcher une tâche de s'exécuter si elle est déjà en cours
 */
function preventConcurrent(taskName, taskFn) {
    return async function() {
        if (runningTasks.has(taskName)) {
            console.log(`⏭️  Tâche "${taskName}" déjà en cours, ignorée.`);
            return;
        }

        runningTasks.add(taskName);
        try {
            await taskFn();
        } catch (error) {
            console.warn(`⚠️  Erreur dans la tâche "${taskName}":`, error.message);
        } finally {
            runningTasks.delete(taskName);
        }
    };
}

/**
 * Vérifie la disponibilité du réseau
 */
const checkNetworkAvailability = preventConcurrent('checkNetworkAvailability', async () => {
    try {
        const computersDbPath = configService.appConfig.computersDbPath;
        if (!computersDbPath) {
            console.warn('⚠️  Chemin computersDbPath non configuré');
            return;
        }

        const baseDir = path.dirname(computersDbPath);
        const testFile = path.join(baseDir, 'computers_stock.json');

        // Tentative de lecture avec timeout court
        const data = await safeReadJsonFile(testFile, null, 2000);

        if (data !== null) {
            if (!isNetworkAvailable) {
                console.log('✅ Connexion réseau rétablie !');
                isNetworkAvailable = true;
                reconnectionAttempts = 0;
                
                // Notifier le frontend
                if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('network-status-changed', {
                        isOnline: true,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } else {
            throw new Error('Données non accessibles');
        }
    } catch (error) {
        if (isNetworkAvailable) {
            console.error('❌ Perte de connexion réseau détectée:', error.message);
            isNetworkAvailable = false;
            reconnectionAttempts = 0;
            
            // Notifier le frontend
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('network-status-changed', {
                    isOnline: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            reconnectionAttempts++;
            console.log(`🔄 Tentative de reconnexion ${reconnectionAttempts}/${MAX_RECONNECTION_ATTEMPTS}...`);
        }
    }
});

/**
 * Vérifie les prêts en retard et crée les notifications nécessaires
 */
const checkOverdueLoans = preventConcurrent('checkOverdueLoans', async () => {
    if (!isNetworkAvailable) {
        console.log('📴 Mode hors-ligne: vérification des prêts ignorée');
        return;
    }

    try {
        console.log('🔍 Vérification des prêts en retard...');
        const loans = await dataService.getLoans();
        const settings = await dataService.getLoanSettings();

        if (!settings.autoNotifications) {
            console.log('🔵 Notifications automatiques désactivées');
            return;
        }

        const notifications = await notificationService.checkAllLoansForNotifications(loans, settings);
        
        if (notifications.length > 0) {
            console.log(`📢 ${notifications.length} notification(s) de prêt créée(s).`);
            
            // Sauvegarder
            const loanData = { loans, settings };
            await dataService.saveLoanData(loanData, null);
            
            // Notifier le frontend
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('data-updated', { 
                    type: 'loans-notifications',
                    file: 'loan_notifications.json',
                    count: notifications.length,
                    timestamp: new Date().toISOString()
                });
            }
        }
    } catch (error) {
        console.warn('❌ Erreur vérification prêts:', error.message);
        isNetworkAvailable = false;
    }
});

/**
 * Nettoie les anciennes notifications
 */
const cleanOldNotifications = preventConcurrent('cleanOldNotifications', async () => {
    if (!isNetworkAvailable) return;
    
    try {
        await notificationService.cleanOldNotifications(90);
    } catch (error) {
        console.warn('❌ Erreur nettoyage notifications:', error.message);
    }
});

/**
 * Synchronise les données Excel
 */
const syncExcelData = preventConcurrent('syncExcelData', async () => {
    if (!isNetworkAvailable) {
        console.log('📴 Mode hors-ligne: synchronisation Excel ignorée');
        return;
    }

    try {
        const excelPath = configService.appConfig.defaultExcelPath;
        if (!excelPath) return;

        await readExcelFileAsync(excelPath);
        console.log('✅ Synchronisation Excel terminée');
    } catch (error) {
        console.warn('❌ Erreur synchronisation Excel:', error.message);
    }
});

/**
 * Met à jour la présence du technicien
 */
const updatePresence = preventConcurrent('updatePresence', async () => {
    const technician = sessionState.getCurrentTechnician();
    if (technician) {
        try {
            await updateTechnicianPresence(technician);
        } catch (error) {
            console.warn('❌ Erreur mise à jour présence:', error.message);
        }
    }
});

/**
 * Démarre la surveillance des fichiers
 */
function startFileWatcher() {
    if (!mainWindow || !mainWindow.webContents) {
        console.warn('⚠️  Fenêtre principale non disponible pour la surveillance.');
        return;
    }

    const computersDbPath = configService.appConfig.computersDbPath;
    if (!computersDbPath) {
        console.error('❌ Le chemin "computersDbPath" n\'est pas configuré.');
        return;
    }

    const baseDir = path.dirname(computersDbPath);
    
    const filesToWatch = [
        { path: path.join(baseDir, 'computers_stock.json'), name: 'Stock ordinateurs' },
        { path: path.join(baseDir, 'loans.json'), name: 'Prêts' },
        { path: path.join(baseDir, 'loan_notifications.json'), name: 'Notifications' },
        { path: path.join(baseDir, 'chat.json'), name: 'Chat' },
        { path: path.join(baseDir, 'technicians_presence.json'), name: 'Présence techniciens' }
    ];

    console.log('👁️  Mise en place de la surveillance en temps réel...\n');

    filesToWatch.forEach(({ path: filePath, name }) => {
        try {
            if (!fs.existsSync(filePath)) {
                console.log(`  ⚠️  ${name} n'existe pas encore: ${path.basename(filePath)}`);
                return;
            }

            const watcher = fs.watch(filePath, { persistent: true }, (eventType, filename) => {
                if (eventType === 'change') {
                    console.log(`\n📄 [${new Date().toLocaleTimeString()}] Fichier modifié: ${name}`);
                    
                    if (mainWindow && mainWindow.webContents) {
                        mainWindow.webContents.send('data-updated', {
                            file: path.basename(filePath),
                            name: name,
                            timestamp: new Date().toISOString()
                        });
                        console.log(`  ↗️  Signal envoyé au frontend pour ${path.basename(filePath)}`);
                    }
                }
            });

            watcher.on('error', (error) => { 
                console.error(`❌ Erreur surveillance ${name}:`, error.message); 
            });
            
            fileWatchers.push({ watcher, name, path: filePath });
            console.log(`  ✅ Surveillance active: ${name}`);
            
        } catch (error) {
            console.error(`❌ Impossible de surveiller ${name}:`, error.message);
        }
    });

    console.log(`\n📡 ${fileWatchers.length} fichier(s) sous surveillance.\n`);
}

/**
 * Arrête la surveillance des fichiers
 */
function stopFileWatcher() {
    console.log('🛑 Arrêt de la surveillance des fichiers...');
    fileWatchers.forEach(({ watcher, name }) => {
        try { 
            watcher.close(); 
            console.log(`  ✅ Surveillance arrêtée: ${name}`); 
        } 
        catch (error) { 
            console.warn(`  ⚠️  Erreur arrêt surveillance ${name}:`, error.message); 
        }
    });
    fileWatchers.length = 0;
    console.log('✅ Surveillance arrêtée.');
}

/**
 * Vérification de l'intégrité des fichiers
 */
const checkDataIntegrity = preventConcurrent('checkDataIntegrity', async () => {
    if (!isNetworkAvailable) return;
    
    try {
        console.log('🔍 Vérification de l\'intégrité des données...');
        const computersDbPath = configService.appConfig.computersDbPath;
        if (!computersDbPath) return;
        
        const baseDir = path.dirname(computersDbPath);
        const criticalFiles = ['computers_stock.json', 'loans.json', 'loan_notifications.json'];
        let hasIssues = false;
        
        for (const fileName of criticalFiles) {
            const filePath = path.join(baseDir, fileName);
            if (!fs.existsSync(filePath)) {
                console.warn(`  ⚠️  Fichier manquant: ${fileName}`);
                hasIssues = true;
                const defaultData = fileName === 'computers_stock.json' 
                    ? { computers: [], maintenanceRecords: [] } 
                    : fileName === 'loans.json' 
                    ? { loans: [], settings: {} } 
                    : { notifications: [] };
                await safeWriteJsonFile(filePath, defaultData);
                console.log(`  ✅ Fichier créé avec structure par défaut: ${fileName}`);
            } else {
                try {
                    const data = await safeReadJsonFile(filePath, null);
                    if (data === null) { 
                        console.warn(`  ⚠️  JSON invalide: ${fileName}`); 
                        hasIssues = true; 
                    }
                } catch (error) { 
                    console.warn(`  ❌ Erreur lecture ${fileName}:`, error.message); 
                    hasIssues = true; 
                }
            }
        }
        
        if (!hasIssues) console.log('✅ Intégrité des données vérifiée.');
        else console.log('⚠️  Problèmes d\'intégrité détectés et corrigés.');
    } catch (error) {
        console.warn('❌ Erreur vérification intégrité:', error.message);
    }
});

/**
 * Fonction principale d'initialisation
 */
async function initializeBackgroundServices(mainWindowProvider) {
    try {
        console.log('\n╔═══════════════════════════════════════════════════════╗');
        console.log('🚀 INITIALISATION DES SERVICES D\'ARRIÈRE-PLAN');
        console.log('╚═══════════════════════════════════════════════════════╝\n');

        mainWindow = mainWindowProvider();
        if (!mainWindow) { 
            console.error('❌ Fenêtre principale non disponible !'); 
            return; 
        }

        // Vérifier immédiatement la disponibilité réseau
        await checkNetworkAvailability();

        if (!isNetworkAvailable) {
            console.warn('⚠️  Mode hors-ligne détecté au démarrage');
            console.warn('⚠️  Certains services seront désactivés');
        }

        // Démarrer la surveillance des fichiers
        startFileWatcher();

        // Vérifier l'intégrité des données
        await checkDataIntegrity();

        // Mettre à jour la présence du technicien
        await updatePresence();

        // Planifier les tâches périodiques
        const intervals = {
            networkCheck: setInterval(checkNetworkAvailability, 30000), // Toutes les 30 secondes
            overdue: setInterval(checkOverdueLoans, 600000), // Toutes les 10 minutes
            cleanup: setInterval(cleanOldNotifications, 86400000), // Toutes les 24 heures
            excel: setInterval(syncExcelData, 1800000), // Toutes les 30 minutes
            presence: setInterval(updatePresence, 60000), // Toutes les minutes
        };

        console.log('\n✅ Services d\'arrière-plan initialisés avec succès');
        console.log('   - Surveillance fichiers: ACTIF');
        console.log('   - Vérification réseau: Toutes les 30s');
        console.log('   - Vérification prêts: Toutes les 10min');
        console.log('   - Nettoyage notifications: Quotidien');
        console.log('   - Sync Excel: Toutes les 30min');
        console.log('   - Mise à jour présence: Toutes les 1min\n');

        return intervals;

    } catch (error) {
        console.error('❌ ERREUR CRITIQUE initialisation services:', error.message, error.stack);
    }
}

module.exports = {
    initializeBackgroundServices,
    stopFileWatcher,
    checkNetworkAvailability,
    isNetworkAvailable: () => isNetworkAvailable,
};