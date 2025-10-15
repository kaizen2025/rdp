// src/components/SyncStatusBar.js - Version corrigée sans notifications intempestives

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';

// Icons
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SyncIcon from '@mui/icons-material/Sync';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';

const SyncStatusBar = ({ syncService }) => {
  const [status, setStatus] = useState({
    isOnline: true,
    lastSync: null,
    activeUsers: [],
    pendingOperations: [],
    notifications: []
  });
  const [usersMenuAnchor, setUsersMenuAnchor] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [currentConflict, setCurrentConflict] = useState(null);
  const [lastNetworkStatus, setLastNetworkStatus] = useState(true); // Éviter les notifications répétées
  const [networkChangeCount, setNetworkChangeCount] = useState(0); // Compteur pour éviter le spam

  useEffect(() => {
    if (!syncService) return;

    // Écouter les événements de synchronisation avec gestion améliorée
    const handleDataUpdated = (event) => {
      setStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        notifications: [...prev.notifications.slice(-4), {
          id: Date.now(),
          type: 'update',
          message: `Données mises à jour par ${event.updatedBy || 'un utilisateur'}`,
          timestamp: new Date(),
          changes: event.changes
        }]
      }));
    };

    const handleSyncError = (error) => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        notifications: [...prev.notifications.slice(-4), {
          id: Date.now(),
          type: 'error',
          message: `Erreur de synchronisation: ${error.message}`,
          timestamp: new Date()
        }]
      }));
    };

    // Gestion intelligente des changements de réseau pour éviter le spam
    const handleNetworkLost = () => {
      if (lastNetworkStatus === true) { // Seulement si on était en ligne
        setLastNetworkStatus(false);
        setStatus(prev => ({
          ...prev,
          isOnline: false,
          notifications: [...prev.notifications.slice(-4), {
            id: Date.now(),
            type: 'warning',
            message: 'Connexion réseau perdue - Mode hors ligne',
            timestamp: new Date()
          }]
        }));
      }
    };

    const handleNetworkRestored = () => {
      // Éviter les notifications répétées de reconnexion
      if (lastNetworkStatus === false) { // Seulement si on était hors ligne
        setLastNetworkStatus(true);
        setNetworkChangeCount(prev => prev + 1);
        
        // Limiter les notifications de reconnexion (max 1 toutes les 30 secondes)
        const now = Date.now();
        const lastNotificationTime = status.notifications
          .filter(n => n.type === 'success' && n.message.includes('rétablie'))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.timestamp;
        
        if (!lastNotificationTime || (now - new Date(lastNotificationTime).getTime()) > 30000) {
          setStatus(prev => ({
            ...prev,
            isOnline: true,
            notifications: [...prev.notifications.slice(-4), {
              id: Date.now(),
              type: 'success',
              message: 'Connexion réseau rétablie',
              timestamp: new Date()
            }]
          }));
        } else {
          // Juste mettre à jour le statut sans notification
          setStatus(prev => ({
            ...prev,
            isOnline: true
          }));
        }
      }
    };

    const handleOperationComplete = (event) => {
      if (!event.success) {
        setStatus(prev => ({
          ...prev,
          notifications: [...prev.notifications.slice(-4), {
            id: Date.now(),
            type: 'error',
            message: `Opération échouée: ${event.error}`,
            timestamp: new Date()
          }]
        }));
      }
    };

    // Attacher les listeners
    syncService.on('dataUpdated', handleDataUpdated);
    syncService.on('syncError', handleSyncError);
    syncService.on('networkLost', handleNetworkLost);
    syncService.on('networkRestored', handleNetworkRestored);
    syncService.on('operationComplete', handleOperationComplete);

    // Mise à jour périodique du statut avec gestion d'erreur
    const statusInterval = setInterval(async () => {
      try {
        const connectionStatus = syncService.getConnectionStatus();
        
        // Récupérer les utilisateurs connectés avec gestion d'erreur
        let activeUsers = [];
        try {
          if (syncService.getConnectedTechnicians && typeof syncService.getConnectedTechnicians === 'function') {
            const connectedTechs = syncService.getConnectedTechnicians();
            activeUsers = Array.isArray(connectedTechs) ? connectedTechs : [];
          } else if (syncService.technicianManager && syncService.technicianManager.getConnectedTechnicians) {
            const connectedTechs = syncService.technicianManager.getConnectedTechnicians();
            activeUsers = Array.isArray(connectedTechs) ? connectedTechs : [];
          }
        } catch (presenceError) {
          console.warn('Erreur récupération présence techniciens:', presenceError.message);
          activeUsers = [];
        }

        // Récupérer les opérations en cours
        let pendingOperations = [];
        try {
          if (syncService.getOperationStats && typeof syncService.getOperationStats === 'function') {
            const opStats = syncService.getOperationStats();
            pendingOperations = opStats.pendingOperations || [];
          }
        } catch (opError) {
          console.warn('Erreur récupération opérations:', opError.message);
        }
        
        setStatus(prev => ({
          ...prev,
          ...connectionStatus,
          activeUsers,
          pendingOperations
        }));
      } catch (error) {
        console.warn('Erreur mise à jour statut sync bar:', error.message);
      }
    }, 5000); // Réduit la fréquence pour éviter le spam

    // Nettoyage
    return () => {
      syncService.off('dataUpdated', handleDataUpdated);
      syncService.off('syncError', handleSyncError);
      syncService.off('networkLost', handleNetworkLost);
      syncService.off('networkRestored', handleNetworkRestored);
      syncService.off('operationComplete', handleOperationComplete);
      clearInterval(statusInterval);
    };
  }, [syncService, lastNetworkStatus, status.notifications]);

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <CloudOffIcon color="error" />;
    }
    
    if (Array.isArray(status.pendingOperations) && status.pendingOperations.length > 0) {
      return <SyncIcon className="rotating" color="warning" />;
    }
    
    return <CloudDoneIcon color="success" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return 'Hors ligne';
    }
    
    if (Array.isArray(status.pendingOperations) && status.pendingOperations.length > 0) {
      return `Synchronisation... (${status.pendingOperations.length})`;
    }
    
    if (status.lastSync) {
      return `Sync: ${status.lastSync.toLocaleTimeString()}`;
    }
    
    return 'En ligne';
  };

  const getStatusColor = () => {
    if (!status.isOnline) return 'error';
    if (Array.isArray(status.pendingOperations) && status.pendingOperations.length > 0) return 'warning';
    return 'success';
  };

  const handleForceSync = async () => {
    if (syncService && syncService.forceSync) {
      try {
        await syncService.forceSync();
      } catch (error) {
        console.warn('Erreur force sync:', error.message);
      }
    }
  };

  const clearNotifications = () => {
    setStatus(prev => ({ ...prev, notifications: [] }));
  };

  // Ne pas afficher la barre si pas de service de sync
  if (!syncService) {
    return null;
  }

  const activeUsersCount = Array.isArray(status.activeUsers) ? status.activeUsers.length : 0;
  const notificationsCount = Array.isArray(status.notifications) ? status.notifications.length : 0;

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1, 
      p: 1, 
      backgroundColor: 'background.paper',
      borderTop: 1,
      borderColor: 'divider',
      minHeight: '48px'
    }}>
      {/* Statut de synchronisation */}
      <Tooltip title="Cliquer pour forcer la synchronisation">
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          onClick={handleForceSync}
          clickable
          sx={{ minWidth: '140px' }}
        />
      </Tooltip>

      {/* Utilisateurs connectés (techniciens) */}
      <Tooltip title={`${activeUsersCount} technicien(s) connecté(s)`}>
        <IconButton
          size="small"
          onClick={(e) => setUsersMenuAnchor(e.currentTarget)}
        >
          <Badge badgeContent={activeUsersCount} color="primary" max={9}>
            <OnlinePredictionIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Notifications */}
      {notificationsCount > 0 && (
        <Tooltip title="Notifications">
          <IconButton
            size="small"
            onClick={() => setNotificationsOpen(true)}
          >
            <Badge badgeContent={notificationsCount} color="error" max={9}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      )}

      {/* Menu utilisateurs actifs */}
      <Menu
        anchorEl={usersMenuAnchor}
        open={Boolean(usersMenuAnchor)}
        onClose={() => setUsersMenuAnchor(null)}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Techniciens connectés</Typography>
        </MenuItem>
        {status.activeUsers && status.activeUsers.length > 0 ? (
          status.activeUsers.map(user => (
            <MenuItem key={user.id || user.sessionId}>
              <ListItemIcon>
                <Avatar sx={{ width: 24, height: 24 }}>
                  {(user.profile?.avatar || user.name || user.id || 'U').charAt(0).toUpperCase()}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={user.profile?.fullName || user.name || user.id}
                secondary={`${user.hostname || 'Poste inconnu'} - ${user.profile?.role || 'Technicien'}`}
              />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Aucun technicien connecté
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Dialogue des notifications */}
      <Dialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Notifications de synchronisation
          <Button onClick={clearNotifications} size="small">
            Effacer tout
          </Button>
        </DialogTitle>
        <DialogContent>
          {status.notifications && status.notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Aucune notification
            </Typography>
          ) : (
            <List>
              {(status.notifications || []).slice(-10).reverse().map(notification => (
                <ListItem key={notification.id} divider>
                  <ListItemIcon>
                    {notification.type === 'error' && <WarningIcon color="error" />}
                    {notification.type === 'warning' && <WarningIcon color="warning" />}
                    {notification.type === 'success' && <CloudDoneIcon color="success" />}
                    {notification.type === 'update' && <SyncIcon color="info" />}
                    {notification.type === 'info' && <InfoIcon color="info" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary={new Date(notification.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationsOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Opérations en cours */}
      {Array.isArray(status.pendingOperations) && status.pendingOperations.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            {status.pendingOperations.length} opération(s) en cours
          </Typography>
        </Box>
      )}

      {/* Indicateur de verrouillage */}
      {Array.isArray(status.pendingOperations) && 
       status.pendingOperations.some(op => op.user && op.user.id !== syncService?.getCurrentUser()?.id) && (
        <Tooltip title="Un autre utilisateur effectue une opération">
          <LockIcon color="warning" fontSize="small" />
        </Tooltip>
      )}

      <style jsx>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .rotating {
          animation: rotate 2s linear infinite;
        }
      `}</style>
    </Box>
  );
};

export default SyncStatusBar;