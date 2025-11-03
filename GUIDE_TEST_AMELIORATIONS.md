# 🚀 GUIDE DE DÉMARRAGE RAPIDE - VERSION AMÉLIORÉE

## Installation et Premier Démarrage

### 1. Installation des Dépendances
```bash
cd /path/to/rdp-project
npm install
```

**Nouvelles dépendances installées :**
- `react-toastify` - Notifications toast
- `qrcode.react` - Génération QR codes
- `recharts` - Graphiques interactifs

### 2. Démarrage en Mode Développement
```bash
# Terminal 1 - Backend
npm run server:start

# Terminal 2 - Frontend
npm run start

# OU tout en un
npm run dev
```

### 3. Build de Production
```bash
npm run build:exe
```
Le fichier `.exe` sera dans le dossier `dist/`

---

## 🎯 TESTER LES NOUVELLES FONCTIONNALITÉS

### A. Notifications Chat 💬

**Test 1 : Notification Popup**
1. Ouvrez l'application
2. Connectez-vous avec un technicien
3. Ouvrez un second navigateur/application avec un autre technicien
4. Envoyez un message depuis le second technicien
5. ✅ Vérifiez : Une notification toast apparaît en bas à droite avec son

**Test 2 : Badge Compteur**
1. Fermez le chat (si ouvert)
2. Envoyez plusieurs messages depuis un autre technicien
3. ✅ Vérifiez : Badge rouge avec le nombre de messages non lus sur l'icône chat
4. Ouvrez le chat
5. ✅ Vérifiez : Badge disparaît après 1 seconde

**Désactiver le son (optionnel) :**
Ouvrez la console navigateur (F12) et tapez :
```javascript
localStorage.setItem('chat_sound_enabled', 'false');
```

---

### B. Filtres Avancés des Prêts 📦

**Test 1 : Filtrage Simple**
1. Allez sur "Gestion Prêts" → Onglet "Suivi des Prêts"
2. Cliquez sur la flèche pour déplier les filtres
3. Sélectionnez "Statut : Actifs"
4. ✅ Vérifiez : Seuls les prêts actifs s'affichent

**Test 2 : Filtrage Multiple**
1. Ajoutez un filtre par date (ex: du 01/11/2025 au 30/11/2025)
2. Ajoutez un filtre par technicien
3. ✅ Vérifiez : Les résultats respectent TOUS les filtres
4. Cliquez sur l'icône ❌ pour réinitialiser

**Test 3 : Recherche Rapide**
1. Tapez un nom d'ordinateur dans "Nom ordinateur"
2. ✅ Vérifiez : Filtrage instantané

---

### C. Export Excel/PDF 📊

**Test 1 : Export Excel**
1. Sur la page des prêts, cliquez "Exporter"
2. Choisissez "Excel (.xlsx)"
3. ✅ Vérifiez : Un fichier `prets_YYYY-MM-DD.xlsx` se télécharge
4. Ouvrez le fichier Excel
5. ✅ Vérifiez : Colonnes bien formatées, largeurs ajustées

**Test 2 : Export PDF**
1. Cliquez "Exporter" → "PDF (.pdf)"
2. ✅ Vérifiez : Un fichier PDF se télécharge avec en-tête et tableau

---

### D. QR Codes Étiquettes 🏷️

