# Analyse des Services Backend - RDS Viewer Anecoop

**Date:** 2025-11-02  
**Services Analysés:** 17/17  
**Objectif:** Identifier problèmes de qualité, performance, sécurité

---

## 📊 Vue d'ensemble

| Critère | État | Niveau |
|---------|------|--------|
| **Gestion des erreurs** | 🟡 Partiel | Moyen |
| **Sécurité** | 🔴 Critique | Faible |
| **Performance** | 🟢 Bon | Bon |
| **Code Quality** | 🟡 Moyen | Moyen |
| **Duplication Code** | 🟡 Modéré | Moyen |
| **Memory Management** | 🟢 Bon | Bon |
| **Logging** | 🟡 Partiel | Moyen |

---

## 🔴 PROBLÈMES CRITIQUES DE SÉCURITÉ

### 1. **Injection SQL/PowerShell** (Critique)

#### ❌ `adService.js` - Lignes 18-21, 34-36, 54, 82-84, etc.

**Problème:** Interpolation directe de variables non échappées dans PowerShell
```javascript
// VULNÉRABLE À L'INJECTION
Get-ADUser -Filter "SamAccountName -like '*${searchTerm}*'"
Get-ADGroup -Filter "Name -like '*${searchTerm}*'"
Add-ADGroupMember -Identity "${groupName}" -Members "${username}"
```

**Risque:** Un attaquant peut injecter du code PowerShell malveillant
```javascript
// Exemple d'exploitation:
searchTerm = "'; Remove-ADUser -Identity Administrator; #"
// Résultat: Get-ADUser -Filter "SamAccountName -like '*'; Remove-ADUser -Identity Administrator; #*'"
```

**Impact:** 
- Exécution de commandes PowerShell arbitraires
- Suppression d'utilisateurs AD
- Élévation de privilèges
- Compromission du domaine

**Solution:**
```javascript
// ✅ SÉCURISÉ: Utiliser -LDAPFilter avec échappement
function escapeLdapFilter(str) {
    return str.replace(/[\\*()\x00]/g, '\\$&');
}

async function searchAdUsers(searchTerm) {
    const escaped = escapeLdapFilter(searchTerm);
    const psScript = `
        Import-Module ActiveDirectory -ErrorAction Stop
        $filter = "SamAccountName -like '*${escaped}*' -or DisplayName -like '*${escaped}*'"
        Get-ADUser -Filter $filter -Properties DisplayName,EmailAddress,Enabled |
            Select-Object -First 10 | ConvertTo-Json -Compress
    `;
    // ...
}
```

**Priorité:** 🔴 IMMÉDIATE - Corrigé avant déploiement

---

#### ❌ `adService.js` - Ligne 203

**Problème:** Échappement faible dans `resetAdUserPassword`
```javascript
const escapeParam = (str) => str ? str.replace(/"/g, '`"') : '';
// N'échappe que les guillemets, insuffisant
```

**Vulnérabilité:**
```javascript
// Exploitation possible avec backticks
newPassword = "`; Remove-Item C:\\* -Recurse; #"
```

**Solution:** Utiliser `ConvertTo-SecureString` avec validation stricte
```javascript
// ✅ Validation + Échappement complet
function validatePassword(pwd) {
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(pwd)) {
        throw new Error('Caractères invalides dans le mot de passe');
    }
    if (pwd.length < 8 || pwd.length > 128) {
        throw new Error('Longueur de mot de passe invalide');
    }
}

async function resetAdUserPassword(username, newPassword, mustChangePassword = true) {
    validatePassword(newPassword);
    // Utiliser -AsPlainText avec validation plutôt que string interpolation
    // ...
}
```

---

### 2. **Exposition de Credentials** (Critique)

#### ❌ `userService.js` - Ligne 105, 128

**Problème:** Stockage de mots de passe en clair dans SQLite
```javascript
password: userData.password || '', 
officePassword: userData.officePassword || ''
```

**Impact:**
- Mots de passe lisibles par quiconque accède au fichier .db
- Violation RGPD/conformité
- Fuite de données sensibles

**Solution:**
```javascript
const crypto = require('crypto');

