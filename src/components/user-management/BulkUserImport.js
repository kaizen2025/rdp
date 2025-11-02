// src/components/user-management/BulkUserImport.js - Import massif d'utilisateurs CSV/Excel

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Box,
    Paper,
    Typography,
    Button,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Delete as DeleteIcon,
    Visibility as PreviewIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

/**
 * Parse CSV content
 */
const parseCSV = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        return row;
    });

    return { headers, rows };
};

/**
 * Parse Excel content
 */
const parseExcel = (arrayBuffer) => {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    if (data.length === 0) return { headers: [], rows: [] };

    const headers = data[0];
    const rows = data.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });

    return { headers, rows };
};

/**
 * Validate user data
 */
const validateUser = (user, existingUsers = []) => {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!user.username || !user.username.trim()) {
        errors.push('Identifiant requis');
    }
    if (!user.displayName || !user.displayName.trim()) {
        errors.push('Nom complet requis');
    }
    if (!user.email || !user.email.trim()) {
        errors.push('Email requis');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        errors.push('Email invalide');
    }

    // Check duplicates
    const isDuplicate = existingUsers.some(
        existing => existing.username?.toLowerCase() === user.username?.toLowerCase()
    );
    if (isDuplicate) {
        warnings.push('Utilisateur déjà existant');
    }

    // Optional warnings
    if (!user.department) {
        warnings.push('Service non spécifié');
    }
    if (!user.server) {
        warnings.push('Serveur non spécifié');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Composant principal BulkUserImport
 */
const BulkUserImport = ({ onImport, existingUsers = [], onClose }) => {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [importResults, setImportResults] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const onDrop = useCallback(async (acceptedFiles) => {
        const uploadedFile = acceptedFiles[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);

        try {
            const reader = new FileReader();

            reader.onload = async (e) => {
                const content = e.target.result;
                let parsed;

                if (uploadedFile.name.endsWith('.csv')) {
                    parsed = parseCSV(content);
                } else if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
                    parsed = parseExcel(content);
                } else {
                    return;
                }

                // Validate all users
                const usersWithValidation = parsed.rows.map(user => {
                    const validation = validateUser(user, existingUsers);
                    return { ...user, validation };
                });

                setParsedData({
                    ...parsed,
                    rows: usersWithValidation
                });

                // Select all valid users by default
                const validUsers = usersWithValidation
                    .filter(u => u.validation.valid)
                    .map((_, index) => index);
                setSelectedUsers(new Set(validUsers));
            };

            if (uploadedFile.name.endsWith('.csv')) {
                reader.readAsText(uploadedFile);
            } else {
                reader.readAsArrayBuffer(uploadedFile);
            }
        } catch (error) {
            console.error('Error parsing file:', error);
        }
    }, [existingUsers]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1
    });

    const handleToggleUser = (index) => {
        setSelectedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedUsers.size === parsedData.rows.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(parsedData.rows.map((_, index) => index)));
        }
    };

    const handleImport = async () => {
        if (!parsedData || selectedUsers.size === 0) return;

        setImporting(true);
        setProgress(0);

        const usersToImport = parsedData.rows.filter((_, index) => selectedUsers.has(index));
        const results = {
            total: usersToImport.length,
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < usersToImport.length; i++) {
            try {
                if (onImport) {
                    await onImport(usersToImport[i]);
                }
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    user: usersToImport[i].username,
                    error: error.message
                });
            }

            setProgress(((i + 1) / usersToImport.length) * 100);
        }

        setImportResults(results);
        setImporting(false);
    };

    const handleReset = () => {
        setFile(null);
        setParsedData(null);
        setSelectedUsers(new Set());
        setImportResults(null);
        setProgress(0);
    };

    const downloadTemplate = () => {
        const template = 'username,displayName,email,department,server,password,officePassword\n' +
            'jdupont,Jean Dupont,jean.dupont@anecoop.fr,IT,RDS01,Password123!,Office123!\n' +
            'mmartin,Marie Martin,marie.martin@anecoop.fr,Commercial,RDS02,Password456!,Office456!';

        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'template_import_utilisateurs.csv';
        link.click();
    };

    // Results screen
    if (importResults) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Résultats de l'import
                </Typography>

                <Alert severity={importResults.failed === 0 ? 'success' : 'warning'} sx={{ mb: 3 }}>
                    {importResults.success} utilisateur(s) importé(s) avec succès
                    {importResults.failed > 0 && ` - ${importResults.failed} échec(s)`}
                </Alert>

                {importResults.errors.length > 0 && (
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Utilisateur</TableCell>
                                    <TableCell>Erreur</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {importResults.errors.map((error, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{error.user}</TableCell>
                                        <TableCell>{error.error}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={handleReset}>
                        Importer d'autres utilisateurs
                    </Button>
                    <Button variant="contained" onClick={onClose}>
                        Fermer
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    Import Massif d'Utilisateurs
                </Typography>
                <Button
                    startIcon={<DownloadIcon />}
                    onClick={downloadTemplate}
                    size="small"
                    variant="outlined"
                >
                    Télécharger le modèle
                </Button>
            </Box>

            {!parsedData && (
                <Paper
                    {...getRootProps()}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: isDragActive ? 'primary.main' : 'divider',
                        backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'action.hover'
                        }
                    }}
                >
                    <input {...getInputProps()} />
                    <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez un fichier'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        ou cliquez pour sélectionner
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                        Formats acceptés: CSV, Excel (.xlsx, .xls)
                    </Typography>
                </Paper>
            )}

            {parsedData && !importing && (
                <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {parsedData.rows.length} utilisateur(s) détecté(s) - {selectedUsers.size} sélectionné(s)
                    </Alert>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={handleSelectAll}
                        >
                            {selectedUsers.size === parsedData.rows.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<PreviewIcon />}
                            onClick={() => setShowPreview(true)}
                        >
                            Prévisualiser
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={handleReset}
                            color="error"
                        >
                            Annuler
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        <Button
                            variant="contained"
                            disabled={selectedUsers.size === 0}
                            onClick={handleImport}
                        >
                            Importer {selectedUsers.size} utilisateur(s)
                        </Button>
                    </Box>

                    <List sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        {parsedData.rows.map((user, index) => {
                            const isSelected = selectedUsers.has(index);
                            const hasErrors = user.validation.errors.length > 0;
                            const hasWarnings = user.validation.warnings.length > 0;

                            return (
                                <ListItem
                                    key={index}
                                    sx={{
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        opacity: hasErrors ? 0.5 : 1
                                    }}
                                    secondaryAction={
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={() => handleToggleUser(index)}
                                            disabled={hasErrors}
                                        />
                                    }
                                >
                                    <ListItemIcon>
                                        {hasErrors ? (
                                            <ErrorIcon color="error" />
                                        ) : hasWarnings ? (
                                            <WarningIcon color="warning" />
                                        ) : (
                                            <SuccessIcon color="success" />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={`${user.displayName || 'N/A'} (${user.username || 'N/A'})`}
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" display="block">
                                                    {user.email || 'Email non spécifié'}
                                                </Typography>
                                                {hasErrors && (
                                                    <Box sx={{ mt: 0.5 }}>
                                                        {user.validation.errors.map((error, i) => (
                                                            <Chip
                                                                key={i}
                                                                label={error}
                                                                size="small"
                                                                color="error"
                                                                variant="outlined"
                                                                sx={{ mr: 0.5, mb: 0.5, height: 20, fontSize: '0.65rem' }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                                {hasWarnings && !hasErrors && (
                                                    <Box sx={{ mt: 0.5 }}>
                                                        {user.validation.warnings.map((warning, i) => (
                                                            <Chip
                                                                key={i}
                                                                label={warning}
                                                                size="small"
                                                                color="warning"
                                                                variant="outlined"
                                                                sx={{ mr: 0.5, mb: 0.5, height: 20, fontSize: '0.65rem' }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </>
            )}

            {importing && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Import en cours...
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                        {Math.round(progress)}% complété
                    </Typography>
                </Box>
            )}

            {/* Preview Dialog */}
            <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Prévisualisation des données</DialogTitle>
                <DialogContent>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {parsedData?.headers.map((header, index) => (
                                        <TableCell key={index}><strong>{header}</strong></TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {parsedData?.rows.slice(0, 50).map((row, index) => (
                                    <TableRow key={index}>
                                        {parsedData.headers.map((header, hIndex) => (
                                            <TableCell key={hIndex}>{row[header] || '-'}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {parsedData && parsedData.rows.length > 50 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            Affichage des 50 premières lignes sur {parsedData.rows.length}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPreview(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BulkUserImport;
