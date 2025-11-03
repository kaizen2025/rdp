// src/layouts/MainLayout.js - VERSION DÉFINITIVE AVEC NAVIGATION HORIZONTALE ET CORRECTIONS

import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
    Box, AppBar, Toolbar, Typography, IconButton, Tooltip, Menu, MenuItem,
    Badge, Chip, Avatar, Divider, Paper, Tabs, Tab, Collapse, Alert,
    ListItemIcon, ListItemText, CircularProgress // ✅ IMPORT MANQUANT AJOUTÉ
} from '@mui/material';

// Icons
import {
    Dns as DnsIcon, People as PeopleIcon, GroupWork as GroupWorkIcon,
    LaptopChromebook as LaptopChromebookIcon, Settings as SettingsIcon, Logout as LogoutIcon,
    Dashboard as DashboardIcon, Computer as ComputerIcon, Chat as ChatIcon,
    Notifications as NotificationsIcon, SmartToy as SmartToyIcon
} from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages'; // ✅ NOUVEAU
import apiService from '../services/apiService';

// Lazy load pages
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const SessionsPage = lazy(() => import('../pages/SessionsPage'));
const UsersManagementPage = lazy(() => import('../pages/UsersManagementPage'));
const ConnectionsPage = lazy(() => import('../pages/ConnectionsPage'));
const AdGroupsPage = lazy(() => import('../pages/AdGroupsPage'));
const ComputerLoansPage = lazy(() => import('../pages/ComputerLoansPage'));
const AIAssistantPage = lazy(() => import('../pages/AIAssistantPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ChatDialog = lazy(() => import('../pages/ChatPage'));
const NotificationsPanel = lazy(() => import('../components/NotificationsPanel'));

const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 180px)' }}>
        <CircularProgress />
    </Box>
);

const navItems = [
    { text: 'Tableau de bord', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Sessions RDS', path: '/sessions', icon: <ComputerIcon /> },
    { text: 'Utilisateurs', path: '/users', icon: <PeopleIcon /> },
    { text: 'Serveurs', path: '/servers', icon: <DnsIcon /> },
    { text: 'Groupes AD', path: '/ad-groups', icon: <GroupWorkIcon /> },
    { text: 'Gestion Prêts', path: '/loans', icon: <LaptopChromebookIcon /> },
    { text: 'Assistant IA', path: '/ai-assistant', icon: <SmartToyIcon /> },
];

function MainLayout({ onLogout, currentTechnician, onChatClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { events, isOnline, notifications: toastNotifications } = useApp();
    const { unreadCount } = useUnreadMessages(); // ✅ NOUVEAU hook pour messages non lus
    
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
    const [onlineTechnicians, setOnlineTechnicians] = useState([]);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
    const [activeSessionsCount, setActiveSessionsCount] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const currentTab = navItems.findIndex(item => location.pathname.startsWith(item.path));

    const refreshData = useCallback(async () => {
        try {
            const [techs, notifs, sessions] = await Promise.all([
                apiService.getConnectedTechnicians().catch(() => []),
                apiService.getUnreadNotifications().catch(() => []),
                apiService.getRdsSessions().catch(() => []),
            ]);
            
            setOnlineTechnicians(Array.isArray(techs) ? techs : []);
            setUnreadNotifsCount(Array.isArray(notifs) ? notifs.length : 0);
            setActiveSessionsCount(Array.isArray(sessions) ? sessions.filter(s => s.isActive).length : 0);
        } catch (error) { 
            console.error('Erreur rafraîchissement données layout:', error); 
        }
    }, []);

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 30000);
        const unsubscribe = events.on('data_updated', refreshData);
        return () => { clearInterval(interval); unsubscribe(); };
    }, [refreshData, events]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        RDS Viewer - Anecoop
                    </Typography>

                    <Chip label={isOnline ? "En ligne" : "Hors ligne"} color={isOnline ? "success" : "error"} size="small" sx={{ mr: 2 }} />
                    <Tooltip title={`${activeSessionsCount} session(s) active(s)`}><Chip icon={<ComputerIcon />} label={activeSessionsCount} color="primary" size="small" sx={{ mr: 2 }} onClick={() => navigate('/sessions')} /></Tooltip>

                    <Tooltip title="Chat"><IconButton color="inherit" onClick={() => { setChatOpen(true); if (onChatClick) onChatClick(); }}><Badge badgeContent={unreadCount} color="error"><ChatIcon /></Badge></IconButton></Tooltip>
                    <Tooltip title="Notifications"><IconButton color="inherit" onClick={() => setNotificationsPanelOpen(true)}><Badge badgeContent={unreadNotifsCount} color="error"><NotificationsIcon /></Badge></IconButton></Tooltip>
                    
                    <Tooltip title="Menu utilisateur"><IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} sx={{ p: 1, ml: 1 }}><Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>{currentTechnician?.avatar || 'IT'}</Avatar></IconButton></Tooltip>
                    <Menu 
                        anchorEl={userMenuAnchor} 
                        open={Boolean(userMenuAnchor)} 
                        onClose={() => setUserMenuAnchor(null)}
                        sx={{ mt: '45px' }}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem disabled>
                            <ListItemText primary={currentTechnician?.name} secondary={currentTechnician?.position} />
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { setSettingsOpen(true); setUserMenuAnchor(null); }}>
                            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>Paramètres</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={onLogout}>
                            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>Déconnexion</ListItemText>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Suspense fallback={<div />}>
                {chatOpen && <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} onlineTechnicians={onlineTechnicians} />}
                {settingsOpen && <SettingsPage open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
                {notificationsPanelOpen && <NotificationsPanel open={notificationsPanelOpen} onClose={() => setNotificationsPanelOpen(false)} onUpdate={refreshData} />}
            </Suspense>

            <Box component="main" sx={{ flexGrow: 1, pt: '64px', display: 'flex', flexDirection: 'column' }}>
                <Paper square elevation={1} sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: '64px', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Tabs
                        value={currentTab === -1 ? false : currentTab}
                        onChange={(event, newValue) => navigate(navItems[newValue].path)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                    >
                        {navItems.map((item) => (
                            <Tab key={item.path} label={item.text} icon={item.icon} iconPosition="start" />
                        ))}
                    </Tabs>
                </Paper>

                <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, overflow: 'auto' }}>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/sessions" element={<SessionsPage />} />
                            <Route path="/users" element={<UsersManagementPage />} />
                            <Route path="/servers" element={<ConnectionsPage />} />
                            <Route path="/ad-groups" element={<AdGroupsPage />} />
                            <Route path="/loans" element={<ComputerLoansPage />} />
                            <Route path="/ai-assistant" element={<AIAssistantPage />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </Suspense>
                </Box>
            </Box>

            <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: (theme) => theme.zIndex.snackbar, width: 320 }}>
                {toastNotifications.map((notification) => (
                    <Collapse key={notification.id}>
                        <Alert 
                            severity={notification.type} 
                            sx={{ mb: 1, boxShadow: 3 }} 
                            onClose={() => { /* La fermeture est gérée par le timeout dans AppContext */ }}
                        >
                            {notification.message}
                        </Alert>
                    </Collapse>
                ))}
            </Box>
        </Box>
    );
}

export default MainLayout;