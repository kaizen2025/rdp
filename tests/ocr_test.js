/**
 * Script de test pour l'intégration OCR EasyOCR
 * Teste les fonctionnalités principales du service OCR intégré
 */

const path = require('path');
const fs = require('fs').promises;

// Import des services
const ocrService = require('../backend/services/ai/ocrService');
const AIService = require('../backend/services/ai/aiService');
const aiDatabaseService = require('../backend/services/ai/aiDatabaseService');

// Configuration de test
const TEST_CONFIG = {
    testImagePath: './test-images', // Répertoire des images de test
    testResultsPath: './test-results', // Répertoire des résultats
    languages: ['fr', 'en'],
    confidenceThreshold: 0.5,
    enhanceImage: true
};

class OCRTester {
    constructor() {
        this.aiService = new AIService(aiDatabaseService);
        this.testResults = [];
    }

    /**
     * Exécute tous les tests
     */
    async runAllTests() {
        console.log('🚀 Démarrage des tests OCR EasyOCR...\n');

        try {
            // Créer les répertoires de test
            await this.setupTestDirectories();

            // Tests du service OCR
            await this.testOCRServiceInitialization();
            await this.testOCRTextExtraction();
            await this.testOCRBatchProcessing();
            await this.testOCRLanguageDetection();

            // Tests d'intégration avec l'AI Service
            await this.testAIIntegration();
            await this.testImageDocumentProcessing();
            await this.testOCRBatchIndexing();

            // Générer le rapport final
            await this.generateTestReport();

            console.log('✅ Tous les tests terminés!');
            this.printSummary();

        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
        }
    }

