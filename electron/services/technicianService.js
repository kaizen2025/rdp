// electron/services/technicianService.js - VERSION FINALE CORRIGÉE

const os = require('os');
const path = require('path');
const { safeReadJsonFile, safeWriteJsonFile } = require('./fileService');
const configService = require('./configService');
const { generateId } = require('./utils');
const sessionState = require('./sessionState');

function getPresencePath() {
    return configService.getSharedFilePath('technicians_presence.json');
}

async function getTechnicianPresenceData() {
    const presencePath = getPresencePath();
    if (!presencePath) return {};
    return await safeReadJsonFile(presencePath, {});
}

async function updateTechnicianPresence(technicianData) {
    const presencePath = getPresencePath();
    if (!presencePath) return { success: false, error: "Chemin de présence non configuré." };

    try {
        const presence = await getTechnicianPresenceData();
        const existingData = presence[technicianData.id] || {};

        // --- CORRECTION : Conserver le loginTime s'il existe déjà ---
        const loginTime = existingData.status === 'online' && existingData.loginTime 
            ? existingData.loginTime 
            : new Date().toISOString();

        presence[technicianData.id] = {
            ...technicianData, // Nouvelles données (nom, avatar, etc.)
            lastActivity: new Date().toISOString(),
            status: 'online',
            hostname: os.hostname(),
            loginTime: loginTime, // Appliquer la logique
        };
        await safeWriteJsonFile(presencePath, presence);
        return { success: true };
    } catch (error) {
        console.warn('Erreur mise à jour présence:', error);
        return { success: false, error: error.message };
    }
}

async function broadcastToTechnicians(eventType, data) {
    const notificationsPath = configService.getSharedFilePath('technician_notifications.json');
    if (!notificationsPath) return;

    try {
        const notifications = await safeReadJsonFile(notificationsPath, []);
        const currentTechnician = sessionState.getCurrentTechnician();
        const notification = {
            id: generateId(),
            type: eventType,
            data: data,
            timestamp: new Date().toISOString(),
            from: currentTechnician?.id || 'unknown',
            fromName: currentTechnician?.name || 'Inconnu'
        };
        notifications.unshift(notification);
        await safeWriteJsonFile(notificationsPath, notifications.slice(0, 50));
    } catch (error) {
        console.warn('Erreur broadcast techniciens:', error);
    }
}

async function registerTechnicianLogin(technician) {
    console.log(`✅ Technicien ${technician.name} enregistré.`);
    return await updateTechnicianPresence(technician);
}

async function logoutTechnician(technicianId) {
    const presence = await getTechnicianPresenceData();
    if (presence[technicianId]) {
        presence[technicianId].status = 'offline';
        presence[technicianId].lastSeen = new Date().toISOString();
        // Ne pas effacer loginTime pour le conserver si l'utilisateur revient
        const presencePath = getPresencePath();
        if(presencePath) await safeWriteJsonFile(presencePath, presence);
    }
    console.log(`✅ Technicien ${technicianId} déconnecté.`);
    return { success: true };
}

async function getConnectedTechnicians() {
    const presence = await getTechnicianPresenceData();
    const now = new Date();
    const online = [];
    Object.values(presence).forEach(data => {
        const lastSeen = new Date(data.lastActivity || 0);
        if (data.status === 'online' && (now - lastSeen) / (1000 * 60) < 10) {
            online.push(data);
        }
    });
    return online;
}

async function cleanupTechnicianPresence() {
    const technician = sessionState.getCurrentTechnician();
    if (technician) {
        await logoutTechnician(technician.id);
    }
}

module.exports = {
    broadcastToTechnicians,
    registerTechnicianLogin,
    logoutTechnician,
    getConnectedTechnicians,
    cleanupTechnicianPresence,
    updateTechnicianPresence,
};