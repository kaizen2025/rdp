import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Warning as WarningIcon,
  EventBusy as ExpiredIcon,
  Event as EventIcon,
  Build as MaintenanceIcon,
  Notifications as NotifIcon
} from '@mui/icons-material';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Système d'alertes pour garantie expirée et maintenance préventive
 */
const EquipmentAlerts = ({ equipment = [] }) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    checkAlerts();
  }, [equipment]);

  const checkAlerts = () => {
    const now = new Date();
    const newAlerts = [];

    equipment.forEach(item => {
      // Alerte garantie
      if (item.warrantyEndDate) {
        const warrantyEnd = new Date(item.warrantyEndDate);
        const daysUntilExpiry = differenceInDays(warrantyEnd, now);

        if (daysUntilExpiry < 0) {
          newAlerts.push({
            id: `warranty-expired-${item.id}`,
            type: 'warranty_expired',
            severity: 'error',
            title: 'Garantie expirée',
            equipment: item,
            message: `${item.name || item.computerName} - Expirée depuis ${Math.abs(daysUntilExpiry)} jours`,
            date: warrantyEnd
          });
        } else if (daysUntilExpiry <= 30) {
          newAlerts.push({
            id: `warranty-expiring-${item.id}`,
            type: 'warranty_expiring',
            severity: 'warning',
            title: 'Garantie expire bientôt',
            equipment: item,
            message: `${item.name || item.computerName} - Expire dans ${daysUntilExpiry} jours`,
            date: warrantyEnd
          });
        }
      }

      // Alerte maintenance préventive
      if (item.lastMaintenance) {
        const lastMaintenance = new Date(item.lastMaintenance);
        const daysSinceMaintenance = differenceInDays(now, lastMaintenance);
        const maintenanceInterval = item.maintenanceIntervalDays || 180; // 6 mois par défaut

        if (daysSinceMaintenance >= maintenanceInterval) {
          newAlerts.push({
            id: `maintenance-due-${item.id}`,
            type: 'maintenance_due',
            severity: 'warning',
            title: 'Maintenance requise',
            equipment: item,
            message: `${item.name || item.computerName} - Dernière maintenance il y a ${daysSinceMaintenance} jours`,
            date: lastMaintenance
          });
        }
      }
    });

    // Trier par sévérité et date
    newAlerts.sort((a, b) => {
      if (a.severity === 'error' && b.severity !== 'error') return -1;
      if (a.severity !== 'error' && b.severity === 'error') return 1;
      return a.date - b.date;
    });

    setAlerts(newAlerts);
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
      warranty_expired: <ExpiredIcon />,
      warranty_expiring: <EventIcon />,
      maintenance_due: <MaintenanceIcon />
    };
    return icons[type] || <WarningIcon />;
  };

  const getAlertStats = () => {
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'error').length,
      warning: alerts.filter(a => a.severity === 'warning').length
    };
  };

  const stats = getAlertStats();

  if (alerts.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="success" icon={<NotifIcon />}>
          <Typography variant="body2">
            ✅ Aucune alerte - Tout le matériel est à jour
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Alertes Matériel
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Badge badgeContent={stats.critical} color="error">
            <Chip label="Critiques" color="error" size="small" />
          </Badge>
          <Badge badgeContent={stats.warning} color="warning">
            <Chip label="Avertissements" color="warning" size="small" />
          </Badge>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        {stats.total} alerte(s) détectée(s) - Vérifiez votre parc informatique
      </Alert>

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
            <ListItem>
              <ListItemIcon sx={{ color: `${getSeverityColor(alert.severity)}.main` }}>
                {getAlertIcon(alert.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {alert.title}
                    </Typography>
                    <Chip
                      label={alert.severity === 'error' ? 'Critique' : 'Avertissement'}
                      color={getSeverityColor(alert.severity)}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" component="span" display="block" gutterBottom>
                      {alert.message}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                      {alert.equipment.serialNumber && (
                        <Chip
                          label={`SN: ${alert.equipment.serialNumber}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {alert.equipment.model && (
                        <Chip
                          label={alert.equipment.model}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      <Chip
                        label={format(alert.date, 'dd MMM yyyy', { locale: fr })}
                        size="small"
                        variant="outlined"
                        icon={<EventIcon />}
                      />
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          </Paper>
        ))}
      </List>

      <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
        <Typography variant="caption" color="text.secondary">
          💡 <strong>Conseil :</strong> Planifiez les maintenances et les renouvellements de garantie
          en avance pour éviter les interruptions de service.
        </Typography>
      </Paper>
    </Box>
  );
};

export default EquipmentAlerts;
