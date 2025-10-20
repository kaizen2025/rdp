// src/contexts/AppContext.js - VERSION COMPLÈTE AVEC WEBSOCKET POUR LE TEMPS RÉEL

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService'; // Import du nouveau service API

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

// --- CONFIGURATION WEBSOCKET ---
const WS_URL = process.env.NODE_ENV === 'development'
  ? 'ws://localhost:3003'
  : 'ws://192.168.1.232:3003'; // Remplacez par l'IP de votre serveur de production

export const AppProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [currentTechnician, setCurrentTechnician] = useState(null); // Sera géré par un contexte d'authentification plus tard
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [isOnline, setIsOnline] = useState(true); // Statut de la connexion au backend

    // --- SYSTÈME D'ÉVÉNEMENTS INTERNE ---
    const eventListeners = useRef({});

    const on = useCallback((eventName, callback) => {
        if (!eventListeners.current[eventName]) {
            eventListeners.current[eventName] = [];
        }
        eventListeners.current[eventName].push(callback);
        // Retourne une fonction pour se désabonner
        return () => {
            off(eventName, callback);
        };
    }, []);

    const off = useCallback((eventName, callback) => {
        if (eventListeners.current[eventName]) {
            eventListeners.current[eventName] = eventListeners.current[eventName].filter(
                (cb) => cb !== callback
            );
        }
    }, []);

    const emit = useCallback((eventName, data) => {
        if (eventListeners.current[eventName]) {
            eventListeners.current[eventName].forEach((callback) => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Erreur dans un listener d'événement pour ${eventName}:`, e);
                }
            });
        }
    }, []);

    // --- GESTION DE LA CONNEXION WEBSOCKET ---
    useEffect(() => {
        let ws;
        let reconnectInterval;

        function connect() {
            ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                console.log('✅ WebSocket connecté au serveur.');
                setIsOnline(true);
                showNotification('success', 'Connecté au serveur en temps réel.');
                if (reconnectInterval) {
                    clearInterval(reconnectInterval);
                    reconnectInterval = null;
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket Message Reçu:', data);

                    // Émettre un événement global basé sur le type de message
                    if (data.type === 'data_updated' && data.payload?.entity) {
                        // Événement spécifique (ex: 'data_updated:loans')
                        emit(`data_updated:${data.payload.entity}`, data.payload);
                        // Événement générique
                        emit('data_updated', data.payload);
                    } else {
                        emit(data.type, data.payload);
                    }
                } catch (e) {
                    console.error('Erreur parsing message WebSocket:', e);
                }
            };

            ws.onclose = () => {
                console.warn('🔌 WebSocket déconnecté. Tentative de reconnexion...');
                setIsOnline(false);
                if (!reconnectInterval) {
                    reconnectInterval = setInterval(() => {
                        connect();
                    }, 5000); // Tente de se reconnecter toutes les 5 secondes
                }
            };

            ws.onerror = (error) => {
                console.error('❌ Erreur WebSocket:', error);
                ws.close(); // Déclenchera l'événement onclose et la tentative de reconnexion
            };
        }

        connect();

        // Nettoyage à la fermeture du composant
        return () => {
            if (reconnectInterval) clearInterval(reconnectInterval);
            if (ws) ws.close();
        };
    }, [emit]); // Dépendance à 'emit' pour que le système d'événements soit prêt

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Remplacer l'appel Electron par un appel API
                const loadedConfig = await apiService.getConfig();
                setConfig(loadedConfig);
                
                // Simuler la connexion d'un technicien
                // TODO: Remplacer par un vrai flux de login
                setCurrentTechnician(loadedConfig.it_technicians[0]);

            } catch (err) {
                console.error('Erreur initialisation App:', err);
                setError(`Impossible de charger la configuration depuis le serveur: ${err.message}`);
                setIsOnline(false);
            } finally {
                setIsInitializing(false);
            }
        };
        initializeApp();
    }, []);

    // --- GESTION DES NOTIFICATIONS (Snackbar) ---
    const showNotification = useCallback((type, message) => {
        const newNotification = { id: Date.now(), type, message };
        setNotifications(prev => [...prev, newNotification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 5000);
    }, []);

    const value = {
        config,
        currentTechnician,
        isInitializing,
        error,
        isOnline,
        notifications,
        showNotification,
        // Export du système d'événements pour que les composants puissent s'abonner
        events: { on, off, emit },
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};