// src/services/apiService.js - VERSION FINALE, COMPLÈTE ET NETTOYÉE

class ApiService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
        this.currentTechnicianId = localStorage.getItem('currentTechnicianId') || null;
        console.log(`🔧 ApiService initialisé avec baseURL: ${this.baseURL} pour le technicien: ${this.currentTechnicianId || 'aucun'}`);
    }

    /**
     * Méthode de requête centrale. L'utilisation d'une arrow function garantit que 'this' est correctement lié.
     */
    request = async (endpoint, options = {}) => {
        const url = `${this.baseURL}${endpoint}`;
        const techId = this.currentTechnicianId;
        
        // ✅ CORRECTION: Ne pas forcer Content-Type si le body est FormData
        // Le navigateur définit automatiquement multipart/form-data avec boundary
        const headers = { ...options.headers };
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        }
        if (techId) { headers['x-technician-id'] = techId; }
        const config = { ...options, headers };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText, message: `Erreur HTTP ${response.status}` }));
                const errorMessage = errorData.error || errorData.details || errorData.message;
                const error = new Error(errorMessage);
                error.response = response; // Attache la réponse complète à l'erreur
                throw error;
            }
            if (response.status === 204) return null; // No Content
            return response.json();
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est démarré et accessible.');
            }
            throw error;
        }
    }

    setCurrentTechnician = (technicianId) => {
        this.currentTechnicianId = technicianId;
        if (technicianId) {
            localStorage.setItem('currentTechnicianId', technicianId);
        } else {
            localStorage.removeItem('currentTechnicianId');
        }
        console.log('👤 Technicien actuel défini:', technicianId);
    }

    // SANTÉ DU SERVEUR
    checkServerHealth = async () => this.request('/health')

    // AUTH & TECHNICIENS
    login = async (technicianData) => {
        this.setCurrentTechnician(technicianData.id);
        return this.request('/technicians/login', { method: 'POST', body: JSON.stringify(technicianData) });
    }
    logout = () => { this.setCurrentTechnician(null); return Promise.resolve(); }
    getConnectedTechnicians = async () => this.request('/technicians/connected')

    // CONFIGURATION
    getConfig = async () => this.request('/config')
    saveConfig = async (newConfig) => this.request('/config', { method: 'POST', body: JSON.stringify({ newConfig }) })

    // SESSIONS RDS
    getRdsSessions = async () => this.request('/rds-sessions')
    refreshRdsSessions = async () => this.request('/rds-sessions/refresh', { method: 'POST' })
    sendRdsMessage = async (server, sessionId, message) => this.request('/rds-sessions/send-message', { method: 'POST', body: JSON.stringify({ server, sessionId, message }) })
    pingRdsServer = async (server) => this.request(`/rds-sessions/ping/${server}`)

    // ORDINATEURS (COMPUTERS)
    getComputers = async () => this.request('/computers')
    saveComputer = async (computerData) => {
        const { id, ...data } = computerData;
        return id ? this.request(`/computers/${id}`, { method: 'PUT', body: JSON.stringify(data) }) : this.request('/computers', { method: 'POST', body: JSON.stringify(data) });
    }
    deleteComputer = async (id) => this.request(`/computers/${id}`, { method: 'DELETE' })
    addComputerMaintenance = async (id, data) => this.request(`/computers/${id}/maintenance`, { method: 'POST', body: JSON.stringify(data) })

    // PRÊTS (LOANS)
    getLoans = async () => this.request('/loans')
    createLoan = async (loanData) => this.request('/loans', { method: 'POST', body: JSON.stringify(loanData) })
    updateLoan = async (loanId, loanData) => this.request(`/loans/${loanId}`, { method: 'PUT', body: JSON.stringify(loanData) })
    returnLoan = async (id, notes, accessoryInfo) => this.request(`/loans/${id}/return`, { method: 'POST', body: JSON.stringify({ returnNotes: notes, accessoryInfo }) })
    extendLoan = async (id, date, reason) => this.request(`/loans/${id}/extend`, { method: 'POST', body: JSON.stringify({ newReturnDate: date, reason }) })
    cancelLoan = async (id, reason) => this.request(`/loans/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) })
    getLoanHistory = async (filters = {}) => { const qs = new URLSearchParams(filters).toString(); return this.request(`/loans/history${qs ? '?' + qs : ''}`); }
    getLoanStatistics = async () => this.request('/loans/statistics')
    getLoanSettings = async () => this.request('/loans/settings')

    // ACCESSOIRES
    getAccessories = async () => this.request('/accessories')
    saveAccessory = async (data) => this.request('/accessories', { method: 'POST', body: JSON.stringify(data) })
    deleteAccessory = async (id) => this.request(`/accessories/${id}`, { method: 'DELETE' })

    // NOTIFICATIONS
    getNotifications = async () => this.request('/notifications')
    getUnreadNotifications = async () => this.request('/notifications/unread')
    markNotificationAsRead = async (id) => this.request(`/notifications/${id}/mark-read`, { method: 'POST' })
    markAllNotificationsAsRead = async () => this.request('/notifications/mark-all-read', { method: 'POST' })

    // ACTIVE DIRECTORY
    searchAdUsers = async (term) => this.request(`/ad/users/search/${encodeURIComponent(term)}`)
    searchAdGroups = async (term) => this.request(`/ad/groups/search/${encodeURIComponent(term)}`)
    getAdGroupMembers = async (group) => this.request(`/ad/groups/${encodeURIComponent(group)}/members`)
    addUserToGroup = async (username, groupName) => this.request('/ad/groups/members', { method: 'POST', body: JSON.stringify({ username, groupName }) })
    removeUserFromGroup = async (username, groupName) => this.request(`/ad/groups/${encodeURIComponent(groupName)}/members/${encodeURIComponent(username)}`, { method: 'DELETE' })
    getAdUserDetails = async (username) => this.request(`/ad/users/${encodeURIComponent(username)}/details`)
    enableAdUser = async (username) => this.request(`/ad/users/${encodeURIComponent(username)}/enable`, { method: 'POST' })
    disableAdUser = async (username) => this.request(`/ad/users/${encodeURIComponent(username)}/disable`, { method: 'POST' })
    resetAdUserPassword = async (username, newPassword, mustChange = true) => this.request(`/ad/users/${encodeURIComponent(username)}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword, mustChange }) })
    createAdUser = async (userData) => this.request(`/ad/users`, { method: 'POST', body: JSON.stringify(userData) })

    // UTILISATEURS EXCEL
    getExcelUsers = async () => this.request('/excel/users')
    refreshExcelUsers = async () => this.request('/excel/users/refresh', { method: 'POST' })
    saveUserToExcel = async (userData) => this.request('/excel/users', { method: 'POST', body: JSON.stringify(userData) })
    deleteUserFromExcel = async (username) => this.request(`/excel/users/${encodeURIComponent(username)}`, { method: 'DELETE' })

    // CHAT
    getChatChannels = async () => this.request('/chat/channels')
    addChatChannel = async (name, description) => this.request('/chat/channels', { method: 'POST', body: JSON.stringify({ name, description }) })
    getChatMessages = async (channelId) => this.request(`/chat/messages/${channelId}`)
    sendChatMessage = async (channelId, messageText, fileInfo = null) => this.request('/chat/messages', { method: 'POST', body: JSON.stringify({ channelId, messageText, fileInfo }) })
    editChatMessage = async (messageId, channelId, newText) => this.request(`/chat/messages/${messageId}`, { method: 'PUT', body: JSON.stringify({ channelId, newText }) })
    deleteChatMessage = async (messageId, channelId) => this.request(`/chat/messages/${messageId}`, { method: 'DELETE', body: JSON.stringify({ channelId }) })
    toggleChatReaction = async (messageId, channelId, emoji) => this.request('/chat/reactions', { method: 'POST', body: JSON.stringify({ messageId, channelId, emoji }) })

    // ✅ AGENT IA
    // Health & Initialization
    getAIHealth = async () => this.request('/ai/health')
    initializeAI = async () => this.request('/ai/initialize', { method: 'POST' })
    
    // Documents
    uploadAIDocument = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/ai/documents/upload', {
            method: 'POST',
            body: formData // ✅ Content-Type auto-détecté (multipart/form-data)
        });
    }
    getAIDocuments = async (limit = 100, offset = 0) => this.request(`/ai/documents?limit=${limit}&offset=${offset}`)
    getAIDocument = async (id) => this.request(`/ai/documents/${id}`)
    deleteAIDocument = async (id) => this.request(`/ai/documents/${id}`, { method: 'DELETE' })
    searchAIDocuments = async (query, maxResults = 5, minScore = 0.1) => this.request('/ai/documents/search', { method: 'POST', body: JSON.stringify({ query, maxResults, minScore }) })
    
    // Conversations
    sendAIMessage = async (sessionId, message, userId = null) => this.request('/ai/chat', { method: 'POST', body: JSON.stringify({ sessionId, message, userId }) })
    getAIConversationHistory = async (sessionId, limit = 50) => this.request(`/ai/conversations/${sessionId}?limit=${limit}`)
    getAllAIConversations = async (limit = 50) => this.request(`/ai/conversations?limit=${limit}`)
    
    // Settings & Statistics
    getAISettings = async () => this.request('/ai/settings')
    updateAISetting = async (key, value) => this.request(`/ai/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) })
    getAIStatistics = async () => this.request('/ai/statistics')
    getAIDailyStatistics = async (days = 7) => this.request(`/ai/statistics/daily?days=${days}`)
    getAIStatsOverview = async () => this.request('/ai/stats/overview')
    
    // Administration
    resetAI = async () => this.request('/ai/reset', { method: 'POST' })
    cleanupAI = async () => this.request('/ai/cleanup', { method: 'POST' })

    // ========== DOCUCORTEX - RÉSEAU ==========
    configureNetwork = async (config) => this.request('/ai/network/configure', { method: 'POST', body: JSON.stringify(config) })
    testNetworkConnection = async () => this.request('/ai/network/test')
    scanNetwork = async () => this.request('/ai/network/scan', { method: 'POST' })
    startNetworkWatch = async () => this.request('/ai/network/watch/start', { method: 'POST' })
    stopNetworkWatch = async () => this.request('/ai/network/watch/stop', { method: 'POST' })

    // ========== DOCUCORTEX - RECHERCHE INTELLIGENTE ==========
    intelligentSearch = async (query, sessionId = null, userId = null) => 
        this.request('/ai/search/intelligent', { method: 'POST', body: JSON.stringify({ query, sessionId, userId }) })

    // ========== DOCUCORTEX - PREVIEW & DOWNLOAD ==========
    getDocumentPreview = async (documentId) => this.request(`/ai/documents/${documentId}/preview`)
    downloadDocument = async (documentId) => {
        const url = `${this.baseURL}/ai/documents/${documentId}/download`;
        const techId = this.currentTechnicianId;
        const headers = {};
        if (techId) headers['x-technician-id'] = techId;

        // Téléchargement direct (ouvre dans nouvel onglet)
        window.open(url, '_blank');
        return { success: true, message: 'Téléchargement lancé' };
    }
    
    // ========== DOCUCORTEX - STATISTIQUES ÉTENDUES ==========
    getExtendedStatistics = async () => this.request('/ai/statistics/extended')

    // ========== DOCUCORTEX - MÉTHODES ÉTENDUES ==========
    
    /**
     * Scanne un chemin réseau spécifique pour détecter les documents
     * @param {string} networkPath - Chemin réseau à scanner (ex: \\serveur\partage)
     * @param {object} options - Options de scan (profondeur, filtres, etc.)
     * @returns {Promise<object>} Résultat du scan avec liste des documents trouvés
     */
    scanNetworkPath = async (networkPath, options = {}) => {
        try {
            if (!networkPath || typeof networkPath !== 'string') {
                throw new Error('Le chemin réseau est requis et doit être une chaîne de caractères');
            }
            
            // Validation du format de chemin UNC ou local
            if (!networkPath.startsWith('\\\\') && !networkPath.includes(':/')) {
                throw new Error('Le chemin doit être un chemin UNC (\\\\serveur\\partage) ou un chemin local (C:\\dossier)');
            }

            const scanOptions = {
                maxDepth: options.maxDepth || 3,
                fileTypes: options.fileTypes || ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'],
                includeSubdirs: options.includeSubdirs !== false,
                excludePatterns: options.excludePatterns || ['*.tmp', '*.log', '*.cache'],
                ...options
            };

            console.log(`🔍 Scan du chemin réseau: ${networkPath}`, scanOptions);

            const response = await this.request('/ai/network/scan-path', {
                method: 'POST',
                body: JSON.stringify({ 
                    path: networkPath, 
                    options: scanOptions 
                })
            });

            console.log(`✅ Scan terminé: ${response.documentCount || 0} documents trouvés`);
            return {
                success: true,
                path: networkPath,
                documentCount: response.documentCount || 0,
                documents: response.documents || [],
                scanDuration: response.scanDuration || 0,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Erreur lors du scan du chemin réseau:', error);
            throw new Error(`Échec du scan du chemin ${networkPath}: ${error.message}`);
        }
    }

    /**
     * Récupère la liste des documents sur le réseau avec pagination et filtres
     * @param {object} filters - Filtres de recherche (type, date, taille, etc.)
     * @param {number} limit - Nombre maximum de résultats (défaut: 50)
     * @param {number} offset - Décalage pour la pagination (défaut: 0)
     * @returns {Promise<object>} Liste des documents avec métadonnées
     */
    getNetworkDocuments = async (filters = {}, limit = 50, offset = 0) => {
        try {
            const queryParams = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                ...Object.fromEntries(
                    Object.entries(filters).map(([key, value]) => [key, value.toString()])
                )
            });

            console.log(`📂 Récupération des documents réseau avec filtres:`, filters);

            const response = await this.request(`/ai/network/documents?${queryParams.toString()}`);

            console.log(`✅ ${response.documents?.length || 0} documents récupérés`);
            return {
                success: true,
                documents: response.documents || [],
                total: response.total || 0,
                limit,
                offset,
                hasMore: (offset + limit) < (response.total || 0),
                filters: filters
            };

        } catch (error) {
            console.error('❌ Erreur lors de la récupération des documents réseau:', error);
            throw new Error(`Impossible de récupérer les documents réseau: ${error.message}`);
        }
    }

    /**
     * Récupère les métadonnées détaillées d'un document spécifique
     * @param {string} documentId - Identifiant unique du document
     * @param {boolean} includeContentPreview - Inclure un aperçu du contenu (défaut: false)
     * @returns {Promise<object>} Métadonnées complètes du document
     */
    getDocumentMetadata = async (documentId, includeContentPreview = false) => {
        try {
            if (!documentId || typeof documentId !== 'string') {
                throw new Error('L\'identifiant du document est requis');
            }

            const endpoint = `/ai/documents/${encodeURIComponent(documentId)}/metadata${includeContentPreview ? '?preview=true' : ''}`;

            console.log(`📄 Récupération des métadonnées pour le document: ${documentId}`);

            const response = await this.request(endpoint);

            console.log(`✅ Métadonnées récupérées pour: ${response.filename || documentId}`);
            return {
                success: true,
                documentId: documentId,
                metadata: response.metadata || response,
                preview: includeContentPreview ? response.preview : null,
                lastModified: response.lastModified || null,
                size: response.size || 0,
                path: response.path || null
            };

        } catch (error) {
            console.error('❌ Erreur lors de la récupération des métadonnées:', error);
            throw new Error(`Impossible de récupérer les métadonnées du document ${documentId}: ${error.message}`);
        }
    }

    /**
     * Génère un aperçu visuel d'un fichier (image, PDF, etc.)
     * @param {string} filePath - Chemin du fichier ou identifiant
     * @param {object} options - Options d'aperçu (taille, format, page pour PDF)
     * @returns {Promise<object>} URL d'aperçu et informations
     */
    getFilePreview = async (filePath, options = {}) => {
        try {
            if (!filePath || typeof filePath !== 'string') {
                throw new Error('Le chemin du fichier est requis');
            }

            const previewOptions = {
                width: options.width || 800,
                height: options.height || 600,
                format: options.format || 'png',
                quality: options.quality || 90,
                page: options.page || 1, // Pour les PDF
                maxPages: options.maxPages || 5,
                ...options
            };

            console.log(`👁️ Génération d'aperçu pour: ${filePath}`, previewOptions);

            const response = await this.request('/ai/files/preview', {
                method: 'POST',
                body: JSON.stringify({ 
                    filePath: filePath, 
                    options: previewOptions 
                })
            });

            console.log(`✅ Aperçu généré: ${response.previewUrl || 'URL non disponible'}`);
            return {
                success: true,
                filePath: filePath,
                previewUrl: response.previewUrl,
                thumbnailUrl: response.thumbnailUrl,
                dimensions: response.dimensions,
                fileType: response.fileType,
                previewOptions: previewOptions,
                expiresAt: response.expiresAt
            };

        } catch (error) {
            console.error('❌ Erreur lors de la génération d\'aperçu:', error);
            throw new Error(`Impossible de générer l'aperçu pour ${filePath}: ${error.message}`);
        }
    }

    /**
     * Télécharge un fichier depuis le réseau avec gestion avancée
     * @param {string} filePath - Chemin du fichier à télécharger
     * @param {object} options - Options de téléchargement
     * @returns {Promise<object>} Informations de téléchargement et URL
     */
    downloadNetworkFile = async (filePath, options = {}) => {
        try {
            if (!filePath || typeof filePath !== 'string') {
                throw new Error('Le chemin du fichier est requis');
            }

            const downloadOptions = {
                validateIntegrity: options.validateIntegrity !== false,
                createBackup: options.createBackup || false,
                notifyOnCompletion: options.notifyOnCompletion || false,
                ...options
            };

            console.log(`⬇️ Téléchargement du fichier réseau: ${filePath}`, downloadOptions);

            // Demande d'URL de téléchargement sécurisée
            const response = await this.request('/ai/files/download', {
                method: 'POST',
                body: JSON.stringify({ 
                    filePath: filePath, 
                    options: downloadOptions 
                })
            });

            if (response.downloadUrl) {
                // Option de téléchargement direct ou via blob
                if (options.directDownload) {
                    // Téléchargement direct (ouvre dans nouvel onglet)
                    const techId = this.currentTechnicianId;
                    const headers = {};
                    if (techId) headers['x-technician-id'] = techId;

                    // Ouvrir le lien de téléchargement
                    window.open(response.downloadUrl, '_blank');
                    
                    return {
                        success: true,
                        message: 'Téléchargement direct lancé',
                        filePath: filePath,
                        fileName: response.fileName,
                        estimatedSize: response.estimatedSize
                    };
                } else {
                    // Téléchargement via fetch pour gestion avancée
                    return await this._downloadFileWithProgress(response.downloadUrl, downloadOptions);
                }
            }

            throw new Error('URL de téléchargement non fournie par le serveur');

        } catch (error) {
            console.error('❌ Erreur lors du téléchargement:', error);
            throw new Error(`Impossible de télécharger le fichier ${filePath}: ${error.message}`);
        }
    }

    /**
     * Démarre la surveillance automatique du réseau pour détecter les nouveaux fichiers
     * @param {object} config - Configuration de surveillance
     * @returns {Promise<object>} État de la surveillance
     */
    startNetworkWatching = async (config = {}) => {
        try {
            const watchConfig = {
                paths: config.paths || [],
                fileTypes: config.fileTypes || ['.pdf', '.doc', '.docx', '.txt'],
                pollInterval: config.pollInterval || 30000, // 30 secondes
                maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100MB
                enableNotifications: config.enableNotifications !== false,
                enableIndexing: config.enableIndexing !== false,
                ...config
            };

            console.log('👀 Démarrage de la surveillance réseau...', watchConfig);

            const response = await this.request('/ai/network/watch/start', {
                method: 'POST',
                body: JSON.stringify({ config: watchConfig })
            });

            console.log(`✅ Surveillance réseau démarrée: ${response.watchId || 'ID non disponible'}`);
            return {
                success: true,
                watchId: response.watchId,
                status: 'started',
                config: watchConfig,
                monitoredPaths: response.monitoredPaths || watchConfig.paths,
                startTime: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Erreur lors du démarrage de la surveillance:', error);
            throw new Error(`Impossible de démarrer la surveillance réseau: ${error.message}`);
        }
    }

    /**
     * Arrête la surveillance automatique du réseau
     * @param {string} watchId - Identifiant de la surveillance (optionnel, arrête toutes si non fourni)
     * @returns {Promise<object>} Confirmation d'arrêt
     */
    stopNetworkWatching = async (watchId = null) => {
        try {
            const endpoint = watchId 
                ? `/ai/network/watch/${encodeURIComponent(watchId)}/stop`
                : '/ai/network/watch/stop-all';

            console.log(`🛑 Arrêt de la surveillance réseau${watchId ? ` (ID: ${watchId})` : ' (toutes)'}`);

            const response = await this.request(endpoint, { method: 'POST' });

            console.log(`✅ Surveillance arrêtée avec succès`);
            return {
                success: true,
                watchId: watchId,
                status: 'stopped',
                stoppedAt: new Date().toISOString(),
                documentsProcessed: response.documentsProcessed || 0
            };

        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt de la surveillance:', error);
            throw new Error(`Impossible d'arrêter la surveillance réseau: ${error.message}`);
        }
    }

    /**
     * Récupère les statistiques détaillées du réseau et des documents
     * @param {string} period - Période d'analyse ('day', 'week', 'month', 'year')
     * @param {object} filters - Filtres supplémentaires
     * @returns {Promise<object>} Statistiques complètes
     */
    getNetworkStats = async (period = 'week', filters = {}) => {
        try {
            const validPeriods = ['day', 'week', 'month', 'quarter', 'year'];
            if (!validPeriods.includes(period)) {
                throw new Error(`Période invalide. Périodes acceptées: ${validPeriods.join(', ')}`);
            }

            const queryParams = new URLSearchParams({
                period: period,
                ...Object.fromEntries(
                    Object.entries(filters).map(([key, value]) => [key, value.toString()])
                )
            });

            console.log(`📊 Récupération des statistiques réseau pour la période: ${period}`);

            const response = await this.request(`/ai/network/stats?${queryParams.toString()}`);

            console.log(`✅ Statistiques récupérées pour ${period}`);
            return {
                success: true,
                period: period,
                timestamp: new Date().toISOString(),
                documents: {
                    total: response.documents?.total || 0,
                    indexed: response.documents?.indexed || 0,
                    processed: response.documents?.processed || 0,
                    failed: response.documents?.failed || 0,
                    newToday: response.documents?.newToday || 0,
                    byType: response.documents?.byType || {},
                    bySize: response.documents?.bySize || {}
                },
                network: {
                    activeConnections: response.network?.activeConnections || 0,
                    monitoredPaths: response.network?.monitoredPaths || 0,
                    watchStatus: response.network?.watchStatus || 'inactive',
                    lastScan: response.network?.lastScan || null
                },
                performance: {
                    avgProcessingTime: response.performance?.avgProcessingTime || 0,
                    cpuUsage: response.performance?.cpuUsage || 0,
                    memoryUsage: response.performance?.memoryUsage || 0,
                    diskUsage: response.performance?.diskUsage || 0
                },
                trends: response.trends || {},
                filters: filters
            };

        } catch (error) {
            console.error('❌ Erreur lors de la récupération des statistiques:', error);
            throw new Error(`Impossible de récupérer les statistiques réseau: ${error.message}`);
        }
    }

    /**
     * Méthode auxiliaire pour télécharger un fichier avec barre de progression
     * @private
     */
    _downloadFileWithProgress = async (downloadUrl, options = {}) => {
        try {
            const techId = this.currentTechnicianId;
            const headers = {};
            if (techId) headers['x-technician-id'] = techId;

            const response = await fetch(downloadUrl, { headers });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'downloaded_file';
            
            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Création du lien de téléchargement
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return {
                success: true,
                message: 'Téléchargement terminé',
                filename: filename,
                size: blob.size
            };

        } catch (error) {
            throw new Error(`Échec du téléchargement avec progression: ${error.message}`);
        }
    }

    /**
     * Vérifie l'état de la surveillance réseau en cours
     * @returns {Promise<object>} État actuel des surveillances actives
     */
    getNetworkWatchStatus = async () => {
        try {
            const response = await this.request('/ai/network/watch/status');
            
            return {
                success: true,
                active: response.active || false,
                watches: response.watches || [],
                totalDocuments: response.totalDocuments || 0,
                lastActivity: response.lastActivity || null,
                systemHealth: response.systemHealth || 'unknown'
            };

        } catch (error) {
            console.error('❌ Erreur lors de la vérification du statut:', error);
            throw new Error(`Impossible de vérifier le statut de surveillance: ${error.message}`);
        }
    }

    /**
     * Synchronise manuellement les documents du réseau
     * @param {Array<string>} paths - Chemins à synchroniser (optionnel, tous si vide)
     * @returns {Promise<object>} Résultat de la synchronisation
     */
    syncNetworkDocuments = async (paths = []) => {
        try {
            const syncOptions = {
                paths: paths,
                forceReindex: true,
                validateIntegrity: true,
                generateThumbnails: true
            };

            console.log('🔄 Synchronisation manuelle des documents réseau...', syncOptions);

            const response = await this.request('/ai/network/sync', {
                method: 'POST',
                body: JSON.stringify(syncOptions)
            });

            console.log(`✅ Synchronisation terminée: ${response.documentsProcessed || 0} documents traités`);
            return {
                success: true,
                documentsProcessed: response.documentsProcessed || 0,
                errors: response.errors || [],
                duration: response.duration || 0,
                syncedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Erreur lors de la synchronisation:', error);
            throw new Error(`Impossible de synchroniser les documents: ${error.message}`);
        }
    }
}

// Création d'une instance unique (singleton) pour toute l'application
const apiService = new ApiService();
export default apiService;