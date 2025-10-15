// electron/services/chatService.js - Service chat amélioré avec fichiers et réactions

const path = require('path');
const fs = require('fs');
const { safeReadJsonFile, safeWriteJsonFile } = require('./fileService');
const { generateId } = require('./utils');
const configService = require('./configService');

const defaultChatData = {
    channels: [
        { 
            id: 'general', 
            name: 'Général', 
            description: 'Canal de discussion principal.',
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        },
        { 
            id: 'maintenance', 
            name: 'Annonces Maintenance', 
            description: 'Annonces importantes.',
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        },
        { 
            id: 'urgences', 
            name: 'Urgences', 
            description: 'Canal pour les urgences IT.',
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        }
    ],
    messages: {
        general: [],
        maintenance: [],
        urgences: []
    },
    dms: {},
    files: {}, // Stockage des métadonnées de fichiers
    reactions: {} // Stockage des réactions par message
};

async function getChatData() {
    const chatPath = configService.appConfig?.chatDbPath;
    if (!chatPath) return { ...defaultChatData };
    
    let data = await safeReadJsonFile(chatPath, null);
    if (!data) {
        await safeWriteJsonFile(chatPath, defaultChatData);
        return defaultChatData;
    }
    
    // S'assurer que toutes les structures existent
    if (!data.channels) data.channels = defaultChatData.channels;
    if (!data.messages) data.messages = defaultChatData.messages;
    if (!data.dms) data.dms = defaultChatData.dms;
    if (!data.files) data.files = {};
    if (!data.reactions) data.reactions = {};
    
    return data;
}

async function saveChatData(data) {
    const chatPath = configService.appConfig?.chatDbPath;
    if (!chatPath) return { success: false, error: "Chemin du chat non configuré." };
    return await safeWriteJsonFile(chatPath, data);
}

// --- CANAUX ---

async function getChannels() { 
    const data = await getChatData(); 
    return data.channels || []; 
}

async function addChannel(name, description, author) {
    const data = await getChatData();
    const newId = name.toLowerCase().replace(/\s+/g, '-');
    
    if (data.channels.some(c => c.id === newId)) {
        return { success: false, error: 'Un canal avec ce nom existe déjà.' };
    }
    
    data.channels.push({ 
        id: newId, 
        name, 
        description: description || '',
        createdAt: new Date().toISOString(),
        createdBy: author?.id || 'unknown'
    });
    
    data.messages[newId] = [];
    
    return await saveChatData(data);
}

async function updateChannel(channelId, name, description) {
    const data = await getChatData();
    const index = data.channels.findIndex(c => c.id === channelId);
    
    if (index === -1) return { success: false, error: 'Canal introuvable.' };
    
    data.channels[index] = { 
        ...data.channels[index], 
        name, 
        description,
        updatedAt: new Date().toISOString()
    };
    
    return await saveChatData(data);
}

async function deleteChannel(channelId) {
    if (channelId === 'general') {
        return { success: false, error: 'Le canal "Général" ne peut pas être supprimé.' };
    }
    
    const data = await getChatData();
    data.channels = data.channels.filter(c => c.id !== channelId);
    delete data.messages[channelId];
    
    return await saveChatData(data);
}

// --- MESSAGES ---

async function getMessages(channelId) { 
    const data = await getChatData(); 
    const messages = data.messages[channelId] || [];
    
    // Ajouter les réactions à chaque message
    return messages.map(msg => ({
        ...msg,
        reactions: data.reactions[msg.id] || {}
    }));
}

async function addMessage(channelId, messageText, author, fileData = null) {
    const data = await getChatData();
    
    if (!data.messages[channelId]) {
        data.messages[channelId] = [];
    }
    
    const messageId = generateId();
    const newMessage = {
        id: messageId,
        text: messageText,
        authorId: author.id,
        authorName: author.name,
        authorAvatar: author.avatar,
        timestamp: new Date().toISOString(),
        edited: false
    };
    
    // Gérer le fichier si présent
    if (fileData) {
        const fileId = generateId();
        const fileInfo = {
            id: fileId,
            name: fileData.name,
            size: fileData.size,
            type: fileData.type,
            uploadedBy: author.id,
            uploadedAt: new Date().toISOString(),
            messageId: messageId
        };
        
        data.files[fileId] = fileInfo;
        newMessage.file = fileInfo;
    }
    
    data.messages[channelId].push(newMessage);
    
    // Limiter à 1000 messages par canal
    if (data.messages[channelId].length > 1000) {
        data.messages[channelId] = data.messages[channelId].slice(-1000);
    }
    
    return await saveChatData(data);
}

async function editMessage(messageId, channelId, newText, author) {
    const data = await getChatData();
    
    if (!data.messages[channelId]) {
        return { success: false, error: 'Canal introuvable.' };
    }
    
    const messageIndex = data.messages[channelId].findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) {
        return { success: false, error: 'Message introuvable.' };
    }
    
    const message = data.messages[channelId][messageIndex];
    
    // Vérifier que l'auteur est le même
    if (message.authorId !== author.id) {
        return { success: false, error: 'Vous ne pouvez modifier que vos propres messages.' };
    }
    
    message.text = newText;
    message.edited = true;
    message.editedAt = new Date().toISOString();
    
    return await saveChatData(data);
}

