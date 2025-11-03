// src/components/common/EmptyState.js - État vide moderne

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import {
    Inbox as InboxIcon,
    SearchOff as SearchOffIcon,
    ErrorOutline as ErrorIcon,
    CloudOff as CloudOffIcon,
} from '@mui/icons-material';

/**
 * EmptyState - Affichage moderne pour les états vides
 *
 * @param {string} type - Type d'état vide ('empty', 'search', 'error', 'offline')
 * @param {string} title - Titre principal
 * @param {string} description - Description
 * @param {string} actionLabel - Label du bouton d'action
 * @param {Function} onAction - Callback du bouton d'action
 * @param {ReactNode} icon - Icône personnalisée
 * @param {ReactNode} children - Contenu additionnel
 */
const EmptyState = ({
    type = 'empty',
    title,
    description,
    actionLabel,
    onAction,
    icon: CustomIcon,
    children,
}) => {
    // Déterminer l'icône et les couleurs selon le type
    const getIconAndColor = () => {
        switch (type) {
            case 'search':
                return { Icon: SearchOffIcon, color: '#64b5f6' };
            case 'error':
                return { Icon: ErrorIcon, color: '#ef5350' };
            case 'offline':
                return { Icon: CloudOffIcon, color: '#ffa726' };
            default:
                return { Icon: InboxIcon, color: '#90a4ae' };
        }
    };

    const { Icon, color } = getIconAndColor();
    const DisplayIcon = CustomIcon || Icon;

    // Titre par défaut selon le type
    const defaultTitles = {
        empty: 'Aucune donnée',
        search: 'Aucun résultat',
        error: 'Une erreur est survenue',
        offline: 'Hors ligne',
    };

    const displayTitle = title || defaultTitles[type];

    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                p: 4,
                textAlign: 'center',
                backgroundColor: 'background.default',
                borderRadius: 2,
            }}
        >
            <Box
                sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${color}15`,
                    mb: 3,
                }}
            >
                <DisplayIcon
                    sx={{
                        fontSize: 64,
                        color: color,
                    }}
                />
            </Box>

            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                {displayTitle}
            </Typography>

            {description && (
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mb: 3 }}>
                    {description}
                </Typography>
            )}

            {actionLabel && onAction && (
                <Button
                    variant="contained"
                    onClick={onAction}
                    sx={{
                        mt: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                    }}
                >
                    {actionLabel}
                </Button>
            )}

            {children && (
                <Box sx={{ mt: 3 }}>
                    {children}
                </Box>
            )}
        </Paper>
    );
};

export default EmptyState;
