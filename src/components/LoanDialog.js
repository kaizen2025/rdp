// src/components/LoanDialog.js - AMÉLIORÉ avec config centralisée des accessoires

import React, { useState, useEffect, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Alert from '@mui/material/Alert';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays } from 'date-fns';
import apiService from '../services/apiService';
import { getAccessoryIcon } from '../config/accessoriesConfig';

const LoanDialog = ({ open, onClose, computer, users, itStaff, onSave, isReservation, computers = [], loans = [] }) => {
    const [formData, setFormData] = useState({
        computerId: null,
        userName: '',
        userDisplayName: '',
        itStaff: '',
        loanDate: new Date(),
        expectedReturnDate: addDays(new Date(), 7),
        notes: '',
        accessories: []
    });
    
    const [availableAccessories, setAvailableAccessories] = useState([]);
    const [activeLoan, setActiveLoan] = useState(null);

    useEffect(() => {
        const fetchAccessories = async () => {
            if (open) {
                try {
                    const accs = await apiService.getAccessories();
                    setAvailableAccessories(accs.filter(a => a.active));
                } catch (error) {
                    console.error("Impossible de charger les accessoires", error);
                }
            }
        };
        fetchAccessories();
    }, [open]);

    const availableComputers = computers.filter(c => 
        c.status === 'available' || (isReservation && (c.status === 'loaned' || c.status === 'reserved'))
    );

    useEffect(() => {
        const defaultStaff = itStaff.length > 0 ? itStaff[0] : '';
        setFormData({
            computerId: computer?.id || null,
            userName: '',
            userDisplayName: '',
            itStaff: defaultStaff,
            loanDate: new Date(),
            expectedReturnDate: addDays(new Date(), 7),
            notes: '',
            accessories: []
        });
    }, [computer, open, itStaff]);

    useEffect(() => {
        if (formData.computerId) {
            const currentLoan = loans.find(l => 
                l.computerId === formData.computerId && 
                ['active', 'overdue', 'critical', 'reserved'].includes(l.status)
            );
            setActiveLoan(currentLoan || null);

            if (currentLoan) {
                const minStartDate = addDays(new Date(currentLoan.expectedReturnDate), 1);
                setFormData(prev => ({
                    ...prev,
                    loanDate: minStartDate,
                    expectedReturnDate: addDays(minStartDate, 7)
                }));
            }
        } else {
            setActiveLoan(null);
        }
    }, [formData.computerId, loans]);

    const handleSubmit = () => {
        if (!formData.computerId || !formData.userName || !formData.itStaff) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        const selectedComputer = computers.find(c => c.id === formData.computerId);

        const loanData = {
            computerId: formData.computerId,
            computerName: selectedComputer?.name || 'N/A',
            userName: formData.userName,
            userDisplayName: formData.userDisplayName,
            itStaff: formData.itStaff,
            loanDate: formData.loanDate.toISOString(),
            expectedReturnDate: formData.expectedReturnDate.toISOString(),
            notes: formData.notes,
            accessories: formData.accessories,
            status: isReservation ? 'reserved' : 'active'
        };

        onSave(loanData);
        onClose();
    };

    const handleAccessoryToggle = (accessoryId) => {
        setFormData(prev => ({
            ...prev,
            accessories: prev.accessories.includes(accessoryId)
                ? prev.accessories.filter(id => id !== accessoryId)
                : [...prev.accessories, accessoryId]
        }));
    };

    const minDateForPicker = useMemo(() => {
        if (activeLoan) {
            return addDays(new Date(activeLoan.expectedReturnDate), 1);
        }
        return new Date();
    }, [activeLoan]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{isReservation ? 'Créer une réservation' : 'Créer un prêt'}</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        {computer ? (
                            <Alert severity="info" sx={{ mb: 2 }}>Ordinateur sélectionné: <strong>{computer.name}</strong></Alert>
                        ) : (
                            <FormControl fullWidth required>
                                <InputLabel>Ordinateur</InputLabel>
                                <Select value={formData.computerId || ''} onChange={(e) => setFormData(prev => ({ ...prev, computerId: e.target.value }))} label="Ordinateur">
                                    {availableComputers.map(comp => (<MenuItem key={comp.id} value={comp.id}>{comp.name} - {comp.brand} {comp.model}</MenuItem>))}
                                </Select>
                            </FormControl>
                        )}
                    </Grid>
                    {activeLoan && (<Grid item xs={12}><Alert severity="warning">Cet ordinateur est actuellement prêté jusqu'au {new Date(activeLoan.expectedReturnDate).toLocaleDateString()}. La date de début a été ajustée.</Alert></Grid>)}
                    <Grid item xs={12}>
                        <Autocomplete
                            options={users}
                            getOptionLabel={(option) => `${option.displayName || option.username} (${option.username})`}
                            onChange={(event, newValue) => setFormData(prev => ({...prev, userName: newValue ? newValue.username : '', userDisplayName: newValue ? newValue.displayName : ''}))}
                            renderInput={(params) => <TextField {...params} label="Utilisateur" required />}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth required>
                            <InputLabel>Responsable IT</InputLabel>
                            <Select name="itStaff" label="Responsable IT" value={formData.itStaff} onChange={(e) => setFormData(prev => ({...prev, itStaff: e.target.value }))}>
                                {itStaff.map(staff => (<MenuItem key={staff} value={staff}>{staff}</MenuItem>))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}><DatePicker label={isReservation ? "Date de début" : "Date de prêt"} value={formData.loanDate} onChange={(v) => setFormData(prev => ({...prev, loanDate: v}))} minDate={minDateForPicker} renderInput={(params) => <TextField {...params} fullWidth />} /></Grid>
                    <Grid item xs={12} sm={6}><DatePicker label="Date de retour prévue" value={formData.expectedReturnDate} onChange={(v) => setFormData(prev => ({...prev, expectedReturnDate: v}))} minDate={formData.loanDate} renderInput={(params) => <TextField {...params} fullWidth />} /></Grid>
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>📦 Accessoires prêtés</Typography>
                        <FormGroup><Grid container spacing={1}>
                            {availableAccessories.map(accessory => (
                                <Grid item xs={12} sm={6} key={accessory.id}>
                                    <FormControlLabel control={<Checkbox checked={formData.accessories.includes(accessory.id)} onChange={() => handleAccessoryToggle(accessory.id)}/>} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{getAccessoryIcon(accessory.icon)}{accessory.name}</Box>} />
                                </Grid>
                            ))}
                        </Grid></FormGroup>
                        {formData.accessories.length > 0 && (<Box sx={{ mt: 2 }}><Typography variant="caption" color="text.secondary">Accessoires sélectionnés:</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>{formData.accessories.map(id => { const acc = availableAccessories.find(a => a.id === id); return acc && <Chip key={id} label={acc.name} size="small" icon={getAccessoryIcon(acc.icon)} onDelete={() => handleAccessoryToggle(id)} />;})}</Box></Box>)}
                    </Grid>
                    <Grid item xs={12}><Divider sx={{ my: 1 }} /><TextField name="notes" label="Notes (optionnel)" value={formData.notes} onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value }))} fullWidth multiline rows={3} /></Grid>
                </Grid>
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} variant="contained">{isReservation ? 'Réserver' : 'Confirmer le prêt'}</Button></DialogActions>
        </Dialog>
    );
};

export default LoanDialog;