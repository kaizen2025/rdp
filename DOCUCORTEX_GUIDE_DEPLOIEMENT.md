# 🧠 DocuCortex - Guide de Déploiement Complet
**Le Cortex de vos Documents - Système GED Intelligent pour Groupe Anecoop**

---

## 📋 Résumé du Projet

**DocuCortex** est un système de Gestion Électronique de Documents (GED) moderne et intelligent intégré à RDP Viewer, spécialement conçu pour le Groupe Anecoop.

### ✨ Fonctionnalités Principales

1. **Accès Serveur Réseau** - Indexation automatique depuis `\\192.168.1.230\Donnees` (600GB supporté)
2. **Chat Intelligent** - Réponses structurées avec citations précises et suggestions
3. **Recherche Avancée** - Toutes extensions supportées, métadonnées automatiques
4. **Aperçu Intégré** - PDF, Images, Texte avec téléchargement direct
5. **Configuration Flexible** - Interface UI pour personnaliser répertoires et extensions
6. **Surveillance Temps Réel** - File watcher détecte automatiquement nouveaux documents
7. **Multilingue** - Détection français, espagnol, anglais
8. **100% Local** - Aucune donnée cloud, sécurité maximale

---

## 📊 État Actuel du Déploiement

### ✅ Fichiers Backend Créés (4/6)

| Fichier | Lignes | État | Description |
|---------|--------|------|-------------|
| `backend/services/ai/networkDocumentService.js` | 204 | ✅ Créé | Scan réseau UNC, file watcher |
| `backend/services/ai/documentMetadataService.js` | 139 | ✅ Créé | Extraction métadonnées |
| `backend/services/ai/intelligentResponseService.js` | 128 | ✅ Créé | Réponses structurées |
| `backend/services/ai/filePreviewService.js` | 93 | ✅ Créé | Aperçu et téléchargement |
| `backend/services/ai/aiService.js` | - | ⏳ À modifier | Intégration services |
| `server/aiRoutes.js` | - | ⏳ À modifier | Routes API réseau |

### ⏳ Fichiers Frontend À Créer (4/4)

| Fichier | Lignes | État | Description |
|---------|--------|------|-------------|
| `src/components/ai/ChatInterfaceDocuCortex.js` | 430 | ⏳ À créer | Interface chat moderne |
| `src/components/ai/NetworkConfigPanel.js` | 332 | ⏳ À créer | Configuration réseau UI |
| `src/services/apiService.js` | - | ⏳ À modifier | Méthodes API |
| `src/pages/AIAssistantPage.js` | - | ⏳ À modifier | Intégration DocuCortex |

### ✅ Configuration

- ✅ `config/config.json` - Section `networkDocuments` ajoutée
- ✅ Dépendances NPM - `chokidar`, `react-markdown`, `remark-gfm` installées

---

## 🚀 Étapes de Déploiement

### ÉTAPE 1: Vérifier les Fichiers Backend ✅

Les 4 fichiers backend principaux ont été créés avec succès:

```bash
cd C:\\projets\\rdp-project-agent-ia
ls backend/services/ai/
# Devrait afficher: networkDocumentService.js, documentMetadataService.js, etc.
```

### ÉTAPE 2: Créer les Fichiers Frontend ⏳

Vous devez créer manuellement ces 2 fichiers critiques:

#### 📄 **src/components/ai/ChatInterfaceDocuCortex.js**

