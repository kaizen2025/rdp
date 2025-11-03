/**
 * Service OCR avec Tesseract.js - DocuCortex
 * Extraction de texte d'images avec support multi-langues
 */

const { createWorker } = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');

class OCRService {
    constructor() {
        this.initialized = false;
        this.workers = new Map(); // Cache des workers par langue
        this.supportedLanguages = ['fra', 'eng', 'spa', 'deu', 'ita', 'por', 'nld', 'ara', 'chi_sim', 'jpn', 'kor'];
        this.defaultLanguages = ['fra', 'eng'];
    }

    /**
     * Initialise le service OCR
     */
    async initialize() {
        if (this.initialized) return { success: true };

        try {
            console.log('Initialisation du service OCR Tesseract.js...');

            // Initialiser avec les langues par défaut
            await this.getWorker(this.defaultLanguages);

            this.initialized = true;
            console.log('✅ Service OCR Tesseract.js initialisé avec succès');

            return {
                success: true,
                supportedLanguages: this.supportedLanguages,
                defaultLanguages: this.defaultLanguages
            };

        } catch (error) {
            console.error('❌ Erreur initialisation OCR:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtient ou crée un worker Tesseract pour des langues spécifiques
     */
    async getWorker(languages) {
        const languagesKey = languages.sort().join('+');

        if (this.workers.has(languagesKey)) {
            return this.workers.get(languagesKey);
        }

        try {
            console.log(`🔄 Création worker Tesseract pour: ${languages.join(', ')}`);

            const worker = await createWorker(languages, 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });

            this.workers.set(languagesKey, worker);
            console.log(`✅ Worker Tesseract prêt pour: ${languages.join(', ')}`);

            return worker;
        } catch (error) {
            console.error(`❌ Erreur création worker pour ${languages.join(', ')}:`, error);
            throw error;
        }
    }

    /**
     * Extrait le texte d'une image à partir d'un buffer
     */
    async extractTextFromImageBuffer(imageBuffer, options = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const {
                languages = this.defaultLanguages,
                confidenceThreshold = 50
            } = options;

            console.log(`🔍 OCR sur image buffer (${imageBuffer.length} bytes)`);

            // Obtenir le worker approprié
            const worker = await this.getWorker(languages);

            // Effectuer l'OCR
            const { data } = await worker.recognize(imageBuffer);

            // Filtrer par niveau de confiance
            const filteredText = data.words
                .filter(word => word.confidence >= confidenceThreshold)
                .map(word => word.text)
                .join(' ');

            const result = {
                success: true,
                text: filteredText || data.text,
                fullText: data.text,
                confidence: data.confidence,
                wordCount: data.words.length,
                languages: languages
            };

            console.log(`✅ OCR terminé: ${result.wordCount} mots, confiance ${Math.round(result.confidence)}%`);

            return result;

        } catch (error) {
            console.error('❌ Erreur extraction texte:', error);
            return {
                success: false,
                error: error.message,
                text: ''
            };
        }
    }

    /**
     * Extrait le texte d'une image à partir d'un fichier
     */
    async extractTextFromFile(filePath, options = {}) {
        try {
            console.log(`📄 Lecture du fichier image: ${filePath}`);

            // Vérifier que le fichier existe
            const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
            if (!fileExists) {
                throw new Error(`Fichier non trouvé: ${filePath}`);
            }

            // Lire le fichier
            const imageBuffer = await fs.readFile(filePath);

            // Extraire le texte
            return await this.extractTextFromImageBuffer(imageBuffer, options);

        } catch (error) {
            console.error('❌ Erreur lecture fichier:', error);
            return {
                success: false,
                error: error.message,
                text: ''
            };
        }
    }

    /**
     * Détecte le texte dans une image et retourne les positions des mots
     */
    async detectText(imageBuffer, options = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const {
                languages = this.defaultLanguages,
                confidenceThreshold = 50
            } = options;

            const worker = await this.getWorker(languages);
            const { data } = await worker.recognize(imageBuffer);

            const detections = data.words
                .filter(word => word.confidence >= confidenceThreshold)
                .map(word => ({
                    text: word.text,
                    confidence: word.confidence,
                    bbox: word.bbox
                }));

            return {
                success: true,
                detections,
                totalWords: detections.length,
                averageConfidence: detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length || 0
            };

        } catch (error) {
            console.error('❌ Erreur détection texte:', error);
            return {
                success: false,
                error: error.message,
                detections: []
            };
        }
    }

    /**
     * Vérifie si une langue est supportée
     */
    isLanguageSupported(language) {
        return this.supportedLanguages.includes(language);
    }

    /**
     * Nettoie les ressources (ferme tous les workers)
     */
    async cleanup() {
        try {
            console.log('🧹 Nettoyage des workers OCR...');

            for (const [key, worker] of this.workers.entries()) {
                await worker.terminate();
                console.log(`✅ Worker ${key} terminé`);
            }

            this.workers.clear();
            this.initialized = false;

            console.log('✅ Nettoyage OCR terminé');

            return { success: true };

        } catch (error) {
            console.error('❌ Erreur nettoyage OCR:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtient les statistiques du service OCR
     */
    getStats() {
        return {
            initialized: this.initialized,
            activeWorkers: this.workers.size,
            supportedLanguages: this.supportedLanguages,
            defaultLanguages: this.defaultLanguages
        };
    }
}

// Singleton
const ocrService = new OCRService();

module.exports = ocrService;
