// backend/services/rdsService.js - VERSION FINALE AVEC TRANSACTION DÉFINITIVEMENT CORRIGÉE

const { exec } = require('child_process');
const iconv = require('iconv-lite');
const configService = require('./configService');
const db = require('./databaseService');

function parseQuserOutput(output, serverName) {
    const sessions = [];
    const lines = output.split(/[\r\n]+/).filter(line => {
        const lowerLine = line.toLowerCase();
        return line.trim() !== '' && !lowerLine.includes('utilisateur') && !lowerLine.includes('user name');
    });

    for (const line of lines) {
        try {
            const trimmedLine = line.trim().replace(/^>/, '').trim();
            const parts = trimmedLine.split(/\s+/);
            if (parts.length < 5) continue;

            const user = parts[0];
            let sessionName, id, state, idle, logonRaw;

            if (isNaN(parseInt(parts[1], 10))) {
                sessionName = parts[1];
                id = parts[2];
                state = parts[3];
                idle = parts[4];
                logonRaw = parts.slice(5).join(' ');
            } else {
                sessionName = '';
                id = parts[1];
                state = parts[2];
                idle = parts[3];
                logonRaw = parts.slice(4).join(' ');
            }

            let logonTime = null;
            const dateMatch = logonRaw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s(\d{1,2}):(\d{1,2})/);
            if (dateMatch) {
                const [, day, month, year, hours, minutes] = dateMatch;
                try {
                    // Formatage plus robuste pour éviter les erreurs de fuseau horaire
                    const parsedDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
                    if (!isNaN(parsedDate.getTime())) logonTime = parsedDate.toISOString();
                } catch (e) {
                    console.warn("Erreur de parsing de date:", e);
                }
            }

            sessions.push({
                server: serverName, user, sessionName, id, state, idle, logonTime,
                isActive: state && (state.toLowerCase() === 'actif' || state.toLowerCase() === 'active'),
            });
        } catch (e) {
            console.error(`Erreur analyse ligne quser sur ${serverName}: "${line}"`, e);
        }
    }
    return sessions;
}

async function refreshAndStoreRdsSessions() {
    const servers = configService.appConfig?.rds_servers || [];
    if (servers.length === 0) return { success: false, count: 0, error: "Aucun serveur RDS configuré." };

    const promises = servers.map(server =>
        new Promise((resolve) => {
            exec(`quser /server:${server}`, { encoding: 'buffer', timeout: 8000 }, (error, stdout, stderr) => {
                const stderrStr = iconv.decode(stderr, 'cp850').trim();
                if (error && !stderrStr.includes('Aucun utilisateur')) {
                    console.warn(`Erreur quser pour ${server}:`, stderrStr);
                    resolve([]);
                    return;
                }
                const output = iconv.decode(stdout, 'cp850');
                resolve(parseQuserOutput(output, server));
            });
        })
    );

    const results = await Promise.all(promises);
    const allSessions = results.flat();
    const now = new Date().toISOString();

    try {
        // --- CORRECTION DÉFINITIVE DE LA SYNTAXE DE TRANSACTION ---
        // 1. On définit la fonction qui contient toutes les opérations de la transaction.
        const updateFunction = db.transaction((sessions) => {
            db.run('DELETE FROM rds_sessions'); // Vider la table
            const insert = db.prepare(`
                INSERT INTO rds_sessions (id, server, sessionId, username, sessionName, state, idleTime, logonTime, isActive, lastUpdate)
                VALUES (@id, @server, @sessionId, @username, @sessionName, @state, @idleTime, @logonTime, @isActive, @lastUpdate)
            `);
            for (const session of sessions) {
                insert.run({
                    id: `${session.server}-${session.id}`,
                    server: session.server,
                    sessionId: session.id,
                    username: session.user,
                    sessionName: session.sessionName,
                    state: session.state,
                    idleTime: session.idle,
                    logonTime: session.logonTime,
                    isActive: session.isActive ? 1 : 0,
                    lastUpdate: now,
                });
            }
        });

        // 2. On exécute la fonction de transaction avec les données.
        updateFunction(allSessions);

        console.log(`✅ ${allSessions.length} sessions RDS mises à jour dans la base de données.`);
        return { success: true, count: allSessions.length };

    } catch (error) {
        // Cette erreur ne devrait plus se produire, mais on garde la gestion d'erreur.
        console.error("❌ Erreur lors de la transaction de mise à jour des sessions RDS:", error);
        throw error; // Propage l'erreur pour qu'elle soit visible dans les logs du serveur
    }
}

async function getStoredRdsSessions() {
    const rows = db.all('SELECT * FROM rds_sessions ORDER BY server, username');
    return rows.map(s => ({ ...s, isActive: !!s.isActive }));
}

async function pingServer(server) {
    return new Promise((resolve) => {
        exec(`quser /server:${server}`, { encoding: 'buffer', timeout: 5000 }, (error, stdout, stderr) => {
            const stderrStr = iconv.decode(stderr, 'cp850').trim();
            if (!error || stderrStr.includes('Aucun utilisateur')) {
                resolve({ success: true, output: 'Le serveur est en ligne.' });
            } else {
                resolve({ success: false, output: stderrStr });
            }
        });
    });
}

async function sendMessage(server, sessionId, message) {
    return new Promise((resolve) => {
        exec(`msg ${sessionId} /server:${server} "${message.replace(/"/g, '""')}"`, (error) => {
            if (error) resolve({ success: false, error: error.message });
            else resolve({ success: true });
        });
    });
}

module.exports = {
    refreshAndStoreRdsSessions,
    getStoredRdsSessions,
    pingServer,
    sendMessage,
};