// ✅ Chiffrement AES-256-GCM
function encryptPassword(password, masterKey) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptPassword(encryptedData, masterKey) {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Dans userService.js
async function saveUser(userData, technician) {
    const encryptedPassword = encryptPassword(userData.password, MASTER_KEY);
    const encryptedOfficePassword = encryptPassword(userData.officePassword, MASTER_KEY);
    // ...
}
```

**Note:** La clé maître (`MASTER_KEY`) doit être stockée de manière sécurisée (DPAPI Windows, keychain, variable d'environnement protégée).

---

#### ❌ `excelService.js` - Ligne 126-128

**Problème:** Écriture de mots de passe en clair dans Excel
```javascript
XLSX.writeFile(workbook, excelPath);
// Excel contient password, officePassword en clair
```

**Impact:** Fichier Excel = base de mots de passe non chiffrée

**Solution:**
1. Chiffrer les colonnes sensibles dans Excel
2. Ou mieux: ne jamais stocker les mots de passe dans Excel
3. Utiliser une politique de rotation de mots de passe

---

### 3. **Validation d'Entrée Insuffisante** (Haute)

#### ❌ `dataService.js` - Ligne 23-24

**Problème:** Aucune validation des données avant insertion
```javascript
async function saveComputer(computerData, technician) {
    // Pas de validation de computerData
    db.run(sql, params);
}
```

**Risques:**
- Injection de données malformées
- Crash de l'application
- Corruption de base de données

**Solution:**
```javascript
const Joi = require('joi');

const computerSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    brand: Joi.string().max(100).allow(''),
    model: Joi.string().max(100).allow(''),
    serialNumber: Joi.string().alphanum().min(5).max(50).required(),
    status: Joi.string().valid('available', 'loaned', 'maintenance', 'retired').required(),
    // ...
});

async function saveComputer(computerData, technician) {
    const { error, value } = computerSchema.validate(computerData);
    if (error) {
        return { success: false, error: error.details[0].message };
    }
    // Utiliser 'value' (données validées) au lieu de computerData
    db.run(sql, params);
}
```

---

## 🟡 PROBLÈMES DE QUALITÉ ET PERFORMANCE

### 4. **Gestion d'Erreurs Incomplète** (Moyen)

#### ❌ `adCacheService.js` - Ligne 36-47

**Problème:** Erreurs silencieuses, pas de reporting
```javascript
const promises = batch.map(async (user) => {
    try {
        const adDetails = await adService.getAdUserDetails(user.username);
        // ...
    } catch (error) {
        console.warn(`[AD Cache] Impossible de vérifier ${user.username}`);
    }
    return null; // Perte d'information
});
```

**Impact:**
- Impossible de diagnostiquer les échecs
- Pas de métriques de fiabilité
- Erreurs non visibles par les admins

**Solution:**
```javascript
const results = [];
const errors = [];

for (const user of batch) {
    try {
        const adDetails = await adService.getAdUserDetails(user.username);
        if (adDetails.success) {
            results.push({ username: user.username, adEnabled: adDetails.user.enabled ? 1 : 0 });
        } else {
            errors.push({ username: user.username, error: adDetails.error });
        }
    } catch (error) {
        errors.push({ username: user.username, error: error.message });
        console.error(`[AD Cache] Erreur pour ${user.username}:`, error);
    }
}

// Enregistrer les erreurs dans la DB pour monitoring
if (errors.length > 0) {
    db.run('INSERT INTO system_logs (type, message, timestamp) VALUES (?, ?, ?)', 
        ['ad_cache_errors', JSON.stringify(errors), new Date().toISOString()]
    );
}
```

---

### 5. **Race Conditions** (Moyen)

#### ❌ `adCacheService.js` - Ligne 15-19

**Problème:** Flag `isRunning` non atomique
```javascript
if (isRunning) {
    console.log('[AD Cache] Déjà en cours.');
    return;
}
isRunning = true; // ⚠️ Pas thread-safe
```

**Risque:** Deux appels simultanés peuvent passer le check

**Solution:**
```javascript
let updatePromise = null;

