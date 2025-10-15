// electron/services/adService.js - VERSION COMPLÈTE ET CORRIGÉE

const { executeEncodedPowerShell } = require('./powershellService');

/**
 * Traduit les messages d'erreur PowerShell courants en messages clairs et en français.
 * @param {string} errorMessage - Le message d'erreur brut de PowerShell.
 * @returns {string} Le message d'erreur traduit et simplifié.
 */
function parseAdError(errorMessage) {
    if (!errorMessage) return "Une erreur inconnue est survenue.";
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes("cannot find an object with identity") || lowerError.includes("ne trouve pas d'objet avec l'identité")) {
        return "L'utilisateur ou le groupe spécifié n'a pas été trouvé dans Active Directory.";
    }
    if (lowerError.includes("the object already exists") || lowerError.includes("l'objet existe déjà")) {
        return "Un utilisateur ou un groupe avec ce nom existe déjà.";
    }
    if (lowerError.includes("access is denied") || lowerError.includes("accès est refusé")) {
        return "Permissions insuffisantes pour effectuer cette action dans Active Directory.";
    }
    if (lowerError.includes("the server is unwilling to process the request")) {
        return "Le mot de passe ne respecte pas les règles de complexité du domaine (longueur, majuscules, chiffres, symboles).";
    }
    if (lowerError.includes("the specified module 'activedirectory' was not loaded")) {
        return "Le module PowerShell 'ActiveDirectory' n'est pas installé ou n'a pas pu être chargé sur cette machine.";
    }
    if (lowerError.includes("a referral was returned from the server") || lowerError.includes("le serveur a retourné une référence")) {
        return "Erreur de communication avec le contrôleur de domaine. Vérifiez la connexion réseau et la configuration du domaine.";
    }
    if (lowerError.includes("timeout")) {
        return "L'opération a expiré. Le contrôleur de domaine ne répond pas assez vite.";
    }

    // Si aucune correspondance, retourner une version nettoyée de l'erreur originale.
    return errorMessage.split('At line:')[0].trim();
}


// === VÉRIFICATION ET INSTALLATION DU MODULE AD ===

