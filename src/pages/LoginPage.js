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
import Skeleton from '@mui/material/Skeleton';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EngineeringIcon from '@mui/icons-material/Engineering';
import SchoolIcon from '@mui/icons-material/School';
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

    // --- MODIFICATION MAJEURE : Attendre que l'API Electron soit prête ---
    useEffect(() => {
        const loadTechnicians = async () => {
            try {
                const config = await window.electronAPI.getConfig();
                const configuredTechnicians = config.it_technicians || [];

                if (configuredTechnicians.length === 0) {
                    setTechnicians([{ id: 'emergency', name: 'Accès d\'urgence', position: 'Accès temporaire', isActive: true, avatar: 'EM' }]);
                } else {
                    setTechnicians(configuredTechnicians);
                }

                try {
                    const connected = await window.electronAPI.getConnectedTechnicians();
                    setConnectedUsers(Array.isArray(connected) ? connected : []);
                } catch (err) {
                    console.warn('Erreur chargement techniciens connectés (non-critique):', err.message);
                    setConnectedUsers([]);
                }
            } catch (err) {
                console.error('Erreur critique lors du chargement de la configuration:', err.message);
                setError(`Erreur de chargement: ${err.message}`);
                setTechnicians([{ id: 'emergency', name: 'Accès d\'urgence', position: 'Accès temporaire', isActive: true, avatar: 'EM' }]);
            } finally {
                setIsLoadingData(false);
            }
        };

        // Fonction pour vérifier si l'API est prête avant de charger les données
        const waitForApiAndLoad = () => {
            // Si l'API est déjà là, on charge tout de suite
            if (window.electronAPI) {
                loadTechnicians();
                return;
            }

            // Sinon, on vérifie toutes les 100ms
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (window.electronAPI) {
                    clearInterval(interval);
                    loadTechnicians();
                } else if (attempts > 50) { // Timeout après 5 secondes
                    clearInterval(interval);
                    setError("Erreur critique: Impossible de communiquer avec le backend de l'application. Veuillez redémarrer.");
                    setIsLoadingData(false);
                }
            }, 100);
        };

        waitForApiAndLoad();
    }, []);
    // --- FIN DE LA MODIFICATION MAJEURE ---

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
                // --- CORRECTION : Forcer la mise à jour de la présence au login ---
                await window.electronAPI.registerTechnicianLogin(selectedTechnician);
                onLoginSuccess(selectedTechnician);
            } else {
                setError('Mot de passe incorrect.');
            }
        } catch (err) {
            setError(`Erreur de connexion: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getPositionIcon = (position) => {
        const pos = position?.toLowerCase() || '';
        if (pos.includes('responsable')) return <AdminPanelSettingsIcon color="primary" />;
        if (pos.includes('chef')) return <EngineeringIcon color="secondary" />;
        if (pos.includes('alternant')) return <SchoolIcon color="info" />;
        return <PersonIcon />;
    };

    const getPositionColor = (position) => {
        const pos = position?.toLowerCase() || '';
        if (pos.includes('responsable')) return 'primary';
        if (pos.includes('chef')) return 'secondary';
        if (pos.includes('alternant')) return 'info';
        return 'default';
    };

    const isUserConnected = (technicianId) => connectedUsers.some(user => user.id === technicianId);

    if (isLoadingData) {
        return (
            <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
                <Paper elevation={6} sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography variant="h4">RDS Viewer - Anecoop</Typography>
                    <Typography color="textSecondary" variant="h6">Initialisation de l'application...</Typography>
                </Paper>
            </Container>
        );
    }

    if (step === 1) {
        return (
            <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
                <Fade in={true} timeout={500}>
                    <Paper elevation={6} sx={{ p: 4 }}>
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Typography component="h1" variant="h4">RDS Viewer - Anecoop</Typography>
                            <Typography color="textSecondary" variant="h6">Sélectionnez votre profil technicien</Typography>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        {technicians.length === 1 && technicians[0].id === 'emergency' && !error && (
                            <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
                                Mode d'urgence activé. Veuillez configurer les techniciens dans les paramètres après connexion.
                            </Alert>
                        )}

                        <Grid container spacing={3}>
                            {technicians.map((technician) => {
                                const connected = isUserConnected(technician.id);
                                return (
                                    <Grid item xs={12} sm={6} md={technicians.length > 2 ? 3 : 6} key={technician.id}>
                                        <Card elevation={connected ? 4 : 2} sx={{ height: '100%', position: 'relative', border: connected ? '2px solid' : '1px solid transparent', borderColor: 'success.main', opacity: technician.isActive ? 1 : 0.6 }}>
                                            <CardActionArea onClick={() => handleTechnicianSelect(technician)} disabled={!technician.isActive} sx={{ height: '100%', p: 1 }}>
                                                <CardContent sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                                                        <Avatar sx={{ width: 64, height: 64, mx: 'auto', bgcolor: getPositionColor(technician.position) + '.main', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                            {technician.avatar || technician.name?.charAt(0) || '?'}
                                                        </Avatar>
                                                        {connected && <CheckCircleIcon color="success" sx={{ position: 'absolute', bottom: -2, right: -2, bgcolor: 'white', borderRadius: '50%', fontSize: '1.2rem' }} />}
                                                    </Box>
                                                    <Typography variant="h6" component="h2">{technician.name}</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                                                        {getPositionIcon(technician.position)}
                                                        <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>{technician.position}</Typography>
                                                    </Box>
                                                    {!technician.isActive && <Chip label="Désactivé" size="small" color="error" variant="outlined" sx={{ mt: 1 }} />}
                                                </CardContent>
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
            <Fade in={true} timeout={500}>
                <Paper elevation={6} sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Button startIcon={<ArrowBackIcon />} onClick={() => { setStep(1); setPassword(''); setError(''); }} sx={{ alignSelf: 'flex-start', mb: 2 }}>Retour</Button>
                        <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: getPositionColor(selectedTechnician.position) + '.main', fontSize: '2rem', fontWeight: 'bold' }}>
                            {selectedTechnician.avatar || selectedTechnician.name.charAt(0)}
                        </Avatar>
                        <Typography component="h1" variant="h5">Connexion</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mb: 3 }}>
                            {getPositionIcon(selectedTechnician.position)}
                            <Box>
                                <Typography variant="h6">{selectedTechnician.name}</Typography>
                                <Typography color="textSecondary" variant="body2">{selectedTechnician.position}</Typography>
                            </Box>
                        </Box>
                        <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                            <TextField margin="normal" required fullWidth name="password" label="Mot de passe" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockOpenIcon />} disabled={isLoading}>
                                {isLoading ? 'Connexion...' : 'Se connecter'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Fade>
        </Container>
    );
};

export default LoginPage;