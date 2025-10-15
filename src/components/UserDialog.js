// src/components/UserDialog.js

import React, { useState, useEffect } from 'react';
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
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const UserDialog = ({ open, onClose, user, onSave, servers = [] }) => {
    const [formData, setFormData] = useState({
        identifiant: '', motdepasse: '', office: '', nomcomplet: '',
        service: '', email: '', serveur: servers[0] || 'SRV-RDS-1',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showOfficePassword, setShowOfficePassword] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                identifiant: user.username || '', motdepasse: user.password || '',
                office: user.officePassword || '', nomcomplet: user.displayName || '',
                service: user.department || '', email: user.email || '',
                serveur: user.server || servers[0] || 'SRV-RDS-1',
            });
        } else {
            setFormData({
                identifiant: '', motdepasse: '', office: '', nomcomplet: '',
                service: '', email: '', serveur: servers[0] || 'SRV-RDS-1',
            });
        }
        setErrors({});
    }, [user, open, servers]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.identifiant || formData.identifiant.length < 3) newErrors.identifiant = "L'identifiant doit contenir au moins 3 caractères";
        if (formData.identifiant && !/^[a-zA-Z0-9._-]+$/.test(formData.identifiant)) newErrors.identifiant = "L'identifiant contient des caractères invalides";
        if (!formData.motdepasse || formData.motdepasse.length < 8) newErrors.motdepasse = "Le mot de passe doit contenir au moins 8 caractères";
        if (!formData.nomcomplet) newErrors.nomcomplet = "Le nom complet est requis";
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Format d'email invalide";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave({ ...formData, isEdit: !!user });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{user ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Identifiant" fullWidth required value={formData.identifiant} onChange={(e) => handleChange('identifiant', e.target.value)} error={!!errors.identifiant} helperText={errors.identifiant} disabled={!!user} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Nom complet" fullWidth required value={formData.nomcomplet} onChange={(e) => handleChange('nomcomplet', e.target.value)} error={!!errors.nomcomplet} helperText={errors.nomcomplet} />
                    </Grid>
                    
                    {/* CORRECTION: Suppression du bouton "Générer" et ajustement de la grille */}
                    <Grid item xs={12}>
                        <TextField
                            label="Mot de passe" fullWidth required type={showPassword ? 'text' : 'password'}
                            value={formData.motdepasse} onChange={(e) => handleChange('motdepasse', e.target.value)}
                            error={!!errors.motdepasse} helperText={errors.motdepasse}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Mot de passe Office" fullWidth type={showOfficePassword ? 'text' : 'password'}
                            value={formData.office} onChange={(e) => handleChange('office', e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowOfficePassword(!showOfficePassword)} edge="end">
                                            {showOfficePassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Email" fullWidth type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} error={!!errors.email} helperText={errors.email} />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField label="Service" fullWidth value={formData.service} onChange={(e) => handleChange('service', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Serveur</InputLabel>
                            <Select value={formData.serveur} label="Serveur" onChange={(e) => handleChange('serveur', e.target.value)}>
                                {servers.length > 0 ? (
                                    servers.map(server => (<MenuItem key={server} value={server}>{server}</MenuItem>))
                                ) : (
                                    <MenuItem value="SRV-RDS-1">SRV-RDS-1</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>Les champs marqués * sont obligatoires</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSave} variant="contained">{user ? 'Enregistrer' : 'Ajouter'}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserDialog;