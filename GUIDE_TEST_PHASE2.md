# 🧪 Guide de Test Rapide - Phase 2

**Tests des 6 nouvelles catégories d'améliorations**

---

## ⚡ Test express (15 min)

### 1. Mode sombre (2 min)
```bash
npm run dev
```
- Cliquer sur l'icône 🌙 dans le header
- Vérifier que tout bascule en mode sombre
- Rafraîchir la page → le mode doit rester sombre
- Re-cliquer → retour au mode clair

✅ **Résultat attendu :** Persistance fonctionnelle

---

### 2. Dashboard widgets (3 min)
- Aller sur la page Dashboard
- Essayer de déplacer un widget (drag & drop)
- Essayer de redimensionner (coin bas-droit)
- Cliquer sur la roue des paramètres

✅ **Résultat attendu :** Widgets interactifs

---

### 3. Import utilisateurs (3 min)
- Page Gestion Utilisateurs
- Cliquer "Import CSV/Excel"
- Créer un fichier test `users.csv` :
```csv
username,email,fullName,department
testuser,test@example.com,Test User,IT
```
- Glisser-déposer le fichier
- Vérifier validation

✅ **Résultat attendu :** Prévisualisation + validation

---

### 4. Générateur mot de passe (2 min)
- Cliquer sur bouton "Générer mot de passe"
- Entrer Prénom: Kevin, Nom: Bivia
- Cliquer "Générer"

✅ **Résultat attendu :** Format `kb3272XM&` (1 lettre prénom + 1 lettre nom + 4 chiffres + 2 maj + 1 spécial)

---

### 5. Timeline sessions (2 min)
- Page Sessions RDS
- Regarder le graphique timeline
- Changer le type (ligne/zone)

✅ **Résultat attendu :** Graphique animé

---

### 6. Alertes inventaire (3 min)
- Page Inventaire
- Ajouter manuellement un équipement avec garantie expirée
- Vérifier qu'une alerte rouge apparaît

✅ **Résultat attendu :** Badge "Critique" visible

---

## 🔧 Test optimisation BDD (5 min)

```bash
# Fermer l'application d'abord
npm run optimize:db
```

✅ **Résultat attendu :**
```
🚀 Démarrage de l'optimisation complète...
💾 Création du backup...
📊 Création des indexes...
🗜️  Compactage de la base de données...
✅ Optimisation terminée avec succès !
```

---

## 📸 Screenshots à vérifier

1. **Mode sombre activé** → Tout en noir/gris foncé
2. **Dashboard avec 4 widgets** → Grille responsive
3. **Carte thermique** → Gradient vert/orange/rouge
4. **Top 10 utilisateurs** → Médailles or/argent/bronze
5. **Import CSV** → Tableau de validation
6. **Générateur mdp** → Format affiché
7. **Timeline sessions** → Graphique avec 2 courbes
8. **Alertes sessions** → Badge rouge avec compteur
9. **Upload photos** → Grid 3x3 de miniatures
10. **Alertes garantie** → Liste avec puces rouges

---

## 🐛 Problèmes courants et solutions

### "Module not found: react-grid-layout"
```bash
npm install react-grid-layout react-resizable
```

### Mode sombre ne fonctionne pas
- Vérifier que `ThemeModeProvider` entoure bien toute l'app dans App.js

### Widgets ne se redimensionnent pas
- Importer les CSS :
```js
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
```

### Script BDD : "database is locked"
- Fermer complètement l'application avant d'exécuter

---

## ✅ Checklist complète

- [ ] Mode sombre toggle fonctionne
- [ ] Dashboard widgets redimensionnables
- [ ] Carte thermique affiche des données
- [ ] Top utilisateurs classement visible
- [ ] Filtres temporels changent les données
- [ ] Export PDF/Excel télécharge
- [ ] Import CSV valide le format
- [ ] Actions masse (tester activer 3 users)
- [ ] Générateur mdp respecte format Anecoop
- [ ] Historique modifs affiche avant/après
- [ ] Timeline sessions affiche graphique
- [ ] Alertes sessions détecte > 24h
- [ ] Upload photos fonctionne
- [ ] Alertes garantie affiche expirées
- [ ] Script optimisation BDD s'exécute
- [ ] Backup BDD créé dans /backups

---

## 🚀 Si tout fonctionne

**Félicitations ! Vous avez :**
- ✅ 21 composants fonctionnels (Phase 1 + Phase 2)
- ✅ Dashboard niveau enterprise
- ✅ Gestion utilisateurs professionnelle
- ✅ Monitoring avancé
- ✅ Mode sombre
- ✅ BDD optimisée

**Build production :**
```bash
npm run build:exe
```

Votre `RDS Viewer Anecoop v3.0.27` est prêt ! 🎉
