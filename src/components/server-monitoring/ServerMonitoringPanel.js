// src/components/server-monitoring/ServerMonitoringPanel.js - MONITORING TEMPS RÉEL DES SERVEURS

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Paper, Typography, Grid, LinearProgress, Chip, Stack,
    Alert, IconButton, Tooltip, Card, CardContent, Divider
} from '@mui/material';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';

/**
 * Composant de monitoring serveur individuel
 */
const ServerMonitorCard = ({ server, metrics }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'success';
            case 'offline': return 'error';
            case 'warning': return 'warning';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'online': return <CheckCircleIcon />;
            case 'offline': return <ErrorIcon />;
            case 'warning': return <WarningIcon />;
            default: return null;
        }
    };

    const cpuUsage = metrics?.cpu || Math.random() * 100; // Mock data si pas de métrique réelle
    const ramUsage = metrics?.ram || Math.random() * 100;
    const diskUsage = metrics?.disk || Math.random() * 100;

    return (
        <Card elevation={2}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{server.name}</Typography>
                    <Chip
                        icon={getStatusIcon(metrics?.status || 'online')}
                        label={metrics?.status || 'online'}
                        color={getStatusColor(metrics?.status || 'online')}
                        size="small"
                    />
                </Stack>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {server.hostname}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* CPU */}
                <Box mb={2}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <SpeedIcon fontSize="small" color="action" />
                            <Typography variant="body2">CPU</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight="bold">
                            {cpuUsage.toFixed(1)}%
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={cpuUsage}
                        color={cpuUsage > 80 ? 'error' : cpuUsage > 60 ? 'warning' : 'success'}
                    />
                </Box>

                {/* RAM */}
                <Box mb={2}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <MemoryIcon fontSize="small" color="action" />
                            <Typography variant="body2">Mémoire</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight="bold">
                            {ramUsage.toFixed(1)}%
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={ramUsage}
                        color={ramUsage > 80 ? 'error' : ramUsage > 60 ? 'warning' : 'primary'}
                    />
                </Box>

                {/* Disque */}
                <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <StorageIcon fontSize="small" color="action" />
                            <Typography variant="body2">Disque</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight="bold">
                            {diskUsage.toFixed(1)}%
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={diskUsage}
                        color={diskUsage > 90 ? 'error' : diskUsage > 70 ? 'warning' : 'info'}
                    />
                </Box>

                {server.notes && (
                    <Alert severity="info" sx={{ mt: 2 }} icon={false}>
                        <Typography variant="caption">{server.notes}</Typography>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

/**
 * Panel principal de monitoring des serveurs
 */
const ServerMonitoringPanel = ({ servers = [] }) => {
    const [metricsData, setMetricsData] = useState({});
    const [historyData, setHistoryData] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Générer des données d'historique mockées (à remplacer par de vraies données)
    const generateMockHistory = () => {
        const now = new Date();
        const history = [];
        
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            history.push({
                time: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                uptime: 95 + Math.random() * 5,
                activeServers: Math.floor(servers.length * (0.8 + Math.random() * 0.2))
            });
        }
        
        return history;
    };

    useEffect(() => {
        // Initialiser les métriques mockées
        const mockMetrics = {};
        servers.forEach(server => {
            mockMetrics[server.name] = {
                status: Math.random() > 0.1 ? 'online' : 'offline',
                cpu: Math.random() * 100,
                ram: Math.random() * 100,
                disk: Math.random() * 100,
            };
        });
        setMetricsData(mockMetrics);
        setHistoryData(generateMockHistory());
    }, [servers]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        
        // Simuler une requête API
        setTimeout(() => {
            const mockMetrics = {};
            servers.forEach(server => {
                mockMetrics[server.name] = {
                    status: Math.random() > 0.1 ? 'online' : 'offline',
                    cpu: Math.random() * 100,
                    ram: Math.random() * 100,
                    disk: Math.random() * 100,
                };
            });
            setMetricsData(mockMetrics);
            setHistoryData(generateMockHistory());
            setIsRefreshing(false);
        }, 1000);
    };

    const stats = useMemo(() => {
        const online = Object.values(metricsData).filter(m => m.status === 'online').length;
        const total = servers.length;
        const uptime = total > 0 ? ((online / total) * 100).toFixed(1) : 0;
        
        return { online, total, uptime };
    }, [metricsData, servers]);

    if (servers.length === 0) {
        return (
            <Alert severity="info">
                Aucun serveur configuré. Ajoutez des serveurs dans la page de gestion des serveurs.
            </Alert>
        );
    }

    return (
        <Box>
            {/* En-tête avec statistiques */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Monitoring Serveurs</Typography>
                    <Tooltip title="Rafraîchir">
                        <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                            <Typography variant="h4" color="success.main">
                                {stats.online}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Serveurs en ligne
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                            <Typography variant="h4" color="primary.main">
                                {stats.total}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total serveurs
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                            <Typography variant="h4" color={stats.uptime >= 95 ? 'success.main' : 'warning.main'}>
                                {stats.uptime}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Disponibilité
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Graphique historique */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Historique 24h</Typography>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="uptime" stroke="#4caf50" name="Disponibilité (%)" strokeWidth={2} />
                        <Line type="monotone" dataKey="activeServers" stroke="#2196f3" name="Serveurs actifs" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </Paper>

            {/* Cartes de serveurs */}
            <Grid container spacing={2}>
                {servers.map(server => (
                    <Grid item xs={12} sm={6} md={4} key={server.name}>
                        <ServerMonitorCard
                            server={server}
                            metrics={metricsData[server.name]}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ServerMonitoringPanel;
