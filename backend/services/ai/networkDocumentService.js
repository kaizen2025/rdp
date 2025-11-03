const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const { EventEmitter } = require('events');

/**
 * Service de gestion des documents réseau - DocuCortex
 * Scan serveur UNC, indexation automatique, file watcher temps réel
 */
class NetworkDocumentService extends EventEmitter {
    constructor() {
        super();
        this.watcher = null;
        this.scanInProgress = false;
        this.scanStats = {
            totalFiles: 0,
            scannedFiles: 0,
            indexedFiles: 0,
            errors: 0,
            startTime: null,
            endTime: null
        };
        this.config = {
            serverPath: null,
            workingDirectory: null,
            allowedExtensions: ['*'],
            excludedFolders: ['Temp', 'Backup', '$RECYCLE.BIN', 'System Volume Information', 'node_modules'],
            maxFileSize: 104857600,
            scanInterval: 30,
            autoIndex: true
        };
    }

    configure(config) {
        this.config = { ...this.config, ...config };
        console.log('[NetworkDocumentService] Configuration:', this.config);
        return { success: true, config: this.config };
    }

    async testConnection(serverPath) {
        try {
            const stats = await fs.stat(serverPath);
            if (stats.isDirectory()) {
                const files = await fs.readdir(serverPath);
                return { success: true, accessible: true, message: `✅ Connexion réussie: ${files.length} éléments`, fileCount: files.length };
            } else {
                return { success: false, accessible: false, message: '❌ Le chemin n\'est pas un répertoire' };
            }
        } catch (error) {
            return { success: false, accessible: false, message: `❌ Erreur: ${error.code === 'ENOENT' ? 'Chemin introuvable' : error.message}` };
        }
    }

    async scanNetworkDocuments(documentMetadataService, databaseService) {
        if (this.scanInProgress) return { success: false, message: 'Scan en cours' };
        if (!this.config.serverPath) return { success: false, message: 'Aucun serveur configuré' };

        this.scanInProgress = true;
        this.scanStats = { totalFiles: 0, scannedFiles: 0, indexedFiles: 0, errors: 0, startTime: new Date(), endTime: null };

        const fullPath = this.config.workingDirectory 
            ? path.join(this.config.serverPath, this.config.workingDirectory)
            : this.config.serverPath;

        console.log(`[NetworkDocumentService] Scan: ${fullPath}`);
        this.emit('scan:started', { path: fullPath });

        try {
            await this.estimateFileCount(fullPath);
            this.emit('scan:estimate', { totalFiles: this.scanStats.totalFiles });
            await this.scanDirectory(fullPath, documentMetadataService, databaseService);
            
            this.scanStats.endTime = new Date();
            this.scanInProgress = false;

            const duration = (this.scanStats.endTime - this.scanStats.startTime) / 1000;
            console.log(`[NetworkDocumentService] Terminé: ${this.scanStats.indexedFiles} documents en ${duration}s`);
            
            this.emit('scan:completed', this.scanStats);
            return { success: true, stats: this.scanStats };
        } catch (error) {
            this.scanInProgress = false;
            this.emit('scan:error', { error: error.message });
            return { success: false, message: error.message };
        }
    }

    async estimateFileCount(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && !this.isExcluded(entry.name)) {
                    await this.estimateFileCount(path.join(dirPath, entry.name));
                } else if (entry.isFile() && this.isAllowedExtension(entry.name)) {
                    this.scanStats.totalFiles++;
                }
            }
        } catch (error) {}
    }

    async scanDirectory(dirPath, documentMetadataService, databaseService) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    if (!this.isExcluded(entry.name)) {
                        await this.scanDirectory(fullPath, documentMetadataService, databaseService);
                    }
                } else if (entry.isFile() && this.isAllowedExtension(entry.name)) {
                    await this.indexDocument(fullPath, documentMetadataService, databaseService);
                }

                if (this.scanStats.scannedFiles % 50 === 0) {
                    const percent = this.scanStats.totalFiles > 0 ? Math.round((this.scanStats.scannedFiles / this.scanStats.totalFiles) * 100) : 0;
                    this.emit('scan:progress', { scanned: this.scanStats.scannedFiles, total: this.scanStats.totalFiles, percent, indexed: this.scanStats.indexedFiles });
                }
            }
        } catch (error) {
            this.scanStats.errors++;
        }
    }

    async indexDocument(filePath, documentMetadataService, databaseService) {
        this.scanStats.scannedFiles++;
        try {
            const stats = await fs.stat(filePath);
            if (stats.size > this.config.maxFileSize) return;

            const metadata = await documentMetadataService.extractMetadata(filePath);
            const existing = databaseService.db.prepare('SELECT id, updated_at FROM ai_documents WHERE network_path = ?').get(filePath);

            if (existing) {
                const fileModified = new Date(stats.mtime).getTime();
                const dbModified = new Date(existing.updated_at).getTime();
                if (fileModified > dbModified) {
                    databaseService.db.prepare('UPDATE ai_documents SET filename = ?, content = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                        .run(metadata.filename, metadata.content, JSON.stringify(metadata), existing.id);
                    this.scanStats.indexedFiles++;
                }
            } else {
                databaseService.db.prepare('INSERT INTO ai_documents (filename, content, metadata, network_path, source, created_at, updated_at) VALUES (?, ?, ?, ?, \'network\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
                    .run(metadata.filename, metadata.content, JSON.stringify(metadata), filePath);
                this.scanStats.indexedFiles++;
            }
        } catch (error) {
            this.scanStats.errors++;
        }
    }

    isExcluded(folderName) {
        return this.config.excludedFolders.some(ex => folderName.toLowerCase().includes(ex.toLowerCase()));
    }

    isAllowedExtension(filename) {
        if (this.config.allowedExtensions.includes('*')) return true;
        const ext = path.extname(filename).toLowerCase();
        return this.config.allowedExtensions.some(a => a.toLowerCase() === ext);
    }

    async startWatcher(documentMetadataService, databaseService) {
        if (this.watcher) return { success: false, message: 'Watcher actif' };
        if (!this.config.serverPath) return { success: false, message: 'Aucun serveur configuré' };

        const fullPath = this.config.workingDirectory ? path.join(this.config.serverPath, this.config.workingDirectory) : this.config.serverPath;

        this.watcher = chokidar.watch(fullPath, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
            depth: 10
        });

        this.watcher
            .on('add', async (filepath) => {
                await this.indexDocument(filepath, documentMetadataService, databaseService);
                this.emit('file:added', { path: filepath });
            })
            .on('change', async (filepath) => {
                await this.indexDocument(filepath, documentMetadataService, databaseService);
                this.emit('file:changed', { path: filepath });
            })
            .on('unlink', (filepath) => {
                databaseService.db.prepare('DELETE FROM ai_documents WHERE network_path = ?').run(filepath);
                this.emit('file:removed', { path: filepath });
            });

        return { success: true, message: 'Watcher démarré' };
    }

    async stopWatcher() {
        if (!this.watcher) return { success: false, message: 'Aucun watcher' };
        await this.watcher.close();
        this.watcher = null;
        return { success: true, message: 'Watcher arrêté' };
    }

    getScanStatus() {
        return { inProgress: this.scanInProgress, stats: this.scanStats, config: this.config };
    }
}

module.exports = new NetworkDocumentService();
