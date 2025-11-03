# Analyse Database et Services Externes

**Date**: 2025-11-02  
**Version**: 3.0.26  
**Analysé par**: Claude Code

---

## 📊 Vue d'Ensemble

L'application RDS Viewer utilise une architecture hybride combinant:
- **SQLite** pour la persistance locale des données métier
- **Active Directory** via PowerShell pour la gestion des utilisateurs
- **Excel** pour la synchronisation des données utilisateurs
- **WebSocket** pour la communication temps réel

---

## 1. 💾 SQLite Database (databaseService.js)

### 1.1 Structure des Tables

**⚠️ PROBLÈME CRITIQUE**: Incohérence entre `initdb.sql` et la réalité

Le fichier `initdb.sql` à la racine contient un **schéma PostgreSQL pour Guacamole** (737 lignes), mais l'application utilise **SQLite avec un schéma défini dans le code** (databaseService.js ligne 10-23).

#### Tables réellement utilisées (SQLite):

```sql
-- Tables principales
computers (16 colonnes) - Inventaire matériel
loans (18 colonnes) - Gestion des prêts
loan_history (10 colonnes) - Historique des prêts
accessories (8 colonnes) - Accessoires disponibles
loan_notifications (9 colonnes) - Notifications

-- Tables de communication
chat_channels (5 colonnes) - Canaux de discussion
chat_messages (9 colonnes) - Messages

-- Tables système
technician_presence (8 colonnes) - Présence techniciens
rds_sessions (10 colonnes) - Sessions RDS
users (16 colonnes) - Utilisateurs synchronisés
key_value_store (2 colonnes) - Configuration
```

**🔴 PROBLÈMES IDENTIFIÉS**:

1. **Documentation trompeuse**: `initdb.sql` ne correspond pas à la base réelle
2. **Absence de versioning**: Pas de système de migration de schéma formel
3. **Schéma en dur**: Le schéma est défini comme chaîne de caractères (ligne 10)

### 1.2 Migrations et Versioning

**État**: ⚠️ Système de migration basique et fragile

```javascript
// databaseService.js lignes 25-96
function runMigrationIfNecessary() {
    const migrationFlag = db.prepare("SELECT value FROM key_value_store WHERE key = 'migration_done'").get();
    if (migrationFlag) return;
    // Migration depuis JSON...
}
```

**🔴 PROBLÈMES**:

1. **Migration unique**: Un seul flag `migration_done`, pas de système de versions
2. **Pas de rollback**: Impossible de revenir en arrière
3. **Transactions manuelles**: Pas de framework de migration (Knex, Sequelize)
4. **Risque de corruption**: Si la migration échoue partiellement, aucun mécanisme de récupération

**💡 RECOMMANDATIONS**:

```javascript
// Proposer une table de versioning
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

// Utiliser un framework comme node-migrate ou umzug
```

### 1.3 Indexes pour Performance

**État**: ✅ Indexes basiques présents, mais incomplets

```sql
-- Indexes existants (lignes 14, 18, 21)
CREATE INDEX IF NOT EXISTS idx_history_computer ON loan_history(computerId);
CREATE INDEX IF NOT EXISTS idx_history_user ON loan_history(userName);
CREATE INDEX IF NOT EXISTS idx_chat_channel_ts ON chat_messages(channelId, timestamp);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_server ON users(server);
```

**🟡 AMÉLIORATIONS POSSIBLES**:

```sql
-- Indexes manquants pour les requêtes fréquentes
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_user ON loans(userName);
CREATE INDEX idx_loans_computer ON loans(computerId);
CREATE INDEX idx_computers_status ON computers(status);
CREATE INDEX idx_notifications_unread ON loan_notifications(read_status, date);
CREATE INDEX idx_rds_sessions_active ON rds_sessions(isActive, server);
```

### 1.4 Gestion des Transactions

**État**: ✅ Bonne utilisation, mais API redondante

