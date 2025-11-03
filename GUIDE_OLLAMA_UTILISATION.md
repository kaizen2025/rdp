# Guide d'utilisation : Service Ollama pour DocuCortex

## 🎯 Objectif

Ce guide explique comment utiliser le service d'intégration Ollama dans DocuCortex pour bénéficier des capacités de l'IA locale avec le modèle Llama 3.2 3B.

## 📋 Table des matières

1. [Installation](#installation)
2. [Démarrage](#démarrage)
3. [Utilisation](#utilisation)
4. [API Endpoints](#api-endpoints)
5. [Dépannage](#dépannage)

## 🚀 Installation

### Option 1 : Installation Automatique (Recommandée)

```bash
# Cloner ou naviguer vers le répertoire DocuCortex
cd docucortex_corrige

# Installer automatiquement Ollama et le modèle
npm run install:ollama
```

### Option 2 : Installation Manuelle

1. **Installer Ollama**
   ```bash
   # Linux/macOS
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows : Télécharger depuis https://ollama.ai
   ```

2. **Démarrer Ollama**
   ```bash
   ollama serve
   ```

3. **Installer le modèle Llama 3.2 3B**
   ```bash
   ollama pull llama3.2:3b
   ```

4. **Vérifier l'installation**
   ```bash
   npm run ollama:status
   ```

## 🏁 Démarrage

### Démarrage avec Support Ollama

```bash
# Démarrage automatique avec détection Ollama
npm run start:ollama
```

Ce script va :
- ✅ Vérifier l'environnement
- ✅ Détecter Ollama
- ✅ Configurer DocuCortex
- ✅ Démarrer le serveur

### Démarrage Standard

```bash
# Démarrage normal (Ollama détecté automatiquement)
npm run dev
```

## 📚 Utilisation

### 1. Chat Intelligent

**Interface Web**
- Ouvrez DocuCortex dans votre navigateur
- Accédez à la section Chat IA
- Les réponses seront générées par Ollama si disponible

**API Directe**
```bash
# Chat avec Ollama
curl -X POST http://localhost:3000/api/ai/chat/enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explique-moi DocuCortex",
    "sessionId": "demo-session",
    "aiProvider": "ollama"
  }'
```

### 2. Analyse de Documents

**Résumé automatique**
```bash
curl -X POST http://localhost:3000/api/ai/ollama/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Votre texte ici...",
    "maxLength": 200
  }'
```

**Extraction de mots-clés**
```bash
curl -X POST http://localhost:3000/api/ai/ollama/keywords \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Votre texte ici...",
    "maxKeywords": 10
  }'
```

**Analyse de sentiment**
```bash
curl -X POST http://localhost:3000/api/ai/ollama/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Je suis très satisfait de ce produit"}'
```

### 3. Questions-Réponses

**Q&A sur document**
```bash
curl -X POST http://localhost:3000/api/ai/ollama/qa \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": 123,
    "question": "Quel est le prix mentionné ?"
  }'
```

### 4. Traduction

```bash
curl -X POST http://localhost:3000/api/ai/ollama/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "targetLanguage": "français"
  }'
```

## 🔌 API Endpoints

### Status et Configuration

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ai/ollama/status` | GET | Statut du service Ollama |
| `/api/ai/ollama/models` | GET | Liste des modèles disponibles |
| `/api/ai/ollama/test` | GET | Test de connexion |
| `/api/ai/ollama/stats` | GET | Statistiques d'utilisation |

### Chat et Conversation

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ai/chat/enhanced` | POST | Chat avec support Ollama |
| `/api/ai/ollama/chat` | POST | Chat direct Ollama |

### Analyse de Contenu

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ai/ollama/sentiment` | POST | Analyse de sentiment |
| `/api/ai/ollama/summarize` | POST | Résumé de texte |
| `/api/ai/ollama/keywords` | POST | Extraction de mots-clés |
| `/api/ai/ollama/translate` | POST | Traduction |

### Questions-Réponses

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ai/ollama/qa` | POST | Q&A sur document |

### Administration

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ai/ollama/model` | POST | Changer de modèle |
| `/api/ai/ollama/reset-stats` | POST | Reset des statistiques |

## 💡 Exemples Pratiques

### Exemple 1 : Chat Contextuel

```javascript
// JavaScript - Chat avec historique
const response = await fetch('/api/ai/chat/enhanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Peux-tu me résumer le document sur les ventes ?",
    sessionId: "user-session-123",
    aiProvider: "ollama"
  })
});

const result = await response.json();
console.log('Réponse:', result.response);
console.log('Confiance:', result.confidence);
console.log('Fournisseur IA:', result.aiProvider);
```

### Exemple 2 : Analyse de Sentiment en Lot

```javascript
// JavaScript - Analyse multiple
const texts = [
  "Ce produit est excellent !",
  "Je ne suis pas satisfait",
  "Service correct, pourrait être amélioré"
];

for (const text of texts) {
  const response = await fetch('/api/ai/ollama/sentiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  const result = await response.json();
  console.log(`"${text}" → ${result.sentiment} (${result.confidence})`);
}
```

### Exemple 3 : Workflow Document Complet

```javascript
// JavaScript - Traitement complet d'un document
async function processDocument(documentId, content) {
  // 1. Résumé
  const summary = await fetch('/api/ai/ollama/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: content, maxLength: 150 })
  });
  
  // 2. Mots-clés
  const keywords = await fetch('/api/ai/ollama/keywords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: content, maxKeywords: 8 })
  });
  
  // 3. Sentiment
  const sentiment = await fetch('/api/ai/ollama/sentiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: content.substring(0, 500) })
  });
  
  return {
    summary: (await summary.json()).summary,
    keywords: (await keywords.json()).keywords,
    sentiment: (await sentiment.json()).sentiment
  };
}
```

## 🔍 Dépannage

### Problèmes Courants

**1. Ollama non détecté**
```bash
# Vérifier l'installation
ollama --version

