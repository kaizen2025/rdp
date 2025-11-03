/**
 * Script d'installation et de configuration d'Ollama pour DocuCortex
 * Automatise l'installation d'Ollama et la configuration du modèle Llama 3.2 3B
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class OllamaInstaller {
    constructor() {
        this.baseUrl = 'http://localhost:11434';
        this.model = 'llama3.2:3b';
        this.isWindows = process.platform === 'win32';
    }

    /**
     * Point d'entrée principal
     */
    async install() {
        console.log('🚀 Installation d\'Ollama pour DocuCortex...\n');

        try {
            // Étapes d'installation
            await this.checkPrerequisites();
            await this.installOllama();
            await this.startOllama();
            await this.waitForOllama();
            await this.installModel();
            await this.testConnection();
            await this.configureDocuCortex();

            console.log('\n✅ Installation Ollama terminée avec succès !');
            console.log('\n📋 Prochaines étapes :');
            console.log('   1. DocuCortex démarrera automatiquement avec Ollama');
            console.log('   2. Accédez à l\'interface web DocuCortex');
            console.log('   3. Utilisez les fonctionnalités IA avec Ollama\n');

        } catch (error) {
            console.error('\n❌ Erreur lors de l\'installation:', error.message);
            this.showTroubleshooting();
            process.exit(1);
        }
    }

    /**
     * Vérifie les prérequis
     */
    async checkPrerequisites() {
        console.log('🔍 Vérification des prérequis...');

        // Vérifier Node.js
        const nodeVersion = process.version;
        console.log(`   ✅ Node.js ${nodeVersion} détecté`);

        // Vérifier npm
        try {
            await this.execCommand('npm --version');
            console.log('   ✅ npm détecté');
        } catch (error) {
            throw new Error('npm non trouvé. Veuillez installer Node.js avec npm.');
        }

        // Vérifier l'accès réseau
        try {
            await axios.get('https://registry.npmjs.org/', { timeout: 5000 });
            console.log('   ✅ Accès réseau confirmé');
        } catch (error) {
            console.warn('   ⚠️ Problème de connectivité réseau détecté');
        }

        console.log('✅ Prérequis validés\n');
    }

    /**
     * Installe Ollama
     */
    async installOllama() {
        console.log('📦 Installation d\'Ollama...');

        if (this.isWindows) {
            await this.installOllamaWindows();
        } else {
            await this.installOllamaUnix();
        }

        console.log('✅ Ollama installé\n');
    }

    /**
     * Installation sur Windows
     */
    async installOllamaWindows() {
        console.log('   🪟 Détection Windows');

        // Vérifier si Ollama est déjà installé
        try {
            await this.execCommand('ollama --version');
            console.log('   ✅ Ollama déjà installé');
            return;
        } catch (error) {
            console.log('   📥 Téléchargement d\'Ollama pour Windows...');
        }

        const downloadUrl = 'https://ollama.ai/download/ollama-amd64.exe';
        const installPath = path.join(process.cwd(), 'ollama.exe');

        try {
            // Télécharger Ollama
            const response = await axios.get(downloadUrl, { responseType: 'stream' });
            const writer = fs.createWriteStream(installPath);
            
            await new Promise((resolve, reject) => {
                response.data.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log('   📥 Ollama téléchargé');
            console.log('   ⚠️ Veuillez installer Ollama manuellement depuis le fichier téléchargé');
            console.log(`   📂 Chemin: ${installPath}`);

        } catch (error) {
            throw new Error(`Échec du téléchargement d'Ollama: ${error.message}`);
        }
    }

    /**
     * Installation sur Linux/macOS
     */
    async installOllamaUnix() {
        // Vérifier si Ollama est déjà installé
        try {
            await this.execCommand('ollama --version');
            console.log('   ✅ Ollama déjà installé');
            return;
        } catch (error) {
            console.log('   📥 Installation d\'Ollama...');
        }

        try {
            // Installation via script officiel
            const installCommand = 'curl -fsSL https://ollama.ai/install.sh | sh';
            await this.execCommand(installCommand, { timeout: 300000 }); // 5 minutes timeout
            console.log('   ✅ Script d\'installation exécuté');

        } catch (error) {
            // Fallback: installation manuelle
            await this.installOllamaManual();
        }
    }

    /**
     * Installation manuelle (fallback)
     */
    async installOllamaManual() {
        console.log('   🔧 Installation manuelle d\'Ollama...');

        const commands = [
            // Ubuntu/Debian
            'curl -fsSL https://ollama.ai/download/ollama-linux-amd64 -o ollama',
            'chmod +x ollama',
            'sudo mv ollama /usr/local/bin/',
            
            // ou pour utilisateur local
            'mkdir -p ~/.local/bin',
            'curl -fsSL https://ollama.ai/download/ollama-linux-amd64 -o ~/.local/bin/ollama',
            'chmod +x ~/.local/bin/ollama'
        ];

        for (const command of commands) {
            try {
                await this.execCommand(command);
                console.log(`   ✅ ${command.split(' ').slice(0, 3).join(' ')}...`);
            } catch (error) {
                console.log(`   ⚠️ Échec: ${command}`);
            }
        }

        // Ajouter au PATH si nécessaire
        const shellConfig = this.getShellConfig();
        if (shellConfig && !process.env.PATH.includes('.local/bin')) {
            console.log('   ⚠️ Ajoutez ~/.local/bin à votre PATH dans .bashrc ou .zshrc');
        }
    }

    /**
     * Démarre Ollama
     */
    async startOllama() {
        console.log('🚀 Démarrage d\'Ollama...');

        if (this.isWindows) {
            console.log('   🪟 Sur Windows, démarrage manuel requis:');
            console.log('      1. Exécutez ollama.exe');
            console.log('      2. Ou utilisez: .\\ollama.exe serve');
            return;
        }

        // Vérifier si Ollama est déjà en cours d'exécution
        try {
            await axios.get(`${this.baseUrl}/api/tags`, { timeout: 2000 });
            console.log('   ✅ Ollama déjà en cours d\'exécution');
            return;
        } catch (error) {
            console.log('   🔄 Démarrage d\'Ollama...');
        }

        try {
            // Démarrer Ollama en arrière-plan
            const ollamaProcess = spawn('ollama', ['serve'], {
                detached: true,
                stdio: 'ignore'
            });

            ollamaProcess.unref();
            console.log('   ✅ Ollama démarré en arrière-plan');

        } catch (error) {
            console.log('   ⚠️ Démarrage automatique échoué');
            console.log('   💡 Démarrez Ollama manuellement: ollama serve');
        }

        console.log('   ⏳ Attente du démarrage d\'Ollama...');
    }

    /**
     * Attend qu'Ollama soit prêt
     */
    async waitForOllama() {
        console.log('⏳ Vérification de la disponibilité d\'Ollama...');

        const maxAttempts = 30;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 2000 });
                if (response.status === 200) {
                    console.log('   ✅ Ollama est prêt !');
                    return;
                }
            } catch (error) {
                // Ollama pas encore prêt
            }

            attempts++;
            await this.sleep(2000); // Attendre 2 secondes
            console.log(`   ⏳ Tentative ${attempts}/${maxAttempts}...`);
        }

        throw new Error('Ollama ne répond pas après 60 secondes');
    }

    /**
     * Installe le modèle Llama 3.2 3B
     */
    async installModel() {
        console.log('🤖 Installation du modèle Llama 3.2 3B...');

        try {
            // Vérifier les modèles déjà installés
            const modelsResponse = await axios.get(`${this.baseUrl}/api/tags`);
            const existingModels = modelsResponse.data.models || [];
            
            const modelExists = existingModels.some(model => 
                model.name.includes('llama3.2') && model.name.includes('3b')
            );

            if (modelExists) {
                console.log('   ✅ Modèle Llama 3.2 3B déjà installé');
                return;
            }

            console.log('   📥 Téléchargement du modèle (cela peut prendre quelques minutes)...');

            // Télécharger le modèle
            const pullResponse = await axios.post(`${this.baseUrl}/api/pull`, {
                name: this.model
            }, { timeout: 300000 }); // 5 minutes timeout

            if (pullResponse.status === 200) {
                console.log('   ✅ Modèle Llama 3.2 3B installé avec succès');
            }

        } catch (error) {
            console.log('   ❌ Erreur lors de l\'installation du modèle:');
            console.log(`      ${error.message}`);
            console.log('   💡 Vous pouvez l\'installer plus tard avec: ollama pull llama3.2:3b');
        }
    }

    /**
     * Teste la connexion
     */
    async testConnection() {
        console.log('🧪 Test de connexion Ollama...');

        try {
            // Test 1: Vérifier les modèles
            const modelsResponse = await axios.get(`${this.baseUrl}/api/tags`);
            const models = modelsResponse.data.models || [];
            console.log(`   ✅ ${models.length} modèle(s) disponible(s)`);

            // Test 2: Test simple de génération
            const generateResponse = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.model,
                prompt: 'Hello',
                stream: false
            }, { timeout: 10000 });

            if (generateResponse.data && generateResponse.data.response) {
                console.log('   ✅ Test de génération réussi');
                console.log(`   📝 Réponse: "${generateResponse.data.response.trim()}"`);
            }

            console.log('✅ Connexion Ollama validée\n');

        } catch (error) {
            console.log(`   ❌ Test échoué: ${error.message}`);
            throw new Error('Impossible de se connecter à Ollama');
        }
    }

    /**
     * Configure DocuCortex pour utiliser Ollama
     */
    async configureDocuCortex() {
        console.log('⚙️ Configuration de DocuCortex...');

        // Créer ou mettre à jour la configuration Ollama
        const configPath = path.join(process.cwd(), 'config', 'ollama.config.json');
        
        const config = {
            enabled: true,
            host: 'http://localhost:11434',
            model: this.model,
            settings: {
                temperature: 0.7,
                top_p: 0.9,
                top_k: 40,
                maxTokens: 512
            },
            installed: true,
            installationDate: new Date().toISOString()
        };

        try {
            // Créer le répertoire config s'il n'existe pas
            const configDir = path.dirname(configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log('   ✅ Configuration Ollama créée');
            console.log(`   📂 Fichier: ${configPath}`);

        } catch (error) {
            console.log(`   ⚠️ Impossible de créer la configuration: ${error.message}`);
        }

        console.log('✅ DocuCortex configuré pour Ollama\n');
    }

    /**
     * Affiche les conseils de dépannage
     */
    showTroubleshooting() {
        console.log('\n🔧 Conseils de dépannage:\n');
        
        console.log('1. Vérifiez qu\'Ollama est installé:');
        console.log('   ollama --version');
        console.log('');
        
        console.log('2. Démarrez Ollama:');
        console.log('   ollama serve');
        console.log('');
        
        console.log('3. Installez le modèle:');
        console.log('   ollama pull llama3.2:3b');
        console.log('');
        
        console.log('4. Testez Ollama:');
        console.log('   curl http://localhost:11434/api/tags');
        console.log('');
        
        console.log('5. Redémarrez DocuCortex après installation');
        console.log('');
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    /**
     * Exécute une commande shell
     */
    execCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    /**
     * Attend pendant un certain temps
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Détecte le shell de configuration
     */
    getShellConfig() {
        const shell = process.env.SHELL || '';
        if (shell.includes('zsh')) return '.zshrc';
        if (shell.includes('bash')) return '.bashrc';
        return null;
    }
}

// Point d'entrée
if (require.main === module) {
    const installer = new OllamaInstaller();
    installer.install().catch(error => {
        console.error('Erreur fatale:', error.message);
        process.exit(1);
    });
}

module.exports = OllamaInstaller;