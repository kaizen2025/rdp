// backend/services/utils.js - VERSION CORRIGÉE POUR ÉVITER LE CRASH AU DÉMARRAGE

const path = require('path');
const { safeWriteJsonFile, safeReadJsonFile } = require('./fileService');
const configService = require('./configService');

// Le chemin de l'historique sera maintenant défini dynamiquement à l'intérieur de la fonction addHistoryEntry,
// une fois que nous sommes certains que la configuration a été chargée.
let historyPath = null;

/**
 * Définit le chemin du fichier d'historique en se basant sur le répertoire de la base de données.
 * C'est plus cohérent et évite les erreurs si le chemin de la base de données change.
 */
function getHistoryPath() {
    if (!historyPath) {
        const dbPath = configService.getConfig().databasePath;
        if (dbPath) {
            // Place 'history.json' dans le même répertoire que la base de données.
            historyPath = path.join(path.dirname(dbPath), 'history.json');
        } else {
            // Solution de repli si le chemin de la base de données n'est pas défini.
            // Cela ne devrait pas arriver dans un fonctionnement normal.
            console.warn("Le chemin de la base de données n'est pas défini dans la configuration, l'historique sera désactivé.");
            return null;
        }
    }
    return historyPath;
}


/**
 * Génère un identifiant unique simple basé sur le temps et une chaîne aléatoire.
 * @returns {string} Un ID unique.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Ajoute une entrée à un fichier d'historique local.
 * La fonction est maintenant entièrement asynchrone et attend que la configuration soit prête.
 * @param {object} entry - L'objet à enregistrer.
 * @param {object} technician - Le technicien effectuant l'action.
 */
function addHistoryEntry(entry, technician) {
    process.nextTick(async () => {
        const currentHistoryPath = getHistoryPath();
        if (!currentHistoryPath) return; // Ne fait rien si le chemin n'a pas pu être déterminé.

        try {
            const history = await safeReadJsonFile(currentHistoryPath, []);
            
            const newEntry = {
                ...entry,
                date: new Date().toLocaleDateString('fr-FR'),
                time: new Date().toLocaleTimeString('fr-FR'),
                technician: technician?.name || 'Système',
            };
            
            history.unshift(newEntry);

            // La configuration est déjà chargée à ce stade, donc l'accès est sûr.
            const maxEntries = configService.getConfig().maxHistoryEntries || 500;
            await safeWriteJsonFile(currentHistoryPath, history.slice(0, maxEntries));
        } catch (error) {
            console.warn(`Erreur lors de l'écriture dans l'historique (${currentHistoryPath}):`, error.message);
        }
    });
}

module.exports = {
    generateId,
    addHistoryEntry,
};