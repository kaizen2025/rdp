// src/components/LoanHistoryDialog.js - AMÉLIORÉ avec config centralisée des accessoires

import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent, { timelineOppositeContentClasses } from '@mui/lab/TimelineOppositeContent';
import apiService from '../services/apiService';
import { getAccessoryIcon } from '../config/accessoriesConfig';

// Icons
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import UpdateIcon from '@mui/icons-material/Update';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';

const eventDetailsConfig = {
    created: { icon: <EventAvailableIcon />, color: 'success', text: 'Prêt créé' },
    reserved: { icon: <EventAvailableIcon />, color: 'info', text: 'Réservation créée' },
    extended: { icon: <UpdateIcon />, color: 'info', text: 'Prêt prolongé' },
    returned: { icon: <AssignmentReturnIcon />, color: 'primary', text: 'Retourné' },
    cancelled: { icon: <CancelIcon />, color: 'error', text: 'Annulé' },
};

const AccessoriesChips = ({ accessories, allAccessories, title = "Accessoires" }) => {
    if (!accessories || accessories.length === 0 || allAccessories.length === 0) return null;
    return (
        <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>{title}:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {accessories.map(accId => {
                    const accessory = allAccessories.find(a => a.id === accId);
                    if (!accessory) return <Chip key={accId} label={accId} size="small" variant="outlined" />;
                    return <Chip key={accId} label={accessory.name} size="small" icon={getAccessoryIcon(accessory.icon)} variant="outlined" />;
                })}
            </Box>
        </Box>
    );
};

const LoanHistoryDialog = ({ open, onClose, loan }) => {
    const [allAccessories, setAllAccessories] = useState([]);

    useEffect(() => {
        if (open) {
            apiService.getAccessories().then(data => setAllAccessories(data || [])).catch(console.error);
        }
    }, [open]);

    if (!loan) return null;
    const formatDate = (dateString) => new Date(dateString).toLocaleString('fr-FR');

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><HistoryIcon color="primary" /><Box><Typography variant="h6" component="span">Historique du prêt - {loan.computerName}</Typography><Typography variant="body2" color="text.secondary">Pour {loan.userDisplayName}</Typography></Box></Box>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loan.accessories && loan.accessories.length > 0 && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>📦 Informations sur le prêt</Typography>
                        <AccessoriesChips accessories={loan.accessories} allAccessories={allAccessories} title="Accessoires prêtés" />
                        {loan.status === 'returned' && loan.returnData?.returnedAccessories && (
                            <>
                                <AccessoriesChips accessories={loan.returnData.returnedAccessories} allAccessories={allAccessories} title="Accessoires retournés" />
                                {(() => {
                                    const missing = loan.accessories.filter(id => !loan.returnData.returnedAccessories.includes(id));
                                    if (missing.length > 0) return (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" color="error" display="block" gutterBottom>⚠️ Accessoires manquants:</Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {missing.map(accId => { const accessory = allAccessories.find(a => a.id === accId); if (!accessory) return null; return <Chip key={accId} label={accessory.name} size="small" icon={getAccessoryIcon(accessory.icon)} color="error" variant="outlined" />;})}
                                            </Box>
                                        </Box>
                                    );
                                })()}
                            </>
                        )}
                    </Box>
                )}
                {(loan.history || []).length === 0 ? (
                    <Typography sx={{ p: 3, textAlign: 'center' }} color="text.secondary">Aucun historique détaillé disponible.</Typography>
                ) : (
                    <Timeline sx={{ [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2, }, }}>
                        {loan.history.map((event, index) => {
                            const config = eventDetailsConfig[event.event] || { icon: <HistoryIcon />, color: 'grey', text: event.event };
                            return (
                                <TimelineItem key={index}>
                                    <TimelineOppositeContent color="text.secondary">{formatDate(event.date)}</TimelineOppositeContent>
                                    <TimelineSeparator><TimelineDot color={config.color}>{config.icon}</TimelineDot>{index < loan.history.length - 1 && <TimelineConnector />}</TimelineSeparator>
                                    <TimelineContent>
                                        <Typography variant="subtitle2" component="span">{config.text}</Typography>
                                        {event.by && (<Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}><PersonIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} /><Typography variant="caption" color="text.secondary">{event.by}</Typography></Box>)}
                                        {event.notes && (<Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>Note: {event.notes}</Typography>)}
                                        {event.details && (<Box sx={{ mt: 1 }}>{event.details.newReturnDate && (<Typography variant="body2" color="text.secondary">Nouvelle date de retour: {new Date(event.details.newReturnDate).toLocaleDateString()}</Typography>)}{event.details.reason && (<Typography variant="body2" color="text.secondary">Raison: {event.details.reason}</Typography>)}</Box>)}
                                    </TimelineContent>
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                )}
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Fermer</Button></DialogActions>
        </Dialog>
    );
};

export default LoanHistoryDialog;