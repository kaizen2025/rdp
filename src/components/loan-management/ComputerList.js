// src/components/loan-management/ComputerList.js - VERSION FINALE, COMPLÈTE ET DÉFINITIVEMENT CORRIGÉE

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, memo } from 'react';
import {
    Box, Paper, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
    Typography, IconButton, Tooltip, Chip, Button, CircularProgress, Alert, Grid,
    Card, CardContent, CardActions, Menu, LinearProgress, ListItemIcon
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import LaptopIcon from '@mui/icons-material/Laptop';

// Import des services et contextes
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// Lazy loading des dialogues
const ComputerDialog = lazy(() => import('../ComputerDialog'));
const ComputerHistoryDialog = lazy(() => import('../ComputerHistoryDialog'));
const MaintenanceDialog = lazy(() => import('../MaintenanceDialog'));
const LoanDialog = lazy(() => import('../LoanDialog'));

const STATUS_CONFIG = {
    available: { label: 'Disponible', color: 'success', icon: CheckCircleIcon },
    loaned: { label: 'Prêté', color: 'info', icon: AssignmentIcon },
    reserved: { label: 'Réservé', color: 'warning', icon: WarningIcon },
    maintenance: { label: 'Maintenance', color: 'warning', icon: BuildIcon },
    retired: { label: 'Retiré', color: 'error', icon: ErrorIcon }
};

const ComputerCard = memo(({ computer, onEdit, onDelete, onHistory, onMaintenance, onLoan }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const statusConfig = STATUS_CONFIG[computer.status] || STATUS_CONFIG.available;
    const StatusIcon = statusConfig.icon;
    return (
        <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LaptopIcon color="primary" /><Typography variant="h6" component="div" noWrap>{computer.name}</Typography></Box>
                    <Chip icon={<StatusIcon />} label={statusConfig.label} size="small" color={statusConfig.color} />
                </Box>
                <Typography variant="body2" color="text.secondary"><strong>S/N:</strong> {computer.serialNumber}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Modèle:</strong> {computer.brand || ''} {computer.model || ''}</Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between' }}>
                <Box>
                    <Tooltip title="Modifier"><IconButton size="small" onClick={() => onEdit(computer)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Historique"><IconButton size="small" onClick={() => onHistory(computer)}><HistoryIcon /></IconButton></Tooltip>
                    <Tooltip title="Maintenance"><IconButton size="small" onClick={() => onMaintenance(computer)}><BuildIcon /></IconButton></Tooltip>
                </Box>
                <Box>
                    {computer.status === 'available' && <Button size="small" variant="contained" startIcon={<AssignmentIcon />} onClick={() => onLoan(computer)}>Prêter</Button>}
                    <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}><MoreVertIcon /></IconButton>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem onClick={() => { onDelete(computer); setAnchorEl(null); }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Supprimer</MenuItem>
                    </Menu>
                </Box>
            </CardActions>
        </Card>
    );
});

const ComputerList = () => {
    const { showNotification, events } = useApp();
    const [computers, setComputers] = useState([]);
    const [users, setUsers] = useState([]);
    const [itStaff, setItStaff] = useState([]);
    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dialog, setDialog] = useState({ open: null, data: null });

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true); else setIsLoading(true);
        setError('');
        try {
            const [computersData, usersData, configData, loansData] = await Promise.all([
                apiService.getComputers(),
                apiService.getExcelUsers(),
                apiService.getConfig(),
                apiService.getLoans(),
            ]);
            setComputers(computersData || []);
            setUsers(usersData.success ? Object.values(usersData.users).flat() : []);
            setItStaff(configData.it_staff || []);
            setLoans(loansData || []);
        } catch (err) {
            console.error("Erreur de chargement des données:", err);
            setError(`Erreur de chargement: ${err.message}`);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const unsubscribe = events.on('data_updated:computers', () => loadData(true));
        return unsubscribe;
    }, [loadData, events]);

    const filteredComputers = useMemo(() => {
        let result = computers;
        if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c => Object.values(c).some(val => String(val).toLowerCase().includes(term)));
        }
        return result;
    }, [computers, statusFilter, searchTerm]);

    const handleApiCall = useCallback(async (apiFunc, ...args) => {
        try {
            await apiFunc(...args);
            showNotification('success', 'Opération réussie.');
            setDialog({ open: null, data: null });
        } catch (err) {
            showNotification('error', `Erreur: ${err.message}`);
        }
    }, [showNotification]);

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }

    return (
        <Box sx={{ p: 2 }}>
            {isRefreshing && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                        <TextField fullWidth size="small" placeholder="Rechercher par nom, S/N, modèle..." InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} onChange={e => setSearchTerm(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Statut</InputLabel>
                            <Select value={statusFilter} label="Statut" onChange={e => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">Tous</MenuItem>
                                {Object.entries(STATUS_CONFIG).map(([key, conf]) => <MenuItem key={key} value={key}>{conf.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ open: 'edit', data: null })}>Ajouter</Button>
                        <Tooltip title="Actualiser"><IconButton onClick={() => loadData(true)} disabled={isRefreshing}><RefreshIcon /></IconButton></Tooltip>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={2}>
                {filteredComputers.map(computer => (
                    <Grid item key={computer.id} xs={12} sm={6} md={4} lg={3}>
                        <ComputerCard
                            computer={computer}
                            onEdit={(data) => setDialog({ open: 'edit', data })}
                            onDelete={(data) => {
                                if (window.confirm(`Voulez-vous vraiment supprimer ${data.name} ?`)) {
                                    handleApiCall(apiService.deleteComputer, data.id);
                                }
                            }}
                            onHistory={(data) => setDialog({ open: 'history', data })}
                            onMaintenance={(data) => setDialog({ open: 'maintenance', data })}
                            onLoan={(data) => setDialog({ open: 'loan', data })}
                        />
                    </Grid>
                ))}
            </Grid>

            <Suspense fallback={<CircularProgress />}>
                {dialog.open === 'edit' && <ComputerDialog open={true} onClose={() => setDialog({ open: null, data: null })} computer={dialog.data} onSave={(data) => handleApiCall(apiService.saveComputer, data)} />}
                {dialog.open === 'history' && <ComputerHistoryDialog open={true} onClose={() => setDialog({ open: null, data: null })} computer={dialog.data} />}
                {dialog.open === 'maintenance' && <MaintenanceDialog open={true} onClose={() => setDialog({ open: null, data: null })} computer={dialog.data} onSave={(id, data) => handleApiCall(apiService.addComputerMaintenance, id, data)} />}
                {dialog.open === 'loan' && <LoanDialog open={true} onClose={() => setDialog({ open: null, data: null })} computer={dialog.data} onSave={(data) => handleApiCall(apiService.createLoan, data)} computers={computers} users={users} itStaff={itStaff} loans={loans} />}
            </Suspense>
        </Box>
    );
};

export default ComputerList;