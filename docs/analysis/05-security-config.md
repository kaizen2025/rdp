# Analyse de Sécurité et Configuration - RDS Viewer Anecoop

**Date:** 2025-11-02  
**Analyste:** Système d'Audit Automatisé  
**Version du projet:** 3.0.26  
**Priorité:** CRITIQUE

---

## 📊 Résumé Exécutif

Cette analyse identifie **7 vulnérabilités** de sécurité et problèmes de configuration dans l'application RDS Viewer, dont **2 vulnérabilités CRITIQUES** nécessitant une action immédiate.

### Score de Sécurité Global: **4/10** ⚠️

- **Vulnérabilités Critiques:** 2
- **Vulnérabilités Hautes:** 2
- **Vulnérabilités Moyennes:** 2
- **Vulnérabilités Basses:** 1

---

## 🔴 VULNÉRABILITÉS CRITIQUES

### 1. Credentials Active Directory en Clair (CRITIQUE)

**Fichier:** `config/config.json`  
**Lignes:** 3-6

```json
{
  "appPasswordHash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  "domain": "anecoopfr.local",
  "username": "admin_anecoop",
  "password": "vCQhNZ2aY2v!",
  ...
}
```

**Impact:**
- ✅ Le hash du mot de passe d'application est correctement stocké (SHA-256)
- ❌ **CRITIQUE:** Le mot de passe Active Directory est stocké en clair
- ❌ Tout utilisateur ayant accès au fichier config.json peut récupérer les credentials AD
- ❌ Le compte `admin_anecoop` semble avoir des privilèges administratifs sur le domaine
- ❌ Risque de compromission totale du domaine Active Directory

**Recommandations:**
1. **URGENT:** Utiliser Windows Credential Manager ou DPAPI pour chiffrer les credentials
2. Implémenter un système de secrets management (Azure Key Vault, HashiCorp Vault, etc.)
3. Utiliser un compte de service avec permissions minimales (principe du moindre privilège)
4. Chiffrer le fichier config.json avec une clé dérivée de l'utilisateur
5. Envisager l'utilisation de Kerberos ou NTLM pour l'authentification sans mot de passe

**Code suggéré (Windows DPAPI):**
```javascript
const dpapi = require('dpapi');

// Chiffrement
const encrypted = dpapi.protectData(Buffer.from(password), null, 'CurrentUser');
fs.writeFileSync('config.json', JSON.stringify({ encryptedPassword: encrypted.toString('base64') }));

// Déchiffrement
const decrypted = dpapi.unprotectData(Buffer.from(encryptedPassword, 'base64'), null, 'CurrentUser');
const password = decrypted.toString();
```

---

### 2. Injection PowerShell dans Active Directory Service (CRITIQUE)

**Fichier:** `backend/services/adService.js`  
**Lignes:** 18-21, 34-37, 54, 84

**Exemples de code vulnérable:**

```javascript
// Ligne 20 - searchAdUsers
Get-ADUser -Filter "SamAccountName -like '*${searchTerm}*' -or DisplayName -like '*${searchTerm}*'"

// Ligne 36 - searchAdGroups
Get-ADGroup -Filter "Name -like '*${searchTerm}*'"

// Ligne 54 - getAdGroupMembers
$groupName = "${groupName}"

// Ligne 84 - addUserToGroup
Add-ADGroupMember -Identity "${groupName}" -Members "${username}"
```

**Impact:**
- ❌ Injection de commandes PowerShell arbitraires
- ❌ Possibilité d'exécuter du code malveillant sur le serveur
- ❌ Contournement des permissions Active Directory
- ❌ Exfiltration de données sensibles du domaine
- ❌ Modification ou suppression de comptes/groupes AD

**Scénarios d'exploitation:**

```javascript
// Exemple d'attaque 1: Exécution de commande
searchTerm = "admin'; Get-Process; Get-ADUser -Filter 'Name -like '*"
// Résultat: Liste tous les processus + utilisateurs AD

// Exemple d'attaque 2: Exfiltration de données
searchTerm = "'; Get-ADUser -Filter * -Properties * | Export-Csv C:\\temp\\users.csv; '"
// Résultat: Exporte tous les utilisateurs AD avec tous leurs attributs

// Exemple d'attaque 3: Création de compte admin
groupName = "Admins' -PassThru; New-ADUser -Name 'hacker' -AccountPassword (ConvertTo-SecureString 'P@ssw0rd' -AsPlainText -Force) -Enabled $true; Add-ADGroupMember -Identity 'Domain Admins"
```