    /**
     * Configuration des répertoires de test
     */
    async setupTestDirectories() {
        try {
            await fs.mkdir(TEST_CONFIG.testResultsPath, { recursive: true });
            console.log('📁 Répertoires de test configurés');
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    /**
     * Test 1: Initialisation du service OCR
     */
    async testOCRServiceInitialization() {
        console.log('\n📋 Test 1: Initialisation du service OCR...');
        
        try {
            const result = await ocrService.initialize();
            
            if (result.success) {
                this.addTestResult('Initialisation OCR', true, 'Service initialisé avec succès');
                console.log('✅ Service OCR initialisé');
                console.log(`   Langues supportées: ${result.supportedLanguages.join(', ')}`);
                console.log(`   Langues par défaut: ${result.defaultLanguages.join(', ')}`);
            } else {
                this.addTestResult('Initialisation OCR', false, result.error);
                console.log('❌ Échec initialisation:', result.error);
            }
        } catch (error) {
            this.addTestResult('Initialisation OCR', false, error.message);
            console.log('❌ Erreur initialisation:', error.message);
        }
    }

    /**
     * Test 2: Extraction de texte simple
     */
    async testOCRTextExtraction() {
        console.log('\n📋 Test 2: Extraction de texte simple...');
        
        // Créer une image de test simple si elle n'existe pas
        const testImageBuffer = await this.createTestImage();
        
        try {
            const result = await ocrService.extractTextFromImageBuffer(testImageBuffer, {
                languages: TEST_CONFIG.languages,
                enhanceImage: TEST_CONFIG.enhanceImage,
                confidenceThreshold: TEST_CONFIG.confidenceThreshold
            });

            if (result.success) {
                this.addTestResult('Extraction texte simple', true, 
                    `Texte extrait: ${result.text.substring(0, 50)}... (${result.text.length} chars)`);
                console.log('✅ Extraction réussie');
                console.log(`   Confiance: ${result.metadata.confidence}`);
                console.log(`   Mots: ${result.metadata.wordsCount}`);
                console.log(`   Langues: ${result.metadata.languages.join(', ')}`);
            } else {
                this.addTestResult('Extraction texte simple', false, result.error);
                console.log('❌ Échec extraction:', result.error);
            }
        } catch (error) {
            this.addTestResult('Extraction texte simple', false, error.message);
            console.log('❌ Erreur extraction:', error.message);
        }
    }

    /**
     * Test 3: Traitement en lot
     */
    async testOCRBatchProcessing() {
        console.log('\n📋 Test 3: Traitement en lot...');
        
        const testImages = [
            await this.createTestImage('Document en français'),
            await this.createTestImage('Document in English'),
            await this.createTestImage('Texto mixto español')
        ];
        
        try {
            const result = await ocrService.batchProcessImages(testImages, {
                languages: ['fr', 'en', 'es'],
                enhanceImage: true,
                confidenceThreshold: 0.3,
                maxConcurrent: 2
            });

            if (result.success) {
                this.addTestResult('Traitement en lot', true, 
                    `${result.summary.successful}/${result.summary.total} images traitées`);
                console.log('✅ Traitement en lot réussi');
                console.log(`   Réussies: ${result.summary.successful}`);
                console.log(`   Échouées: ${result.summary.failed}`);
                console.log(`   Texte total: ${result.summary.totalTextLength} caractères`);
            } else {
                this.addTestResult('Traitement en lot', false, result.error);
                console.log('❌ Échec traitement en lot:', result.error);
            }
        } catch (error) {
            this.addTestResult('Traitement en lot', false, error.message);
            console.log('❌ Erreur traitement en lot:', error.message);
        }
    }

    /**
     * Test 4: Détection de langue
     */
    async testOCRLanguageDetection() {
        console.log('\n📋 Test 4: Détection automatique de langue...');
        
        const testImageBuffer = await this.createTestImage('Texte en français pour test');
        
        try {
            const result = await ocrService.detectImageLanguage(testImageBuffer);
            
            if (result.success) {
                this.addTestResult('Détection de langue', true, 
                    `Langue détectée: ${result.language} (confiance: ${result.confidence})`);
                console.log('✅ Détection de langue réussie');
                console.log(`   Langue: ${result.language}`);
                console.log(`   Confiance: ${result.confidence}`);
                console.log(`   Scores:`, result.scores);
            } else {
                this.addTestResult('Détection de langue', false, result.error);
                console.log('❌ Échec détection:', result.error);
            }
        } catch (error) {
            this.addTestResult('Détection de langue', false, error.message);
            console.log('❌ Erreur détection:', error.message);
        }
    }

    /**
     * Test 5: Intégration avec AI Service
     */
    async testAIIntegration() {
        console.log('\n📋 Test 5: Intégration avec AI Service...');
        
        try {
            // Initialiser l'AI Service
            await this.aiService.initialize();
            
            // Initialiser OCR via AI Service
            const ocrInitResult = await this.aiService.initializeOCR();
            
            if (ocrInitResult.success) {
                this.addTestResult('Intégration AI Service', true, 'OCR intégré avec AI Service');
                console.log('✅ Intégration AI Service réussie');
                console.log(`   Message: ${ocrInitResult.message}`);
            } else {
                this.addTestResult('Intégration AI Service', false, ocrInitResult.error);
                console.log('❌ Échec intégration:', ocrInitResult.error);
            }
        } catch (error) {
            this.addTestResult('Intégration AI Service', false, error.message);
            console.log('❌ Erreur intégration:', error.message);
        }
    }

    /**
     * Test 6: Traitement de document image
     */
    async testImageDocumentProcessing() {
        console.log('\n📋 Test 6: Traitement document image...');
        
        const testImageFile = {
            buffer: await this.createTestImage('Document OCR test'),
            filename: 'test_document.jpg',
            originalname: 'test_document.jpg',
            mimetype: 'image/jpeg',
            size: 1024
        };
        
        try {
            const result = await this.aiService.processImageDocument(testImageFile, {
                enhanceImage: true,
                confidenceThreshold: 0.4
            });

            if (result.success) {
                this.addTestResult('Traitement document image', true, 
                    `Document créé ID: ${result.documentId}`);
                console.log('✅ Traitement document réussi');
                console.log(`   Document ID: ${result.documentId}`);
                console.log(`   Confiance: ${result.confidence}`);
                console.log(`   Mots: ${result.wordCount}`);
            } else {
                this.addTestResult('Traitement document image', false, result.error);
                console.log('❌ Échec traitement document:', result.error);
            }
        } catch (error) {
            this.addTestResult('Traitement document image', false, error.message);
            console.log('❌ Erreur traitement document:', error.message);
        }
    }

    /**
     * Test 7: Indexation en lot OCR
     */
    async testOCRBatchIndexing() {
        console.log('\n📋 Test 7: Indexation en lot OCR...');
        
        const testImages = [
            { buffer: await this.createTestImage('Image 1'), filename: 'img1.jpg' },
            { buffer: await this.createTestImage('Image 2'), filename: 'img2.jpg' },
            { buffer: await this.createTestImage('Image 3'), filename: 'img3.jpg' }
        ];
        
        try {
            const result = await this.aiService.batchProcessImages(testImages, {
                languages: ['fr', 'en'],
                enhanceImage: true,
                confidenceThreshold: 0.4,
                autoIndexAsDocuments: true,
                maxConcurrent: 2
            });

            if (result.success) {
                this.addTestResult('Indexation en lot', true, 
                    `${result.indexedDocuments?.length || 0} documents indexés`);
                console.log('✅ Indexation en lot réussie');
                console.log(`   Traitées: ${result.summary.successful}`);
                console.log(`   Indexées: ${result.indexedDocuments?.length || 0}`);
                console.log(`   Échecs: ${result.summary.failed}`);
            } else {
                this.addTestResult('Indexation en lot', false, result.error);
                console.log('❌ Échec indexation:', result.error);
            }
        } catch (error) {
            this.addTestResult('Indexation en lot', false, error.message);
            console.log('❌ Erreur indexation:', error.message);
        }
    }

    /**
     * Crée une image de test simple (simulation)
     */
    async createTestImage(text = 'Test OCR') {
        // Pour les tests, on simule une image avec du texte
        // Dans un vrai environnement, vous utiliseriez des images réelles
        const canvas = require('canvas').createCanvas(400, 200);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 200);
        
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText(text, 10, 50);
        
        return canvas.toBuffer('image/jpeg');
    }

    /**
     * Ajoute un résultat de test
     */
    addTestResult(testName, success, details) {
        this.testResults.push({
            test: testName,
            success: success,
            details: details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Génère le rapport de test
     */
    async generateTestReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalTests: this.testResults.length,
            successfulTests: this.testResults.filter(r => r.success).length,
            failedTests: this.testResults.filter(r => !r.success).length,
            results: this.testResults
        };

        const reportPath = path.join(TEST_CONFIG.testResultsPath, 'ocr_test_report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Rapport de test sauvegardé: ${reportPath}`);
    }

    /**
     * Affiche le résumé des tests
     */
    printSummary() {
        const total = this.testResults.length;
        const successful = this.testResults.filter(r => r.success).length;
        const failed = total - successful;

        console.log('\n' + '='.repeat(50));
        console.log('📊 RÉSUMÉ DES TESTS OCR');
        console.log('='.repeat(50));
        console.log(`Total des tests: ${total}`);
        console.log(`✅ Réussis: ${successful}`);
        console.log(`❌ Échoués: ${failed}`);
        console.log(`Taux de réussite: ${Math.round((successful / total) * 100)}%`);
        console.log('='.repeat(50));

        if (failed > 0) {
            console.log('\n❌ Tests échoués:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => console.log(`   - ${r.test}: ${r.details}`));
        }

        console.log('\n🎉 Tests terminés!');
    }
}

// Exécution des tests si appelé directement
if (require.main === module) {
    const tester = new OCRTester();
    tester.runAllTests().catch(console.error);
}

module.exports = OCRTester;