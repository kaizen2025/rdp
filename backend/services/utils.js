// backend/services/utils.js - VERSION FINALE SANS ELECTRON

const path = require('path');
// Note: L'import de fileService est nécessaire si addHistoryEntry est utilisé,
// sinon il peut être retiré. Pour l'instant, nous le gardons pour la complétude.
const { safeWriteJsonFile, safeReadJsonFile } = require('./fileService');
const { userDataPath, appConfig } = require('./configService');

// Le chemin de l'historique est maintenant défini ici, mais la fonctionnalité
// d'historique des connexions RDP (qui était liée à Electron) est de facto obsolète.
// On le garde au cas où une nouvelle forme d'historique serait implémentée.
const historyPath = path.join(userDataPath, 'history.json');

/**
 * Génère un identifiant unique simple basé sur le temps et une chaîne aléatoire.
 * @returns {string} Un ID unique.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Ajoute une entrée à un fichier d'historique local.
 * NOTE : Cette fonction est conservée mais son utilité est réduite sans les actions RDP d'Electron.
 * Elle pourrait être réutilisée pour un journal d'événements serveur.
 * @param {object} entry - L'objet à enregistrer.
 * @param {object} technician - Le technicien effectuant l'action.
 */
function addHistoryEntry(entry, technician) {
    // Exécuté de manière asynchrone pour ne pas bloquer le thread principal
    process.nextTick(async () => {
        try {
            const history = await safeReadJsonFile(historyPath, []);
            
            const newEntry = {
                ...entry,
                date: new Date().toLocaleDateString('fr-FR'),
                time: new Date().toLocaleTimeString('fr-FR'),
                technician: technician?.name || 'Système',
            };
            
            history.unshift(newEntry);

            const maxEntries = appConfig?.maxHistoryEntries || 500;
            await safeWriteJsonFile(historyPath, history.slice(0, maxEntries));
        } catch (error) {
            console.warn('Erreur lors de l\'écriture dans l\'historique:', error.message);
        }
    });
}

module.exports = {
    generateId,
    addHistoryEntry,
};