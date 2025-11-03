// backend/services/accessoriesService.js - VERSION FINALE REFACTORISÉE POUR SQLITE

const db = require('./databaseService');
const { generateId } = require('./utils');

/**
 * Charge la liste de tous les accessoires depuis la base de données.
 * @returns {Promise<Array<object>>} La liste des accessoires.
 */
async function getAccessories() {
    try {
        // La colonne 'active' est un INTEGER (1 ou 0), on la convertit en booléen pour le frontend.
        const rows = db.all('SELECT id, name, icon, active, createdAt, createdBy, modifiedAt, modifiedBy FROM accessories ORDER BY name ASC');
        return rows.map(row => ({
            ...row,
            active: !!row.active, // Convertit 1 en true, 0 en false
        }));
    } catch (error) {
        console.error('Erreur lors du chargement des accessoires depuis la DB:', error);
        return []; // Retourne un tableau vide en cas d'erreur
    }
}

/**
 * Sauvegarde un accessoire (création ou mise à jour) dans la base de données.
 * @param {object} accessory - L'objet accessoire à sauvegarder.
 * @param {object} technician - Le technicien effectuant l'action.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function saveAccessory(accessory, technician) {
    const now = new Date().toISOString();
    const isUpdate = !!accessory.id;

    try {
        if (isUpdate) {
            // Mise à jour d'un accessoire existant
            const sql = `UPDATE accessories SET name = ?, icon = ?, active = ?, modifiedAt = ?, modifiedBy = ? WHERE id = ?`;
            db.run(sql, [
                accessory.name,
                accessory.icon,
                accessory.active ? 1 : 0,
                now,
                technician?.name || 'Unknown',
                accessory.id
            ]);
        } else {
            // Création d'un nouvel accessoire
            const id = `acc_${Date.now()}`;
            const sql = `INSERT INTO accessories (id, name, icon, active, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(sql, [
                id,
                accessory.name,
                accessory.icon,
                1, // Par défaut, un nouvel accessoire est actif
                now,
                technician?.name || 'Unknown'
            ]);
        }
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'accessoire:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return { success: false, error: `Un accessoire avec le nom "${accessory.name}" existe déjà.` };
        }
        return { success: false, error: error.message };
    }
}

/**
 * Supprime un accessoire de la base de données.
 * @param {string} accessoryId - L'ID de l'accessoire à supprimer.
 * @param {object} technician - Le technicien effectuant l'action.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteAccessory(accessoryId, technician) {
    try {
        const result = db.run('DELETE FROM accessories WHERE id = ?', [accessoryId]);
        if (result.changes === 0) {
            return { success: false, error: 'Accessoire non trouvé.' };
        }
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'accessoire:', error);
        return { success: false, error: error.message };
    }
}


module.exports = {
    getAccessories,
    saveAccessory,
    deleteAccessory,
};