// src/services/RealtimeSyncService.js - Version améliorée avec gestion des techniciens et optimisation des prêts

import { EventEmitter } from 'events';

// Gestionnaire des techniciens connectés
class TechnicianManager {
    constructor() {
        this.connectedTechnicians = new Map();
        this.technicianProfiles = {
            'kevin': {
                id: 'kevin',
                fullName: 'Kevin BIVIA',
                role: 'Chef de projet',
                avatar: 'KB',
                color: '#1976d2',
                permissions: ['admin', 'loans', 'users', 'servers']
            },
            'meher': {
                id: 'meher',
                fullName: 'Meher BENHASSINE', 
                role: 'Chef de projet',
                avatar: 'MB',
                color: '#388e3c',
                permissions: ['admin', 'loans', 'users', 'servers']
            },
            'christelle': {
                id: 'christelle',
                fullName: 'Christelle MOLES',
                role: 'Responsable informatique',
                avatar: 'CM',
                color: '#f57c00',
                permissions: ['admin', 'loans', 'users', 'servers', 'config']
            },
            'macha': {
                id: 'macha',
                fullName: 'Macha ANTON',
                role: 'Alternante informatique', 
                avatar: 'MA',
                color: '#7b1fa2',
                permissions: ['loans', 'users']
            }
        };
    }

    getTechnicianById(id) {
        return this.technicianProfiles[id.toLowerCase()];
    }

    getAllTechnicians() {
        return Object.values(this.technicianProfiles);
    }

    addConnectedTechnician(technicianId, sessionInfo) {
        const profile = this.getTechnicianById(technicianId);
        if (profile) {
            this.connectedTechnicians.set(technicianId, {
                ...profile,
                ...sessionInfo,
                connectedAt: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            });
        }
    }

    removeConnectedTechnician(technicianId) {
        this.connectedTechnicians.delete(technicianId);
    }

    updateTechnicianActivity(technicianId) {
        const technician = this.connectedTechnicians.get(technicianId);
        if (technician) {
            technician.lastActivity = new Date().toISOString();
        }
    }

    getConnectedTechnicians() {
        return Array.from(this.connectedTechnicians.values());
    }

    hasPermission(technicianId, permission) {
        const profile = this.getTechnicianById(technicianId);
        return profile?.permissions.includes(permission) || false;
    }
}

// Gestionnaire des logs d'activité
class ActivityLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
    }

    log(action, technicianId, details = {}) {
        const logEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            action,
            technicianId,
            technicianName: details.technicianName || technicianId,
            category: details.category || 'general',
            resource: details.resource,
            resourceId: details.resourceId,
            details,
            hostname: details.hostname
        };

        this.logs.unshift(logEntry);
        
        // Garder seulement les derniers logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        return logEntry;
    }

    getLogs(filters = {}) {
        let filteredLogs = [...this.logs];

        if (filters.technicianId) {
            filteredLogs = filteredLogs.filter(log => log.technicianId === filters.technicianId);
        }

        if (filters.category) {
            filteredLogs = filteredLogs.filter(log => log.category === filters.category);
        }

        if (filters.startDate) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
        }

        return filteredLogs.slice(0, filters.limit || 100);
    }
}

class RealtimeSyncService extends EventEmitter {
    constructor() {
        super();
        this.currentTechnician = null;
        this.technicianManager = new TechnicianManager();
        this.activityLogger = new ActivityLogger();
        this.isOnline = true;
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.lockTimeout = 10000; // Réduit pour éviter les blocages
        this.refreshInterval = 8000; // Plus fréquent pour les prêts
        this.activeUsers = new Set();
        this.pendingOperations = new Map();
        this.conflictResolver = new ConflictResolver();
        this.isInitialized = false;
        this.initializationPromise = null;
        this.operationQueue = [];
        this.maxRetries = 2;
        this.backoffDelay = 800;
        
        // Statistiques en temps réel
        this.stats = {
            operationsToday: 0,
            lastResetDate: new Date().toDateString()
        };
        
        // Initialisation non-bloquante
        this.initialize();
    }

