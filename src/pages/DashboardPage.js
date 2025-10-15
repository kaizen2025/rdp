// src/pages/DashboardPage.js - VERSION FINALE, COMPLÈTE ET RÉORGANISÉE

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

// Icons
import DnsIcon from '@mui/icons-material/Dns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import LaptopIcon from '@mui/icons-material/Laptop';

import { useApp } from '../contexts/AppContext';
import { useElectronApi } from '../hooks/useElectronApi';

// --- SOUS-COMPOSANTS ---

const StatCard = memo(({ title, value, subtitle, color = 'primary.main', onClick }) => (
    <Card elevation={3} sx={{ height: '100%' }}>
        <CardActionArea onClick={onClick} sx={{ height: '100%', p: 2 }}>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" component="div" sx={{ color, fontWeight: 'bold', my: 0.5 }}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </CardActionArea>
    </Card>
));

const ServerStatusWidget = memo(({ serversToPing }) => {
    const [statuses, setStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (!serversToPing || serversToPing.length === 0) { setIsLoading(false); return; }
        const checkServers = async () => {
            const results = {};
            for (const server of serversToPing) {
                try { 
                    const res = await window.electronAPI.pingServer(server);
                    results[server] = res.success;
                } catch { results[server] = false; }
            }
            setStatuses(results);
            setIsLoading(false);
        };
        checkServers();
        const interval = setInterval(checkServers, 60000);
        return () => clearInterval(interval);
    }, [serversToPing]);

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}><DnsIcon sx={{ mr: 1 }} /> Statut Serveurs RDS</Typography>
            {isLoading ? <CircularProgress size={24} /> : (
                <List dense>{(serversToPing || []).map(server => (
                    <ListItem key={server} disablePadding>
                        <Chip icon={statuses[server] ? <CheckCircleIcon /> : <CancelIcon />} label={server} color={statuses[server] ? 'success' : 'error'} variant="outlined" sx={{ width: '100%', justifyContent: 'flex-start', mb: 0.5 }} />
                    </ListItem>
                ))}</List>
            )}
        </Paper>
    );
});

const ConnectedTechniciansWidget = memo(() => {
    const [technicians, setTechnicians] = useState([]);
    const calculateConnectionTime = (loginTime) => {
        if (!loginTime) return 'Récent';
        const diffMins = Math.floor((new Date() - new Date(loginTime)) / 60000);
        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `${diffMins} min`;
        return `${Math.floor(diffMins / 60)}h ${diffMins % 60}min`;
    };
    const fetchTechs = useCallback(async () => {
        try {
            const data = await window.electronAPI.getConnectedTechnicians();
            setTechnicians(data || []);
        } catch (e) { console.error(e); }
    }, []);
    useEffect(() => {
        fetchTechs();
        const interval = setInterval(fetchTechs, 15000);
        return () => clearInterval(interval);
    }, [fetchTechs]);

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}><PeopleIcon sx={{ mr: 1 }} /> Techniciens Connectés ({technicians.length})</Typography>
            <List dense>
                {technicians.length > 0 ? technicians.map(tech => (
                    <ListItem key={tech.id} disableGutters>
                        <ListItemAvatar sx={{ minWidth: 40 }}><Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>{tech.avatar}</Avatar></ListItemAvatar>
                        <ListItemText primary={tech.name} secondary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AccessTimeIcon sx={{ fontSize: 14 }} /><Typography variant="caption">{calculateConnectionTime(tech.loginTime)}</Typography></Box>} />
                    </ListItem>
                )) : <Typography variant="body2" color="text.secondary">Aucun technicien connecté.</Typography>}
            </List>
        </Paper>
    );
});

