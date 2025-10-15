// src/components/LoanDialog.js - Version améliorée avec gestion des accessoires

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

// Icons
import MouseIcon from '@mui/icons-material/Mouse';
import PowerIcon from '@mui/icons-material/Power';
import WorkIcon from '@mui/icons-material/Work';
import UsbIcon from '@mui/icons-material/Usb';
import CableIcon from '@mui/icons-material/Cable';
import DockIcon from '@mui/icons-material/Dock';

// Liste des accessoires disponibles
const AVAILABLE_ACCESSORIES = [
    { id: 'charger', label: 'Chargeur', icon: <PowerIcon fontSize="small" /> },
    { id: 'mouse', label: 'Souris', icon: <MouseIcon fontSize="small" /> },
    { id: 'bag', label: 'Sacoche', icon: <WorkIcon fontSize="small" /> },
    { id: 'docking_station', label: 'Station d\'accueil', icon: <DockIcon fontSize="small" /> },
    { id: 'usb_cable', label: 'Câble USB', icon: <UsbIcon fontSize="small" /> },
    { id: 'hdmi_cable', label: 'Câble HDMI', icon: <CableIcon fontSize="small" /> },
];

const LoanDialog = ({ open, onClose, computer, users, itStaff, onSave, isReservation, computers = [], loans = [] }) => {
    const [formData, setFormData] = useState({
        computerId: null,
        userName: '',
        userDisplayName: '',
        itStaff: '',
        loanDate: new Date(),
        expectedReturnDate: addDays(new Date(), 7),
        notes: '',
        accessories: [] // AJOUT: Liste des accessoires prêtés
    });
    
    const [activeLoan, setActiveLoan] = useState(null);

    const availableComputers = computers.filter(c => 
        c.status === 'available' || c.status === 'loaned' || c.status === 'reserved'
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
            accessories: [] // Réinitialiser les accessoires
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

        const loanData = {
            computerId: formData.computerId,
            userName: formData.userName,
            userDisplayName: formData.userDisplayName,
            itStaff: formData.itStaff,
            loanDate: formData.loanDate.toISOString(),
            expectedReturnDate: formData.expectedReturnDate.toISOString(),
            notes: formData.notes,
            accessories: formData.accessories, // AJOUT: Inclure les accessoires
            status: isReservation ? 'reserved' : 'active'
        };

        onSave(loanData);
        onClose();
    };

    // AJOUT: Gestion des accessoires
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
        return isReservation ? new Date() : new Date();
    }, [activeLoan, isReservation]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {isReservation ? 'Créer une réservation' : 'Créer un prêt'}
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    {/* Sélection ordinateur */}
                    <Grid item xs={12}>
                        {computer ? (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Ordinateur sélectionné: <strong>{computer.name}</strong>
                            </Alert>
                        ) : (
                            <FormControl fullWidth required>
                                <InputLabel>Ordinateur</InputLabel>
                                <Select
                                    value={formData.computerId || ''}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        computerId: e.target.value 
                                    }))}
                                    label="Ordinateur"
                                >
                                    {availableComputers.map(comp => (
                                        <MenuItem key={comp.id} value={comp.id}>
                                            {comp.name} - {comp.brand} {comp.model}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Grid>

                    {/* Alerte si prêt actif */}
                    {activeLoan && (
                        <Grid item xs={12}>
                            <Alert severity="warning">
                                Cet ordinateur est actuellement prêté jusqu'au{' '}
                                {new Date(activeLoan.expectedReturnDate).toLocaleDateString()}.
                                La date de début du prêt a été ajustée automatiquement.
                            </Alert>
                        </Grid>
                    )}

                    {/* Sélection utilisateur */}
                    <Grid item xs={12}>
                        <Autocomplete
                            options={users}
                            getOptionLabel={(option) => 
                                `${option.displayName || option.username} (${option.username})`
                            }
                            onChange={(event, newValue) => {
                                setFormData(prev => ({
                                    ...prev,
                                    userName: newValue ? newValue.username : '',
                                    userDisplayName: newValue ? newValue.displayName : ''
                                }));
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Utilisateur" required />
                            )}
                        />
                    </Grid>

                    {/* Responsable IT */}
                    <Grid item xs={12}>
                        <FormControl fullWidth required>
                            <InputLabel>Responsable IT</InputLabel>
                            <Select
                                name="itStaff"
                                label="Responsable IT"
                                value={formData.itStaff}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    itStaff: e.target.value 
                                }))}
                            >
                                {itStaff.map(staff => (
                                    <MenuItem key={staff} value={staff}>
                                        {staff}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Dates */}
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label={isReservation ? "Date de début du prêt" : "Date de prêt"}
                            value={formData.loanDate}
                            onChange={(newValue) => setFormData(prev => ({ 
                                ...prev, 
                                loanDate: newValue 
                            }))}
                            minDate={minDateForPicker}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Date de retour prévue"
                            value={formData.expectedReturnDate}
                            onChange={(newValue) => setFormData(prev => ({ 
                                ...prev, 
                                expectedReturnDate: newValue 
                            }))}
                            minDate={formData.loanDate}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>

                    {/* AJOUT: Section Accessoires */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            📦 Accessoires prêtés
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Sélectionnez les accessoires qui sont prêtés avec l'ordinateur
                        </Typography>
                        
                        <FormGroup>
                            <Grid container spacing={1}>
                                {AVAILABLE_ACCESSORIES.map(accessory => (
                                    <Grid item xs={12} sm={6} key={accessory.id}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={formData.accessories.includes(accessory.id)}
                                                    onChange={() => handleAccessoryToggle(accessory.id)}
                                                />
                                            }
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {accessory.icon}
                                                    {accessory.label}
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </FormGroup>

                        {/* Résumé des accessoires sélectionnés */}
                        {formData.accessories.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Accessoires sélectionnés:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {formData.accessories.map(accId => {
                                        const acc = AVAILABLE_ACCESSORIES.find(a => a.id === accId);
                                        return (
                                            <Chip
                                                key={accId}
                                                label={acc?.label}
                                                size="small"
                                                icon={acc?.icon}
                                                onDelete={() => handleAccessoryToggle(accId)}
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}
                    </Grid>

                    {/* Notes */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <TextField
                            name="notes"
                            label="Notes (optionnel)"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                notes: e.target.value 
                            }))}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Informations supplémentaires sur le prêt..."
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSubmit} variant="contained">
                    {isReservation ? 'Réserver' : 'Confirmer le prêt'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoanDialog;