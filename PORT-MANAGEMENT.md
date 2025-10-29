# 🔧 Gestion Automatique des Ports

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnement](#fonctionnement)
- [Configuration des plages](#configuration-des-plages)
- [Architecture](#architecture)
- [Fichiers générés](#fichiers-générés)
- [Commandes npm](#commandes-npm)
- [Dépannage](#dépannage)

---

## Vue d'ensemble

Le système de gestion automatique des ports résout le problème des ports occupés lors du démarrage de l'application. Au lieu d'utiliser des ports fixes, l'application détecte automatiquement les ports disponibles dans des plages configurables.

### ✨ Avantages

- ✅ **Pas de conflit de ports** : Si un port est occupé, le suivant est testé automatiquement
- ✅ **Démarrage rapide** : Plus besoin de tuer manuellement les processus
- ✅ **Configuration automatique** : React se configure automatiquement pour pointer vers le bon serveur
- ✅ **Transparent** : Fonctionne sans intervention de l'utilisateur
- ✅ **Plages configurables** : Chaque service a sa propre plage de ports

---

## Fonctionnement

### 🔄 Séquence de Démarrage

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Démarrage de npm run test:app                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ├── SERVEUR (Backend)
             │   ├─> Allocation des ports (3002-3012, 3003-3013)
             │   ├─> Sauvegarde dans .ports.json
             │   ├─> Démarrage HTTP Server
             │   └─> Démarrage WebSocket
             │
             └── REACT (Frontend)
                 ├─> Attente du fichier .ports.json (max 30s)
                 ├─> Lecture des ports du serveur
                 ├─> Recherche d'un port disponible (3000-3010)
                 ├─> Création de .env.local avec la config
                 └─> Démarrage de react-scripts
```

### 📊 Plages de Ports par Défaut

| Service        | Plage       | Port Préféré | Description                |
|----------------|-------------|--------------|----------------------------|
| **HTTP Server**| 3002-3012   | 3002         | API Backend Express        |
| **WebSocket**  | 3003-3013   | 3003         | Temps réel (WebSocket)     |
| **React Dev**  | 3000-3010   | 3000         | Serveur de développement   |

### 🎯 Stratégie d'Allocation

1. **Test séquentiel** : Les ports sont testés un par un dans l'ordre croissant
2. **Premier disponible** : Le premier port disponible dans la plage est utilisé
3. **Fallback** : Si aucun port n'est disponible, une erreur est levée

---

## Configuration des Plages

### Modifier les Plages de Ports

#### Backend (server/server.js)

```javascript
const ports = await findAllPorts({
    http: {
        start: 3002,  // Port de départ
        end: 3012,    // Port de fin (inclus)
        name: 'HTTP Server'
    },
    websocket: {
        start: 3003,
        end: 3013,
        name: 'WebSocket'
    }
});
```

#### Frontend (scripts/start-react.js)

```javascript
async function findReactPort() {
    console.log('🔍 Recherche d\'un port disponible pour React...');

    // Modifier cette plage
    for (let port = 3000; port <= 3010; port++) {
        const { isPortAvailable } = require('../backend/utils/portUtils');
        if (await isPortAvailable(port)) {
            console.log(`✅ Port React: ${port}\n`);
            return port;
        }
    }

    throw new Error('Aucun port disponible dans la plage 3000-3010');
}
```

---

## Architecture

### 📁 Structure des Fichiers

```
rdp/
├── backend/
│   └── utils/
│       └── portUtils.js              # Utilitaire de gestion des ports
├── scripts/
│   └── start-react.js                # Script de démarrage React
├── server/
│   └── server.js                     # Serveur backend (modifié)
├── .ports.json                       # Fichier généré (ignoré par git)
├── .env.local                        # Config React générée (ignoré par git)
└── PORT-MANAGEMENT.md                # Cette documentation
```

### 🛠️ Modules Clés

#### 1. `backend/utils/portUtils.js`

Utilitaire principal avec les fonctions :

- `isPortAvailable(port)` : Teste si un port est disponible
- `findAvailablePort(start, end, name)` : Trouve un port disponible dans une plage
- `findAllPorts(config)` : Trouve tous les ports nécessaires
- `savePorts(ports, file)` : Sauvegarde les ports dans un fichier JSON
- `loadPorts(file)` : Charge les ports depuis un fichier JSON

#### 2. `scripts/start-react.js`

Script Node.js qui :

1. Attend le démarrage du serveur backend (max 30s)
2. Lit le fichier `.ports.json` créé par le serveur
3. Trouve un port disponible pour React (3000-3010)
4. Crée le fichier `.env.local` avec la configuration
5. Lance `react-scripts start` avec les bonnes variables d'environnement

#### 3. `server/server.js` (modifié)

Le serveur a été modifié pour :

- Allouer automatiquement les ports au démarrage
- Sauvegarder les ports dans `.ports.json`
- Initialiser WebSocket avec le port alloué
- Accepter les connexions CORS de tous les ports React possibles (3000-3010)

---

## Fichiers Générés

### `.ports.json`

Créé automatiquement par le serveur au démarrage.

```json
{
  "http": 3002,
  "websocket": 3003,
  "timestamp": "2025-10-28T10:30:45.123Z",
  "pid": 12345
}
```

| Champ       | Description                                    |
|-------------|------------------------------------------------|
| `http`      | Port du serveur HTTP (Express)                 |
| `websocket` | Port du serveur WebSocket                      |
| `timestamp` | Date/heure de création                         |
| `pid`       | Process ID du serveur                          |

⚠️ **Important** : Ce fichier est **généré automatiquement** et ne doit **pas être modifié manuellement**.

### `.env.local`

Créé automatiquement par `start-react.js`.

```env
# Configuration générée automatiquement par start-react.js
# Ne pas modifier manuellement - Ce fichier est écrasé à chaque démarrage

# Port pour le serveur de développement React
PORT=3000

# URL du serveur backend
REACT_APP_API_URL=http://localhost:3002

# URL du WebSocket
REACT_APP_WS_URL=ws://localhost:3003

# N'ouvre pas automatiquement le navigateur
BROWSER=none

# Génération de source maps rapide pour le dev
GENERATE_SOURCEMAP=true
```

⚠️ **Important** : Ce fichier est **écrasé à chaque démarrage**. Pour des modifications permanentes, utilisez `.env`.

---

## Commandes npm

### 🚀 Commandes Principales

```bash
# Démarrer l'application (serveur + React avec allocation automatique)
npm run test:app

# Version simple sans couleurs
npm run test:app:simple

# Démarrer uniquement le serveur
npm run server:start

# Démarrer uniquement React avec allocation automatique
npm run start:auto

# Démarrer React normalement (sans allocation auto)
npm start

# Nettoyer tous les fichiers générés (.ports.json, .env.local, etc.)
npm run clean
```

### 📝 Description des Commandes

| Commande              | Description                                           | Ports Auto |
|-----------------------|-------------------------------------------------------|------------|
| `test:app`            | Lance serveur + React avec couleurs                   | ✅         |
| `test:app:simple`     | Lance serveur + React sans couleurs                   | ✅         |
| `server:start`        | Lance uniquement le serveur backend                   | ✅         |
| `start:auto`          | Lance React avec détection automatique des ports      | ✅         |
| `start`               | Lance React normalement (port 3000 fixe)              | ❌         |
| `clean`               | Nettoie build, dist, cache et fichiers générés        | N/A        |

---

## Dépannage

### 🐛 Problèmes Courants

#### 1. "Aucun port disponible dans la plage"

**Symptôme** :
```
❌ Aucun port disponible dans la plage 3002-3012 pour HTTP Server
```

**Solutions** :
```bash
# Vérifier les ports occupés (Windows)
netstat -ano | findstr "300"

# Tuer tous les processus Node.js
taskkill /IM node.exe /F

# Ou élargir la plage dans server.js
const ports = await findAllPorts({
    http: { start: 3002, end: 3022, name: 'HTTP Server' },  // +10 ports
    // ...
});
```

#### 2. "Timeout - Le serveur backend n'a pas créé le fichier de ports"

**Symptôme** :
```
⚠️  Timeout - Le serveur backend n'a pas créé le fichier de ports
   Utilisation des ports par défaut
```

**Cause** : Le serveur a mis plus de 30 secondes à démarrer

**Solutions** :
```bash
# 1. Vérifier que le serveur démarre sans erreur
npm run server:start

# 2. Augmenter le timeout dans scripts/start-react.js
const MAX_WAIT = 60000; // 60 secondes au lieu de 30
```

#### 3. "Error: The module '...\better-sqlite3.node' was compiled against..."

**Symptôme** :
```
❌ Error: The module 'better-sqlite3.node' was compiled against a different Node.js version
```

**Solution** :
```bash
# Recompiler better-sqlite3 pour votre version de Node.js
npm rebuild better-sqlite3
```

#### 4. React ne se connecte pas au bon serveur

**Symptôme** : Erreurs CORS ou API non disponible

**Solutions** :
```bash
# 1. Vérifier que .env.local existe et contient les bons ports
cat .env.local  # Linux/Mac
type .env.local # Windows

# 2. Vérifier que .ports.json existe
cat .ports.json  # Linux/Mac
type .ports.json # Windows

# 3. Nettoyer et redémarrer
npm run clean
npm run test:app
```

#### 5. Le serveur démarre mais React ne démarre pas

**Solutions** :
```bash
# 1. Vérifier les logs de React dans la console

# 2. Tester manuellement le script
node scripts/start-react.js

# 3. Utiliser la commande simple
npm run start:auto
```

### 🔍 Debug Mode

Pour obtenir plus d'informations de débogage :

```javascript
// Dans scripts/start-react.js, ajouter :
console.log('DEBUG: Ports lus:', ports);
console.log('DEBUG: Port React choisi:', reactPort);
console.log('DEBUG: Contenu de .env.local:', fs.readFileSync(ENV_FILE, 'utf8'));
```

### 📊 Vérification de l'État

```bash
# Vérifier les ports occupés (Windows)
netstat -ano | findstr ":3000 :3001 :3002 :3003"

# Vérifier les processus Node.js
tasklist | findstr "node.exe"

# Tuer un processus spécifique (Windows)
taskkill /PID <pid> /F

# Nettoyer complètement
npm run clean
taskkill /IM node.exe /F
npm run test:app
```

---

## 🎓 Bonnes Pratiques

### ✅ Recommandations

1. **Utiliser `test:app`** : Toujours utiliser `npm run test:app` pour démarrer l'application
2. **Ne pas modifier les fichiers générés** : `.ports.json` et `.env.local` sont écrasés automatiquement
3. **Nettoyer régulièrement** : Exécuter `npm run clean` si des problèmes surviennent
4. **Ports réservés** : Éviter d'utiliser les plages 3000-3013 pour d'autres applications
5. **Logs** : Toujours vérifier les logs en cas de problème

### ❌ À Éviter

1. Ne pas démarrer React avant le serveur (le script attend mais avec un timeout)
2. Ne pas modifier manuellement `.ports.json` ou `.env.local`
3. Ne pas utiliser des plages de ports qui se chevauchent
4. Ne pas ignorer les warnings dans les logs

---

## 📚 Références

### Fichiers Modifiés

- ✏️ `server/server.js` : Allocation automatique des ports
- ✏️ `package.json` : Nouvelles commandes npm
- ✏️ `.gitignore` : Ajout de `.ports.json`

### Fichiers Créés

- ✨ `backend/utils/portUtils.js` : Utilitaire de gestion des ports
- ✨ `scripts/start-react.js` : Script de démarrage React intelligent
- ✨ `PORT-MANAGEMENT.md` : Cette documentation

### Dépendances Utilisées

- `net` (Node.js built-in) : Test de disponibilité des ports
- `fs` (Node.js built-in) : Lecture/écriture des fichiers
- `child_process` (Node.js built-in) : Lancement de react-scripts

---

## 🤝 Support

En cas de problème non résolu par cette documentation :

1. Vérifier les logs complets dans la console
2. Exécuter `npm run clean` puis `npm run test:app`
3. Vérifier que tous les fichiers ont été mis à jour correctement
4. Consulter les issues GitHub du projet

---

**Version** : 1.0.0
**Dernière mise à jour** : 28 octobre 2025
**Auteur** : Anecoop IT Team avec Claude Code
