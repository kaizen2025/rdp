import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

const GlobalMessageDialog = ({ open, onClose, servers }) => {
    const [message, setMessage] = useState('');

    const handleSend = async () => {
        if (!message.trim()) return;

        // We can leverage the existing 'send-message' IPC handler by sending a message to session ' * '
        // which means "all sessions on this server".
        const promises = servers.map(server =>
            window.electronAPI.sendMessage({ server, sessionId: '*', message })
        );

        try {
            await Promise.all(promises);
        } catch (error) {
            console.error("Erreur lors de l'envoi du message global:", error);
        }

        setMessage('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Envoyer un message à tous les utilisateurs</DialogTitle>
            <DialogContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Ce message sera envoyé à **toutes** les sessions actives sur les serveurs : {servers.join(', ')}.
                </Alert>
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
                <Button onClick={handleSend} variant="contained" color="warning" disabled={!message.trim()}>
                    Envoyer à tous
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GlobalMessageDialog;