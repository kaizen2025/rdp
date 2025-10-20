// migrate-data.js - SCRIPT FINAL, COMPLET ET AUTONOME

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const XLSX = require('xlsx');

console.log("========================================");
console.log(" DÉMARRAGE DU SCRIPT DE MIGRATION DE DONNÉES ");
console.log("========================================");

// --- CONFIGURATION DES CHEMINS ---
const OLD_DATA_PATH = "\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group";
const NEW_DB_PATH = path.join(OLD_DATA_PATH, 'rds_viewer_data.sqlite');

const PATHS = {
    computers: path.join(OLD_DATA_PATH, 'computers_stock.json'),
    loans: path.join(OLD_DATA_PATH, 'loans.json'),
};

// --- CORRECTION : AJOUT DU SCHÉMA COMPLET DE LA BASE DE DONNÉES ---
const schema = `
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS computers (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT, model TEXT, serialNumber TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'available', notes TEXT, specifications TEXT, warranty TEXT, location TEXT,
        condition TEXT, assetTag TEXT, maintenanceHistory TEXT, createdAt TEXT, createdBy TEXT,
        lastModified TEXT, modifiedBy TEXT
    );

    CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY, computerId TEXT NOT NULL REFERENCES computers(id) ON DELETE CASCADE,
        computerName TEXT, userName TEXT NOT NULL, userDisplayName TEXT, itStaff TEXT,
        loanDate TEXT NOT NULL, expectedReturnDate TEXT NOT NULL, actualReturnDate TEXT,
        status TEXT NOT NULL, notes TEXT, accessories TEXT, history TEXT, extensionCount INTEGER DEFAULT 0,
        createdBy TEXT, createdAt TEXT, returnedBy TEXT, returnData TEXT
    );

    CREATE TABLE IF NOT EXISTS loan_history (
        id TEXT PRIMARY KEY, loanId TEXT, eventType TEXT, date TEXT, by TEXT, byId TEXT,
        computerId TEXT, computerName TEXT, userName TEXT, userDisplayName TEXT, details TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_history_computer ON loan_history(computerId);
    CREATE INDEX IF NOT EXISTS idx_history_user ON loan_history(userName);

    CREATE TABLE IF NOT EXISTS accessories (
        id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, icon TEXT, active INTEGER DEFAULT 1,
        createdAt TEXT, createdBy TEXT, modifiedAt TEXT, modifiedBy TEXT
    );

    CREATE TABLE IF NOT EXISTS loan_notifications (
        id TEXT PRIMARY KEY, loanId TEXT, computerName TEXT, userName TEXT, userDisplayName TEXT,
        type TEXT, date TEXT, read_status INTEGER DEFAULT 0, details TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_channels (
        id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, createdAt TEXT, createdBy TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY, channelId TEXT NOT NULL, authorId TEXT NOT NULL, authorName TEXT,
        authorAvatar TEXT, text TEXT, timestamp TEXT NOT NULL, reactions TEXT, file_info TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_chat_channel_ts ON chat_messages(channelId, timestamp);

    CREATE TABLE IF NOT EXISTS technician_presence (
        id TEXT PRIMARY KEY, name TEXT, avatar TEXT, position TEXT, status TEXT,
        hostname TEXT, loginTime TEXT, lastActivity TEXT
    );

    CREATE TABLE IF NOT EXISTS key_value_store (
        key TEXT PRIMARY KEY, value TEXT
    );
`;

// Fonctions utilitaires (inchangées)
const readJson = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
        console.warn(`- Fichier non trouvé, ignoré : ${filePath}`);
        return null;
    } catch (error) {
        console.error(`! Erreur de lecture de ${filePath}:`, error);
        return null;
    }
};
const stringify = (data) => data ? JSON.stringify(data) : null;

