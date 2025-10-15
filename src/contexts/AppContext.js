// src/contexts/AppContext.js - Version améliorée avec notifications Snackbar

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children, currentTechnician }) => {
    const [config, setConfig] = useState(null);
    const [error, setError] = useState('');
    const [isInitializing, setIsInitializing] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [isOffline, setIsOffline] = useState(false); // État hors-ligne
    const lastNotification = useRef({});

    const fetchConfig = useCallback(async () => {
        try {
            const loadedConfig = await window.electronAPI.getConfig();
            setConfig(loadedConfig);
            setIsOffline(false); // Connexion réussie
        } catch (err) {
            console.error('Erreur chargement config:', err);
            setError(`Impossible de charger la configuration: ${err.message}`);
            setIsOffline(true); // Mode hors-ligne
        } finally {
            setIsInitializing(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    /**
     * Affiche une notification (système + Snackbar)
     * @param {string} type - Type de notification: 'success', 'error', 'warning', 'info'
     * @param {string} message - Message à afficher
     * @param {boolean} skipSystemNotif - Si true, n'affiche pas la notification système
     */
    const showNotification = useCallback((type, message, skipSystemNotif = false) => {
        const now = Date.now();
        
        // Anti-spam: empêcher les notifications identiques en moins de 5 secondes
        if (lastNotification.current.message === message && 
            (now - lastNotification.current.time) < 5000) {
            console.log("Notification ignorée (anti-spam):", message);
            return;
        }

        // Notification système (optionnel)
        if (!skipSystemNotif && window.electronAPI?.showNotification) {
            window.electronAPI.showNotification('RDS Viewer', message);
        }
        
        // Notification Snackbar (toujours affichée)
        const newNotification = { 
            id: now, 
            type, 
            message,
            timestamp: new Date().toISOString()
        };
        
        setNotifications(prev => [...prev, newNotification]);
        lastNotification.current = { message, time: now };

        // Auto-suppression après 5 secondes
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 5000);
    }, []);

    const handleSaveConfig = async (data) => {
        try {
            const result = await window.electronAPI.saveConfig(data);
            if (result.success) {
                await fetchConfig();
                showNotification('success', 'Configuration sauvegardée avec succès');
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            setError(`Erreur critique lors de la sauvegarde: ${err.message}`);
            showNotification('error', `Erreur: ${err.message}`);
            return false;
        }
    };

    /**
     * Affiche une notification d'erreur réseau et passe en mode hors-ligne
     */
    const handleNetworkError = useCallback((errorMessage) => {
        setIsOffline(true);
        showNotification('error', `Mode hors-ligne: ${errorMessage}`, true);
    }, [showNotification]);

    /**
     * Rétablit la connexion et sort du mode hors-ligne
     */
    const handleNetworkReconnected = useCallback(() => {
        if (isOffline) {
            setIsOffline(false);
            showNotification('success', 'Connexion rétablie - Données synchronisées', true);
        }
    }, [isOffline, showNotification]);

    const value = {
        config,
        fetchConfig,
        error,
        isInitializing,
        showNotification,
        handleSaveConfig,
        currentTechnician,
        notifications,
        isOffline,
        handleNetworkError,
        handleNetworkReconnected,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};