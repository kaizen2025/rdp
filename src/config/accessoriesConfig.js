// src/config/accessoriesConfig.js - Configuration centralisée des accessoires

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
import CameraIcon from '@mui/icons-material/Camera';
import PrintIcon from '@mui/icons-material/Print';
import StorageIcon from '@mui/icons-material/Storage';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';

/**
 * Configuration des accessoires disponibles pour les prêts d'ordinateurs
 * 
 * Structure d'un accessoire:
 * - id: Identifiant unique (utilisé dans la base de données)
 * - label: Nom affiché à l'utilisateur
 * - icon: Composant icône Material-UI
 * - category: Catégorie pour le regroupement (optionnel)
 * - isCommon: Si true, affiché en premier (accessoires courants)
 * - description: Description détaillée (optionnel)
 */
export const ACCESSORIES_CONFIG = [
    // === Accessoires courants ===
    {
        id: 'charger',
        label: 'Chargeur',
        icon: <PowerIcon fontSize="small" />,
        category: 'essential',
        isCommon: true,
        description: 'Chargeur secteur d\'origine'
    },
    {
        id: 'mouse',
        label: 'Souris',
        icon: <MouseIcon fontSize="small" />,
        category: 'essential',
        isCommon: true,
        description: 'Souris USB ou sans fil'
    },
    {
        id: 'bag',
        label: 'Sacoche',
        icon: <WorkIcon fontSize="small" />,
        category: 'essential',
        isCommon: true,
        description: 'Sacoche de transport'
    },
    {
        id: 'docking_station',
        label: 'Station d\'accueil',
        icon: <DockIcon fontSize="small" />,
        category: 'connectivity',
        isCommon: true,
        description: 'Station d\'accueil USB-C ou Thunderbolt'
    },
    
    // === Câbles et connectivité ===
    {
        id: 'usb_cable',
        label: 'Câble USB',
        icon: <UsbIcon fontSize="small" />,
        category: 'connectivity',
        isCommon: true,
        description: 'Câble USB-A ou USB-C'
    },
    {
        id: 'hdmi_cable',
        label: 'Câble HDMI',
        icon: <CableIcon fontSize="small" />,
        category: 'connectivity',
        isCommon: true,
        description: 'Câble HDMI pour écran externe'
    },
    {
        id: 'displayport_cable',
        label: 'Câble DisplayPort',
        icon: <CableIcon fontSize="small" />,
        category: 'connectivity',
        isCommon: false,
        description: 'Câble DisplayPort pour écran externe'
    },
    {
        id: 'ethernet_cable',
        label: 'Câble Ethernet',
        icon: <CableIcon fontSize="small" />,
        category: 'connectivity',
        isCommon: false,
        description: 'Câble réseau RJ45'
    },
    
    // === Périphériques ===
    {
        id: 'keyboard',
        label: 'Clavier',
        icon: <KeyboardIcon fontSize="small" />,
        category: 'peripherals',
        isCommon: false,
        description: 'Clavier USB ou sans fil'
    },
    {
        id: 'headset',
        label: 'Casque audio',
        icon: <HeadsetIcon fontSize="small" />,
        category: 'peripherals',
        isCommon: false,
        description: 'Casque avec micro pour visioconférence'
    },
    {
        id: 'webcam',
        label: 'Webcam',
        icon: <CameraIcon fontSize="small" />,
        category: 'peripherals',
        isCommon: false,
        description: 'Webcam externe USB'
    },
    
    // === Stockage ===
    {
        id: 'external_hdd',
        label: 'Disque dur externe',
        icon: <StorageIcon fontSize="small" />,
        category: 'storage',
        isCommon: false,
        description: 'Disque dur externe USB'
    },
    {
        id: 'usb_key',
        label: 'Clé USB',
        icon: <UsbIcon fontSize="small" />,
        category: 'storage',
        isCommon: false,
        description: 'Clé USB pour stockage'
    },
    
    // === Autres ===
    {
        id: 'phone_charger',
        label: 'Chargeur téléphone',
        icon: <PhoneAndroidIcon fontSize="small" />,
        category: 'other',
        isCommon: false,
        description: 'Chargeur de téléphone portable'
    },
];

/**
 * Obtenir tous les accessoires
 */
export const getAllAccessories = () => ACCESSORIES_CONFIG;

/**
 * Obtenir uniquement les accessoires courants
 */
export const getCommonAccessories = () => 
    ACCESSORIES_CONFIG.filter(acc => acc.isCommon);

/**
 * Obtenir les accessoires par catégorie
 */
export const getAccessoriesByCategory = () => {
    const categories = {};
    ACCESSORIES_CONFIG.forEach(acc => {
        const cat = acc.category || 'other';
        if (!categories[cat]) {
            categories[cat] = [];
        }
        categories[cat].push(acc);
    });
    return categories;
};

/**
 * Obtenir un accessoire par son ID
 */
export const getAccessoryById = (id) => 
    ACCESSORIES_CONFIG.find(acc => acc.id === id);

/**
 * Obtenir le label d'un accessoire
 */
export const getAccessoryLabel = (id) => {
    const accessory = getAccessoryById(id);
    return accessory ? accessory.label : id;
};

/**
 * Obtenir l'icône d'un accessoire
 */
export const getAccessoryIcon = (id) => {
    const accessory = getAccessoryById(id);
    return accessory ? accessory.icon : null;
};

/**
 * Labels des catégories
 */
export const CATEGORY_LABELS = {
    essential: '🔧 Essentiels',
    connectivity: '🔌 Connectivité',
    peripherals: '🖱️ Périphériques',
    storage: '💾 Stockage',
    other: '📦 Autres'
};

/**
 * Obtenir le label d'une catégorie
 */
export const getCategoryLabel = (category) => 
    CATEGORY_LABELS[category] || category;

/**
 * Valider qu'un ID d'accessoire existe
 */
export const isValidAccessoryId = (id) => 
    ACCESSORIES_CONFIG.some(acc => acc.id === id);

/**
 * Filtrer les IDs invalides d'une liste
 */
export const filterValidAccessoryIds = (ids) => 
    ids.filter(id => isValidAccessoryId(id));

// Export par défaut
export default {
    ACCESSORIES_CONFIG,
    getAllAccessories,
    getCommonAccessories,
    getAccessoriesByCategory,
    getAccessoryById,
    getAccessoryLabel,
    getAccessoryIcon,
    getCategoryLabel,
    isValidAccessoryId,
    filterValidAccessoryIds,
    CATEGORY_LABELS
};