```javascript
// Transaction wrapper (ligne 138)
function transaction(fn) { 
    connect(); 
    try { 
        return db.transaction(fn); 
    } catch (error) { 
        console.error("Erreur transaction:", error); 
        throw error; 
    } 
}
```

**✅ POINTS POSITIFS**:

- Utilisation correcte de `db.transaction()` pour atomicité
- Migration encapsulée dans une transaction (lignes 55-89)
- Batch updates atomiques (adCacheService.js lignes 52-58)

**🟡 AMÉLIORATIONS**:

- Ajouter un timeout pour éviter les deadlocks
- Logger les transactions longues (>1s)
- Implémenter un retry automatique pour les SQLITE_BUSY

### 1.5 Backup Strategy

**État**: 🔴 AUCUNE STRATÉGIE DE BACKUP AUTOMATIQUE

**CRITIQUE**: Pas de mécanisme de sauvegarde automatique détecté

**💡 RECOMMANDATIONS URGENTES**:

```javascript
// Ajouter dans databaseService.js
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24h

function createBackup() {
    const dbPath = configService.appConfig.databasePath;
    const backupDir = path.join(path.dirname(dbPath), 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);
    
    fs.mkdirSync(backupDir, { recursive: true });
    db.backup(backupPath);
    
    // Nettoyer les backups > 30 jours
    cleanOldBackups(backupDir, 30);
}

setInterval(createBackup, BACKUP_INTERVAL);
```

### 1.6 Configuration SQLite

**État**: ✅ Configuration optimisée

```javascript
// Ligne 106
db.pragma('journal_mode = WAL');

// Ligne 11 (dans le schéma)
PRAGMA foreign_keys = ON; 
PRAGMA synchronous = NORMAL;
```

**✅ BONNES PRATIQUES**:

- **WAL mode**: Améliore les performances en lecture/écriture concurrente
- **Foreign keys ON**: Intégrité référentielle
- **synchronous = NORMAL**: Bon compromis performance/sécurité

---

## 2. 🔐 Active Directory (adService.js)

### 2.1 Connexion et Authentification

**État**: ⚠️ Dépendance PowerShell, gestion d'erreur incomplète

```javascript
// Utilisation de PowerShell pour toutes les opérations AD
const { executeEncodedPowerShell } = require('./powershellService');
```

**🔴 PROBLÈMES**:

1. **Dépendance Windows**: PowerShell requis, pas de solution cross-platform
2. **Module AD non vérifié**: Aucune vérification de disponibilité au démarrage
3. **Pas de pooling de connexions**: Chaque requête = nouvelle connexion AD

**Exemple de script PowerShell (lignes 18-22)**:
```powershell
Import-Module ActiveDirectory -ErrorAction Stop
Get-ADUser -Filter "SamAccountName -like '*${searchTerm}*' ..." | ConvertTo-Json
```

**💡 RECOMMANDATIONS**:

```javascript
// Vérifier le module AD au démarrage
async function checkAdAvailability() {
    const psScript = `
        if (Get-Module -ListAvailable -Name ActiveDirectory) {
            @{available = $true} | ConvertTo-Json
        } else {
            @{available = $false; error = "Module not installed"} | ConvertTo-Json
        }
    `;
    // Mettre en cache le résultat
}
```

### 2.2 Gestion des Erreurs Réseau

**État**: ✅ Parsing d'erreur intelligent, mais timeouts fixes

```javascript
// Fonction parseAdError (lignes 6-15) - Bien conçue
function parseAdError(errorMessage) {
    if (lowerError.includes("cannot find an object")) return "Objet non trouvé";
    if (lowerError.includes("access is denied")) return "Permissions insuffisantes";
    // ... 6 cas gérés
}
```

**🟡 PROBLÈMES DE TIMEOUT**:

```javascript
// Lignes 24, 40, 70, 91, etc.
await executeEncodedPowerShell(psScript, 10000); // Timeout fixe 10s
await executeEncodedPowerShell(psScript, 15000); // Ou 15s
await executeEncodedPowerShell(psScript, 45000); // Ou 45s pour création
```