async function checkAdModule() {
    const psScript = `
        try {
            $module = Get-Module -ListAvailable -Name ActiveDirectory
            if ($module) {
                @{isAvailable = $true; version = $module.Version.ToString()} | ConvertTo-Json -Compress
            } else {
                @{isAvailable = false} | ConvertTo-Json -Compress
            }
        } catch {
            @{isAvailable = $false; error = $_.Exception.Message} | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 10000);
        return JSON.parse(result);
    } catch (error) {
        return { isAvailable: false, error: parseAdError(error.message) };
    }
}

async function installAdModule() {
    const psScript = `
        try {
            Enable-WindowsOptionalFeature -Online -FeatureName RSATClient-Roles-AD-Powershell -All -NoRestart
            @{success = $true} | ConvertTo-Json -Compress
        } catch {
            @{success = $false; error = $_.Exception.Message} | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 60000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

// === RECHERCHE ET CONSULTATION ===

async function searchAdUsers(searchTerm) {
    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            $users = Get-ADUser -Filter "SamAccountName -like '*${searchTerm}*' -or DisplayName -like '*${searchTerm}*'" -Properties DisplayName,EmailAddress,Enabled |
                Select-Object -First 10 SamAccountName,DisplayName,EmailAddress,Enabled
            if ($users) { $users | ConvertTo-Json -Compress } else { '[]' }
        } catch { '[]' }
    `;
    try {
        const jsonOutput = await executeEncodedPowerShell(psScript, 10000);
        const users = JSON.parse(jsonOutput || '[]');
        return Array.isArray(users) ? users : [users];
    } catch (e) {
        console.warn('Erreur recherche AD:', parseAdError(e.message));
        return [];
    }
}

async function getAdGroupMembers(groupName) {
    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            $members = Get-ADGroupMember -Identity "${groupName}" -Recursive |
                Where-Object { $_.objectClass -eq 'user' } |
                Get-ADUser -Properties DisplayName |
                Select-Object SamAccountName, Name, DisplayName
            if ($members) { $members | ConvertTo-Json -Compress } else { '[]' }
        } catch { '[]' }
    `;
    try {
        const jsonOutput = await executeEncodedPowerShell(psScript, 15000);
        const members = JSON.parse(jsonOutput || '[]');
        const membersArray = Array.isArray(members) ? members : [members];
        return membersArray.map(m => ({ ...m, sam: m.SamAccountName, name: m.Name || m.DisplayName }));
    } catch (e) {
        console.warn(`Erreur membres groupe ${groupName}:`, parseAdError(e.message));
        return [];
    }
}

// === GESTION DES GROUPES ===

async function addUserToGroup(args) {
    const { username, groupName } = args;
    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            Add-ADGroupMember -Identity "${groupName}" -Members "${username}" -ErrorAction Stop
            @{success = $true} | ConvertTo-Json -Compress
        } catch {
            @{success = $false; error = $_.Exception.Message} | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 10000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function removeUserFromGroup(args) {
    const { username, groupName } = args;
    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            Remove-ADGroupMember -Identity "${groupName}" -Members "${username}" -Confirm:$false -ErrorAction Stop
            @{success = $true} | ConvertTo-Json -Compress
        } catch {
            @{success = $false; error = $_.Exception.Message} | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 10000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function isUserInGroup(args) {
    const { username, groupName } = args;
    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            $user = Get-ADUser -Identity "${username}"
            $groups = Get-ADPrincipalGroupMembership -Identity $user
            if ($groups | Where-Object { $_.Name -eq "${groupName}" }) {
                @{isMember = $true} | ConvertTo-Json -Compress
            } else {
                @{isMember = $false} | ConvertTo-Json -Compress
            }
        } catch {
            @{isMember = $false; error = $_.Exception.Message} | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 10000);
        const parsedResult = JSON.parse(result);
        if (parsedResult.error) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { isMember: false, error: parseAdError(error.message) };
    }
}

// === GESTION AVANCÉE DES UTILISATEURS ===

async function createAdUser(userData) {
    const {
        username, firstName, lastName, displayName, email, password,
        ouPath, changePasswordAtLogon = true, description = ''
    } = userData;

    const escapeParam = (str) => str ? str.replace(/"/g, '`"') : '';

    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            $securePassword = ConvertTo-SecureString "${escapeParam(password)}" -AsPlainText -Force
            $params = @{
                SamAccountName = "${escapeParam(username)}"; Name = "${escapeParam(displayName || `${firstName} ${lastName}`)}";
                GivenName = "${escapeParam(firstName)}"; Surname = "${escapeParam(lastName)}";
                DisplayName = "${escapeParam(displayName || `${firstName} ${lastName}`)}";
                UserPrincipalName = "${escapeParam(username)}@${escapeParam(email.split('@')[1] || 'domain.local')}";
                EmailAddress = "${escapeParam(email)}"; AccountPassword = $securePassword;
                Enabled = $true; ChangePasswordAtLogon = $${changePasswordAtLogon}; Path = "${escapeParam(ouPath)}";
            }
            if ("${escapeParam(description)}") { $params.Description = "${escapeParam(description)}" }
            New-ADUser @params -ErrorAction Stop
            @{ success = $true; username = "${escapeParam(username)}"; message = "Utilisateur créé avec succès" } | ConvertTo-Json -Compress
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;

    try {
        const result = await executeEncodedPowerShell(psScript, 30000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function modifyAdUser(username, modifications) {
    const {
        firstName, lastName, displayName, email, description, enabled
    } = modifications;

    const escapeParam = (str) => str ? str.replace(/"/g, '`"') : '';

    let setCommands = [];
    if (firstName) setCommands.push(`-GivenName "${escapeParam(firstName)}"`);
    if (lastName) setCommands.push(`-Surname "${escapeParam(lastName)}"`);
    if (displayName) setCommands.push(`-DisplayName "${escapeParam(displayName)}"`);
    if (email) setCommands.push(`-EmailAddress "${escapeParam(email)}"`);
    if (description !== undefined) setCommands.push(`-Description "${escapeParam(description)}"`);
    if (enabled !== undefined) setCommands.push(`-Enabled $${enabled}`);

    if (setCommands.length === 0) {
        return { success: true, message: "Aucune modification à appliquer." };
    }

    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            Set-ADUser -Identity "${escapeParam(username)}" ${setCommands.join(' ')} -ErrorAction Stop
            @{ success = $true; message = "Utilisateur modifié avec succès" } | ConvertTo-Json -Compress
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;

    try {
        const result = await executeEncodedPowerShell(psScript, 15000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function disableAdUser(username) {
    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            Disable-ADAccount -Identity "${username}" -ErrorAction Stop
            @{ success = $true; message = "Compte désactivé avec succès" } | ConvertTo-Json -Compress
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 10000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function enableAdUser(username) {
    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            Enable-ADAccount -Identity "${username}" -ErrorAction Stop
            @{ success = $true; message = "Compte activé avec succès" } | ConvertTo-Json -Compress
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 10000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function resetAdUserPassword(username, newPassword, mustChangePassword = true) {
    const escapeParam = (str) => str ? str.replace(/"/g, '`"') : '';
    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            $securePassword = ConvertTo-SecureString "${escapeParam(newPassword)}" -AsPlainText -Force
            Set-ADAccountPassword -Identity "${escapeParam(username)}" -NewPassword $securePassword -Reset -ErrorAction Stop
            if ($${mustChangePassword}) {
                Set-ADUser -Identity "${escapeParam(username)}" -ChangePasswordAtLogon $true -ErrorAction Stop
            }
            @{ success = $true; message = "Mot de passe réinitialisé avec succès" } | ConvertTo-Json -Compress
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 15000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function getAdUserDetails(username) {
    const psScript = `
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            $user = Get-ADUser -Identity "${username}" -Properties * -ErrorAction Stop
            @{
                success = $true
                user = @{
                    username = $user.SamAccountName; displayName = $user.DisplayName; firstName = $user.GivenName;
                    lastName = $user.Surname; email = $user.EmailAddress; enabled = $user.Enabled;
                    description = $user.Description; lastLogon = $user.LastLogonDate; created = $user.Created;
                    modified = $user.Modified; distinguishedName = $user.DistinguishedName;
                }
            } | ConvertTo-Json -Compress -Depth 3
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 15000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

module.exports = {
    checkAdModule,
    installAdModule,
    searchAdUsers,
    getAdGroupMembers,
    addUserToGroup,
    removeUserFromGroup,
    isUserInGroup,
    createAdUser,
    modifyAdUser,
    disableAdUser,
    enableAdUser,
    resetAdUserPassword,
    getAdUserDetails,
};