// src/components/dashboard/TopUsersWidget.js - Top 10 utilisateurs avec classement

import React, { useMemo, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    LinearProgress,
    ToggleButtonGroup,
    ToggleButton,
    Chip,
    Tooltip
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    TrendingUp,
    TrendingDown,
    Person as PersonIcon
} from '@mui/icons-material';

/**
 * Génère des utilisateurs de démonstration
 */
const generateDemoUsers = () => {
    const names = [
        'Marie Laurent', 'Pierre Dubois', 'Sophie Martin', 'Luc Moreau',
        'Julie Bernard', 'Thomas Petit', 'Emma Durand', 'Nicolas Lefevre',
        'Laura Robert', 'Antoine Richard'
    ];

    return names.map((name, index) => ({
        name,
        sessions: Math.round(150 - index * 12 + Math.random() * 10),
        duration: Math.round(420 - index * 35 + Math.random() * 20),
        loans: Math.round(25 - index * 2 + Math.random() * 3),
        actions: Math.round(380 - index * 30 + Math.random() * 15),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        trendValue: Math.round(Math.random() * 20)
    }));
};

/**
 * Traite les données utilisateurs
 */
const processUserData = (data, metric, sortOrder = 'desc') => {
    if (!data || data.length === 0) {
        return generateDemoUsers();
    }

    // Agréger les données par utilisateur
    const userStats = {};

    data.forEach(entry => {
        const userName = entry.userDisplayName || entry.userName || entry.username;
        if (!userName) return;

        if (!userStats[userName]) {
            userStats[userName] = {
                name: userName,
                sessions: 0,
                duration: 0,
                loans: 0,
                actions: 0
            };
        }

        userStats[userName].sessions++;

        if (entry.duration) {
            userStats[userName].duration += entry.duration;
        }

        if (entry.type === 'loan') {
            userStats[userName].loans++;
        }

        userStats[userName].actions++;
    });

    // Convertir en tableau et trier
    const users = Object.values(userStats);
    users.sort((a, b) => {
        const comparison = b[metric] - a[metric];
        return sortOrder === 'desc' ? comparison : -comparison;
    });

    return users.slice(0, 10);
};

/**
 * Obtient l'icône de médaille selon le rang
 */
const getMedalIcon = (rank) => {
    const medals = {
        1: { color: '#FFD700', label: 'Or' }, // Gold
        2: { color: '#C0C0C0', label: 'Argent' }, // Silver
        3: { color: '#CD7F32', label: 'Bronze' } // Bronze
    };

    const medal = medals[rank];

    if (medal) {
        return (
            <Tooltip title={`${rank}er - ${medal.label}`}>
                <Avatar
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: medal.color,
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: '#fff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                    }}
                >
                    <TrophyIcon />
                </Avatar>
            </Tooltip>
        );
    }

    return (
        <Avatar
            sx={{
                width: 40,
                height: 40,
                bgcolor: 'grey.300',
                fontWeight: 'bold'
            }}
        >
            {rank}
        </Avatar>
    );
};

/**
 * Composant TopUsersWidget
 */
const TopUsersWidget = ({ data, title = "Top 10 Utilisateurs" }) => {
    const [selectedMetric, setSelectedMetric] = useState('sessions');

    const users = useMemo(() => {
        return processUserData(data, selectedMetric);
    }, [data, selectedMetric]);

    const maxValue = users.length > 0 ? users[0][selectedMetric] : 1;

    const metricLabels = {
        sessions: { label: 'Sessions', unit: '' },
        duration: { label: 'Durée', unit: 'h' },
        loans: { label: 'Prêts', unit: '' },
        actions: { label: 'Actions', unit: '' }
    };

    const formatValue = (value, metric) => {
        if (metric === 'duration') {
            const hours = Math.floor(value / 60);
            const mins = value % 60;
            return `${hours}h${mins > 0 ? mins + 'm' : ''}`;
        }
        return value;
    };

    return (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrophyIcon color="secondary" />
                    <Typography variant="h6" fontWeight={600}>
                        {title}
                    </Typography>
                </Box>

                <Chip
                    label={`Top ${users.length}`}
                    color="secondary"
                    size="small"
                    variant="outlined"
                />
            </Box>

            {/* Sélecteur de métrique */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                    value={selectedMetric}
                    exclusive
                    onChange={(e, newValue) => newValue && setSelectedMetric(newValue)}
                    size="small"
                    color="primary"
                >
                    <ToggleButton value="sessions">Sessions</ToggleButton>
                    <ToggleButton value="duration">Durée</ToggleButton>
                    <ToggleButton value="loans">Prêts</ToggleButton>
                    <ToggleButton value="actions">Actions</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Liste des utilisateurs */}
            <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                {users.map((user, index) => {
                    const rank = index + 1;
                    const value = user[selectedMetric];
                    const percentage = ((value / maxValue) * 100).toFixed(1);
                    const TrendIcon = user.trend === 'up' ? TrendingUp : TrendingDown;
                    const trendColor = user.trend === 'up' ? 'success' : 'error';

                    return (
                        <ListItem
                            key={user.name}
                            sx={{
                                mb: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    boxShadow: 2,
                                    transform: 'translateY(-2px)',
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            <ListItemAvatar>
                                {getMedalIcon(rank)}
                            </ListItemAvatar>

                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Typography variant="body1" fontWeight={rank <= 3 ? 600 : 500}>
                                            {user.name}
                                        </Typography>
                                        {user.trend && (
                                            <Tooltip title={`${user.trend === 'up' ? '+' : '-'}${user.trendValue}% vs période précédente`}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <TrendIcon
                                                        fontSize="small"
                                                        color={trendColor}
                                                        sx={{ fontSize: 16 }}
                                                    />
                                                    <Typography
                                                        variant="caption"
                                                        color={`${trendColor}.main`}
                                                        sx={{ ml: 0.3, fontWeight: 600 }}
                                                    >
                                                        {user.trendValue}%
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 0.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {metricLabels[selectedMetric].label}
                                            </Typography>
                                            <Typography variant="caption" fontWeight={600}>
                                                {formatValue(value, selectedMetric)} {metricLabels[selectedMetric].unit}
                                            </Typography>
                                        </Box>
                                        <Tooltip title={`${percentage}% du maximum`}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={parseFloat(percentage)}
                                                color={rank <= 3 ? 'secondary' : 'primary'}
                                                sx={{
                                                    height: 6,
                                                    borderRadius: 3,
                                                    bgcolor: 'action.hover'
                                                }}
                                            />
                                        </Tooltip>
                                    </Box>
                                }
                            />
                        </ListItem>
                    );
                })}
            </List>

            {users.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        Aucune donnée disponible
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default TopUsersWidget;
