# 🗺️ ROADMAP VISUELLE - RDS VIEWER

## 📅 PLANNING GLOBAL

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TIMELINE 2025-2026                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Phase 1 │████████│ SÉCURITÉ (5-7j)                                │
│          └─────────┘                                                │
│                                                                     │
│  Phase 2         │████████████████│ STABILITÉ (2-3 sem)            │
│                  └──────────────────┘                               │
│                                                                     │
│  Phase 3                           │████████████████████│           │
│                                    └────────────────────┘           │
│                                    QUALITÉ (1-2 mois)               │
│                                                                     │
│  Phase 4                                                │██████████ │
│                                                         └───────────┘
│                                                   OPTIMISATION (2-3m)│
│                                                                     │
│  Nov   Dec   Jan   Fév   Mar   Avr   Mai   Jui   Jui   Aoû   Sep  │
│  2025  2025  2026  2026  2026  2026  2026  2026  2026  2026  2026 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST PHASE 1 - SÉCURITÉ (5-7 jours)

### Jour 1-2: Chiffrement Credentials AD

**Fichiers à modifier:**
- [ ] `backend/services/configService.js` - Ajouter déchiffrement DPAPI
- [ ] `config/config.json` - Remplacer password par encryptedPassword
- [ ] Créer script `scripts/encrypt-password.js` pour générer hash

**Tests:**
- [ ] Connexion AD fonctionne avec password chiffré
- [ ] Password non visible dans config.json
- [ ] Logs ne contiennent pas le password

**Commande de test:**
```bash
node scripts/encrypt-password.js "vCQhNZ2aY2v!"
# Output: { encryptedPassword: "BASE64_STRING" }
```

---

### Jour 3-4: Sanitisation PowerShell

**Fichiers à modifier:**
- [ ] `backend/services/adService.js` - Ajouter fonction sanitizePowerShellInput()
- [ ] Appliquer à 18 fonctions (searchAdUsers, searchAdGroups, etc.)
- [ ] Ajouter tests unitaires pour injection

**Fonctions à corriger:**
```
✅ searchAdUsers (ligne 18)
✅ searchAdGroups (ligne 34)
✅ searchAdComputers (ligne 54)
✅ getUserDetails (ligne 82)
✅ getGroupMembers (ligne 203)
... (13 autres)
```

**Tests:**
- [ ] `searchAdUsers("test'; Get-ADUser -All")` → échappé correctement
- [ ] Aucun caractère spécial passe (`'; " $ | & < > ( )`)
- [ ] Résultats valides avec accents (é, è, à)

---

### Jour 5: Authentification Sécurisée

**Fichiers à modifier:**
- [ ] `src/pages/LoginPage.js` - Remplacer `if (password === 'admin')`
- [ ] `server/apiRoutes.js` - Ajouter endpoint `/api/auth/login`
- [ ] `backend/services/authService.js` - **NOUVEAU** - Hash bcrypt

**Nouveau système:**
```javascript
// authService.js
const bcrypt = require('bcrypt');
const technicianPasswords = {
  'kevin_bivia': '$2b$10$HASH_BCR YPT...',
  'meher_benhassine': '$2b$10$HASH_BCRYPT...'
};

async function verifyPassword(technicianId, password) {
  const hash = technicianPasswords[technicianId];
  return await bcrypt.compare(password, hash);
}
```

**Tests:**
- [ ] Login avec bon mot de passe réussit
- [ ] Login avec mauvais mot de passe échoue
- [ ] Passwords jamais loggés en clair

---

### Jour 6: Backup SQLite Automatique

**Fichiers à créer:**
- [ ] `backend/services/backupService.js` - Service backup complet
- [ ] `server/server.js` - Intégrer backup au démarrage

**Fonctionnalités:**
- [ ] Backup automatique au démarrage serveur
- [ ] Cron job quotidien à 2h du matin
- [ ] Rotation 30 jours (suppression anciens backups)
- [ ] Logs de chaque backup créé

**Vérification:**
```bash
# Vérifier dossier backups créé
ls "\\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\backups"

# Doit contenir:
# rds_viewer_2025-11-02T02-00-00.sqlite
# rds_viewer_2025-11-03T02-00-00.sqlite
# ...
```

