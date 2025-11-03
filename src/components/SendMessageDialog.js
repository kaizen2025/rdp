// src/components/SendMessageDialog.js - CORRIGÉ POUR UTILISER L'API WEB

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import apiService from '../services/apiService'; // Utiliser le service API

const SendMessageDialog = ({ open, onClose, selectedSessions, sessions }) => {
    const [message, setMessage] = useState('');

    const getSessionDetails = () => {
        return selectedSessions.map(id => {
            const [server, sessionId] = id.split('-');
            const session = sessions.find(s => s.server === server && s.sessionId === sessionId);
            return session ? `${session.username} sur ${session.server}` : `Session ${sessionId} sur ${server}`;
        });
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        const promises = selectedSessions.map(id => {
            const [server, sessionId] = id.split('-');
            // CORRECTION: Utilisation de apiService
            return apiService.sendRdsMessage(server, sessionId, message);
        });

        try {
            await Promise.all(promises);
        } catch(e) {
            console.error("Erreur lors de l'envoi du/des message(s):", e);
            // On pourrait afficher une notification d'erreur ici
        }

        setMessage('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Envoyer un message</DialogTitle>
            <DialogContent>
                <Typography variant="subtitle1" gutterBottom>Destinataires :</Typography>
                <List dense sx={{ maxHeight: 150, overflow: 'auto', mb: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    {getSessionDetails().map((detail, index) => (
                        <ListItem key={index}><ListItemText primary={detail} /></ListItem>
                    ))}
                </List>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Votre message"
                    type="text"
                    fullWidth
                    multiline
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    variant="outlined"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSend} variant="contained" disabled={!message.trim()}>Envoyer</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SendMessageDialog;