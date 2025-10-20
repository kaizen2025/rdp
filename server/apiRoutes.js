// server/apiRoutes.js - VERSION FINALE AVEC LES BONS CHEMINS D'IMPORT

const express = require('express');

// --- IMPORTS DE TOUS VOS SERVICES BACKEND (CHEMINS CORRIGÉS VERS LE DOSSIER 'backend') ---
const configService = require('../backend/services/configService');
const dataService = require('../backend/services/dataService');
const adService = require('../backend/services/adService');
const excelService = require('../backend/services/excelService');
const accessoriesService = require('../backend/services/accessoriesService');
const chatService = require('../backend/services/chatService');
const notificationService = require('../backend/services/notificationService');
const technicianService = require('../backend/services/technicianService');
const rdsService = require('../backend/services/rdsService');

module.exports = (getBroadcast) => {
    const router = express.Router();

    const getCurrentTechnician = (req) => {
        const techId = req.headers['x-technician-id'];
        const tech = configService.appConfig.it_technicians.find(t => t.id === techId);
        return tech || configService.appConfig.it_technicians[0];
    };

    const asyncHandler = (fn) => (req, res, next) =>
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error(`❌ Erreur sur la route ${req.method} ${req.originalUrl}:`, error);
            res.status(500).json({ error: 'Erreur interne du serveur.', details: error.message });
        });

    // --- ROUTES DE CONFIGURATION & AUTHENTIFICATION ---
    router.get('/config', asyncHandler(async (req, res) => {
        res.json(configService.getConfig());
    }));

    // --- ROUTES TECHNICIENS ---
    router.get('/technicians/connected', asyncHandler(async (req, res) => {
        const technicians = await technicianService.getConnectedTechnicians();
        res.json(technicians);
    }));

    // NOUVELLE ROUTE
    router.post('/technicians/login', asyncHandler(async (req, res) => {
        const technician = req.body;
        const result = await technicianService.registerTechnicianLogin(technician);
        getBroadcast()({ type: 'data_updated', payload: { entity: 'technicians' } });
        res.json(result);
    }));

    // --- ROUTES ORDINATEURS (COMPUTERS) ---
    router.get('/computers', asyncHandler(async (req, res) => {
        const computers = await dataService.getComputers();
        res.json(computers);
    }));

    router.post('/computers', asyncHandler(async (req, res) => {
        const result = await dataService.saveComputer(req.body, getCurrentTechnician(req));
        getBroadcast()({ type: 'data_updated', payload: { entity: 'computers' } });
        res.status(201).json(result);
    }));

    router.put('/computers/:id', asyncHandler(async (req, res) => {
        const result = await dataService.saveComputer({ ...req.body, id: req.params.id }, getCurrentTechnician(req));
        getBroadcast()({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));

    router.delete('/computers/:id', asyncHandler(async (req, res) => {
        const result = await dataService.deleteComputer(req.params.id, getCurrentTechnician(req));
        getBroadcast()({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));

    router.post('/computers/:id/maintenance', asyncHandler(async (req, res) => {
        const result = await dataService.addComputerMaintenance(req.params.id, req.body, getCurrentTechnician(req));
        getBroadcast()({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));

    // --- ROUTES PRÊTS (LOANS) ---
    router.get('/loans', asyncHandler(async (req, res) => {
        const loans = await dataService.getLoans();
        res.json(loans);
    }));

    router.post('/loans', asyncHandler(async (req, res) => {
        const result = await dataService.createLoan(req.body, getCurrentTechnician(req));
        getBroadcast()({ type: 'data_updated', payload: { entity: 'loans' } });
        getBroadcast()({ type: 'data_updated', payload: { entity: 'computers' } });
        res.status(201).json(result);
    }));

    router.post('/loans/:id/return', asyncHandler(async (req, res) => {
        const { returnNotes, accessoryInfo } = req.body;
        const result = await dataService.returnLoan(req.params.id, getCurrentTechnician(req), returnNotes, accessoryInfo);
        getBroadcast()({ type: 'data_updated', payload: { entity: 'loans' } });
        getBroadcast()({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));

    router.post('/loans/:id/extend', asyncHandler(async (req, res) => {
        const { newReturnDate, reason } = req.body;
        const result = await dataService.extendLoan(req.params.id, newReturnDate, reason, getCurrentTechnician(req));
        getBroadcast()({ type: 'data_updated', payload: { entity: 'loans' } });
        res.json(result);
    }));

    router.post('/loans/:id/cancel', asyncHandler(async (req, res) => {
        const { reason } = req.body;
        const result = await dataService.cancelLoan(req.params.id, reason, getCurrentTechnician(req));
        getBroadcast()({ type: 'data_updated', payload: { entity: 'loans' } });
        getBroadcast()({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));

    router.get('/loans/history', asyncHandler(async (req, res) => {
        const history = await dataService.getLoanHistory(req.query);
        res.json(history);
    }));

    router.get('/loans/statistics', asyncHandler(async (req, res) => {
        const stats = await dataService.getLoanStatistics();
        res.json(stats);
    }));

    router.get('/loans/settings', asyncHandler(async (req, res) => {
        const settings = await dataService.getLoanSettings();
        res.json(settings);
    }));

    // --- ROUTES ACCESSOIRES ---
    router.get('/accessories', asyncHandler(async (req, res) => {
        const accessories = await accessoriesService.getAccessories();
        res.json(accessories);
    }));

    router.post('/accessories', asyncHandler(async (req, res) => {
        const result = await accessoriesService.saveAccessory(req.body, getCurrentTechnician(req));
        getBroadcast()({ type: 'data_updated', payload: { entity: 'accessories' } });
        res.status(201).json(result);
    }));

    router.delete('/accessories/:id', asyncHandler(async (req, res) => {
        const result = await accessoriesService.deleteAccessory(req.params.id, getCurrentTechnician(req));
        getBroadcast()({ type: 'data_updated', payload: { entity: 'accessories' } });
        res.json(result);
    }));

    // --- ROUTES NOTIFICATIONS DE PRÊT ---
    router.get('/notifications', asyncHandler(async (req, res) => {
        const notifications = await notificationService.getNotifications();
        res.json(notifications);
    }));

    router.get('/notifications/unread', asyncHandler(async (req, res) => {
        const notifications = await notificationService.getUnreadNotifications();
        res.json(notifications);
    }));

    router.post('/notifications/:id/mark-read', asyncHandler(async (req, res) => {
        const result = await notificationService.markNotificationAsRead(req.params.id);
        getBroadcast()({ type: 'data_updated', payload: { entity: 'notifications' } });
        res.json(result);
    }));

    router.post('/notifications/mark-all-read', asyncHandler(async (req, res) => {
        const result = await notificationService.markAllNotificationsAsRead();
        getBroadcast()({ type: 'data_updated', payload: { entity: 'notifications' } });
        res.json(result);
    }));

    // --- ROUTES ACTIVE DIRECTORY ---
    router.get('/ad/users/search/:term', asyncHandler(async (req, res) => {
        const users = await adService.searchAdUsers(req.params.term);
        res.json(users);
    }));

    router.get('/ad/groups/:groupName/members', asyncHandler(async (req, res) => {
        const members = await adService.getAdGroupMembers(req.params.groupName);
        res.json(members);
    }));

    router.post('/ad/groups/members', asyncHandler(async (req, res) => {
        const result = await adService.addUserToGroup(req.body);
        getBroadcast()({ type: 'data_updated', payload: { entity: 'ad_groups', group: req.body.groupName } });
        res.json(result);
    }));

    router.delete('/ad/groups/:groupName/members/:username', asyncHandler(async (req, res) => {
        const result = await adService.removeUserFromGroup(req.params);
        getBroadcast()({ type: 'data_updated', payload: { entity: 'ad_groups', group: req.params.groupName } });
        res.json(result);
    }));

    router.get('/ad/users/:username/details', asyncHandler(async (req, res) => {
        const details = await adService.getAdUserDetails(req.params.username);
        res.json(details);
    }));

    router.post('/ad/users/:username/enable', asyncHandler(async (req, res) => {
        const result = await adService.enableAdUser(req.params.username);
        res.json(result);
    }));

    router.post('/ad/users/:username/disable', asyncHandler(async (req, res) => {
        const result = await adService.disableAdUser(req.params.username);
        res.json(result);
    }));

    router.post('/ad/users/:username/reset-password', asyncHandler(async (req, res) => {
        const { newPassword, mustChange } = req.body;
        const result = await adService.resetAdUserPassword(req.params.username, newPassword, mustChange);
        res.json(result);
    }));

    // --- ROUTES UTILISATEURS EXCEL ---
    router.get('/excel/users', asyncHandler(async (req, res) => {
        const result = await excelService.readExcelFileAsync();
        res.json(result);
    }));

    router.post('/excel/users', asyncHandler(async (req, res) => {
        const result = await excelService.saveUserToExcel(req.body);
        getBroadcast()({ type: 'data_updated', payload: { entity: 'excel_users' } });
        res.json(result);
    }));

    router.delete('/excel/users/:username', asyncHandler(async (req, res) => {
        const result = await excelService.deleteUserFromExcel({ username: req.params.username });
        getBroadcast()({ type: 'data_updated', payload: { entity: 'excel_users' } });
        res.json(result);
    }));

    // --- ROUTES CHAT ---
    router.get('/chat/channels', asyncHandler(async (req, res) => {
        const channels = await chatService.getChannels();
        res.json(channels);
    }));

    router.get('/chat/messages/:channelId', asyncHandler(async (req, res) => {
        const messages = await chatService.getMessages(req.params.channelId);
        res.json(messages);
    }));

    router.post('/chat/messages', asyncHandler(async (req, res) => {
        const { channelId, messageText, fileData } = req.body;
        const result = await chatService.addMessage(channelId, messageText, getCurrentTechnician(req), fileData);
        getBroadcast()({ type: 'chat_message_new', payload: { channelId } });
        res.status(201).json(result);
    }));

    // --- ROUTES UTILITAIRES (Ex: Ping) ---
    router.get('/utils/ping/:server', asyncHandler(async (req, res) => {
        const result = await rdsService.pingServer(req.params.server);
        res.json(result);
    }));

    return router;
};