// src/styles/theme.js - Thème moderne et harmonieux pour RDS Viewer

import { createTheme } from '@mui/material/styles';
import { frFR } from '@mui/material/locale';

// Palette de couleurs moderne et professionnelle
const colors = {
    // Couleurs principales
    primary: {
        50: '#e3f2fd',
        100: '#bbdefb',
        200: '#90caf9',
        300: '#64b5f6',
        400: '#42a5f5',
        500: '#2196f3', // Main
        600: '#1e88e5',
        700: '#1976d2',
        800: '#1565c0',
        900: '#0d47a1',
    },
    secondary: {
        50: '#f3e5f5',
        100: '#e1bee7',
        200: '#ce93d8',
        300: '#ba68c8',
        400: '#ab47bc',
        500: '#9c27b0', // Main
        600: '#8e24aa',
        700: '#7b1fa2',
        800: '#6a1b9a',
        900: '#4a148c',
    },
    // Couleurs de statut
    success: {
        light: '#81c784',
        main: '#4caf50',
        dark: '#388e3c',
        contrastText: '#fff',
    },
    warning: {
        light: '#ffb74d',
        main: '#ff9800',
        dark: '#f57c00',
        contrastText: '#000',
    },
    error: {
        light: '#e57373',
        main: '#f44336',
        dark: '#d32f2f',
        contrastText: '#fff',
    },
    info: {
        light: '#64b5f6',
        main: '#2196f3',
        dark: '#1976d2',
        contrastText: '#fff',
    },
    // Couleurs de fond
    background: {
        default: '#f5f7fa',
        paper: '#ffffff',
        dark: '#263238',
    },
    // Couleurs de texte
    text: {
        primary: '#2c3e50',
        secondary: '#546e7a',
        disabled: '#b0bec5',
        hint: '#78909c',
    },
    // Couleurs spécifiques RDS
    rds: {
        online: '#4caf50',
        offline: '#f44336',
        idle: '#ff9800',
        active: '#2196f3',
        disconnected: '#9e9e9e',
    },
};

// Thème principal
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            ...colors.primary,
            main: colors.primary[600],
        },
        secondary: {
            ...colors.secondary,
            main: colors.secondary[600],
        },
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
        background: colors.background,
        text: colors.text,
        divider: 'rgba(0, 0, 0, 0.08)',
    },

    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '-0.01562em',
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '-0.00833em',
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.2,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.235,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.334,
        },
        h6: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.6,
        },
        subtitle1: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.75,
        },
        subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.57,
        },
        body1: {
            fontSize: '1rem',
            fontWeight: 400,
            lineHeight: 1.5,
        },
        body2: {
            fontSize: '0.875rem',
            fontWeight: 400,
            lineHeight: 1.43,
        },
        button: {
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.75,
            textTransform: 'none', // Pas de majuscules automatiques
        },
        caption: {
            fontSize: '0.75rem',
            fontWeight: 400,
            lineHeight: 1.66,
        },
        overline: {
            fontSize: '0.75rem',
            fontWeight: 600,
            lineHeight: 2.66,
            textTransform: 'uppercase',
        },
    },

    shape: {
        borderRadius: 8, // Coins arrondis modernes
    },

    shadows: [
        'none',
        '0px 2px 4px rgba(0,0,0,0.05)',
        '0px 4px 8px rgba(0,0,0,0.08)',
        '0px 8px 16px rgba(0,0,0,0.10)',
        '0px 12px 24px rgba(0,0,0,0.12)',
        '0px 16px 32px rgba(0,0,0,0.14)',
        '0px 20px 40px rgba(0,0,0,0.16)',
        '0px 24px 48px rgba(0,0,0,0.18)',
        '0px 28px 56px rgba(0,0,0,0.20)',
        '0px 32px 64px rgba(0,0,0,0.22)',
        // Shadows 10-24 (Material Design standard)
        ...Array(15).fill('0px 2px 4px rgba(0,0,0,0.05)'),
    ],

    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 500,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 4px 8px rgba(0,0,0,0.12)',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
                elevation1: {
                    boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
                },
                elevation2: {
                    boxShadow: '0px 4px 16px rgba(0,0,0,0.10)',
                },
                elevation3: {
                    boxShadow: '0px 8px 24px rgba(0,0,0,0.12)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0px 4px 16px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        boxShadow: '0px 8px 24px rgba(0,0,0,0.12)',
                        transform: 'translateY(-2px)',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    fontWeight: 500,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 600,
                    backgroundColor: colors.background.default,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none',
                    boxShadow: '2px 0px 8px rgba(0,0,0,0.05)',
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    },

    // Transitions personnalisées
    transitions: {
        duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            standard: 300,
            complex: 375,
            enteringScreen: 225,
            leavingScreen: 195,
        },
        easing: {
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
        },
    },

    // Zindex personnalisés
    zIndex: {
        mobileStepper: 1000,
        fab: 1050,
        speedDial: 1050,
        appBar: 1100,
        drawer: 1200,
        modal: 1300,
        snackbar: 1400,
        tooltip: 1500,
    },
}, frFR); // Locale française

// Export du thème et des couleurs
export { colors };
export default theme;
