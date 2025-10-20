// src/services/apiService.js - VERSION FINALE, COMPLÈTE ET CORRIGÉE

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3002/api'
  : 'http://192.168.1.232:3002/api';

async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-Technician-Id': 'kevin_bivia',
        ...options.headers,
    };
    const config = { ...options, headers };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
        }
        if (response.status === 204) return null;
        return response.json();
    } catch (error) {
        console.error(`Erreur API sur ${endpoint}:`, error);
        throw error;
    }
}

const apiService = {
    getConfig: () => request('/config'),
    getConnectedTechnicians: () => request('/technicians/connected'),
    registerTechnicianLogin: (technician) => request('/technicians/login', { method: 'POST', body: JSON.stringify(technician) }),
    getComputers: () => request('/computers'),
    saveComputer: (computer) => {
        const method = computer.id ? 'PUT' : 'POST';
        const endpoint = computer.id ? `/computers/${computer.id}` : '/computers';
        return request(endpoint, { method, body: JSON.stringify(computer) });
    },
    deleteComputer: (id) => request(`/computers/${id}`, { method: 'DELETE' }),
    addComputerMaintenance: (computerId, maintenanceData) => request(`/computers/${computerId}/maintenance`, { method: 'POST', body: JSON.stringify(maintenanceData) }),
    getLoans: () => request('/loans'),
    createLoan: (loan) => request('/loans', { method: 'POST', body: JSON.stringify(loan) }),
    returnLoan: (id, returnNotes, accessoryInfo) => request(`/loans/${id}/return`, { method: 'POST', body: JSON.stringify({ returnNotes, accessoryInfo }) }),
    extendLoan: (id, newReturnDate, reason) => request(`/loans/${id}/extend`, { method: 'POST', body: JSON.stringify({ newReturnDate, reason }) }),
    cancelLoan: (id, reason) => request(`/loans/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    getLoanHistory: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return request(`/loans/history?${params}`);
    },
    getLoanStatistics: () => request('/loans/statistics'),
    getLoanSettings: () => request('/loans/settings'),
    getAccessories: () => request('/accessories'),
    saveAccessory: (accessory) => request('/accessories', { method: 'POST', body: JSON.stringify(accessory) }),
    deleteAccessory: (id) => request(`/accessories/${id}`, { method: 'DELETE' }),
    getNotifications: () => request('/notifications'),
    getUnreadNotifications: () => request('/notifications/unread'),
    markNotificationAsRead: (id) => request(`/notifications/${id}/mark-read`, { method: 'POST' }),
    markAllNotificationsAsRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
    searchAdUsers: (term) => request(`/ad/users/search/${term}`),
    getAdGroupMembers: (groupName) => request(`/ad/groups/${groupName}/members`),
    addUserToGroup: (username, groupName) => request('/ad/groups/members', { method: 'POST', body: JSON.stringify({ username, groupName }) }),
    removeUserFromGroup: (username, groupName) => request(`/ad/groups/${groupName}/members/${username}`, { method: 'DELETE' }),
    getAdUserDetails: (username) => request(`/ad/users/${username}/details`),
    enableAdUser: (username) => request(`/ad/users/${username}/enable`, { method: 'POST' }),
    disableAdUser: (username) => request(`/ad/users/${username}/disable`, { method: 'POST' }),
    resetAdUserPassword: (username, newPassword, mustChange = false) => request(`/ad/users/${username}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword, mustChange }) }),
    getExcelUsers: () => request('/excel/users'),
    saveUserToExcel: (userData) => request('/excel/users', { method: 'POST', body: JSON.stringify(userData) }),
    deleteUserFromExcel: (username) => request(`/excel/users/${username}`, { method: 'DELETE' }),
    getChatChannels: () => request('/chat/channels'),
    getChatMessages: (channelId) => request(`/chat/messages/${channelId}`),
    sendChatMessage: (channelId, messageText, fileData) => request('/chat/messages', { method: 'POST', body: JSON.stringify({ channelId, messageText, fileData }) }),
    pingServer: (server) => request(`/utils/ping/${server}`),
    getRdsSessions: () => request('/rds-sessions'), // Ajout de la fonction manquante
};

export default apiService;