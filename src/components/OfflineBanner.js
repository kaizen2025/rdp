// src/components/OfflineBanner.js - Bannière persistante pour le mode hors-ligne

import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import WarningIcon from '@mui/icons-material/Warning';

const OfflineBanner = () => {
    const [isOffline, setIsOffline] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [lastError, setLastError] = useState('');
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const [offlineSince, setOfflineSince] = useState(null);

    useEffect(() => {
        // Écouter les changements de statut réseau depuis le backend
        if (window.electronAPI?.onDataUpdated) {
            const unsubscribe = window.electronAPI.onDataUpdated((data) => {
                if (data.file === 'network-status') {
                    handleNetworkStatusChange(data);
                }
            });

            return () => {
                if (unsubscribe) unsubscribe();
            };
        }

        // Alternative: écouter un événement spécifique network-status-changed
        const handleNetworkStatus = (data) => {
            if (data.isOnline === false) {
                setIsOffline(true);
                setIsReconnecting(false);
                setLastError(data.error || 'Impossible d\'accéder au réseau partagé');
                setOfflineSince(data.timestamp ? new Date(data.timestamp) : new Date());
                setDismissed(false);
            } else if (data.isOnline === true) {
                setIsOffline(false);
                setIsReconnecting(false);
                setReconnectAttempts(0);
                setOfflineSince(null);
            }
        };

        // Si l'API expose un événement spécifique
        if (window.electronAPI?.onNetworkStatusChanged) {
            const unsubscribe = window.electronAPI.onNetworkStatusChanged(handleNetworkStatus);
            return () => {
                if (unsubscribe) unsubscribe();
            };
        }
    }, []);

    const handleNetworkStatusChange = (data) => {
        if (data.type === 'network-status') {
            if (data.isOnline === false) {
                setIsOffline(true);
                setIsReconnecting(false);
                setLastError(data.error || 'Impossible d\'accéder au réseau partagé');
                setOfflineSince(data.timestamp ? new Date(data.timestamp) : new Date());
                setDismissed(false);
            } else if (data.isOnline === true) {
                setIsOffline(false);
                setIsReconnecting(false);
                setReconnectAttempts(0);
                setOfflineSince(null);
            } else if (data.reconnecting) {
                setIsReconnecting(true);
                setReconnectAttempts(data.attempt || 0);
            }
        }
    };

    const handleRetry = async () => {
        setIsReconnecting(true);
        
        // Simuler une tentative de reconnexion
        // Dans un vrai cas, cela déclencherait une vérification réseau backend
        setTimeout(() => {
            setIsReconnecting(false);
        }, 3000);
    };

    const handleDismiss = () => {
        setDismissed(true);
    };

    const formatOfflineTime = () => {
        if (!offlineSince) return '';
        
        const now = new Date();
        const diffMs = now - offlineSince;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return "à l'instant";
        if (diffMins < 60) return `depuis ${diffMins} min`;
        
        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        
        if (diffHours < 24) return `depuis ${diffHours}h ${remainingMins}min`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `depuis ${diffDays}j`;
    };

    if (!isOffline || dismissed) return null;

    return (
        <Box sx={{ position: 'relative', zIndex: 1200 }}>
            <Collapse in={isOffline && !dismissed}>
                <Alert 
                    severity="warning" 
                    icon={<CloudOffIcon fontSize="inherit" />}
                    sx={{ 
                        borderRadius: 0,
                        mb: 0,
                        position: 'sticky',
                        top: 64, // Hauteur de l'AppBar
                        zIndex: 1200
                    }}
                    action={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {!isReconnecting && (
                                <IconButton
                                    aria-label="retry"
                                    color="inherit"
                                    size="small"
                                    onClick={handleRetry}
                                >
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            )}
                            <IconButton
                                aria-label="close"
                                color="inherit"
                                size="small"
                                onClick={handleDismiss}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    }
                >
                    <AlertTitle sx={{ fontWeight: 'bold', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WifiOffIcon fontSize="small" />
                            Mode Hors-Ligne {offlineSince && `(${formatOfflineTime()})`}
                        </Box>
                    </AlertTitle>
                    
                    <Typography variant="body2" gutterBottom>
                        Impossible d'accéder au partage réseau <code>\\192.168.1.230\...</code>
                    </Typography>
                    
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                        <Chip 
                            size="small" 
                            label="Données en cache uniquement" 
                            icon={<WarningIcon />}
                            color="warning"
                            variant="outlined"
                        />
                        <Chip 
                            size="small" 
                            label="Synchronisation désactivée" 
                            color="default"
                            variant="outlined"
                        />
                        
                        {isReconnecting && (
                            <Chip 
                                size="small" 
                                label={`Reconnexion en cours${reconnectAttempts > 0 ? ` (${reconnectAttempts})` : ''}...`}
                                color="info"
                                variant="outlined"
                            />
                        )}
                    </Box>

                    {isReconnecting && (
                        <LinearProgress 
                            sx={{ mt: 1, borderRadius: 1 }} 
                            color="warning"
                        />
                    )}

                    {lastError && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
                            Erreur: {lastError}
                        </Typography>
                    )}
                </Alert>
            </Collapse>
        </Box>
    );
};

export default OfflineBanner;