    // Initialisation avec gestion des techniciens
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this.performInitialization();
        return this.initializationPromise;
    }

    async performInitialization() {
        try {
            console.log('🔄 Initialisation du service de synchronisation avec gestion des techniciens...');
            
            // Initialiser le technicien actuel avec timeout
            await Promise.race([
                this.initCurrentTechnician(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout initialisation technicien')), 2500))
            ]);
            
            // Enregistrer la présence du technicien (non-bloquant)
            this.registerTechnicianPresence().catch(err => 
                console.warn('Échec enregistrement présence (non-critique):', err.message)
            );
            
            // Démarrer la synchronisation avec délai réduit
            setTimeout(() => {
                this.startAutoSync();
                this.setupNetworkDetection();
                this.startStatsReset();
            }, 1500);
            
            this.isInitialized = true;
            console.log('✅ Service de synchronisation initialisé avec succès');
            
        } catch (error) {
            console.warn('⚠️ Initialisation sync échouée (mode dégradé):', error.message);
            this.isOnline = false;
            this.isInitialized = true;
        }
    }

    async initCurrentTechnician() {
        try {
            const config = await Promise.race([
                window.electronAPI.getConfig(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout config')), 1500))
            ]);
            
            const hostname = await Promise.race([
                this.getHostname(),
                new Promise((resolve) => setTimeout(() => resolve('Unknown'), 800))
            ]);
            
            // Utiliser le username de la config pour identifier le technicien
            const technicianId = config.username?.toLowerCase() || 'unknown';
            const technicianProfile = this.technicianManager.getTechnicianById(technicianId);
            
            this.currentTechnician = {
                id: technicianId,
                profile: technicianProfile,
                sessionId: `${technicianId}_${Date.now()}`,
                hostname,
                connectedAt: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            };
            
            // Ajouter aux techniciens connectés
            this.technicianManager.addConnectedTechnician(technicianId, this.currentTechnician);
            
            // Logger la connexion
            this.activityLogger.log('technician_connected', technicianId, {
                technicianName: technicianProfile?.fullName || technicianId,
                role: technicianProfile?.role || 'Non défini',
                hostname,
                category: 'authentication'
            });
            
        } catch (error) {
            // Fallback technicien
            this.currentTechnician = {
                id: 'unknown',
                profile: null,
                sessionId: `unknown_${Date.now()}`,
                hostname: 'Unknown',
                connectedAt: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            };
            throw error;
        }
    }

    // Synchronisation optimisée pour les prêts
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            try {
                // Éviter la surcharge : ne pas sync si trop d'opérations en cours
                if (this.pendingOperations.size > 5) {
                    console.log('⏸️ Sync différée : trop d\'opérations en cours');
                    return;
                }

                await Promise.race([
                    this.performSyncOperations(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 6000))
                ]);
                
            } catch (error) {
                console.warn('⚠️ Erreur sync automatique (non-critique):', error.message);
                this.handleSyncError(error);
            }
        }, this.refreshInterval);

        console.log('🔄 Synchronisation automatique démarrée (8s) avec gestion des prêts');
    }

    async performSyncOperations() {
        // Opérations avec priorité sur les prêts
        const operations = [
            this.checkForLoanUpdates(),
            this.updateTechnicianPresence(), 
            this.checkForUpdates(),
            this.cleanupStaleUsers()
        ];

        const results = await Promise.allSettled(operations.map(op => 
            Promise.race([op, new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout opération')), 2500)
            )])
        ));

        const successes = results.filter(r => r.status === 'fulfilled').length;
        const failures = results.filter(r => r.status === 'rejected').length;
        
        if (failures > successes) {
            console.warn(`🔄 Sync partielle: ${successes} succès, ${failures} échecs`);
        }
    }

    // Nouvelle fonction pour vérifier les mises à jour de prêts
    async checkForLoanUpdates() {
        if (!this.isOnline) return;

        try {
            const [serverLoans, localLoans] = await Promise.all([
                this.loadLoansFromServer(),
                this.loadLoansFromCache()
            ]);

            if (this.hasLoanChanges(serverLoans, localLoans)) {
                const mergedLoans = await this.mergeLoansChanges(serverLoans, localLoans);
                await this.saveLoansToCache(mergedLoans);
                
                this.emit('loansUpdated', {
                    loans: mergedLoans,
                    changes: this.getLoansDiff(localLoans, mergedLoans),
                    updatedBy: this.getLastUpdateTechnician(serverLoans),
                    timestamp: new Date().toISOString()
                });

                // Logger les changements
                this.activityLogger.log('loans_synchronized', this.currentTechnician.id, {
                    technicianName: this.currentTechnician.profile?.fullName,
                    category: 'loan_management',
                    details: { changesCount: this.getLoansDiff(localLoans, mergedLoans).total }
                });
            }
        } catch (error) {
            console.warn('⚠️ Erreur vérification prêts:', error.message);
        }
    }

    // Sauvegarde avec gestion des techniciens et logs
    async saveWithLock(dataType, data, operation = 'update') {
        if (!this.isInitialized) {
            console.warn('⚠️ Service non initialisé, sauvegarde sans verrou');
            return await this.directSave(dataType, data);
        }

        if (!this.currentTechnician) {
            console.warn('⚠️ Aucun technicien connecté, utilisation de l\'utilisateur par défaut');
        }

        const lockId = `${dataType}_${this.currentTechnician?.id || 'unknown'}_${Date.now()}`;
        let retries = 0;
        
        while (retries < this.maxRetries) {
            try {
                return await Promise.race([
                    this.performLockedSaveWithTechnician(lockId, dataType, data, operation),
                    new Promise((_, reject) => setTimeout(() => 
                        reject(new Error('Timeout sauvegarde verrouillée')), 8000))
                ]);
                
            } catch (error) {
                retries++;
                console.warn(`🔄 Tentative ${retries}/${this.maxRetries} échouée:`, error.message);
                
                if (retries >= this.maxRetries) {
                    console.warn('⚠️ Échec verrouillage, sauvegarde directe avec log');
                    const result = await this.directSave(dataType, data);
                    
                    // Logger même en cas d'échec de verrouillage
                    this.logOperationResult(dataType, operation, data, result, 'no_lock');
                    
                    return result;
                }
                
                await new Promise(resolve => setTimeout(resolve, this.backoffDelay * retries));
            }
        }
    }

    async performLockedSaveWithTechnician(lockId, dataType, data, operation) {
        try {
            // Acquérir le verrou avec timeout réduit
            await Promise.race([
                this.acquireLock(dataType, lockId),
                new Promise((_, reject) => setTimeout(() => 
                    reject(new Error('Timeout acquisition verrou')), 4000))
            ]);
            
            // Enrichir les données avec les infos du technicien
            const enrichedData = {
                ...data,
                lastModifiedBy: this.currentTechnician?.profile?.fullName || this.currentTechnician?.id || 'Inconnu',
                lastModifiedById: this.currentTechnician?.id || 'unknown',
                lastModifiedAt: new Date().toISOString(),
                hostname: this.currentTechnician?.hostname
            };
            
            // Marquer l'opération
            this.pendingOperations.set(lockId, {
                technician: this.currentTechnician,
                operation,
                dataType,
                timestamp: new Date().toISOString(),
                data: enrichedData
            });

            // Effectuer la sauvegarde
            const result = await this.directSave(dataType, enrichedData);

            // Logger l'opération
            this.logOperationResult(dataType, operation, enrichedData, result, 'success');

            // Incrémenter les statistiques
            this.incrementOperationStats();

            // Nettoyer
            this.pendingOperations.delete(lockId);
            await this.releaseLock(dataType, lockId);

            // Notifier les autres techniciens
            this.notifyTechnicians(dataType, operation, enrichedData, result);

            this.emit('operationComplete', {
                lockId,
                operation,
                dataType,
                technician: this.currentTechnician,
                success: true,
                result
            });

            return result;

        } catch (error) {
            // Nettoyage et logging d'erreur
            this.pendingOperations.delete(lockId);
            await this.releaseLock(dataType, lockId).catch(console.warn);
            
            this.logOperationResult(dataType, operation, data, { success: false, error: error.message }, 'error');
            
            this.emit('operationComplete', {
                lockId,
                operation,
                dataType,
                technician: this.currentTechnician,
                success: false,
                error: error.message
            });

            throw error;
        }
    }

    // Logging des opérations avec détails du technicien
    logOperationResult(dataType, operation, data, result, status) {
        const logCategory = this.getLogCategory(dataType);
        const logDetails = {
            technicianName: this.currentTechnician?.profile?.fullName,
            role: this.currentTechnician?.profile?.role,
            hostname: this.currentTechnician?.hostname,
            category: logCategory,
            resource: dataType,
            resourceId: data.id || data.computerId || 'unknown',
            operation,
            status,
            success: result?.success,
            details: this.getOperationDetails(dataType, operation, data)
        };

        const actionName = this.getActionName(dataType, operation);
        this.activityLogger.log(actionName, this.currentTechnician?.id || 'unknown', logDetails);
    }

    getLogCategory(dataType) {
        switch (dataType) {
            case 'computers':
            case 'loans':
                return 'loan_management';
            case 'users':
                return 'user_management';
            case 'servers':
                return 'server_management';
            default:
                return 'general';
        }
    }

    getActionName(dataType, operation) {
        return `${dataType}_${operation}`;
    }

    getOperationDetails(dataType, operation, data) {
        switch (dataType) {
            case 'computers':
                return {
                    computerName: data.name,
                    brand: data.brand,
                    model: data.model,
                    status: data.status
                };
            case 'loans':
                return {
                    computerName: data.computerName,
                    userName: data.userName,
                    loanDate: data.loanDate,
                    expectedReturnDate: data.expectedReturnDate,
                    status: data.status,
                    itStaff: data.itStaff
                };
            default:
                return {};
        }
    }

    // Notification aux autres techniciens
    notifyTechnicians(dataType, operation, data, result) {
        if (!result?.success) return;

        const notification = {
            id: Date.now().toString(36),
            timestamp: new Date().toISOString(),
            type: 'operation_notification',
            dataType,
            operation,
            technician: {
                id: this.currentTechnician?.id,
                name: this.currentTechnician?.profile?.fullName,
                role: this.currentTechnician?.profile?.role
            },
            data: this.getNotificationData(dataType, data),
            message: this.getNotificationMessage(dataType, operation, data)
        };

        this.emit('technicianNotification', notification);
    }

    getNotificationData(dataType, data) {
        switch (dataType) {
            case 'loans':
                return {
                    computerName: data.computerName || 'Ordinateur',
                    userName: data.userName,
                    status: data.status
                };
            case 'computers':
                return {
                    name: data.name,
                    status: data.status
                };
            default:
                return {};
        }
    }

    getNotificationMessage(dataType, operation, data) {
        const technicianName = this.currentTechnician?.profile?.fullName || 'Un technicien';
        
        switch (`${dataType}_${operation}`) {
            case 'loans_create':
                return `${technicianName} a créé un nouveau prêt pour ${data.userName}`;
            case 'loans_return':
                return `${technicianName} a marqué un prêt comme retourné`;
            case 'computers_save':
                return `${technicianName} a ${data.id ? 'modifié' : 'ajouté'} l'ordinateur ${data.name}`;
            default:
                return `${technicianName} a effectué une opération ${operation} sur ${dataType}`;
        }
    }

    // Gestion des statistiques
    incrementOperationStats() {
        const today = new Date().toDateString();
        if (this.stats.lastResetDate !== today) {
            this.stats.operationsToday = 0;
            this.stats.lastResetDate = today;
        }
        this.stats.operationsToday++;
    }

    startStatsReset() {
        // Réinitialiser les stats à minuit
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.stats.operationsToday = 0;
            this.stats.lastResetDate = new Date().toDateString();
            
            // Programmer pour tous les jours suivants
            setInterval(() => {
                this.stats.operationsToday = 0;
                this.stats.lastResetDate = new Date().toDateString();
            }, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }

    // Gestion des prêts spécifique
    async loadLoansFromServer() {
        const loadWithTimeout = (promise, timeout = 1500, fallback = []) => {
            return Promise.race([
                promise,
                new Promise((resolve) => setTimeout(() => resolve(fallback), timeout))
            ]);
        };

        return await loadWithTimeout(window.electronAPI.getLoans(), 2000, []);
    }

    async loadLoansFromCache() {
        try {
            const result = await window.electronAPI.getFromCache();
            return result.data?.loans || [];
        } catch (error) {
            return [];
        }
    }

    hasLoanChanges(serverLoans, localLoans) {
        if (!localLoans || localLoans.length === 0) return serverLoans.length > 0;
        if (serverLoans.length !== localLoans.length) return true;
        
        // Vérification rapide des timestamps de modification
        const serverMap = new Map(serverLoans.map(loan => [loan.id, loan.lastModifiedAt]));
        const localMap = new Map(localLoans.map(loan => [loan.id, loan.lastModifiedAt]));
        
        for (const [id, serverTime] of serverMap) {
            const localTime = localMap.get(id);
            if (!localTime || new Date(serverTime) > new Date(localTime)) {
                return true;
            }
        }
        
        return false;
    }

    getLoansDiff(oldLoans, newLoans) {
        const changes = {
            added: [],
            modified: [],
            returned: [],
            total: 0
        };

        if (!oldLoans) return { ...changes, total: newLoans.length };

        const oldMap = new Map((oldLoans || []).map(loan => [loan.id, loan]));
        const newMap = new Map((newLoans || []).map(loan => [loan.id, loan]));

        // Prêts ajoutés ou modifiés
        for (const [id, newLoan] of newMap) {
            const oldLoan = oldMap.get(id);
            if (!oldLoan) {
                changes.added.push(newLoan);
                changes.total++;
            } else if (oldLoan.status !== newLoan.status || oldLoan.lastModifiedAt !== newLoan.lastModifiedAt) {
                if (newLoan.status === 'returned' && oldLoan.status !== 'returned') {
                    changes.returned.push({ old: oldLoan, new: newLoan });
                } else {
                    changes.modified.push({ old: oldLoan, new: newLoan });
                }
                changes.total++;
            }
        }

        return changes;
    }

    async saveLoansToCache(loans) {
        try {
            const existingCache = await window.electronAPI.getFromCache();
            await window.electronAPI.saveToCache({
                ...existingCache.data,
                loans,
                lastSync: new Date().toISOString()
            });
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde cache prêts:', error.message);
        }
    }

    async mergeLoansChanges(serverLoans, localLoans) {
        return this.conflictResolver.resolveLoans(serverLoans, localLoans, this.currentTechnician);
    }

    // Gestion de la présence des techniciens
    async registerTechnicianPresence() {
        try {
            const presenceFile = '\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\technicians_presence.json';
            
            const existingPresence = await Promise.race([
                this.getTechnicianPresenceData(),
                new Promise((resolve) => setTimeout(() => resolve({}), 800))
            ]);
            
            existingPresence[this.currentTechnician.id] = {
                ...this.currentTechnician,
                profile: this.currentTechnician.profile,
                lastSeen: new Date().toISOString(),
                status: 'online'
            };

            await Promise.race([
                window.electronAPI.writeFile(presenceFile, JSON.stringify(existingPresence)),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout présence')), 1200))
            ]);
            
            this.activeUsers.add(this.currentTechnician.id);
        } catch (error) {
            console.warn('⚠️ Erreur enregistrement présence technicien (non-critique):', error.message);
        }
    }

    async updateTechnicianPresence() {
        if (!this.currentTechnician) return;
        
        this.currentTechnician.lastActivity = new Date().toISOString();
        this.technicianManager.updateTechnicianActivity(this.currentTechnician.id);
        await this.registerTechnicianPresence();
    }

    async getTechnicianPresenceData() {
        try {
            const presenceFile = '\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\technicians_presence.json';
            const result = await window.electronAPI.readFile(presenceFile);
            return JSON.parse(result.content || result);
        } catch (error) {
            return {};
        }
    }

    // API publique améliorée
    getCurrentTechnician() {
        return this.currentTechnician;
    }

    getTechnicianManager() {
        return this.technicianManager;
    }

    getConnectedTechnicians() {
        return this.technicianManager.getConnectedTechnicians();
    }

    getActivityLogs(filters = {}) {
        return this.activityLogger.getLogs(filters);
    }

    getOperationStats() {
        return {
            ...this.stats,
            pendingOperations: this.pendingOperations.size,
            isOnline: this.isOnline,
            lastSync: this.lastSyncTime
        };
    }

    hasPermission(permission) {
        return this.technicianManager.hasPermission(this.currentTechnician?.id, permission);
    }

    // Méthodes héritées optimisées...
    async getHostname() {
        try {
            const result = await window.electronAPI.getHostname();
            return result.hostname || result || 'Unknown';
        } catch {
            return 'Unknown';
        }
    }

    async directSave(dataType, data) {
        switch (dataType) {
            case 'computers':
                return await window.electronAPI.saveComputer(data);
            case 'loans':
                if (data.status === 'returned') {
                    return await window.electronAPI.returnLoan(data.id);
                }
                return await window.electronAPI.createLoan(data);
            default:
                throw new Error(`Type de données non supporté: ${dataType}`);
        }
    }

    // Reste des méthodes héritées (acquireLock, releaseLock, etc.)
    async acquireLock(resource, lockId) {
        const lockFile = `${resource}_lock.json`;
        const maxAttempts = 2;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const existingLock = await this.readLockFile(lockFile);
                
                if (existingLock) {
                    const lockAge = Date.now() - new Date(existingLock.timestamp).getTime();
                    
                    if (lockAge > this.lockTimeout) {
                        await this.removeLockFile(lockFile);
                    } else {
                        attempts++;
                        if (attempts >= maxAttempts) {
                            throw new Error(`Verrou occupé pour ${resource}`);
                        }
                        await this.sleep(400 * attempts);
                        continue;
                    }
                }

                const lock = {
                    id: lockId,
                    technician: this.currentTechnician,
                    resource,
                    timestamp: new Date().toISOString()
                };

                await this.writeLockFile(lockFile, lock);
                
                await this.sleep(50);
                const verifyLock = await this.readLockFile(lockFile);
                
                if (verifyLock && verifyLock.id === lockId) {
                    return true;
                } else {
                    attempts++;
                    continue;
                }

            } catch (error) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw new Error(`Impossible d'acquérir le verrou pour ${resource}: ${error.message}`);
                }
                await this.sleep(250 * attempts);
            }
        }

        throw new Error(`Timeout acquisition verrou pour ${resource}`);
    }

    async releaseLock(resource, lockId) {
        try {
            const lockFile = `${resource}_lock.json`;
            const existingLock = await this.readLockFile(lockFile);
            if (existingLock && existingLock.id === lockId) {
                await this.removeLockFile(lockFile);
            }
        } catch (error) {
            console.warn('⚠️ Erreur libération verrou (non-critique):', error.message);
        }
    }

    async readLockFile(filename) {
        try {
            const lockPath = `\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\locks\\${filename}`;
            
            const result = await Promise.race([
                window.electronAPI.readFile(lockPath),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout lecture verrou')), 800))
            ]);
            
            return JSON.parse(result.content || result);
        } catch (error) {
            return null;
        }
    }

    async writeLockFile(filename, lockData) {
        const lockPath = `\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\locks\\${filename}`;
        
        await Promise.race([
            window.electronAPI.writeFile(lockPath, JSON.stringify(lockData)),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout écriture verrou')), 1000))
        ]);
    }

    async removeLockFile(filename) {
        const lockPath = `\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\locks\\${filename}`;
        
        try {
            await Promise.race([
                window.electronAPI.deleteFile(lockPath),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout suppression verrou')), 800))
            ]);
        } catch (error) {
            console.warn('⚠️ Erreur suppression verrou:', error.message);
        }
    }

    // Autres méthodes héritées simplifiées...
    async checkForUpdates() {
        if (!this.isOnline) return;

        try {
            const [serverData, localData] = await Promise.all([
                this.loadFromServer(),
                this.loadFromCache()
            ]);

            if (this.hasServerChanges(serverData, localData)) {
                const mergedData = await this.mergeChanges(serverData, localData);
                await this.saveToCache(mergedData);
                
                this.emit('dataUpdated', {
                    data: mergedData,
                    changes: this.getChangesDiff(localData, mergedData),
                    updatedBy: this.getLastUpdateUser(serverData)
                });
                
                this.lastSyncTime = new Date();
            }
        } catch (error) {
            this.isOnline = false;
            throw error;
        }
    }

    async loadFromServer() {
        const loadWithTimeout = (promise, timeout = 1500, fallback = null) => {
            return Promise.race([
                promise,
                new Promise((resolve) => setTimeout(() => resolve(fallback), timeout))
            ]);
        };

        const [computersData, serversInfo, presenceData] = await Promise.all([
            loadWithTimeout(window.electronAPI.getComputers(), 1500, []),
            loadWithTimeout(window.electronAPI.getServersInfo(), 1200, {}),
            loadWithTimeout(this.getTechnicianPresenceData(), 800, {})
        ]);

        return {
            computers: computersData || [],
            loans: await loadWithTimeout(window.electronAPI.getLoans(), 1500, []),
            serversInfo: serversInfo || {},
            presence: presenceData || {},
            lastModified: await this.getServerLastModified(),
            timestamp: new Date().toISOString()
        };
    }

    hasServerChanges(serverData, localData) {
        if (!localData || !this.lastSyncTime) return true;
        return serverData.lastModified > (localData.lastModified || this.lastSyncTime);
    }

    async mergeChanges(serverData, localData) {
        if (!localData) return serverData;
        return this.conflictResolver.resolve(serverData, localData, this.currentTechnician);
    }

    getChangesDiff(oldData, newData) {
        const changes = {
            computers: { added: [], modified: [], removed: [] },
            loans: { added: [], modified: [], removed: [] }
        };

        if (!oldData) return changes;

        try {
            const oldComputers = new Map((oldData.computers || []).map(c => [c.id, c]));
            const newComputers = new Map((newData.computers || []).map(c => [c.id, c]));

            for (const [id, computer] of newComputers) {
                const old = oldComputers.get(id);
                if (!old) {
                    changes.computers.added.push(computer);
                } else if (old.updatedAt !== computer.updatedAt) {
                    changes.computers.modified.push({ old, new: computer });
                }
            }

            for (const [id, computer] of oldComputers) {
                if (!newComputers.has(id)) {
                    changes.computers.removed.push(computer);
                }
            }
        } catch (error) {
            console.warn('⚠️ Erreur calcul diff (non-critique):', error.message);
        }

        return changes;
    }

    async loadFromCache() {
        try {
            const result = await window.electronAPI.getFromCache();
            return result.data;
        } catch (error) {
            return null;
        }
    }

    async saveToCache(data) {
        try {
            await window.electronAPI.saveToCache(data);
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde cache (non-critique):', error.message);
        }
    }

    handleSyncError(error) {
        console.warn('⚠️ Erreur synchronisation (non-critique):', error.message);
        this.isOnline = false;
        this.emit('syncError', error);
    }

    getLastUpdateUser(serverData) {
        return serverData.lastModifiedBy || 'Inconnu';
    }

    getLastUpdateTechnician(serverData) {
        return serverData.lastModifiedById || 'unknown';
    }

    async getServerLastModified() {
        try {
            const stats = await window.electronAPI.getFileStats('\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\computers_loans.json');
            return stats.mtime;
        } catch (error) {
            return new Date().toISOString();
        }
    }

    setupNetworkDetection() {
        setInterval(async () => {
            try {
                await Promise.race([
                    this.testNetworkConnection(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout réseau')), 2500))
                ]);
                
                if (!this.isOnline) {
                    this.isOnline = true;
                    this.emit('networkRestored');
                }
            } catch (error) {
                if (this.isOnline) {
                    this.isOnline = false;
                    this.emit('networkLost');
                }
            }
        }, 25000);
    }

    async testNetworkConnection() {
        const testFile = '\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\heartbeat.txt';
        await window.electronAPI.writeFile(testFile, new Date().toISOString());
    }

    async cleanupStaleUsers() {
        try {
            const presence = await this.getTechnicianPresenceData();
            const now = new Date();
            let hasChanges = false;

            for (const [userId, userData] of Object.entries(presence)) {
                const lastSeen = new Date(userData.lastSeen || userData.lastActivity);
                const inactiveTime = now.getTime() - lastSeen.getTime();
                
                if (inactiveTime > 180000 && userData.status === 'online') {
                    presence[userId].status = 'offline';
                    hasChanges = true;
                }
                
                if (inactiveTime > 4 * 60 * 60 * 1000) {
                    delete presence[userId];
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                const presenceFile = '\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\technicians_presence.json';
                await window.electronAPI.writeFile(presenceFile, JSON.stringify(presence));
            }
        } catch (error) {
            console.warn('⚠️ Erreur nettoyage utilisateurs (non-critique):', error.message);
        }
    }

    getConnectionStatus() {
        return {
            isOnline: this.isOnline,
            lastSync: this.lastSyncTime,
            connectedTechnicians: this.getConnectedTechnicians(),
            currentTechnician: this.currentTechnician,
            operationsToday: this.stats.operationsToday,
            isInitialized: this.isInitialized
        };
    }

    async forceSync() {
        if (!this.isInitialized) {
            console.warn('⚠️ Service non initialisé, sync ignorée');
            return;
        }
        
        try {
            await this.checkForUpdates();
            await this.checkForLoanUpdates();
        } catch (error) {
            console.warn('⚠️ Erreur force sync:', error.message);
        }
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        // Marquer le technicien comme déconnecté
        if (this.currentTechnician) {
            this.technicianManager.removeConnectedTechnician(this.currentTechnician.id);
            this.unregisterTechnicianPresence().catch(console.warn);
        }
    }

    async unregisterTechnicianPresence() {
        try {
            const presenceFile = '\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\technicians_presence.json';
            const existingPresence = await this.getTechnicianPresenceData();
            
            if (existingPresence[this.currentTechnician.id]) {
                existingPresence[this.currentTechnician.id].status = 'offline';
                existingPresence[this.currentTechnician.id].lastSeen = new Date().toISOString();
            }

            await Promise.race([
                window.electronAPI.writeFile(presenceFile, JSON.stringify(existingPresence)),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout unregister')), 1500))
            ]);
            
            this.activeUsers.delete(this.currentTechnician.id);
            
            // Logger la déconnexion
            this.activityLogger.log('technician_disconnected', this.currentTechnician.id, {
                technicianName: this.currentTechnician.profile?.fullName,
                category: 'authentication'
            });
            
        } catch (error) {
            console.warn('⚠️ Erreur désenregistrement présence:', error.message);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Résolveur de conflits amélioré pour les prêts
class ConflictResolver {
    resolve(serverData, localData, technician) {
        const resolved = { ...serverData };
        resolved.resolvedBy = technician?.id || 'unknown';
        resolved.resolvedAt = new Date().toISOString();
        return resolved;
    }

    resolveLoans(serverLoans, localLoans, technician) {
        // Priorité aux données serveur pour les prêts
        // avec résolution intelligente des conflits
        const resolved = [...serverLoans];
        const serverMap = new Map(serverLoans.map(loan => [loan.id, loan]));
        
        // Vérifier les prêts locaux qui pourraient être plus récents
        for (const localLoan of localLoans) {
            const serverLoan = serverMap.get(localLoan.id);
            
            if (!serverLoan) {
                // Prêt local qui n'existe pas sur le serveur (nouveau)
                resolved.push({
                    ...localLoan,
                    conflictResolved: true,
                    resolvedBy: technician?.id,
                    resolvedAt: new Date().toISOString()
                });
            } else if (new Date(localLoan.lastModifiedAt) > new Date(serverLoan.lastModifiedAt)) {
                // Prêt local plus récent
                const index = resolved.findIndex(loan => loan.id === localLoan.id);
                if (index !== -1) {
                    resolved[index] = {
                        ...localLoan,
                        conflictResolved: true,
                        resolvedBy: technician?.id,
                        resolvedAt: new Date().toISOString()
                    };
                }
            }
        }
        
        return resolved;
    }
}

export default RealtimeSyncService;