---

### Jour 7: Verrous Excel Exclusifs

**Fichiers à modifier:**
- [ ] `backend/services/excelService.js` - Ajouter proper-lockfile
- [ ] Installer dépendance: `npm install proper-lockfile`

**Code à ajouter:**
```javascript
const lockfile = require('proper-lockfile');

async function writeExcelSafe(workbook, filePath) {
  let release;
  try {
    // Verrouillage exclusif
    release = await lockfile.lock(filePath, { retries: 5 });
    
    XLSX.writeFile(workbook, filePath);
    
  } finally {
    if (release) await release();
  }
}
```

**Tests:**
- [ ] Écriture simultanée de 2 techniciens → 1 attend l'autre
- [ ] Pas de corruption fichier Excel
- [ ] Lock libéré même en cas d'erreur

---

## ✅ CHECKLIST PHASE 2 - STABILITÉ (2-3 semaines)

### Semaine 1: Résilience Réseau

**Retry DB Connection:**
- [ ] `backend/services/databaseService.js` - Fonction connectWithRetry()
- [ ] Backoff exponentiel (2s, 4s, 8s, 16s)
- [ ] 5 tentatives max
- [ ] Logs de chaque tentative

**WebSocket Heartbeat:**
- [ ] `server/server.js` - Ping/pong toutes les 30s
- [ ] Détection clients morts
- [ ] Fermeture automatique connexions zombies
- [ ] Logs déconnexions détectées

**Tests:**
- [ ] Débrancher câble réseau → app retry automatiquement
- [ ] Tuer WebSocket → reconnexion auto frontend
- [ ] 100 clients connectés → pas de memory leak

---

### Semaine 2: Error Handling

**Error Boundaries React:**
- [ ] `src/components/common/ErrorBoundary.js` - Créer composant
- [ ] Wrapper dans `App.js`
- [ ] Fallback UI élégant
- [ ] Logging erreurs vers backend

**Logging Centralisé:**
- [ ] Installer winston: `npm install winston`
- [ ] `backend/services/logService.js` - Configuration logs
- [ ] Niveaux: error, warn, info, debug
- [ ] Fichiers rotatifs (max 10MB, 7 jours)

**Structure logs:**
```
logs/
├── error.log (erreurs uniquement)
├── combined.log (tout)
└── archives/
    ├── error-2025-11-01.log
    └── combined-2025-11-01.log
```

---

### Semaine 3: Tests Unitaires

**Objectif:** 35% couverture (actuellement 2%)

**Tests prioritaires:**
- [ ] `backend/services/adService.test.js` - Injection PowerShell
- [ ] `backend/services/databaseService.test.js` - Queries + transactions
- [ ] `backend/services/excelService.test.js` - Lecture/écriture
- [ ] `src/contexts/AppContext.test.js` - WebSocket events
- [ ] `src/components/common/SearchInput.test.js` - Debounce

