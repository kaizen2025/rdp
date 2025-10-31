# 🚀 RDS Viewer - Anecoop

Application web et de bureau pour la gestion centralisée des sessions RDS, du parc informatique, des prêts de matériel et des utilisateurs Active Directory.

## ✨ Fonctionnalités Clés

-   **Tableau de Bord Centralisé :** Vue d'ensemble de l'activité, des prêts en retard et du statut des serveurs.
-   **Gestion des Sessions RDS :** Visualisation en temps réel des sessions actives/déconnectées, envoi de messages, et actions de contrôle à distance (Shadow, RDP).
-   **Inventaire Matériel :** Gestion complète du parc d'ordinateurs, avec historique des prêts et des maintenances.
-   **Gestion des Prêts :** Création, modification, retour, et prolongation des prêts de matériel avec un système de notifications.
-   **Administration Active Directory :**
    -   Gestion des membres des groupes de sécurité (VPN, Internet).
    -   Création d'utilisateurs unifiée (AD + Fichier de suivi Excel).
    -   Actions rapides sur les comptes (activer, désactiver, réinitialiser le mot de passe).
-   **Application de Bureau (Electron) :**
    -   Intégration native avec les outils Windows (MSTSC, PowerShell).
    -   Système de mise à jour automatique.

## 🛠️ Architecture Technique

-   **Frontend :** React, Material-UI
-   **Backend :** Node.js, Express.js
-   **Base de Données :** SQLite (via `better-sqlite3`) pour les données persistantes (prêts, ordinateurs, etc.) et le cache.
-   **Source de Données Utilisateurs :** Fichier Excel partagé, synchronisé avec la base de données SQLite.
-   **Communication Temps Réel :** WebSockets
-   **Application de Bureau :** Electron, Electron Builder

## ⚙️ Prérequis

-   **Node.js :** Version 20.x (LTS) recommandée.
-   **Accès Réseau :** L'application nécessite un accès en lecture/écriture au partage réseau où sont stockés `config.json`, la base de données SQLite et le fichier Excel.

## 📦 Installation

1.  **Cloner le dépôt :**
    ```bash
    git clone <URL_DU_DEPOT>
    cd rdp
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

## 📝 Configuration

1.  Naviguez vers le dossier `config/`.
2.  Copiez `config.template.json` et renommez la copie en `config.json`.
3.  Ouvrez `config.json` et remplissez **tous** les champs, notamment :
    -   `databasePath` et `excelFilePath` : Chemins UNC (`\\serveur\partage\fichier`) vers vos fichiers de données.
    -   `domain`, `username`, `password` : Identifiants d'un compte de service avec les droits nécessaires sur Active Directory.
    -   `updateUrl` : URL où seront hébergées les mises à jour de l'application Electron.

## 🚀 Lancement en Développement

L'application dispose de deux modes de lancement principaux.

### Mode Navigateur Web

Idéal pour le développement rapide de l'interface.
```bash
npm run test:app