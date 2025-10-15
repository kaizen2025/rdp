// electron/preload.js - Pont sécurisé entre le backend Electron et le frontend React

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // --- AUTH & CONFIGURATION ---
    loginAttempt: (password, techId) => ipcRenderer.invoke('login-attempt', password, techId),
    logoutTechnician: (id) => ipcRenderer.invoke('logout-technician', id),
    registerTechnicianLogin: (tech) => ipcRenderer.invoke('register-technician-login', tech),
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (args) => ipcRenderer.invoke('save-config', args),
    getCurrentTechnicianSession: () => ipcRenderer.invoke('get-current-technician-session'),

    // --- TECHNICIENS ---
    getConnectedTechnicians: () => ipcRenderer.invoke('get-connected-technicians'),

    // --- SESSIONS RDS ---
    getAllRdsSessions: () => ipcRenderer.invoke('get-all-rds-sessions'),
    shadowSession: (args) => ipcRenderer.invoke('shadow-session', args),
    disconnectSession: (args) => ipcRenderer.invoke('disconnect-session', args),
    sendMessage: (args) => ipcRenderer.invoke('send-message', args),
    quickConnect: (server) => ipcRenderer.invoke('quick-connect', server),
    connectWithStoredCredentials: (creds) => ipcRenderer.invoke('connect-with-stored-credentials', creds),

    // --- GESTION DES PRÊTS (COMPUTERS & LOANS) ---
    getComputers: () => ipcRenderer.invoke('get-computers'),
    saveComputer: (computer) => ipcRenderer.invoke('save-computer', computer),
    deleteComputer: (id) => ipcRenderer.invoke('delete-computer', id),
    getLoans: () => ipcRenderer.invoke('get-loans'),
    createLoan: (loan) => ipcRenderer.invoke('create-loan', loan),
    returnLoan: (id, notes) => ipcRenderer.invoke('return-loan', id, notes),
    extendLoan: (id, date, reason) => ipcRenderer.invoke('extend-loan', id, date, reason),
    cancelLoan: (id, reason) => ipcRenderer.invoke('cancel-loan', id, reason),
    addComputerMaintenance: (computerId, maintenanceData) => ipcRenderer.invoke('add-computer-maintenance', computerId, maintenanceData),
    getLoanSettings: () => ipcRenderer.invoke('get-loan-settings'),
    updateLoanSettings: (settings) => ipcRenderer.invoke('update-loan-settings', settings),
    getLoanHistory: (filters) => ipcRenderer.invoke('get-loan-history', filters),
    getLoanStatistics: () => ipcRenderer.invoke('get-loan-statistics'),

    // --- NOTIFICATIONS DE PRÊT ---
    getNotifications: () => ipcRenderer.invoke('get-notifications'),
    getUnreadNotifications: () => ipcRenderer.invoke('get-unread-notifications'),
    markNotificationAsRead: (notificationId) => ipcRenderer.invoke('mark-notification-as-read', notificationId),
    markAllNotificationsAsRead: () => ipcRenderer.invoke('mark-all-notifications-as-read'),

    // --- ACTIVE DIRECTORY (AD) ---
    checkAdModule: () => ipcRenderer.invoke('check-ad-module'),
    installAdModule: () => ipcRenderer.invoke('install-ad-module'),
    searchAdUsers: (term) => ipcRenderer.invoke('search-ad-users', term),
    getAdGroupMembers: (group) => ipcRenderer.invoke('get-ad-group-members', group),
    addUserToGroup: (args) => ipcRenderer.invoke('add-user-to-group', args),
    removeUserFromGroup: (args) => ipcRenderer.invoke('remove-user-from-group', args),
    isUserInGroup: (args) => ipcRenderer.invoke('is-user-in-group', args),
    testAdGroups: () => ipcRenderer.invoke('test-ad-groups'),
    discoverAdSecurityGroups: () => ipcRenderer.invoke('discover-ad-security-groups'),

    // --- EXCEL ---
    syncExcelUsers: (path) => ipcRenderer.invoke('sync-excel-users', path),
    saveUserToExcel: (args) => ipcRenderer.invoke('save-user-to-excel', args),
    deleteUserFromExcel: (args) => ipcRenderer.invoke('delete-user-from-excel', args),

    // --- HISTORIQUE & FAVORIS ---
    getHistory: () => ipcRenderer.invoke('get-history'),
    saveHistory: (data) => ipcRenderer.invoke('save-history', data),
    getFavorites: () => ipcRenderer.invoke('get-favorites'),
    saveFavorites: (data) => ipcRenderer.invoke('save-favorites', data),

    // --- CHAT AMÉLIORÉ ---
    'chat:getChannels': () => ipcRenderer.invoke('chat:getChannels'),
    'chat:addChannel': (name, description) => ipcRenderer.invoke('chat:addChannel', name, description),
    'chat:getMessages': (channelId) => ipcRenderer.invoke('chat:getMessages', channelId),
    'chat:addMessage': (args) => ipcRenderer.invoke('chat:addMessage', args),
    'chat:editMessage': (messageId, channelId, newText) => ipcRenderer.invoke('chat:editMessage', messageId, channelId, newText),
    'chat:deleteMessage': (messageId, channelId) => ipcRenderer.invoke('chat:deleteMessage', messageId, channelId),
    'chat:getDms': (otherUserId) => ipcRenderer.invoke('chat:getDms', otherUserId),
    'chat:addDm': (args) => ipcRenderer.invoke('chat:addDm', args),
    'chat:getUnreadCount': () => ipcRenderer.invoke('chat:getUnreadCount'),
    'chat:markAsRead': (channelId) => ipcRenderer.invoke('chat:markAsRead', channelId),

    // --- UTILITAIRES SYSTÈME ---
    pingServer: (server) => ipcRenderer.invoke('ping-server', server),
    openPath: (path) => ipcRenderer.invoke('open-path', path),
    showNotification: (title, message) => ipcRenderer.invoke('show-notification', title, message),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

    // --- ÉCOUTEUR POUR LES MISES À JOUR EN TEMPS RÉEL ---
    onDataUpdated: (callback) => {
        const listener = (event, ...args) => callback(...args);
        ipcRenderer.on('data-updated', listener);
        // Retourne une fonction pour se désabonner de l'événement
        return () => ipcRenderer.removeListener('data-updated', listener);
    },
    removeDataUpdatedListener: () => { // Gardé pour la compatibilité si l'ancien code l'utilise
        ipcRenderer.removeAllListeners('data-updated');
    },
});

console.log('✅ Preload script chargé.');