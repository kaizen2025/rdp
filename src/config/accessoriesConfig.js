// src/config/accessoriesConfig.js - NOUVEAU FICHIER CENTRALISÉ

import React from 'react';

// Icons
import MouseIcon from '@mui/icons-material/Mouse';
import PowerIcon from '@mui/icons-material/Power';
import WorkIcon from '@mui/icons-material/Work';
import UsbIcon from '@mui/icons-material/Usb';
import CableIcon from '@mui/icons-material/Cable';
import DockIcon from '@mui/icons-material/Dock';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import HeadsetIcon from '@mui/icons-material/Headset';
import StorageIcon from '@mui/icons-material/Storage';
import DevicesIcon from '@mui/icons-material/Devices';

/**
 * Configuration des icônes disponibles pour les accessoires.
 * Cela permet de dissocier les icônes des données de la base de données.
 */
export const ACCESSORY_ICONS = {
    mouse: <MouseIcon fontSize="small" />,
    power: <PowerIcon fontSize="small" />,
    work: <WorkIcon fontSize="small" />,
    usb: <UsbIcon fontSize="small" />,
    cable: <CableIcon fontSize="small" />,
    dock: <DockIcon fontSize="small" />,
    keyboard: <KeyboardIcon fontSize="small" />,
    headset: <HeadsetIcon fontSize="small" />,
    storage: <StorageIcon fontSize="small" />,
    devices: <DevicesIcon fontSize="small" />,
};

/**
 * Renvoie le composant icône correspondant à un ID d'icône.
 * @param {string} iconId - L'ID de l'icône (ex: 'mouse').
 * @returns {React.ReactElement} Le composant icône MUI.
 */
export const getAccessoryIcon = (iconId) => {
    return ACCESSORY_ICONS[iconId] || ACCESSORY_ICONS['devices'];
};