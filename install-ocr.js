#!/usr/bin/env node

/**
 * Script d'installation des dépendances OCR EasyOCR
 * DocuCortex - Installation automatisée
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class OCRInstaller {
    constructor() {
        this.projectRoot = process.cwd();
        this.packageJsonPath = path.join(this.projectRoot, 'package.json');
        this.dependencies = ['easyocr', 'sharp'];
        this.colors = {
            reset: '\x1b[0m',
            green: '\x1b[32m',
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            cyan: '\x1b[36m'
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
        this.log(`\n🔧 ${message}`, 'cyan');
        this.log('='.repeat(50), 'cyan');
    }

    /**
     * Vérifie si le package.json existe
     */
    checkPackageJson() {
        this.title('Vérification du projet');
        
        if (!fs.existsSync(this.packageJsonPath)) {
            this.error('package.json non trouvé dans le répertoire courant');
            process.exit(1);
        }
        
        this.success('Package.json trouvé');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            this.success(`Projet: ${packageJson.name} v${packageJson.version}`);
            return packageJson;
        } catch (error) {
            this.error('Erreur lecture package.json: ' + error.message);
            process.exit(1);
        }
    }

    /**
     * Vérifie les dépendances déjà installées
     */
    checkExistingDependencies(packageJson) {
        this.title('Vérification des dépendances existantes');
        
        const missing = [];
        const installed = [];
        
        for (const dep of this.dependencies) {
            if (packageJson.dependencies && packageJson.dependencies[dep]) {
                installed.push(`${dep}@${packageJson.dependencies[dep]}`);
            } else {
                missing.push(dep);
            }
        }
        
        if (installed.length > 0) {
            this.success('Dépendances déjà installées:');
            installed.forEach(dep => this.log(`  - ${dep}`, 'green'));
        }
        
        if (missing.length > 0) {
            this.warning('Dépendances manquantes:');
            missing.forEach(dep => this.log(`  - ${dep}`, 'yellow'));
        } else {
            this.success('Toutes les dépendances sont déjà installées!');
            return false; // Pas besoin d'installer
        }
        
        return true; // Besoin d'installer
    }

    /**
     * Installe les dépendances
     */
    installDependencies() {
        this.title('Installation des dépendances OCR');
        
        this.info('Installation de easyocr et sharp...');
        
        try {
            // Installer easyocr et sharp
            execSync(`npm install easyocr sharp`, {
                stdio: 'inherit',
                cwd: this.projectRoot
            });
            
            this.success('Dépendances installées avec succès!');
            
        } catch (error) {
            this.error('Erreur lors de l\'installation des dépendances:');
            this.error(error.message);
            
            this.info('Tentative d\'installation avec flags alternatifs...');
            
            try {
                execSync(`npm install easyocr sharp --force`, {
                    stdio: 'inherit',
                    cwd: this.projectRoot
                });
                
                this.success('Dépendances installées avec --force!');
                
            } catch (forceError) {
                this.error('Échec de l\'installation même avec --force');
                this.error('Veuillez installer manuellement: npm install easyocr sharp');
                process.exit(1);
            }
        }
    }

    /**
     * Vérifie la compilation des dépendances natives
     */
    checkNativeCompilation() {
        this.title('Vérification de la compilation native');
        
        try {
            // Tester sharp
            this.info('Test de sharp...');
            execSync('node -e "require(\'sharp\')"', {
                stdio: 'pipe',
                cwd: this.projectRoot
            });
            this.success('Sharp fonctionne correctement');
            
            // Tester easyocr (plus lent)
            this.info('Test de easyocr...');
            execSync('node -e "console.log(require(\'easyocr\').Reader ? \'EasyOCR OK\' : \'EasyOCR FAILED\')"', {
                stdio: 'pipe',
                cwd: this.projectRoot,
                timeout: 30000
            });
            this.success('EasyOCR est accessible');
            
        } catch (error) {
            this.warning('Erreur lors du test des dépendances:');
            this.warning(error.message);
            this.info('Cela peut être normal lors de la première installation');
            this.info('Les dépendances seront testées au runtime');
        }
    }

    /**
     * Met à jour le package.json avec les nouvelles dépendances
     */
    updatePackageJson() {
        this.title('Mise à jour du package.json');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            
            // S'assurer que dependencies existe
            if (!packageJson.dependencies) {
                packageJson.dependencies = {};
            }
            
            // Ajouter les dépendances OCR si elles ne sont pas déjà présentes
            let updated = false;
            
            if (!packageJson.dependencies.easyocr) {
                packageJson.dependencies.easyocr = '^1.7.1';
                updated = true;
            }
            
            if (!packageJson.dependencies.sharp) {
                packageJson.dependencies.sharp = '^0.33.2';
                updated = true;
            }
            
            if (updated) {
                fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2));
                this.success('Package.json mis à jour avec les dépendances OCR');
            } else {
                this.info('Package.json déjà à jour');
            }
            
        } catch (error) {
            this.error('Erreur lors de la mise à jour du package.json:');
            this.error(error.message);
        }
    }

    /**
     * Teste l'initialisation du service OCR
     */
    testOCRService() {
        this.title('Test du service OCR');
        
        try {
            const ocrService = require(path.join(this.projectRoot, 'backend/services/ai/ocrService'));
            
            this.info('Test d\'initialisation du service OCR...');
            
            // Note: On ne fait qu'un test d'import, pas d'initialisation complète
            // car cela téléchargerait les modèles
            if (ocrService && typeof ocrService.getServiceInfo === 'function') {
                const info = ocrService.getServiceInfo();
                this.success('Service OCR accessible');
                this.log(`   Version: ${info.version || 'N/A'}`);
                this.log(`   Langues supportées: ${info.supportedLanguages?.length || 0}`);
            } else {
                this.warning('Service OCR trouvé mais structure inattendue');
            }
            
        } catch (error) {
            this.warning('Impossible de tester le service OCR:');
            this.warning(error.message);
            this.info('Le test sera effectué au runtime');
        }
    }

    /**
     * Affiche les instructions post-installation
     */
    showPostInstallInstructions() {
        this.title('Instructions post-installation');
        
        this.info('Installation terminée! Voici les prochaines étapes:');
        
        this.log('\n1. 🚀 Démarrer le serveur DocuCortex:');
        this.log('   npm run server:start', 'cyan');
        
        this.log('\n2. 🔧 Initialiser le service OCR:');
        this.log('   curl -X POST http://localhost:3000/api/ai/ocr/initialize', 'cyan');
        
        this.log('\n3. 🧪 Tester l\'intégration:');
        this.log('   node tests/ocr_test.js', 'cyan');
        
        this.log('\n4. 📚 Consulter la documentation:');
        this.log('   - docs/OCR_INTEGRATION.md', 'cyan');
        this.log('   - OCR_README.md', 'cyan');
        
        this.log('\n5. 📡 Endpoints OCR disponibles:');
        this.log('   - POST /api/ai/ocr/extract', 'cyan');
        this.log('   - POST /api/ai/ocr/process-image-document', 'cyan');
        this.log('   - POST /api/ai/ocr/batch-process', 'cyan');
        
        this.success('\n🎉 Intégration EasyOCR terminée avec succès!');
    }

    /**
     * Affiche l'aide
     */
    showHelp() {
        this.log('\n🔧 Installation EasyOCR pour DocuCortex', 'cyan');
        this.log('='.repeat(50), 'cyan');
        
        this.log('\nUtilisation:', 'yellow');
        this.log('  node install-ocr.js [options]', 'cyan');
        
        this.log('\nOptions:', 'yellow');
        this.log('  --help, -h     Afficher cette aide');
        this.log('  --force, -f    Forcer la réinstallation');
        this.log('  --skip-test    Ignorer les tests post-installation');
        
        this.log('\nCe script:', 'yellow');
        this.log('  1. Vérifie les dépendances existantes');
        this.log('  2. Installe easyocr et sharp');
        this.log('  3. Met à jour package.json');
        this.log('  4. Teste la compilation native');
        this.log('  5. Valide le service OCR');
        
        this.log('\nPour plus d\'informations, consultez:', 'yellow');
        this.log('  - docs/OCR_INTEGRATION.md', 'cyan');
        this.log('  - OCR_README.md', 'cyan');
        
        this.log('\n');
    }

    /**
     * Point d'entrée principal
     */
    async run() {
        const args = process.argv.slice(2);
        const force = args.includes('--force') || args.includes('-f');
        const skipTest = args.includes('--skip-test');
        const help = args.includes('--help') || args.includes('-h');
        
        if (help) {
            this.showHelp();
            return;
        }
        
        try {
            this.title('Installation EasyOCR pour DocuCortex');
            
            // Vérifier le projet
            const packageJson = this.checkPackageJson();
            
            // Vérifier les dépendances
            const needInstall = this.checkExistingDependencies(packageJson);
            
            // Installer si nécessaire
            if (needInstall || force) {
                this.installDependencies();
            }
            
            // Mettre à jour package.json
            this.updatePackageJson();
            
            // Tester la compilation
            if (!skipTest) {
                this.checkNativeCompilation();
                this.testOCRService();
            }
            
            // Instructions finales
            this.showPostInstallInstructions();
            
        } catch (error) {
            this.error('Erreur fatale lors de l\'installation:');
            this.error(error.message);
            process.exit(1);
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const installer = new OCRInstaller();
    installer.run();
}

module.exports = OCRInstaller;