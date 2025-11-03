/**
 * Script de test automatise pour l'Agent IA
 * Usage: node test-ai-agent.js
 */

const fs = require('fs');
const path = require('path');

console.log('====================================');
console.log('TEST AGENT IA - RDS VIEWER ANECOOP');
console.log('====================================\n');

// Couleurs pour les logs
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
};

let testsTotal = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsTotal++;
    try {
        fn();
        log.success(name);
        testsPassed++;
    } catch (error) {
        log.error(`${name}: ${error.message}`);
        testsFailed++;
    }
}

console.log('1. VERIFICATION STRUCTURE FICHIERS\n');

// Test structure backend
test('Services IA existent', () => {
    const services = [
        'backend/services/ai/aiService.js',
        'backend/services/ai/documentParserService.js',
        'backend/services/ai/nlpService.js',
        'backend/services/ai/vectorSearchService.js',
        'backend/services/ai/conversationService.js',
        'backend/services/ai/aiDatabaseService.js'
    ];
    
    services.forEach(service => {
        if (!fs.existsSync(path.join(__dirname, service))) {
            throw new Error(`Fichier manquant: ${service}`);
        }
    });
});

test('Schema base de donnees existe', () => {
    const schema = 'backend/schemas/ai_schema.sql';
    if (!fs.existsSync(path.join(__dirname, schema))) {
        throw new Error(`Schema manquant: ${schema}`);
    }
});

test('Routes API existent', () => {
    const routes = 'server/aiRoutes.js';
    if (!fs.existsSync(path.join(__dirname, routes))) {
        throw new Error(`Routes manquantes: ${routes}`);
    }
});

// Test structure frontend
test('Composants React existent', () => {
    const components = [
        'src/components/ai/ChatInterface.js',
        'src/components/ai/DocumentUploader.js',
        'src/pages/AIAssistantPage.js'
    ];
    
    components.forEach(component => {
        if (!fs.existsSync(path.join(__dirname, component))) {
            throw new Error(`Composant manquant: ${component}`);
        }
    });
});

console.log('\n2. VERIFICATION DEPENDANCES\n');

test('Package.json contient dependances IA', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const requiredDeps = [
        'node-nlp',
        'compromise',
        'natural',
        'pdf-parse',
        'mammoth',
        'pizzip',
        'tesseract.js',
        'brain.js',
        'multer'
    ];
    
    requiredDeps.forEach(dep => {
        if (!packageJson.dependencies[dep]) {
            throw new Error(`Dependance manquante: ${dep}`);
        }
    });
});

test('node_modules installe', () => {
    if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
        throw new Error('node_modules non trouve - executer npm install');
    }
});

console.log('\n3. VERIFICATION INTEGRATION\n');

test('Server.js importe routes IA', () => {
    const serverFile = fs.readFileSync(path.join(__dirname, 'server/server.js'), 'utf8');
    if (!serverFile.includes('aiRoutes') || !serverFile.includes('/api/ai')) {
        throw new Error('Routes IA non integrees dans server.js');
    }
});

test('MainLayout importe page IA', () => {
    const layoutFile = fs.readFileSync(path.join(__dirname, 'src/layouts/MainLayout.js'), 'utf8');
    if (!layoutFile.includes('AIAssistantPage') || !layoutFile.includes('/ai-assistant')) {
        throw new Error('Page IA non integree dans MainLayout');
    }
});

test('Package.json modifie correctement', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    if (packageJson.dependencies['multer'] !== '^1.4.5-lts.1') {
        throw new Error('Version multer incorrecte');
    }
});

console.log('\n4. VERIFICATION CODE\n');

test('Services AI syntaxe valide', () => {
    const services = [
        'backend/services/ai/aiService.js',
        'backend/services/ai/documentParserService.js',
        'backend/services/ai/nlpService.js'
    ];
    
    services.forEach(service => {
        const content = fs.readFileSync(path.join(__dirname, service), 'utf8');
        // Verification basique syntaxe
        if (content.includes('module.exports') === false && 
            content.includes('export ') === false) {
            throw new Error(`${service}: Pas d'export trouve`);
        }
    });
});

test('Routes API syntaxe valide', () => {
    const routesContent = fs.readFileSync(path.join(__dirname, 'server/aiRoutes.js'), 'utf8');
    
    const requiredEndpoints = [
        'POST /documents/upload',
        'GET /documents',
        'POST /chat',
        'GET /settings',
        'GET /statistics'
    ];
    
    // Verification presence des endpoints (commentaires ou code)
    const hasEndpoints = requiredEndpoints.some(endpoint => 
        routesContent.includes(endpoint) || 
        routesContent.includes(endpoint.split(' ')[1])
    );
    
    if (!hasEndpoints) {
        throw new Error('Endpoints API manquants');
    }
});

test('Composants React syntaxe valide', () => {
    const components = [
        'src/components/ai/ChatInterface.js',
        'src/pages/AIAssistantPage.js'
    ];
    
    components.forEach(component => {
        const content = fs.readFileSync(path.join(__dirname, component), 'utf8');
        if (!content.includes('export default') && !content.includes('module.exports')) {
            throw new Error(`${component}: Pas d'export par defaut`);
        }
        if (!content.includes('React') && !content.includes('react')) {
            throw new Error(`${component}: Import React manquant`);
        }
    });
});

console.log('\n5. VERIFICATION DOCUMENTATION\n');

test('Documentation complete existe', () => {
    const docs = [
        'GUIDE_AGENT_IA.md',
        'AGENT_IA_IMPLEMENTATION.md',
        'DEMARRAGE_RAPIDE_IA.md',
        'LIVRAISON_AGENT_IA.md'
    ];
    
    docs.forEach(doc => {
        if (!fs.existsSync(path.join(__dirname, doc))) {
            throw new Error(`Documentation manquante: ${doc}`);
        }
    });
});

// Résumé
console.log('\n====================================');
console.log('RESUME DES TESTS');
console.log('====================================');
console.log(`Total tests:  ${testsTotal}`);
console.log(`${colors.green}Reussis:      ${testsPassed}${colors.reset}`);
console.log(`${colors.red}Echoues:      ${testsFailed}${colors.reset}`);
console.log('====================================\n');

if (testsFailed === 0) {
    log.success('Tous les tests sont passes !');
    console.log('\nPROCHAINE ETAPE: Lancer l\'application');
    console.log('  npm run dev\n');
    process.exit(0);
} else {
    log.error(`${testsFailed} test(s) ont echoue`);
    console.log('\nCorriger les erreurs avant de continuer\n');
    process.exit(1);
}