async function updateUserAdStatuses() {
    if (updatePromise) {
        console.log('[AD Cache] Mise à jour déjà en cours, attente...');
        return updatePromise;
    }

    updatePromise = (async () => {
        try {
            // Logique de mise à jour
        } finally {
            updatePromise = null;
        }
    })();

    return updatePromise;
}
```

---

### 6. **Performance: N+1 Queries** (Moyen)

#### ❌ `dataService.js` - Ligne 156-164

**Problème:** Requêtes SQL multiples dans une boucle
```javascript
async function getLoanStatistics() {
    const computers = db.get(`SELECT COUNT(*) ...`);
    const allActiveLoans = await getLoans(); // Charge TOUT
    // Itération sur tous les prêts
    const history = db.get(`SELECT COUNT(*) ...`);
    const topUsers = db.all(`SELECT ... GROUP BY ...`);
    const topComputers = db.all(`SELECT ... GROUP BY ...`);
    // 5+ requêtes séparées
}
```

**Solution:** Utiliser des CTEs et sous-requêtes
```javascript
async function getLoanStatistics() {
    const query = `
        WITH computer_stats AS (
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN status = 'loaned' THEN 1 ELSE 0 END) as loaned,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
            FROM computers
        ),
        loan_stats AS (
            SELECT 
                status,
                COUNT(*) as count
            FROM loans
            WHERE status NOT IN ('returned', 'cancelled')
            GROUP BY status
        ),
        top_users AS (
            SELECT userDisplayName, COUNT(*) as count
            FROM loan_history
            WHERE eventType = 'created'
            GROUP BY userDisplayName
            ORDER BY count DESC
            LIMIT 5
        ),
        top_computers AS (
            SELECT computerName, COUNT(*) as count
            FROM loan_history
            WHERE eventType = 'created'
            GROUP BY computerName
            ORDER BY count DESC
            LIMIT 5
        )
        SELECT 
            (SELECT json_object('total', total, 'available', available, 'loaned', loaned, 'maintenance', maintenance) FROM computer_stats) as computers,
            (SELECT json_group_array(json_object('status', status, 'count', count)) FROM loan_stats) as loans,
            (SELECT json_group_array(json_object('user', userDisplayName, 'count', count)) FROM top_users) as topUsers,
            (SELECT json_group_array(json_object('computer', computerName, 'count', count)) FROM top_computers) as topComputers
    `;
    
    const result = db.get(query);
    return {
        computers: JSON.parse(result.computers),
        loans: JSON.parse(result.loans).reduce((acc, l) => ({ ...acc, [l.status]: l.count }), {}),
        topUsers: JSON.parse(result.topUsers),
        topComputers: JSON.parse(result.topComputers),
    };
}
```

---

### 7. **Memory Leak Potentiel** (Faible)

#### ⚠️ `rdsService.js` - Ligne 77-95

**Problème:** Promises créées pour chaque serveur sans limitation
```javascript
const promises = servers.map(server =>
    new Promise((resolve) => {
        exec(`quser /server:${server}`, { encoding: 'buffer', timeout: 8000 }, ...);
    })
);
await Promise.all(promises); // Pas de limite de concurrence
```

**Risque:** Avec 100+ serveurs, création de 100+ processus simultanés

**Solution:** Utiliser une pool de concurrence
```javascript
const pLimit = require('p-limit');
const limit = pLimit(10); // Max 10 requêtes simultanées

const promises = servers.map(server =>
    limit(() => queryRdsServer(server))
);
await Promise.all(promises);
```

---

### 8. **Duplication de Code** (Moyen)

#### ❌ Parsing JSON répété dans tous les services

**Duplication:**
```javascript
// dataService.js, chatService.js, notificationService.js, databaseService.js
const parseJSON = (field, defaultValue = null) => {
    if (field === null || field === undefined) return defaultValue;
    try { return JSON.parse(field) || defaultValue; } catch { return defaultValue; }
};
```

**Solution:** Centraliser dans `utils.js`
```javascript
// utils.js
function safeJsonParse(field, defaultValue = null) {
    if (field === null || field === undefined || field === '') return defaultValue;
    try {
        const parsed = JSON.parse(field);
        return parsed !== null ? parsed : defaultValue;
    } catch (error) {
        console.warn('JSON parse error:', error.message, 'Input:', field?.substring(0, 50));
        return defaultValue;
    }
}

function safeJsonStringify(field, defaultValue = null) {
    try {
        return JSON.stringify(field);
    } catch (error) {
        console.warn('JSON stringify error:', error.message);
        return defaultValue;
    }
}

