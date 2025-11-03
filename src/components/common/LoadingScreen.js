// src/components/common/LoadingScreen.js - Skeleton screens modernes

import React from 'react';
import { Box, Skeleton, Grid, Card, CardContent, Paper } from '@mui/material';

/**
 * LoadingScreen - Skeleton screens pour différents types de contenu
 */

// Skeleton pour une table
export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
    <Box>
        {Array.from({ length: rows }).map((_, index) => (
            <Box
                key={index}
                sx={{
                    display: 'flex',
                    gap: 2,
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton
                        key={colIndex}
                        variant="text"
                        width={`${100 / columns}%`}
                        height={24}
                    />
                ))}
            </Box>
        ))}
    </Box>
);

// Skeleton pour des cards
export const CardSkeleton = ({ count = 4 }) => (
    <Grid container spacing={2}>
        {Array.from({ length: count }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card>
                    <CardContent>
                        <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="40%" height={20} />
                    </CardContent>
                </Card>
            </Grid>
        ))}
    </Grid>
);

// Skeleton pour un dashboard
export const DashboardSkeleton = () => (
    <Box>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
            <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2 }} />
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
            {Array.from({ length: 4 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card>
                        <CardContent>
                            <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                            <Skeleton variant="text" width="80%" height={32} />
                            <Skeleton variant="text" width="60%" height={24} />
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>

        {/* Content */}
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2 }}>
                    <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={300} />
                </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                    <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                            <Box sx={{ flexGrow: 1 }}>
                                <Skeleton variant="text" width="80%" />
                                <Skeleton variant="text" width="60%" />
                            </Box>
                        </Box>
                    ))}
                </Paper>
            </Grid>
        </Grid>
    </Box>
);

// Skeleton pour une liste
export const ListSkeleton = ({ items = 5 }) => (
    <Box>
        {Array.from({ length: items }).map((_, index) => (
            <Box
                key={index}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="80%" height={24} />
                    <Skeleton variant="text" width="60%" height={20} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                </Box>
            </Box>
        ))}
    </Box>
);

// Skeleton pour un formulaire
export const FormSkeleton = ({ fields = 6 }) => (
    <Grid container spacing={2}>
        {Array.from({ length: fields }).map((_, index) => (
            <Grid item xs={12} sm={6} key={index}>
                <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            </Grid>
        ))}
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
        </Grid>
    </Grid>
);

// Composant principal qui choisit automatiquement le bon skeleton
const LoadingScreen = ({ type = 'table', ...props }) => {
    switch (type) {
        case 'table':
            return <TableSkeleton {...props} />;
        case 'cards':
            return <CardSkeleton {...props} />;
        case 'dashboard':
            return <DashboardSkeleton {...props} />;
        case 'list':
            return <ListSkeleton {...props} />;
        case 'form':
            return <FormSkeleton {...props} />;
        default:
            return <TableSkeleton {...props} />;
    }
};

export default LoadingScreen;
