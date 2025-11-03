// src/pages/ComputerLoansPage.js - VERSION RESTRUCTURÉE

import React, { useState, useCallback, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

import { useApp } from '../contexts/AppContext';

// Icons
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import ComputerIcon from '@mui/icons-material/Computer';
import InventoryIcon from '@mui/icons-material/Inventory';

// Lazy load
const LoanList = lazy(() => import('../components/loan-management/LoanList'));
const ComputersPage = lazy(() => import('../pages/ComputersPage')); // Renommé pour la clarté
const LoansCalendar = lazy(() => import('../pages/LoansCalendar'));
const UserLoanHistoryPage = lazy(() => import('../pages/UserLoanHistoryPage'));
const ComputerLoanHistoryPage = lazy(() => import('../pages/ComputerLoanHistoryPage'));
const LoanStatisticsDialog = lazy(() => import('../components/LoanStatisticsDialog'));

const LoadingFallback = () => (<Box sx={{ p: 4, display: 'flex', justifyContent: 'center', minHeight: '50vh' }}><CircularProgress /></Box>);

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
    const { showNotification, events } = useApp();
    const location = useLocation();
    const [currentTab, setCurrentTab] = useState(location.state?.initialTab || 0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [statisticsDialogOpen, setStatisticsDialogOpen] = useState(false);
    
    const handleForceRefresh = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
        showNotification('info', 'Rafraîchissement des données en cours...');
        events.emit('force_refresh:loans');
        events.emit('force_refresh:computers');
    }, [showNotification, events]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Box sx={{ p: 2 }}>
                <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5">Gestion des Prêts et du Matériel</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Statistiques"><IconButton onClick={() => setStatisticsDialogOpen(true)}><BarChartIcon /></IconButton></Tooltip>
                            <Tooltip title="Actualiser les données"><IconButton onClick={handleForceRefresh}><RefreshIcon /></IconButton></Tooltip>
                        </Box>
                    </Box>
                </Paper>
                <Paper elevation={3}>
                    <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
                        <Tab icon={<AssignmentIcon />} iconPosition="start" label="Suivi des Prêts" />
                        <Tab icon={<InventoryIcon />} iconPosition="start" label="Inventaire Matériel" />
                        <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="Calendrier" />
                        <Tab icon={<HistoryIcon />} iconPosition="start" label="Historique" />
                    </Tabs>
                    <Suspense fallback={<LoadingFallback />}>
                        {currentTab === 0 && <LoanList key={refreshKey} preFilter={location.state?.preFilter} />}
                        {currentTab === 1 && <ComputersPage key={refreshKey} />}
                        {currentTab === 2 && <LoansCalendar key={refreshKey} />}
                        {currentTab === 3 && <HistoryTab key={refreshKey} />}
                    </Suspense>
                </Paper>
                <Suspense fallback={<div />}>
                    {statisticsDialogOpen && <LoanStatisticsDialog open={statisticsDialogOpen} onClose={() => setStatisticsDialogOpen(false)} />}
                </Suspense>
            </Box>
        </LocalizationProvider>
    );
};

export default ComputerLoansPage;