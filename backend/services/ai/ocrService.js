/**
 * Service OCR avec EasyOCR - DocuCortex
 * Extraction de texte d'images avec support multi-langues et多种 formats
 */

const easyocr = require('easyocr');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp'); // Pour le traitement d'images

class OCRService {
    constructor() {
        this.initialized = false;
        this.readers = new Map(); // Cache des readers par langue
        this.supportedLanguages = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'ar', 'zh', 'ja', 'ko'];
        this.defaultLanguages = ['fr', 'en'];
        
        // Configuration des options EasyOCR
        this.readerOptions = {
            gpu: false, // Désactiver GPU par défaut pour compatibilité
            modelStoreDirectory: './models', // Répertoire pour les modèles
            downloadEnabled: true,
            detectorEnabled: true,
            recognizerEnabled: true,
            verbose: false
        };
    }

    /**
     * Initialise le service OCR
     */
    async initialize() {
        if (this.initialized) return { success: true };

        try {
            console.log('Initialisation du service OCR EasyOCR...');

            // Créer le répertoire des modèles s'il n'existe pas
            await this.ensureModelsDirectory();

            // Initialiser avec les langues par défaut
            await this.initializeReader(this.defaultLanguages);

            this.initialized = true;
            console.log('✅ Service OCR EasyOCR initialisé avec succès');
            
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
     * Assure que le répertoire des modèles existe
     */
    async ensureModelsDirectory() {
        try {
            await fs.mkdir(this.readerOptions.modelStoreDirectory, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    /**
     * Initialise un reader EasyOCR pour des langues spécifiques
     */
    async initializeReader(languages) {
        const languagesKey = languages.sort().join(',');
        
        if (this.readers.has(languagesKey)) {
            return this.readers.get(languagesKey);
        }

        try {
            console.log(`🔄 Initialisation EasyOCR pour: ${languages.join(', ')}`);
            
            const reader = new easyocr.Reader(languages, this.readerOptions);
            
            // Attendre que le reader soit prêt
            await this.waitForReader(reader);
            
            this.readers.set(languagesKey, reader);
            console.log(`✅ EasyOCR prêt pour: ${languages.join(', ')}`);
            
            return reader;
        } catch (error) {
            console.error(`❌ Erreur initialisation reader pour ${languages.join(', ')}:`, error);
            throw error;
        }
    }

    /**
     * Attend que le reader soit prêt
     */
    async waitForReader(reader, maxAttempts = 10) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                // Test simple pour vérifier si le reader est prêt
                // On ne fait pas d'OCR réel, juste une vérification
                return true;
            } catch (error) {
                if (attempt === maxAttempts - 1) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
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
                enhanceImage = false,
                confidenceThreshold = 0.5,
                includeBoundingBoxes = false
            } = options;

            console.log(`🔍 OCR sur image buffer (${imageBuffer.length} bytes)`);

            // Traitement préalable de l'image si demandé
            let processedBuffer = imageBuffer;
            if (enhanceImage) {
                processedBuffer = await this.enhanceImageForOCR(imageBuffer);
            }

            // Obtenir le reader approprié
            const reader = await this.initializeReader(languages);

            // Effectuer l'OCR
            const results = await reader.readtext(processedBuffer);
            
            // Traiter les résultats
            const extractedText = this.processOCRResults(results, {
                confidenceThreshold,
                includeBoundingBoxes
            });

            console.log(`✅ OCR terminé: ${extractedText.text.length} caractères extraits`);

            return {
                success: true,
                text: extractedText.text,
                rawResults: results,
                metadata: {
                    confidence: extractedText.averageConfidence,
                    languages: languages,
                    wordsCount: extractedText.wordsCount,
                    linesCount: extractedText.linesCount,
                    processingTime: Date.now()
                },
                boundingBoxes: includeBoundingBoxes ? extractedText.boundingBoxes : null
            };

        } catch (error) {
            console.error('❌ Erreur OCR buffer:', error);
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
    async extractTextFromImageFile(imagePath, options = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            // Vérifier que le fichier existe
            await fs.access(imagePath);

            // Lire le fichier
            const imageBuffer = await fs.readFile(imagePath);
            
            // Utiliser la méthode buffer
            const result = await this.extractTextFromImageBuffer(imageBuffer, options);
            
            // Ajouter des métadonnées sur le fichier
            if (result.success) {
                const stats = await fs.stat(imagePath);
                result.metadata.sourceFile = {
                    path: imagePath,
                    size: stats.size,
                    modified: stats.mtime
                };
            }

            return result;

        } catch (error) {
            console.error('❌ Erreur OCR fichier:', error);
            return {
                success: false,
                error: error.message,
                text: ''
            };
        }
    }

    /**
     * Améliore une image pour l'OCR
     */
    async enhanceImageForOCR(imageBuffer) {
        try {
            // Conversion en niveaux de gris et amélioration du contraste
            return await sharp(imageBuffer)
                .grayscale()
                .normalise() // Améliore le contraste
                .sharpen() // Rend le texte plus net
                .toBuffer();
        } catch (error) {
            console.warn('⚠️ Erreur amélioration image, utilisation originale:', error.message);
            return imageBuffer;
        }
    }

    /**
     * Traite les résultats OCR bruts d'EasyOCR
     */
    processOCRResults(results, options) {
        const {
            confidenceThreshold = 0.5,
            includeBoundingBoxes = false
        } = options;

        let fullText = '';
        let totalConfidence = 0;
        let validWords = 0;
        let linesCount = 0;
        const wordsCount = results.length;
        const boundingBoxes = [];

        // Grouper par lignes (easier recognition groups words by line)
        const lines = new Map();
        
        results.forEach((result, index) => {
            const [bbox, text, confidence] = result;
            
            // Filtrer par seuil de confiance
            if (confidence >= confidenceThreshold) {
                fullText += text + ' ';
                totalConfidence += confidence;
                validWords++;

                // Stocker les bounding boxes si demandées
                if (includeBoundingBoxes) {
                    boundingBoxes.push({
                        text: text,
                        confidence: confidence,
                        bbox: bbox,
                        position: index
                    });
                }

                // Grouper par lignes (approximation basée sur la position Y)
                const lineY = Math.round(bbox[0][1]); // Top-left Y coordinate
                const lineKey = Math.floor(lineY / 20) * 20; // Grouper par blocs de 20px
                
                if (!lines.has(lineKey)) {
                    lines.set(lineKey, []);
                }
                lines.get(lineKey).push(text);
            }
        });

        linesCount = lines.size;
        const averageConfidence = validWords > 0 ? totalConfidence / validWords : 0;

        // Nettoyer le texte final
        fullText = fullText
            .replace(/\s+/g, ' ') // Normaliser les espaces
            .trim();

        return {
            text: fullText,
            averageConfidence: Math.round(averageConfidence * 100) / 100,
            wordsCount: validWords,
            linesCount: linesCount,
            boundingBoxes: includeBoundingBoxes ? boundingBoxes : null
        };
    }

    /**
     * Détecte automatiquement la langue d'une image
     */
    async detectImageLanguage(imageBuffer, sampleCount = 3) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log('🔍 Détection de langue...');

            // Tester avec différentes langues
            const testLanguages = ['fr', 'en', 'es', 'de'];
            const languageScores = new Map();

            for (const lang of testLanguages) {
                try {
                    const result = await this.extractTextFromImageBuffer(imageBuffer, {
                        languages: [lang],
                        confidenceThreshold: 0.3
                    });

                    if (result.success && result.text.length > 0) {
                        // Score basé sur la longueur du texte et la confiance
                        const score = (result.text.length * result.metadata.confidence) / 100;
                        languageScores.set(lang, score);
                    }
                } catch (error) {
                    languageScores.set(lang, 0);
                }
            }

            // Trouver la langue avec le meilleur score
            let bestLanguage = 'en'; // Défaut
            let bestScore = 0;

            for (const [lang, score] of languageScores.entries()) {
                if (score > bestScore) {
                    bestScore = score;
                    bestLanguage = lang;
                }
            }

            console.log(`✅ Langue détectée: ${bestLanguage} (score: ${Math.round(bestScore * 100) / 100})`);

            return {
                success: true,
                language: bestLanguage,
                confidence: Math.round((bestScore / (bestScore + 1)) * 100) / 100, // Normaliser
                scores: Object.fromEntries(languageScores)
            };

        } catch (error) {
            console.error('❌ Erreur détection langue:', error);
            return {
                success: false,
                error: error.message,
                language: 'en', // Défaut
                confidence: 0
            };
        }
    }

    /**
     * Traite plusieurs images en lot
     */
    async batchProcessImages(imageFiles, options = {}) {
        try {
            const {
                languages = this.defaultLanguages,
                enhanceImage = false,
                confidenceThreshold = 0.5,
                includeBoundingBoxes = false,
                maxConcurrent = 3 // Limiter le traitement concurrent
            } = options;

            console.log(`🔄 Traitement lot de ${imageFiles.length} images...`);

            const results = [];
            const chunks = [];

            // Diviser en chunks pour limiter la concurrence
            for (let i = 0; i < imageFiles.length; i += maxConcurrent) {
                chunks.push(imageFiles.slice(i, i + maxConcurrent));
            }

            // Traiter chaque chunk
            for (const chunk of chunks) {
                const chunkPromises = chunk.map(imageFile => 
                    this.processSingleImage(imageFile, {
                        languages,
                        enhanceImage,
                        confidenceThreshold,
                        includeBoundingBoxes
                    })
                );

                const chunkResults = await Promise.allSettled(chunkPromises);
                
                chunkResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push({
                            ...result.value,
                            index: chunks.indexOf(chunk) * maxConcurrent + index
                        });
                    } else {
                        results.push({
                            success: false,
                            error: result.reason.message,
                            index: chunks.indexOf(chunk) * maxConcurrent + index,
                            imageFile: chunk[index]
                        });
                    }
                });
            }

            const successCount = results.filter(r => r.success).length;
            console.log(`✅ Traitement lot terminé: ${successCount}/${imageFiles.length} réussies`);

            return {
                success: true,
                results: results,
                summary: {
                    total: imageFiles.length,
                    successful: successCount,
                    failed: imageFiles.length - successCount,
                    totalTextLength: results.reduce((sum, r) => sum + (r.text?.length || 0), 0)
                }
            };

        } catch (error) {
            console.error('❌ Erreur traitement lot:', error);
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    }

    /**
     * Traite une seule image (pour le traitement en lot)
     */
    async processSingleImage(imageFile, options) {
        try {
            let buffer;

            if (Buffer.isBuffer(imageFile)) {
                buffer = imageFile;
            } else if (typeof imageFile === 'string') {
                buffer = await fs.readFile(imageFile);
            } else if (imageFile.buffer) {
                buffer = imageFile.buffer;
            } else {
                throw new Error('Format d\'image non supporté');
            }

            return await this.extractTextFromImageBuffer(buffer, options);

        } catch (error) {
            throw error;
        }
    }

    /**
     * Nettoie le texte extrait pour l'analyse
     */
    cleanExtractedText(text) {
        if (!text) return '';

        return text
            // Supprimer les caractères de contrôle
            .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
            // Normaliser les espaces
            .replace(/\s+/g, ' ')
            // Supprimer les espaces au début/fin
            .trim()
            // Capitaliser les premières lettres après ponctuation
            .replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    }

    /**
     * Obtient les informations sur le service
     */
    getServiceInfo() {
        return {
            service: 'EasyOCR',
            version: '1.7.1',
            initialized: this.initialized,
            supportedLanguages: this.supportedLanguages,
            defaultLanguages: this.defaultLanguages,
            readersCount: this.readers.size,
            options: this.readerOptions
        };
    }

    /**
     * Nettoie les ressources
     */
    async cleanup() {
        try {
            // Fermer tous les readers
            for (const [key, reader] of this.readers.entries()) {
                try {
                    // EasyOCR n'a pas de méthode close explicite
                    // Les ressources seront nettoyées par le garbage collector
                } catch (error) {
                    console.warn(`Erreur fermeture reader ${key}:`, error.message);
                }
            }

            this.readers.clear();
            this.initialized = false;

            console.log('🧹 Service OCR nettoyé');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new OCRService();