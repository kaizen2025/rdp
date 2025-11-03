/**
 * Composant d'upload de documents pour l'Agent IA
 */

import React, { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Alert
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    InsertDriveFile as FileIcon,
    Delete as DeleteIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import apiService from '../../services/apiService'; // ✅ IMPORT AJOUTÉ

const DocumentUploader = ({ onUploadComplete }) => {
    const [uploads, setUploads] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const uploadFile = useCallback(async (file) => {
        const uploadId = Date.now() + Math.random();
        
        // Ajouter à la liste des uploads
        setUploads(prev => [...prev, {
            id: uploadId,
            file: file,
            status: 'uploading',
            progress: 0
        }]);

        try {
            // ✅ UTILISATION APISERVICE
            const data = await apiService.uploadAIDocument(file);

            if (data.success) {
                // Mise à jour avec succès
                setUploads(prev => prev.map(u =>
                    u.id === uploadId
                        ? { ...u, status: 'success', progress: 100, result: data }
                        : u
                ));

                if (onUploadComplete) {
                    onUploadComplete(data);
                }

                // Supprimer de la liste après 3 secondes
                setTimeout(() => {
                    setUploads(prev => prev.filter(u => u.id !== uploadId));
                }, 3000);
            } else {
                // Erreur
                setUploads(prev => prev.map(u =>
                    u.id === uploadId
                        ? { ...u, status: 'error', error: data.error }
                        : u
                ));
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            setUploads(prev => prev.map(u =>
                u.id === uploadId
                    ? { ...u, status: 'error', error: 'Erreur de connexion' }
                    : u
            ));
        }
    }, [onUploadComplete]);

    const onDrop = useCallback((acceptedFiles) => {
        setIsDragging(false);

        acceptedFiles.forEach(file => {
            uploadFile(file);
        });
    }, [uploadFile]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'application/vnd.ms-powerpoint': ['.ppt'],
            'text/plain': ['.txt'],
            'image/*': ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
        }
    });

    const removeUpload = (uploadId) => {
        setUploads(prev => prev.filter(u => u.id !== uploadId));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Box>
            {/* Zone de drop */}
            <Paper
                {...getRootProps()}
                sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary.main' : 'divider',
                    backgroundColor: isDragging ? 'action.hover' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover'
                    }
                }}
            >
                <input {...getInputProps()} />
                <UploadIcon
                    sx={{
                        fontSize: 60,
                        color: isDragging ? 'primary.main' : 'text.secondary',
                        mb: 2
                    }}
                />
                <Typography variant="h6" gutterBottom>
                    Glissez-déposez vos fichiers ici
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    ou cliquez pour sélectionner des fichiers
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Chip label="PDF" size="small" />
                    <Chip label="Word" size="small" />
                    <Chip label="Excel" size="small" />
                    <Chip label="PowerPoint" size="small" />
                    <Chip label="Images" size="small" />
                    <Chip label="Texte" size="small" />
                </Box>
            </Paper>

            {/* Liste des uploads */}
            {uploads.length > 0 && (
                <Paper sx={{ mt: 2 }}>
                    <List>
                        {uploads.map(upload => (
                            <ListItem key={upload.id}>
                                <ListItemIcon>
                                    {upload.status === 'uploading' && <FileIcon color="action" />}
                                    {upload.status === 'success' && <SuccessIcon color="success" />}
                                    {upload.status === 'error' && <ErrorIcon color="error" />}
                                </ListItemIcon>
                                <ListItemText
                                    primary={upload.file.name}
                                    secondary={
                                        <Box>
                                            <Typography variant="caption" display="block">
                                                {formatFileSize(upload.file.size)}
                                            </Typography>
                                            {upload.status === 'uploading' && (
                                                <LinearProgress sx={{ mt: 1 }} />
                                            )}
                                            {upload.status === 'success' && upload.result && (
                                                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    <Chip
                                                        size="small"
                                                        label={upload.result.language.toUpperCase()}
                                                        color="primary"
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={`${upload.result.wordCount} mots`}
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={`${upload.result.chunksCount} chunks`}
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            )}
                                            {upload.status === 'error' && (
                                                <Alert severity="error" sx={{ mt: 1 }}>
                                                    {upload.error}
                                                </Alert>
                                            )}
                                        </Box>
                                    }
                                />
                                {upload.status !== 'uploading' && (
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => removeUpload(upload.id)}
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                )}
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default DocumentUploader;