**💡 AMÉLIORATIONS**:

```javascript
const TIMEOUTS = {
    search: 10000,
    read: 15000,
    write: 30000,
    create: 45000
};

// Ajouter retry avec backoff exponentiel
async function executeWithRetry(script, timeout, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await executeEncodedPowerShell(script, timeout);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(1000 * Math.pow(2, i));
        }
    }
}
```

### 2.3 Cache Strategy

**État**: ✅ Cache implémenté dans adCacheService.js

```javascript
// adCacheService.js
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function updateUserAdStatuses() {
    // Batch processing par 20 utilisateurs (ligne 33)
    const batchSize = 20;
    // ...
}
```

**✅ POINTS POSITIFS**:

- Mise à jour périodique (toutes les 5 min)
- Traitement par lots pour éviter surcharge AD
- Stockage en base pour persistance
- Protection contre exécution concurrente (flag `isRunning`)

**🟡 AMÉLIORATIONS**:

```javascript
// Ajouter un cache mémoire pour éviter requêtes répétées
const memoryCache = new Map();

async function getAdUserDetailsCached(username) {
    const cached = memoryCache.get(username);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    const data = await adService.getAdUserDetails(username);
    memoryCache.set(username, { data, timestamp: Date.now() });
    return data;
}
```

### 2.4 Performance des Requêtes LDAP

**État**: 🔴 Pas d'optimisation, requêtes séquentielles

**PROBLÈMES**:

1. **Pas de limite sur les résultats**: `Get-ADUser -Filter ...` peut retourner des milliers
   - Exception: `Select-Object -First 10` pour searchAdUsers (ligne 21)
   - Exception: `Select-Object -First 20` pour searchAdGroups (ligne 37)

2. **Requêtes séquentielles**: adCacheService traite 20 users en parallèle mais pas optimal

3. **Pas de filtrage côté serveur**: Récupération de toutes les propriétés avec `-Properties *`

**💡 OPTIMISATIONS**:

```powershell
# Au lieu de -Properties *
Get-ADUser -Identity $username -Properties DisplayName,EmailAddress,Enabled,Description,LastLogonDate,PasswordLastSet,Created

# Ajouter des limites systématiques
Get-ADUser -Filter ... -ResultSetSize 100

# Pour les groupes, éviter -Recursive si possible
Get-ADGroupMember -Identity $group | Where-Object { $_.objectClass -eq 'user' }
```

---

## 3. 📊 Excel Sync (excelService.js)

### 3.1 Lecture/Écriture Fichier Partagé

**État**: ⚠️ Gestion des verrous, mais risque de corruption

```javascript
// excelService.js lignes 23-94
async function readExcelFileAsync() {
    // 1. Cache mémoire (30s TTL)
    if (memoryCache && (now - memoryCacheTimestamp) < MEMORY_CACHE_TTL) {
        return { success: true, users: memoryCache, fromMemoryCache: true };
    }
    
    // 2. Lecture Excel avec cellStyles: false pour contourner verrous
    const workbook = XLSX.readFile(excelPath, { cellStyles: false });
    
    // 3. Fallback sur cache disque si échec
    catch (error) {
        const cachedData = await safeReadJsonFile(cachePath, {});
        if (Object.keys(cachedData).length > 0) {
            return { success: true, users: cachedData, fromCache: true };
        }
    }
}
```

**✅ POINTS POSITIFS**:

- Triple niveau de cache (mémoire 30s → lecture Excel → disque)
- Fallback automatique si fichier verrouillé
- Invalidation de cache après écriture (ligne 167)

**🔴 PROBLÈMES CRITIQUES**:

1. **Pas de verrouillage exclusif en écriture**: Plusieurs instances peuvent écrire simultanément

```javascript
// Lignes 96-135: saveUserToExcel() et deleteUserFromExcel()
// Aucun mécanisme de lock, risque de race condition
```

2. **Pas de validation de version**: Aucune détection de modification concurrente