**Commandes:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm run test -- --coverage
```

**Critères succès:**
- [ ] Coverage > 35%
- [ ] 0 tests failing
- [ ] Tests s'exécutent en < 30s

---

## ✅ CHECKLIST PHASE 3 - QUALITÉ (1-2 mois)

### Mois 1: PropTypes & Hooks Réutilisables

**PropTypes (35 composants):**
```javascript
// Exemple: src/components/common/StatCard.js
import PropTypes from 'prop-types';

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  icon: PropTypes.elementType,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error']),
  trend: PropTypes.number,
  onClick: PropTypes.func
};
```

**Checklist:**
- [ ] 7 composants `common/` (StatCard, SearchInput, etc.)
- [ ] 25 Dialogs (LoanDialog, UserDialog, etc.)
- [ ] 3 autres (Sidebar, OfflineBanner, etc.)

**Hooks réutilisables à créer:**

1. **useFormDialog.js** (400 lignes sauvées)
```javascript
function useFormDialog(initialValues, validationSchema) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  
  const handleChange = (field, value) => { /* ... */ };
  const validate = () => { /* ... */ };
  const reset = () => { /* ... */ };
  
  return { values, errors, handleChange, validate, reset, isDirty };
}
```

Utiliser dans: LoanDialog, UserDialog, ComputerDialog, MaintenanceDialog

2. **useFilteredList.js** (300 lignes sauvées)
```javascript
function useFilteredList(data, filters, searchFields) {
  return useMemo(() => {
    return data.filter(item => {
      // Logique filtrage générique
      if (filters.search) {
        const matchSearch = searchFields.some(field =>
          item[field]?.toLowerCase().includes(filters.search.toLowerCase())
        );
        if (!matchSearch) return false;
      }
      
      // Autres filtres...
      return true;
    });
  }, [data, filters, searchFields]);
}
```

Utiliser dans: UsersManagementPage, ComputersPage, SessionsPage, etc.

---

### Mois 2: Refactoring & Tests E2E

**Refactoring gros composants:**
- [ ] ComputerDialog.js (525 lignes) → 3 composants
  - ComputerForm.js (200 lignes)
  - ComputerHistory.js (150 lignes)
  - ComputerActions.js (100 lignes)

- [ ] UserAdActionsMenu.js (399 lignes) → Hook useAdActions
- [ ] ConnectionsPage.handleDragEnd (85 lignes) → useDragAndDrop hook

**Tests E2E Cypress:**
```bash
npm install --save-dev cypress @testing-library/cypress
npx cypress open
```

**Scénarios critiques:**
1. [ ] Login → Dashboard → Voir statistiques
2. [ ] Créer prêt → Prolonger → Retourner
3. [ ] Chercher utilisateur AD → Activer/Désactiver
4. [ ] Envoyer message chat → Recevoir réponse
5. [ ] Déconnecter réseau → Mode offline → Reconnexion

---

## ✅ CHECKLIST PHASE 4 - OPTIMISATION (2-3 mois)

### Performance Bundle

**Lazy Loading PDF:**
```javascript
// Avant (280KB chargés au démarrage)
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Après (chargés seulement si impression)
const generatePDF = async () => {
  const [jsPDF, html2canvas] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);
  // ...
};
```

**Favicon Optimisé:**
- [ ] Compresser `public/favicon.ico` : 162KB → 15KB
- [ ] Outil: https://realfavicongenerator.net/
- [ ] Formats: 16x16, 32x32, 48x48 uniquement

**ASAR Activé:**
```javascript
// package.json
{
  "build": {
    "asar": true  // ← Changer false → true
  }
}
```

**Gains totaux:**
- **-430KB** bundle
- **-1.3s** startup
- **Code source protégé** dans .exe

---

### Accessibilité (RGAA)

**Labels ARIA manquants:**
```javascript
// Avant
<IconButton onClick={handleRefresh}>
  <RefreshIcon />
</IconButton>

// Après
<IconButton 
  onClick={handleRefresh}
  aria-label="Rafraîchir la liste"
  title="Rafraîchir la liste"
>
  <RefreshIcon />
</IconButton>
```

**Checklist:**
- [ ] 50+ IconButtons sans aria-label → Ajouter
- [ ] Contraste couleurs > 4.5:1 (vérifier avec axe DevTools)
- [ ] Navigation clavier complète (Tab, Shift+Tab, Enter, Escape)
- [ ] Screen reader friendly (tester avec NVDA)

---

### Tests de Charge

**WebSocket Stress Test:**
```javascript
// tests/stress/websocket-load.js
const WebSocket = require('ws');

