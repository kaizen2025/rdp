// electron/services/fileService.js - Version corrigée avec gestion de l'historique

const fs = require('fs');
const path = require('path');
const configService = require('./configService'); // Importer pour userDataPath

// --- Fonctions de base ---

async function ensureDirectoryExists(dirPath) {
    try {
        await fs.promises.access(dirPath);
    } catch {
        await fs.promises.mkdir(dirPath, { recursive: true });
    }
}

async function safeReadJsonFile(filePath, defaultValue = null) {
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn(`Erreur lecture ${path.basename(filePath)}:`, error.message);
        }
        return defaultValue;
    }
}

async function safeWriteJsonFile(filePath, data) {
    try {
        await ensureDirectoryExists(path.dirname(filePath));
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.warn(`Erreur écriture ${path.basename(filePath)}:`, error.message);
        return { success: false, error: error.message };
    }
}

// --- Fonctions spécifiques (Historique, Favoris) ---

const getHistory = () => {
    const historyPath = path.join(configService.userDataPath, 'history.json');
    return safeReadJsonFile(historyPath, []);
};

const saveHistory = (data) => {
    const historyPath = path.join(configService.userDataPath, 'history.json');
    return safeWriteJsonFile(historyPath, data);
};

const getFavorites = () => {
    const favoritesPath = path.join(configService.userDataPath, 'favorites.json');
    return safeReadJsonFile(favoritesPath, []);
};

const saveFavorites = (data) => {
    const favoritesPath = path.join(configService.userDataPath, 'favorites.json');
    return safeWriteJsonFile(favoritesPath, data);
};


module.exports = {
    safeReadJsonFile,
    safeWriteJsonFile,
    ensureDirectoryExists,
    getHistory,
    saveHistory,
    getFavorites,
    saveFavorites,
};