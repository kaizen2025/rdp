// src/pages/DashboardPage.js - VERSION FINALE, STABILISÉE ET SANS AVERTISSEMENTS

import React, { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, Card, CardActionArea, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, CircularProgress, Tooltip } from '@mui/material';

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

import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';
import useDataFetching from '../hooks/useDataFetching';

const StatCard = memo(({ title, value, subtitle, color = 'primary.main', onClick, isLoading }) => (
    <Card elevation={3} sx={{ height: '100%' }}>
        <CardActionArea onClick={onClick} sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            {isLoading ? <CircularProgress size={36} sx={{ my: 1 }} /> : <Typography variant="h4" component="div" sx={{ color, fontWeight: 'bold', my: 0.5 }}>{value}</Typography>}
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </CardActionArea>
    </Card>
));

const ServerStatusWidget = memo(({ serversToPing }) => {
    const fetchStatuses = useCallback(async () => {
        if (!serversToPing || serversToPing.length === 0) return [];
        return Promise.all(serversToPing.map(async server => {
            try {
                const res = await apiService.pingRdsServer(server);
                return { server, online: res.success, message: res.output };
            } catch (err) { return { server, online: false, message: err.message }; }
        }));
    }, [serversToPing]);

    const { data: statuses, isLoading } = useDataFetching(fetchStatuses, { refreshInterval: 60000 });

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}><DnsIcon sx={{ mr: 1 }} /> Statut Serveurs RDS</Typography>
            {isLoading && !statuses ? <CircularProgress size={24} /> : (
                <List dense>{(statuses || []).map(({ server, online, message }) => (
                    <ListItem key={server} disablePadding><Tooltip title={message || 'Vérification...'} placement="right"><Chip icon={online ? <CheckCircleIcon /> : <CancelIcon />} label={server} color={online ? 'success' : 'error'} variant="outlined" sx={{ width: '100%', justifyContent: 'flex-start', mb: 0.5 }} /></Tooltip></ListItem>
                ))}</List>
            )}
        </Paper>
    );
});

const ConnectedTechniciansWidget = memo(() => {
    const { data: technicians, isLoading } = useDataFetching(apiService.getConnectedTechnicians, { refreshInterval: 15000, entityName: 'technicians' });
    const calculateConnectionTime = (loginTime) => {
        if (!loginTime) return 'Récent';
        const diffMins = Math.floor((new Date() - new Date(loginTime)) / 60000);
        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `${diffMins} min`;
        return `${Math.floor(diffMins / 60)}h ${diffMins % 60}min`;
    };

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}><PeopleIcon sx={{ mr: 1 }} /> Techniciens Connectés ({technicians?.length || 0})</Typography>
            {isLoading && !technicians ? <CircularProgress size={24} /> : (
                <List dense>
                    {technicians?.length > 0 ? technicians.map(tech => (
                        <ListItem key={tech.id} disableGutters><ListItemAvatar sx={{ minWidth: 40 }}><Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>{tech.avatar}</Avatar></ListItemAvatar><ListItemText primary={tech.name} secondary={<Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AccessTimeIcon sx={{ fontSize: 14 }} /><Typography variant="caption">{calculateConnectionTime(tech.loginTime)}</Typography></Box>} /></ListItem>
                    )) : <Typography variant="body2" color="text.secondary">Aucun technicien connecté.</Typography>}
                </List>
            )}
        </Paper>
    );
});

const RecentActivityWidget = memo(() => {
    const { data: activities, isLoading } = useDataFetching(() => apiService.getLoanHistory({ limit: 5 }), { entityName: 'loan_history' });
    const getActivityIcon = (e) => ({ created: <AssignmentIcon color="success" />, returned: <CheckCircleIcon color="primary" />, extended: <TrendingUpIcon color="info" />, cancelled: <CancelIcon color="error" /> }[e] || <HistoryIcon />);
    const getActivityText = (act) => {
        const action = { created: 'Prêt', returned: 'Retour', extended: 'Prolongation', cancelled: 'Annulation' }[act.eventType] || 'Action';
        return `${action}: ${act.computerName || 'N/A'} pour ${act.userDisplayName || 'N/A'}`;
    };

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}><HistoryIcon sx={{ mr: 1 }} /> Activité Récente</Typography>
            {isLoading && !activities ? <CircularProgress size={24} /> : (
                <List dense>
                    {activities?.length > 0 ? activities.map(act => (
                        <ListItem key={act.id} disableGutters><ListItemAvatar sx={{ minWidth: 36 }}>{getActivityIcon(act.eventType)}</ListItemAvatar><ListItemText primary={<Typography variant="body2">{getActivityText(act)}</Typography>} secondary={`Par ${act.by || 'Système'}`} /></ListItem>
                    )) : <Typography variant="body2" color="text.secondary">Aucune activité récente.</Typography>}
                </List>
            )}
        </Paper>
    );
});

