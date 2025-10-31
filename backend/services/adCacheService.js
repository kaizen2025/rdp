// backend/services/adCacheService.js - NOUVEAU FICHIER

const db = require('./databaseService');
const adService = require('./adService');
const userService = require('./userService');

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let isRunning = false;

/**
 * Met à jour le statut AD (activé/désactivé) pour tous les utilisateurs
 * présents dans la base de données locale (synchronisée depuis Excel).
 */
async function updateUserAdStatuses() {
    if (isRunning) {
        console.log('[AD Cache] La mise à jour des statuts AD est déjà en cours.');
        return;
    }
    isRunning = true;
    console.log('[AD Cache] 🔄 Démarrage de la mise à jour des statuts AD...');

    try {
        const { users } = await userService.getUsers();
        if (!users || users.length === 0) {
            console.log('[AD Cache] Aucun utilisateur local à vérifier.');
            isRunning = false;
            return;
        }

        console.log(`[AD Cache] Vérification du statut de ${users.length} utilisateur(s)...`);
        
        // On traite les utilisateurs par lots pour ne pas surcharger AD
        const batchSize = 20;
        let updatedCount = 0;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            const promises = batch.map(async (user) => {
                try {
                    const adDetails = await adService.getAdUserDetails(user.username);
                    if (adDetails.success) {
                        return { username: user.username, adEnabled: adDetails.user.enabled ? 1 : 0 };
                    }
                } catch (error) {
                    console.warn(`[AD Cache] Impossible de vérifier ${user.username}: ${error.message}`);
                }
                return null; // En cas d'erreur, on ne met pas à jour
            });

            const results = (await Promise.all(promises)).filter(Boolean);

            if (results.length > 0) {
                const transaction = db.transaction(() => {
                    const stmt = db.prepare('UPDATE users SET adEnabled = ? WHERE username = ?');
                    for (const { username, adEnabled } of results) {
                        stmt.run(adEnabled, username);
                    }
                });
                transaction();
                updatedCount += results.length;
            }
        }
        
        console.log(`[AD Cache] ✅ ${updatedCount} statuts AD mis à jour dans la base de données.`);

    } catch (error) {
        console.error('[AD Cache] ❌ Erreur critique lors de la mise à jour des statuts AD:', error);
    } finally {
        isRunning = false;
    }
}

/**
 * Démarre la tâche de fond pour la mise à jour périodique des statuts.
 */
function start() {
    console.log(`[AD Cache] Le service de cache AD est démarré. Mise à jour toutes les ${CACHE_TTL / 60000} minutes.`);
    // Lancer une première fois au démarrage après un court délai
    setTimeout(updateUserAdStatuses, 10000);
    // Puis lancer périodiquement
    setInterval(updateUserAdStatuses, CACHE_TTL);
}

module.exports = {
    start,
    updateUserAdStatuses,
};