import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  TextField,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Mail as EmailIcon,
  Group as GroupIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';

/**
 * Actions en masse sur les utilisateurs sélectionnés
 * Supporte activation, désactivation, suppression, changement de groupe, etc.
 */
const UserBulkActions = ({ selectedUsers = [], onAction, onClearSelection }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [actionParams, setActionParams] = useState({});
  
  const open = Boolean(anchorEl);

  const actions = [
    {
      id: 'activate',
      label: 'Activer les comptes',
      icon: <UnlockIcon />,
      color: 'success',
      requiresConfirm: false,
      description: `Activer ${selectedUsers.length} compte(s)`
    },
    {
      id: 'deactivate',
      label: 'Désactiver les comptes',
      icon: <LockIcon />,
      color: 'warning',
      requiresConfirm: true,
      description: `Désactiver ${selectedUsers.length} compte(s)`
    },
    {
      id: 'reset_password',
      label: 'Réinitialiser les mots de passe',
      icon: <ResetIcon />,
      color: 'primary',
      requiresConfirm: true,
      description: `Réinitialiser le mot de passe de ${selectedUsers.length} utilisateur(s)`
    },
    {
      id: 'change_group',
      label: 'Changer de groupe',
      icon: <GroupIcon />,
      color: 'primary',
      requiresConfirm: false,
      requiresParams: true,
      description: `Affecter ${selectedUsers.length} utilisateur(s) à un groupe`
    },
    {
      id: 'send_email',
      label: 'Envoyer un email',
      icon: <EmailIcon />,
      color: 'primary',
      requiresConfirm: false,
      requiresParams: true,
      description: `Envoyer un email à ${selectedUsers.length} utilisateur(s)`
    },
    {
      id: 'delete',
      label: 'Supprimer les comptes',
      icon: <DeleteIcon />,
      color: 'error',
      requiresConfirm: true,
      dangerZone: true,
      description: `Supprimer définitivement ${selectedUsers.length} compte(s)`
    }
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action) => {
    handleClose();
    setCurrentAction(action);
    setConfirmText('');
    setActionParams({});
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!currentAction) return;

    // Validation pour actions dangereuses
    if (currentAction.dangerZone && confirmText !== 'CONFIRMER') {
      alert('Veuillez taper "CONFIRMER" pour valider cette action');
      return;
    }

    try {
      if (onAction) {
        await onAction(currentAction.id, selectedUsers, actionParams);
      }
      setDialogOpen(false);
      if (onClearSelection) {
        onClearSelection();
      }
    } catch (error) {
      console.error('Erreur action en masse:', error);
      alert('Erreur lors de l\'exécution de l\'action');
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setCurrentAction(null);
    setConfirmText('');
    setActionParams({});
  };

  const renderDialogContent = () => {
    if (!currentAction) return null;

    return (
      <Box sx={{ py: 2 }}>
        <Alert severity={currentAction.dangerZone ? 'error' : 'info'} sx={{ mb: 3 }}>
          {currentAction.description}
        </Alert>

        {/* Paramètres spécifiques à l'action */}
        {currentAction.id === 'change_group' && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Nouveau groupe</InputLabel>
            <Select
              value={actionParams.groupId || ''}
              label="Nouveau groupe"
              onChange={(e) => setActionParams({ ...actionParams, groupId: e.target.value })}
            >
              <MenuItem value="admin">Administrateurs</MenuItem>
              <MenuItem value="technicians">Techniciens</MenuItem>
              <MenuItem value="users">Utilisateurs</MenuItem>
              <MenuItem value="readonly">Lecture seule</MenuItem>
            </Select>
          </FormControl>
        )}

        {currentAction.id === 'send_email' && (
          <>
            <TextField
              fullWidth
              label="Objet de l'email"
              value={actionParams.emailSubject || ''}
              onChange={(e) => setActionParams({ ...actionParams, emailSubject: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Message"
              multiline
              rows={4}
              value={actionParams.emailBody || ''}
              onChange={(e) => setActionParams({ ...actionParams, emailBody: e.target.value })}
            />
          </>
        )}

        {currentAction.id === 'reset_password' && (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={actionParams.sendEmail || false}
                  onChange={(e) => setActionParams({ ...actionParams, sendEmail: e.target.checked })}
                />
              }
              label="Envoyer les nouveaux mots de passe par email"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={actionParams.forceChange || false}
                  onChange={(e) => setActionParams({ ...actionParams, forceChange: e.target.checked })}
                />
              }
              label="Forcer le changement à la prochaine connexion"
            />
          </Box>
        )}

        {/* Confirmation pour actions dangereuses */}
        {currentAction.dangerZone && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom fontWeight="bold">
              ⚠️ Cette action est irréversible !
            </Typography>
            <Typography variant="body2" gutterBottom>
              Pour confirmer, tapez <strong>CONFIRMER</strong> ci-dessous :
            </Typography>
            <TextField
              fullWidth
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CONFIRMER"
              sx={{ mt: 1, bgcolor: 'background.paper' }}
              autoComplete="off"
            />
          </Box>
        )}

        {/* Liste des utilisateurs concernés */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Utilisateurs concernés ({selectedUsers.length}) :
          </Typography>
          <Box
            sx={{
              maxHeight: 150,
              overflow: 'auto',
              bgcolor: 'background.default',
              p: 1,
              borderRadius: 1
            }}
          >
            {selectedUsers.slice(0, 10).map((user, index) => (
              <Typography key={index} variant="body2">
                • {user.fullName || user.username} ({user.email})
              </Typography>
            ))}
            {selectedUsers.length > 10 && (
              <Typography variant="body2" color="text.secondary">
                ... et {selectedUsers.length - 10} autre(s)
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const canExecute = () => {
    if (!currentAction) return false;
    if (currentAction.dangerZone && confirmText !== 'CONFIRMER') return false;
    if (currentAction.id === 'change_group' && !actionParams.groupId) return false;
    if (currentAction.id === 'send_email' && (!actionParams.emailSubject || !actionParams.emailBody)) return false;
    return true;
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<MoreIcon />}
        onClick={handleClick}
        disabled={selectedUsers.length === 0}
      >
        Actions en masse ({selectedUsers.length})
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {actions.map((action) => (
          <MenuItem
            key={action.id}
            onClick={() => handleActionClick(action)}
            sx={{ color: action.dangerZone ? 'error.main' : 'inherit' }}
          >
            <ListItemIcon sx={{ color: `${action.color}.main` }}>
              {action.icon}
            </ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={dialogOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentAction?.label}
        </DialogTitle>
        <DialogContent>
          {renderDialogContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Annuler</Button>
          <Button
            variant="contained"
            color={currentAction?.dangerZone ? 'error' : 'primary'}
            onClick={handleConfirm}
            disabled={!canExecute()}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserBulkActions;