async function stressTest() {
  const clients = [];
  
  // Simuler 200 clients connectés
  for (let i = 0; i < 200; i++) {
    const ws = new WebSocket('ws://localhost:3003');
    clients.push(ws);
  }
  
  // Envoyer 100 messages/seconde pendant 10 minutes
  // Mesurer:
  // - Latence moyenne
  // - Memory leak?
  // - CPU usage
}
```

**Critères succès:**
- [ ] 200 clients → Latence < 100ms
- [ ] 0 memory leak après 1h
- [ ] CPU backend < 30%

---

## 📊 INDICATEURS DE SUCCÈS (KPIs)

### Phase 1 - Sécurité
```
┌──────────────────────────────────────┐
│  Vulnérabilités Critiques            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Avant:  ████████ 3                  │
│  Après:  ░░░░░░░░ 0 ✅               │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Score npm audit                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Avant:  ? critical                  │
│  Après:  0 critical ✅               │
└──────────────────────────────────────┘
```

### Phase 2 - Stabilité
```
┌──────────────────────────────────────┐
│  Couverture Tests                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Avant:  ██░░░░░░░░ 2%               │
│  Après:  ████████░░ 35% ✅           │
│  Cible:  ██████████ 70%              │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Uptime Production                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Avant:  ████████░░ 85%              │
│  Après:  ██████████ 99.5% ✅         │
└──────────────────────────────────────┘
```

### Phase 3 - Qualité
```
┌──────────────────────────────────────┐
│  Code Dupliqué                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Avant:  ████████████░░ 15%          │
│  Après:  ████░░░░░░░░░░ 4% ✅        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  PropTypes Coverage                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Avant:  ░░░░░░░░░░ 0/35             │
│  Après:  ██████████ 35/35 ✅         │
└──────────────────────────────────────┘
```

### Phase 4 - Performance
```
┌──────────────────────────────────────┐
│  Temps Démarrage                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Avant:  ██████████████ 25s          │
│  Après:  ████████░░░░░░ 15s ✅       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Taille Bundle                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Avant:  ██████████████ 3.5 MB       │
│  Après:  ██████████░░░░ 2.7 MB ✅    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Score Accessibilité                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Avant:  ████████░░ 60%              │
│  Après:  ██████████ 90% ✅           │
└──────────────────────────────────────┘
```

---

## 🎯 PRIORITÉS PAR RÔLE

### Chef de Projet
**Focus:** Phases 1-2 (Sécurité + Stabilité)
- [ ] Valider budget 25-30 jours de dev
- [ ] Planifier sprints 2 semaines
- [ ] Revue hebdomadaire avec équipe
- [ ] Démo utilisateurs après chaque phase

### Lead Developer
**Focus:** Architecture + Code Review
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Pre-commit hooks (ESLint + Prettier)
- [ ] Code review mandatory
- [ ] Pair programming sessions critiques

### QA Tester
**Focus:** Tests + Validation
- [ ] Créer test plan complet
- [ ] Tests manuels après chaque sprint
- [ ] Automatiser tests E2E Cypress
- [ ] Validation accessibilité (NVDA)

### DevOps
**Focus:** Déploiement + Monitoring
- [ ] Setup logs centralisés
- [ ] Alertes si erreur critique
- [ ] Backups automatiques validés
- [ ] Rollback plan documenté

---

## 📆 CALENDRIER DÉTAILLÉ

### Novembre 2025
```
Sem 1 │ ████ Phase 1 Sécurité
Sem 2 │ ████ Phase 1 Sécurité (fin)
Sem 3 │ ████ Phase 2 Stabilité
Sem 4 │ ████ Phase 2 Stabilité
```

### Décembre 2025 - Janvier 2026
```
Déc S1-S2 │ ████ Phase 2 Stabilité (fin)
Déc S3-S4 │ ████ Phase 3 Qualité
Jan S1-S4 │ ████ Phase 3 Qualité
```

### Février - Avril 2026
```
Fév-Avr │ ████ Phase 4 Optimisation
```

### Mai 2026
```
Production Stable 🎉
```

---

## 🔗 LIENS UTILES

### Outils Recommandés
- **Sécurité:** https://snyk.io (scan npm)
- **Tests:** https://www.cypress.io (E2E)
- **Performance:** https://www.npmjs.com/package/source-map-explorer
- **Accessibilité:** https://www.deque.com/axe/devtools/

### Formation
- **React Performance:** https://react.dev/learn/render-and-commit
- **Electron Security:** https://www.electronjs.org/docs/latest/tutorial/security
- **SQLite Perf:** https://www.sqlite.org/optoverview.html

### Support
- **Documentation complète:** `/docs/analysis/00-RAPPORT-COMPLET.md`
- **Issues GitHub:** À créer pour chaque bug/amélioration
- **Wiki interne:** Documenter décisions techniques

