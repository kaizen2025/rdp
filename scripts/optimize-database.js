const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

/**
 * Script d'optimisation SQLite
 * - Création d'indexes manquants
 * - VACUUM et ANALYZE
 * - Backup automatique
 * - Nettoyage données anciennes
 */

class DatabaseOptimizer {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging
  }

  /**
   * Créer les indexes manquants pour améliorer les performances
   */
  createIndexes() {
    console.log('📊 Création des indexes...');

    const indexes = [
      // Sessions RDS
      'CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_server ON sessions(server)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(state) WHERE state = "Active"',
      
      // Utilisateurs
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_department ON users(department)',
      'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
      
      // Prêts de matériel
      'CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status)',
      'CREATE INDEX IF NOT EXISTS idx_loans_technician ON loans(assigned_to)',
      'CREATE INDEX IF NOT EXISTS idx_loans_start_date ON loans(start_date)',
      'CREATE INDEX IF NOT EXISTS idx_loans_end_date ON loans(end_date)',
      'CREATE INDEX IF NOT EXISTS idx_loans_computer ON loans(computer_name)',
      
      // Messages chat
      'CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender)',
      
      // Serveurs
      'CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status)',
      'CREATE INDEX IF NOT EXISTS idx_servers_name ON servers(name)',
      
      // Inventaire matériel
      'CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment(serial_number)',
      'CREATE INDEX IF NOT EXISTS idx_equipment_warranty ON equipment(warranty_end_date)',
      'CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status)',
    ];

    let created = 0;
    indexes.forEach(sql => {
      try {
        this.db.exec(sql);
        created++;
      } catch (error) {
        console.error(`Erreur création index: ${error.message}`);
      }
    });

    console.log(`✅ ${created} index(es) créé(s)`);
  }

  /**
   * VACUUM : compacter la base de données
   */
  vacuum() {
    console.log('🗜️  Compactage de la base de données...');
    const beforeSize = fs.statSync(this.dbPath).size;
    
    this.db.exec('VACUUM');
    
    const afterSize = fs.statSync(this.dbPath).size);
    const saved = beforeSize - afterSize;
    console.log(`✅ Compactage terminé - ${(saved / 1024 / 1024).toFixed(2)} MB économisés`);
  }

  /**
   * ANALYZE : mettre à jour les statistiques pour l'optimiseur
   */
  analyze() {
    console.log('📈 Mise à jour des statistiques...');
    this.db.exec('ANALYZE');
    console.log('✅ Statistiques mises à jour');
  }

  /**
   * Créer un backup de la base de données
   */
  backup() {
    console.log('💾 Création du backup...');
    
    const backupDir = path.join(path.dirname(this.dbPath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `database_backup_${timestamp}.db`);
    
    this.db.backup(backupPath)
      .then(() => {
        console.log(`✅ Backup créé : ${backupPath}`);
        this.cleanOldBackups(backupDir);
      })
      .catch(error => {
        console.error(`❌ Erreur backup: ${error.message}`);
      });
  }

  /**
   * Nettoyer les anciens backups (garder les 30 derniers)
   */
  cleanOldBackups(backupDir) {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('database_backup_'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    // Garder les 30 derniers, supprimer les autres
    if (files.length > 30) {
      files.slice(30).forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Backup supprimé : ${file.name}`);
      });
    }
  }

  /**
   * Nettoyer les données anciennes (> 6 mois)
   */
  cleanOldData() {
    console.log('🧹 Nettoyage des données anciennes...');
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const threshold = sixMonthsAgo.toISOString();

    const cleanupQueries = [
      // Supprimer anciennes sessions terminées
      `DELETE FROM sessions WHERE end_time IS NOT NULL AND end_time < '${threshold}'`,
      
      // Supprimer anciens messages chat
      `DELETE FROM messages WHERE timestamp < '${threshold}'`,
      
      // Archiver anciens prêts retournés
      `DELETE FROM loans WHERE status = 'returned' AND end_date < '${threshold}'`,
    ];

    let totalDeleted = 0;
    cleanupQueries.forEach(sql => {
      try {
        const result = this.db.prepare(sql).run();
        totalDeleted += result.changes;
      } catch (error) {
        console.error(`Erreur nettoyage: ${error.message}`);
      }
    });

    console.log(`✅ ${totalDeleted} enregistrement(s) supprimé(s)`);
  }

  /**
   * Analyser les requêtes lentes (simulation)
   */
  analyzeSlowQueries() {
    console.log('🔍 Analyse des requêtes lentes...');
    
    // Activer le profiling
    this.db.pragma('query_only = OFF');
    
    // Exemples de requêtes à optimiser
    const queries = [
      'SELECT COUNT(*) FROM sessions WHERE state = "Active"',
      'SELECT * FROM users ORDER BY last_login DESC LIMIT 10',
      'SELECT * FROM loans WHERE status = "active" AND end_date < date("now")',
    ];

    queries.forEach(query => {
      const start = process.hrtime.bigint();
      this.db.prepare(query).all();
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convertir en ms
      
      if (duration > 10) {
        console.log(`⚠️  Requête lente (${duration.toFixed(2)}ms): ${query.substring(0, 50)}...`);
      }
    });
    
    console.log('✅ Analyse terminée');
  }

  /**
   * Exécuter toutes les optimisations
   */
  async optimizeAll() {
    console.log('🚀 Démarrage de l\'optimisation complète...\n');
    
    try {
      this.backup();
      this.createIndexes();
      this.cleanOldData();
      this.analyze();
      this.vacuum();
      this.analyzeSlowQueries();
      
      console.log('\n✅ Optimisation terminée avec succès !');
    } catch (error) {
      console.error(`❌ Erreur lors de l'optimisation: ${error.message}`);
    } finally {
      this.db.close();
    }
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const dbPath = process.argv[2] || path.join(__dirname, '../backend/database.db');
  
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Base de données non trouvée : ${dbPath}`);
    process.exit(1);
  }

  const optimizer = new DatabaseOptimizer(dbPath);
  optimizer.optimizeAll();
}

module.exports = DatabaseOptimizer;
