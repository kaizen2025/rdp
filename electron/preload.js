<<<<<<< HEAD
// electron/preload.js - Script de préchargement sécurisé
=======
// electron/preload.js - VERSION AMÉLIORÉE
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea

const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
<<<<<<< HEAD
    // Vérifier les mises à jour
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // Obtenir la version de l'application
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

=======
    // Obtenir la version de l'application
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Vérifier les mises à jour
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
    // Listener pour les événements de mise à jour
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, ...args) => callback(...args)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, ...args) => callback(...args)),

<<<<<<< HEAD
=======
    // ✅ NOUVELLES FONCTIONS SPÉCIFIQUES
    launchShadow: (params) => ipcRenderer.invoke('launch-shadow', params),
    launchRdpConnect: (params) => ipcRenderer.invoke('launch-rdp-connect', params),

>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
    // Lance le client Bureau à Distance natif (mstsc.exe)
    launchRdp: (params) => ipcRenderer.invoke('launch-rdp', params),

    // Fonctions diverses (si vous en avez d'autres)
    pingServer: (server) => ipcRenderer.invoke('ping-server', server),
    quickConnect: (server) => ipcRenderer.invoke('quick-connect', server),
    connectWithStoredCredentials: (credentials) => ipcRenderer.invoke('connect-with-credentials', credentials),

    // Permet à React d'écouter les messages de log du processus principal
    onLogMessage: (callback) => ipcRenderer.on('log-message', (event, message) => callback(message)),
});