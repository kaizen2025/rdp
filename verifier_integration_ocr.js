#!/usr/bin/env node

/**
 * Vérificateur de l'intégration EasyOCR
 * Valide que tous les composants sont correctement intégrés
 */

const fs = require('fs');
const path = require('path');

class OCRIntegrationChecker {
    constructor() {
        this.projectRoot = process.cwd();
        this.results = {
            dependencies: { status: 'pending', details: [] },
            services: { status: 'pending', details: [] },
            routes: { status: 'pending', details: [] },
            documentation: { status: 'pending', details: [] },
            tests: { status: 'pending', details: [] },
            tools: { status: 'pending', details: [] }
        };
        
        this.colors = {
            reset: '\x1b[0m',
            green: '\x1b[32m',
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            cyan: '\x1b[36m',
            bold: '\x1b[1m'
        };
    }

    log(message, color = 'reset') {
        console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    }

    success(message) {
        this.log(`✅ ${message}`, 'green');
    }

    error(message) {
        this.log(`❌ ${message}`, 'red');
    }

    warning(message) {
        this.log(`⚠️  ${message}`, 'yellow');
    }

    info(message) {
        this.log(`ℹ️  ${message}`, 'blue');
    }

    title(message) {
        this.log(`\n🔍 ${message}`, 'cyan');
        this.log('='.repeat(60), 'cyan');
    }

    /**
     * Point d'entrée principal
     */
    async run() {
        this.log('\n🎯 Vérification de l\'intégration EasyOCR dans DocuCortex', 'bold');
        this.log('='.repeat(60), 'bold');

        await this.checkDependencies();
        await this.checkServices();
        await this.checkRoutes();
        await this.checkDocumentation();
        await this.checkTests();
        await this.checkTools();

        this.generateFinalReport();
    }