**Recommandations:**
1. **URGENT:** Utiliser des requêtes paramétrées (prepared statements)
2. Valider et assainir TOUS les inputs utilisateur
3. Utiliser une whitelist de caractères autorisés
4. Échapper les caractères spéciaux PowerShell
5. Limiter les permissions du compte de service

**Code corrigé suggéré:**

```javascript
function sanitizePowerShellInput(input) {
    // Whitelist: lettres, chiffres, espaces, tirets, underscores
    if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(input)) {
        throw new Error('Caractères invalides détectés dans l\'entrée');
    }
    return input.replace(/'/g, "''"); // Échappement simple quote
}

async function searchAdUsers(searchTerm) {
    const sanitized = sanitizePowerShellInput(searchTerm);
    const psScript = `
        Import-Module ActiveDirectory -ErrorAction Stop
        $filter = "SamAccountName -like '*" + $args[0] + "*' -or DisplayName -like '*" + $args[0] + "*'"
        Get-ADUser -Filter $filter -Properties DisplayName,EmailAddress,Enabled |
            Select-Object -First 10 SamAccountName,DisplayName,EmailAddress,Enabled | 
            ConvertTo-Json -Compress
    `;
    return await executeEncodedPowerShell(psScript, 10000, [sanitized]);
}
```

---

## 🟠 VULNÉRABILITÉS HAUTES

### 3. Authentification Hardcodée et Non Sécurisée (HAUTE)

**Fichier:** `src/pages/LoginPage.js`  
**Ligne:** 71

```javascript
if (password === 'admin') {
    await apiService.login(selectedTechnician);
    setCurrentTechnician(selectedTechnician); 
    onLoginSuccess(selectedTechnician);
}
```

**Impact:**
- ❌ Mot de passe hardcodé dans le code source
- ❌ Tous les techniciens utilisent le même mot de passe
- ❌ Pas de vérification du hash côté backend
- ❌ Pas de protection contre les attaques par force brute
- ❌ Pas de limitation du taux de tentatives (rate limiting)
- ❌ Sessions non sécurisées (pas de JWT ou session tokens)

**Recommandations:**
1. Implémenter un système d'authentification robuste (JWT, OAuth2)
2. Utiliser le hash `appPasswordHash` présent dans config.json
3. Ajouter un rate limiting (max 5 tentatives / 5 minutes)
4. Implémenter des sessions avec timeout
5. Logger toutes les tentatives d'authentification
6. Ajouter une authentification à deux facteurs (2FA)

**Code suggéré:**

```javascript
// Backend - backend/services/authService.js
const crypto = require('crypto');

function verifyPassword(inputPassword, storedHash) {
    const hash = crypto.createHash('sha256').update(inputPassword).digest('hex');
    return hash === storedHash;
}

const loginAttempts = new Map(); // userId -> { count, lastAttempt }

function checkRateLimit(userId) {
    const now = Date.now();
    const attempts = loginAttempts.get(userId) || { count: 0, lastAttempt: now };
    
    // Reset après 5 minutes
    if (now - attempts.lastAttempt > 5 * 60 * 1000) {
        attempts.count = 0;
    }
    
    if (attempts.count >= 5) {
        throw new Error('Trop de tentatives. Réessayez dans 5 minutes.');
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(userId, attempts);
}

// Frontend - LoginPage.js
const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const response = await apiService.authenticate(selectedTechnician.id, password);
        if (response.success) {
            setCurrentTechnician(selectedTechnician);
            localStorage.setItem('sessionToken', response.token);
            onLoginSuccess(selectedTechnician);
        }
    } catch (err) {
        setError(err.message);
    }
};
```

---

### 4. Absence de Validation des Inputs Utilisateur (HAUTE)

**Fichiers concernés:**
- `server/apiRoutes.js` (toutes les routes)
- `backend/services/dataService.js`
- `backend/services/userService.js`

**Problèmes identifiés:**

```javascript
// Exemple 1: Aucune validation des paramètres (apiRoutes.js ligne 77-80)
router.post('/computers', asyncHandler(async (req, res) => {
    const result = await dataService.saveComputer(req.body, getCurrentTechnician(req));
    // ❌ req.body n'est pas validé avant utilisation
}));

// Exemple 2: Injection SQL potentielle via LIKE (dataService.js ligne 150)
if (filters.userName) { 
    query += ' AND (userName = ? OR userDisplayName LIKE ?)'; 
    params.push(filters.userName, `%${filters.userName}%`);
    // ❌ Pas de limite sur la longueur de userName
}

// Exemple 3: Pas de validation des emails (userService.js ligne 91)
userData.email || ''
// ❌ Aucune validation du format email
```

