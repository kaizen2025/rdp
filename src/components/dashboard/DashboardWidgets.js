import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  Card,
  CardContent,
  CardHeader,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  DragIndicator as DragIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Composant Dashboard avec widgets redimensionnables et déplaçables
 * Utilise react-grid-layout pour drag & drop et resize
 */
const DashboardWidgets = ({ widgets = [], onLayoutChange, onWidgetRemove, onWidgetRefresh }) => {
  const [layouts, setLayouts] = useState({
    lg: widgets.map((w, i) => ({
      i: w.id,
      x: w.x || (i % 4) * 3,
      y: w.y || Math.floor(i / 4) * 2,
      w: w.w || 3,
      h: w.h || 2,
      minW: w.minW || 2,
      minH: w.minH || 1
    }))
  });

  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      try {
        setLayouts(JSON.parse(savedLayout));
      } catch (e) {
        console.error('Erreur chargement layout:', e);
      }
    }
  }, []);

  const handleLayoutChange = (currentLayout, allLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboardLayout', JSON.stringify(allLayouts));
    if (onLayoutChange) {
      onLayoutChange(allLayouts);
    }
  };

  const handleWidgetRemove = (widgetId) => {
    if (onWidgetRemove) {
      onWidgetRemove(widgetId);
    }
  };

  const handleWidgetRefresh = (widgetId) => {
    if (onWidgetRefresh) {
      onWidgetRefresh(widgetId);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '600px', p: 2 }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
      >
        {widgets.map((widget) => (
          <Paper
            key={widget.id}
            elevation={3}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover .drag-handle': {
                opacity: 1
              }
            }}
          >
            <CardHeader
              avatar={
                <Tooltip title="Déplacer le widget">
                  <IconButton
                    size="small"
                    className="drag-handle"
                    sx={{
                      cursor: 'move',
                      opacity: 0.3,
                      transition: 'opacity 0.2s',
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <DragIcon />
                  </IconButton>
                </Tooltip>
              }
              action={
                <Box>
                  <Tooltip title="Actualiser">
                    <IconButton
                      size="small"
                      onClick={() => handleWidgetRefresh(widget.id)}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Retirer du dashboard">
                    <IconButton
                      size="small"
                      onClick={() => handleWidgetRemove(widget.id)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              title={
                <Typography variant="h6" noWrap>
                  {widget.title}
                </Typography>
              }
              sx={{
                bgcolor: 'background.default',
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 1
              }}
            />
            <CardContent sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {widget.content}
            </CardContent>
          </Paper>
        ))}
      </ResponsiveGridLayout>

      {widgets.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 400,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Aucun widget ajouté. Cliquez sur "Ajouter un widget" pour commencer.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DashboardWidgets;
