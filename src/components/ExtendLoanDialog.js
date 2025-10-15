// src/components/ExtendLoanDialog.js - Version améliorée avec raison

import React, { useState, useEffect, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays, differenceInDays } from 'date-fns';

import UpdateIcon from '@mui/icons-material/Update';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

const ExtendLoanDialog = ({ open, onClose, loan, onExtend }) => {
    const [newReturnDate, setNewReturnDate] = useState(null);
    const [reason, setReason] = useState('');
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        if (loan && open) {
            setNewReturnDate(addDays(new Date(loan.expectedReturnDate), 7));
            setReason('');
            
            // Charger les paramètres de prêt
            window.electronAPI.getLoanSettings().then(s => setSettings(s));
        }
    }, [loan, open]);

    const validation = useMemo(() => {
        if (!loan || !newReturnDate || !settings) return null;

        const originalLoanDate = new Date(loan.loanDate);
        const currentReturnDate = new Date(loan.expectedReturnDate);
        const totalDays = differenceInDays(newReturnDate, originalLoanDate);
        const extensionDays = differenceInDays(newReturnDate, currentReturnDate);
        const currentExtensions = loan.extensionCount || 0;

        const errors = [];
        const warnings = [];

        // Vérifications
        if (newReturnDate <= currentReturnDate) {
            errors.push('La nouvelle date doit être postérieure à la date actuelle');
        }

        if (extensionDays > 30) {
            warnings.push(`Prolongation importante : ${extensionDays} jours`);
        }

        if (currentExtensions >= settings.maxExtensions) {
            errors.push(`Nombre maximum de prolongations atteint (${settings.maxExtensions})`);
        }

        if (totalDays > settings.maxLoanDays) {
            errors.push(`Durée maximale dépassée (${settings.maxLoanDays} jours)`);
        }

        const isValid = errors.length === 0 && newReturnDate && reason.trim().length > 0;

        return {
            isValid,
            errors,
            warnings,
            totalDays,
            extensionDays,
            remainingExtensions: settings.maxExtensions - currentExtensions - 1,
        };
    }, [loan, newReturnDate, reason, settings]);

    const handleExtend = () => {
        if (validation && validation.isValid) {
            onExtend(loan.id, newReturnDate.toISOString(), reason);
        }
    };

    if (!loan || !settings) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UpdateIcon />
                    Prolonger le prêt
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Ordinateur
                    </Typography>
                    <Typography variant="h6">{loan.computerName}</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Utilisateur
                    </Typography>
                    <Typography variant="body1">{loan.userDisplayName || loan.userName}</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Informations actuelles
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip 
                            label={`Retour prévu : ${new Date(loan.expectedReturnDate).toLocaleDateString()}`}
                            size="small"
                            variant="outlined"
                        />
                        <Chip 
                            label={`${loan.extensionCount || 0} prolongation(s)`}
                            size="small"
                            color="info"
                            variant="outlined"
                        />
                    </Box>
                </Box>

                <DatePicker
                    label="Nouvelle date de retour"
                    value={newReturnDate}
                    onChange={(newValue) => setNewReturnDate(newValue)}
                    minDate={addDays(new Date(loan.expectedReturnDate), 1)}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                />

                <TextField
                    label="Raison de la prolongation"
                    placeholder="Ex: Projet en cours, formation prolongée..."
                    multiline
                    rows={3}
                    fullWidth
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    sx={{ mb: 2 }}
                />

                {validation && (
                    <>
                        {validation.errors.length > 0 && (
                            <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
                                {validation.errors.map((error, i) => (
                                    <Typography key={i} variant="body2">• {error}</Typography>
                                ))}
                            </Alert>
                        )}

                        {validation.warnings.length > 0 && validation.errors.length === 0 && (
                            <Alert severity="warning" icon={<InfoIcon />} sx={{ mb: 2 }}>
                                {validation.warnings.map((warning, i) => (
                                    <Typography key={i} variant="body2">• {warning}</Typography>
                                ))}
                            </Alert>
                        )}

                        {validation.isValid && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    Prolongation de {validation.extensionDays} jour(s).
                                </Typography>
                                <Typography variant="body2">
                                    Durée totale : {validation.totalDays} jour(s).
                                </Typography>
                                {validation.remainingExtensions >= 0 && (
                                    <Typography variant="body2">
                                        {validation.remainingExtensions} prolongation(s) restante(s) après celle-ci.
                                    </Typography>
                                )}
                            </Alert>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button 
                    onClick={handleExtend} 
                    variant="contained"
                    disabled={!validation || !validation.isValid}
                    startIcon={<UpdateIcon />}
                >
                    Prolonger
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExtendLoanDialog;