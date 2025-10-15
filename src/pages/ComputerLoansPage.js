// src/pages/ComputerLoansPage.js - VERSION FINALE, COMPLÈTE ET RÉORGANISÉE

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';

import { useApp } from '../contexts/AppContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

// Icons
import LaptopIcon from '@mui/icons-material/Laptop';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import ComputerIcon from '@mui/icons-material/Computer';

// Lazy load des "sous-pages" et dialogues
const LoanList = lazy(() => import('../components/loan-management/LoanList'));
const ComputerList = lazy(() => import('../components/loan-management/ComputerList'));
const LoansCalendar = lazy(() => import('../pages/LoansCalendar'));
const UserLoanHistoryPage = lazy(() => import('../pages/UserLoanHistoryPage'));
const ComputerLoanHistoryPage = lazy(() => import('../pages/ComputerLoanHistoryPage'));
const LoanNotificationsPanel = lazy(() => import('../components/LoanNotificationsPanel'));
const LoanStatisticsDialog = lazy(() => import('../components/LoanStatisticsDialog'));

const LoadingFallback = () => (
    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
    </Box>
);

// --- NOUVEAU COMPOSANT POUR L'ONGLET HISTORIQUE UNIFIÉ ---
const HistoryTab = ({ refreshKey }) => {
    const [subTab, setSubTab] = useState(0);
    return (
        <Box>
            <Paper elevation={2} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={subTab} onChange={(e, v) => setSubTab(v)} centered>
                    <Tab icon={<PersonSearchIcon />} iconPosition="start" label="Par Utilisateur" />
                    <Tab icon={<ComputerIcon />} iconPosition="start" label="Par Matériel" />
                </Tabs>
            </Paper>
            <Box sx={{ pt: 2 }}>
                {subTab === 0 && <UserLoanHistoryPage key={refreshKey} />}
                {subTab === 1 && <ComputerLoanHistoryPage key={refreshKey} />}
            </Box>
        </Box>
    );
};

const ComputerLoansPage = () => {
    const { showNotification } = useApp();
    const [currentTab, setCurrentTab] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [statisticsDialogOpen, setStatisticsDialogOpen] = useState(false);
    const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await window.electronAPI.getUnreadNotifications();
            setNotifications(data || []);
        } catch (error) { console.error('Erreur chargement notifications:', error); }
    }, []);

    useEffect(() => {
        loadNotifications();
        const removeListener = window.electronAPI.onDataUpdated((data) => {
            if (data.file === 'loans.json' || data.file === 'computers_stock.json' || data.file === 'accessories_config.json') {
                setRefreshKey(prevKey => prevKey + 1);
            }
            if (data.file === 'loan_notifications.json') {
                loadNotifications();
            }
        });
        return () => { if (removeListener) removeListener(); };
    }, [loadNotifications]);

    const handleForceRefresh = () => {
        setRefreshKey(prevKey => prevKey + 1);
        showNotification('info', 'Rafraîchissement des données en cours...');
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Box sx={{ p: 2 }}>
                <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5">Gestion des Prêts</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Statistiques"><IconButton onClick={() => setStatisticsDialogOpen(true)}><BarChartIcon /></IconButton></Tooltip>
                            <Tooltip title="Notifications"><IconButton onClick={() => setNotificationsPanelOpen(true)}><Badge badgeContent={notifications.length} color="error"><NotificationsIcon /></Badge></IconButton></Tooltip>
                            <Tooltip title="Actualiser les données"><IconButton onClick={handleForceRefresh}><RefreshIcon /></IconButton></Tooltip>
                        </Box>
                    </Box>
                </Paper>

                <Paper elevation={3}>
                    <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
                        <Tab icon={<AssignmentIcon />} iconPosition="start" label="Suivi des Prêts" />
                        <Tab icon={<LaptopIcon />} iconPosition="start" label="Inventaire Matériel" />
                        <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="Calendrier" />
                        <Tab icon={<HistoryIcon />} iconPosition="start" label="Historique" />
                    </Tabs>
                    
                    <Suspense fallback={<LoadingFallback />}>
                        {currentTab === 0 && <LoanList key={refreshKey} />}
                        {currentTab === 1 && <ComputerList key={refreshKey} />}
                        {currentTab === 2 && <LoansCalendar key={refreshKey} />}
                        {currentTab === 3 && <HistoryTab key={refreshKey} />}
                    </Suspense>
                </Paper>

                <Suspense fallback={<div />}>
                    {statisticsDialogOpen && <LoanStatisticsDialog open={statisticsDialogOpen} onClose={() => setStatisticsDialogOpen(false)} />}
                    {notificationsPanelOpen && <LoanNotificationsPanel open={notificationsPanelOpen} onClose={() => setNotificationsPanelOpen(false)} onNotificationClick={loadNotifications} />}
                </Suspense>
            </Box>
        </LocalizationProvider>
    );
};

export default ComputerLoansPage;