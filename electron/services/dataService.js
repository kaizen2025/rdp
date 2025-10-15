// electron/services/dataService.js - VERSION COMPLÈTE AMÉLIORÉE

const path = require('path');
const { safeReadJsonFile, safeWriteJsonFile } = require('./fileService');
const configService = require('./configService');

const NETWORK_PATHS = {
    computers: configService.getSharedFilePath('computers_stock.json'),
    loans: configService.getSharedFilePath('loans.json'),
    loanHistory: configService.getSharedFilePath('loan_history.json'),
    servers: configService.getSharedFilePath('servers_info.json'),
    notifications: configService.getSharedFilePath('loan_notifications.json'),
};

const LOCAL_CACHE = {
    computers: path.join(configService.userDataPath, 'cache-computers.json'),
    loans: path.join(configService.userDataPath, 'cache-loans.json'),
    loanHistory: path.join(configService.userDataPath, 'cache-loan-history.json'),
    servers: path.join(configService.userDataPath, 'cache-servers.json'),
};

const LOAN_STATUS = {
    RESERVED: 'reserved', ACTIVE: 'active', OVERDUE: 'overdue',
    CRITICAL: 'critical', RETURNED: 'returned', CANCELLED: 'cancelled',
};

const LOAN_PRIORITY = { LOW: 'low', NORMAL: 'normal', HIGH: 'high', URGENT: 'urgent' };

async function loadDataWithCache(networkPath, cachePath, defaultValue = null) {
    try {
        const networkData = await safeReadJsonFile(networkPath, null, 3000);
        if (networkData) {
            await safeWriteJsonFile(cachePath, networkData);
            return { data: networkData, source: 'network', isOffline: false };
        }
        const cacheData = await safeReadJsonFile(cachePath, defaultValue);
        return { data: cacheData, source: 'cache', isOffline: true };
    } catch (error) {
        console.warn(`Erreur réseau pour ${path.basename(networkPath)}, cache:`, error.message);
        const cacheData = await safeReadJsonFile(cachePath, defaultValue);
        return { data: cacheData, source: 'cache', isOffline: true };
    }
}

async function saveDataWithCache(networkPath, cachePath, data, technician) {
    try {
        await safeWriteJsonFile(cachePath, data);
        await safeWriteJsonFile(networkPath, data);
        return { success: true, source: 'network' };
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        return { success: false, error: error.message };
    }
}

function calculateLoanStatus(loan) {
    if (loan.status === LOAN_STATUS.RETURNED || loan.status === LOAN_STATUS.CANCELLED) return loan.status;
    if (loan.status === LOAN_STATUS.RESERVED) return LOAN_STATUS.RESERVED;
    const now = new Date();
    const returnDate = new Date(loan.expectedReturnDate);
    const daysUntilReturn = Math.ceil((returnDate - now) / 86400000);
    if (daysUntilReturn < -7) return LOAN_STATUS.CRITICAL;
    if (daysUntilReturn < 0) return LOAN_STATUS.OVERDUE;
    return LOAN_STATUS.ACTIVE;
}

// === ORDINATEURS ===
async function getComputers() {
    const result = await loadDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, { computers: [] });
    return result.data.computers || [];
}

async function saveComputer(computerData, technician) {
    const result = await loadDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, { computers: [] });
    const data = result.data;
    if (!data.computers) data.computers = [];
    const index = data.computers.findIndex(c => c.id === computerData.id);
    if (index >= 0) {
        data.computers[index] = { ...data.computers[index], ...computerData, lastModified: new Date().toISOString(), modifiedBy: technician?.name };
    } else {
        data.computers.push({ ...computerData, id: `pc_${Date.now()}`, createdAt: new Date().toISOString(), createdBy: technician?.name });
    }
    return await saveDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, data, technician);
}

async function deleteComputer(computerId, technician) {
    const result = await loadDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, { computers: [] });
    const data = result.data;
    data.computers = (data.computers || []).filter(c => c.id !== computerId);
    return await saveDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, data, technician);
}

async function addComputerMaintenance(computerId, maintenanceData, technician) {
    const result = await loadDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, { computers: [] });
    const data = result.data;
    const computer = data.computers.find(c => c.id === computerId);
    if (!computer) return { success: false, error: "Ordinateur non trouvé" };
    if (!computer.maintenanceHistory) computer.maintenanceHistory = [];
    const record = {
        id: `maint-${Date.now()}`, ...maintenanceData,
        performedBy: technician?.name || 'Unknown', date: new Date().toISOString()
    };
    computer.maintenanceHistory.push(record);
    computer.lastMaintenanceDate = record.date;
    computer.nextMaintenanceDate = maintenanceData.nextMaintenanceDate;
    return await saveDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, data, technician);
}