# Réinstaller si nécessaire
npm run install:ollama
```

**2. Ollama ne répond pas**
```bash
# Vérifier le statut
npm run ollama:status

# Redémarrer Ollama
npm run ollama:stop
ollama serve

# Tester la connexion
npm run ollama:test
```

**3. Modèle non disponible**
```bash
# Télécharger le modèle
ollama pull llama3.2:3b

# Vérifier les modèles
ollama list
```

**4. Erreur de port**
```bash
# Vérifier les processus sur le port 11434
lsof -i :11434

# Sur Windows
netstat -ano | findstr :11434
```

### Logs et Debug

**Activer les logs détaillés**
```bash
DEBUG=* npm run start:ollama
```

**Logs Ollama**
```bash
npm run ollama:logs
```

**Test de connectivité**
```bash
# Test Ollama direct
curl http://localhost:11434/api/tags

# Test via DocuCortex
curl http://localhost:3000/api/ai/ollama/test
```

### Performance

**Optimisation**
- Ollama nécessite au moins 4GB RAM
- Le modèle Llama 3.2 3B utilise ~2GB
- SSD recommandé pour de meilleures performances

**Monitoring**
```bash
# Statistiques DocuCortex
curl http://localhost:3000/api/ai/ollama/stats

# Statistiques système (Linux/macOS)
top -p $(pgrep ollama)
```

## 📊 Monitoring

### Interface Web

Accédez à http://localhost:3000/api/ai/ollama/stats pour voir :
- ✅ Nombre de requêtes
- ✅ Taux de succès
- ✅ Temps de réponse moyen
- ✅ Utilisation des tokens

### Commandes Utiles

```bash
# Status complet
npm run start:ollama

# Statistiques
curl -s http://localhost:3000/api/ai/ollama/stats | jq

# Modèles disponibles
curl -s http://localhost:11434/api/tags | jq '.models[].name'

# Monitoring temps réel
watch -n 5 'curl -s http://localhost:3000/api/ai/ollama/stats | jq .stats'
```

## 🔒 Sécurité

- Communication locale uniquement (pas d'envoi vers le cloud)
- Validation des entrées utilisateur
- Gestion d'erreurs robuste
- Pas de stockage de données sensibles

## 🎓 Conclusion

Le service Ollama offre une alternative potente et privée aux services cloud d'IA. Avec DocuCortex, vous disposez d'un assistant intelligent local capable de :

- ✅ Chat contextuel intelligent
- ✅ Analyse de documents avancée
- ✅ Traitement de texte multilingue
- ✅ Q&A sur vos documents
- ✅ Toutes vos données restent locales

Pour toute question ou problème, consultez les logs ou utilisez les endpoints de diagnostic fournis.

---

**Version** : 1.0  
**Compatibilité** : DocuCortex v3.0+  
**Dépendances** : Node.js 16+, Ollama, Llama 3.2 3B