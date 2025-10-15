// electron/services/notificationService.js - Gestion des notifications de prêts

const path = require('path');
const { safeReadJsonFile, safeWriteJsonFile } = require('./fileService');
const configService = require('./configService');
const { generateId, showSystemNotification } = require('./utils');

const NOTIFICATION_TYPES = {
    REMINDER_BEFORE: 'reminder_before',   // Rappel avant échéance
    OVERDUE: 'overdue',                   // En retard
    CRITICAL: 'critical',                 // Retard critique
    RETURNED: 'returned',                 // Retourné
    EXTENDED: 'extended',                 // Prolongé
};

const NETWORK_NOTIFICATIONS_PATH = "\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\loan_notifications.json";
const LOCAL_NOTIFICATIONS_PATH = path.join(configService.userDataPath, 'cache-notifications.json');

/**
 * Charge les notifications
 */
async function getNotifications() {
    try {
        const data = await safeReadJsonFile(NETWORK_NOTIFICATIONS_PATH, null, 2000);
        if (data) {
            await safeWriteJsonFile(LOCAL_NOTIFICATIONS_PATH, data);
            return data;
        }
        return await safeReadJsonFile(LOCAL_NOTIFICATIONS_PATH, { notifications: [] });
    } catch (error) {
        return await safeReadJsonFile(LOCAL_NOTIFICATIONS_PATH, { notifications: [] });
    }
}

/**
 * Sauvegarde les notifications
 */
async function saveNotifications(data) {
    await safeWriteJsonFile(LOCAL_NOTIFICATIONS_PATH, data);
    return await safeWriteJsonFile(NETWORK_NOTIFICATIONS_PATH, data);
}

/**
 * Crée une notification de prêt
 */
async function createLoanNotification(loan, type, details = {}) {
    const data = await getNotifications();
    
    const notification = {
        id: generateId(),
        loanId: loan.id,
        computerId: loan.computerId,
        computerName: loan.computerName,
        userName: loan.userName,
        userDisplayName: loan.userDisplayName,
        type,
        date: new Date().toISOString(),
        read: false,
        details: {
            ...details,
            expectedReturnDate: loan.expectedReturnDate,
            loanDate: loan.loanDate,
            itStaff: loan.itStaff,
        },
    };

    data.notifications.unshift(notification);
    
    // Garder seulement les 500 dernières notifications
    if (data.notifications.length > 500) {
        data.notifications = data.notifications.slice(0, 500);
    }

    await saveNotifications(data);

    // Afficher notification système si configuré
    if (configService.appConfig?.notifications?.enabled) {
        const message = getNotificationMessage(notification);
        showSystemNotification('Gestion des Prêts', message, type);
    }

    return notification;
}

/**
 * Génère le message de notification
 */
function getNotificationMessage(notification) {
    const { computerName, userName, type, details } = notification;
    
    switch (type) {
        case NOTIFICATION_TYPES.REMINDER_BEFORE:
            return `Rappel : ${computerName} prêté à ${userName} doit être retourné le ${new Date(details.expectedReturnDate).toLocaleDateString()}`;
        
        case NOTIFICATION_TYPES.OVERDUE:
            return `⚠️ En retard : ${computerName} prêté à ${userName} devait être retourné le ${new Date(details.expectedReturnDate).toLocaleDateString()}`;
        
        case NOTIFICATION_TYPES.CRITICAL:
            return `🚨 CRITIQUE : ${computerName} prêté à ${userName} est en retard de plus de 7 jours !`;
        
        case NOTIFICATION_TYPES.RETURNED:
            return `✅ Retourné : ${computerName} a été retourné par ${userName}`;
        
        case NOTIFICATION_TYPES.EXTENDED:
            return `🔄 Prolongé : ${computerName} prêté à ${userName} a été prolongé jusqu'au ${new Date(details.newReturnDate).toLocaleDateString()}`;
        
        default:
            return `Notification de prêt pour ${computerName}`;
    }
}

/**
 * Marque une notification comme lue
 */
async function markNotificationAsRead(notificationId) {
    const data = await getNotifications();
    const notification = data.notifications.find(n => n.id === notificationId);
    
    if (notification) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        await saveNotifications(data);
    }
    
    return { success: true };
}

/**
 * Marque toutes les notifications comme lues
 */
async function markAllNotificationsAsRead() {
    const data = await getNotifications();
    const now = new Date().toISOString();
    
    data.notifications.forEach(n => {
        n.read = true;
        n.readAt = now;
    });
    
    await saveNotifications(data);
    return { success: true };
}

/**
 * Supprime les anciennes notifications
 */
async function cleanOldNotifications(daysToKeep = 90) {
    const data = await getNotifications();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    data.notifications = data.notifications.filter(n => 
        new Date(n.date) >= cutoffDate
    );
    
    await saveNotifications(data);
    return { success: true, removed: data.notifications.length };
}

/**
 * Récupère les notifications non lues
 */
async function getUnreadNotifications() {
    const data = await getNotifications();
    return data.notifications.filter(n => !n.read);
}

/**
 * Vérifie tous les prêts et crée les notifications nécessaires
 * Cette fonction doit être appelée périodiquement par backgroundServices
 */
async function checkAllLoansForNotifications(loans, settings) {
    const now = new Date();
    const notificationsCreated = [];

    for (const loan of loans) {
        // Ignorer les prêts terminés
        if (loan.status === 'returned' || loan.status === 'cancelled') {
            continue;
        }

        const expectedReturn = new Date(loan.expectedReturnDate);
        const daysUntilReturn = Math.ceil((expectedReturn - now) / (1000 * 60 * 60 * 24));
        const daysOverdue = -daysUntilReturn;

        // Vérifier si une notification a déjà été envoyée pour cette situation
        const notificationKey = `${loan.id}_${daysUntilReturn}`;
        if (loan.notificationsSent && loan.notificationsSent.includes(notificationKey)) {
            continue;
        }

        let notificationType = null;
        let shouldNotify = false;

        // Rappels avant échéance
        if (daysUntilReturn > 0 && settings.reminderDaysBefore.includes(daysUntilReturn)) {
            notificationType = NOTIFICATION_TYPES.REMINDER_BEFORE;
            shouldNotify = true;
        }
        // En retard
        else if (daysOverdue > 0) {
            if (daysOverdue >= 7) {
                notificationType = NOTIFICATION_TYPES.CRITICAL;
                // Notifications critiques répétées
                if (settings.overdueReminderDays.includes(daysOverdue)) {
                    shouldNotify = true;
                }
            } else if (settings.overdueReminderDays.includes(daysOverdue)) {
                notificationType = NOTIFICATION_TYPES.OVERDUE;
                shouldNotify = true;
            }
        }

        if (shouldNotify && notificationType) {
            const notification = await createLoanNotification(loan, notificationType, {
                daysUntilReturn,
                daysOverdue: Math.max(0, daysOverdue),
            });
            
            // Marquer la notification comme envoyée
            if (!loan.notificationsSent) {
                loan.notificationsSent = [];
            }
            loan.notificationsSent.push(notificationKey);
            
            notificationsCreated.push(notification);
        }
    }

    return notificationsCreated;
}

module.exports = {
    createLoanNotification,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    cleanOldNotifications,
    getUnreadNotifications,
    checkAllLoansForNotifications,
    NOTIFICATION_TYPES,
};