const RecentActivityWidget = memo(() => {
    const { data: activities, isLoading } = useElectronApi('getLoanHistory', { params: [{ limit: 5 }] });
    const getActivityIcon = (eventType) => ({ created: <AssignmentIcon color="success" />, returned: <CheckCircleIcon color="primary" />, extended: <TrendingUpIcon color="info" />, cancelled: <CancelIcon color="error" /> }[eventType] || <HistoryIcon />);
    const getActivityText = (act) => {
        const computer = act.computerName || 'Matériel';
        const user = act.userDisplayName || 'Utilisateur';
        return { created: `Prêt: ${computer} → ${user}`, returned: `Retour: ${computer} de ${user}`, extended: `Prolongation: ${computer}`, cancelled: `Annulation: ${computer}` }[act.eventType] || `Action sur ${computer}`;
    };

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}><HistoryIcon sx={{ mr: 1 }} /> Activité Récente</Typography>
            {isLoading ? <CircularProgress size={24} /> : (
                <List dense>
                    {(activities && activities.length > 0) ? activities.map(act => (
                        <ListItem key={act.id} disableGutters>
                            <ListItemAvatar sx={{ minWidth: 36 }}>{getActivityIcon(act.eventType)}</ListItemAvatar>
                            <ListItemText primary={<Typography variant="body2">{getActivityText(act)}</Typography>} secondary={`Par ${act.by || 'Système'}`} />
                        </ListItem>
                    )) : <Typography variant="body2" color="text.secondary">Aucune activité récente.</Typography>}
                </List>
            )}
        </Paper>
    );
});

const LoanListWidget = memo(({ title, loans, icon, navigate }) => (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>{icon}{title} ({loans.length})</Typography>
        <List dense>
            {loans.slice(0, 5).map(loan => (
                <ListItem key={loan.id} disableGutters>
                    <ListItemText primary={<Typography variant="body2">{loan.computerName}</Typography>} secondary={`${loan.userDisplayName} • Retour: ${new Date(loan.expectedReturnDate).toLocaleDateString()}`} />
                </ListItem>
            ))}
            {loans.length === 0 && <Typography variant="body2" color="text.secondary">Aucun prêt</Typography>}
        </List>
    </Paper>
));

const DashboardPage = () => {
    const navigate = useNavigate();
    const { config } = useApp();
    const { data: stats, isLoading: isLoadingStats } = useElectronApi('getLoanStatistics');
    const { data: loans, isLoading: isLoadingLoans } = useElectronApi('getLoans');

    const { activeLoans, overdueLoans } = useMemo(() => {
        if (!loans) return { activeLoans: [], overdueLoans: [] };
        return {
            activeLoans: loans.filter(l => l.status === 'active'),
            overdueLoans: loans.filter(l => l.status === 'overdue' || l.status === 'critical')
        };
    }, [loans]);

    const isLoading = isLoadingStats || isLoadingLoans;

    if (isLoading || !stats || !config) {
        return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress size={60} /></Box>);
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h4">Tableau de Bord</Typography>
                <Typography variant="body2" color="text.secondary">Vue d'ensemble de l'activité</Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12}><Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}><StatCard title="Matériel Total" value={stats.computers?.total || 0} subtitle={`${stats.computers?.available || 0} disponibles`} onClick={() => navigate('/loans', { state: { initialTab: 1 }})} /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard title="Prêts Actifs" value={stats.loans?.active || 0} subtitle={`${stats.loans?.reserved || 0} réservés`} onClick={() => navigate('/loans', { state: { initialTab: 0 }})} color="info.main" /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard title="En Retard" value={(stats.loans?.overdue || 0) + (stats.loans?.critical || 0)} subtitle={`${stats.loans?.critical || 0} critiques`} onClick={() => navigate('/loans', { state: { initialTab: 0, preFilter: 'overdue' }})} color="error.main" /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard title="Prêts (30j)" value={stats.history?.last30Days || 0} subtitle={`Durée moy: ${stats.history?.averageLoanDays || 0}j`} onClick={() => navigate('/loans', { state: { initialTab: 4 }})} /></Grid>
                </Grid></Grid>

                <Grid item xs={12} md={8}><Grid container spacing={3}>
                    <Grid item xs={12}><ServerStatusWidget serversToPing={config?.rds_servers || []} /></Grid>
                    <Grid item xs={12} md={6}><LoanListWidget title="Prêts en Retard" loans={overdueLoans} icon={<WarningIcon sx={{ mr: 1, color: 'warning.main' }} />} navigate={navigate} /></Grid>
                    <Grid item xs={12} md={6}><LoanListWidget title="Prêts Actifs" loans={activeLoans} icon={<AssignmentIcon sx={{ mr: 1, color: 'info.main' }} />} navigate={navigate} /></Grid>
                </Grid></Grid>

                <Grid item xs={12} md={4}><Grid container spacing={3}>
                    <Grid item xs={12}><ConnectedTechniciansWidget /></Grid>
                    <Grid item xs={12}><RecentActivityWidget /></Grid>
                </Grid></Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;