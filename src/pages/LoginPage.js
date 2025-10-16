// LoginPage.js - Version corrigée avec gestion robuste du démarrage

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

const LoginPage = ({ onLoginSuccess }) => {
    const [step, setStep] = useState(1);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // === AMÉLIORATION (Critique) ===
    // Correction de la condition de concurrence : attendre que l'API Electron soit prête.
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const config = await window.electronAPI.getConfig();
                const configuredTechnicians = config.it_technicians || [];

                if (configuredTechnicians.length === 0) {
                    // Mode d'urgence si aucun technicien n'est configuré
                    setTechnicians([{ id: 'emergency', name: 'Accès d\'urgence', position: 'Accès temporaire', isActive: true, avatar: 'EM' }]);
                } else {
                    setTechnicians(configuredTechnicians);
                }

                // Charger les techniciens déjà connectés (best-effort)
                try {
                    const connected = await window.electronAPI.getConnectedTechnicians();
                    setConnectedUsers(Array.isArray(connected) ? connected.map(c => c.id) : []);
                } catch (err) {
                    console.warn('Erreur chargement techniciens connectés (non-critique):', err.message);
                }

            } catch (err) {
                setError(`Erreur critique de configuration: ${err.message}`);
                setTechnicians([{ id: 'emergency', name: 'Accès d\'urgence', position: 'Accès temporaire', isActive: true, avatar: 'EM' }]);
            } finally {
                setIsLoadingData(false);
            }
        };

        const waitForApiAndLoad = () => {
            if (window.electronAPI) {
                loadInitialData();
                return;
            }
            // Poll pour l'API avec un timeout
            let attempts = 0;
            const interval = setInterval(() => {
                if (window.electronAPI) {
                    clearInterval(interval);
                    loadInitialData();
                } else if (++attempts > 50) { // Timeout après 5 secondes
                    clearInterval(interval);
                    setError("Erreur critique: Impossible de communiquer avec le backend. Veuillez redémarrer l'application.");
                    setIsLoadingData(false);
                }
            }, 100);
        };

        waitForApiAndLoad();
    }, []);

    const handleTechnicianSelect = (technician) => {
        if (!technician.isActive) {
            setError('Ce compte technicien est désactivé.');
            return;
        }
        setSelectedTechnician(technician);
        setError('');
        setStep(2);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const result = await window.electronAPI.loginAttempt(password, selectedTechnician.id);
            if (result.success) {
                await window.electronAPI.registerTechnicianLogin(result.technician);
                onLoginSuccess(result.technician);
            } else {
                setError('Mot de passe incorrect.');
            }
        } catch (err) {
            setError(`Erreur de connexion: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
        return (
            <Container component="main" maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
                <CircularProgress size={60} sx={{ mb: 3 }} />
                <Typography variant="h5">Initialisation de RDS Viewer...</Typography>
                {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
            </Container>
        );
    }

    if (step === 1) {
        return (
            <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
                <Fade in={true}>
                    <Paper elevation={6} sx={{ p: 4 }}>
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Typography component="h1" variant="h4">RDS Viewer - Anecoop</Typography>
                            <Typography color="textSecondary" variant="h6">Sélectionnez votre profil</Typography>
                        </Box>
                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                        {technicians.length === 1 && technicians[0].id === 'emergency' && !error && (
                            <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
                                Mode d'urgence activé. La configuration des techniciens semble manquante.
                            </Alert>
                        )}
                        <Grid container spacing={3}>
                            {technicians.map((tech) => {
                                const isConnected = connectedUsers.includes(tech.id);
                                return (
                                    <Grid item xs={12} sm={6} md={3} key={tech.id}>
                                        <Card elevation={isConnected ? 4 : 2} sx={{ height: '100%', border: isConnected ? '2px solid' : '1px solid transparent', borderColor: 'success.main', opacity: tech.isActive ? 1 : 0.6 }}>
                                            <CardActionArea onClick={() => handleTechnicianSelect(tech)} disabled={!tech.isActive} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <Box sx={{ position: 'relative' }}>
                                                    <Avatar sx={{ width: 64, height: 64, mb: 2, bgcolor: 'primary.main' }}>{tech.avatar}</Avatar>
                                                    {isConnected && <CheckCircleIcon color="success" sx={{ position: 'absolute', bottom: 10, right: -5, bgcolor: 'white', borderRadius: '50%' }} />}
                                                </Box>
                                                <Typography variant="h6" component="h2" textAlign="center">{tech.name}</Typography>
                                                <Typography variant="body2" color="textSecondary" textAlign="center">{tech.position}</Typography>
                                                {!tech.isActive && <Chip label="Désactivé" size="small" color="error" sx={{ mt: 1 }} />}
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Paper>
                </Fade>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Fade in={true}>
                <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => { setStep(1); setPassword(''); setError(''); }} sx={{ alignSelf: 'flex-start', mb: 2 }}>Retour</Button>
                    <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main' }}>{selectedTechnician.avatar}</Avatar>
                    <Typography component="h1" variant="h5">{selectedTechnician.name}</Typography>
                    <Typography color="textSecondary" sx={{ mb: 3 }}>{selectedTechnician.position}</Typography>
                    <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                        <TextField margin="normal" required fullWidth name="password" label="Mot de passe" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockOpenIcon />} disabled={isLoading}>
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </Button>
                    </Box>
                </Paper>
            </Fade>
        </Container>
    );
};

export default LoginPage;