// --- CONNEXION ET INITIALISATION DE LA DB ---
let db;
try {
    db = new Database(NEW_DB_PATH);
    db.pragma('journal_mode = WAL');
    
    // --- CORRECTION : EXÉCUTION DU SCHÉMA POUR CRÉER LES TABLES ---
    console.log("🔧 Vérification et création du schéma de la base de données...");
    db.exec(schema);
    console.log("✅ Schéma de la base de données appliqué.");

    console.log("✅ Connecté à la base de données SQLite.");
} catch (error) {
    console.error("❌ Impossible de se connecter ou d'initialiser la base de données. Arrêt du script.", error);
    process.exit(1);
}

// --- MIGRATION ---
const transaction = db.transaction(() => {
    // ... (Le reste du code de migration est identique à la version précédente et correct)
    console.log("\n--- Migration des ordinateurs ---");
    const computersData = readJson(PATHS.computers);
    if (computersData && computersData.computers) {
        const insert = db.prepare(`INSERT OR IGNORE INTO computers (id, name, brand, model, serialNumber, status, notes, specifications, warranty, location, condition, assetTag, maintenanceHistory, createdAt, createdBy) VALUES (@id, @name, @brand, @model, @serialNumber, @status, @notes, @specifications, @warranty, @location, @condition, @assetTag, @maintenanceHistory, @createdAt, @createdBy)`);
        let count = 0;
        for (const computer of computersData.computers) {
            const computerWithDefaults = { id: computer.id || `pc_${Date.now()}_${count}`, name: computer.name || 'Sans nom', brand: computer.brand || null, model: computer.model || null, serialNumber: computer.serialNumber || `SN_INCONNU_${count}`, status: computer.status || 'available', notes: computer.notes || null, specifications: stringify(computer.specifications), warranty: stringify(computer.warranty), location: computer.location || null, condition: computer.condition || null, assetTag: computer.assetTag || null, maintenanceHistory: stringify(computer.maintenanceHistory), createdAt: computer.createdAt || null, createdBy: computer.createdBy || null };
            insert.run(computerWithDefaults);
            count++;
        }
        console.log(`✅ ${count} ordinateurs traités.`);
    }

    console.log("\n--- Migration des prêts ---");
    const loansData = readJson(PATHS.loans);
    if (loansData && loansData.loans) {
        const insert = db.prepare(`INSERT OR IGNORE INTO loans (id, computerId, computerName, userName, userDisplayName, itStaff, loanDate, expectedReturnDate, actualReturnDate, status, notes, accessories, history, extensionCount, createdBy, createdAt, returnedBy, returnData) VALUES (@id, @computerId, @computerName, @userName, @userDisplayName, @itStaff, @loanDate, @expectedReturnDate, @actualReturnDate, @status, @notes, @accessories, @history, @extensionCount, @createdBy, @createdAt, @returnedBy, @returnData)`);
        let count = 0;
        for (const loan of loansData.loans) {
            const loanWithDefaults = { id: loan.id || `loan_${Date.now()}_${count}`, computerId: loan.computerId || null, computerName: loan.computerName || null, userName: loan.userName || 'inconnu', userDisplayName: loan.userDisplayName || null, itStaff: loan.itStaff || null, loanDate: loan.loanDate || new Date().toISOString(), expectedReturnDate: loan.expectedReturnDate || new Date().toISOString(), actualReturnDate: loan.actualReturnDate || null, status: loan.status || 'unknown', notes: loan.notes || null, accessories: stringify(loan.accessories), history: stringify(loan.history), extensionCount: loan.extensionCount || 0, createdBy: loan.createdBy || null, createdAt: loan.createdAt || null, returnedBy: loan.returnedBy || null, returnData: stringify(loan.returnData) };
            insert.run(loanWithDefaults);
            count++;
        }
        console.log(`✅ ${count} prêts traités.`);
    }
});

try {
    transaction();
    console.log("\n========================================");
    console.log("🎉 MIGRATION TERMINÉE AVEC SUCCÈS !");
    console.log("========================================");
} catch (error) {
    console.error("\n❌ UNE ERREUR EST SURVENUE PENDANT LA MIGRATION :", error);
} finally {
    if (db) {
        db.close();
        console.log("✅ Connexion à la base de données fermée.");
    }
}