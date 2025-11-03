import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { lazyXLSX } from '../../utils/lazyModules';

/**
 * Import en masse d'utilisateurs depuis CSV/Excel
 * Validation et prévisualisation avant import
 */
const UserBulkImport = ({ open, onClose, onImport }) => {
  const [importData, setImportData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('upload'); // upload, preview, processing, done

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsProcessing(true);

    try {
      const XLSX = await lazyXLSX();
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          // Valider les données
          const validated = validateImportData(jsonData);
          setImportData(validated.data);
          setValidationResults(validated.results);
          setStep('preview');
        } catch (error) {
          console.error('Erreur lecture fichier:', error);
          alert('Erreur lors de la lecture du fichier');
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Erreur import:', error);
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const validateImportData = (data) => {
    const requiredFields = ['username', 'email', 'fullName'];
    const results = [];
    const validData = [];

    data.forEach((row, index) => {
      const errors = [];
      const warnings = [];

      // Vérifier champs requis
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push(`Champ "${field}" manquant`);
        }
      });

      // Valider email
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('Format email invalide');
      }

      // Valider username
      if (row.username && !/^[a-zA-Z0-9._-]+$/.test(row.username)) {
        warnings.push('Nom d\'utilisateur contient des caractères spéciaux');
      }

      results.push({
        index,
        row,
        status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success',
        errors,
        warnings
      });

      if (errors.length === 0) {
        validData.push(row);
      }
    });

    return { data: validData, results };
  };

  const handleConfirmImport = async () => {
    setStep('processing');
    setIsProcessing(true);

    try {
      if (onImport) {
        await onImport(importData);
      }
      setStep('done');
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import des utilisateurs');
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setImportData([]);
    setValidationResults([]);
    setStep('upload');
    onClose();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckIcon color="success" />;
      case 'warning':
        return <ErrorIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const validCount = validationResults.filter(r => r.status === 'success').length;
  const errorCount = validationResults.filter(r => r.status === 'error').length;
  const warningCount = validationResults.filter(r => r.status === 'warning').length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Import en masse d'utilisateurs</DialogTitle>
      <DialogContent>
        {step === 'upload' && (
          <Box sx={{ py: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Importez un fichier CSV ou Excel contenant les colonnes suivantes :
              <strong> username, email, fullName, department, role</strong>
            </Alert>

            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.2s'
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Déposez le fichier ici...' : 'Glissez-déposez un fichier ou cliquez'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Formats acceptés : CSV, XLS, XLSX
              </Typography>
            </Box>

            {isProcessing && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  Lecture du fichier...
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {step === 'preview' && (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip icon={<CheckIcon />} label={`${validCount} valides`} color="success" />
              <Chip icon={<ErrorIcon />} label={`${warningCount} avertissements`} color="warning" />
              <Chip icon={<ErrorIcon />} label={`${errorCount} erreurs`} color="error" />
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Statut</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Nom complet</TableCell>
                    <TableCell>Département</TableCell>
                    <TableCell>Messages</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validationResults.map((result) => (
                    <TableRow
                      key={result.index}
                      sx={{
                        bgcolor:
                          result.status === 'error' ? 'error.light' :
                          result.status === 'warning' ? 'warning.light' :
                          'inherit'
                      }}
                    >
                      <TableCell>
                        <Tooltip title={result.status}>
                          {getStatusIcon(result.status)}
                        </Tooltip>
                      </TableCell>
                      <TableCell>{result.row.username}</TableCell>
                      <TableCell>{result.row.email}</TableCell>
                      <TableCell>{result.row.fullName}</TableCell>
                      <TableCell>{result.row.department || '-'}</TableCell>
                      <TableCell>
                        {result.errors.map((err, i) => (
                          <Typography key={i} variant="caption" color="error" display="block">
                            {err}
                          </Typography>
                        ))}
                        {result.warnings.map((warn, i) => (
                          <Typography key={i} variant="caption" color="warning.dark" display="block">
                            {warn}
                          </Typography>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {step === 'processing' && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 3 }}>
              Import en cours...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {importData.length} utilisateurs en cours d'importation
            </Typography>
          </Box>
        )}

        {step === 'done' && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Import terminé avec succès !
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {importData.length} utilisateur(s) ont été importés
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {step === 'preview' && (
          <>
            <Button onClick={() => setStep('upload')}>Retour</Button>
            <Button
              variant="contained"
              onClick={handleConfirmImport}
              disabled={validCount === 0}
            >
              Importer {validCount} utilisateur(s)
            </Button>
          </>
        )}
        {step === 'done' && (
          <Button variant="contained" onClick={handleClose}>
            Fermer
          </Button>
        )}
        {step === 'upload' && (
          <Button onClick={handleClose}>Annuler</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserBulkImport;
