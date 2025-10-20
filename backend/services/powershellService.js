// electron/services/powershellService.js

const { exec } = require('child_process');
const iconv = require('iconv-lite');

function executeEncodedPowerShell(psScript, timeout = 15000) {
    const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');
    const command = `powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -EncodedCommand ${encodedScript}`;

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Timeout PowerShell'));
        }, timeout);

        exec(command, { encoding: 'buffer', timeout }, (error, stdout, stderr) => {
            clearTimeout(timer);

            if (error) {
                const decodedStderr = iconv.decode(stderr, 'cp850').trim();
                reject(new Error(decodedStderr || 'Erreur PowerShell inconnue'));
                return;
            }

            const decodedStdout = iconv.decode(stdout, 'cp850').trim();
            resolve(decodedStdout);
        });
    });
}

module.exports = {
    executeEncodedPowerShell,
};