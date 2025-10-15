import React, { useState, useEffect, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import UpdateIcon from '@mui/icons-material/Update';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const NOTIFICATION_TYPE_CONFIG = {
    reminder_before: {
        icon: <InfoIcon />,
        color: 'info',
        label: 'Rappel',
    },
    overdue: {
        icon: <WarningIcon />,
        color: 'warning',
        label: 'En retard',
    },
    critical: {
        icon: <ErrorIcon />,
        color: 'error',
        label: 'Critique',
    },
    returned: {
        icon: <CheckCircleIcon />,
        color: 'success',
        label: 'Retourné',
    },
    extended: {
        icon: <UpdateIcon />,
        color: 'info',
        label: 'Prolongé',
    },
};

const NotificationItem = ({ notification, onMarkAsRead, onNavigate }) => {
    const config = NOTIFICATION_TYPE_CONFIG[notification.type] || {
        icon: <NotificationsIcon />,
        color: 'default',
        label: 'Notification',
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString();
    };

    return (
        <ListItem
            sx={{
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                borderLeft: notification.read ? 'none' : `4px solid`,
                borderColor: `${config.color}.main`,
                mb: 1,
                borderRadius: 1,
            }}
            secondaryAction={
                !notification.read && (
                    <IconButton
                        edge="end"
                        size="small"
                        onClick={() => onMarkAsRead(notification.id)}
                        title="Marquer comme lu"
                    >
                        <CheckCircleIcon />
                    </IconButton>
                )
            }
        >
            <ListItemIcon>
                {React.cloneElement(config.icon, { color: config.color })}
            </ListItemIcon>
            <ListItemText
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip label={config.label} size="small" color={config.color} />
                        <Typography variant="caption" color="textSecondary">
                            {formatDate(notification.date)}
                        </Typography>
                    </Box>
                }
                secondary={
                    <Box>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>{notification.computerName}</strong> - {notification.userDisplayName || notification.userName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {getNotificationMessage(notification)}
                        </Typography>
                    </Box>
                }
            />
        </ListItem>
    );
};

function getNotificationMessage(notification) {
    const { type, details } = notification;
    
    switch (type) {
        case 'reminder_before':
            return `Retour prévu le ${new Date(details.expectedReturnDate).toLocaleDateString()}`;
        
        case 'overdue':
            return `En retard de ${details.daysOverdue} jour(s)`;
        
        case 'critical':
            return `Retard critique : ${details.daysOverdue} jour(s)`;
        
        case 'returned':
            return `Retourné avec succès`;
        
        case 'extended':
            return `Prolongé jusqu'au ${new Date(details.newReturnDate).toLocaleDateString()}`;
        
        default:
            return '';
    }
}

const LoanNotificationsPanel = ({ open, onClose, onNotificationClick }) => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState(0); // 0: Non lues, 1: Toutes

    useEffect(() => {
        if (open) {
            loadNotifications();
        }
    }, [open]);

    const loadNotifications = async () => {
        setIsLoading(true);
        try {
            const result = await window.electronAPI.getNotifications();
            setNotifications(result.notifications || []);
        } catch (error) {
            console.error('Erreur chargement notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await window.electronAPI.markNotificationAsRead(notificationId);
            await loadNotifications();
        } catch (error) {
            console.error('Erreur marquage notification:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await window.electronAPI.markAllNotificationsAsRead();
            await loadNotifications();
        } catch (error) {
            console.error('Erreur marquage toutes notifications:', error);
        }
    };

    const filteredNotifications = useMemo(() => {
        if (currentTab === 0) {
            return notifications.filter(n => !n.read);
        }
        return notifications;
    }, [notifications, currentTab]);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.read).length;
    }, [notifications]);

    const groupedNotifications = useMemo(() => {
        const groups = {
            critical: [],
            overdue: [],
            reminder: [],
            other: [],
        };

        filteredNotifications.forEach(notif => {
            if (notif.type === 'critical') {
                groups.critical.push(notif);
            } else if (notif.type === 'overdue') {
                groups.overdue.push(notif);
            } else if (notif.type === 'reminder_before') {
                groups.reminder.push(notif);
            } else {
                groups.other.push(notif);
            }
        });

        return groups;
    }, [filteredNotifications]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsActiveIcon />
                        Notifications de prêts
                        {unreadCount > 0 && (
                            <Chip 
                                label={unreadCount} 
                                color="error" 
                                size="small"
                            />
                        )}
                    </Box>
                    {unreadCount > 0 && (
                        <Button
                            startIcon={<DoneAllIcon />}
                            onClick={handleMarkAllAsRead}
                            size="small"
                        >
                            Tout marquer comme lu
                        </Button>
                    )}
                </Box>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
                    <Tab 
                        label={`Non lues (${unreadCount})`}
                        icon={<NotificationsActiveIcon />}
                        iconPosition="start"
                    />
                    <Tab 
                        label={`Toutes (${notifications.length})`}
                        icon={<NotificationsIcon />}
                        iconPosition="start"
                    />
                </Tabs>
            </Box>

            <DialogContent>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredNotifications.length === 0 ? (
                    <Alert severity="info" icon={<InfoIcon />}>
                        {currentTab === 0 
                            ? 'Aucune notification non lue' 
                            : 'Aucune notification'}
                    </Alert>
                ) : (
                    <Box>
                        {groupedNotifications.critical.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="error" gutterBottom>
                                    <ErrorIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1.2rem' }} />
                                    Retards critiques ({groupedNotifications.critical.length})
                                </Typography>
                                <List dense>
                                    {groupedNotifications.critical.map(notif => (
                                        <NotificationItem
                                            key={notif.id}
                                            notification={notif}
                                            onMarkAsRead={handleMarkAsRead}
                                            onNavigate={onNotificationClick}
                                        />
                                    ))}
                                </List>
                            </Box>
                        )}

                        {groupedNotifications.overdue.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                    <WarningIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1.2rem' }} />
                                    En retard ({groupedNotifications.overdue.length})
                                </Typography>
                                <List dense>
                                    {groupedNotifications.overdue.map(notif => (
                                        <NotificationItem
                                            key={notif.id}
                                            notification={notif}
                                            onMarkAsRead={handleMarkAsRead}
                                            onNavigate={onNotificationClick}
                                        />
                                    ))}
                                </List>
                            </Box>
                        )}

                        {groupedNotifications.reminder.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="info.main" gutterBottom>
                                    <AccessTimeIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1.2rem' }} />
                                    Rappels ({groupedNotifications.reminder.length})
                                </Typography>
                                <List dense>
                                    {groupedNotifications.reminder.map(notif => (
                                        <NotificationItem
                                            key={notif.id}
                                            notification={notif}
                                            onMarkAsRead={handleMarkAsRead}
                                            onNavigate={onNotificationClick}
                                        />
                                    ))}
                                </List>
                            </Box>
                        )}

                        {groupedNotifications.other.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                    <InfoIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1.2rem' }} />
                                    Autres ({groupedNotifications.other.length})
                                </Typography>
                                <List dense>
                                    {groupedNotifications.other.map(notif => (
                                        <NotificationItem
                                            key={notif.id}
                                            notification={notif}
                                            onMarkAsRead={handleMarkAsRead}
                                            onNavigate={onNotificationClick}
                                        />
                                    ))}
                                </List>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fermer</Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoanNotificationsPanel;