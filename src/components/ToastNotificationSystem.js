// src/components/ToastNotificationSystem.js - SYSTÈME DE NOTIFICATIONS TOAST

import React, { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useApp } from '../contexts/AppContext';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ChatIcon from '@mui/icons-material/Chat';

/**
 * Composant de notification personnalisée pour les messages chat
 */
const ChatNotification = ({ author, message, onClick }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={onClick}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
            {author.avatar || author.name?.charAt(0) || <ChatIcon />}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {author.name || 'Nouveau message'}
            </Typography>
            <Typography 
                variant="body2" 
                sx={{ 
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}
            >
                {message.length > 60 ? message.substring(0, 60) + '...' : message}
            </Typography>
        </Box>
    </Box>
);

/**
 * Système de notifications toast global
 */
const ToastNotificationSystem = ({ onChatClick }) => {
    const { events, currentTechnician, config } = useApp();

    useEffect(() => {
        // Écouter les nouveaux messages chat
        const handleNewChatMessage = (message) => {
            // Ne pas notifier pour nos propres messages
            if (message.authorId === currentTechnician?.id) return;

            const author = config?.it_technicians?.find(t => t.id === message.authorId) || { 
                name: 'Utilisateur inconnu', 
                avatar: '?' 
            };

            // Jouer un son optionnel (si activé)
            const soundEnabled = localStorage.getItem('chat_sound_enabled') !== 'false';
            if (soundEnabled) {
                try {
                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCx5y/LTfzQHInLH8+OZQQ0QXq/v8axaGAc+ltryy30yBShy0PPWi0ILEF2w7/Gp');
                    audio.volume = 0.3;
                    audio.play().catch(() => {}); // Ignorer les erreurs de lecture
                } catch (e) {
                    // Ignorer les erreurs
                }
            }

            // Afficher la notification toast
            toast.info(
                <ChatNotification 
                    author={author} 
                    message={message.text}
                    onClick={() => {
                        toast.dismiss();
                        if (onChatClick) onChatClick();
                    }}
                />,
                {
                    position: 'bottom-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    icon: false,
                }
            );
        };

        const unsubscribe = events.on('chat_message_new', handleNewChatMessage);
        return unsubscribe;
    }, [events, currentTechnician, config, onChatClick]);

    return (
        <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            style={{ zIndex: 9999 }}
        />
    );
};

export default ToastNotificationSystem;

/**
 * Fonction helper pour afficher des notifications générales
 */
export const showToast = {
    success: (message) => toast.success(message),
    error: (message) => toast.error(message),
    info: (message) => toast.info(message),
    warning: (message) => toast.warning(message),
};
