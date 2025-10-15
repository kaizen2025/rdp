// src/App.js - VERSION FINALE CORRIGÉE

import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { AppProvider } from './contexts/AppContext';
import { CacheProvider } from './contexts/CacheContext';
import LoginPage from './pages/LoginPage';

// --- CORRECTION : Le chemin pointe maintenant vers le bon fichier ---
import MainLayout from './layouts/MainLayout'; // Assurez-vous que MainLayout.js est dans src/layouts/

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
        background: {
            default: '#f4f6f8',
            paper: '#ffffff'
        }
    },
    typography: {
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }
});

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentTechnician, setCurrentTechnician] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        const waitForApi = () => new Promise((resolve) => {
            if (window.electronAPI) return resolve();
            let attempts = 0;
            const interval = setInterval(() => {
                if (window.electronAPI || ++attempts > 50) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });

        try {
            await waitForApi();
            if (!window.electronAPI) throw new Error("API Electron non disponible.");
            
            const session = await window.electronAPI.getCurrentTechnicianSession();
            if (session) {
                console.log('✅ Session active trouvée:', session);
                setCurrentTechnician(session);
                setIsAuthenticated(true);
            } else {
                console.log('ℹ️ Aucune session active.');
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('❌ Erreur vérification auth:', error);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const handleLoginSuccess = (technician) => {
        console.log('✅ Login réussi:', technician);
        setCurrentTechnician(technician);
        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        if (currentTechnician) {
            try {
                await window.electronAPI.logoutTechnician(currentTechnician.id);
                console.log('✅ Déconnexion réussie');
            } catch (error) {
                console.error('❌ Erreur déconnexion:', error);
            }
        }
        setIsAuthenticated(false);
        setCurrentTechnician(null);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <Router>
                    {!isAuthenticated ? (
                        <AppProvider>
                            <LoginPage onLoginSuccess={handleLoginSuccess} />
                        </AppProvider>
                    ) : (
                        <AppProvider currentTechnician={currentTechnician}>
                            <CacheProvider>
                                <MainLayout 
                                    onLogout={handleLogout} 
                                    currentTechnician={currentTechnician}
                                />
                            </CacheProvider>
                        </AppProvider>
                    )}
                </Router>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;