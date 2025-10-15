// electron/main.js - VERSION CORRIGÉE POUR BUILD PORTABLE

const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const configService = require('./services/configService');
const { setupIpcHandlers } = require('./ipcHandlers');
const { initializeBackgroundServices, cleanupTechnicianPresence } = require('./services/backgroundServices');
const sessionState = require('./services/sessionState');

const isDev = !app.isPackaged;
let mainWindow;

function createWindow() {
    try {
        console.log('Création de la fenêtre principale...');
        console.log('Mode:', isDev ? 'DÉVELOPPEMENT' : 'PRODUCTION');
        console.log('__dirname:', __dirname);

        // ✅ CORRECTION 1 : Chemin du preload adapté pour dev et prod
        let preloadPath;
        if (isDev) {
            // En dev: electron/main.js -> ../preload.js
            preloadPath = path.join(__dirname, '..', 'preload.js');
        } else {
            // En prod avec asar: resources/app.asar/electron -> ../preload.js
            preloadPath = path.join(__dirname, '..', 'preload.js');
        }

        console.log('Chemin preload:', preloadPath);

        // Vérification du preload en dev uniquement
        if (isDev && !fs.existsSync(preloadPath)) {
            console.error(`ERREUR: preload.js introuvable : ${preloadPath}`);
            app.quit();
            return;
        }

        const windowOptions = {
            width: 1600,
            height: 900,
            show: false,
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false,
                spellcheck: false,
                webSecurity: !isDev,
            }
        };

        if (isDev) {
            windowOptions.icon = path.join(__dirname, '..', 'assets', 'icon.ico');
        }

        mainWindow = new BrowserWindow(windowOptions);

        // ✅ CORRECTION 2 : URL correcte pour le mode production
        let appUrl;
        if (isDev) {
            appUrl = 'http://localhost:3000';
        } else {
            // En production, les fichiers React sont dans build/
            // __dirname = app.asar/electron
            // On remonte d'un niveau puis on entre dans build/
            const indexPath = path.join(__dirname, '..', 'build', 'index.html');
            appUrl = url.format({
                pathname: indexPath,
                protocol: 'file:',
                slashes: true
            });
        }

        console.log('Chargement de l\'URL:', appUrl);
        mainWindow.loadURL(appUrl);

        // ✅ CORRECTION 3 : DevTools uniquement en dev
        if (isDev) {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        }

        // ✅ CORRECTION 4 : Gestion des erreurs de chargement
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('ERREUR DE CHARGEMENT:', errorCode, errorDescription);
            console.error('URL tentée:', appUrl);
        });

        mainWindow.webContents.on('did-finish-load', () => {
            console.log('✅ Page chargée avec succès');
        });

        mainWindow.once('ready-to-show', () => {
            console.log('Fenêtre prête, affichage...');
            mainWindow.show();
        });

        mainWindow.on('closed', () => {
            mainWindow = null;
        });

        console.log('✅ Fenêtre principale configurée.');
        return mainWindow;

    } catch (error) {
        console.error('ERREUR CRITIQUE:', error.message, error.stack);
        app.quit();
    }
}

app.whenReady().then(async () => {
    console.log('\n=== DÉMARRAGE RDS VIEWER ANECOOP ===');
    console.log('Version:', app.getVersion());
    console.log('Mode:', isDev ? 'DÉVELOPPEMENT' : 'PRODUCTION');
    
    try {
        console.log('[1/4] Chargement de la configuration...');
        await configService.loadConfigAsync();

        console.log('[2/4] Configuration des communications IPC...');
        setupIpcHandlers(() => mainWindow);

        console.log('[3/4] Création de la fenêtre...');
        createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });

        if (mainWindow) {
            console.log('[4/4] Lancement des services d\'arrière-plan...');
            initializeBackgroundServices(() => mainWindow);
        }

        console.log('=== ✅ APPLICATION PRÊTE ===\n');

    } catch (error) {
        console.error('ERREUR CRITIQUE AU DÉMARRAGE:', error.message, error.stack);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', async () => {
    console.log('Fermeture de l\'application...');
    const technician = sessionState.getCurrentTechnician();
    if (technician) {
        await cleanupTechnicianPresence(technician);
    }
});

process.on('uncaughtException', (error) => {
    console.error('❌ ERREUR NON CAPTURÉE:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ PROMESSE REJETÉE:', reason);
});

console.log('✅ Electron main.js chargé.');