// src/components/dashboard/ActivityHeatmap.js - Heatmap d'activité 7j x 24h

import React, { useMemo, useState } from 'react';
import { Box, Paper, Typography, FormControl, Select, MenuItem, Tooltip, Chip } from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

/**
 * Génère des données de démonstration avec patterns réalistes
 */
const generateDemoData = (metric) => {
    const data = {};
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    days.forEach((day, dayIndex) => {
        data[day] = {};
        for (let hour = 0; hour < 24; hour++) {
            let value = 0;

            // Pattern professionnel: activité réduite le weekend
            const isWeekend = dayIndex >= 5;

            if (isWeekend) {
                // Weekend: activité faible
                value = Math.random() * 5;
            } else {
                // Semaine: pic d'activité 8h-18h
                if (hour >= 8 && hour <= 18) {
                    value = 20 + Math.random() * 60;
                    // Creux à midi (12h-13h)
                    if (hour >= 12 && hour <= 13) {
                        value *= 0.3;
                    }
                } else if (hour >= 7 && hour <= 20) {
                    // Heures périphériques
                    value = 5 + Math.random() * 20;
                } else {
                    // Nuit: très faible activité
                    value = Math.random() * 5;
                }
            }

            // Ajuster selon la métrique
            if (metric === 'users') {
                value = Math.round(value * 0.7); // Moins d'utilisateurs que de sessions
            } else if (metric === 'loans') {
                value = Math.round(value * 0.2); // Encore moins de prêts
            }

            data[day][hour] = Math.round(value);
        }
    });

    return data;
};

/**
 * Traite les données d'activité réelles en grille 7x24
 */
const processActivityData = (rawData, metric) => {
    if (!rawData || rawData.length === 0) {
        return generateDemoData(metric);
    }

    // Initialiser la grille 7 jours x 24 heures
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const grid = {};

    days.forEach(day => {
        grid[day] = {};
        for (let hour = 0; hour < 24; hour++) {
            grid[day][hour] = 0;
        }
    });

    // Agréger les données
    rawData.forEach(entry => {
        const date = new Date(entry.timestamp || entry.date || entry.createdAt);
        const dayIndex = (date.getDay() + 6) % 7; // Conversion Dimanche=0 -> Lundi=0
        const day = days[dayIndex];
        const hour = date.getHours();

        if (grid[day] && grid[day][hour] !== undefined) {
            grid[day][hour]++;
        }
    });

    return grid;
};

/**
 * Obtient la couleur basée sur l'intensité
 */
const getColor = (value, maxValue) => {
    if (value === 0) return '#f5f5f5'; // Gris très clair

    const intensity = value / maxValue;

    if (intensity < 0.2) return '#a5d6a7'; // Vert clair
    if (intensity < 0.4) return '#66bb6a'; // Vert
    if (intensity < 0.6) return '#ffa726'; // Orange
    if (intensity < 0.8) return '#ff7043'; // Orange foncé
    return '#ef5350'; // Rouge
};

/**
 * Composant ActivityHeatmap
 */
const ActivityHeatmap = ({ data, title = "Carte d'Activité", defaultMetric = 'sessions' }) => {
    const [selectedMetric, setSelectedMetric] = useState(defaultMetric);

    const { gridData, maxValue } = useMemo(() => {
        const processed = processActivityData(data, selectedMetric);

        // Trouver la valeur maximale
        let max = 0;
        Object.values(processed).forEach(dayData => {
            Object.values(dayData).forEach(value => {
                if (value > max) max = value;
            });
        });

        return { gridData: processed, maxValue: max || 1 };
    }, [data, selectedMetric]);

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const metricLabels = {
        sessions: 'Sessions',
        users: 'Utilisateurs',
        loans: 'Prêts'
    };

    return (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        {title}
                    </Typography>
                </Box>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="sessions">Sessions</MenuItem>
                        <MenuItem value="users">Utilisateurs</MenuItem>
                        <MenuItem value="loans">Prêts</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Heatmap Grid */}
            <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ display: 'flex', minWidth: 800 }}>
                    {/* Colonne des jours */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', mr: 1 }}>
                        <Box sx={{ height: 30 }} /> {/* Espaceur pour l'en-tête des heures */}
                        {days.map((day, index) => (
                            <Box
                                key={day}
                                sx={{
                                    height: 30,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    pr: 1,
                                    mb: 0.5
                                }}
                            >
                                <Typography variant="caption" fontWeight={500} color="text.secondary">
                                    {day}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Grille principale */}
                    <Box sx={{ flex: 1 }}>
                        {/* En-tête des heures */}
                        <Box sx={{ display: 'flex', mb: 0.5 }}>
                            {hours.map(hour => (
                                <Box
                                    key={hour}
                                    sx={{
                                        flex: 1,
                                        height: 30,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        {hour}h
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Lignes de la heatmap */}
                        {days.map(day => (
                            <Box key={day} sx={{ display: 'flex', mb: 0.5 }}>
                                {hours.map(hour => {
                                    const value = gridData[day]?.[hour] || 0;
                                    const color = getColor(value, maxValue);

                                    return (
                                        <Tooltip
                                            key={hour}
                                            title={`${day} ${hour}h: ${value} ${metricLabels[selectedMetric].toLowerCase()}`}
                                            arrow
                                        >
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    height: 30,
                                                    backgroundColor: color,
                                                    border: '1px solid #fff',
                                                    borderRadius: 0.5,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        transform: 'scale(1.1)',
                                                        zIndex: 10,
                                                        boxShadow: 2
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Légende */}
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Faible
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[0, 0.2, 0.4, 0.6, 0.8].map((intensity, index) => (
                        <Box
                            key={index}
                            sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: getColor(intensity * maxValue, maxValue),
                                border: '1px solid #ddd',
                                borderRadius: 0.5
                            }}
                        />
                    ))}
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Élevée
                </Typography>

                <Chip
                    label={`Max: ${maxValue} ${metricLabels[selectedMetric].toLowerCase()}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 2 }}
                />
            </Box>
        </Paper>
    );
};

export default ActivityHeatmap;