**Impact:**
- ❌ Risque d'injection SQL (même avec paramètres préparés, via LIKE)
- ❌ Risque XSS si les données sont affichées sans sanitisation
- ❌ Déni de service (DoS) via inputs très longs
- ❌ Corruption de données invalides dans la base

**Recommandations:**

1. **Implémenter une bibliothèque de validation (Joi, Yup, Zod)**

```javascript
const Joi = require('joi');

const computerSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    brand: Joi.string().max(50),
    model: Joi.string().max(50),
    serialNumber: Joi.string().alphanum().min(5).max(50).required(),
    status: Joi.string().valid('available', 'loaned', 'maintenance', 'retired'),
    notes: Joi.string().max(500),
    // ...
});

router.post('/computers', asyncHandler(async (req, res) => {
    const { error, value } = computerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    const result = await dataService.saveComputer(value, getCurrentTechnician(req));
    // ...
}));
```

2. **Valider les emails:**

```javascript
const emailSchema = Joi.string().email().max(255);
```

3. **Limiter la longueur des inputs:**

```javascript
if (filters.userName && filters.userName.length > 100) {
    throw new Error('Nom d\'utilisateur trop long');
}
```

4. **Sanitiser les inputs HTML/XSS:**

```javascript
const sanitizeHtml = require('sanitize-html');
const cleanNotes = sanitizeHtml(req.body.notes, {
    allowedTags: [], // Aucune balise HTML autorisée
    allowedAttributes: {}
});
```

---

## 🟡 VULNÉRABILITÉS MOYENNES

### 5. Configuration CORS Permissive (MOYENNE)

**Fichier:** `server/server.js`  
**Lignes:** 34-55

```javascript
function getAllowedOrigins() {
    const origins = new Set();
    for (let i = 3000; i <= 3010; i++) {
        origins.add(`http://localhost:${i}`);
        origins.add(`http://127.0.0.1:${i}`);
    }
    // ❌ Accepte 22 origines différentes
}
```

**Impact:**
- ⚠️ Surface d'attaque élargie
- ⚠️ Risque de CSRF (Cross-Site Request Forgery) si un port est compromis
- ⚠️ Difficulté à tracer l'origine des requêtes

**Recommandations:**
1. Limiter à des ports spécifiques (3000 pour dev, port de production fixe)
2. Utiliser des variables d'environnement
3. Ajouter une protection CSRF

```javascript
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3002']  // Port de production uniquement
    : ['http://localhost:3000']; // Port React dev uniquement

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`❌ Origine refusée: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Pour les cookies/sessions
}));
```

---

### 6. Chemins Réseau UNC Hardcodés Sans Fallback (MOYENNE)

**Fichier:** `config/config.json`  
**Lignes:** 6-7

```json
{
  "excelFilePath": "\\\\192.168.1.230\\Donnees\\Informatique\\...",
  "databasePath": "\\\\192.168.1.230\\Donnees\\Informatique\\..."
}
```

**Impact:**
- ⚠️ Point de défaillance unique (SPOF)
- ⚠️ Pas de fallback si le serveur 192.168.1.230 est indisponible
- ⚠️ Adresse IP hardcodée (pas de résolution DNS)
- ⚠️ Pas de validation de la disponibilité du partage réseau

**Recommandations:**

1. **Utiliser des noms d'hôtes DNS:**

```json
{
  "excelFilePath": "\\\\SRV-DATA\\Donnees\\Informatique\\...",
  "databasePath": "\\\\SRV-DATA\\Donnees\\Informatique\\..."
}
```

2. **Implémenter un système de fallback:**

```javascript
const fs = require('fs');
const path = require('path');

function getDataPath(configPath) {
    const paths = [
        configPath, // Chemin réseau principal
        path.join(process.env.LOCALAPPDATA, 'RDSViewer', 'fallback.sqlite'), // Fallback local
        path.join(__dirname, 'data', 'emergency.sqlite') // Fallback d'urgence
    ];
    
    for (const p of paths) {
        try {
            // Tester l'accès
            if (p.startsWith('\\\\')) {
                // Partage réseau
                if (fs.existsSync(path.dirname(p))) return p;
            } else {
                // Chemin local
                fs.mkdirSync(path.dirname(p), { recursive: true });
                return p;
            }
        } catch (err) {
            console.warn(`⚠️ Chemin ${p} inaccessible:`, err.message);
        }
    }
    
    throw new Error('Aucun chemin de données accessible');
}
```