// === PRÊTS ===
async function getLoans() {
    const result = await loadDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, { loans: [] });
    return (result.data.loans || []).map(loan => ({ ...loan, status: calculateLoanStatus(loan) }));
}

async function createLoan(loanData, technician) {
    const result = await loadDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, { loans: [] });
    const data = result.data;
    
    const computersResult = await loadDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, { computers: [] });
    const computer = computersResult.data.computers.find(c => c.id === loanData.computerId);
    
    const newLoan = {
        id: `loan_${Date.now()}`, 
        ...loanData, 
        computerName: computer?.name || 'Matériel non défini',
        userDisplayName: loanData.userDisplayName || loanData.userName || 'Utilisateur inconnu',
        createdAt: new Date().toISOString(),
        createdBy: technician?.name, 
        createdById: technician?.id, 
        extensionCount: 0, 
        notificationsSent: [],
        history: [{ 
            event: 'created', 
            date: new Date().toISOString(), 
            by: technician?.name, 
            byId: technician?.id, 
            details: { 
                loanDate: loanData.loanDate, 
                expectedReturnDate: loanData.expectedReturnDate, 
                accessories: loanData.accessories || [],
                computerName: computer?.name,
                userName: loanData.userName,
                userDisplayName: loanData.userDisplayName || loanData.userName
            } 
        }]
    };
    
    data.loans = data.loans || [];
    data.loans.push(newLoan);
    
    if (computer) {
        computer.status = loanData.status === 'reserved' ? 'reserved' : 'loaned';
        computer.currentLoanId = newLoan.id;
        await saveDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, computersResult.data, technician);
    }
    
    await addToLoanHistory({ 
        ...newLoan, 
        eventType: 'created', 
        by: technician?.name, 
        byId: technician?.id, 
        date: newLoan.createdAt 
    });
    
    return await saveDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, data, technician);
}

async function returnLoan(loanId, technician, returnNotes, accessoryInfo = null) {
    const result = await loadDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, { loans: [] });
    const data = result.data;
    const loan = data.loans.find(l => l.id === loanId);
    if (!loan) return { success: false, error: 'Prêt non trouvé' };

    const computersResult = await loadDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, { computers: [] });
    const computer = computersResult.data.computers.find(c => c.id === loan.computerId);

    loan.status = LOAN_STATUS.RETURNED;
    loan.actualReturnDate = new Date().toISOString();
    loan.returnedBy = technician?.name;
    loan.returnedById = technician?.id;
    loan.returnNotes = returnNotes;

    if (accessoryInfo) {
        loan.returnData = {
            returnedAccessories: accessoryInfo.returnedAccessories || [],
            missingAccessories: (loan.accessories || []).filter(id => !(accessoryInfo.returnedAccessories || []).includes(id))
        };
    }

    const daysLate = Math.max(0, Math.ceil((new Date(loan.actualReturnDate) - new Date(loan.expectedReturnDate)) / 86400000));
    
    loan.history.push({
        event: 'returned',
        date: loan.actualReturnDate,
        by: technician?.name,
        byId: technician?.id,
        details: { 
            returnNotes, 
            daysLate, 
            accessories: loan.returnData,
            actualReturnDate: loan.actualReturnDate,
            computerName: computer?.name || loan.computerName,
            userName: loan.userName,
            userDisplayName: loan.userDisplayName
        }
    });

    if (computer) {
        computer.status = 'available';
        computer.currentLoanId = null;
        computer.totalLoans = (computer.totalLoans || 0) + 1;
        const loanDuration = Math.ceil((new Date(loan.actualReturnDate) - new Date(loan.loanDate)) / 86400000);
        computer.totalDaysLoaned = (computer.totalDaysLoaned || 0) + (loanDuration > 0 ? loanDuration : 0);
        await saveDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, computersResult.data, technician);
    }

    await addToLoanHistory({ 
        ...loan, 
        eventType: 'returned', 
        by: technician?.name, 
        byId: technician?.id, 
        date: loan.actualReturnDate,
        computerName: computer?.name || loan.computerName
    });
    
    return await saveDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, data, technician);
}

