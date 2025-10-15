// electron/services/configService.js - VERSION AMÉLIORÉE

const { app, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');

const EXCEL_CONFIG = {
    localCachePath: path.join(userDataPath, 'excel-cache.json'),
    columnMapping: {
        'Identifiant': 'username', 'Mot de passe': 'password', 'Office': 'officePassword',
        'Nom complet': 'displayName', 'Service': 'department', 'Email': 'email', 'Serveur': 'server'
    }
};

const DEFAULT_SYNC_BASE = "\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group";

const DEFAULT_CONFIG = {
    appPasswordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
    domain: "anecoopfr.local",
    username: "admin_anecoop",
    password: "vCQhNZ2aY2v!",
    rdp_port: 3389,
    auto_fullscreen: true,
    auto_admin_connect: true,
    defaultExcelPath: path.join(DEFAULT_SYNC_BASE, "Data_utilisateur_partage.xlsx"),
    computersDbPath: path.join(DEFAULT_SYNC_BASE, "computers_stock.json"), // Ce chemin reste la référence
    // Les chemins ci-dessous sont maintenant obsolètes car gérés par getSharedFilePath
    // loansDbPath, serversDbPath, chatDbPath, etc.
    
    syncPaths: {
        presence: path.join(DEFAULT_SYNC_BASE, "technicians_presence.json"),
        notifications: path.join(DEFAULT_SYNC_BASE, "technician_notifications.json"),
        operations: path.join(DEFAULT_SYNC_BASE, "operations.json")
    },

    rds_servers: [
        "SRV-RDS-1", "SRV-RDS-2", "SRV-RDS-3", "SRV-RDS-4"
    ],
    server_groups: {
        "🏢 Infrastructure": [ "SRV-AD-1", "SRV-AD-2", "SRV-AD-FLORENSUD", "SRV-DATA", "SRV-VPN-EDI" ],
        "🖥️ Services RDS": [ "SRV-RDS-1", "SRV-RDS-2", "SRV-RDS-3", "SRV-RDS-4", "SRV-TSE-FLORENSUD" ],
        "📊 Applications": [ "HRM-V9", "SAGERADIO64B", "SAGESEI_DOMAINENOK", "SRV-DIMENSION", "SRV-HOROQUARTZ", "SRV-ORACLE-SAGE", "SRV-QLIKVIEW", "SRV-QV", "SRV-SYRACUSE", "ServeurGED_DOMAINENOK", "ServeurQV_DOMAINENOK" ],
        "🔧 Autres": [ "SRV-CENTOS-ZABBIX", "SRV-DIA", "SRWEXTRA01", "SRWINTRA01" ]
    },
    it_technicians: [
        { id: "kevin_bivia", name: "Kevin BIVIA", position: "Chef de projet", email: "kevin.bivia@anecoop.fr", phone: "", isActive: true, permissions: ["admin", "loans", "users", "servers", "reports", "config"], createdAt: "2024-01-01T00:00:00.000Z", avatar: "KB" },
        { id: "meher_benhassine", name: "Meher BENHASSINE", position: "Chef de projet", email: "meher.benhassine@anecoop.fr", phone: "", isActive: true, permissions: ["admin", "loans", "users", "servers", "reports"], createdAt: "2024-01-01T00:00:00.000Z", avatar: "MB" },
        { id: "christelle_moles", name: "Christelle MOLES", position: "Responsable informatique", email: "christelle.moles@anecoop.fr", phone: "", isActive: true, permissions: ["admin", "loans", "users", "servers", "reports", "config"], createdAt: "2024-01-01T00:00:00.000Z", avatar: "CM" },
        { id: "macha_anton", name: "Macha ANTON", position: "Alternante informatique", email: "macha.anton@anecoop.fr", phone: "", isActive: true, permissions: ["loans", "users", "reports"], createdAt: "2024-01-01T00:00:00.000Z", avatar: "MA" }
    ],
};

async function safeReadJsonFile(filePath, defaultValue = null) {
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch { return defaultValue; }
}

async function safeWriteJsonFile(filePath, data) {
    try {
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
}

const configService = {
    appConfig: { ...DEFAULT_CONFIG },

    /**
     * NOUVELLE FONCTION CENTRALISÉE
     * Construit le chemin complet vers un fichier partagé sur le réseau.
     * @param {string} fileName - Le nom du fichier (ex: 'loans.json').
     * @returns {string|null} Le chemin complet ou null si la configuration de base est manquante.
     */
    getSharedFilePath(fileName) {
        try {
            const basePath = this.appConfig.computersDbPath;
            if (!basePath) {
                console.warn(`getSharedFilePath: 'computersDbPath' n'est pas configuré. Utilisation du chemin par défaut.`);
                return path.join(DEFAULT_SYNC_BASE, fileName);
            }
            // On prend le répertoire du chemin de référence et on y ajoute le nom du fichier demandé.
            return path.join(path.dirname(basePath), fileName);
        } catch (e) {
            console.error(`Erreur critique dans getSharedFilePath pour ${fileName}:`, e);
            return null;
        }
    },

    async loadConfigAsync() {
        try {
            const localConfig = await safeReadJsonFile(configPath, {});
            this.appConfig = { ...DEFAULT_CONFIG, ...localConfig };
            if (this.appConfig.encryptedPassword && safeStorage.isEncryptionAvailable()) {
                this.appConfig.password = safeStorage.decryptString(Buffer.from(this.appConfig.encryptedPassword, 'base64'));
            }
            await safeWriteJsonFile(configPath, this.appConfig); 
        } catch (error) {
            this.appConfig = { ...DEFAULT_CONFIG };
        }
    },
    getConfig() {
        const { password, encryptedPassword, ...safeConfig } = this.appConfig;
        return { ...safeConfig, hasAdminPassword: !!password };
    },
    async saveConfig(newConfig, newPassword) {
        const configToSave = { ...this.appConfig, ...newConfig };
        delete configToSave.password;
        if (newPassword) {
            configToSave.appPasswordHash = this.hashPassword(newPassword);
        }
        const result = await safeWriteJsonFile(configPath, configToSave);
        if (result.success) await this.loadConfigAsync();
        return result;
    },
    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    },
    EXCEL_CONFIG,
    userDataPath,
};

module.exports = configService;