3. **Perte de données possible**: Si deux techniciens modifient en même temps

**💡 SOLUTION RECOMMANDÉE**:

```javascript
const lockFile = require('proper-lockfile');

async function saveUserToExcel({ user, isEdit }) {
    const excelPath = config.excelFilePath;
    let release;
    
    try {
        // Acquérir un lock exclusif
        release = await lockFile.lock(excelPath, {
            retries: {
                retries: 5,
                minTimeout: 100,
                maxTimeout: 1000
            }
        });
        
        // Lire, modifier, écrire
        const workbook = XLSX.readFile(excelPath);
        // ... modifications ...
        XLSX.writeFile(workbook, excelPath);
        
    } finally {
        if (release) await release();
    }
}
```

### 3.2 Gestion des Conflits

**État**: 🔴 AUCUNE GESTION DE CONFLITS

**Scénario de conflit non géré**:

```
T0: Technicien A lit Excel → utilisateur "jdoe" présent
T1: Technicien B lit Excel → utilisateur "jdoe" présent
T2: Technicien A modifie "jdoe" et écrit
T3: Technicien B supprime "jdoe" et écrit
Résultat: Modification de A est perdue
```

**💡 SOLUTIONS**:

1. **Versioning avec timestamp**:
```javascript
// Ajouter une colonne "lastModified" dans Excel
// Vérifier avant écriture que la version n'a pas changé
```

2. **API centralisée**:
```javascript
// Au lieu de modifier Excel directement, utiliser l'API
// qui garantit la sérialisation des écritures
```

### 3.3 Validation des Données

**État**: 🟡 Validation minimale

```javascript
// excelService.js lignes 45-60
const columnMapping = config.excelColumnMapping;
if (!columnMapping || !columnMapping['Identifiant'] || !columnMapping['Nom complet']) {
    throw new Error("Mapping incomplet");
}

// Validation basique lors de la lecture
if (user.username) {
    // Accepté
}
```

**🔴 MANQUES**:

- Pas de validation de format (email, username pattern)
- Pas de vérification des doublons avant insertion
- Pas de sanitisation des entrées

**💡 RECOMMANDATIONS**:

```javascript
const Joi = require('joi');

const userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    displayName: Joi.string().min(1).required(),
    email: Joi.string().email(),
    server: Joi.string().required(),
    password: Joi.string().min(8),
    department: Joi.string()
});

function validateUser(user) {
    const { error, value } = userSchema.validate(user);
    if (error) throw new Error(`Validation failed: ${error.message}`);
    return value;
}
```

### 3.4 Performance Sync

**État**: ✅ Optimisée avec cache multi-niveaux

**Mesures de performance**:

```javascript
// Cache mémoire: 30s TTL (ligne 11)
const MEMORY_CACHE_TTL = 30000;

// Sync automatique: Toutes les 10 min (server.js ligne 99)
runAsyncTask('Excel Sync', async () => {
    const syncResult = await userService.syncUsersFromExcel(false);
}, 10 * 60 * 1000, 5000);
```

**✅ OPTIMISATIONS PRÉSENTES**:

- Lecture asynchrone non-bloquante
- Cache en mémoire pour requêtes rapides
- Batch processing avec reduce() pour éviter boucles multiples

**🟡 AMÉLIORATIONS**:

```javascript
// Ajouter un hash MD5 du fichier pour éviter lecture inutile
const crypto = require('crypto');

async function hasExcelChanged() {
    const stats = fs.statSync(excelPath);
    const currentMtime = stats.mtime.getTime();
    
    if (lastMtime === currentMtime) {
        return false; // Fichier non modifié
    }
    lastMtime = currentMtime;
    return true;
}
```

---

## 4. 🔌 WebSocket (server.js)

### 4.1 Reconnexion Automatique

**État**: 🔴 PAS DE RECONNEXION AUTOMATIQUE CÔTÉ SERVEUR

**Code serveur** (server.js lignes 58-66):

```javascript
function initializeWebSocket() {
    wss = new WebSocketServer({ port: WS_PORT });
    wss.on('connection', ws => {
        console.log('🔌 Nouveau client WebSocket connecté.');
        ws.on('close', () => console.log('🔌 Client WebSocket déconnecté.'));
        ws.on('error', (error) => console.error('❌ Erreur WebSocket:', error));
    });
}
```

**🔴 PROBLÈMES**:

1. Pas de heartbeat/ping-pong
2. Pas de détection de connexions mortes
3. Pas de nettoyage des clients déconnectés

**💡 SOLUTION**:

```javascript
const HEARTBEAT_INTERVAL = 30000;

function initializeWebSocket() {
    wss = new WebSocketServer({ port: WS_PORT });
    
    // Heartbeat
    const interval = setInterval(() => {
        wss.clients.forEach(ws => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, HEARTBEAT_INTERVAL);
    
    wss.on('connection', ws => {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
        ws.on('close', () => console.log('Client déconnecté'));
        ws.on('error', (error) => console.error('Erreur WS:', error));
    });
    
    wss.on('close', () => clearInterval(interval));
}
```

### 4.2 Gestion Déconnexions

**État**: 🟡 Gestion basique, pas de retry

**Côté client** (pas fourni dans les fichiers, mais à implémenter):

```javascript
// RECOMMANDATION pour le client React
class WebSocketService {
    constructor(url) {
        this.url = url;
        this.reconnectInterval = 5000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
        this.connect();
    }
    
    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onclose = () => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    this.connect();
                }, this.reconnectInterval);
            }
        };
        
        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
        };
    }
}
```

### 4.3 Broadcasting Optimisé

**État**: ✅ Implémentation correcte et efficace

```javascript
// server.js lignes 68-74
function broadcast(data) {
    if (!wss) return;
    const jsonData = JSON.stringify(data); // ✅ Sérialise une seule fois
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) { // ✅ Vérifie l'état
            client.send(jsonData);
        }
    });
}
```

**✅ POINTS POSITIFS**:

- JSON sérialisé une seule fois (économie CPU)
- Vérification de `readyState` avant envoi
- Guard clause si WSS non initialisé

**🟡 AMÉLIORATIONS POSSIBLES**:

```javascript
// Ajouter des channels pour éviter broadcast global
const channels = new Map(); // channelId -> Set<WebSocket>

function broadcastToChannel(channelId, data) {
    const clients = channels.get(channelId) || new Set();
    const jsonData = JSON.stringify(data);
    
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(jsonData);
        }
    });
}

// Permettre aux clients de s'abonner
ws.on('message', (message) => {
    const { action, channel } = JSON.parse(message);
    if (action === 'subscribe') {
        channels.get(channel)?.add(ws) || channels.set(channel, new Set([ws]));
    }
});
```

### 4.4 Memory Leaks

**État**: 🟡 Risque modéré de fuites mémoire

**PROBLÈMES POTENTIELS**:

1. **Clients fantômes**: Connexions fermées non nettoyées de `wss.clients`
2. **Event listeners**: Pas de cleanup explicite des listeners
3. **Intervalles**: Les intervalles des tâches de fond ne sont jamais arrêtés

**Code problématique** (server.js lignes 76-121):

```javascript
function startBackgroundTasks() {
    // Ces intervalles ne sont JAMAIS clearInterval()
    runAsyncTask('Excel Sync', ..., 10 * 60 * 1000, 5000);
    runAsyncTask('RDS Sessions', ..., 30 * 1000);
    runAsyncTask('Loan Check', ..., 15 * 60 * 1000);
    runAsyncTask('Technician Presence', ..., 2 * 60 * 1000);
    runAsyncTask('AD Status Cache', ..., 5 * 60 * 1000, 15000);
}
```

**💡 SOLUTION**:

