// electron/services/utils.js

const { Notification } = require('electron');
const path = require('path');
// No longer importing from fileService to break the circular dependency
const { safeWriteJsonFile, safeReadJsonFile } = require('./fileService');
const { userDataPath, appConfig } = require('./configService');

const historyPath = path.join(userDataPath, 'history.json');

// The ensureDirectoryExists function has been moved to fileService.js

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function showSystemNotification(title, message, type = 'info') {
    try {
        if (Notification.isSupported()) {
            new Notification({
                title,
                body: message,
                icon: path.join(__dirname, '..', '..', 'assets/icon.ico')
            }).show();
        }
        return { success: true };
    } catch (error) {
        console.warn('Erreur notification:', error.message);
        return { success: false };
    }
}

// The technician is now passed as an argument to ensure referential transparency
function addHistoryEntry(entry, technician) {
    process.nextTick(async () => {
        try {
            // These functions are now correctly imported without a circular dependency
            const history = await safeReadJsonFile(historyPath, []);
            entry.date = new Date().toLocaleDateString();
            entry.time = new Date().toLocaleTimeString();
            entry.technician = technician?.name || 'Inconnu';
            history.unshift(entry);

            const maxEntries = appConfig?.maxHistoryEntries || 500;
            await safeWriteJsonFile(historyPath, history.slice(0, maxEntries));
        } catch (error) {
            console.warn('Erreur ajout historique:', error.message);
        }
    });
}

module.exports = {
    generateId,
    showSystemNotification,
    addHistoryEntry,
};