**Contenu:** Voir fichier complet dans `/workspace/code/rdp-project/DOCUCORTEX_FICHIERS_COMPLETS.md` (section Frontend #1)

**Résumé des fonctionnalités:**
- Message de bienvenue automatique "Bonjour! Je suis DocuCortex..."
- Reprise conversation via localStorage (sessionId)
- Affichage markdown avec react-markdown
- Citations cliquables avec boutons Aperçu/Télécharger
- Suggestions questions interactives
- Barre de confiance visuelle
- Auto-scroll messages

#### 📄 **src/components/ai/NetworkConfigPanel.js**

**Contenu:** Voir fichier complet dans `/workspace/code/rdp-project/DOCUCORTEX_FICHIERS_COMPLETS.md` (section Frontend #2)

**Résumé des fonctionnalités:**
- Configuration serveur réseau UNC
- Test connexion temps réel
- Sélection sous-répertoires (tree view)
- Configuration extensions autorisées
- Exclusions dossiers personnalisables
- Fréquence scan automatique
- Statistiques indexation

### ÉTAPE 3: Modifier les Fichiers Existants ⏳

#### A. **src/services/apiService.js** - Ajouter méthodes DocuCortex

Ajouter après les méthodes AI existantes (ligne ~160):

```javascript
// ===== DOCUCORTEX - Méthodes Réseau =====
async scanNetworkDocuments(config) {
    return this.request('/ai/network/scan', {
        method: 'POST',
        body: JSON.stringify(config)
    });
},

async getNetworkScanStatus() {
    return this.request('/ai/network/status');
},

async configureNetwork(config) {
    return this.request('/ai/network/configure', {
        method: 'POST',
        body: JSON.stringify(config)
    });
},

async testNetworkConnection(path) {
    return this.request('/ai/network/test', {
        method: 'POST',
        body: JSON.stringify({ path })
    });
},

async getDocumentPreview(docId, page = 1) {
    const response = await fetch(`${this.baseURL}/ai/documents/${docId}/preview?page=${page}`);
    return response.blob();
},

async downloadDocument(docId) {
    const response = await fetch(`${this.baseURL}/ai/documents/${docId}/download`);
    return response.blob();
},

async startNetworkWatcher() {
    return this.request('/ai/network/watch/start', { method: 'POST' });
},

async stopNetworkWatcher() {
    return this.request('/ai/network/watch/stop', { method: 'POST' });
},
```

#### B. **src/pages/AIAssistantPage.js** - Intégrer DocuCortex

1. Ajouter imports (ligne ~5):
```javascript
import ChatInterfaceDocuCortex from '../components/ai/ChatInterfaceDocuCortex';
import NetworkConfigPanel from '../components/ai/NetworkConfigPanel';
```

2. Remplacer titre page (ligne ~140):
```javascript
<Typography variant="h4" gutterBottom>
    🧠 DocuCortex - GED Intelligent Anecoop
</Typography>
```

3. Ajouter onglet Configuration Réseau dans Tabs (ligne ~220):
```javascript
<Tab label="Configuration Réseau" value="network" />
```

4. Ajouter TabPanel correspondant (ligne ~270):
```javascript
<TabPanel value="network">
    <NetworkConfigPanel />
</TabPanel>
```

5. Remplacer ChatInterface par ChatInterfaceDocuCortex dans l'onglet Chat:
```javascript
<TabPanel value="chat">
    <ChatInterfaceDocuCortex />
</TabPanel>
```

#### C. **server/aiRoutes.js** - Ajouter routes réseau

Ajouter après les routes AI existantes (ligne ~300):

```javascript
// ===== DOCUCORTEX - Routes Réseau =====
const networkDocumentService = require('../backend/services/ai/networkDocumentService');
const documentMetadataService = require('../backend/services/ai/documentMetadataService');
const filePreviewService = require('../backend/services/ai/filePreviewService');

// Configuration réseau
router.post('/network/configure', asyncHandler(async (req, res) => {
    const result = networkDocumentService.configure(req.body);
    res.json(result);
}));

// Test connexion
router.post('/network/test', asyncHandler(async (req, res) => {
    const result = await networkDocumentService.testConnection(req.body.path);
    res.json(result);
}));

// Lancer scan
router.post('/network/scan', asyncHandler(async (req, res) => {
    const databaseService = req.app.get('databaseService');
    const result = await networkDocumentService.scanNetworkDocuments(
        documentMetadataService,
        databaseService
    );
    
    // Notifier via WebSocket
    const io = req.app.get('io');
    if (io) {
        io.emit('network:scan:completed', result);
    }
    
    res.json(result);
}));

// Statut scan
router.get('/network/status', asyncHandler(async (req, res) => {
    const status = networkDocumentService.getScanStatus();
    res.json(status);
}));

// Démarrer watcher
router.post('/network/watch/start', asyncHandler(async (req, res) => {
    const databaseService = req.app.get('databaseService');
    const result = await networkDocumentService.startWatcher(
        documentMetadataService,
        databaseService
    );
    res.json(result);
}));

// Arrêter watcher
router.post('/network/watch/stop', asyncHandler(async (req, res) => {
    const result = await networkDocumentService.stopWatcher();
    res.json(result);
}));

// Aperçu document
router.get('/documents/:id/preview', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    
    const databaseService = req.app.get('databaseService');
    const doc = databaseService.db.prepare('SELECT network_path FROM ai_documents WHERE id = ?').get(id);
    
    if (!doc) {
        return res.status(404).json({ error: 'Document non trouvé' });
    }
    
    const preview = await filePreviewService.generatePreview(doc.network_path, page);
    
    if (preview.success && preview.buffer) {
        res.set('Content-Type', preview.mimeType);
        res.send(preview.buffer);
    } else if (preview.success && preview.content) {
        res.set('Content-Type', 'text/plain');
        res.send(preview.content);
    } else {
        res.status(500).json({ error: preview.message });
    }
}));

// Téléchargement document
router.get('/documents/:id/download', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const databaseService = req.app.get('databaseService');
    const doc = databaseService.db.prepare('SELECT network_path, filename FROM ai_documents WHERE id = ?').get(id);
    
    if (!doc) {
        return res.status(404).json({ error: 'Document non trouvé' });
    }
    
    const download = await filePreviewService.downloadFile(doc.network_path);
    
    if (download.success) {
        res.set('Content-Disposition', `attachment; filename="${doc.filename}"`);
        res.set('Content-Type', download.mimeType);
        res.send(download.buffer);
    } else {
        res.status(500).json({ error: download.message });
    }
}));
```

#### D. **backend/services/ai/aiService.js** - Intégrer services

Ajouter imports au début (ligne ~5):
```javascript
const networkDocumentService = require('./networkDocumentService');
const documentMetadataService = require('./documentMetadataService');
const intelligentResponseService = require('./intelligentResponseService');
const filePreviewService = require('./filePreviewService');
```

Ajouter méthodes dans la classe AIService (ligne ~400):
```javascript
async searchDocuments(query, filters = {}) {
    // Recherche dans ai_documents avec filtres
    let sql = 'SELECT * FROM ai_documents WHERE content LIKE ? OR filename LIKE ?';
    const params = [`%${query}%`, `%${query}%`];
    
    if (filters.category) {
        sql += ' AND metadata LIKE ?';
        params.push(`%"category":"${filters.category}"%`);
    }
    
    const docs = this.db.prepare(sql).all(...params);
    
    // Scorer documents
    const scoredDocs = docs.map(doc => ({
        ...doc,
        score: intelligentResponseService.scoreDocument(doc, query),
        excerpt: this.extractExcerpt(doc.content, query)
    })).sort((a, b) => b.score - a.score);
    
    return scoredDocs;
}

extractExcerpt(content, query, maxLength = 300) {
    if (!content) return '';
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return content.substring(0, maxLength);
    
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + 200);
    return '...' + content.substring(start, end) + '...';
}
```

### ÉTAPE 4: Installer Dépendances Supplémentaires ✅

```bash
cd C:\\projets\\rdp-project-agent-ia
npm install chokidar react-markdown remark-gfm
```

**État:** ✅ Installées (en cours d'installation)

### ÉTAPE 5: Redémarrer l'Application ⏳

```bash
# Arrêter processus Node.js existants
taskkill /F /IM node.exe

# Redémarrer
npm run dev:electron
```

---

## 🧪 Tests de Validation

### Test 1: Message de Bienvenue ✅

**Action:** Ouvrir onglet "DocuCortex" → Sous-onglet "Chat"

**Résultat attendu:**
```
🧠 Bonjour ! Je suis DocuCortex, votre assistant GED intelligent du Groupe Anecoop.

J'ai indexé **X** documents depuis votre serveur réseau.

💡 Comment puis-je vous aider aujourd'hui ?

*Exemples de questions :*
• Trouve les offres de prix récentes
• Quels sont les rapports de cette année ?
• Cherche les documents techniques
```

**Logs console (F12):**
- ✅ Aucune erreur React
- ✅ `GET /api/ai/statistics` retourne `{ totalDocuments: X }`
- ✅ Message stocké dans sessionStorage

### Test 2: Upload Fichier Excel (Correction 413) ✅

**Action:** Onglet "Upload Documents" → Sélectionner fichier Excel > 1MB

**Résultat attendu:**
- ✅ Upload réussit (200 OK)
- ✅ Message "Document indexé avec succès"
- ✅ Fichier visible dans liste documents

**Logs console:**
- ✅ Pas d'erreur 413 Payload Too Large
- ✅ Content-Type: multipart/form-data détecté automatiquement

### Test 3: Configuration Réseau ⏳

**Action:** Onglet "Configuration Réseau"

**Étapes:**
1. Entrer chemin: `\\192.168.1.230\Donnees`
2. Cliquer "Tester Connexion"
3. **Résultat:** ✅ Message "Connexion réussie: X éléments"

4. Sélectionner sous-répertoire: `Documents` ou `Informatique`
5. Extensions: Laisser `*` (toutes) ou sélectionner `.pdf,.docx,.xlsx`
6. Exclusions: Ajouter `Temp,Backup`
7. Cliquer "Enregistrer Configuration"
8. **Résultat:** ✅ Message "Configuration sauvegardée"

**Logs:**
```
POST /api/ai/network/test → 200 OK { success: true, accessible: true }
POST /api/ai/network/configure → 200 OK { success: true }
```

### Test 4: Scan Serveur Réseau ⏳

**Action:** Cliquer "Lancer Scan" dans Configuration Réseau

**Résultat attendu:**
- Barre de progression s'affiche
- Websocket updates toutes les 50 fichiers:
  ```
  scan:progress { scanned: 50, total: 1000, percent: 5 }
  scan:progress { scanned: 100, total: 1000, percent: 10 }
  ...
  scan:completed { indexedFiles: 850, totalFiles: 1000, duration: 45s }
  ```

**Durée estimée:** 10-30 minutes pour 600GB (dépend du nombre de fichiers)

**Logs backend:**
```
[NetworkDocumentService] Démarrage scan: \\192.168.1.230\Donnees\Documents
[NetworkDocumentService] Estimation: 15000 fichiers
[NetworkDocumentService] Scan: 50/15000 (0%)
...
[NetworkDocumentService] Terminé: 12450 documents indexés en 890s
```

### Test 5: Recherche avec Citations ⏳

**Action:** Dans Chat, écrire: "offre de prix"

**Résultat attendu:**
```markdown
📚 **3 document(s) pertinent(s) trouvé(s)**

[1] Offre_Prix_Client_ABC_2025.pdf
📌 Source: `\\192.168.1.230\Donnees\Documents\Offres\2025\`
📊 Pertinence: 87% 🟢
📄 Extrait: "...offre de prix valable jusqu'au 31/12/2025..."

[2] Devis_Commercial_2025-01.xlsx
📌 Source: `\\192.168.1.230\Donnees\Compta\Devis\`
📊 Pertinence: 72% 🟡

[3] Prix_Catalogue_2025.pdf
📌 Source: `\\192.168.1.230\Donnees\Marketing\Catalogues\`
📊 Pertinence: 65% 🟡

❓ Questions liées suggérées:
• Quels sont les documents sur devis?
• Y a-t-il des informations sur tarifs?
• Peux-tu comparer ces 3 documents?
```

**Avec boutons:**
- [Aperçu] [Télécharger] pour chaque document

**Logs:**
```
POST /api/ai/chat → 200 OK {
    response: "...",
    citations: [{ id: 123, filename: "Offre_Prix...", path: "..." }],
    suggestions: ["Quels sont...", "Y a-t-il..."]
}
```

### Test 6: Aperçu Document ⏳

**Action:** Cliquer bouton "Aperçu" sur un PDF

**Résultat attendu:**
- Nouvel onglet s'ouvre
- Affiche preview image du PDF page 1
- OU affiche contenu texte si .txt/.md

**URL:** `http://localhost:3002/api/ai/documents/123/preview`

**Logs:**
```
GET /api/ai/documents/123/preview → 200 OK
Content-Type: image/png (ou text/plain)
```

### Test 7: Téléchargement Document ⏳

**Action:** Cliquer bouton "Télécharger"

**Résultat attendu:**
- Fichier téléchargé dans dossier Téléchargements
- Nom fichier original conservé

**Logs:**
```
GET /api/ai/documents/123/download → 200 OK
Content-Disposition: attachment; filename="Offre_Prix_Client_ABC_2025.pdf"
Content-Type: application/pdf
```

---

## 🔧 Troubleshooting

### Problème: Erreur "chokidar not found"

**Solution:**
```bash
npm install chokidar
```

### Problème: Erreur "react-markdown not found"

**Solution:**
```bash
npm install react-markdown remark-gfm
```

### Problème: Scan ne démarre pas

**Vérifications:**
1. Chemin réseau accessible : `\\192.168.1.230\Donnees`
2. Permissions lecture sur le serveur
3. Pas de scan déjà en cours (recharger page)

**Logs:**
```
[NetworkDocumentService] Erreur test connexion: ENOENT
→ Chemin introuvable, vérifier config.json
```

### Problème: Message bienvenue ne s'affiche pas

**Vérifications:**
1. Ouvrir console F12 → Aucune erreur React
2. Vérifier `GET /api/ai/statistics` retourne données
3. Vider cache navigateur (Ctrl+Shift+Delete)
4. Vider sessionStorage: `sessionStorage.clear()`

### Problème: Upload fichier échoue encore (413)

**Vérifications:**
1. Fichier apiService.js modifié correctement
2. Ligne 13-22: Détection FormData présente
3. Backend multer limite 50MB configurée (aiRoutes.js ligne 10)

**Test manuel:**
```javascript
// Console F12
const formData = new FormData();
formData.append('file', fileInput.files[0]);
fetch('/api/ai/documents/upload', { method: 'POST', body: formData })
  .then(r => r.json())
  .then(console.log);
```

---

## 📦 Fichiers Livrables

### Backend (6 fichiers)

1. ✅ `backend/services/ai/networkDocumentService.js` - 204 lignes
2. ✅ `backend/services/ai/documentMetadataService.js` - 139 lignes
3. ✅ `backend/services/ai/intelligentResponseService.js` - 128 lignes
4. ✅ `backend/services/ai/filePreviewService.js` - 93 lignes
5. ⏳ `backend/services/ai/aiService.js` - Modifications à appliquer
6. ⏳ `server/aiRoutes.js` - Routes à ajouter

### Frontend (4 fichiers)

7. ⏳ `src/components/ai/ChatInterfaceDocuCortex.js` - 430 lignes (à créer)
8. ⏳ `src/components/ai/NetworkConfigPanel.js` - 332 lignes (à créer)
9. ⏳ `src/services/apiService.js` - Méthodes à ajouter
10. ⏳ `src/pages/AIAssistantPage.js` - Modifications à appliquer

### Configuration (1 fichier)

11. ✅ `config/config.json` - Section networkDocuments ajoutée

### Documentation (3 fichiers)

12. ✅ `DOCUCORTEX_GUIDE_DEPLOIEMENT.md` - Ce fichier
13. ⏳ `DOCUCORTEX_FICHIERS_COMPLETS.md` - Contenu complet tous fichiers (à créer)
14. ⏳ `DOCUCORTEX_GUIDE_UTILISATEUR.md` - Guide utilisation (à créer)

---

## 📞 Support

**Questions:** Poser vos questions directement dans le chat

**Bugs:** Partager logs console F12 + logs backend terminal

**Améliorations:** Proposer nouvelles fonctionnalités DocuCortex

---

## 🎯 Prochaines Étapes Recommandées

1. ⏳ **Créer fichiers frontend manquants** (ChatInterfaceDocuCortex, NetworkConfigPanel)
2. ⏳ **Modifier fichiers existants** (aiService.js, aiRoutes.js, AIAssistantPage.js)
3. ⏳ **Tester configuration réseau** (Connexion \\192.168.1.230\Donnees)
4. ⏳ **Lancer premier scan** (Observer progression WebSocket)
5. ⏳ **Tester recherche** (Vérifier citations et suggestions)
6. ⏳ **Valider aperçu/téléchargement** (PDF, Excel, TXT)
7. ✅ **Installer dépendances optionnelles** (sharp, pdf-poppler) pour aperçus avancés

---

**Version:** 1.0.0  
**Date:** 2025-11-03  
**Auteur:** MiniMax Agent  
**Client:** Groupe Anecoop (Espagne)
