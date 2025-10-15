// electron/ipcHandlers.js - VERSION FINALE, COMPLÈTE ET CORRIGÉE

const { ipcMain, dialog } = require('electron');

// Imports de tous les services nécessaires, avec les chemins corrects
const configService = require('./services/configService');
const rdsService = require('./services/rdsService');
const adService = require('./services/adService');
const excelService = require('./services/excelService');
const dataService = require('./services/dataService');
const notificationService = require('./services/notificationService');
const sessionState = require('./services/sessionState');
const accessoriesService = require('./services/accessoriesService');
const chatService = require('./services/chatService');
const fileService = require('./services/fileService');
const technicianService = require('./services/technicianService');
const utils = require('./services/utils');

function setupIpcHandlers(mainWindowProvider) {
    console.log('Configuration des handlers IPC...');

    // === AUTHENTIFICATION & CONFIGURATION ===
    ipcMain.handle('login-attempt', async (event, password, techId) => {
        const hashAttempt = require('crypto').createHash('sha256').update(password).digest('hex');
        const validHash = configService.appConfig.appPasswordHash;
        
        if (hashAttempt === validHash) {
            const tech = configService.appConfig.it_technicians?.find(t => t.id === techId);
            if (tech) {
                sessionState.setCurrentTechnician(tech);
                return { success: true, technician: tech };
            }
        }
        return { success: false };
    });

    ipcMain.handle('logout-technician', async (event, id) => {
        const tech = sessionState.getCurrentTechnician();
        if (tech && tech.id === id) {
            sessionState.clearCurrentTechnician();
            return { success: true };
        }
        return { success: false };
    });

    ipcMain.handle('register-technician-login', async (event, tech) => {
        sessionState.setCurrentTechnician(tech);
        return { success: true };
    });

    ipcMain.handle('get-config', () => configService.getConfig());
    
    ipcMain.handle('save-config', async (event, configData) => {
        return await configService.saveConfig(configData.newConfig, configData.newPassword);
    });

    ipcMain.handle('get-current-technician-session', () => {
        return sessionState.getCurrentTechnician();
    });

    // === TECHNICIENS ===
    ipcMain.handle('get-connected-technicians', () => {
        return technicianService.getConnectedTechnicians();
    });

    // === SESSIONS RDS ===
    ipcMain.handle('get-all-rds-sessions', () => rdsService.getRdsSessions());
    ipcMain.handle('shadow-session', (event, args) => rdsService.shadowSession(args.server, args.sessionId, args.useMultiMon));
    ipcMain.handle('disconnect-session', (event, args) => rdsService.disconnectSession(args.server, args.sessionId));
    ipcMain.handle('send-message', (event, args) => rdsService.sendMessage(args.server, args.sessionId, args.message));
    ipcMain.handle('quick-connect', (event, server) => rdsService.quickConnect(server));
    ipcMain.handle('connect-with-stored-credentials', (event, creds) => rdsService.connectWithCredentials(creds.server, creds.username, creds.password, false));

    // === GESTION DES PRÊTS (COMPUTERS & LOANS) ===
    ipcMain.handle('get-computers', () => dataService.getComputers());
    ipcMain.handle('save-computer', (event, computer) => dataService.saveComputer(computer, sessionState.getCurrentTechnician()));
    ipcMain.handle('delete-computer', (event, id) => dataService.deleteComputer(id, sessionState.getCurrentTechnician()));
    
    ipcMain.handle('get-loans', () => dataService.getLoans());
    ipcMain.handle('create-loan', (event, loan) => dataService.createLoan(loan, sessionState.getCurrentTechnician()));
    
    ipcMain.handle('return-loan', (event, id, returnNotes, accessoryInfo) => {
        return dataService.returnLoan(id, sessionState.getCurrentTechnician(), returnNotes, accessoryInfo);
    });
    
    ipcMain.handle('extend-loan', (event, id, newDate, reason) => dataService.extendLoan(id, newDate, reason, sessionState.getCurrentTechnician()));
    ipcMain.handle('cancel-loan', (event, id, reason) => dataService.cancelLoan(id, reason, sessionState.getCurrentTechnician()));
    ipcMain.handle('add-computer-maintenance', (event, computerId, maintenanceData) => dataService.addComputerMaintenance(computerId, maintenanceData, sessionState.getCurrentTechnician()));
    ipcMain.handle('get-loan-settings', () => dataService.getLoanSettings());
    ipcMain.handle('update-loan-settings', (event, settings) => dataService.updateLoanSettings(settings, sessionState.getCurrentTechnician()));
    ipcMain.handle('get-loan-history', (event, filters) => dataService.getLoanHistory(filters));
    ipcMain.handle('get-loan-statistics', () => dataService.getLoanStatistics());

    // --- CORRECTION : AJOUT DES HANDLERS MANQUANTS POUR LES ACCESSOIRES ---
    ipcMain.handle('get-accessories', () => accessoriesService.getAccessories());
    ipcMain.handle('save-accessory', (event, accessory) => accessoriesService.saveAccessory(accessory, sessionState.getCurrentTechnician()));
    ipcMain.handle('delete-accessory', (event, id) => accessoriesService.deleteAccessory(id, sessionState.getCurrentTechnician()));

    // === NOTIFICATIONS DE PRÊT ===
    ipcMain.handle('get-notifications', () => notificationService.getNotifications());
    ipcMain.handle('get-unread-notifications', () => notificationService.getUnreadNotifications());
    ipcMain.handle('mark-notification-as-read', (event, notificationId) => notificationService.markNotificationAsRead(notificationId));
    ipcMain.handle('mark-all-notifications-as-read', () => notificationService.markAllNotificationsAsRead());

    // === ACTIVE DIRECTORY (AD) ===
    ipcMain.handle('check-ad-module', () => adService.checkAdModule());
    ipcMain.handle('install-ad-module', () => adService.installAdModule());
    ipcMain.handle('search-ad-users', (event, term) => adService.searchAdUsers(term));
    ipcMain.handle('get-ad-group-members', (event, group) => adService.getAdGroupMembers(group));
    ipcMain.handle('add-user-to-group', (event, args) => adService.addUserToGroup(args));
    ipcMain.handle('remove-user-from-group', (event, args) => adService.removeUserFromGroup(args));
    ipcMain.handle('is-user-in-group', (event, args) => adService.isUserInGroup(args));
    ipcMain.handle('create-ad-user', (event, userData) => adService.createAdUser(userData));
    ipcMain.handle('modify-ad-user', (event, username, modifications) => adService.modifyAdUser(username, modifications));
    ipcMain.handle('disable-ad-user', (event, username) => adService.disableAdUser(username));
    ipcMain.handle('enable-ad-user', (event, username) => adService.enableAdUser(username));
    ipcMain.handle('reset-ad-user-password', (event, username, newPassword, mustChange) => adService.resetAdUserPassword(username, newPassword, mustChange));
    ipcMain.handle('get-ad-user-details', (event, username) => adService.getAdUserDetails(username));

    // === EXCEL ===
    ipcMain.handle('sync-excel-users', (event, path) => excelService.readExcelFileAsync(path));
    ipcMain.handle('save-user-to-excel', (event, args) => excelService.saveUserToExcel(args));
    ipcMain.handle('delete-user-from-excel', (event, args) => excelService.deleteUserFromExcel(args));

    // === HISTORIQUE & FAVORIS ===
    ipcMain.handle('get-history', () => fileService.getHistory());
    ipcMain.handle('save-history', (event, data) => fileService.saveHistory(data));
    ipcMain.handle('get-favorites', () => fileService.getFavorites());
    ipcMain.handle('save-favorites', (event, data) => fileService.saveFavorites(data));

    // === CHAT ===
    ipcMain.handle('chat:getChannels', () => chatService.getChannels());
    ipcMain.handle('chat:addChannel', (event, name, description) => chatService.addChannel(name, description, sessionState.getCurrentTechnician()));
    ipcMain.handle('chat:getMessages', (event, channelId) => chatService.getMessages(channelId));
    ipcMain.handle('chat:addMessage', (event, args) => chatService.addMessage(args.channelId, args.messageText, sessionState.getCurrentTechnician(), args.fileData));
    ipcMain.handle('chat:editMessage', (event, messageId, channelId, newText) => chatService.editMessage(messageId, channelId, newText, sessionState.getCurrentTechnician()));
    ipcMain.handle('chat:deleteMessage', (event, messageId, channelId) => chatService.deleteMessage(messageId, channelId, sessionState.getCurrentTechnician()));
    ipcMain.handle('chat:getDms', (event, otherUserId) => chatService.getDms(sessionState.getCurrentTechnician().id, otherUserId));
    ipcMain.handle('chat:addDm', (event, args) => chatService.addDm(sessionState.getCurrentTechnician(), args.toUserId, args.messageText, args.fileData));
    ipcMain.handle('chat:getUnreadCount', () => chatService.getUnreadCount(sessionState.getCurrentTechnician().id));
    ipcMain.handle('chat:markAsRead', (event, channelId) => chatService.markAsRead(channelId, sessionState.getCurrentTechnician().id));
    ipcMain.handle('chat:addReaction', (event, messageId, channelId, emoji) => chatService.addReaction(messageId, channelId, emoji, sessionState.getCurrentTechnician().id));

    // === SERVEURS ===
    ipcMain.handle('get-servers-info', () => dataService.getServers());
    ipcMain.handle('save-server-info', (event, serverInfo) => dataService.saveServerInfo(serverInfo, sessionState.getCurrentTechnician()));
    ipcMain.handle('ping-server', (event, serverName) => rdsService.pingServer(serverName));

    // === UTILITAIRES SYSTÈME ===
    ipcMain.handle('show-notification', (event, title, body) => {
        utils.showSystemNotification(title, body);
    });
    ipcMain.handle('show-save-dialog', (event, options) => {
        const { dialog } = require('electron');
        const mainWindow = mainWindowProvider();
        return dialog.showSaveDialog(mainWindow, options);
    });

    console.log('✅ Handlers IPC configurés avec succès.');
}

module.exports = { setupIpcHandlers };