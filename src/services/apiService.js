// src/services/apiService.js - VERSION FINALE, COMPLÈTE ET CORRIGÉE

class ApiService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
        this.currentTechnicianId = localStorage.getItem('currentTechnicianId') || null;
        console.log(`🔧 ApiService initialisé avec baseURL: ${this.baseURL} pour le technicien: ${this.currentTechnicianId || 'aucun'}`);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const techId = this.currentTechnicianId;
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (techId) { headers['x-technician-id'] = techId; }
        const config = { ...options, headers };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                const errorMessage = errorData.error || errorData.details || errorData.message || `Erreur HTTP ${response.status}`;
                throw new Error(errorMessage);
            }
            if (response.status === 204) return null;
            return response.json();
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
            }
            throw error;
        }
    }

    setCurrentTechnician(technicianId) {
        this.currentTechnicianId = technicianId;
        if (technicianId) {
            localStorage.setItem('currentTechnicianId', technicianId);
        } else {
            localStorage.removeItem('currentTechnicianId');
        }
        console.log('👤 Technicien actuel défini:', technicianId);
    }

    // AUTH & TECHNICIENS
    async login(technicianData) {
        this.setCurrentTechnician(technicianData.id);
        return this.request('/technicians/login', { method: 'POST', body: JSON.stringify(technicianData) });
    }
    logout() { this.setCurrentTechnician(null); return Promise.resolve(); }
    async getConnectedTechnicians() { return this.request('/technicians/connected'); }

    // CONFIGURATION
    async getConfig() { return this.request('/config'); }
    async saveConfig(newConfig) { return this.request('/config', { method: 'POST', body: JSON.stringify({ newConfig }) }); }

    // SESSIONS RDS & GUACAMOLE
    async getRdsSessions() { return this.request('/rds-sessions'); }
    async refreshRdsSessions() { return this.request('/rds-sessions/refresh', { method: 'POST' }); }
    async sendRdsMessage(server, sessionId, message) { return this.request('/rds-sessions/send-message', { method: 'POST', body: JSON.stringify({ server, sessionId, message }) }); }
    async pingRdsServer(server) { return this.request(`/rds-sessions/ping/${server}`); }
    async createGuacamoleConnection(payload) {
        try {
            const response = await this.request('/rds-sessions/guacamole-token', { method: 'POST', body: JSON.stringify(payload) });
            if (!response.token || !response.url) { throw new Error('Réponse invalide du serveur pour le token Guacamole.'); }
            return response;
        } catch (error) { console.error('❌ Erreur createGuacamoleConnection:', error); throw error; }
    }

    // ORDINATEURS (COMPUTERS)
    async getComputers() { return this.request('/computers'); }
    async saveComputer(computerData) {
        const { id, ...data } = computerData;
        return id ? this.request(`/computers/${id}`, { method: 'PUT', body: JSON.stringify(data) }) : this.request('/computers', { method: 'POST', body: JSON.stringify(data) });
    }
    async deleteComputer(id) { return this.request(`/computers/${id}`, { method: 'DELETE' }); }
    async addComputerMaintenance(id, data) { return this.request(`/computers/${id}/maintenance`, { method: 'POST', body: JSON.stringify(data) }); }

    // PRÊTS (LOANS)
    async getLoans() { return this.request('/loans'); }
    async createLoan(loanData) { return this.request('/loans', { method: 'POST', body: JSON.stringify(loanData) }); }
    async returnLoan(id, notes, accessoryInfo) { return this.request(`/loans/${id}/return`, { method: 'POST', body: JSON.stringify({ returnNotes: notes, accessoryInfo }) }); }
    async extendLoan(id, date, reason) { return this.request(`/loans/${id}/extend`, { method: 'POST', body: JSON.stringify({ newReturnDate: date, reason }) }); }
    async cancelLoan(id, reason) { return this.request(`/loans/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }); }
    async getLoanHistory(filters = {}) { const qs = new URLSearchParams(filters).toString(); return this.request(`/loans/history${qs ? '?' + qs : ''}`); }
    async getLoanStatistics() { return this.request('/loans/statistics'); }
    async getLoanSettings() { return this.request('/loans/settings'); }

    // ACCESSOIRES
    async getAccessories() { return this.request('/accessories'); }
    async saveAccessory(data) { return this.request('/accessories', { method: 'POST', body: JSON.stringify(data) }); }
    async deleteAccessory(id) { return this.request(`/accessories/${id}`, { method: 'DELETE' }); }

    // NOTIFICATIONS
    async getNotifications() { return this.request('/notifications'); }
    async getUnreadNotifications() { return this.request('/notifications/unread'); }
    async markNotificationAsRead(id) { return this.request(`/notifications/${id}/mark-read`, { method: 'POST' }); }
    async markAllNotificationsAsRead() { return this.request('/notifications/mark-all-read', { method: 'POST' }); }

    // ACTIVE DIRECTORY
    async searchAdUsers(term) { return this.request(`/ad/users/search/${encodeURIComponent(term)}`); }
    async getAdGroupMembers(group) { return this.request(`/ad/groups/${encodeURIComponent(group)}/members`); }
    async addUserToGroup(username, groupName) { return this.request('/ad/groups/members', { method: 'POST', body: JSON.stringify({ username, groupName }) }); }
    async removeUserFromGroup(username, groupName) { return this.request(`/ad/groups/${encodeURIComponent(groupName)}/members/${encodeURIComponent(username)}`, { method: 'DELETE' }); }
    async getAdUserDetails(username) { return this.request(`/ad/users/${encodeURIComponent(username)}/details`); }
    async enableAdUser(username) { return this.request(`/ad/users/${encodeURIComponent(username)}/enable`, { method: 'POST' }); }
    async disableAdUser(username) { return this.request(`/ad/users/${encodeURIComponent(username)}/disable`, { method: 'POST' }); }
    async resetAdUserPassword(username, newPassword, mustChange = true) { return this.request(`/ad/users/${encodeURIComponent(username)}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword, mustChange }) }); }
    async createAdUser(userData) { return this.request(`/ad/users`, { method: 'POST', body: JSON.stringify(userData) }); }

    // UTILISATEURS EXCEL
    async getExcelUsers() { return this.request('/excel/users'); }
    async saveUserToExcel(userData) { return this.request('/excel/users', { method: 'POST', body: JSON.stringify(userData) }); }
    async deleteUserFromExcel(username) { return this.request(`/excel/users/${encodeURIComponent(username)}`, { method: 'DELETE' }); }

    // CHAT
    async getChatChannels() { return this.request('/chat/channels'); }
    async addChatChannel(name, description) { return this.request('/chat/channels', { method: 'POST', body: JSON.stringify({ name, description }) }); }
    async getChatMessages(channelId) { return this.request(`/chat/messages/${channelId}`); }
    async sendChatMessage(channelId, messageText, fileInfo = null) { return this.request('/chat/messages', { method: 'POST', body: JSON.stringify({ channelId, messageText, fileInfo }) }); }
    async editChatMessage(messageId, channelId, newText) { return this.request(`/chat/messages/${messageId}`, { method: 'PUT', body: JSON.stringify({ channelId, newText }) }); }
    async deleteChatMessage(messageId, channelId) { return this.request(`/chat/messages/${messageId}`, { method: 'DELETE', body: JSON.stringify({ channelId }) }); }
    async toggleChatReaction(messageId, channelId, emoji) { return this.request('/chat/reactions', { method: 'POST', body: JSON.stringify({ messageId, channelId, emoji }) }); }
}

const apiService = new ApiService();
export default apiService;