3. **Vérifier la disponibilité au démarrage:**

```javascript
function checkNetworkPath(uncPath) {
    return new Promise((resolve, reject) => {
        exec(`net use ${uncPath}`, (error) => {
            if (error) reject(new Error('Partage réseau inaccessible'));
            else resolve(true);
        });
    });
}
```

---

## 🟢 POINTS POSITIFS (Sécurité Electron)

### 7. Configuration Electron Sécurisée (BASSE)

**Fichier:** `electron/main.js`  
**Lignes:** 71-78

```javascript
webPreferences: {
    nodeIntegration: false,      // ✅ Correct
    contextIsolation: true,      // ✅ Correct
    enableRemoteModule: false,   // ✅ Correct
    preload: path.join(__dirname, 'preload.js') // ✅ Correct
}
```

**Analyse:**
- ✅ `nodeIntegration: false` empêche l'accès direct à Node.js depuis le renderer
- ✅ `contextIsolation: true` isole le contexte d'exécution
- ✅ `enableRemoteModule: false` désactive le module remote (vulnérable)
- ✅ Utilisation d'un script preload sécurisé avec `contextBridge`

**Preload Script (electron/preload.js):**
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    // ✅ APIs contrôlées et sécurisées
});
```

**Recommandations:**
- ✅ Configuration actuelle est correcte
- Ajouter Content Security Policy (CSP)

```javascript
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
        responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
            ]
        }
    });
});
```

---

## 🔐 AUTRES PROBLÈMES DE SÉCURITÉ

### 8. Gestion des Mots de Passe RDS

**Fichier:** `backend/services/userService.js`  
**Lignes:** 87, 92, 104, 185

```javascript
password = ?, officePassword = ?
// ❌ Mots de passe RDS stockés en clair dans SQLite
```

**Impact:**
- ❌ Mots de passe RDS des utilisateurs stockés en clair
- ❌ Accessible depuis `users` table (ligne 21 de databaseService.js)
- ❌ Également stockés en clair dans le fichier Excel

**Recommandations:**
1. Chiffrer les mots de passe avant stockage
2. Utiliser Windows Credential Manager pour les stocker
3. Ne pas afficher les mots de passe dans l'interface

---

### 9. Logs Verbeux en Production

**Fichier:** `electron/main.js`  
**Lignes:** 20-26

```javascript
function logToUI(level, ...args) {
    // ...
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('log-message', `[${level.toUpperCase()}] ${message}`);
    }
}
```

**Impact:**
- ⚠️ Logs détaillés envoyés à l'interface utilisateur
- ⚠️ Risque de fuite d'informations sensibles

**Recommandations:**
```javascript
const isDev = require('electron-is-dev');

function logToUI(level, ...args) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    log[level](...args);
    
    if (isDev && mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('log-message', `[${level.toUpperCase()}] ${message}`);
    }
}
```

---

### 10. Pas de Protection contre les Attaques XSS

**Fichiers:** Tous les composants React affichant du contenu utilisateur

**Problèmes:**
- ❌ Pas de sanitisation des inputs dans les composants React
- ❌ Risque XSS dans les notes, descriptions, messages chat

**Exemple vulnérable:**
```jsx
<Typography>{loan.notes}</Typography>
// Si loan.notes contient: <script>alert('XSS')</script>
```

**Recommandations:**

1. **Utiliser DOMPurify pour sanitiser:**

```javascript
import DOMPurify from 'dompurify';

<Typography 
    dangerouslySetInnerHTML={{ 
        __html: DOMPurify.sanitize(loan.notes) 
    }} 
/>
```

2. **Ou échapper le HTML:**

```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

---

## 📋 PLAN D'ACTION PRIORITAIRE

### Phase 1: URGENT (À faire immédiatement)

| Priorité | Vulnérabilité | Action | Temps estimé |
|----------|---------------|---------|--------------|
| 🔴 P0 | Credentials AD en clair | Implémenter DPAPI/Credential Manager | 2-3 jours |
| 🔴 P0 | Injection PowerShell | Sanitiser tous les inputs dans adService.js | 1-2 jours |
| 🟠 P1 | Authentification hardcodée | Implémenter système auth robuste | 3-4 jours |

