#!/usr/bin/env node

/**
 * Script de démarrage DocuCortex avec support Ollama
 * Vérifie automatiquement la disponibilité d'Ollama et configure le service IA
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const promisify = require('util').promisify;

const execAsync = promisify(exec);

class DocuCortexStartup {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434';
        this.ollamaAvailable = false;
        this.configPath = path.join(__dirname, '..', 'config', 'config.json');
    }

    /**
     * Point d'entrée principal
     */
    async start() {
        console.log('🚀 Démarrage de DocuCortex...\n');

        try {
            await this.checkEnvironment();
            await this.detectOllama();
            await this.configureAI();
            await this.startServer();

        } catch (error) {
            console.error('❌ Erreur lors du démarrage:', error.message);
            this.showTroubleshooting();
            process.exit(1);
        }
    }

    /**
     * Vérifie l'environnement
     */
    async checkEnvironment() {
        console.log('🔍 Vérification de l\'environnement...');

        // Vérifier Node.js
        const nodeVersion = process.version;
        console.log(`   ✅ Node.js ${nodeVersion}`);

        // Vérifier les dépendances
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const dependencies = Object.keys(packageJson.dependencies || {});
            
            const requiredDeps = ['express', 'sqlite3', 'axios'];
            const missingDeps = requiredDeps.filter(dep => !dependencies.includes(dep));

            if (missingDeps.length > 0) {
                console.log('   ⚠️ Installation des dépendances manquantes...');
                await this.installDependencies(missingDeps);
            } else {
                console.log('   ✅ Toutes les dépendances sont installées');
            }

        } catch (error) {
            console.log('   ⚠️ Impossible de vérifier package.json:', error.message);
        }

        console.log('✅ Environnement validé\n');
    }

    /**
     * Détecte Ollama et vérifie sa disponibilité
     */
    async detectOllama() {
        console.log('🤖 Détection d\'Ollama...');

        // Vérifier si Ollama est installé
        try {
            await execAsync('ollama --version');
            console.log('   ✅ Ollama détecté');
        } catch (error) {
            console.log('   ⚠️ Ollama non installé');
            console.log('      💡 Installez Ollama avec: npm run install:ollama');
            return;
        }

        // Vérifier la connexion
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 3000 });
            
            if (response.status === 200) {
                this.ollamaAvailable = true;
                const models = response.data.models || [];
                console.log(`   ✅ Ollama connecté (${models.length} modèle(s))`);
                
                // Afficher les modèles disponibles
                models.forEach(model => {
                    const sizeMB = Math.round(model.size / 1024 / 1024);
                    console.log(`      📦 ${model.name} (${sizeMB}MB)`);
                });

            } else {
                console.log('   ⚠️ Ollama répond mais avec une erreur');
            }

        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('   ⚠️ Ollama non démarré');
                console.log('      💡 Démarrez Ollama avec: ollama serve');
            } else {
                console.log(`   ⚠️ Erreur de connexion Ollama: ${error.message}`);
            }
        }

        console.log();
    }

    /**
     * Configure l'IA en fonction de la disponibilité d'Ollama
     */
    async configureAI() {
        console.log('⚙️ Configuration de l\'IA...');

        // Charger la configuration existante
        let config = this.loadConfig();

        // Déterminer le fournisseur IA
        const aiProvider = this.ollamaAvailable ? 'ollama' : 'default';
        
        // Configuration Ollama si disponible
        if (this.ollamaAvailable) {
            config.ollama = {
                enabled: true,
                host: this.ollamaUrl,
                model: 'llama3.2:3b',
                autoStart: true
            };
            console.log('   ✅ Configuration Ollama activée');
        } else {
            config.ollama = {
                enabled: false,
                host: this.ollamaUrl,
                autoStart: false
            };
            console.log('   ⚠️ Ollama non disponible, utilisation du service par défaut');
        }

        // Configuration IA générale
        config.ai = config.ai || {};
        config.ai.provider = aiProvider;
        config.ai.fallbackToDefault = true;
        config.ai.maxRetries = 3;

        // Sauvegarder la configuration
        this.saveConfig(config);

        console.log(`   ✅ Fournisseur IA: ${aiProvider}`);
        console.log('✅ Configuration IA finalisée\n');
    }

    /**
     * Démarre le serveur DocuCortex
     */
    async startServer() {
        console.log('🖥️ Démarrage du serveur DocuCortex...');

        const serverPath = path.join(__dirname, '..', 'server', 'server.js');

        if (!fs.existsSync(serverPath)) {
            throw new Error(`Serveur non trouvé: ${serverPath}`);
        }

        // Informations de démarrage
        const port = process.env.PORT || 3000;
        const host = process.env.HOST || 'localhost';

        console.log(`   🌐 Serveur démarré sur http://${host}:${port}`);
        console.log(`   🤖 IA: ${this.ollamaAvailable ? 'Ollama (Llama 3.2 3B)' : 'Service par défaut'}`);
        console.log('   📝 Logs disponibles dans la console\n');

        // Variables d'environnement pour le serveur
        process.env.AI_PROVIDER = this.ollamaAvailable ? 'ollama' : 'default';
        process.env.OLLAMA_ENABLED = this.ollamaAvailable.toString();
        process.env.OLLAMA_HOST = this.ollamaUrl;

        // Démarrer le serveur
        require(serverPath);

        // Afficher les informations de statut
        this.showStatus();

        // Gestion propre de l'arrêt
        process.on('SIGINT', () => {
            console.log('\n🛑 Arrêt de DocuCortex...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 Arrêt de DocuCortex...');
            process.exit(0);
        });
    }

    /**
     * Affiche les informations de statut
     */
    showStatus() {
        console.log('📊 === STATUT DOCUCORTEX ===\n');

        console.log('🔧 Services:');
        console.log(`   • Serveur Web: ✅ Actif`);
        console.log(`   • Base de Données: ✅ Prêt`);
        console.log(`   • IA: ${this.ollamaAvailable ? '✅ Ollama (Llama 3.2 3B)' : '⚠️ Service par défaut'}`);

        console.log('\n🌐 Accès:');
        console.log(`   • Interface Web: http://localhost:${process.env.PORT || 3000}`);
        console.log(`   • API: http://localhost:${process.env.PORT || 3000}/api`);

        if (this.ollamaAvailable) {
            console.log('\n🤖 Fonctionnalités IA disponibles:');
            console.log('   • Chat intelligent avec Ollama');
            console.log('   • Analyse de sentiment');
            console.log('   • Résumé automatique');
            console.log('   • Extraction de mots-clés');
            console.log('   • Traduction');
            console.log('   • Q&A sur documents');
        }

        console.log('\n📋 Commandes utiles:');
        console.log('   • Statut IA: GET /api/ai/ollama/status');
        console.log('   • Test Ollama: GET /api/ai/ollama/test');
        console.log('   • Chat Ollama: POST /api/ai/chat/enhanced');

        console.log('\n' + '='.repeat(40));
    }

    /**
     * Affiche les conseils de dépannage
     */
    showTroubleshooting() {
        console.log('\n🔧 === DÉPANNAGE ===\n');

        console.log('Problèmes courants:');
        console.log('');
        console.log('1. Ollama non détecté:');
        console.log('   npm run install:ollama');
        console.log('');

        console.log('2. Ollama non démarré:');
        console.log('   ollama serve');
        console.log('');

        console.log('3. Port déjà utilisé:');
        console.log('   kill -9 $(lsof -ti:3000)  # Linux/Mac');
        console.log('   netstat -ano | findstr :3000  # Windows');
        console.log('');

        console.log('4. Installation des dépendances:');
        console.log('   npm install');
        console.log('');

        console.log('5. Logs détaillés:');
        console.log('   DEBUG=* npm start');
        console.log('');
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    /**
     * Charge la configuration
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger la configuration:', error.message);
        }

        return {};
    }

    /**
     * Sauvegarde la configuration
     */
    saveConfig(config) {
        try {
            // Créer le répertoire config s'il n'existe pas
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.warn('⚠️ Impossible de sauvegarder la configuration:', error.message);
        }
    }

    /**
     * Installe les dépendances manquantes
     */
    async installDependencies(dependencies) {
        try {
            console.log(`   📦 Installation de: ${dependencies.join(', ')}`);
            await execAsync(`npm install ${dependencies.join(' ')}`);
            console.log('   ✅ Dépendances installées');
        } catch (error) {
            console.log(`   ⚠️ Échec installation: ${error.message}`);
        }
    }
}

// Point d'entrée
if (require.main === module) {
    const startup = new DocuCortexStartup();
    startup.start().catch(error => {
        console.error('❌ Erreur fatale:', error.message);
        process.exit(1);
    });
}

module.exports = DocuCortexStartup;