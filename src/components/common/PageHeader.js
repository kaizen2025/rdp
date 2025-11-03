// src/components/common/PageHeader.js - Header moderne et réutilisable

import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Chip } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

/**
 * PageHeader - Composant header moderne pour toutes les pages
 *
 * @param {string} title - Titre principal de la page
 * @param {string} subtitle - Sous-titre optionnel
 * @param {Array} breadcrumbs - Fil d'ariane [{ label, path }]
 * @param {ReactNode} actions - Boutons d'actions (à droite)
 * @param {ReactNode} secondaryActions - Actions secondaires (en dessous)
 * @param {Object} stats - Statistiques rapides { label, value, color, icon }[]
 * @param {ReactNode} children - Contenu additionnel
 */
const PageHeader = ({
    title,
    subtitle,
    breadcrumbs = [],
    actions,
    secondaryActions,
    stats = [],
    children,
    icon: TitleIcon,
}) => {
    return (
        <Box
            sx={{
                mb: 3,
                p: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0px 4px 20px rgba(102, 126, 234, 0.3)',
            }}
        >
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.7)' }} />}
                    sx={{ mb: 2 }}
                >
                    {breadcrumbs.map((crumb, index) => (
                        <Link
                            key={index}
                            color="inherit"
                            href={crumb.path}
                            sx={{
                                color: 'rgba(255,255,255,0.9)',
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: 'underline',
                                    color: '#fff',
                                },
                            }}
                        >
                            {crumb.label}
                        </Link>
                    ))}
                </Breadcrumbs>
            )}

            {/* Title Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: subtitle || stats.length > 0 ? 2 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {TitleIcon && <TitleIcon sx={{ fontSize: 40 }} />}
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
                {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
            </Box>

            {/* Stats Row */}
            {stats.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                    {stats.map((stat, index) => {
                        const StatIcon = stat.icon;
                        return (
                            <Chip
                                key={index}
                                icon={StatIcon ? <StatIcon /> : undefined}
                                label={`${stat.label}: ${stat.value}`}
                                sx={{
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontWeight: 500,
                                    backdropFilter: 'blur(10px)',
                                    '& .MuiChip-icon': {
                                        color: 'white',
                                    },
                                }}
                            />
                        );
                    })}
                </Box>
            )}

            {/* Secondary Actions */}
            {secondaryActions && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {secondaryActions}
                </Box>
            )}

            {/* Additional Content */}
            {children}
        </Box>
    );
};

export default PageHeader;
