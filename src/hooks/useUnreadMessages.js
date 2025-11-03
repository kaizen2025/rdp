// src/hooks/useUnreadMessages.js - GESTION DES MESSAGES NON LUS

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

/**
 * Hook personnalisé pour gérer les messages non lus du chat
 * @returns {Object} { unreadCount, markChannelAsRead, resetUnread }
 */
export const useUnreadMessages = () => {
    const { events, currentTechnician } = useApp();
    const [unreadByChannel, setUnreadByChannel] = useState({});
    const [lastReadTimestamps, setLastReadTimestamps] = useState(() => {
        const stored = localStorage.getItem('chat_last_read_timestamps');
        return stored ? JSON.parse(stored) : {};
    });

    // Calculer le nombre total de messages non lus
    const unreadCount = Object.values(unreadByChannel).reduce((sum, count) => sum + count, 0);

    // Charger les messages non lus au montage
    useEffect(() => {
        const loadUnreadMessages = async () => {
            try {
                const channels = await apiService.getChatChannels();
                const unreadCounts = {};

                for (const channel of channels) {
                    const messages = await apiService.getChatMessages(channel.id);
                    const lastRead = lastReadTimestamps[channel.id] || 0;
                    
                    // Compter les messages après la dernière lecture
                    const unread = messages.filter(msg => 
                        msg.authorId !== currentTechnician?.id && 
                        new Date(msg.timestamp).getTime() > lastRead
                    ).length;

                    if (unread > 0) {
                        unreadCounts[channel.id] = unread;
                    }
                }

                setUnreadByChannel(unreadCounts);
            } catch (error) {
                console.error('Erreur chargement messages non lus:', error);
            }
        };

        if (currentTechnician) {
            loadUnreadMessages();
        }
    }, [currentTechnician, lastReadTimestamps]);

    // Écouter les nouveaux messages
    useEffect(() => {
        const handleNewMessage = (message) => {
            // Ne pas compter nos propres messages
            if (message.authorId === currentTechnician?.id) return;

            const lastRead = lastReadTimestamps[message.channelId] || 0;
            if (new Date(message.timestamp).getTime() > lastRead) {
                setUnreadByChannel(prev => ({
                    ...prev,
                    [message.channelId]: (prev[message.channelId] || 0) + 1
                }));
            }
        };

        const unsubscribe = events.on('chat_message_new', handleNewMessage);
        return unsubscribe;
    }, [events, currentTechnician, lastReadTimestamps]);

    // Marquer un canal comme lu
    const markChannelAsRead = useCallback((channelId) => {
        const now = Date.now();
        const newTimestamps = { ...lastReadTimestamps, [channelId]: now };
        
        setLastReadTimestamps(newTimestamps);
        localStorage.setItem('chat_last_read_timestamps', JSON.stringify(newTimestamps));
        
        setUnreadByChannel(prev => {
            const newUnread = { ...prev };
            delete newUnread[channelId];
            return newUnread;
        });
    }, [lastReadTimestamps]);

    // Réinitialiser tous les non lus
    const resetUnread = useCallback(() => {
        setUnreadByChannel({});
        setLastReadTimestamps({});
        localStorage.removeItem('chat_last_read_timestamps');
    }, []);

    return {
        unreadCount,
        unreadByChannel,
        markChannelAsRead,
        resetUnread
    };
};
