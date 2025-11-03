# Intégration OCR EasyOCR - DocuCortex

## Vue d'ensemble

DocuCortex intègre maintenant EasyOCR pour l'extraction de texte à partir d'images. Cette fonctionnalité permet de traiter des images et d'extraire du texte lisible pour l'indexation et l'analyse par l'agent IA.

## Fonctionnalités

### 🎯 Extraction de texte d'images
- Support de multiples formats d'images (PNG, JPG, JPEG, BMP, TIFF)
- Détection automatique de la langue
- Amélioration automatique des images pour optimiser l'OCR
- Filtrage par niveau de confiance
- Extraction avec coordonnées de position (bounding boxes)

### 🌍 Support multilingue
Langues supportées par défaut :
- Français (fr) - **Défaut**
- Anglais (en) - **Défaut**
- Espagnol (es)
- Allemand (de)
- Italien (it)
- Portugais (pt)
- Néerlandais (nl)
- Arabe (ar)
- Chinois (zh)
- Japonais (ja)
- Coréen (ko)

### 🔄 Traitement en lot
- Traitement simultané de plusieurs images
- Configuration du niveau de concurrence
- Rapport détaillé des résultats

### 📄 Indexation automatique
- Intégration directe avec la base de données IA
- Indexation vectorielle pour la recherche
- Métadonnées enrichies (confidence, langue détectée, etc.)

## API Endpoints

### Initialisation

#### POST /api/ai/ocr/initialize
Initialise le service OCR EasyOCR.

**Réponse :**
```json
{
    "success": true,
    "supportedLanguages": ["fr", "en", "es", "de", "it", "pt", "nl", "ar", "zh", "ja", "ko"],
    "defaultLanguages": ["fr", "en"]
}
```

### Extraction simple

#### POST /api/ai/ocr/extract
Extrait le texte d'une image uploadée.

**Paramètres (form-data) :**
- `image` : Fichier image (requis)
- `languages` : Langues à utiliser (ex: "fr,en") - optionnel
- `enhanceImage` : true/false - Améliorer l'image - défaut: true
- `confidenceThreshold` : Seuil de confiance (0.0-1.0) - défaut: 0.5
- `includeBoundingBoxes` : true/false - Inclure les coordonnées - défaut: false
- `autoDetectLanguage` : true/false - Détection auto langue - défaut: true

**Réponse :**
```json
{
    "success": true,
    "text": "Texte extrait de l'image",
    "confidence": 0.95,
    "wordsCount": 45,
    "linesCount": 3,
    "metadata": {
        "confidence": 0.95,
        "languages": ["fr"],
        "detectedLanguage": "fr",
        "enhancement": true,
        "boundingBoxes": null
    }
}
```

#### POST /api/ai/ocr/extract-from-buffer
Extrait le texte d'une image encodée en base64.

**Body (JSON) :**
```json
{
    "imageBuffer": "base64_encoded_image_data",
    "imageName": "mon_image.png",
    "languages": "fr,en",
    "enhanceImage": true
}
```

### Traitement de documents

#### POST /api/ai/ocr/process-image-document
Traite une image et l'indexe comme document dans la base IA.

**Paramètres :**
- `image` : Fichier image
- Options identiques à `/extract`

**Réponse :**
```json
{
    "success": true,
    "documentId": 123,
    "filename": "document_scan.jpg",
    "extractedText": "Contenu textuel extrait...",
    "language": "fr",
    "confidence": 0.92,
    "wordCount": 156,
    "chunksCount": 3,
    "metadata": {
        "source": "ocr",
        "ocr": {
            "confidence": 0.92,
            "wordsCount": 156,
            "linesCount": 8,
            "detectedLanguage": "fr"
        }
    }
}
```

### Traitement en lot

#### POST /api/ai/ocr/batch-process
Traite plusieurs images en lot.

**Paramètres (form-data) :**
- `images[]` : Array de fichiers images (max 10)
- Options identiques plus :
- `autoIndexAsDocuments` : true/false - Indexer automatiquement - défaut: false
- `maxConcurrent` : Nombre max de traitements simultanés - défaut: 3

**Réponse :**
```json
{
    "success": true,
    "results": [
        {
            "success": true,
            "text": "Texte image 1...",
            "metadata": { "confidence": 0.89 },
            "index": 0
        }
    ],
    "summary": {
        "total": 3,
        "successful": 3,
        "failed": 0,
        "totalTextLength": 1247
    },
    "indexedDocuments": [
        {
            "success": true,
            "documentId": 124,
            "filename": "image1.jpg"
        }
    ]
}
```

### Détection de langue

#### POST /api/ai/ocr/detect-language
Détecte automatiquement la langue d'une image.

**Paramètres :**
- `image` : Fichier image

**Réponse :**
```json
{
    "success": true,
    "language": "fr",
    "confidence": 0.87,
    "extractedText": "Texte de test détecté...",
    "error": null
}
```

