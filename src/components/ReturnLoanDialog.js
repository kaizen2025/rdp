// src/components/ReturnLoanDialog.js - Version améliorée avec vérification des accessoires

import React, { useState, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';

// Icons
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MouseIcon from '@mui/icons-material/Mouse';
import PowerIcon from '@mui/icons-material/Power';
import WorkIcon from '@mui/icons-material/Work';
import UsbIcon from '@mui/icons-material/Usb';
import CableIcon from '@mui/icons-material/Cable';
import DockIcon from '@mui/icons-material/Dock';
import ErrorIcon from '@mui/icons-material/Error';

// Même liste que dans LoanDialog
const AVAILABLE_ACCESSORIES = [
    { id: 'charger', label: 'Chargeur', icon: <PowerIcon fontSize="small" /> },
    { id: 'mouse', label: 'Souris', icon: <MouseIcon fontSize="small" /> },
    { id: 'bag', label: 'Sacoche', icon: <WorkIcon fontSize="small" /> },
    { id: 'docking_station', label: 'Station d\'accueil', icon: <DockIcon fontSize="small" /> },
    { id: 'usb_cable', label: 'Câble USB', icon: <UsbIcon fontSize="small" /> },
    { id: 'hdmi_cable', label: 'Câble HDMI', icon: <CableIcon fontSize="small" /> },
];

const ReturnLoanDialog = ({ open, onClose, loan, onReturn }) => {
    const [returnNotes, setReturnNotes] = useState('');
    // AJOUT: État pour suivre les accessoires retournés
    const [returnedAccessories, setReturnedAccessories] = useState([]);

    const returnInfo = useMemo(() => {
        if (!loan) return null;

        const now = new Date();
        const expectedReturn = new Date(loan.expectedReturnDate);
        const loanDate = new Date(loan.loanDate);
        const daysLate = Math.max(0, Math.ceil((now - expectedReturn) / (1000 * 60 * 60 * 24)));
        const totalDays = Math.ceil((now - loanDate) / (1000 * 60 * 60 * 24));

        return {
            isLate: daysLate > 0,
            daysLate,
            totalDays,
            expectedReturnDate: expectedReturn,
        };
    }, [loan]);

    // AJOUT: Vérifier si tous les accessoires prêtés sont retournés
    const accessoriesInfo = useMemo(() => {
        if (!loan || !loan.accessories || loan.accessories.length === 0) {
            return { hasAccessories: false, allReturned: true, missingCount: 0 };
        }

        const loanedAccessories = loan.accessories || [];
        const missingAccessories = loanedAccessories.filter(
            id => !returnedAccessories.includes(id)
        );

        return {
            hasAccessories: true,
            loanedAccessories,
            returnedAccessories,
            missingAccessories,
            allReturned: missingAccessories.length === 0,
            missingCount: missingAccessories.length
        };
    }, [loan, returnedAccessories]);

    const handleAccessoryToggle = (accessoryId) => {
        setReturnedAccessories(prev =>
            prev.includes(accessoryId)
                ? prev.filter(id => id !== accessoryId)
                : [...prev, accessoryId]
        );
    };

    const handleReturn = () => {
        // Ajouter les informations sur les accessoires dans les notes de retour
        const accessoryInfo = accessoriesInfo.hasAccessories 
            ? `\n\n[Accessoires retournés: ${returnedAccessories.length}/${accessoriesInfo.loanedAccessories.length}]`
            : '';
        
        const finalNotes = returnNotes + accessoryInfo;
        
        // Passer aussi les accessoires retournés comme propriété séparée
        onReturn(loan, finalNotes, {
            returnedAccessories: returnedAccessories,
            loanedAccessories: loan.accessories || []
        });
    };

    if (!loan || !returnInfo) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentReturnIcon />
                    Retour de prêt
                </Box>
            </DialogTitle>
            <DialogContent>
                {/* Informations sur le prêt */}
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
                    <Typography variant="body1">
                        {loan.userDisplayName || loan.userName}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Informations sur la durée */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Informations du prêt
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip 
                            label={`Durée totale : ${returnInfo.totalDays} jour(s)`} 
                            size="small" 
                            variant="outlined"
                        />
                        {loan.extensionCount > 0 && (
                            <Chip 
                                label={`${loan.extensionCount} prolongation(s)`} 
                                size="small" 
                                color="info"
                                variant="outlined"
                            />
                        )}
                    </Box>
                </Box>

                {/* Alerte retard */}
                {returnInfo.isLate ? (
                    <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold">
                            Retard de {returnInfo.daysLate} jour(s)
                        </Typography>
                        <Typography variant="caption">
                            Date de retour prévue : {returnInfo.expectedReturnDate.toLocaleDateString()}
                        </Typography>
                    </Alert>
                ) : (
                    <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            Retour dans les délais
                        </Typography>
                    </Alert>
                )}

                {/* AJOUT: Section Vérification des Accessoires */}
                {accessoriesInfo.hasAccessories && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            📦 Vérification des accessoires
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Cochez les accessoires qui ont été retournés
                        </Typography>

                        <FormGroup>
                            <Grid container spacing={1}>
                                {accessoriesInfo.loanedAccessories.map(accId => {
                                    const accessory = AVAILABLE_ACCESSORIES.find(a => a.id === accId);
                                    if (!accessory) return null;
                                    
                                    return (
                                        <Grid item xs={12} sm={6} key={accId}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={returnedAccessories.includes(accId)}
                                                        onChange={() => handleAccessoryToggle(accId)}
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
                                    );
                                })}
                            </Grid>
                        </FormGroup>

                        {/* Alerte si accessoires manquants */}
                        {!accessoriesInfo.allReturned && (
                            <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    ⚠️ <strong>{accessoriesInfo.missingCount} accessoire(s) manquant(s)</strong>
                                </Typography>
                                <Typography variant="caption">
                                    Veuillez vérifier que tous les accessoires ont bien été retournés.
                                    Vous pouvez tout de même procéder au retour si nécessaire.
                                </Typography>
                            </Alert>
                        )}

                        {accessoriesInfo.allReturned && (
                            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    ✓ Tous les accessoires ont été retournés
                                </Typography>
                            </Alert>
                        )}
                    </>
                )}

                {/* Notes de retour */}
                <TextField
                    label="Notes de retour (optionnel)"
                    placeholder="État de l'ordinateur, problèmes constatés, etc."
                    multiline
                    rows={4}
                    fullWidth
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    sx={{ mt: 2 }}
                />

                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                    Les notes et les informations sur les accessoires seront enregistrées dans l'historique du prêt.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button 
                    onClick={handleReturn} 
                    variant="contained" 
                    color={accessoriesInfo.allReturned ? "success" : "warning"}
                    startIcon={<AssignmentReturnIcon />}
                >
                    {accessoriesInfo.allReturned 
                        ? "Confirmer le retour" 
                        : "Retour avec accessoires manquants"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReturnLoanDialog;