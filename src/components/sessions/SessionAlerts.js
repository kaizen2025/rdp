import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Close as CloseIcon,
  NotificationsActive as AlertIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Alertes pour sessions anormales (> 24h, serveur surchargé, etc.)
 */
const SessionAlerts = ({ sessions = [], servers = [] }) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    checkForAlerts();
  }, [sessions, servers]);

  const checkForAlerts = () => {
    const newAlerts = [];
    const now = new Date();

    // Alerte 1: Sessions longue durée (> 24h)
    sessions.forEach(session => {
      if (!session.endTime) {
        const startTime = new Date(session.startTime);
        const durationHours = (now - startTime) / (1000 * 60 * 60);
        
        if (durationHours > 24) {
          newAlerts.push({
            id: `long-${session.id}`,
            type: 'long_session',
            severity: durationHours > 72 ? 'error' : 'warning',
            title: 'Session longue durée',
            message: `${session.username} - Session active depuis ${Math.floor(durationHours)}h`,
            data: session,
            timestamp: now
          });
        }
      }
    });

    // Alerte 2: Serveur surchargé (> 80% capacité)
    servers.forEach(server => {
      if (server.metrics) {
        const cpuLoad = server.metrics.cpu || 0;
        const memLoad = server.metrics.memory || 0;
        
        if (cpuLoad > 80 || memLoad > 80) {
          newAlerts.push({
            id: `overload-${server.id}`,
            type: 'server_overload',
            severity: 'error',
            title: 'Serveur surchargé',
            message: `${server.name} - CPU: ${cpuLoad}%, RAM: ${memLoad}%`,
            data: server,
            timestamp: now
          });
        }
      }
    });

    // Alerte 3: Trop de sessions simultanées sur un serveur
    const sessionsByServer = sessions.reduce((acc, session) => {
      if (!session.endTime) {
        acc[session.server] = (acc[session.server] || 0) + 1;
      }
      return acc;
    }, {});

    Object.entries(sessionsByServer).forEach(([serverName, count]) => {
      if (count > 50) {
        newAlerts.push({
          id: `concurrent-${serverName}`,
          type: 'concurrent_sessions',
          severity: 'warning',
          title: 'Trop de sessions simultanées',
          message: `${serverName} - ${count} sessions actives`,
          data: { server: serverName, count },
          timestamp: now
        });
      }
    });

    setAlerts(newAlerts);
  };

  const handleDismiss = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getSeverityColor = (severity) => {
    const colors = {
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return colors[severity] || 'default';
  };

  const getAlertIcon = (type) => {
    const icons = {
      long_session: <TimeIcon />,
      server_overload: <WarningIcon />,
      concurrent_sessions: <AlertIcon />
    };
    return icons[type] || <WarningIcon />;
  };

  if (alerts.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="success">
          ✅ Aucune alerte - Toutes les sessions sont normales
        </Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Alertes Sessions
        </Typography>
        <Badge badgeContent={alerts.length} color="error">
          <AlertIcon />
        </Badge>
      </Box>

      <List sx={{ p: 0 }}>
        {alerts.map((alert) => (
          <Paper
            key={alert.id}
            elevation={2}
            sx={{
              mb: 1,
              border: 2,
              borderColor: `${getSeverityColor(alert.severity)}.main`,
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            <ListItem
              secondaryAction={
                <Tooltip title="Ignorer">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleDismiss(alert.id)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemIcon sx={{ color: `${getSeverityColor(alert.severity)}.main` }}>
                {getAlertIcon(alert.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {alert.title}
                    </Typography>
                    <Chip
                      label={alert.severity}
                      color={getSeverityColor(alert.severity)}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" component="span" display="block">
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: fr })}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          </Paper>
        ))}
      </List>
    </Box>
  );
};

export default SessionAlerts;
