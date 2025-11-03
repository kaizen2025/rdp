const fs = require('fs').promises;
const path = require('path');

/**
 * Service d'extraction de métadonnées - DocuCortex
 * Supporte: PDF, TXT, Office, tous autres fichiers
 */
class DocumentMetadataService {
    constructor() {
        this.supportedTextFormats = ['.pdf', '.txt', '.md', '.csv', '.json', '.xml', '.log'];
        this.categories = {
            'offre': ['offre', 'devis', 'proposition', 'quote'],
            'facture': ['facture', 'invoice', 'bill'],
            'contrat': ['contrat', 'contract', 'agreement'],
            'rapport': ['rapport', 'report', 'analyse'],
            'procedure': ['procedure', 'guide', 'manuel'],
            'technique': ['technique', 'spec', 'specification']
        };
    }

    async extractMetadata(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const filename = path.basename(filePath);

            const metadata = {
                filename,
                extension: ext,
                size: stats.size,
                sizeFormatted: this.formatFileSize(stats.size),
                created: stats.birthtime,
                modified: stats.mtime,
                directory: path.dirname(filePath),
                content: null,
                searchable: false,
                category: this.detectCategory(filename),
                type: this.detectType(ext),
                language: null,
                keywords: [],
                tags: []
            };

            if (this.supportedTextFormats.includes(ext)) {
                const content = await this.extractTextContent(filePath, ext);
                if (content) {
                    metadata.content = content;
                    metadata.searchable = true;
                    metadata.language = this.detectLanguage(content);
                    metadata.keywords = this.extractKeywords(content);
                    metadata.tags = this.generateTags(filename, content);
                }
            } else {
                metadata.tags = [this.detectType(ext)];
            }

            return metadata;
        } catch (error) {
            return { filename: path.basename(filePath), extension: path.extname(filePath), error: error.message, searchable: false };
        }
    }

    async extractTextContent(filePath, ext) {
        try {
            if (ext === '.pdf') {
                // Simulation lecture PDF (nécessite pdf-parse)
                const buffer = await fs.readFile(filePath);
                return buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
            } else {
                const buffer = await fs.readFile(filePath);
                return buffer.toString('utf8');
            }
        } catch (error) {
            return null;
        }
    }

    detectCategory(filename) {
        const lower = filename.toLowerCase();
        for (const [cat, keywords] of Object.entries(this.categories)) {
            if (keywords.some(kw => lower.includes(kw))) return cat;
        }
        return 'autres';
    }

    detectType(ext) {
        const types = {
            '.pdf': 'PDF', '.txt': 'Texte', '.docx': 'Word', '.xlsx': 'Excel',
            '.pptx': 'PowerPoint', '.jpg': 'Image', '.png': 'Image', '.mp4': 'Vidéo'
        };
        return types[ext] || 'Fichier';
    }

    detectLanguage(text) {
        if (!text) return null;
        const sample = text.substring(0, 1000).toLowerCase();
        const fr = ['le', 'la', 'les', 'de', 'et', 'dans', 'pour'].filter(w => sample.includes(` ${w} `)).length;
        const es = ['el', 'la', 'los', 'de', 'y', 'en', 'para'].filter(w => sample.includes(` ${w} `)).length;
        const en = ['the', 'of', 'and', 'in', 'to', 'for'].filter(w => sample.includes(` ${w} `)).length;
        const max = Math.max(fr, es, en);
        if (max === 0) return 'inconnu';
        if (fr === max) return 'français';
        if (es === max) return 'espagnol';
        return 'anglais';
    }

    extractKeywords(text, max = 10) {
        if (!text) return [];
        const words = text.toLowerCase().replace(/[^\w\séàèùâêîôûëïüç]/g, ' ').split(/\s+/).filter(w => w.length > 3);
        const stopWords = new Set(['le', 'la', 'les', 'de', 'et', 'dans', 'pour', 'the', 'of', 'and']);
        const freq = {};
        words.forEach(w => { if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1; });
        return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, max).map(([w]) => w);
    }

    generateTags(filename, content) {
        const tags = [];
        const ext = path.extname(filename).replace('.', '');
        if (ext) tags.push(ext.toUpperCase());
        const cat = this.detectCategory(filename);
        if (cat !== 'autres') tags.push(cat);
        const year = filename.match(/20\d{2}/);
        if (year) tags.push(year[0]);
        if (content) {
            const keywords = this.extractKeywords(content, 3);
            tags.push(...keywords.slice(0, 2));
        }
        return tags;
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
        if (bytes < 1073741824) return `${Math.round(bytes / 1048576)} MB`;
        return `${Math.round(bytes / 1073741824)} GB`;
    }
}

module.exports = new DocumentMetadataService();
