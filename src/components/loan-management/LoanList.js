// src/components/loan-management/LoanList.js - VERSION FINALE, COMPLÈTE ET DÉFINITIVEMENT CORRIGÉE

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
    Box, Paper, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
    Typography, IconButton, Tooltip, Chip, Button, CircularProgress, Alert, LinearProgress, Grid
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import UpdateIcon from '@mui/icons-material/Update';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';

// Import des services et contextes
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// Lazy loading des dialogues
const LoanDialog = lazy(() => import('../LoanDialog'));
const ReturnLoanDialog = lazy(() => import('../ReturnLoanDialog'));
const ExtendLoanDialog = lazy(() => import('../ExtendLoanDialog'));
const LoanHistoryDialog = lazy(() => import('../LoanHistoryDialog'));

const STATUS_CONFIG = {
    active: { label: 'Actif', color: 'success' },
    reserved: { label: 'Réservé', color: 'info' },
    overdue: { label: 'En Retard', color: 'warning', tooltip: 'Retard de 1-3 jours' },
    critical: { label: 'Critique', color: 'error', tooltip: 'Retard de plus de 3 jours' },
};

const LoanRow = memo(({ loan, style, onReturn, onExtend, onCancel, onHistory }) => {
    const statusConfig = STATUS_CONFIG[loan.status] || { label: loan.status, color: 'default' };

    // Calculer les jours de retard
    const daysOverdue = loan.status === 'overdue' || loan.status === 'critical'
        ? Math.floor((new Date() - new Date(loan.expectedReturnDate)) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <Box style={style} sx={{ display: 'flex', alignItems: 'center', px: 2, borderBottom: '1px solid #eee', '&:hover': { backgroundColor: 'action.hover' } }}>
            <Box sx={{ flex: 2 }}><Typography variant="body2" fontWeight="bold">{loan.computerName}</Typography></Box>
            <Box sx={{ flex: 2 }}><Typography variant="body2">{loan.userDisplayName}</Typography></Box>
            <Box sx={{ flex: 1.5 }}><Typography variant="body2">{loan.itStaff}</Typography></Box>
            <Box sx={{ flex: 1.5 }}><Typography variant="body2">{new Date(loan.loanDate).toLocaleDateString()}</Typography></Box>
            <Box sx={{ flex: 1.5 }}><Typography variant="body2">{new Date(loan.expectedReturnDate).toLocaleDateString()}</Typography></Box>
            <Box sx={{ flex: 1.5 }}>
                <Tooltip title={statusConfig.tooltip || statusConfig.label} arrow>
                    <Chip
                        label={daysOverdue > 0 ? `${statusConfig.label} (${daysOverdue}j)` : statusConfig.label}
                        color={statusConfig.color}
                        size="small"
                    />
                </Tooltip>
            </Box>
            <Box sx={{ flex: 1 }}><Typography variant="body2" textAlign="center">{loan.extensionCount || 0}</Typography></Box>
            <Box sx={{ flex: 1.5, textAlign: 'right' }}>
                <Tooltip title="Retourner"><IconButton size="small" onClick={() => onReturn(loan)}><AssignmentReturnIcon color="success" /></IconButton></Tooltip>
                <Tooltip title="Prolonger"><IconButton size="small" onClick={() => onExtend(loan)}><UpdateIcon color="info" /></IconButton></Tooltip>
                <Tooltip title="Historique"><IconButton size="small" onClick={() => onHistory(loan)}><HistoryIcon /></IconButton></Tooltip>
                <Tooltip title="Annuler"><IconButton size="small" onClick={() => onCancel(loan)}><CancelIcon color="error" /></IconButton></Tooltip>
            </Box>
        </Box>
    );
});