const DashboardPage = () => {
    const navigate = useNavigate();
    const { config, isInitializing } = useApp();
    const { data: stats, isLoading: isLoadingStats } = useDataFetching(apiService.getLoanStatistics, { entityName: 'loans' });
    const { data: loans, isLoading: isLoadingLoans } = useDataFetching(apiService.getLoans, { entityName: 'loans' });

    const { activeLoans, overdueLoans } = useMemo(() => {
        if (!loans) return { activeLoans: [], overdueLoans: [] };
        return {
            activeLoans: loans.filter(l => l.status === 'active'),
            overdueLoans: loans.filter(l => l.status === 'overdue' || l.status === 'critical')
        };
    }, [loans]);

    if (isInitializing) {
        return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress size={60} /></Box>);
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}><Typography variant="h4">Tableau de Bord</Typography><Typography variant="body2" color="text.secondary">Vue d'ensemble de l'activité</Typography></Box>
            <Grid container spacing={3}>
                <Grid item xs={12}><Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}><StatCard title="Matériel Total" value={stats?.computers?.total ?? 0} subtitle={`${stats?.computers?.available ?? 0} disponibles`} isLoading={isLoadingStats} onClick={() => navigate('/loans', { state: { initialTab: 1 }})} /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard title="Prêts Actifs" value={stats?.loans?.active ?? 0} subtitle={`${stats?.loans?.reserved ?? 0} réservés`} isLoading={isLoadingStats} onClick={() => navigate('/loans', { state: { initialTab: 0 }})} color="info.main" /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard title="En Retard" value={(stats?.loans?.overdue ?? 0) + (stats?.loans?.critical ?? 0)} subtitle={`${stats?.loans?.critical ?? 0} critiques`} isLoading={isLoadingStats} onClick={() => navigate('/loans', { state: { initialTab: 0, preFilter: 'overdue' }})} color="error.main" /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard title="Prêts (Total)" value={stats?.history?.totalLoans ?? 0} isLoading={isLoadingStats} onClick={() => navigate('/loans', { state: { initialTab: 3 }})} /></Grid>
                </Grid></Grid>
                <Grid item xs={12} md={8}><Grid container spacing={3}>
                    <Grid item xs={12}><ServerStatusWidget serversToPing={config?.rds_servers || []} /></Grid>
                    <Grid item xs={12} md={6}><Paper elevation={3} sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}><WarningIcon sx={{ mr: 1, color: 'warning.main' }} />Prêts en Retard ({overdueLoans.length})</Typography>{isLoadingLoans ? <CircularProgress size={24}/> : <List dense>{overdueLoans.slice(0,5).map(l => <ListItem key={l.id} disableGutters><ListItemText primary={<Typography variant="body2">{l.computerName}</Typography>} secondary={`${l.userDisplayName} • Retour: ${new Date(l.expectedReturnDate).toLocaleDateString()}`} /></ListItem>)}</List>}</Paper></Grid>
                    <Grid item xs={12} md={6}><Paper elevation={3} sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}><AssignmentIcon sx={{ mr: 1, color: 'info.main' }} />Prêts Actifs ({activeLoans.length})</Typography>{isLoadingLoans ? <CircularProgress size={24}/> : <List dense>{activeLoans.slice(0,5).map(l => <ListItem key={l.id} disableGutters><ListItemText primary={<Typography variant="body2">{l.computerName}</Typography>} secondary={`${l.userDisplayName} • Retour: ${new Date(l.expectedReturnDate).toLocaleDateString()}`} /></ListItem>)}</List>}</Paper></Grid>
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