async function deleteMessage(messageId, channelId, author) {
    const data = await getChatData();
    
    if (!data.messages[channelId]) {
        return { success: false, error: 'Canal introuvable.' };
    }
    
    const messageIndex = data.messages[channelId].findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) {
        return { success: false, error: 'Message introuvable.' };
    }
    
    const message = data.messages[channelId][messageIndex];
    
    // Vérifier que l'auteur est le même ou admin
    if (message.authorId !== author.id && !author.permissions?.includes('admin')) {
        return { success: false, error: 'Vous ne pouvez supprimer que vos propres messages.' };
    }
    
    data.messages[channelId].splice(messageIndex, 1);
    
    // Supprimer les réactions associées
    delete data.reactions[messageId];
    
    return await saveChatData(data);
}

// --- RÉACTIONS ---

async function addReaction(messageId, channelId, emoji, userId) {
    const data = await getChatData();
    
    if (!data.reactions[messageId]) {
        data.reactions[messageId] = {};
    }
    
    if (!data.reactions[messageId][emoji]) {
        data.reactions[messageId][emoji] = [];
    }
    
    // Toggle : retirer si déjà présent, ajouter sinon
    const userIndex = data.reactions[messageId][emoji].indexOf(userId);
    
    if (userIndex > -1) {
        data.reactions[messageId][emoji].splice(userIndex, 1);
        
        // Nettoyer si plus personne n'a cette réaction
        if (data.reactions[messageId][emoji].length === 0) {
            delete data.reactions[messageId][emoji];
        }
    } else {
        data.reactions[messageId][emoji].push(userId);
    }
    
    return await saveChatData(data);
}

// --- MESSAGES DIRECTS (DMs) ---

function getDmChannelKey(userId1, userId2) {
    return [userId1, userId2].sort().join('--');
}

async function getDms(userId1, userId2) {
    const data = await getChatData();
    const dmKey = getDmChannelKey(userId1, userId2);
    const messages = data.dms[dmKey] || [];
    
    // Ajouter les réactions à chaque message
    return messages.map(msg => ({
        ...msg,
        reactions: data.reactions[msg.id] || {}
    }));
}

async function addDm(fromUser, toUserId, messageText, fileData = null) {
    const data = await getChatData();
    const dmKey = getDmChannelKey(fromUser.id, toUserId);
    
    if (!data.dms[dmKey]) {
        data.dms[dmKey] = [];
    }
    
    const messageId = generateId();
    const newMessage = {
        id: messageId,
        text: messageText,
        authorId: fromUser.id,
        authorName: fromUser.name,
        authorAvatar: fromUser.avatar,
        timestamp: new Date().toISOString(),
        edited: false
    };
    
    // Gérer le fichier si présent
    if (fileData) {
        const fileId = generateId();
        const fileInfo = {
            id: fileId,
            name: fileData.name,
            size: fileData.size,
            type: fileData.type,
            uploadedBy: fromUser.id,
            uploadedAt: new Date().toISOString(),
            messageId: messageId
        };
        
        data.files[fileId] = fileInfo;
        newMessage.file = fileInfo;
    }
    
    data.dms[dmKey].push(newMessage);
    
    // Limiter à 1000 messages par conversation
    if (data.dms[dmKey].length > 1000) {
        data.dms[dmKey] = data.dms[dmKey].slice(-1000);
    }
    
    return await saveChatData(data);
}

// --- NOTIFICATIONS ---

async function getUnreadCount(userId) {
    const data = await getChatData();
    const lastRead = data.lastRead?.[userId] || {};
    
    let totalUnread = 0;
    
    // Compter messages non lus dans les canaux
    for (const channelId in data.messages) {
        const messages = data.messages[channelId];
        const lastReadTimestamp = lastRead[channelId] || 0;
        
        totalUnread += messages.filter(m => 
            new Date(m.timestamp).getTime() > lastReadTimestamp &&
            m.authorId !== userId
        ).length;
    }
    
    // Compter DMs non lus
    for (const dmKey in data.dms) {
        if (dmKey.includes(userId)) {
            const messages = data.dms[dmKey];
            const lastReadTimestamp = lastRead[dmKey] || 0;
            
            totalUnread += messages.filter(m => 
                new Date(m.timestamp).getTime() > lastReadTimestamp &&
                m.authorId !== userId
            ).length;
        }
    }
    
    return totalUnread;
}

async function markAsRead(channelId, userId) {
    const data = await getChatData();
    
    if (!data.lastRead) {
        data.lastRead = {};
    }
    
    if (!data.lastRead[userId]) {
        data.lastRead[userId] = {};
    }
    
    data.lastRead[userId][channelId] = Date.now();
    
    return await saveChatData(data);
}

module.exports = {
    getMessages,
    addMessage,
    editMessage,
    deleteMessage,
    getChannels,
    addChannel,
    updateChannel,
    deleteChannel,
    getDms,
    addDm,
    addReaction,
    getUnreadCount,
    markAsRead
};