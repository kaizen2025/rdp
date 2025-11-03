// src/components/LoanStatisticsDialog.js - CORRIGÉ POUR UTILISER L'API WEB

import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import LaptopIcon from '@mui/icons-material/Laptop';

import apiService from '../services/apiService'; // Utiliser le service API

const LoanStatisticsDialog = ({ open, onClose }) => {
    const [statistics, setStatistics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (open) {
            loadStatistics();
        }
    }, [open]);

    const loadStatistics = async () => {
        setIsLoading(true);
        try {
            // CORRECTION: Utilisation de apiService
            const stats = await apiService.getLoanStatistics();
            setStatistics(stats);
        } catch (error) {
            console.error('Erreur chargement statistiques:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (!statistics) {
            return (
                <Typography sx={{ p: 4, textAlign: 'center' }}>
                    Impossible de charger les statistiques.
                </Typography>
            );
        }

        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Vue d'ensemble</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}><Typography color="textSecondary" variant="caption">Ordinateurs total</Typography><Typography variant="h4">{statistics.computers.total}</Typography></Grid>
                            <Grid item xs={6} sm={3}><Typography color="textSecondary" variant="caption">Disponibles</Typography><Typography variant="h4" color="success.main">{statistics.computers.available}</Typography></Grid>
                            <Grid item xs={6} sm={3}><Typography color="textSecondary" variant="caption">Prêtés</Typography><Typography variant="h4" color="info.main">{statistics.computers.loaned}</Typography></Grid>
                            <Grid item xs={6} sm={3}><Typography color="textSecondary" variant="caption">Maintenance</Typography><Typography variant="h4" color="warning.main">{statistics.computers.maintenance}</Typography></Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Prêts en cours</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box><Typography color="textSecondary" variant="caption">Actifs</Typography><Typography variant="h5">{statistics.loans.active}</Typography></Box>
                            <Box><Typography color="textSecondary" variant="caption">Réservés</Typography><Typography variant="h5">{statistics.loans.reserved}</Typography></Box>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                            <Box><Typography color="textSecondary" variant="caption">En retard</Typography><Typography variant="h5" color="warning.main">{statistics.loans.overdue}</Typography></Box>
                            <Box><Typography color="textSecondary" variant="caption">Critiques</Typography><Typography variant="h5" color="error.main">{statistics.loans.critical}</Typography></Box>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Historique</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ mb: 2 }}><Typography color="textSecondary" variant="caption">Total prêts</Typography><Typography variant="h4">{statistics.history.totalLoans}</Typography></Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                            <Box><Typography color="textSecondary" variant="caption">30 derniers jours</Typography><Typography variant="h5" color="primary.main">{statistics.history.last30Days || 0}</Typography></Box>
                            <Box><Typography color="textSecondary" variant="caption">Durée moyenne</Typography><Typography variant="h5">{statistics.history.averageLoanDays || 0}j</Typography></Box>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom><PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />Top utilisateurs</Typography>
                    <Paper variant="outlined" sx={{ p: 1 }}>
                        <List dense>
                            {statistics.topUsers.map((item, index) => (<ListItem key={index}><ListItemText primary={item.user} secondary={`${item.count} prêt(s)`} /><Chip label={`#${index + 1}`} size="small" color="primary" /></ListItem>))}
                            {statistics.topUsers.length === 0 && (<ListItem><ListItemText primary="Aucune donnée" /></ListItem>)}
                        </List>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom><LaptopIcon sx={{ verticalAlign: 'middle', mr: 1 }} />Top ordinateurs</Typography>
                    <Paper variant="outlined" sx={{ p: 1 }}>
                        <List dense>
                            {statistics.topComputers.map((item, index) => (<ListItem key={index}><ListItemText primary={item.computerName} secondary={`${item.count} prêt(s)`} /><Chip label={`#${index + 1}`} size="small" color="secondary" /></ListItem>))}
                            {statistics.topComputers.length === 0 && (<ListItem><ListItemText primary="Aucune donnée" /></ListItem>)}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BarChartIcon />Statistiques des prêts</Box></DialogTitle>
            <DialogContent>{renderContent()}</DialogContent>
            <DialogActions><Button onClick={onClose}>Fermer</Button></DialogActions>
        </Dialog>
    );
};

export default LoanStatisticsDialog;