import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import {
  History as HistoryIcon,
  Visibility as ViewIcon,
  CompareArrows as CompareIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Historique complet des modifications utilisateurs
 * Avec comparaison avant/après (diff)
 */
const UserModificationHistory = ({ userId, username }) => {
  const [history, setHistory] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId]);

  const loadHistory = async () => {
    try {
      // Récupérer l'historique depuis le backend
      const response = await fetch(`http://localhost:5000/api/users/${userId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        // Données de démonstration
        setHistory(generateDemoHistory());
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      setHistory(generateDemoHistory());
    }
  };

  const generateDemoHistory = () => {
    return [
      {
        id: 1,
        timestamp: new Date('2025-11-02T14:30:00'),
        action: 'update',
        user: 'admin',
        changes: {
          email: { before: 'ancien@example.com', after: 'nouveau@example.com' },
          department: { before: 'IT', after: 'Marketing' }
        }
      },
      {
        id: 2,
        timestamp: new Date('2025-11-01T09:15:00'),
        action: 'password_reset',
        user: 'admin',
        changes: {
          password: { before: '********', after: '********' }
        }
      },
      {
        id: 3,
        timestamp: new Date('2025-10-30T16:45:00'),
        action: 'deactivate',
        user: 'supervisor',
        changes: {
          status: { before: 'active', after: 'inactive' }
        }
      },
      {
        id: 4,
        timestamp: new Date('2025-10-15T11:20:00'),
        action: 'create',
        user: 'admin',
        changes: {
          username: { before: null, after: username || 'user123' },
          email: { before: null, after: 'user@example.com' }
        }
      }
    ];
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'success',
      update: 'primary',
      delete: 'error',
      password_reset: 'warning',
      activate: 'success',
      deactivate: 'warning'
    };
    return colors[action] || 'default';
  };

  const getActionLabel = (action) => {
    const labels = {
      create: 'Création',
      update: 'Modification',
      delete: 'Suppression',
      password_reset: 'Réinit. mot de passe',
      activate: 'Activation',
      deactivate: 'Désactivation'
    };
    return labels[action] || action;
  };

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setDialogOpen(true);
  };

  const renderDiff = (fieldName, change) => {
    if (!change) return null;

    return (
      <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          {fieldName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Paper
            sx={{
              flex: 1,
              p: 1.5,
              bgcolor: change.before ? 'error.light' : 'grey.100',
              border: '1px solid',
              borderColor: change.before ? 'error.main' : 'grey.300'
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Avant
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {change.before || '(vide)'}
            </Typography>
          </Paper>
          
          <CompareIcon color="action" />
          
          <Paper
            sx={{
              flex: 1,
              p: 1.5,
              bgcolor: change.after ? 'success.light' : 'grey.100',
              border: '1px solid',
              borderColor: change.after ? 'success.main' : 'grey.300'
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Après
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {change.after || '(vide)'}
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Historique des modifications
        </Typography>
        <Chip
          icon={<HistoryIcon />}
          label={`${history.length} événement(s)`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {history.length === 0 ? (
        <Alert severity="info">
          Aucun historique disponible pour cet utilisateur.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Effectué par</TableCell>
                <TableCell>Champs modifiés</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getActionLabel(entry.action)}
                      color={getActionColor(entry.action)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{entry.user}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {Object.keys(entry.changes || {}).map((field) => (
                        <Chip
                          key={field}
                          label={field}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Voir les détails">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(entry)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog de détails */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              Détails de la modification
            </Box>
            <IconButton size="small" onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Action :</strong> {getActionLabel(selectedEntry.action)}
                  <br />
                  <strong>Date :</strong>{' '}
                  {format(new Date(selectedEntry.timestamp), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  <br />
                  <strong>Effectué par :</strong> {selectedEntry.user}
                </Typography>
              </Alert>

              <Typography variant="h6" gutterBottom>
                Comparaison avant/après
              </Typography>

              {Object.entries(selectedEntry.changes || {}).map(([field, change]) => (
                <Box key={field}>
                  {renderDiff(field, change)}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserModificationHistory;
