const fs = require('fs').promises;
const path = require('path');

/**
 * Service d'aperçu et téléchargement de fichiers - DocuCortex
 * Génération aperçus, miniatures, téléchargement sécurisé
 */
class FilePreviewService {
    constructor() {
        this.cacheDir = path.join(__dirname, '../../cache/previews');
        this.previewableFormats = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.txt', '.md'];
        this.init();
    }

    async init() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            console.error('[FilePreviewService] Erreur init cache:', error);
        }
    }

    async generatePreview(filePath, page = 1) {
        try {
            const ext = path.extname(filePath).toLowerCase();
            
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                return await this.getImagePreview(filePath);
            } else if (ext === '.pdf') {
                return await this.getPDFPreview(filePath, page);
            } else if (['.txt', '.md', '.log'].includes(ext)) {
                return await this.getTextPreview(filePath);
            } else {
                return { success: false, message: 'Format non supporté pour aperçu' };
            }
        } catch (error) {
            console.error('[FilePreviewService] Erreur génération aperçu:', error);
            return { success: false, message: error.message };
        }
    }

    async getImagePreview(filePath) {
        try {
            const buffer = await fs.readFile(filePath);
            return { success: true, buffer, mimeType: this.getMimeType(filePath) };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getPDFPreview(filePath, page) {
        // Simulation - nécessite pdf-poppler en prod
        return { success: false, message: 'Aperçu PDF nécessite pdf-poppler (à installer)' };
    }

    async getTextPreview(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const preview = content.substring(0, 5000);
            return { success: true, content: preview, mimeType: 'text/plain' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async generateThumbnail(filePath, maxSize = 200) {
        // Simulation - nécessite sharp en prod
        return { success: false, message: 'Miniatures nécessite sharp (à installer)' };
    }

    async downloadFile(filePath) {
        try {
            const buffer = await fs.readFile(filePath);
            const filename = path.basename(filePath);
            const mimeType = this.getMimeType(filePath);
            return { success: true, buffer, filename, mimeType };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.zip': 'application/zip'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    isPreviewable(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return this.previewableFormats.includes(ext);
    }
}

module.exports = new FilePreviewService();