module.exports = { 
    generateId, 
    addHistoryEntry, 
    safeJsonParse, 
    safeJsonStringify 
};
```

Puis importer partout:
```javascript
const { safeJsonParse, safeJsonStringify } = require('./utils');
```

---

### 9. **Logging Inconsistant** (Faible)

**Problème:** Mix de styles de logging
```javascript
// Différents formats:
console.log('✅ Migration terminée');           // Emoji + texte
console.warn('⚠️ Fichier Excel verrouillé');   // Emoji + warn
console.error('❌ Erreur critique:', error);    // Emoji + error
console.log(`[AD Cache] ${message}`);           // Prefix bracket
```

**Solution:** Utiliser un logger unifié
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const emoji = {
                error: '❌',
                warn: '⚠️',
                info: 'ℹ️',
                debug: '🔍'
            }[level] || '';
            return `${timestamp} ${emoji} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console()
    ]
});

module.exports = logger;
```

Usage:
```javascript
const logger = require('./logger');
logger.info('Migration terminée', { count: 50 });
logger.error('Erreur critique', { error: error.message, stack: error.stack });
```

---

### 10. **Timeout Non Configurables** (Faible)

#### ❌ `rdsService.js` - Ligne 80, `powershellService.js` - Ligne 16

**Problème:** Timeouts hard-codés
```javascript
exec(`quser /server:${server}`, { timeout: 8000 }, ...); // 8s fixe
executeEncodedPowerShell(psScript, 15000); // 15s fixe
```

**Impact:** Impossible d'ajuster selon les conditions réseau

**Solution:** Configuration centralisée
```javascript
// config.json
{
    "timeouts": {
        "rdsQuery": 10000,
        "powershell": 20000,
        "adQuery": 15000
    }
}

// rdsService.js
const config = configService.getConfig();
exec(`quser /server:${server}`, { 
    timeout: config.timeouts?.rdsQuery || 8000 
}, ...);
```

---

## 🟢 POINTS POSITIFS

### ✅ Bonne Architecture

1. **Séparation des responsabilités** : Chaque service a un rôle clair
2. **Utilisation de better-sqlite3** : Performant, transactions atomiques
3. **Caching intelligent** : `adGroupCacheService.js` avec LRU cache
4. **Migration robuste** : `databaseService.js` - Migration JSON vers SQLite bien gérée

### ✅ Gestion de Cache Excel

```javascript
// excelService.js - Multi-niveau cache (mémoire + disque)
if (memoryCache && (now - memoryCacheTimestamp) < MEMORY_CACHE_TTL) {
    return { success: true, users: memoryCache, fromMemoryCache: true };
}
// Fallback vers cache disque si Excel verrouillé
```

### ✅ Transaction Better-SQLite3

```javascript
// databaseService.js
const transaction = db.transaction(() => {
    db.run('DELETE FROM rds_sessions');
    for (const session of sessions) {
        updateTransaction.run(session);
    }
});
transaction(allSessions); // Atomique
```

---

## 📋 RÉSUMÉ DES RECOMMANDATIONS

### 🔴 Priorité Immédiate (Avant déploiement)

1. **Sécuriser toutes les requêtes PowerShell AD** contre l'injection
   - Échapper tous les paramètres utilisateur
   - Valider les entrées avec whitelist
   - Implémenter `escapeLdapFilter()`

2. **Chiffrer les mots de passe** dans SQLite et Excel
   - Utiliser AES-256-GCM
   - Stocker la clé maître de manière sécurisée
   - Migration des mots de passe existants

3. **Ajouter validation des entrées** avec Joi ou Yup
   - Schémas pour tous les modèles (User, Computer, Loan)
   - Validation côté serveur obligatoire

### 🟡 Priorité Haute (1-2 semaines)

4. **Améliorer la gestion d'erreurs**
   - Système de logging unifié (Winston)
   - Table `system_logs` dans SQLite
   - Dashboard de monitoring des erreurs

5. **Optimiser les requêtes SQL**
   - Fusionner les requêtes multiples en CTEs
   - Ajouter des index manquants
   - Limiter la concurrence des requêtes RDS

6. **Éliminer les duplications de code**
   - Centraliser `parseJSON`/`stringifyJSON` dans utils.js
   - Factoriser les fonctions de validation

### 🟢 Priorité Moyenne (1 mois)

7. **Améliorer la testabilité**
   - Ajouter des tests unitaires (Jest)
   - Mock des services externes (AD, Excel)
   - Tests d'intégration pour les services critiques

8. **Documentation technique**
   - JSDoc pour toutes les fonctions publiques
   - Diagrammes de flux (migration, sync Excel)
   - Guide de déploiement sécurisé

9. **Monitoring et observabilité**
   - Métriques de performance (durée des requêtes AD, RDS)
   - Alertes sur les échecs critiques
   - Dashboard Grafana/Prometheus (optionnel)

---

## 📈 MÉTRIQUES DE QUALITÉ

### Complexité Cyclomatique (Estimée)

| Service | Complexité | État |
|---------|------------|------|
| `adService.js` | ~25 | 🟡 Élevée |
| `databaseService.js` | ~30 | 🔴 Très élevée |
| `dataService.js` | ~20 | 🟡 Élevée |
| `rdsService.js` | ~15 | 🟢 Acceptable |
| `excelService.js` | ~18 | 🟡 Élevée |
| Autres | <10 | 🟢 Bonne |

**Recommandation:** Refactoriser `databaseService.js` (split en modules)

### Dette Technique Estimée

| Catégorie | Temps de correction | Priorité |
|-----------|---------------------|----------|
| Sécurité | 2-3 jours | 🔴 Critique |
| Performance | 1-2 jours | 🟡 Haute |
| Qualité | 3-5 jours | 🟡 Haute |
| Documentation | 2 jours | 🟢 Moyenne |
| **TOTAL** | **8-12 jours** | - |

---

## 🔧 EXEMPLES DE CODE REFACTORISÉ

### Exemple 1: Requête AD Sécurisée

```javascript
// ❌ AVANT (Vulnérable)
async function searchAdUsers(searchTerm) {
    const psScript = `
        Get-ADUser -Filter "SamAccountName -like '*${searchTerm}*'"
    `;
    return await executeEncodedPowerShell(psScript);
}

