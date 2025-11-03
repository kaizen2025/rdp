import React, { useState } from 'react';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Button,
  Paper,
  Typography,
  Chip
} from '@mui/material';
import {
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  CalendarMonth as CalendarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

/**
 * Filtres temporels pour le dashboard
 * Permet de sélectionner des périodes prédéfinies ou personnalisées
 */
const DashboardFilters = ({ onFilterChange, onRefresh }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const periods = [
    { value: 'today', label: "Aujourd'hui", icon: <TodayIcon /> },
    { value: 'week', label: 'Cette semaine', icon: <DateRangeIcon /> },
    { value: 'month', label: 'Ce mois', icon: <CalendarIcon /> },
    { value: 'custom', label: 'Personnalisé', icon: <DateRangeIcon /> }
  ];

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod === null) return;

    setSelectedPeriod(newPeriod);
    setShowCustomDatePicker(newPeriod === 'custom');

    if (newPeriod !== 'custom') {
      const dateRange = calculateDateRange(newPeriod);
      if (onFilterChange) {
        onFilterChange(dateRange);
      }
    }
  };

  const calculateDateRange = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
          label: "Aujourd'hui"
        };
      
      case 'week':
        const dayOfWeek = now.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
          start: monday,
          end: new Date(sunday.getTime() + 24 * 60 * 60 * 1000 - 1),
          label: 'Cette semaine'
        };
      
      case 'month':
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return {
          start: firstDay,
          end: lastDay,
          label: 'Ce mois'
        };
      
      default:
        return { start: today, end: now, label: "Aujourd'hui" };
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      const dateRange = {
        start: customStartDate,
        end: new Date(customEndDate.getTime() + 24 * 60 * 60 * 1000 - 1),
        label: 'Période personnalisée'
      };
      
      if (onFilterChange) {
        onFilterChange(dateRange);
      }
    }
  };

  const handleRefresh = () => {
    const currentRange = selectedPeriod === 'custom' && customStartDate && customEndDate
      ? {
          start: customStartDate,
          end: new Date(customEndDate.getTime() + 24 * 60 * 60 * 1000 - 1),
          label: 'Période personnalisée'
        }
      : calculateDateRange(selectedPeriod);

    if (onRefresh) {
      onRefresh(currentRange);
    }
  };

  const getCurrentRangeLabel = () => {
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      return `${customStartDate.toLocaleDateString('fr-FR')} - ${customEndDate.toLocaleDateString('fr-FR')}`;
    }
    
    const range = calculateDateRange(selectedPeriod);
    return range.label;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <ToggleButtonGroup
              value={selectedPeriod}
              exclusive
              onChange={handlePeriodChange}
              size="small"
              sx={{ flexWrap: 'wrap' }}
            >
              {periods.map((period) => (
                <ToggleButton key={period.value} value={period.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {period.icon}
                    <Typography variant="body2">{period.label}</Typography>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={getCurrentRangeLabel()}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
              >
                Actualiser
              </Button>
            </Box>
          </Box>

          {showCustomDatePicker && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1,
                flexWrap: 'wrap'
              }}
            >
              <DatePicker
                label="Date de début"
                value={customStartDate}
                onChange={(newValue) => setCustomStartDate(newValue)}
                renderInput={(params) => <TextField {...params} size="small" />}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="Date de fin"
                value={customEndDate}
                onChange={(newValue) => setCustomEndDate(newValue)}
                minDate={customStartDate}
                renderInput={(params) => <TextField {...params} size="small" />}
                slotProps={{ textField: { size: 'small' } }}
              />
              <Button
                variant="contained"
                onClick={handleCustomDateApply}
                disabled={!customStartDate || !customEndDate}
              >
                Appliquer
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default DashboardFilters;
