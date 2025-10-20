// electron/services/chatService.js - VERSION COMPLÈTE REFACTORISÉE POUR SQLITE

const db = require('./databaseService');
const { generateId } = require('./utils');

// Fonctions utilitaires pour gérer les champs JSON en base de données
const parseJSON = (field, defaultValue = null) => {
    if (field === null || field === undefined) return defaultValue;
    try { return JSON.parse(field) || defaultValue; } catch { return defaultValue; }
};
const stringifyJSON = (field) => {
    try { return JSON.stringify(field); } catch { return null; }
};

// --- CANAUX (CHANNELS) ---

/**
 * Récupère la liste de tous les canaux de discussion.
 * @returns {Promise<Array<object>>}
 */
async function getChannels() {
    try {
        return db.all('SELECT * FROM chat_channels ORDER BY name ASC');
    } catch (error) {
        console.error("Erreur getChannels:", error);
        return [];
    }
}

/**
 * Ajoute un nouveau canal de discussion.
 * @param {string} name - Le nom du canal.
 * @param {string} description - La description du canal.
 * @param {object} author - Le technicien qui crée le canal.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function addChannel(name, description, author) {
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!id) {
        return { success: false, error: "Le nom du canal est invalide." };
    }
    try {
        db.run('INSERT INTO chat_channels (id, name, description, createdAt, createdBy) VALUES (?, ?, ?, ?, ?)',
            [id, name, description || '', new Date().toISOString(), author?.id || 'unknown']);
        return { success: true };
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return { success: false, error: `Un canal avec le nom "${name}" ou l'ID "${id}" existe déjà.` };
        }
        console.error("Erreur addChannel:", error);
        return { success: false, error: error.message };
    }
}

// --- MESSAGES ---

/**
 * Génère une clé unique pour une conversation privée entre deux utilisateurs.
 * @param {string} userId1 
 * @param {string} userId2 
 * @returns {string} La clé de canal pour le DM.
 */
function getDmChannelKey(userId1, userId2) {
    // Trie les IDs pour que la clé soit toujours la même quel que soit l'expéditeur
    return `dm--${[userId1, userId2].sort().join('--')}`;
}

/**
 * Récupère les messages d'un canal public.
 * @param {string} channelId 
 * @returns {Promise<Array<object>>}
 */
async function getMessages(channelId) {
    try {
        const rows = db.all('SELECT * FROM chat_messages WHERE channelId = ? ORDER BY timestamp ASC', [channelId]);
        return rows.map(m => ({
            ...m,
            reactions: parseJSON(m.reactions, {}),
            file_info: parseJSON(m.file_info, null)
        }));
    } catch (error) {
        console.error("Erreur getMessages:", error);
        return [];
    }
}

/**
 * Récupère les messages d'une conversation privée.
 * @param {string} userId1 - ID du technicien actuel.
 * @param {string} userId2 - ID de l'autre technicien.
 * @returns {Promise<Array<object>>}
 */
async function getDms(userId1, userId2) {
    const channelId = getDmChannelKey(userId1, userId2);
    return getMessages(channelId); // La logique est la même, seul le channelId change
}

/**
 * Ajoute un message (public ou privé).
 * @param {string} channelId - L'ID du canal ou la clé du DM.
 * @param {string} messageText - Le contenu du message.
 * @param {object} author - Le technicien qui envoie le message.
 * @param {object|null} fileData - Les métadonnées d'un fichier joint.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function addMessage(channelId, messageText, author, fileData = null) {
    const id = generateId();
    const now = new Date().toISOString();
    try {
        db.run(
            'INSERT INTO chat_messages (id, channelId, authorId, authorName, authorAvatar, text, timestamp, file_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, channelId, author.id, author.name, author.avatar, messageText, now, fileData ? stringifyJSON(fileData) : null]
        );
        return { success: true };
    } catch (error) {
        console.error("Erreur addMessage:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Ajoute un message privé (DM).
 */
async function addDm(fromUser, toUserId, messageText, fileData = null) {
    const channelId = getDmChannelKey(fromUser.id, toUserId);
    return addMessage(channelId, messageText, fromUser, fileData);
}

async function editMessage(messageId, channelId, newText, author) {
    const message = db.get('SELECT authorId FROM chat_messages WHERE id = ? AND channelId = ?', [messageId, channelId]);
    if (!message) return { success: false, error: "Message introuvable." };
    if (message.authorId !== author.id) return { success: false, error: "Action non autorisée." };

    try {
        db.run('UPDATE chat_messages SET text = ?, reactions = json_set(reactions, "$.edited", "true") WHERE id = ?', [newText, messageId]);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deleteMessage(messageId, channelId, author) {
    const message = db.get('SELECT authorId FROM chat_messages WHERE id = ? AND channelId = ?', [messageId, channelId]);
    if (!message) return { success: false, error: "Message introuvable." };
    if (message.authorId !== author.id && !author.permissions?.includes('admin')) {
        return { success: false, error: "Action non autorisée." };
    }

    try {
        db.run('DELETE FROM chat_messages WHERE id = ?', [messageId]);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// --- RÉACTIONS ---

async function addReaction(messageId, channelId, emoji, userId) {
    try {
        const message = db.get('SELECT reactions FROM chat_messages WHERE id = ?', [messageId]);
        if (!message) return { success: false, error: "Message introuvable." };

        const reactions = parseJSON(message.reactions, {});
        if (!reactions[emoji]) {
            reactions[emoji] = [];
        }

        const userIndex = reactions[emoji].indexOf(userId);
        if (userIndex > -1) {
            // L'utilisateur retire sa réaction
            reactions[emoji].splice(userIndex, 1);
            if (reactions[emoji].length === 0) {
                delete reactions[emoji];
            }
        } else {
            // L'utilisateur ajoute sa réaction
            reactions[emoji].push(userId);
        }

        db.run('UPDATE chat_messages SET reactions = ? WHERE id = ?', [stringifyJSON(reactions), messageId]);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// NOTE: La gestion des "non-lus" est complexe avec SQLite et nécessite une table dédiée
// (ex: user_channel_read_status). Pour cette migration, cette fonctionnalité est simplifiée.
// Les fonctions getUnreadCount et markAsRead sont laissées en placeholder.

async function getUnreadCount(userId) {
    // Placeholder - une implémentation réelle nécessiterait une logique plus complexe.
    return 0;
}

async function markAsRead(channelId, userId) {
    // Placeholder
    return { success: true };
}


module.exports = {
    getChannels,
    addChannel,
    getMessages,
    addMessage,
    editMessage,
    deleteMessage,
    getDms,
    addDm,
    addReaction,
    getUnreadCount,
    markAsRead,
};