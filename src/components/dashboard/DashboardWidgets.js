// src/components/dashboard/DashboardWidgets.js - Système de widgets drag & drop

import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import {
    Box,
    Paper,
    IconButton,
    Tooltip,
    Typography
} from '@mui/material';
import {
    DragIndicator as DragIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon
} from '@mui/icons-material';

// Styles CSS nécessaires pour react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-grid-layout/css/resizable.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Composant Widget individuel
 */
const Widget = ({ id, title, children, onRemove, onRefresh }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Paper
            elevation={isHovered ? 8 : 2}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'all 0.3s',
                borderRadius: 2
            }}
        >
            {/* Widget Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.default',
                    cursor: 'move'
                }}
                className="drag-handle"
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DragIcon
                        fontSize="small"
                        sx={{
                            opacity: isHovered ? 1 : 0.3,
                            transition: 'opacity 0.2s',
                            color: 'text.secondary'
                        }}
                    />
                    <Typography variant="subtitle2" fontWeight={600}>
                        {title}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {onRefresh && (
                        <Tooltip title="Rafraîchir">
                            <IconButton
                                size="small"
                                onClick={onRefresh}
                                sx={{
                                    opacity: isHovered ? 1 : 0,
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onRemove && (
                        <Tooltip title="Retirer">
                            <IconButton
                                size="small"
                                onClick={onRemove}
                                sx={{
                                    opacity: isHovered ? 1 : 0,
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Widget Content */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2
                }}
            >
                {children}
            </Box>
        </Paper>
    );
};

/**
 * Composant principal DashboardWidgets
 */
const DashboardWidgets = ({
    widgets = [],
    onLayoutChange,
    onWidgetRemove,
    onWidgetRefresh
}) => {
    // État local pour les layouts
    const [layouts, setLayouts] = useState(() => {
        // Charger depuis localStorage si disponible
        const savedLayouts = localStorage.getItem('dashboardLayout');
        if (savedLayouts) {
            try {
                return JSON.parse(savedLayouts);
            } catch (e) {
                console.error('Error parsing saved layouts:', e);
            }
        }
        return undefined;
    });

    // Configuration des breakpoints
    const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
    const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

    // Générer les layouts par défaut si non fournis
    const defaultLayouts = useMemo(() => {
        if (layouts) return layouts;

        const lg = widgets.map((widget, index) => ({
            i: widget.id,
            x: (index * 6) % 12,
            y: Math.floor((index * 6) / 12) * 4,
            w: widget.w || 6,
            h: widget.h || 4,
            minW: widget.minW || 3,
            minH: widget.minH || 2
        }));

        return {
            lg,
            md: lg.map(item => ({ ...item, w: Math.min(item.w, 10) })),
            sm: lg.map(item => ({ ...item, w: Math.min(item.w, 6), x: 0 })),
            xs: lg.map(item => ({ ...item, w: 4, x: 0 })),
            xxs: lg.map(item => ({ ...item, w: 2, x: 0 }))
        };
    }, [widgets, layouts]);

    // Handler pour les changements de layout
    const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
        setLayouts(allLayouts);

        // Sauvegarder dans localStorage
        try {
            localStorage.setItem('dashboardLayout', JSON.stringify(allLayouts));
        } catch (e) {
            console.error('Error saving layouts:', e);
        }

        if (onLayoutChange) {
            onLayoutChange(currentLayout, allLayouts);
        }
    }, [onLayoutChange]);

    // Handler pour retirer un widget
    const handleWidgetRemove = useCallback((widgetId) => {
        if (onWidgetRemove) {
            onWidgetRemove(widgetId);
        }

        // Retirer du layout sauvegardé
        if (layouts) {
            const newLayouts = {};
            Object.keys(layouts).forEach(breakpoint => {
                newLayouts[breakpoint] = layouts[breakpoint].filter(item => item.i !== widgetId);
            });
            setLayouts(newLayouts);
            localStorage.setItem('dashboardLayout', JSON.stringify(newLayouts));
        }
    }, [onWidgetRemove, layouts]);

    // Handler pour rafraîchir un widget
    const handleWidgetRefresh = useCallback((widgetId) => {
        if (onWidgetRefresh) {
            onWidgetRefresh(widgetId);
        }
    }, [onWidgetRefresh]);

    if (widgets.length === 0) {
        return (
            <Box
                sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 2,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2
                }}
            >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucun widget configuré
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Ajoutez des widgets pour personnaliser votre tableau de bord
                </Typography>
            </Box>
        );
    }

    return (
        <ResponsiveGridLayout
            className="layout"
            layouts={defaultLayouts}
            breakpoints={breakpoints}
            cols={cols}
            rowHeight={100}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            isDraggable={true}
            isResizable={true}
            draggableHandle=".drag-handle"
            onLayoutChange={handleLayoutChange}
            compactType="vertical"
        >
            {widgets.map((widget) => (
                <div key={widget.id}>
                    <Widget
                        id={widget.id}
                        title={widget.title}
                        onRemove={widget.removable !== false ? () => handleWidgetRemove(widget.id) : null}
                        onRefresh={widget.refreshable !== false ? () => handleWidgetRefresh(widget.id) : null}
                    >
                        {widget.content}
                    </Widget>
                </div>
            ))}
        </ResponsiveGridLayout>
    );
};

export default DashboardWidgets;
