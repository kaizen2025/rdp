// src/components/statistics/LoanStatisticsCharts.js - Graphiques de statistiques des prêts

import React, { useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    Tooltip
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    TrendingFlat,
    Computer,
    Person,
    AccessTime,
    Warning,
    CheckCircle
} from '@mui/icons-material';

/**
 * Calcule les statistiques de tendance
 */
const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, direction: 'flat' };
    const change = ((current - previous) / previous) * 100;
    return {
        value: Math.abs(change).toFixed(1),
        direction: change > 5 ? 'up' : change < -5 ? 'down' : 'flat'
    };
};

/**
 * Composant de statistique avec tendance
 */
const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => {
    const trendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : TrendingFlat;
    const TrendIcon = trendIcon;
    const trendColor = trend?.direction === 'up' ? 'success' : trend?.direction === 'down' ? 'error' : 'default';

    return (
        <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: `${color}.lighter`, borderRadius: 2 }}>
                        <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
                    </Box>
                </Box>
                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendIcon fontSize="small" color={trendColor} />
                        <Typography variant="caption" color={`${trendColor}.main`}>
                            {trend.value}% vs mois dernier
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

/**
 * Graphique en barres horizontales simple
 */
const HorizontalBarChart = ({ data, title, color = 'primary' }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                {title}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data.map((item, index) => (
                    <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={500}>
                                {item.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {item.value} {item.unit || 'prêts'}
                            </Typography>
                        </Box>
                        <Tooltip title={`${item.value} ${item.unit || 'prêts'} (${((item.value / maxValue) * 100).toFixed(1)}%)`}>
                            <LinearProgress
                                variant="determinate"
                                value={(item.value / maxValue) * 100}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: `${color}.main`,
                                        borderRadius: 5
                                    }
                                }}
                            />
                        </Tooltip>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

/**
 * Timeline simple des prêts
 */
const LoanTimeline = ({ loans }) => {
    const timeline = useMemo(() => {
        // Grouper les prêts par mois (6 derniers mois)
        const months = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

            const monthLoans = loans.filter(loan => {
                const loanDate = new Date(loan.loanDate);
                return loanDate.getFullYear() === date.getFullYear() &&
                       loanDate.getMonth() === date.getMonth();
            });

            months.push({
                key: monthKey,
                label: monthName,
                total: monthLoans.length,
                returned: monthLoans.filter(l => l.status === 'returned').length,
                active: monthLoans.filter(l => ['active', 'overdue', 'critical'].includes(l.status)).length
            });
        }

        return months;
    }, [loans]);

    const maxValue = Math.max(...timeline.map(m => m.total), 1);

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Évolution des prêts (6 derniers mois)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 200 }}>
                {timeline.map((month, index) => (
                    <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={`Total: ${month.total}, Actifs: ${month.active}, Retournés: ${month.returned}`}>
                            <Box
                                sx={{
                                    width: '100%',
                                    height: `${(month.total / maxValue) * 150}px`,
                                    minHeight: month.total > 0 ? 20 : 0,
                                    bgcolor: 'primary.main',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    pb: 0.5,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                        transform: 'scale(1.05)'
                                    }
                                }}
                            >
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {month.total}
                                </Typography>
                            </Box>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary" sx={{ transform: 'rotate(-45deg)', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                            {month.label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

/**
 * État des prêts avec graphique circulaire simple
 */
const LoanStatusChart = ({ statistics }) => {
    const statuses = [
        { label: 'Actifs', value: statistics.activeLoans || 0, color: 'primary', icon: AccessTime },
        { label: 'En retard', value: statistics.overdueLoans || 0, color: 'warning', icon: Warning },
        { label: 'Critiques', value: statistics.criticalLoans || 0, color: 'error', icon: Warning },
        { label: 'Retournés', value: statistics.returnedLoans || 0, color: 'success', icon: CheckCircle }
    ];

    const total = statuses.reduce((sum, s) => sum + s.value, 0);

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                État des prêts
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {statuses.map((status, index) => {
                    const StatusIcon = status.icon;
                    const percentage = total > 0 ? ((status.value / total) * 100).toFixed(1) : 0;

                    return (
                        <Box key={index}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StatusIcon color={status.color} fontSize="small" />
                                    <Typography variant="body2">{status.label}</Typography>
                                </Box>
                                <Chip
                                    label={`${status.value} (${percentage}%)`}
                                    size="small"
                                    color={status.color}
                                    variant="outlined"
                                />
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={parseFloat(percentage)}
                                color={status.color}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

/**
 * Composant principal des graphiques
 */
const LoanStatisticsCharts = ({ statistics, loans = [] }) => {
    // Calculer les tendances (simulé pour l'exemple - à adapter avec vraies données)
    const trends = useMemo(() => ({
        totalLoans: calculateTrend(statistics.totalLoans || 0, statistics.totalLoans * 0.9),
        activeLoans: calculateTrend(statistics.activeLoans || 0, statistics.activeLoans * 1.1),
        avgDuration: calculateTrend(statistics.averageLoanDuration || 0, statistics.averageLoanDuration * 1.05)
    }), [statistics]);

    // Top utilisateurs
    const topUsers = useMemo(() => {
        const userLoans = {};
        loans.forEach(loan => {
            const key = loan.userDisplayName || loan.userName;
            userLoans[key] = (userLoans[key] || 0) + 1;
        });

        return Object.entries(userLoans)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([label, value]) => ({ label, value }));
    }, [loans]);

    // Top ordinateurs
    const topComputers = useMemo(() => {
        const computerLoans = {};
        loans.forEach(loan => {
            const key = loan.computerName;
            computerLoans[key] = (computerLoans[key] || 0) + 1;
        });

        return Object.entries(computerLoans)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([label, value]) => ({ label, value }));
    }, [loans]);

    return (
        <Box>
            {/* Cartes de statistiques principales */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total des prêts"
                        value={statistics.totalLoans || 0}
                        icon={Computer}
                        color="primary"
                        trend={trends.totalLoans}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Prêts actifs"
                        value={statistics.activeLoans || 0}
                        icon={AccessTime}
                        color="info"
                        trend={trends.activeLoans}
                        subtitle={`${statistics.overdueLoans || 0} en retard`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Durée moyenne"
                        value={`${Math.round(statistics.averageLoanDuration || 0)}j`}
                        icon={TrendingFlat}
                        color="success"
                        trend={trends.avgDuration}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Taux de retour"
                        value={`${Math.round(((statistics.returnedLoans || 0) / (statistics.totalLoans || 1)) * 100)}%`}
                        icon={CheckCircle}
                        color="success"
                    />
                </Grid>
            </Grid>

            {/* Graphiques */}
            <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                    <LoanTimeline loans={loans} />
                </Grid>
                <Grid item xs={12} lg={4}>
                    <LoanStatusChart statistics={statistics} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <HorizontalBarChart
                        title="Top 5 - Utilisateurs"
                        data={topUsers}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <HorizontalBarChart
                        title="Top 5 - Ordinateurs prêtés"
                        data={topComputers}
                        color="secondary"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default LoanStatisticsCharts;