```javascript
const backgroundIntervals = [];

function runAsyncTask(name, taskFn, interval, initialDelay = 2000) {
    const run = async () => { /* ... */ };
    setTimeout(run, initialDelay);
    const intervalId = setInterval(run, interval);
    backgroundIntervals.push(intervalId);
    return intervalId;
}

// Ajouter un cleanup
process.on('SIGINT', () => {
    console.log('\nFermeture propre du serveur...');
    
    // Arrêter les tâches de fond
    backgroundIntervals.forEach(clearInterval);
    
    if (wss) {
        wss.clients.forEach(ws => ws.close());
        wss.close();
    }
    
    server.close(() => {
        databaseService.close();
        process.exit(0);
    });
});
```

---

## 📋 Résumé des Problèmes Critiques

### 🔴 Critique (Action Immédiate Requise)

1. **Base de données**:
   - ❌ Pas de stratégie de backup automatique
   - ❌ Fichier initdb.sql trompeur (PostgreSQL vs SQLite réel)
   - ❌ Système de migration primitif sans versioning

2. **Excel Sync**:
   - ❌ Pas de verrouillage exclusif en écriture
   - ❌ Aucune gestion de conflits d'écriture concurrente
   - ❌ Risque de corruption si plusieurs instances écrivent

3. **WebSocket**:
   - ❌ Pas de heartbeat/ping-pong pour détecter connexions mortes
   - ❌ Risque de memory leak avec intervalles non nettoyés

### 🟡 Important (Action à Court Terme)

1. **Active Directory**:
   - ⚠️ Pas de vérification de disponibilité du module AD au démarrage
   - ⚠️ Timeouts fixes non adaptés à la charge réseau
   - ⚠️ Pas de retry automatique sur erreur réseau

2. **Performance**:
   - ⚠️ Requêtes LDAP non optimisées (-Properties *)
   - ⚠️ Index SQLite incomplets

3. **Validation**:
   - ⚠️ Pas de schéma de validation des données Excel
   - ⚠️ Pas de sanitisation des entrées utilisateur

### ✅ Bonnes Pratiques Identifiées

1. **SQLite**: Configuration optimale (WAL mode, foreign keys)
2. **Transactions**: Utilisation correcte pour atomicité
3. **Cache**: Système multi-niveaux (mémoire → disque → source)
4. **Broadcast**: Optimisé avec sérialisation unique
5. **Error Handling**: Parsing intelligent des erreurs AD

---

## 🎯 Plan d'Action Recommandé

### Phase 1 - Urgence (Semaine 1)

```bash
✅ Implémenter backup automatique SQLite (quotidien + rotation)
✅ Ajouter verrouillage fichier Excel avec proper-lockfile
✅ Implémenter heartbeat WebSocket
✅ Nettoyer initdb.sql ou le remplacer par le schéma SQLite réel
```

### Phase 2 - Stabilité (Semaine 2-3)

```bash
✅ Migrer vers système de migration formel (node-migrate)
✅ Ajouter détection de conflits Excel avec timestamps
✅ Implémenter retry automatique pour AD avec backoff
✅ Ajouter validation Joi pour données Excel
```

### Phase 3 - Performance (Semaine 4)

```bash
✅ Optimiser requêtes LDAP (limiter propriétés)
✅ Compléter indexes SQLite
✅ Implémenter channels WebSocket
✅ Ajouter cache mémoire pour AD
```

---

## 📊 Métriques de Santé Proposées

```javascript
// healthCheck.js - À implémenter
module.exports = {
    database: {
        size: fs.statSync(dbPath).size,
        lastBackup: getLastBackupTime(),
        connectionPool: db.open ? 'OK' : 'CLOSED'
    },
    excel: {
        lastSync: memoryCacheTimestamp,
        cacheHitRate: cacheHits / totalRequests,
        isLocked: isFileLocked(excelPath)
    },
    websocket: {
        clients: wss.clients.size,
        deadConnections: countDeadConnections()
    },
    activeDirectory: {
        lastCacheUpdate: adCacheService.lastUpdate,
        queryLatency: measureAdLatency()
    }
};
```

---

**Fin de l'analyse**