async function extendLoan(loanId, newReturnDate, reason, technician) {
    const result = await loadDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, { loans: [] });
    const data = result.data;
    const loan = data.loans.find(l => l.id === loanId);
    if (!loan) return { success: false, error: 'Prêt non trouvé' };

    const oldReturnDate = loan.expectedReturnDate;
    loan.expectedReturnDate = new Date(newReturnDate).toISOString();
    loan.extensionCount = (loan.extensionCount || 0) + 1;
    loan.status = calculateLoanStatus(loan);
    
    loan.history.push({
        event: 'extended',
        date: new Date().toISOString(),
        by: technician?.name,
        byId: technician?.id,
        details: { 
            oldReturnDate, 
            newReturnDate: loan.expectedReturnDate, 
            reason,
            computerName: loan.computerName,
            userName: loan.userName,
            userDisplayName: loan.userDisplayName
        }
    });

    await addToLoanHistory({ 
        ...loan, 
        eventType: 'extended', 
        by: technician?.name, 
        byId: technician?.id, 
        date: new Date().toISOString() 
    });
    
    return await saveDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, data, technician);
}

async function cancelLoan(loanId, reason, technician) {
    const result = await loadDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, { loans: [] });
    const data = result.data;
    const loan = data.loans.find(l => l.id === loanId);
    if (!loan) return { success: false, error: 'Prêt non trouvé' };

    loan.status = LOAN_STATUS.CANCELLED;
    loan.history.push({
        event: 'cancelled',
        date: new Date().toISOString(),
        by: technician?.name,
        byId: technician?.id,
        details: { 
            reason,
            computerName: loan.computerName,
            userName: loan.userName,
            userDisplayName: loan.userDisplayName
        }
    });

    const computersResult = await loadDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, { computers: [] });
    const computersData = computersResult.data;
    const computer = computersData.computers.find(c => c.id === loan.computerId);
    if (computer && computer.currentLoanId === loanId) {
        computer.status = 'available';
        computer.currentLoanId = null;
        await saveDataWithCache(NETWORK_PATHS.computers, LOCAL_CACHE.computers, computersData, technician);
    }

    await addToLoanHistory({ 
        ...loan, 
        eventType: 'cancelled', 
        by: technician?.name, 
        byId: technician?.id, 
        date: new Date().toISOString() 
    });
    
    return await saveDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, data, technician);
}

async function saveLoanData(loanData, technician) {
    return await saveDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, loanData, technician);
}

// === PARAMÈTRES ===
async function getLoanSettings() {
    const result = await loadDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, { settings: {} });
    const defaultSettings = {
        maxLoanDays: 90, maxExtensions: 3, reminderDaysBefore: [7, 3, 1],
        overdueReminderDays: [1, 3, 7, 14], autoNotifications: true,
    };
    return { ...defaultSettings, ...(result.data.settings || {}) };
}

async function updateLoanSettings(settings, technician) {
    const result = await loadDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, { loans: [], settings: {} });
    const data = result.data;
    data.settings = { ...data.settings, ...settings };
    return await saveDataWithCache(NETWORK_PATHS.loans, LOCAL_CACHE.loans, data, technician);
}

// === HISTORIQUE - AMÉLIORÉ ===
async function addToLoanHistory(event) {
    try {
        const historyPath = NETWORK_PATHS.loanHistory;
        if (!historyPath) return;

        const history = await safeReadJsonFile(historyPath, []);
        
        const enrichedEvent = {
            ...event,
            id: event.id || `history_${Date.now()}`,
            timestamp: event.date || new Date().toISOString(),
            userDisplayName: event.userDisplayName || event.details?.userDisplayName || 'Utilisateur inconnu',
            userName: event.userName || event.details?.userName || event.details?.username || 'N/A',
            computerName: event.computerName || event.details?.computerName || 'Matériel non défini',
            computerId: event.computerId || event.details?.computerId,
            details: event.details || {}
        };

        history.unshift(enrichedEvent);
        await safeWriteJsonFile(historyPath, history.slice(0, 5000));
    } catch (error) {
        console.error('Erreur ajout historique:', error);
    }
}