// ✅ APRÈS (Sécurisé)
const LDAP_ESCAPE_MAP = {
    '\\': '\\5c',
    '*': '\\2a',
    '(': '\\28',
    ')': '\\29',
    '\x00': '\\00'
};

function escapeLdapFilter(str) {
    return str.replace(/[\\*()\x00]/g, char => LDAP_ESCAPE_MAP[char]);
}

function validateSearchTerm(term) {
    if (typeof term !== 'string' || term.length > 100) {
        throw new Error('Terme de recherche invalide');
    }
    return term.trim();
}

async function searchAdUsers(searchTerm) {
    const validated = validateSearchTerm(searchTerm);
    const escaped = escapeLdapFilter(validated);
    
    const psScript = `
        Import-Module ActiveDirectory -ErrorAction Stop
        $ErrorActionPreference = 'Stop'
        
        $searchBase = (Get-ADDomain).DistinguishedName
        $filter = "SamAccountName -like '*${escaped}*' -or DisplayName -like '*${escaped}*'"
        
        try {
            Get-ADUser -Filter $filter -SearchBase $searchBase -Properties DisplayName,EmailAddress,Enabled |
                Select-Object -First 10 SamAccountName,DisplayName,EmailAddress,Enabled |
                ConvertTo-Json -Compress
        } catch {
            Write-Error $_.Exception.Message
            exit 1
        }
    `;
    
    try {
        const jsonOutput = await executeEncodedPowerShell(psScript, 10000);
        const users = JSON.parse(jsonOutput || '[]');
        return Array.isArray(users) ? users : [users];
    } catch (error) {
        logger.error('Erreur recherche AD:', { searchTerm: validated, error: error.message });
        throw new Error(`Échec de la recherche AD: ${parseAdError(error.message)}`);
    }
}
```

### Exemple 2: Service Utilisateur Sécurisé

```javascript
// ✅ userService.js avec chiffrement
const crypto = require('crypto');
const Joi = require('joi');
const { safeJsonParse, safeJsonStringify } = require('./utils');
const logger = require('./logger');

// Clé maître (à stocker de manière sécurisée - DPAPI, keychain, env protégée)
const MASTER_KEY = process.env.DB_MASTER_KEY || crypto.randomBytes(32);

const userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    displayName: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().allow(''),
    department: Joi.string().max(100).allow(''),
    server: Joi.string().max(100).allow(''),
    password: Joi.string().min(8).max(128).required(),
    officePassword: Joi.string().min(8).max(128).allow(''),
    notes: Joi.string().max(1000).allow('')
});

