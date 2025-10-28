// backend/services/configService.js - VERSION FINALE SANS VÉRIFICATION GUACAMOLE

const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'config.json');
const TEMPLATE_CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'config.template.json');

let appConfig = null;
let isConfigValid = false;

/**
 * Normalise la configuration en mémoire pour assurer la rétrocompatibilité.
 * Si 'defaultExcelPath' existe, sa valeur est copiée dans 'excelFilePath'.
 * @param {object} config - L'objet de configuration.
 */
function normalizeConfig(config) {
    if (config.defaultExcelPath && !config.excelFilePath) {
        console.log("🔧 Clé de configuration obsolète 'defaultExcelPath' détectée. Utilisation de sa valeur pour 'excelFilePath'.");
        config.excelFilePath = config.defaultExcelPath;
    }
    // La section guacamole est supprimée, donc plus besoin de normalisation ici.
}

/**
 * Valide que les clés essentielles sont présentes et non des placeholders.
 * @param {object} config - L'objet de configuration.
 * @returns {{isValid: boolean, errors: string[]}}
 */
function validateConfig(config) {
    const errors = [];
    const requiredKeys = {
        'databasePath': 'Le chemin vers la base de données SQLite.',
        'excelFilePath': 'Le chemin vers le fichier Excel des utilisateurs (ou defaultExcelPath).',
        // --- SUPPRESSION DES VÉRIFICATIONS GUACAMOLE ---
        // 'guacamole.url': 'L\'URL de votre serveur Guacamole.',
        // 'guacamole.secretKey': 'La clé secrète pour l\'authentification Guacamole.',
    };

    for (const [key, description] of Object.entries(requiredKeys)) {
        const value = key.split('.').reduce((o, i) => o?.[i], config);
        if (!value) {
            errors.push(`Clé manquante: '${key}'. Description: ${description}`);
        } else if (typeof value === 'string' && (value.includes('VOTRE_') || value.includes('CHEMIN\\VERS'))) {
            errors.push(`Valeur placeholder détectée pour '${key}'. Veuillez la remplacer.`);
        }
    }
    return { isValid: errors.length === 0, errors };
}

async function loadConfigAsync() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        appConfig = JSON.parse(data);
    } catch (error) {
        console.error(`⚠️ Impossible de lire config.json (${error.message}). Utilisation de la configuration template comme fallback.`);
        try {
            const templateData = await fs.readFile(TEMPLATE_CONFIG_PATH, 'utf-8');
            appConfig = JSON.parse(templateData);
        } catch (templateError) {
            throw new Error("ERREUR CRITIQUE: config.json et config.template.json sont tous deux illisibles.");
        }
        isConfigValid = false; // La template n'est jamais valide par défaut
        return;
    }

    normalizeConfig(appConfig);

    const { isValid, errors } = validateConfig(appConfig);
    isConfigValid = isValid;

    if (!isValid) {
        console.error("====================== ERREUR DE CONFIGURATION ======================");
        console.error("Le fichier de configuration est invalide. Le serveur démarre en mode dégradé.");
        errors.forEach(err => console.error(`- ${err}`));
        console.error("=====================================================================");
    } else {
        console.log("✅ Configuration chargée et validée avec succès.");
    }
}

function getConfig() {
    return appConfig || {};
}

function isConfigurationValid() {
    return isConfigValid;
}

async function saveConfig(newConfig) {
    try {
        await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 4), 'utf-8');
        appConfig = newConfig;
        normalizeConfig(appConfig); // Normaliser après sauvegarde aussi
        const { isValid, errors } = validateConfig(appConfig);
        isConfigValid = isValid;
        if (!isValid) {
            console.warn("Configuration sauvegardée, mais elle contient des erreurs:", errors);
        }
        return { success: true, message: "Configuration sauvegardée." };
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la configuration:', error);
        return { success: false, message: `Erreur: ${error.message}` };
    }
}

module.exports = {
    loadConfigAsync,
    getConfig,
    saveConfig,
    isConfigurationValid,
    get appConfig() {
        return appConfig;
    },
};