// src/pages/DashboardPage.js - VERSION MODERNISÉE AVEC NOUVEAUX COMPOSANTS

import React, { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, ListItemAvatar, CircularProgress, Tooltip, Chip, Avatar } from '@mui/material';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import DnsIcon from '@mui/icons-material/Dns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import LaptopChromebookIcon from '@mui/icons-material/LaptopChromebook';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';
import useDataFetching from '../hooks/useDataFetching';

// Nouveaux composants
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import LoadingScreen from '../components/common/LoadingScreen';

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
        <Paper elevation={2} sx={{ p: 2.5, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <DnsIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                Statut Serveurs RDS
            </Typography>
            {isLoading && !statuses ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <List dense>
                    {(statuses || []).map(({ server, online, message }) => (
                        <ListItem key={server} disablePadding sx={{ mb: 0.5 }}>
                            <Tooltip title={message || 'Vérification...'} placement="right" arrow>
                                <Chip
                                    icon={online ? <CheckCircleIcon /> : <CancelIcon />}
                                    label={server}
                                    color={online ? 'success' : 'error'}
                                    variant={online ? 'filled' : 'outlined'}
                                    sx={{ width: '100%', justifyContent: 'flex-start', fontWeight: 500 }}
                                />
                            </Tooltip>
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
});

const ConnectedTechniciansWidget = memo(() => {
    const { data: technicians, isLoading } = useDataFetching(apiService.getConnectedTechnicians, {
        refreshInterval: 15000,
        entityName: 'technicians'
    });

    const calculateConnectionTime = (loginTime) => {
        if (!loginTime) return 'Récent';
        const diffMins = Math.floor((new Date() - new Date(loginTime)) / 60000);
        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `${diffMins} min`;
        return `${Math.floor(diffMins / 60)}h ${diffMins % 60}min`;
    };

    return (
        <Paper elevation={2} sx={{ p: 2.5, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <PeopleIcon sx={{ mr: 1.5, color: 'secondary.main' }} />
                Techniciens ({technicians?.length || 0})
            </Typography>
            {isLoading && !technicians ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <List dense>
                    {technicians?.length > 0 ? technicians.map(tech => (
                        <ListItem key={tech.id} disableGutters sx={{ py: 0.5 }}>
                            <ListItemAvatar sx={{ minWidth: 44 }}>
                                <Avatar sx={{
                                    width: 36,
                                    height: 36,
                                    fontSize: '0.875rem',
                                    bgcolor: 'secondary.main'
                                }}>
                                    {tech.avatar}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={<Typography variant="body2" fontWeight={500}>{tech.name}</Typography>}
                                secondary={
                                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AccessTimeIcon sx={{ fontSize: 14 }} />
                                        <Typography variant="caption">
                                            {calculateConnectionTime(tech.loginTime)}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    )) : (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                            Aucun technicien connecté
                        </Typography>
                    )}
                </List>
            )}
        </Paper>
    );
});

const RecentActivityWidget = memo(() => {
    const { data: activities, isLoading } = useDataFetching(
        () => apiService.getLoanHistory({ limit: 5 }),
        { entityName: 'loan_history' }
    );

    const getActivityIcon = (e) => ({
        created: <AssignmentIcon color="success" />,
        returned: <CheckCircleIcon color="primary" />,
        extended: <TrendingUpIcon color="info" />,
        cancelled: <CancelIcon color="error" />
    }[e] || <HistoryIcon />);

    const getActivityText = (act) => {
        const action = {
            created: 'Prêt',
            returned: 'Retour',
            extended: 'Prolongation',
            cancelled: 'Annulation'
        }[act.eventType] || 'Action';
        return `${action}: ${act.computerName || 'N/A'} pour ${act.userDisplayName || 'N/A'}`;
    };

    return (
        <Paper elevation={2} sx={{ p: 2.5, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <HistoryIcon sx={{ mr: 1.5, color: 'info.main' }} />
                Activité Récente
            </Typography>
            {isLoading && !activities ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <List dense>
                    {activities?.length > 0 ? activities.map(act => (
                        <ListItem key={act.id} disableGutters sx={{ py: 0.5 }}>
                            <ListItemAvatar sx={{ minWidth: 40 }}>
                                {getActivityIcon(act.eventType)}
                            </ListItemAvatar>
                            <ListItemText
                                primary={<Typography variant="body2">{getActivityText(act)}</Typography>}
                                secondary={<Typography variant="caption">Par {act.by || 'Système'}</Typography>}
                            />
                        </ListItem>
                    )) : (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                            Aucune activité récente
                        </Typography>
                    )}
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
        return <LoadingScreen type="dashboard" />;
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* Header Moderne */}
            <PageHeader
                title="Tableau de Bord"
                subtitle="Vue d'ensemble de l'activité RDS et gestion des prêts"
                icon={DashboardIcon}
                stats={[
                    {
                        label: 'Ordinateurs',
                        value: stats?.computers?.total ?? 0,
                        icon: LaptopChromebookIcon
                    },
                    {
                        label: 'Prêts actifs',
                        value: stats?.loans?.active ?? 0,
                        icon: EventAvailableIcon
                    },
                    {
                        label: 'En retard',
                        value: (stats?.loans?.overdue ?? 0) + (stats?.loans?.critical ?? 0),
                        icon: WarningIcon
                    }
                ]}
            />

            <Grid container spacing={3}>
                {/* Stats Cards */}
                <Grid item xs={12}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Matériel Total"
                                value={stats?.computers?.total ?? 0}
                                subtitle={`${stats?.computers?.available ?? 0} disponibles`}
                                icon={LaptopChromebookIcon}
                                color="primary"
                                loading={isLoadingStats}
                                onClick={() => navigate('/loans', { state: { initialTab: 1 }})}
                                tooltip="Stock total d'ordinateurs et disponibilité"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Prêts Actifs"
                                value={stats?.loans?.active ?? 0}
                                subtitle={`${stats?.loans?.reserved ?? 0} réservés`}
                                icon={AssignmentIcon}
                                color="info"
                                loading={isLoadingStats}
                                onClick={() => navigate('/loans', { state: { initialTab: 0 }})}
                                tooltip="Prêts en cours et réservations"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="En Retard"
                                value={(stats?.loans?.overdue ?? 0) + (stats?.loans?.critical ?? 0)}
                                subtitle={`${stats?.loans?.critical ?? 0} critiques`}
                                icon={ErrorOutlineIcon}
                                color="error"
                                loading={isLoadingStats}
                                onClick={() => navigate('/loans', { state: { initialTab: 0, preFilter: 'overdue' }})}
                                tooltip="Prêts en retard nécessitant une action"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Historique Total"
                                value={stats?.history?.totalLoans ?? 0}
                                icon={HistoryIcon}
                                color="secondary"
                                loading={isLoadingStats}
                                onClick={() => navigate('/loans', { state: { initialTab: 3 }})}
                                tooltip="Nombre total de prêts effectués"
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Content Panels */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <ServerStatusWidget serversToPing={config?.rds_servers || []} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} sx={{ p: 2.5, height: '100%', borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontWeight: 600
                                }}>
                                    <WarningIcon sx={{ mr: 1.5, color: 'warning.main' }} />
                                    Prêts en Retard ({overdueLoans.length})
                                </Typography>
                                {isLoadingLoans ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <CircularProgress size={24}/>
                                    </Box>
                                ) : (
                                    <List dense>
                                        {overdueLoans.slice(0,5).map(l => (
                                            <ListItem key={l.id} disableGutters sx={{ py: 0.5 }}>
                                                <ListItemText
                                                    primary={<Typography variant="body2" fontWeight={500}>{l.computerName}</Typography>}
                                                    secondary={`${l.userDisplayName} • Retour: ${new Date(l.expectedReturnDate).toLocaleDateString('fr-FR')}`}
                                                />
                                            </ListItem>
                                        ))}
                                        {overdueLoans.length === 0 && (
                                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                                Aucun prêt en retard
                                            </Typography>
                                        )}
                                    </List>
                                )}
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} sx={{ p: 2.5, height: '100%', borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontWeight: 600
                                }}>
                                    <AssignmentIcon sx={{ mr: 1.5, color: 'info.main' }} />
                                    Prêts Actifs ({activeLoans.length})
                                </Typography>
                                {isLoadingLoans ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <CircularProgress size={24}/>
                                    </Box>
                                ) : (
                                    <List dense>
                                        {activeLoans.slice(0,5).map(l => (
                                            <ListItem key={l.id} disableGutters sx={{ py: 0.5 }}>
                                                <ListItemText
                                                    primary={<Typography variant="body2" fontWeight={500}>{l.computerName}</Typography>}
                                                    secondary={`${l.userDisplayName} • Retour: ${new Date(l.expectedReturnDate).toLocaleDateString('fr-FR')}`}
                                                />
                                            </ListItem>
                                        ))}
                                        {activeLoans.length === 0 && (
                                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                                Aucun prêt actif
                                            </Typography>
                                        )}
                                    </List>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Sidebar Widgets */}
                <Grid item xs={12} md={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <ConnectedTechniciansWidget />
                        </Grid>
                        <Grid item xs={12}>
                            <RecentActivityWidget />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