const LoanList = () => {
    const { showNotification, events } = useApp();
    const [loans, setLoans] = useState([]);
    const [computers, setComputers] = useState([]);
    const [users, setUsers] = useState([]);
    const [itStaff, setItStaff] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [dialog, setDialog] = useState({ open: null, data: null });

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true); else setIsLoading(true);
        setError('');
        try {
            const [loansData, computersData, usersData, configData] = await Promise.all([
                apiService.getLoans(),
                apiService.getComputers(),
                apiService.getExcelUsers(),
                apiService.getConfig(),
            ]);
            setLoans(loansData || []);
            setComputers(computersData || []);
            setUsers(usersData.success ? Object.values(usersData.users).flat() : []);
            setItStaff(configData.it_staff || []);
        } catch (err) {
            console.error("Erreur de chargement des données de prêts:", err);
            setError(`Erreur de chargement: ${err.message}`);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const unsubscribe = events.on('data_updated', (payload) => {
            if (['loans', 'computers', 'excel_users'].includes(payload.entity)) {
                loadData(true);
            }
        });
        return unsubscribe;
    }, [loadData, events]);

    const filteredLoans = useMemo(() => {
        const activeLoans = loans.filter(l => !['returned', 'cancelled'].includes(l.status));
        let result = activeLoans;
        if (statusFilter !== 'all') {
            if (statusFilter === 'active') {
                result = result.filter(l => ['active', 'overdue', 'critical'].includes(l.status));
            } else {
                result = result.filter(l => l.status === statusFilter);
            }
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.computerName?.toLowerCase().includes(term) ||
                l.userDisplayName?.toLowerCase().includes(term) ||
                l.userName?.toLowerCase().includes(term)
            );
        }
        return result;
    }, [loans, statusFilter, searchTerm]);

    const handleApiCall = useCallback(async (apiFunc, ...args) => {
        try {
            await apiFunc(...args);
            showNotification('success', 'Opération réussie.');
            setDialog({ open: null, data: null });
        } catch (err) {
            showNotification('error', `Erreur: ${err.message}`);
        }
    }, [showNotification]);

    const Row = ({ index, style }) => (
        <LoanRow
            loan={filteredLoans[index]}
            style={style}
            onReturn={(data) => setDialog({ open: 'return', data })}
            onExtend={(data) => setDialog({ open: 'extend', data })}
            onCancel={(data) => {
                if (window.confirm(`Voulez-vous vraiment annuler le prêt pour ${data.computerName} ?`)) {
                    handleApiCall(apiService.cancelLoan, data.id, 'Annulé par le technicien.');
                }
            }}
            onHistory={(data) => setDialog({ open: 'history', data })}
        />
    );

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', height: { xs: 'calc(100vh - 150px)', md: 'calc(100vh - 200px)' } }}>
            {isRefreshing && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small" placeholder="Rechercher..." InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} onChange={e => setSearchTerm(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Statut Prêt</InputLabel>
                            <Select value={statusFilter} label="Statut Prêt" onChange={e => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">Tous (en cours)</MenuItem>
                                <MenuItem value="active">Actifs (inclus retards)</MenuItem>
                                <MenuItem value="reserved">Réservés</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={5} sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                        <Button variant="contained" startIcon={<AddIcon />} size={window.innerWidth < 600 ? 'small' : 'medium'} onClick={() => setDialog({ open: 'new', data: null })}>Nouveau Prêt</Button>
                        <Tooltip title="Actualiser"><IconButton onClick={() => loadData(true)} disabled={isRefreshing}><RefreshIcon /></IconButton></Tooltip>
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ px: 2, py: 1.5, backgroundColor: 'grey.200', display: 'flex', fontWeight: 'bold' }}>
                    <Box sx={{ flex: 2 }}>Ordinateur</Box>
                    <Box sx={{ flex: 2 }}>Utilisateur</Box>
                    <Box sx={{ flex: 1.5 }}>Responsable IT</Box>
                    <Box sx={{ flex: 1.5 }}>Date Prêt</Box>
                    <Box sx={{ flex: 1.5 }}>Retour Prévu</Box>
                    <Box sx={{ flex: 1.5 }}>Statut</Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>Prolong.</Box>
                    <Box sx={{ flex: 1.5, textAlign: 'right' }}>Actions</Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <AutoSizer>
                        {({ height, width }) => (
                            <List height={height} width={width} itemCount={filteredLoans.length} itemSize={50} itemKey={i => filteredLoans[i].id}>
                                {Row}
                            </List>
                        )}
                    </AutoSizer>
                </Box>
            </Paper>

            <Suspense fallback={<CircularProgress />}>
                {dialog.open === 'new' && <LoanDialog open={true} onClose={() => setDialog({ open: null, data: null })} onSave={(data) => handleApiCall(apiService.createLoan, data)} computers={computers} users={users} itStaff={itStaff} loans={loans} />}
                {dialog.open === 'return' && <ReturnLoanDialog open={true} onClose={() => setDialog({ open: null, data: null })} loan={dialog.data} onReturn={(loan, notes, accessoryInfo) => handleApiCall(apiService.returnLoan, loan.id, notes, accessoryInfo)} />}
                {dialog.open === 'extend' && <ExtendLoanDialog open={true} onClose={() => setDialog({ open: null, data: null })} loan={dialog.data} onExtend={(id, date, reason) => handleApiCall(apiService.extendLoan, id, date, reason)} />}
                {dialog.open === 'history' && <LoanHistoryDialog open={true} onClose={() => setDialog({ open: null, data: null })} loan={dialog.data} />}
            </Suspense>
        </Box>
    );
};

export default LoanList;