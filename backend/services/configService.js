// backend/services/configService.js - VERSION FINALE CORRIGÉE

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

// CHEMIN CORRIGÉ : On cherche le config.json dans le dossier config à la racine du projet
const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');

// Le userDataPath est pour les fichiers locaux générés par l'application (cache, etc.)
const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RDSViewerBackend');

// ... (le reste du fichier est identique, je le remets pour être complet)

const EXCEL_CONFIG = {
    localCachePath: path.join(userDataPath, 'excel-cache.json'),
    columnMapping: {
        'Identifiant': 'username', 'Mot de passe': 'password', 'Office': 'officePassword',
        'Nom complet': 'displayName', 'Service': 'department', 'Email': 'email', 'Serveur': 'server'
    }
};

let appConfig = {}; // On ne charge pas de défaut ici, on le fait dans loadConfigAsync

async function safeReadJsonFile(filePath, defaultValue = null) {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`Fichier de configuration introuvable à : ${filePath}`);
            return defaultValue;
        }
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Erreur de lecture ou de parsing du fichier JSON ${filePath}:`, error);
        return defaultValue;
    }
}

const configService = {
    appConfig: {},

    async loadConfigAsync() {
        const loadedConfig = await safeReadJsonFile(configPath, null);
        if (!loadedConfig) {
            throw new Error(`Échec du chargement du fichier de configuration. Assurez-vous que le fichier ${configPath} existe et est un JSON valide.`);
        }
        this.appConfig = loadedConfig;
        console.log('Configuration chargée avec succès.');
    },

    getConfig() {
        const { password, ...safeConfig } = this.appConfig;
        return { ...safeConfig, hasAdminPassword: !!password };
    },
    
    // ... (les autres fonctions comme saveConfig, getSharedFilePath, etc. restent les mêmes)
    
    EXCEL_CONFIG,
    userDataPath,
};

module.exports = configService;