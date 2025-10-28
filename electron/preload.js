// electron/preload.js - Script de préchargement sécurisé

const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Vérifier les mises à jour
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // Obtenir la version de l'application
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Listener pour les événements de mise à jour
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),

    // --- NOUVELLE FONCTION ---
    // Lance le client Bureau à Distance natif (mstsc.exe)
    launchRdp: (params) => ipcRenderer.invoke('launch-rdp', params),

    // ---- Fonctions que vous aviez dans d'autres fichiers mais qui doivent être ici ----
    // C'est la bonne pratique de centraliser tous les appels IPC
    pingServer: (server) => ipcRenderer.invoke('ping-server', server),
    quickConnect: (server) => ipcRenderer.invoke('quick-connect', server),
    connectWithStoredCredentials: (credentials) => ipcRenderer.invoke('connect-with-credentials', credentials),
});