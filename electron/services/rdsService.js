// electron/services/rdsService.js - Version fiabilisée avec le parser quser amélioré

const { exec } = require('child_process');
const iconv = require('iconv-lite');
const { addHistoryEntry } = require('./utils');
const configService = require('./configService');
const sessionState = require('./sessionState');

/**
 * Analyse la sortie de la commande `quser` de manière robuste, inspiré par le script PowerShell fourni.
 * @param {string} output - La sortie brute de la commande quser.
 * @param {string} serverName - Le nom du serveur d'où provient la sortie.
 * @returns {Array<object>} Un tableau d'objets de session.
 */
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

            if (parts.length < 5) {
                console.warn(`Ligne quser ignorée (pas assez de parties) sur ${serverName}: "${line}"`);
                continue;
            }

            const user = parts[0];
            let sessionName, id, state, idle, logonRaw;

            if (isNaN(parseInt(parts[1], 10)) && !/^\d+$/.test(parts[1])) {
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
                const parsedDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
                if (!isNaN(parsedDate.getTime())) {
                    logonTime = parsedDate.toISOString();
                }
            }

            sessions.push({
                server: serverName,
                user,
                sessionName,
                id,
                state,
                idle,
                logonRaw,
                logonTime,
                isActive: state && (state.toLowerCase() === 'actif' || state.toLowerCase() === 'active'),
            });
        } catch (e) {
            console.error(`Erreur lors de l'analyse de la ligne quser sur ${serverName}: "${line}"`, e);
        }
    }
    return sessions;
}

async function getRdsSessions() {
    const servers = configService.appConfig?.rds_servers || [];
    if (servers.length === 0) return [];

    const promises = servers.map(server =>
        new Promise((resolve) => {
            const command = `quser /server:${server}`;
            exec(command, { encoding: 'buffer', timeout: 8000 }, (error, stdout, stderr) => {
                const stderrStr = iconv.decode(stderr, 'cp850').trim();
                if (error && !stderrStr.includes('Aucun utilisateur')) {
                    console.warn(`Erreur d'exécution de quser pour ${server}:`, stderrStr);
                    resolve([]);
                    return;
                }
                const output = iconv.decode(stdout, 'cp850');
                const sessions = parseQuserOutput(output, server);
                resolve(sessions);
            });
        })
    );

    const results = await Promise.all(promises);
    return results.flat();
}

async function pingServer(server) {
    return new Promise((resolve) => {
        const command = `quser /server:${server}`;
        exec(command, { encoding: 'buffer', timeout: 5000 }, (error, stdout, stderr) => {
            const stderrStr = iconv.decode(stderr, 'cp850').trim();
            if (!error || stderrStr.includes('Aucun utilisateur')) {
                resolve({ success: true, output: 'Le serveur est en ligne.' });
            } else {
                console.warn(`La vérification (ping) a échoué pour ${server}: ${stderrStr}`);
                resolve({ success: false, output: stderrStr });
            }
        });
    });
}

function connectWithCredentials(server, username, password, isAdmin = false) {
    const target = `TERMSRV/${server}`;
    const currentTechnician = sessionState.getCurrentTechnician();
    exec(`cmdkey /generic:"${target}" /user:"${username}" /pass:"${password}"`, (addError) => {
        if (addError) {
            console.warn(`Erreur cmdkey pour ${server}:`, addError.message);
            return;
        }
        exec(`start mstsc /v:${server} ${isAdmin ? '/admin' : ''}`);
        addHistoryEntry({ server, type: isAdmin ? 'Connexion Admin' : 'Connexion Utilisateur', user: username }, currentTechnician);
        setTimeout(() => exec(`cmdkey /delete:"${target}"`), 5000);
    });
    return { success: true };
}

function quickConnect(server) {
    const { password, domain, username } = configService.appConfig;
    if (!password) return { success: false, error: 'Mot de passe admin non configuré.' };
    return connectWithCredentials(server, `${domain}\\${username}`, password, true);
}

function shadowSession(server, sessionId, useMultiMon) {
    const displaySwitch = useMultiMon ? '/multimon' : '/w:1920 /h:1080';
    exec(`mstsc.exe /shadow:${sessionId} /v:${server} ${displaySwitch} /control`);
    addHistoryEntry({ server, type: 'Shadow Session', user: `Session ${sessionId}` }, sessionState.getCurrentTechnician());
    return { success: true };
}

function disconnectSession(server, sessionId) {
    exec(`logoff ${sessionId} /server:${server}`);
    addHistoryEntry({ server, type: 'Déconnexion Session', user: `Session ${sessionId}` }, sessionState.getCurrentTechnician());
    return { success: true };
}

function sendMessage(server, sessionId, message) {
    exec(`msg ${sessionId} /server:${server} "${message.replace(/"/g, '""')}"`);
    return { success: true };
}

module.exports = {
    getRdsSessions,
    connectWithCredentials,
    quickConnect,
    pingServer,
    shadowSession,
    disconnectSession,
    sendMessage,
};