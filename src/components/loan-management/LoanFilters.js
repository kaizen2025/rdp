// src/components/loan-management/LoanFilters.js - FILTRES AVANCÉS POUR LES PRÊTS

import React, { useState, useEffect } from 'react';
import {
    Box, Paper, TextField, Select, MenuItem, FormControl, InputLabel,
    Button, Chip, Stack, Autocomplete, IconButton, Tooltip, Collapse
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

// Icons
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * Composant de filtres avancés pour la gestion des prêts
 */
const LoanFilters = ({ onFilterChange, technicians = [] }) => {
    const [expanded, setExpanded] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        startDate: null,
        endDate: null,
        technician: null,
        computerName: '',
        userName: '',
        department: ''
    });

    const statusOptions = [
        { value: 'all', label: 'Tous les statuts' },
        { value: 'active', label: 'Actifs' },
        { value: 'returned', label: 'Retournés' },
        { value: 'overdue', label: 'En retard' },
        { value: 'cancelled', label: 'Annulés' }
    ];

    useEffect(() => {
        // Notifier le parent à chaque changement de filtre
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        const emptyFilters = {
            status: 'all',
            startDate: null,
            endDate: null,
            technician: null,
            computerName: '',
            userName: '',
            department: ''
        };
        setFilters(emptyFilters);
    };

    const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'status') return value !== 'all';
        return value !== null && value !== '';
    }).length;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: expanded ? 2 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon color="primary" />
                        <span style={{ fontWeight: 'bold' }}>Filtres</span>
                        {activeFiltersCount > 0 && (
                            <Chip 
                                label={`${activeFiltersCount} actif${activeFiltersCount > 1 ? 's' : ''}`} 
                                size="small" 
                                color="primary" 
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {activeFiltersCount > 0 && (
                            <Tooltip title="Réinitialiser tous les filtres">
                                <IconButton size="small" onClick={clearFilters}>
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>
                </Box>

                <Collapse in={expanded}>
                    <Stack spacing={2}>
                        {/* Ligne 1 : Statut et Période */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Statut</InputLabel>
                                <Select
                                    value={filters.status}
                                    label="Statut"
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    {statusOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <DatePicker
                                label="Date début"
                                value={filters.startDate}
                                onChange={(newValue) => handleFilterChange('startDate', newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />

                            <DatePicker
                                label="Date fin"
                                value={filters.endDate}
                                onChange={(newValue) => handleFilterChange('endDate', newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Stack>

                        {/* Ligne 2 : Technicien, Ordinateur, Utilisateur */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Autocomplete
                                fullWidth
                                options={technicians}
                                getOptionLabel={(option) => option.name || ''}
                                value={filters.technician}
                                onChange={(event, newValue) => handleFilterChange('technician', newValue)}
                                renderInput={(params) => <TextField {...params} label="Technicien" />}
                            />

                            <TextField
                                fullWidth
                                label="Nom ordinateur"
                                value={filters.computerName}
                                onChange={(e) => handleFilterChange('computerName', e.target.value)}
                                placeholder="Ex: PC-1234"
                            />

                            <TextField
                                fullWidth
                                label="Nom utilisateur"
                                value={filters.userName}
                                onChange={(e) => handleFilterChange('userName', e.target.value)}
                                placeholder="Ex: Jean Dupont"
                            />
                        </Stack>

                        {/* Ligne 3 : Département */}
                        <TextField
                            fullWidth
                            label="Département"
                            value={filters.department}
                            onChange={(e) => handleFilterChange('department', e.target.value)}
                            placeholder="Ex: Informatique"
                        />
                    </Stack>
                </Collapse>
            </Paper>
        </LocalizationProvider>
    );
};

export default LoanFilters;
