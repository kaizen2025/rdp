# 🚀 GUIDE DE DÉMARRAGE RAPIDE

## ⚡ Corriger le Démarrage MAINTENANT (< 1 heure)

Votre application ne démarre pas correctement car **2 problèmes bloquants** :

### 1. 🔴 Base de Données Réseau Inaccessible

**Symptôme:**
- Widget "Techniciens Connectés" = 0
- Erreur dans console backend: `ENOENT: no such file or directory`

**Diagnostic:**
```bash
# Vérifier accès au partage réseau (depuis serveur Node.js)
dir \\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\

# Doit afficher:
# rds_viewer_data.sqlite
# Data_utilisateur_partage.xlsx
# config/config.json
```

**Solutions possibles:**

**A. Partage non monté**
```cmd
# Windows: Mapper le lecteur réseau
net use Z: \\192.168.1.230\Donnees /persistent:yes
```

**B. Permissions insuffisantes**
- L'utilisateur qui lance Node.js doit avoir accès lecture/écriture
- Vérifier droits NTFS sur `\\192.168.1.230\Donnees`

**C. Firewall bloque SMB**
```cmd
# Tester connectivité SMB
ping 192.168.1.230
telnet 192.168.1.230 445
```

---

### 2. 🟡 Guacamole NON Installé (Shadow/RDP)

**Symptôme:**
```
WebSocket connection to 'ws://localhost:8080/guacamole/websocket-tunnel' failed
```

**IMPORTANT:** Vous avez abandonné Guacamole, donc :

**Solution Immédiate:**
```javascript
// src/pages/ConnectionsPage.js
// COMMENTER les boutons Shadow/RDP temporairement

{/* Temporairement désactivé - Guacamole retiré
<Tooltip title="Shadow (Prise de contrôle)">
  <IconButton onClick={() => handleShadow(session)}>
    <ScreenShareIcon />
  </IconButton>
</Tooltip>
*/}
```

**OU** (si vous voulez les garder pour plus tard) :
```javascript
// Afficher message "Fonctionnalité en développement"
<Tooltip title="Shadow - Bientôt disponible">
  <span>
    <IconButton disabled>
      <ScreenShareIcon />
    </IconButton>
  </span>
</Tooltip>
```

---

## ✅ PROCÉDURE DE DÉMARRAGE

### ÉTAPE 1: Vérifier Prérequis

```bash
# Node.js version (requis: 20.x)
node --version
# Doit afficher: v20.x.x

# Accès réseau
dir \\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\
# Doit lister: rds_viewer_data.sqlite, Data_utilisateur_partage.xlsx
```

---

### ÉTAPE 2: Installer Dépendances

```bash
cd /chemin/vers/rdp-project

# Nettoyer cache (si problème better-sqlite3)
npm run clean

# Installer
npm install

# Vérifier better-sqlite3
npm run check:deps
# Doit afficher: ✅ better-sqlite3 fonctionne correctement
```

**Si erreur better-sqlite3:**
```bash
npm rebuild better-sqlite3
# OU
npm run rebuild:native
```

---

### ÉTAPE 3: Configurer config.json

```bash
# Vérifier configuration
cat config/config.json | grep databasePath

# Doit pointer vers:
"databasePath": "\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\rds_viewer_data.sqlite"
```

**Si chemin incorrect:**
1. Ouvrir `config/config.json`
2. Modifier `databasePath` et `excelFilePath`
3. Sauvegarder

---

### ÉTAPE 4: Démarrer Application

**Mode Test (Browser uniquement):**
```bash
npm run test:app
```

Sortie attendue:
```
[SERVER] ✅ Configuration chargée
[SERVER] ✅ Base de données SQLite connectée
[SERVER] Serveur HTTP démarré sur http://localhost:3002
[SERVER] WebSocket démarré sur ws://localhost:3003
[REACT] Compilé avec succès!
[REACT] Application disponible: http://localhost:3000
```

**Mode Production (Electron):**
```bash
npm run dev:electron
```

---

### ÉTAPE 5: Vérifier Fonctionnement

1. **Ouvrir:** http://localhost:3000
2. **Login:**
   - Sélectionner un technicien
   - Mot de passe: `admin` (temporaire - à changer!)
3. **Dashboard:**
   - Techniciens Connectés: Doit afficher 1 (vous)
   - Sessions RDS: Charge les données
   - Serveurs RDS: Statut affiché

**Si Techniciens Connectés = 0:**
→ Problème base de données réseau (voir section 1)

---

## 🔧 DÉPANNAGE RAPIDE

### Erreur: "Port 3000 already in use"

