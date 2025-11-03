# DEMARRAGE RAPIDE - AGENT IA LOCAL

## ETAPES POUR LANCER L'AGENT IA

### 1. Installation dependances (en cours)

```bash
cd /workspace/code/rdp-project
npm install
```

Les nouvelles dependances IA sont en cours d'installation :
- node-nlp (NLP francais/espagnol)
- compromise (analyse linguistique)
- natural (TF-IDF, recherche)
- pdf-parse, mammoth, pizzip (parsing documents)
- tesseract.js (OCR images)
- brain.js (machine learning)
- multer (upload fichiers)

### 2. Lancer l'application

Une fois l'installation terminee :

**Mode developpement**
```bash
npm run dev
```

Cela lance :
- Serveur backend sur port 3002
- React frontend sur port 3000
- WebSocket sur port 3003

**Mode production**
```bash
npm run build
npm start
```

### 3. Acceder a l'Assistant IA

1. Ouvrir navigateur : http://localhost:3000
2. Se connecter avec compte technicien
3. Cliquer sur onglet "Assistant IA" dans menu principal
4. L'interface comporte 3 sections :
   - **Chat** : Conversation avec l'IA
   - **Upload** : Ajouter documents
   - **Documents** : Gerer documents indexes

### 4. Premier usage

**Uploader des documents**
1. Aller onglet "Upload"
2. Glisser-deposer fichiers ou cliquer pour selectionner
3. Formats supportes : PDF, Word, Excel, PowerPoint, images, texte
4. Attendre indexation (quelques secondes par fichier)

**Poser une question**
1. Aller onglet "Chat"
2. Taper question en francais ou espagnol
3. Exemple : "Comment creer un utilisateur RDS ?"
4. L'IA repond avec extraits documents indexes

### 5. Verification fonctionnement

**Tester endpoint health**
```bash
curl http://localhost:3002/api/ai/health
```

Reponse attendue :
```json
{
  "success": true,
  "status": "ready",
  "initialized": true
}
```

**Verifier statistiques**
```bash
curl http://localhost:3002/api/ai/statistics
```

---

## FICHIERS CREES

### Backend Services
```
backend/services/ai/
  ├── aiService.js              (orchestrateur principal)
  ├── documentParserService.js  (parsing multi-formats)
  ├── nlpService.js             (traitement NLP)
  ├── vectorSearchService.js    (recherche semantique)
  ├── conversationService.js    (gestion conversations)
  └── aiDatabaseService.js      (persistence SQLite)

backend/schemas/
  └── ai_schema.sql             (schema base donnees)

server/
  └── aiRoutes.js               (routes API)
```

### Frontend Components
```
src/components/ai/
  ├── ChatInterface.js          (interface chat)
  └── DocumentUploader.js       (upload documents)

src/pages/
  └── AIAssistantPage.js        (page principale)
```

### Fichiers modifies
```
package.json                    (dependances ajoutees)
server/server.js                (routes IA integrees)
src/layouts/MainLayout.js       (menu et route ajoutes)
```

---

## COMMANDES UTILES

### Developement
```bash
# Lancer mode dev
npm run dev

# Lancer seulement serveur
npm run server:dev

# Lancer seulement frontend
npm start
```

### Administration IA
```bash
# Voir statistiques
curl http://localhost:3002/api/ai/statistics

# Lister documents
curl http://localhost:3002/api/ai/documents

# Nettoyer base
curl -X POST http://localhost:3002/api/ai/cleanup

# Reinitialiser IA
curl -X POST http://localhost:3002/api/ai/reset
```

### Logs
```bash
# Logs serveur (terminal backend)
# Affiche : parsing documents, requetes IA, erreurs

# Logs frontend (DevTools navigateur)
# F12 > Console : interactions utilisateur
```

---

## TROUBLESHOOTING

### Probleme : "Cannot find module 'node-nlp'"
**Solution** : Attendre fin installation npm, puis relancer

### Probleme : Agent IA ne repond pas
**Verification** :
1. Verifier serveur demarre : `curl http://localhost:3002/api/ai/health`
2. Verifier documents indexes : onglet "Documents"
3. Consulter logs serveur pour erreurs

### Probleme : Upload document echoue
**Verification** :
1. Taille fichier < 50 MB
2. Format supporte (PDF, Word, Excel, PPT, images, texte)
3. Consulter logs serveur pour details erreur

### Probleme : OCR images lent
**Normal** : tesseract.js prend plus temps pour OCR
**Solution** : Patience ou desactiver OCR via parametres

---

## DOCUMENTATION COMPLETE

Consulter les guides detailles :

1. **GUIDE_AGENT_IA.md** : Documentation complete technique
2. **AGENT_IA_IMPLEMENTATION.md** : Details implementation
3. **Code source** : Commentaires detailles dans chaque fichier

---

## PROCHAINES ETAPES

1. **Attendre fin installation** npm install
2. **Lancer application** npm run dev
3. **Tester Assistant IA** via interface web
4. **Uploader documents** pour indexation
5. **Poser questions** et verifier reponses

---

**Support** : Consulter logs serveur et frontend pour toute erreur
**Version** : 1.0.0
**Date** : 2025-11-03