### Informations et maintenance

#### GET /api/ai/ocr/info
Obtient les informations du service OCR.

#### POST /api/ai/ocr/cleanup
Nettoie les ressources OCR.

## Utilisation dans le code

### Extraction simple
```javascript
// Via formulaire upload
const formData = new FormData();
formData.append('image', imageFile);
formData.append('languages', 'fr,en');
formData.append('enhanceImage', 'true');

const response = await fetch('/api/ai/ocr/extract', {
    method: 'POST',
    body: formData
});

const result = await response.json();
if (result.success) {
    console.log('Texte extrait:', result.text);
    console.log('Confiance:', result.confidence);
}
```

### Traitement et indexation
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('autoIndexAsDocuments', 'true');

const response = await fetch('/api/ai/ocr/process-image-document', {
    method: 'POST',
    body: formData
});

const result = await response.json();
if (result.success) {
    console.log('Document indexé ID:', result.documentId);
}
```

### Traitement en lot
```javascript
const formData = new FormData();
imageFiles.forEach(file => {
    formData.append('images[]', file);
});
formData.append('autoIndexAsDocuments', 'true');
formData.append('maxConcurrent', '3');

const response = await fetch('/api/ai/ocr/batch-process', {
    method: 'POST',
    body: formData
});
```

## Configuration avancée

### Langues supportées
Le service supporte 11 langues avec détection automatique :
- `fr` - Français (recommandé)
- `en` - Anglais (recommandé)
- `es` - Espagnol
- `de` - Allemand
- `it` - Italien
- `pt` - Portugais
- `nl` - Néerlandais
- `ar` - Arabe
- `zh` - Chinois
- `ja` - Japonais
- `ko` - Coréen

### Paramètres d'optimisation

#### Amélioration d'image
- `enhanceImage: true` - Active l'amélioration automatique
- Conversion en niveaux de grises
- Normalisation du contraste
- Ajustement de la netteté

#### Seuils de confiance
- `confidenceThreshold: 0.5` - Seuil par défaut (50%)
- `confidenceThreshold: 0.3` - Plus permissif
- `confidenceThreshold: 0.8` - Plus strict

#### Traitement concurrent
- `maxConcurrent: 3` - Traitement par lot de 3 images
- Augmenter pour plus de vitesse (risque de surcharge)
- Diminuer pour stabilité sur machines faibles

## Intégration avec l'Agent IA

### Recherche après OCR
Une fois une image traitée et indexée, elle devient searchable par l'agent IA :

```javascript
// L'image est maintenant searchable
const searchResult = await fetch('/api/ai/search/intelligent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        query: "texte chercher dans l'image OCR",
        sessionId: "session123"
    })
});
```

### Intégration dans les conversations
L'agent IA peut répondre en utilisant le contenu OCR extrait :
- Questions sur le contenu d'images scannées
- Analyse de documents scannés
- Recherche dans la collection d'images OCR

## Bonnes pratiques

### 📸 Qualité des images
- Utilisez des images haute résolution
- Évitez les images floues ou pixelisées
- Contraste sufficient entre texte et arrière-plan
- Orientation correcte du texte

### 🎯 Langues
- Spécifiez les langues attendues pour de meilleurs résultats
- La détection automatique fonctionne bien pour les langues européennes
- Combinez plusieurs langues si nécessaire : "fr,en,es"

### ⚡ Performance
- Limitez le traitement concurrent sur les machines faibles
- Utilisez l'amélioration d'image pour de meilleurs résultats
- Traitez en lot plutôt qu'individuellement

### 💾 Stockage
- Les documents OCR sont stockés comme documents normaux
- Métadonnées riches pour le filtrage et la recherche
- Intégration complète avec l'index vectoriel

## Dépannage

### Erreurs courantes

#### "Erreur initialisation EasyOCR"
- Vérifiez que les dépendances sont installées
- Redémarrez le service après installation
- Vérifiez l'espace disque pour les modèles

#### "Aucun texte significatif extrait"
- Améliorez la qualité de l'image
- Ajustez le seuil de confiance (diminuez à 0.3)
- Vérifiez l'orientation du texte
- Testez avec différentes langues

#### "Mémoire insuffisante"
- Réduisez le niveau de traitement concurrent
- Traitez les images individuellement
- Redimensionnez les grandes images avant traitement

### Logs de débogage
Activez les logs détaillés dans la configuration EasyOCR pour le débogage.

## Mise à jour et maintenance

### Installation des dépendances
```bash
npm install easyocr sharp
```

### Nettoyage des ressources
```bash
# Nettoie le cache OCR
curl -X POST http://localhost:3000/api/ai/ocr/cleanup
```

### Réinitialisation
```bash
# Réinitialise complètement le service
curl -X POST http://localhost:3000/api/ai/ocr/initialize
```

---

**Version :** 1.0.0  
**Date :** 2025-11-03  
**Auteur :** DocuCortex Development Team