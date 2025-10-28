// src/pages/ComputerLoanHistoryPage.js - CORRIGÉ

import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Autocomplete, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Alert
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ComputerIcon from '@mui/icons-material/Computer';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CancelIcon from '@mui/icons-material/Cancel';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

const eventConfig = {
    created: {
        label: 'Prêt créé',
        icon: <AssignmentIcon fontSize="small" />,
        color: 'success'
    },
    returned: {
        label: 'Retourné',
        icon: <CheckCircleIcon fontSize="small" />,
        color: 'primary'
    },
    extended: {
        label: 'Prolongé',
        icon: <TrendingUpIcon fontSize="small" />,
        color: 'info'
    },
    cancelled: {
        label: 'Annulé',
        icon: <CancelIcon fontSize="small" />,
        color: 'error'
    }
};

const ComputerLoanHistoryPage = () => {
    const { showNotification } = useApp();
    const [computers, setComputers] = useState([]);
    const [selectedComputer, setSelectedComputer] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingComputers, setLoadingComputers] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const loadComputers = async () => {
            setLoadingComputers(true);
            try {
                const data = await apiService.getComputers();
                if (Array.isArray(data) && data.length > 0) {
                    const sortedComputers = data.sort((a, b) => 
                        (a.name || '').localeCompare(b.name || '')
                    );
                    setComputers(sortedComputers);
                } else {
                    setComputers([]);
                    showNotification('warning', 'Aucun ordinateur trouvé dans l\'inventaire');
                }
            } catch (error) {
                console.error('Erreur chargement ordinateurs:', error);
                showNotification('error', 'Erreur lors du chargement des ordinateurs');
            } finally {
                setLoadingComputers(false);
            }
        };
        loadComputers();
    }, [showNotification]);

    useEffect(() => {
        if (!selectedComputer) {
            setHistory([]);
            setStats(null);
            return;
        }

        const loadHistory = async () => {
            setHistoryLoading(true);
            try {
                const computerHistory = await apiService.getLoanHistory({
                    computerId: selectedComputer.id,
                    limit: 1000
                });

                setHistory(Array.isArray(computerHistory) ? computerHistory : []);

                const loans = computerHistory.filter(e => e.eventType === 'created');
                const returned = computerHistory.filter(e => e.eventType === 'returned');
                const active = loans.length - returned.length;
                
                let totalDays = 0;
                returned.forEach(event => {
                    if (event.details?.actualReturnDate && event.details?.loanDate) {
                        const days = Math.ceil(
                            (new Date(event.details.actualReturnDate) - new Date(event.details.loanDate)) / 
                            (1000 * 60 * 60 * 24)
                        );
                        totalDays += days;
                    }
                });

                setStats({
                    totalLoans: loans.length,
                    returned: returned.length,
                    active: active,
                    averageDays: returned.length > 0 ? Math.round(totalDays / returned.length) : 0
                });

            } catch (error) {
                console.error('Erreur chargement historique:', error);
                showNotification('error', 'Erreur lors du chargement de l\'historique');
            } finally {
                setHistoryLoading(false);
            }
        };
        
        loadHistory();
    }, [selectedComputer, showNotification]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getComputerLabel = (computer) => {
        return `${computer.name || 'Sans nom'} - ${computer.brand || ''} ${computer.model || ''}`.trim();
    };

    return (
        <Box sx={{ p: 2 }}>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ComputerIcon color="primary" />
                    <Typography variant="h5">Historique des prêts par matériel</Typography>
                </Box>
                
                <Autocomplete
                    options={computers}
                    getOptionLabel={getComputerLabel}
                    loading={loadingComputers}
                    value={selectedComputer}
                    onChange={(event, newValue) => setSelectedComputer(newValue)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Sélectionnez un ordinateur..."
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loadingComputers ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                )
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                            <Box>
                                <Typography variant="body1">{option.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {option.brand} {option.model} • S/N: {option.serialNumber}
                                </Typography>
                            </Box>
                        </li>
                    )}
                />
            </Paper>

            {selectedComputer && (
                <Paper elevation={3} sx={{ p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {selectedComputer.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <Chip label={`${selectedComputer.brand} ${selectedComputer.model}`} variant="outlined" />
                            <Chip label={`S/N: ${selectedComputer.serialNumber}`} variant="outlined" />
                            <Chip 
                                label={selectedComputer.status === 'available' ? 'Disponible' : selectedComputer.status === 'loaned' ? 'Prêté' : 'Réservé'} 
                                color={selectedComputer.status === 'available' ? 'success' : 'warning'}
                            />
                        </Box>

                        {stats && (
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Paper elevation={1} sx={{ p: 1.5, flex: '1 1 150px' }}><Typography variant="caption" color="text.secondary">Total prêts</Typography><Typography variant="h5">{stats.totalLoans}</Typography></Paper>
                                <Paper elevation={1} sx={{ p: 1.5, flex: '1 1 150px' }}><Typography variant="caption" color="text.secondary">Retournés</Typography><Typography variant="h5">{stats.returned}</Typography></Paper>
                                <Paper elevation={1} sx={{ p: 1.5, flex: '1 1 150px' }}><Typography variant="caption" color="text.secondary">En cours</Typography><Typography variant="h5">{stats.active}</Typography></Paper>
                                <Paper elevation={1} sx={{ p: 1.5, flex: '1 1 150px' }}><Typography variant="caption" color="text.secondary">Durée moyenne</Typography><Typography variant="h5">{stats.averageDays}j</Typography></Paper>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <HistoryIcon />
                        <Typography variant="h6">Historique complet</Typography>
                    </Box>

                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                    ) : history.length === 0 ? (
                        <Alert severity="info">Aucun historique de prêt pour cet ordinateur</Alert>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead><TableRow><TableCell>Type</TableCell><TableCell>Utilisateur</TableCell><TableCell>Date événement</TableCell><TableCell>Date prêt</TableCell><TableCell>Retour prévu</TableCell><TableCell>Retour effectif</TableCell><TableCell>Par</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {history.map((event) => {
                                        const config = eventConfig[event.eventType] || {};
                                        return (
                                            <TableRow key={event.id}>
                                                <TableCell><Chip icon={config.icon} label={config.label || event.eventType} color={config.color || 'default'} size="small" /></TableCell>
                                                <TableCell><Typography variant="body2">{event.userDisplayName || event.details?.userName || '-'}</Typography><Typography variant="caption" color="text.secondary">{event.userName || event.details?.username || ''}</Typography></TableCell>
                                                <TableCell>{formatDate(event.date)}</TableCell>
                                                <TableCell>{formatDate(event.details?.loanDate)}</TableCell>
                                                <TableCell>{formatDate(event.details?.expectedReturnDate)}</TableCell>
                                                <TableCell>{formatDate(event.details?.actualReturnDate)}</TableCell>
                                                <TableCell><Typography variant="caption">{event.by || '-'}</Typography></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            )}

            {!selectedComputer && !loadingComputers && (
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <ComputerIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Sélectionnez un ordinateur pour voir son historique de prêts
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default ComputerLoanHistoryPage;