async function getLoanHistory(filters = {}) {
    try {
        const historyPath = NETWORK_PATHS.loanHistory;
        if (!historyPath) return [];

        const history = await safeReadJsonFile(historyPath, []);
        let filtered = history;

        if (filters.userName) {
            filtered = filtered.filter(h => 
                h.userName?.toLowerCase().includes(filters.userName.toLowerCase()) ||
                h.userDisplayName?.toLowerCase().includes(filters.userName.toLowerCase())
            );
        }

        if (filters.computerId) {
            filtered = filtered.filter(h => h.computerId === filters.computerId);
        }

        if (filters.eventType) {
            filtered = filtered.filter(h => h.eventType === filters.eventType);
        }

        if (filters.startDate) {
            filtered = filtered.filter(h => new Date(h.date || h.timestamp) >= new Date(filters.startDate));
        }
        
        if (filters.endDate) {
            filtered = filtered.filter(h => new Date(h.date || h.timestamp) <= new Date(filters.endDate));
        }

        if (filters.limit) {
            filtered = filtered.slice(0, filters.limit);
        }

        return filtered.map(event => ({
            ...event,
            computerName: event.computerName || event.details?.computerName || 'Matériel non défini',
            userDisplayName: event.userDisplayName || event.details?.userDisplayName || 'Utilisateur inconnu',
            userName: event.userName || event.details?.userName || 'N/A'
        }));

    } catch (error) {
        console.error('Erreur récupération historique:', error);
        return [];
    }
}

// === STATISTIQUES ===
async function getLoanStatistics() {
    const loans = await getLoans();
    const computers = await getComputers();
    const history = await getLoanHistory({ limit: 1000 });
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const returnedLoans = history.filter(h => h.eventType === 'returned');
    
    const totalLoanDays = returnedLoans.reduce((sum, event) => {
        if (event.details?.actualReturnDate && event.details?.loanDate) {
            const duration = (new Date(event.details.actualReturnDate) - new Date(event.details.loanDate)) / 86400000;
            return sum + (duration > 0 ? duration : 0);
        }
        return sum;
    }, 0);
    
    const userCounts = loans.reduce((acc, loan) => { 
        acc[loan.userName] = (acc[loan.userName] || 0) + 1; 
        return acc; 
    }, {});
    
    const computerCounts = loans.reduce((acc, loan) => { 
        acc[loan.computerName] = (acc[loan.computerName] || 0) + 1; 
        return acc; 
    }, {});

    return {
        computers: {
            total: computers.length, 
            available: computers.filter(c => c.status === 'available').length,
            loaned: computers.filter(c => c.status === 'loaned').length, 
            reserved: computers.filter(c => c.status === 'reserved').length,
            maintenance: computers.filter(c => c.status === 'maintenance').length,
        },
        loans: {
            active: loans.filter(l => l.status === LOAN_STATUS.ACTIVE).length, 
            reserved: loans.filter(l => l.status === LOAN_STATUS.RESERVED).length,
            overdue: loans.filter(l => l.status === LOAN_STATUS.OVERDUE).length, 
            critical: loans.filter(l => l.status === LOAN_STATUS.CRITICAL).length,
        },
        history: {
            totalLoans: history.filter(h => h.eventType === 'created').length,
            last30Days: history.filter(h => h.eventType === 'created' && new Date(h.date) > thirtyDaysAgo).length,
            averageLoanDays: returnedLoans.length > 0 ? Math.round(totalLoanDays / returnedLoans.length) : 0,
            totalReturned: returnedLoans.length, 
            totalCancelled: history.filter(h => h.eventType === 'cancelled').length,
        },
        topUsers: Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([user, count]) => ({ user, count })),
        topComputers: Object.entries(computerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([computerName, count]) => ({ computerName, count })),
    };
}

// === SERVEURS ===
async function getServers() {
    const result = await loadDataWithCache(NETWORK_PATHS.servers, LOCAL_CACHE.servers, { servers: [] });
    return result.data.servers || [];
}

async function saveServerInfo(serverInfo, technician) {
    const result = await loadDataWithCache(NETWORK_PATHS.servers, LOCAL_CACHE.servers, { servers: [] });
    const data = result.data;
    if (!data.servers) data.servers = [];
    const index = data.servers.findIndex(s => s.name === serverInfo.name);
    if (index >= 0) {
        data.servers[index] = { ...data.servers[index], ...serverInfo, lastUpdated: new Date().toISOString() };
    } else {
        data.servers.push({ ...serverInfo, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() });
    }
    return await saveDataWithCache(NETWORK_PATHS.servers, LOCAL_CACHE.servers, data, technician);
}

module.exports = {
    getComputers,
    saveComputer,
    deleteComputer,
    addComputerMaintenance,
    getLoans,
    createLoan,
    returnLoan,
    extendLoan,
    cancelLoan,
    saveLoanData,
    getLoanSettings,
    updateLoanSettings,
    getLoanHistory,
    getLoanStatistics,
    addToLoanHistory,
    getServers,
    saveServerInfo,
    LOAN_STATUS,
    LOAN_PRIORITY,
};