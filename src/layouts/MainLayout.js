// src/layouts/MainLayout.js - VERSION FINALE, COMPLÈTE ET RÉORGANISÉE

import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';

// Icons
import DnsIcon from '@mui/icons-material/Dns';
import PeopleIcon from '@mui/icons-material/People';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import LaptopChromebookIcon from '@mui/icons-material/LaptopChromebook';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ComputerIcon from '@mui/icons-material/Computer';
import ChatIcon from '@mui/icons-material/Chat';

import { useApp } from '../contexts/AppContext';

// Lazy load pages
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const SessionsPage = lazy(() => import('../pages/SessionsPage'));
const UsersManagementPage = lazy(() => import('../pages/UsersManagementPage'));
const ConnectionsPage = lazy(() => import('../pages/ConnectionsPage'));
const AdGroupsPage = lazy(() => import('../pages/AdGroupsPage'));
const ComputerLoansPage = lazy(() => import('../pages/ComputerLoansPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ChatDialog = lazy(() => import('../pages/ChatPage'));

const drawerWidth = 240;

const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
    </Box>
);

// --- LISTE DE NAVIGATION FINALE ---
const navItems = [
    { text: 'Tableau de bord', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Sessions RDS', path: '/sessions', icon: <ComputerIcon /> },
    { text: 'Utilisateurs', path: '/users', icon: <PeopleIcon /> },
    { text: 'Serveurs', path: '/servers', icon: <DnsIcon /> },
    { text: 'Groupes AD', path: '/ad-groups', icon: <GroupWorkIcon /> },
    { text: 'Gestion Prêts', path: '/loans', icon: <LaptopChromebookIcon /> },
];

function MainLayout({ onLogout, currentTechnician }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { showNotification } = useApp();
    
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [onlineTechnicians, setOnlineTechnicians] = useState([]);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [unreadLoanNotifs, setUnreadLoanNotifs] = useState(0);

    const loadOnlineTechnicians = useCallback(async () => {
        try {
            const techs = await window.electronAPI.getConnectedTechnicians();
            setOnlineTechnicians(techs || []);
        } catch (error) { console.error('Erreur chargement techniciens:', error); }
    }, []);

    const loadUnreadCounts = useCallback(async () => {
        try {
            const [loanNotifs, chatNotifs] = await Promise.all([
                window.electronAPI.getUnreadNotifications(),
                window.electronAPI['chat:getUnreadCount']()
            ]);
            setUnreadLoanNotifs(loanNotifs?.length || 0);
            setUnreadChatCount(chatNotifs || 0);
        } catch (error) { console.error('Erreur chargement notifications:', error); }
    }, []);

    useEffect(() => {
        loadOnlineTechnicians();
        loadUnreadCounts();
        
        const interval = setInterval(() => {
            loadOnlineTechnicians();
            loadUnreadCounts();
        }, 30000);

        const removeListener = window.electronAPI.onDataUpdated((data) => {
            console.log('Données mises à jour détectées:', data);
            if (data.file === 'loan_notifications.json' || data.file === 'chat.json') {
                loadUnreadCounts();
                if (data.file === 'chat.json' && !chatOpen) {
                    showNotification('info', 'Nouveau message dans le chat.');
                }
            }
            if (data.file === 'technicians_presence.json') {
                loadOnlineTechnicians();
            }
        });

        return () => {
            clearInterval(interval);
            if (removeListener) removeListener();
        };
    }, [loadOnlineTechnicians, loadUnreadCounts, showNotification, chatOpen]);

    const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
    const handleUserMenuClose = () => setUserMenuAnchor(null);

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        RDS Viewer - Anecoop
                    </Typography>

                    <Tooltip title="Historique des Actions"><IconButton color="inherit" onClick={() => navigate('/history')}><HistoryIcon /></IconButton></Tooltip>
                    <Tooltip title="Chat entre techniciens"><IconButton color="inherit" onClick={() => setChatOpen(true)}><Badge badgeContent={unreadChatCount} color="success"><ChatIcon /></Badge></IconButton></Tooltip>
                    <Tooltip title="Notifications de prêts"><IconButton color="inherit" onClick={() => navigate('/loans')}><Badge badgeContent={unreadLoanNotifs} color="error"><LaptopChromebookIcon /></Badge></IconButton></Tooltip>

                    <Tooltip title="Menu utilisateur">
                        <IconButton onClick={handleUserMenuOpen} sx={{ p: 1, ml: 1 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                                {currentTechnician?.avatar || 'IT'}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    <Menu
                        sx={{ mt: '45px' }}
                        anchorEl={userMenuAnchor}
                        open={Boolean(userMenuAnchor)}
                        onClose={handleUserMenuClose}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem disabled>
                            <ListItemText primary={currentTechnician?.name} secondary={currentTechnician?.position} />
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { navigate('/settings'); handleUserMenuClose(); }}>
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
                <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} onlineTechnicians={onlineTechnicians} />
            </Suspense>

            <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {navItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton selected={location.pathname === item.path} onClick={() => navigate(item.path)}>
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, height: '100vh', overflow: 'auto' }}>
                <Toolbar />
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/sessions" element={<SessionsPage />} />
                        <Route path="/users" element={<UsersManagementPage />} />
                        <Route path="/servers" element={<ConnectionsPage />} />
                        <Route path="/ad-groups" element={<AdGroupsPage />} />
                        <Route path="/loans" element={<ComputerLoansPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/settings" element={<SettingsPage open={location.pathname === '/settings'} onClose={() => navigate(-1)} />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Suspense>
            </Box>
        </Box>
    );
}

export default MainLayout;