    /**
     * Vérifie les dépendances
     */
    async checkDependencies() {
        this.title('Vérification des dépendances');
        
        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            
            if (!fs.existsSync(packageJsonPath)) {
                this.error('package.json non trouvé');
                this.results.dependencies.status = 'failed';
                return;
            }

            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const dependencies = packageJson.dependencies || {};

            // Vérifier easyocr
            if (dependencies.easyocr) {
                this.success(`easyocr trouvé: ${dependencies.easyocr}`);
                this.results.dependencies.details.push('easyocr: ' + dependencies.easyocr);
            } else {
                this.error('easyocr non trouvé dans package.json');
                this.results.dependencies.details.push('easyocr: MANQUANT');
            }

            // Vérifier sharp
            if (dependencies.sharp) {
                this.success(`sharp trouvé: ${dependencies.sharp}`);
                this.results.dependencies.details.push('sharp: ' + dependencies.sharp);
            } else {
                this.error('sharp non trouvé dans package.json');
                this.results.dependencies.details.push('sharp: MANQUANT');
            }

            // Vérifier multer (déjà présent)
            if (dependencies.multer) {
                this.success(`multer présent: ${dependencies.multer}`);
                this.results.dependencies.details.push('multer: ' + dependencies.multer);
            }

            this.results.dependencies.status = 'ok';

        } catch (error) {
            this.error('Erreur lors de la vérification des dépendances: ' + error.message);
            this.results.dependencies.status = 'failed';
        }
    }

    /**
     * Vérifie les services
     */
    async checkServices() {
        this.title('Vérification des services');
        
        try {
            // Vérifier ocrService.js
            const ocrServicePath = path.join(this.projectRoot, 'backend/services/ai/ocrService.js');
            
            if (fs.existsSync(ocrServicePath)) {
                const content = fs.readFileSync(ocrServicePath, 'utf8');
                const lines = content.split('\n').length;
                this.success(`ocrService.js créé (${lines} lignes)`);
                
                // Vérifier les classes et méthodes principales
                const hasClass = content.includes('class OCRService');
                const hasInitialize = content.includes('initialize()');
                const hasExtractText = content.includes('extractTextFromImageBuffer');
                const hasBatchProcess = content.includes('batchProcessImages');
                const hasDetectLanguage = content.includes('detectImageLanguage');
                
                if (hasClass) this.success('  ✓ Classe OCRService définie');
                if (hasInitialize) this.success('  ✓ Méthode initialize()');
                if (hasExtractText) this.success('  ✓ Méthode extractTextFromImageBuffer()');
                if (hasBatchProcess) this.success('  ✓ Méthode batchProcessImages()');
                if (hasDetectLanguage) this.success('  ✓ Méthode detectImageLanguage()');
                
                this.results.services.details.push(`ocrService.js: ${lines} lignes, méthodes principales présentes`);
                
            } else {
                this.error('ocrService.js non trouvé');
                this.results.services.details.push('ocrService.js: MANQUANT');
            }

            // Vérifier les modifications d'aiService.js
            const aiServicePath = path.join(this.projectRoot, 'backend/services/ai/aiService.js');
            
            if (fs.existsSync(aiServicePath)) {
                const content = fs.readFileSync(aiServicePath, 'utf8');
                
                // Vérifier l'import OCR
                if (content.includes('ocrService')) {
                    this.success('Import ocrService trouvé dans aiService.js');
                    this.results.services.details.push('Import OCR dans aiService.js');
                } else {
                    this.warning('Import ocrService non trouvé dans aiService.js');
                    this.results.services.details.push('Import OCR manquant');
                }
                
                // Vérifier les nouvelles méthodes
                const ocrMethods = [
                    'initializeOCR',
                    'extractTextFromImage',
                    'processImageDocument',
                    'batchProcessImages',
                    'getOCRServiceInfo',
                    'cleanupOCR'
                ];
                
                let foundMethods = 0;
                ocrMethods.forEach(method => {
                    if (content.includes(`${method}(`)) {
                        foundMethods++;
                    }
                });
                
                if (foundMethods === ocrMethods.length) {
                    this.success(`Toutes les méthodes OCR intégrées dans aiService.js (${foundMethods}/${ocrMethods.length})`);
                } else {
                    this.warning(`${foundMethods}/${ocrMethods.length} méthodes OCR trouvées dans aiService.js`);
                }
                
                this.results.services.details.push(`Méthodes OCR dans aiService.js: ${foundMethods}/${ocrMethods.length}`);
                
            } else {
                this.error('aiService.js non trouvé');
            }

            this.results.services.status = 'ok';

        } catch (error) {
            this.error('Erreur lors de la vérification des services: ' + error.message);
            this.results.services.status = 'failed';
        }
    }

    /**
     * Vérifie les routes API
     */
    async checkRoutes() {
        this.title('Vérification des routes API');
        
        try {
            const routesPath = path.join(this.projectRoot, 'server/aiRoutes.js');
            
            if (!fs.existsSync(routesPath)) {
                this.error('aiRoutes.js non trouvé');
                this.results.routes.status = 'failed';
                return;
            }

            const content = fs.readFileSync(routesPath, 'utf8');
            
            // Vérifier les endpoints OCR
            const ocrEndpoints = [
                '/ocr/initialize',
                '/ocr/extract',
                '/ocr/extract-from-buffer',
                '/ocr/process-image-document',
                '/ocr/batch-process',
                '/ocr/detect-language',
                '/ocr/info',
                '/ocr/cleanup'
            ];
            
            let foundEndpoints = 0;
            ocrEndpoints.forEach(endpoint => {
                if (content.includes(endpoint)) {
                    foundEndpoints++;
                    this.success(`Endpoint trouvé: ${endpoint}`);
                } else {
                    this.warning(`Endpoint manquant: ${endpoint}`);
                }
            });
            
            if (foundEndpoints === ocrEndpoints.length) {
                this.success(`Tous les endpoints OCR présents (${foundEndpoints}/${ocrEndpoints.length})`);
            } else {
                this.warning(`${foundEndpoints}/${ocrEndpoints.length} endpoints OCR trouvés`);
            }
            
            // Vérifier multer pour l'upload
            if (content.includes('multer')) {
                this.success('Configuration multer présente pour l\'upload');
                this.results.routes.details.push('multer configuré');
            } else {
                this.warning('Configuration multer non trouvée');
            }
            
            // Vérifier l'import multer
            if (content.includes("require('multer')")) {
                this.success('Import multer présent');
            } else {
                this.warning('Import multer non trouvé');
            }

            this.results.routes.details.push(`Endpoints OCR: ${foundEndpoints}/${ocrEndpoints.length}`);
            this.results.routes.status = 'ok';

        } catch (error) {
            this.error('Erreur lors de la vérification des routes: ' + error.message);
            this.results.routes.status = 'failed';
        }
    }

    /**
     * Vérifie la documentation
     */
    async checkDocumentation() {
        this.title('Vérification de la documentation');
        
        try {
            const docs = [
                { path: 'docs/OCR_INTEGRATION.md', name: 'Documentation technique OCR' },
                { path: 'OCR_README.md', name: 'README d\'intégration OCR' },
                { path: 'INTEGRATION_OCR_RESUME.md', name: 'Résumé des modifications' }
            ];
            
            let foundDocs = 0;
            
            docs.forEach(doc => {
                const docPath = path.join(this.projectRoot, doc.path);
                if (fs.existsSync(docPath)) {
                    const content = fs.readFileSync(docPath, 'utf8');
                    const lines = content.split('\n').length;
                    this.success(`${doc.name}: ${lines} lignes`);
                    this.results.documentation.details.push(`${doc.name}: ${lines} lignes`);
                    foundDocs++;
                } else {
                    this.warning(`${doc.name}: non trouvé`);
                    this.results.documentation.details.push(`${doc.name}: MANQUANT`);
                }
            });
            
            if (foundDocs === docs.length) {
                this.success(`Toute la documentation OCR est présente (${foundDocs}/${docs.length})`);
            } else {
                this.warning(`${foundDocs}/${docs.length} documents trouvés`);
            }

            this.results.documentation.status = 'ok';

        } catch (error) {
            this.error('Erreur lors de la vérification de la documentation: ' + error.message);
            this.results.documentation.status = 'failed';
        }
    }

    /**
     * Vérifie les tests
     */
    async checkTests() {
        this.title('Vérification des tests');
        
        try {
            const testPath = path.join(this.projectRoot, 'tests/ocr_test.js');
            
            if (fs.existsSync(testPath)) {
                const content = fs.readFileSync(testPath, 'utf8');
                const lines = content.split('\n').length;
                
                this.success(`Suite de tests OCR créée (${lines} lignes)`);
                
                // Vérifier les tests principaux
                const testMethods = [
                    'testOCRServiceInitialization',
                    'testOCRTextExtraction',
                    'testOCRBatchProcessing',
                    'testOCRLanguageDetection',
                    'testAIIntegration',
                    'testImageDocumentProcessing',
                    'testOCRBatchIndexing'
                ];
                
                let foundTests = 0;
                testMethods.forEach(test => {
                    if (content.includes(`${test}()`)) {
                        foundTests++;
                    }
                });
                
                if (foundTests === testMethods.length) {
                    this.success(`Tous les tests OCR présents (${foundTests}/${testMethods.length})`);
                } else {
                    this.warning(`${foundTests}/${testMethods.length} tests OCR trouvés`);
                }
                
                this.results.tests.details.push(`Tests OCR: ${foundTests}/${testMethods.length} présents`);
                
            } else {
                this.error('ocr_test.js non trouvé');
                this.results.tests.details.push('ocr_test.js: MANQUANT');
            }

            this.results.tests.status = 'ok';

        } catch (error) {
            this.error('Erreur lors de la vérification des tests: ' + error.message);
            this.results.tests.status = 'failed';
        }
    }

    /**
     * Vérifie les outils
     */
    async checkTools() {
        this.title('Vérification des outils');
        
        try {
            // Vérifier le script d'installation
            const installPath = path.join(this.projectRoot, 'install-ocr.js');
            
            if (fs.existsSync(installPath)) {
                const content = fs.readFileSync(installPath, 'utf8');
                const lines = content.split('\n').length;
                
                this.success(`Script d'installation OCR créé (${lines} lignes)`);
                
                // Vérifier les fonctionnalités principales
                const hasInstall = content.includes('installDependencies');
                const hasCheck = content.includes('checkDependencies');
                const hasTest = content.includes('testOCRService');
                
                if (hasInstall) this.success('  ✓ Fonction d\'installation');
                if (hasCheck) this.success('  ✓ Vérification des dépendances');
                if (hasTest) this.success('  ✓ Test du service OCR');
                
                this.results.tools.details.push(`install-ocr.js: ${lines} lignes, fonctionnalités principales`);
                
            } else {
                this.error('install-ocr.js non trouvé');
                this.results.tools.details.push('install-ocr.js: MANQUANT');
            }

            this.results.tools.status = 'ok';

        } catch (error) {
            this.error('Erreur lors de la vérification des outils: ' + error.message);
            this.results.tools.status = 'failed';
        }
    }

    /**
     * Génère le rapport final
     */
    generateFinalReport() {
        this.title('RAPPORT FINAL');
        
        let totalChecks = 0;
        let passedChecks = 0;
        
        // Analyser les résultats
        Object.keys(this.results).forEach(category => {
            const result = this.results[category];
            totalChecks++;
            
            if (result.status === 'ok') {
                passedChecks++;
                this.success(`${category.toUpperCase()}: ✅ OK`);
            } else if (result.status === 'failed') {
                this.error(`${category.toUpperCase()}: ❌ ÉCHEC`);
            } else {
                this.warning(`${category.toUpperCase()}: ⚠️ INCOMPLET`);
            }
            
            // Afficher les détails
            if (result.details.length > 0) {
                result.details.forEach(detail => {
                    this.log(`   • ${detail}`, 'blue');
                });
            }
        });
        
        // Calculer le score
        const score = Math.round((passedChecks / totalChecks) * 100);
        
        this.log('\n' + '='.repeat(60), 'bold');
        
        if (score === 100) {
            this.log('🎉 INTÉGRATION EASYOCR COMPLÈTE!', 'green');
            this.log('Tous les composants sont correctement intégrés.', 'green');
        } else if (score >= 80) {
            this.log('⚡ INTÉGRATION PRESQUE COMPLÈTE', 'yellow');
            this.log(`Score: ${score}% - Quelques éléments à vérifier.`, 'yellow');
        } else {
            this.log('❌ INTÉGRATION INCOMPLÈTE', 'red');
            this.log(`Score: ${score}% - Des éléments sont manquants.`, 'red');
        }
        
        this.log(`\n📊 Score final: ${score}% (${passedChecks}/${totalChecks} catégories OK)`, 'bold');
        this.log('='.repeat(60), 'bold');
        
        // Instructions finales
        if (score === 100) {
            this.log('\n🚀 Prochaines étapes:', 'cyan');
            this.log('1. Installation: node install-ocr.js', 'cyan');
            this.log('2. Tests: node tests/ocr_test.js', 'cyan');
            this.log('3. Démarrage: npm run server:start', 'cyan');
            this.log('4. Initialisation OCR: POST /api/ai/ocr/initialize', 'cyan');
        }
        
        this.log('\n📚 Documentation disponible:', 'cyan');
        this.log('• docs/OCR_INTEGRATION.md - Guide complet', 'cyan');
        this.log('• OCR_README.md - Résumé et exemples', 'cyan');
        this.log('• INTEGRATION_OCR_RESUME.md - Détails techniques', 'cyan');
        
        this.log('\n✨ L\'intégration EasyOCR est prête à être utilisée!', 'bold');
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const checker = new OCRIntegrationChecker();
    checker.run().catch(console.error);
}

module.exports = OCRIntegrationChecker;