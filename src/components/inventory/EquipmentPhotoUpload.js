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
  LinearProgress,
  Grid,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

/**
 * Upload de photos pour le matériel
 * Avec prévisualisation et gestion multiple
 */
const EquipmentPhotoUpload = ({ open, onClose, onUpload, equipmentId, existingPhotos = [] }) => {
  const [photos, setPhotos] = useState(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const newPhotos = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5 MB max
    multiple: true
  });

  const handleRemovePhoto = (photoId) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo && photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  const handleUpload = async () => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      photos.forEach((photo, index) => {
        if (photo.file) {
          formData.append(`photos`, photo.file);
        }
      });
      formData.append('equipmentId', equipmentId);

      // Envoyer au backend
      const response = await fetch('http://localhost:5000/api/equipment/photos/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (onUpload) {
          onUpload(result.photos);
        }
        handleClose();
      } else {
        throw new Error('Erreur upload');
      }
    } catch (error) {
      console.error('Erreur upload photos:', error);
      alert('Erreur lors de l\'upload des photos');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    photos.forEach(photo => {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
    });
    setPhotos([]);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Upload de photos</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Formats acceptés : PNG, JPG, JPEG, GIF, WEBP - Taille max : 5 MB par photo
            </Alert>

            {/* Zone de drop */}
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
                transition: 'all 0.2s',
                mb: 3
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Déposez les photos ici...' : 'Glissez-déposez ou cliquez'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vous pouvez sélectionner plusieurs photos à la fois
              </Typography>
            </Box>

            {/* Grille de prévisualisation */}
            {photos.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Photos sélectionnées ({photos.length})
                </Typography>
                <Grid container spacing={2}>
                  {photos.map((photo) => (
                    <Grid item xs={6} sm={4} md={3} key={photo.id}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="140"
                          image={photo.preview || photo.url}
                          alt={photo.name}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardActions sx={{ justifyContent: 'space-between', px: 1 }}>
                          <Tooltip title="Agrandir">
                            <IconButton
                              size="small"
                              onClick={() => setPreviewPhoto(photo)}
                            >
                              <ZoomIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Box>
                            <Typography variant="caption" display="block" noWrap sx={{ maxWidth: 80 }}>
                              {photo.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(photo.size)}
                            </Typography>
                          </Box>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemovePhoto(photo.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  Upload en cours...
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={uploading}>
            Annuler
          </Button>
          <Button
            variant="contained"
            startIcon={uploading ? <LinearProgress size={20} /> : <CheckIcon />}
            onClick={handleUpload}
            disabled={photos.length === 0 || uploading}
          >
            {uploading ? 'Upload...' : `Uploader ${photos.length} photo(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog prévisualisation */}
      <Dialog
        open={Boolean(previewPhoto)}
        onClose={() => setPreviewPhoto(null)}
        maxWidth="lg"
      >
        <DialogTitle>
          {previewPhoto?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={previewPhoto?.preview || previewPhoto?.url}
              alt={previewPhoto?.name}
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewPhoto(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EquipmentPhotoUpload;
