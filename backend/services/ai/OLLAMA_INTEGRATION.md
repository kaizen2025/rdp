# Service Ollama pour DocuCortex

## Vue d'ensemble

Le service Ollama permet l'intégration d'un modèle IA local (Llama 3.2 3B) dans DocuCortex pour offrir des fonctionnalités avancées d'analyse de texte, chat intelligent, et traitement de documents.

## Fonctionnalités

### 🤖 Chat Intelligent
- Conversation contextuelle avec Ollama
- Support multi-modèles
- Intégration avec la recherche vectorielle
- Historique de conversation

### 📊 Analyse de Texte
- **Sentiment Analysis** : Analyse du sentiment des textes
- **Résumé Intelligent** : Résumés automatiques de documents
- **Extraction de Mots-clés** : Identification automatique des concepts importants
- **Traduction** : Support multilingue

### ❓ Q&A sur Documents
- Questions-réponses sur les documents indexés
- Contexte intelligent basé sur le contenu
- Réponses avec citations et références

## Installation

### 1. Installation d'Ollama

```bash
# Installer Ollama (Linux/macOS)
curl -fsSL https://ollama.ai/install.sh | sh

# Sur Windows, télécharger depuis https://ollama.ai

# Vérifier l'installation
ollama --version
```

### 2. Installation du modèle Llama 3.2 3B

```bash
# Télécharger le modèle
ollama pull llama3.2:3b

# Vérifier les modèles disponibles
ollama list
```

### 3. Configuration DocuCortex

Le service s'intègre automatiquement dans DocuCortex. Les endpoints suivants sont disponibles :

## API Endpoints

### Statut et Configuration

#### `GET /ai/ollama/status`
Vérifie le statut du service Ollama et DocuCortex IA.

```json
{
  "success": true,
  "aiService": {
    "success": true,
    "provider": "ollama",
    "ollamaAvailable": true
  },
  "ollama": {
    "enabled": true,
    "provider": "ollama",
    "model": {
      "name": "llama3.2:3b",
      "available": true
    },
    "stats": {
      "totalRequests": 0,
      "successRate": "0%"
    }
  }
}
```

#### `GET /ai/ollama/models`
Liste les modèles Ollama disponibles.

#### `POST /ai/ollama/model`
Change le modèle actif.

```json
{
  "modelName": "llama3.2:3b"
}
```

### Chat et Conversation

#### `POST /ai/chat/enhanced`
Chat amélioré avec support Ollama.

```json
{
  "message": "Bonjour, comment allez-vous ?",
  "sessionId": "session123",
  "userId": "user456",
  "aiProvider": "ollama" // ou "default"
}
```

#### `POST /ai/ollama/chat`
Chat direct avec Ollama (mode expert).

```json
{
  "message": "Explique-moi l'intelligence artificielle",
  "systemPrompt": "Tu es un expert en IA",
  "temperature": 0.7,
  "maxTokens": 512
}
```

### Analyse de Contenu

#### `POST /ai/ollama/sentiment`
Analyse le sentiment d'un texte.

```json
{
  "text": "Je suis très satisfait de ce produit"
}
```

#### `POST /ai/ollama/summarize`
Génère un résumé d'un texte.

```json
{
  "text": "Texte à résumer...",
  "maxLength": 200
}
```

#### `POST /ai/ollama/keywords`
Extrait les mots-clés d'un texte.

```json
{
  "text": "Texte pour extraction...",
  "maxKeywords": 10
}
```

#### `POST /ai/ollama/translate`
Traduit un texte.

```json
{
  "text": "Hello, how are you?",
  "targetLanguage": "français"
}
```

### Questions-Réponses

#### `POST /ai/ollama/qa`
Pose une question sur un document.

```json
{
  "documentId": 123,
  "question": "Quel est le sujet principal de ce document ?"
}
```

### Statistiques et Monitoring

#### `GET /ai/ollama/stats`
Statistiques complètes du service.

#### `GET /ai/ollama/test`
Test de connexion à Ollama.

#### `POST /ai/ollama/reset-stats`
Remet à zéro les statistiques.

## Configuration

### Variables d'Environnement