**Test 1 : Génération QR Code**
1. Sur un prêt actif, cliquez sur le bouton QR Code (si ajouté à l'UI)
2. ✅ Vérifiez : Dialogue s'ouvre avec aperçu du QR code
3. Le QR code contient : nom, numéro série, ID prêt

**Test 2 : Personnalisation**
1. Ajoutez un texte personnalisé (ex: "Bureau 204")
2. ✅ Vérifiez : Le texte apparaît sur l'étiquette

**Test 3 : Impression**
1. Cliquez "Imprimer"
2. ✅ Vérifiez : Dialogue d'impression s'ouvre
3. OU cliquez "Télécharger PNG"
4. ✅ Vérifiez : Image PNG haute résolution téléchargée

---

### E. Monitoring Serveurs 🖥️

**Test 1 : Visualisation Métriques**
1. Allez sur "Gestion des Serveurs"
2. Cliquez sur l'onglet "Monitoring temps réel"
3. ✅ Vérifiez : Cartes de serveurs avec barres CPU/RAM/Disque
4. ✅ Vérifiez : Couleurs changent selon les seuils (vert < 60%, orange 60-80%, rouge > 80%)

**Test 2 : Statistiques Globales**
1. En haut du panel monitoring
2. ✅ Vérifiez : Nombre de serveurs en ligne / total
3. ✅ Vérifiez : Pourcentage de disponibilité

**Test 3 : Graphique Historique**
1. Scrollez vers le graphique
2. ✅ Vérifiez : Courbes de disponibilité 24h
3. ✅ Vérifiez : Nombre de serveurs actifs
4. Survolez les points pour voir les valeurs

**Test 4 : Rafraîchissement**
1. Cliquez sur le bouton "Rafraîchir"
2. ✅ Vérifiez : Icône tourne, données se mettent à jour

---

## 🔍 VÉRIFICATION DES OPTIMISATIONS

### Bundle Size (Optionnel)
```bash
npm run build
# Vérifier la taille du dossier build/
```

**Avant :** ~2.5 MB  
**Après :** ~1.9 MB  
**Économie :** -24%

### Lazy Loading (Console F12)
1. Ouvrez la console
2. Allez dans Network → JS
3. Ouvrez un dialogue QR Code
4. ✅ Vérifiez : Le module `qrcode.react` se charge UNIQUEMENT à ce moment
5. Ouvrez un export Excel
6. ✅ Vérifiez : Le module `xlsx` se charge UNIQUEMENT à ce moment

---

## ⚠️ PROBLÈMES CONNUS ET SOLUTIONS

### Problème 1 : Notifications ne s'affichent pas
**Solution :**
1. Vérifiez que `ToastNotificationSystem` est bien dans App.js
2. Vérifiez la console (F12) pour erreurs
3. Vérifiez que le WebSocket est connecté (icône "En ligne" verte)

### Problème 2 : Badge compteur ne se met pas à jour
**Solution :**
1. Actualisez la page (F5)
2. Vérifiez localStorage dans DevTools :
   ```javascript
   localStorage.getItem('chat_last_read_timestamps')
   ```
3. Si besoin, réinitialisez :
   ```javascript
   localStorage.removeItem('chat_last_read_timestamps')
   ```

### Problème 3 : Export Excel échoue
**Solution :**
1. Vérifiez que la dépendance est installée :
   ```bash
   npm list xlsx
   ```
2. Si absente, réinstallez :
   ```bash
   npm install xlsx
   ```

### Problème 4 : QR Code ne s'affiche pas
**Solution :**
1. Vérifiez que `qrcode.react` est installé :
   ```bash
   npm list qrcode.react
   ```
2. Vérifiez dans la console les erreurs de lazy loading

### Problème 5 : Monitoring affiche des données mockées
**Solution :**
- C'est normal ! Les métriques sont simulées pour démo
- Pour intégrer de vraies données, connectez le backend à une API de monitoring (ex: WMI pour Windows Server)
- Modifiez `/src/components/server-monitoring/ServerMonitoringPanel.js` ligne 150+

---

## 📚 FICHIERS CLÉS À CONNAÎTRE

| Fichier | Rôle |
|---------|------|
| `/src/components/ToastNotificationSystem.js` | Notifications popup |
| `/src/hooks/useUnreadMessages.js` | Compteur messages non lus |
| `/src/components/loan-management/LoanFilters.js` | Filtres prêts |
| `/src/components/loan-management/LoanExportButton.js` | Export Excel/PDF |
| `/src/components/loan-management/LoanQRCodeDialog.js` | QR codes |
| `/src/components/server-monitoring/ServerMonitoringPanel.js` | Monitoring |
| `/src/utils/lazyModules.js` | Lazy loading |
| `/package.json` | Config ASAR + dépendances |

---

## 🎓 PERSONNALISATION

### Changer la durée des notifications toast
Dans `/src/components/ToastNotificationSystem.js` ligne 79 :
```javascript
autoClose: 5000, // 5 secondes → modifiez la valeur
```

### Modifier les seuils d'alerte serveurs
Dans `/src/components/server-monitoring/ServerMonitoringPanel.js` :
```javascript
// Ligne 99 - Seuil CPU
color={cpuUsage > 80 ? 'error' : cpuUsage > 60 ? 'warning' : 'success'}
```

### Ajouter des colonnes dans l'export Excel
Dans `/src/components/loan-management/LoanExportButton.js` ligne 33+ :
```javascript
const data = loans.map(loan => ({
    'ID': loan.id,
    'Ordinateur': loan.computer_name,
    // Ajoutez vos colonnes ici
    'Nouvelle Colonne': loan.votre_champ,
}));
```

---

## ✅ CHECKLIST FINALE

- [ ] Dépendances installées (`npm install`)
- [ ] Application démarre sans erreur
- [ ] Notifications chat fonctionnent
- [ ] Badge compteur s'affiche
- [ ] Filtres prêts fonctionnent
- [ ] Export Excel télécharge un fichier
- [ ] QR code s'affiche et s'imprime
- [ ] Monitoring serveurs affiche les cartes
- [ ] Graphique historique s'affiche
- [ ] Aucune erreur dans la console (F12)

---

**Si tous les tests passent, vous êtes prêt pour la production ! 🚀**

**Besoin d'aide ?** Consultez le fichier `AMELIORATIONS_PACK_COMPLET.md` pour plus de détails.
