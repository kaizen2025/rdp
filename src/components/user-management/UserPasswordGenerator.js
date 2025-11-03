import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  VpnKey as KeyIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

/**
 * Générateur de mots de passe conforme aux règles Anecoop
 * 
 * Règles RDS/Windows :
 * - Format : {1 lettre prénom}{1 lettre nom}{4 chiffres}{2 majuscules}{1 spécial}
 * - Exemple : "kb3272XM&" (Kevin Bivia)
 * 
 * Règles Office 365 :
 * - 16 caractères alphanumériques aléatoires
 */
const UserPasswordGenerator = ({ open, onClose, onGenerate, user }) => {
  const [passwordType, setPasswordType] = useState('rds'); // 'rds' ou 'office'
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [autoApply, setAutoApply] = useState(false);

  // Génération mot de passe RDS/Windows (règle Anecoop)
  const generateRdsPassword = (firstName, lastName) => {
    if (!firstName || !lastName) {
      return null;
    }

    // Format Anecoop : {1 lettre prénom}{1 lettre nom}{4 chiffres}{2 majuscules}{1 spécial}
    // Exemple : Kevin Bivia = kb3272XM&
    const prenom = firstName.charAt(0).toLowerCase(); // 1ère lettre prénom
    const nom = lastName.charAt(0).toLowerCase(); // 1ère lettre nom
    const digits = Math.floor(1000 + Math.random() * 9000); // 4 chiffres (1000-9999)
    
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const special = '!@#$%&';
    
    const randomUpper = 
      upper[Math.floor(Math.random() * upper.length)] + 
      upper[Math.floor(Math.random() * upper.length)];
    
    const randomSpecial = special[Math.floor(Math.random() * special.length)];
    
    return `${prenom}${nom}${digits}${randomUpper}${randomSpecial}`;
  };

  // Génération mot de passe Office 365
  const generateOfficePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pwd = '';
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleGenerate = () => {
    let password;
    
    if (passwordType === 'rds') {
      if (!user || !user.firstName || !user.lastName) {
        alert('Prénom et nom requis pour générer un mot de passe RDS');
        return;
      }
      password = generateRdsPassword(user.firstName, user.lastName);
    } else {
      password = generateOfficePassword();
    }

    if (password) {
      setGeneratedPassword(password);
      setCopied(false);
      
      if (autoApply && onGenerate) {
        onGenerate(password, passwordType);
      }
    }
  };

  const handleCopy = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (generatedPassword && onGenerate) {
      onGenerate(generatedPassword, passwordType);
      onClose();
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Aucun', color: 'default' };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Faible', color: 'error' };
    if (score <= 4) return { score, label: 'Moyen', color: 'warning' };
    return { score, label: 'Fort', color: 'success' };
  };

  const strength = getPasswordStrength(generatedPassword);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyIcon />
          Générateur de mots de passe Anecoop
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* Informations utilisateur */}
          {user && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Utilisateur :</strong> {user.fullName || `${user.firstName} ${user.lastName}`}
                <br />
                <strong>Email :</strong> {user.email}
              </Typography>
            </Alert>
          )}

          {/* Type de mot de passe */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Type de mot de passe
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="RDS / Windows"
                color={passwordType === 'rds' ? 'primary' : 'default'}
                onClick={() => setPasswordType('rds')}
                clickable
              />
              <Chip
                label="Office 365"
                color={passwordType === 'office' ? 'primary' : 'default'}
                onClick={() => setPasswordType('office')}
                clickable
              />
            </Box>
          </Box>

          {/* Règles du format */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" gutterBottom>
              📋 Format {passwordType === 'rds' ? 'RDS/Windows' : 'Office 365'}
            </Typography>
            <Typography variant="caption" component="div">
              {passwordType === 'rds' ? (
                <>
                  • 1 lettre prénom + 1 lettre nom (minuscules)
                  <br />
                  • 4 chiffres aléatoires
                  <br />
                  • 2 majuscules aléatoires
                  <br />
                  • 1 caractère spécial (!@#$%&)
                  <br />
                  <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                    Exemple : kb3272XM& (Kevin Bivia)
                  </Typography>
                </>
              ) : (
                <>
                  • 16 caractères alphanumériques aléatoires
                  <br />
                  • Minuscules, majuscules et chiffres
                </>
              )}
            </Typography>
          </Paper>

          {/* Bouton de génération */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleGenerate}
            >
              Générer
            </Button>
          </Box>

          {/* Mot de passe généré */}
          {generatedPassword && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Mot de passe généré
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    value={generatedPassword}
                    type={showPassword ? 'text' : 'password'}
                    InputProps={{
                      readOnly: true,
                      style: { 
                        fontFamily: 'monospace', 
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      },
                      endAdornment: (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={showPassword ? 'Masquer' : 'Afficher'}>
                            <IconButton
                              size="small"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={copied ? 'Copié !' : 'Copier'}>
                            <IconButton
                              size="small"
                              onClick={handleCopy}
                              color={copied ? 'success' : 'default'}
                            >
                              {copied ? <CheckIcon /> : <CopyIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )
                    }}
                  />
                </Box>

                {/* Force du mot de passe */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption">
                    Force du mot de passe :
                  </Typography>
                  <Chip
                    label={strength.label}
                    color={strength.color}
                    size="small"
                  />
                </Box>
              </Paper>
            </Box>
          )}

          {/* Option d'application automatique */}
          <FormControlLabel
            control={
              <Switch
                checked={autoApply}
                onChange={(e) => setAutoApply(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="caption">
                Appliquer automatiquement après génération
              </Typography>
            }
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!generatedPassword}
        >
          Appliquer le mot de passe
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserPasswordGenerator;