```bash
# Port Ollama (défaut: 11434)
OLLAMA_HOST=http://localhost:11434

# Modèle par défaut (défaut: llama3.2:3b)
OLLAMA_MODEL=llama3.2:3b
```

### Paramètres de Modèle

Les paramètres suivants peuvent être ajustés :

- **temperature** : Créativité des réponses (0.1-1.0)
- **top_p** : Diversité du vocabulaire (0.1-1.0)
- **top_k** : Nombre de choix pour chaque token
- **maxTokens** : Longueur maximale des réponses
- **stop** : Séquences d'arrêt personnalisées

## Utilisation Programmatée

### JavaScript/Node.js

```javascript
const aiService = require('./backend/services/ai/aiService');

// Chat avec Ollama
const chatResult = await aiService.processQuery(
    'session123',
    'Explique-moi les réseaux de neurones',
    'user456',
    { aiProvider: 'ollama' }
);

// Analyse de sentiment
const sentiment = await aiService.analyzeSentiment(
    'Ce produit est excellent !'
);

// Résumé de document
const summary = await aiService.summarizeText(
    documentContent,
    150 // 150 caractères max
);

// Q&A sur document
const qaResult = await aiService.answerQuestion(
    documentId,
    'Quel est le prix mentionné dans ce document ?'
);
```

### cURL Examples

```bash
# Test de connexion
curl -X GET http://localhost:3000/api/ai/ollama/test

# Chat avec Ollama
curl -X POST http://localhost:3000/api/ai/ollama/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour, peux-tu m'aider avec DocuCortex ?",
    "temperature": 0.7
  }'

# Analyse de sentiment
curl -X POST http://localhost:3000/api/ai/ollama/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Je suis très content de ce service"}'

# Q&A sur document
curl -X POST http://localhost:3000/api/ai/ollama/qa \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": 123,
    "question": "Résume ce document en 3 points"
  }'
```

## Monitoring et Debugging

### Logs

Le service génère des logs détaillés :

```
🤖 Service Ollama intégré avec succès
🤖 Traitement avec Ollama...
✅ Connexion Ollama OK (245ms)
✅ Réponse Ollama générée (1250ms, 45 tokens)
💭 Analyse sentiment: positif (87%)
📝 Résumé généré: 75% de compression
```

### Statistiques Disponibles

- Nombre total de requêtes
- Taux de succès
- Temps de réponse moyen
- Nombre de tokens générés
- Statut de connexion
- Modèles disponibles

### Dépannage

#### Ollama non disponible
```bash
# Vérifier qu'Ollama fonctionne
curl http://localhost:11434/api/tags

# Redémarrer Ollama
ollama serve &
```

#### Modèle non trouvé
```bash
# Télécharger le modèle requis
ollama pull llama3.2:3b

# Vérifier la liste des modèles
ollama list
```

#### Erreurs de connexion
- Vérifier que Ollama est démarré : `ollama serve`
- Vérifier le port (défaut: 11434)
- Vérifier les variables d'environnement

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   DocuCortex     │    │     Ollama      │
│   (React)       │◄──►│   Backend        │◄──►│   (Local AI)    │
│                 │    │   aiService.js   │    │                 │
│                 │    │   ollamaService  │    │  llama3.2:3b    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │              ┌──────────────────┐
         │              │   Vector Search  │
         │              │   Database       │
         │              └──────────────────┘
         ▼
┌─────────────────┐
│   WebSocket     │
│   (Real-time)   │
└─────────────────┘
```

## Limitations

- **RAM** : Llama 3.2 3B nécessite ~2GB RAM
- **CPU** : Processeur multi-cœurs recommandé
- **Stockage** : ~2GB pour le modèle
- **Latence** : 1-5 secondes selon la complexité
- **Contexte** : Limité à ~128k tokens

## Sécurité

- Communication locale uniquement
- Pas de données envoyées vers des services externes
- Modèles et données restent sur la machine locale
- Validation des entrées utilisateur
- Gestion d'erreurs robuste

## Contribution

Pour contribuer au service Ollama :

1. Fork le projet
2. Créer une branche feature
3. Modifier les services dans `backend/services/ai/`
4. Ajouter les tests appropriés
5. Soumettre une Pull Request

## Licence

Ce service fait partie de DocuCortex et suit la même licence.