### Phase 2: Important (Cette semaine)

| Priorité | Vulnérabilité | Action | Temps estimé |
|----------|---------------|---------|--------------|
| 🟠 P1 | Validation inputs | Ajouter Joi/Yup à toutes les routes | 2-3 jours |
| 🟡 P2 | CORS permissif | Restreindre les origines | 1 heure |
| 🟡 P2 | Chemins réseau | Implémenter fallback | 1 jour |

### Phase 3: Améliorations (Cette semaine)

| Priorité | Vulnérabilité | Action | Temps estimé |
|----------|---------------|---------|--------------|
| 🟡 P2 | Mots de passe RDS | Chiffrer les passwords | 1-2 jours |
| 🟢 P3 | Logs verbeux | Désactiver en prod | 1 heure |
| 🟢 P3 | Protection XSS | Ajouter DOMPurify | 2 heures |

---

## 🛠️ RECOMMANDATIONS GÉNÉRALES

### 1. Sécurité des Données

- [ ] Implémenter le chiffrement des données sensibles au repos
- [ ] Utiliser HTTPS pour toutes les communications (si exposé en réseau)
- [ ] Mettre en place une politique de rotation des mots de passe
- [ ] Sauvegarder régulièrement la base de données SQLite

### 2. Authentification et Autorisation

- [ ] Implémenter un système de rôles et permissions granulaires
- [ ] Ajouter une authentification à deux facteurs (2FA)
- [ ] Logger toutes les actions critiques (création/suppression)
- [ ] Implémenter une expiration de session

### 3. Surveillance et Audit

- [ ] Mettre en place des logs d'audit détaillés
- [ ] Monitorer les tentatives d'authentification échouées
- [ ] Alerter sur les activités suspectes
- [ ] Conserver les logs pendant minimum 90 jours

### 4. Infrastructure

- [ ] Isoler le serveur backend dans un VLAN sécurisé
- [ ] Utiliser un compte de service dédié avec permissions minimales
- [ ] Mettre en place un pare-feu applicatif
- [ ] Activer Windows Defender sur les postes clients

### 5. Développement Sécurisé

- [ ] Effectuer des revues de code systématiques
- [ ] Utiliser des outils d'analyse statique (SonarQube, ESLint)
- [ ] Scanner les dépendances npm (npm audit, Snyk)
- [ ] Mettre en place des tests de sécurité automatisés

---

## 📚 RÉFÉRENCES ET RESSOURCES

### Normes et Standards

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Outils Recommandés

- **Validation:** Joi, Yup, Zod
- **Chiffrement:** DPAPI (Windows), node-forge
- **Sanitisation:** DOMPurify, sanitize-html
- **Authentification:** Passport.js, jsonwebtoken
- **Audit:** npm audit, Snyk, WhiteSource

### Documentation

- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PowerShell Injection Prevention](https://docs.microsoft.com/en-us/powershell/scripting/dev-cross-plat/security/preventing-script-injection)

---

## ✅ CHECKLIST DE VALIDATION POST-CORRECTIFS

### Tests de Sécurité à Effectuer

- [ ] Test d'injection PowerShell (fuzzing avec caractères spéciaux)
- [ ] Test d'injection SQL (SQLMap si applicable)
- [ ] Test d'authentification (force brute, bypass)
- [ ] Test de gestion de session (timeout, vol de session)
- [ ] Test CORS (vérifier le blocage d'origines non autorisées)
- [ ] Test XSS (injection de scripts dans tous les champs)
- [ ] Test de validation des inputs (données invalides/extrêmes)
- [ ] Test de chiffrement (vérifier que les credentials ne sont plus en clair)
- [ ] Test de permissions (vérifier les autorisations AD)
- [ ] Scan de vulnérabilités des dépendances (npm audit)

---

## 📞 SUPPORT ET ASSISTANCE

Pour toute question concernant ce rapport ou l'implémentation des correctifs:

- **Équipe IT Anecoop:**
  - Kevin BIVIA (Chef de projet) - kevin.bivia@anecoop.fr
  - Meher BENHASSINE (Chef de projet) - meher.benhassine@anecoop.fr
  - Christelle MOLES (Responsable informatique) - christelle.moles@anecoop.fr

---

**Rapport généré automatiquement le 2025-11-02**  
**Prochaine révision recommandée: Après implémentation des correctifs P0 et P1**
