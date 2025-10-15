// electron/services/accessoriesService.js - Service de gestion des accessoires

const path = require('path');
const { safeReadJsonFile, safeWriteJsonFile } = require('./fileService');
const configService = require('./configService');

// SUPPRESSION de la fonction locale getAccessoriesPath
// REMPLACEMENT par l'appel centralisé
function getAccessoriesPath() {
    return configService.getSharedFilePath('accessories_config.json');
}

// Structure par défaut des accessoires
const DEFAULT_ACCESSORIES = {
    accessories: [
        { 
            id: 'charger', 
            name: 'Chargeur', 
            icon: 'power',
            active: true,
            createdAt: new Date().toISOString()
        },
        { 
            id: 'mouse', 
            name: 'Souris', 
            icon: 'mouse',
            active: true,
            createdAt: new Date().toISOString()
        },
        { 
            id: 'bag', 
            name: 'Sacoche', 
            icon: 'work',
            active: true,
            createdAt: new Date().toISOString()
        },
        { 
            id: 'docking_station', 
            name: 'Station d\'accueil', 
            icon: 'dock',
            active: true,
            createdAt: new Date().toISOString()
        },
        { 
            id: 'usb_cable', 
            name: 'Câble USB', 
            icon: 'usb',
            active: true,
            createdAt: new Date().toISOString()
        },
        { 
            id: 'hdmi_cable', 
            name: 'Câble HDMI', 
            icon: 'cable',
            active: true,
            createdAt: new Date().toISOString()
        },
    ],
    lastModified: new Date().toISOString(),
    version: '1.0'
};

/**
 * Charge la liste des accessoires configurés
 */
async function getAccessories() {
    try {
        const accessoriesPath = getAccessoriesPath();
        const data = await safeReadJsonFile(accessoriesPath, null);
        
        if (!data || !data.accessories) {
            // Créer le fichier avec les accessoires par défaut
            await safeWriteJsonFile(accessoriesPath, DEFAULT_ACCESSORIES);
            return DEFAULT_ACCESSORIES.accessories;
        }
        
        return data.accessories || [];
    } catch (error) {
        console.error('Erreur chargement accessoires:', error);
        return DEFAULT_ACCESSORIES.accessories;
    }
}

/**
 * Sauvegarde un accessoire (ajout ou modification)
 */
async function saveAccessory(accessory, technician) {
    try {
        const accessoriesPath = getAccessoriesPath();
        const data = await safeReadJsonFile(accessoriesPath, DEFAULT_ACCESSORIES);
        
        if (!data.accessories) {
            data.accessories = [];
        }
        
        const now = new Date().toISOString();
        
        if (accessory.id) {
            // Modification d'un accessoire existant
            const index = data.accessories.findIndex(a => a.id === accessory.id);
            if (index >= 0) {
                data.accessories[index] = {
                    ...data.accessories[index],
                    ...accessory,
                    modifiedAt: now,
                    modifiedBy: technician?.name || 'Unknown'
                };
            } else {
                return { success: false, error: 'Accessoire non trouvé' };
            }
        } else {
            // Nouvel accessoire
            const newAccessory = {
                ...accessory,
                id: `acc_${Date.now()}`,
                active: true,
                createdAt: now,
                createdBy: technician?.name || 'Unknown'
            };
            data.accessories.push(newAccessory);
        }
        
        data.lastModified = now;
        data.lastModifiedBy = technician?.name || 'Unknown';
        
        await safeWriteJsonFile(accessoriesPath, data);
        return { success: true };
        
    } catch (error) {
        console.error('Erreur sauvegarde accessoire:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprime un accessoire
 */
async function deleteAccessory(accessoryId, technician) {
    try {
        const accessoriesPath = getAccessoriesPath();
        const data = await safeReadJsonFile(accessoriesPath, DEFAULT_ACCESSORIES);
        
        if (!data.accessories) {
            return { success: false, error: 'Aucun accessoire trouvé' };
        }
        
        // Filtrer pour supprimer l'accessoire
        data.accessories = data.accessories.filter(a => a.id !== accessoryId);
        
        data.lastModified = new Date().toISOString();
        data.lastModifiedBy = technician?.name || 'Unknown';
        
        await safeWriteJsonFile(accessoriesPath, data);
        return { success: true };
        
    } catch (error) {
        console.error('Erreur suppression accessoire:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Active/désactive un accessoire
 */
async function toggleAccessoryStatus(accessoryId, active, technician) {
    try {
        const accessoriesPath = getAccessoriesPath();
        const data = await safeReadJsonFile(accessoriesPath, DEFAULT_ACCESSORIES);
        
        const accessory = data.accessories.find(a => a.id === accessoryId);
        if (!accessory) {
            return { success: false, error: 'Accessoire non trouvé' };
        }
        
        accessory.active = active;
        accessory.modifiedAt = new Date().toISOString();
        accessory.modifiedBy = technician?.name || 'Unknown';
        
        data.lastModified = new Date().toISOString();
        data.lastModifiedBy = technician?.name || 'Unknown';
        
        await safeWriteJsonFile(accessoriesPath, data);
        return { success: true };
        
    } catch (error) {
        console.error('Erreur modification statut accessoire:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtient les statistiques d'utilisation des accessoires
 */
async function getAccessoryStatistics() {
    try {
        // Charger les prêts pour analyser l'utilisation des accessoires
        const dataService = require('./dataService');
        const loans = await dataService.getLoans();
        
        const accessories = await getAccessories();
        
        const stats = accessories.map(accessory => {
            // Compter combien de fois cet accessoire a été prêté
            const loanCount = loans.filter(loan => 
                loan.accessories && loan.accessories.includes(accessory.id)
            ).length;
            
            // Compter les prêts actifs avec cet accessoire
            const activeLoanCount = loans.filter(loan => 
                loan.accessories && 
                loan.accessories.includes(accessory.id) &&
                ['active', 'overdue', 'critical', 'reserved'].includes(loan.status)
            ).length;
            
            // Compter les accessoires non retournés
            const missingCount = loans.filter(loan =>
                loan.returnData &&
                loan.returnData.missingAccessories &&
                loan.returnData.missingAccessories.includes(accessory.id)
            ).length;
            
            return {
                id: accessory.id,
                name: accessory.name,
                icon: accessory.icon,
                totalLoans: loanCount,
                currentlyLoaned: activeLoanCount,
                missing: missingCount,
                active: accessory.active
            };
        });
        
        return stats;
        
    } catch (error) {
        console.error('Erreur récupération statistiques accessoires:', error);
        return [];
    }
}

module.exports = {
    getAccessories,
    saveAccessory,
    deleteAccessory,
    toggleAccessoryStatus,
    getAccessoryStatistics
};