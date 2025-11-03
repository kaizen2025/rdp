// backend/services/chatService.js - VERSION AMÉLIORÉE AVEC GESTION COMPLÈTE

const db = require('./databaseService');
const { generateId } = require('./utils');

const parseJSON = (field, defaultValue = null) => {
    try { return field ? JSON.parse(field) : defaultValue; } catch { return defaultValue; }
};
const stringifyJSON = (field) => {
    try { return JSON.stringify(field); } catch { return null; }
};

// --- CANAUX ---

async function getChannels() {
    try {
        return db.all('SELECT * FROM chat_channels ORDER BY name ASC');
    } catch (error) {
        console.error("Erreur getChannels:", error);
        throw error;
    }
}

async function addChannel(name, description, author) {
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!id) throw new Error("Le nom du canal est invalide.");
    try {
        db.run('INSERT INTO chat_channels (id, name, description, createdAt, createdBy) VALUES (?, ?, ?, ?, ?)',
            [id, name, description || '', new Date().toISOString(), author?.id || 'unknown']);
        return { success: true, id };
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error(`Un canal avec le nom "${name}" existe déjà.`);
        }
        throw error;
    }
}

// --- MESSAGES ---

function getDmChannelKey(userId1, userId2) {
    return `dm--${[userId1, userId2].sort().join('--')}`;
}

async function getMessages(channelId) {
    try {
        const rows = db.all('SELECT * FROM chat_messages WHERE channelId = ? ORDER BY timestamp ASC', [channelId]);
        return rows.map(m => ({
            ...m,
            reactions: parseJSON(m.reactions, {}),
            file_info: parseJSON(m.file_info, null),
            edited: !!(parseJSON(m.reactions, {})?.edited),
        }));
    } catch (error) {
        console.error("Erreur getMessages:", error);
        throw error;
    }
}

async function addMessage(channelId, messageText, author, fileInfo = null) {
    const id = generateId();
    const now = new Date().toISOString();
    try {
        db.run(
            'INSERT INTO chat_messages (id, channelId, authorId, authorName, authorAvatar, text, timestamp, file_info, reactions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, channelId, author.id, author.name, author.avatar, messageText, now, fileInfo ? stringifyJSON(fileInfo) : null, stringifyJSON({})]
        );
        const newMessage = db.get('SELECT * FROM chat_messages WHERE id = ?', [id]);
        return { ...newMessage, reactions: {}, file_info: fileInfo };
    } catch (error) {
        console.error("Erreur addMessage:", error);
        throw error;
    }
}

async function editMessage(messageId, channelId, newText, author) {
    const message = db.get('SELECT authorId, reactions FROM chat_messages WHERE id = ? AND channelId = ?', [messageId, channelId]);
    if (!message) throw new Error("Message introuvable.");
    if (message.authorId !== author.id) throw new Error("Action non autorisée.");

    const reactions = parseJSON(message.reactions, {});
    reactions.edited = true;

    try {
        db.run('UPDATE chat_messages SET text = ?, reactions = ? WHERE id = ?', [newText, stringifyJSON(reactions), messageId]);
        return { success: true };
    } catch (error) {
        throw error;
    }
}

async function deleteMessage(messageId, channelId, author) {
    const message = db.get('SELECT authorId FROM chat_messages WHERE id = ? AND channelId = ?', [messageId, channelId]);
    if (!message) throw new Error("Message introuvable.");
    if (message.authorId !== author.id && !author.permissions?.includes('admin')) {
        throw new Error("Action non autorisée.");
    }
    try {
        db.run('DELETE FROM chat_messages WHERE id = ?', [messageId]);
        return { success: true };
    } catch (error) {
        throw error;
    }
}

// --- RÉACTIONS ---

async function toggleReaction(messageId, channelId, emoji, userId) {
    try {
        const message = db.get('SELECT reactions FROM chat_messages WHERE id = ? AND channelId = ?', [messageId, channelId]);
        if (!message) throw new Error("Message introuvable.");

        const reactions = parseJSON(message.reactions, {});
        reactions[emoji] = reactions[emoji] || [];

        const userIndex = reactions[emoji].indexOf(userId);
        if (userIndex > -1) {
            reactions[emoji].splice(userIndex, 1);
            if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
            reactions[emoji].push(userId);
        }

        db.run('UPDATE chat_messages SET reactions = ? WHERE id = ?', [stringifyJSON(reactions), messageId]);
        return { success: true };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getChannels,
    addChannel,
    getMessages,
    addMessage,
    editMessage,
    deleteMessage,
    getDmChannelKey,
    toggleReaction,
};