```bash
# Windows
taskkill /IM node.exe /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**OU** laisser le système trouver automatiquement un port libre (3001, 3002, etc.)

---

### Erreur: "better-sqlite3 module not found"

```bash
npm rebuild better-sqlite3
npm run check:deps
```

---

### Erreur: "Cannot find module 'config.json'"

```bash
# Copier template
cp config/config.template.json config/config.json

# Éditer avec vos valeurs
nano config/config.json
```

---

### Erreur: "CORS not allowed"

**Cause:** React utilise 127.0.0.1 au lieu de localhost

**Solution:** Déjà corrigé dans `server/server.js` (lignes 15-40)
- Si persiste: Redémarrer complètement serveur

```bash
taskkill /IM node.exe /F
npm run test:app
```

---

## 📊 CHECKLIST POST-DÉMARRAGE

### Backend (http://localhost:3002)
- [ ] `/api/config` → Retourne configuration
- [ ] `/api/technicians/connected` → Liste techniciens
- [ ] `/api/sessions` → Liste sessions RDS
- [ ] Console: Aucune erreur rouge

### Frontend (http://localhost:3000)
- [ ] Login fonctionne
- [ ] Dashboard charge données
- [ ] Sidebar navigation OK
- [ ] Pas d'erreur console navigateur

### WebSocket (ws://localhost:3003)
- [ ] Connexion établie (voir console)
- [ ] Messages temps réel fonctionnent
- [ ] Notifications live

### Base de Données
- [ ] Fichier SQLite accessible
- [ ] Tables créées (voir `initdb.sql` SQLite version)
- [ ] Données techniciens présentes

---

## 🚨 PROBLÈMES CONNUS & SOLUTIONS

### 1. "Techniciens Connectés = 0"

**Causes possibles:**
1. Base de données réseau inaccessible
2. Permissions insuffisantes
3. Table `technician_presence` vide

**Solution:**
```sql
-- Se connecter à SQLite
sqlite3 "\\192.168.1.230\Donnees\...\rds_viewer_data.sqlite"

-- Vérifier données
SELECT * FROM technician_presence;

-- Si vide, créer entrée manuelle
INSERT INTO technician_presence (technician_id, technician_name, status, last_seen)
VALUES ('kevin_bivia', 'Kevin BIVIA', 'online', datetime('now'));
```

---

### 2. "Sessions RDS vides"

**Cause:** Serveurs RDS non accessibles ou credentials AD incorrects

**Vérification:**
```bash
# Tester connectivité serveurs RDS
ping SRV-RDS-1
ping SRV-RDS-2

# Vérifier credentials AD dans config.json
cat config/config.json | grep username
cat config/config.json | grep domain
```

**Solution:**
- Vérifier `config.json` → `domain`, `username`, `password`
- Tester connexion AD manuellement:
```powershell
Get-ADUser -Filter * -Credential (Get-Credential) -Server anecoopfr.local
```

---

### 3. "Shadow/RDP ne fonctionne pas"

**Normal:** Guacamole non installé (vous l'avez abandonné)

**Solutions:**
1. **Court terme:** Désactiver boutons Shadow/RDP (voir section 2)
2. **Moyen terme:** Utiliser `mstsc.exe` natif Windows
3. **Long terme:** Réintégrer Guacamole ou alternative

---

## 🎯 PROCHAINES ÉTAPES (Après Démarrage OK)

### Immédiat (Cette semaine)
1. ✅ Corriger bug `UsersManagementPage.js:149`
2. ✅ Remplacer auth hardcodée `password === 'admin'`
3. ✅ Activer ASAR (`"asar": true`)

### Court terme (2 semaines)
4. 🔐 Chiffrer credentials AD (DPAPI)
5. 🔒 Sanitiser inputs PowerShell
6. 💾 Backup SQLite automatique

### Moyen terme (1 mois)
7. 🧪 Tests unitaires (35% couverture)
8. 📊 Logging centralisé (winston)
9. ♻️ Retry DB connection

---

## 📞 SUPPORT

**Documentation complète:**
- [Rapport Complet](./00-RAPPORT-COMPLET.md)
- [Roadmap Visuelle](./ROADMAP-VISUELLE.md)
- [Architecture](./01-architecture.md)
- [Troubleshooting Original](../../TROUBLESHOOTING.md)

**Logs utiles:**
```bash
# Backend logs
cat logs/combined.log | tail -100

# Frontend logs
Ouvrir DevTools → Console

# SQLite logs
sqlite3 rds_viewer_data.sqlite ".log stdout"
```

**Commandes debug:**
```bash
# État serveur
curl http://localhost:3002/api/config

# Test WebSocket
wscat -c ws://localhost:3003

# Vérifier processus
tasklist | findstr node.exe
```