function encryptPassword(password) {
    if (!password) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptPassword(encryptedData) {
    if (!encryptedData) return '';
    try {
        const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
        const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        logger.error('Erreur déchiffrement mot de passe:', error);
        return '';
    }
}

async function saveUser(userData, technician) {
    // Validation
    const { error, value } = userSchema.validate(userData);
    if (error) {
        return { success: false, error: error.details[0].message };
    }

    const now = new Date().toISOString();
    const existingUser = await getUserByUsername(value.username);
    const isUpdate = !!existingUser;

    try {
        // Chiffrement des mots de passe
        const encryptedPassword = encryptPassword(value.password);
        const encryptedOfficePassword = encryptPassword(value.officePassword || '');

        // Sauvegarde dans Excel (sans mots de passe ou avec hash)
        const excelResult = await excelService.saveUserToExcel({
            user: { 
                ...value, 
                password: '[CHIFFRÉ]', 
                officePassword: '[CHIFFRÉ]' 
            },
            isEdit: isUpdate
        });

        if (!excelResult.success) {
            return { success: false, error: `Erreur Excel: ${excelResult.error}` };
        }

        // Sauvegarde dans SQLite avec mots de passe chiffrés
        const id = existingUser?.id || `user_${Date.now()}`;

        if (isUpdate) {
            db.run(`
                UPDATE users SET
                    displayName = ?, email = ?, department = ?, server = ?,
                    password = ?, officePassword = ?, notes = ?,
                    lastModified = ?, modifiedBy = ?, lastSyncFromExcel = ?
                WHERE username = ?
            `, [
                value.displayName, value.email, value.department, value.server,
                encryptedPassword, encryptedOfficePassword, value.notes,
                now, technician?.name || 'system', now, value.username
            ]);
        } else {
            db.run(`
                INSERT INTO users (
                    id, username, displayName, email, department, server,
                    password, officePassword, notes, createdAt, createdBy,
                    lastModified, modifiedBy, lastSyncFromExcel
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, value.username, value.displayName, value.email, value.department,
                value.server, encryptedPassword, encryptedOfficePassword,
                value.notes, now, technician?.name || 'system', now, technician?.name || 'system', now
            ]);
        }

        logger.info(`Utilisateur ${value.username} ${isUpdate ? 'mis à jour' : 'créé'}`, {
            username: value.username,
            technician: technician?.name
        });
        
        return { success: true };

    } catch (error) {
        logger.error('Erreur sauvegarde utilisateur:', { 
            username: value.username, 
            error: error.message 
        });
        return { success: false, error: error.message };
    }
}

// Fonction pour récupérer un utilisateur avec mots de passe déchiffrés
async function getUserByUsername(username, decryptPasswords = false) {
    try {
        const user = db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) return null;

        if (decryptPasswords) {
            user.password = decryptPassword(user.password);
            user.officePassword = decryptPassword(user.officePassword);
        } else {
            // Par défaut, ne pas renvoyer les mots de passe
            delete user.password;
            delete user.officePassword;
        }

        return user;
    } catch (error) {
        logger.error(`Erreur récupération utilisateur ${username}:`, error);
        return null;
    }
}
```

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1: Sécurisation (Semaine 1)
- [ ] Implémenter `escapeLdapFilter()` et sécuriser toutes les requêtes AD
- [ ] Ajouter validation Joi pour tous les services
- [ ] Implémenter chiffrement AES-256-GCM pour mots de passe
- [ ] Tests de sécurité (injection SQL/PS)

### Phase 2: Qualité (Semaine 2)
- [ ] Mettre en place Winston logger
- [ ] Centraliser `parseJSON`/`stringifyJSON` dans utils.js
- [ ] Refactoriser `getLoanStatistics()` avec CTEs
- [ ] Ajouter table `system_logs` pour monitoring

### Phase 3: Tests & Documentation (Semaine 3)
- [ ] Tests unitaires Jest pour services critiques
- [ ] JSDoc pour toutes les fonctions publiques
- [ ] Guide de déploiement sécurisé
- [ ] Documentation des API internes

### Phase 4: Monitoring (Semaine 4)
- [ ] Dashboard de métriques (erreurs, performance)
- [ ] Alertes sur échecs critiques
- [ ] Logs rotatifs avec Winston
- [ ] Tests de charge pour RDS queries

---

## 📚 RESSOURCES

- **OWASP Top 10 2021:** https://owasp.org/Top10/
- **PowerShell Injection Prevention:** https://www.sans.org/blog/powershell-injection/
- **Node.js Security Best Practices:** https://nodejs.org/en/docs/guides/security/
- **Better-SQLite3 Docs:** https://github.com/WiseLibs/better-sqlite3

---

**Analyste:** Assistant AI  
**Date:** 2025-11-02  
**Version:** 1.0
