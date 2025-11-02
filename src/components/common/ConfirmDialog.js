// src/components/common/ConfirmDialog.js - Dialogue de confirmation moderne et réutilisable

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Button,
    Alert,
    Box,
    Typography
} from '@mui/material';
import {
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    HelpOutline as QuestionIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

const SEVERITY_CONFIG = {
    warning: {
        icon: WarningIcon,
        color: 'warning',
        confirmColor: 'warning'
    },
    error: {
        icon: ErrorIcon,
        color: 'error',
        confirmColor: 'error'
    },
    danger: {
        icon: DeleteIcon,
        color: 'error',
        confirmColor: 'error'
    },
    info: {
        icon: InfoIcon,
        color: 'info',
        confirmColor: 'primary'
    },
    question: {
        icon: QuestionIcon,
        color: 'primary',
        confirmColor: 'primary'
    }
};

/**
 * Dialogue de confirmation moderne remplaçant window.confirm()
 *
 * @param {boolean} open - État d'ouverture du dialogue
 * @param {function} onClose - Callback appelé lors de la fermeture
 * @param {function} onConfirm - Callback appelé lors de la confirmation
 * @param {string} title - Titre du dialogue
 * @param {string} message - Message principal
 * @param {string} details - Détails additionnels (optionnel)
 * @param {string} severity - Niveau de sévérité (warning, error, danger, info, question)
 * @param {string} confirmText - Texte du bouton de confirmation
 * @param {string} cancelText - Texte du bouton d'annulation
 * @param {boolean} showCancel - Afficher le bouton d'annulation
 * @param {React.ReactNode} children - Contenu personnalisé additionnel
 */
const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = 'Confirmation',
    message,
    details,
    severity = 'question',
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    showCancel = true,
    children
}) => {
    const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.question;
    const Icon = config.icon;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderTop: `4px solid`,
                    borderColor: `${config.color}.main`
                }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Icon color={config.color} />
                    <Typography variant="h6" component="span">
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                {severity !== 'info' && severity !== 'question' && (
                    <Alert severity={config.color} sx={{ mb: 2 }}>
                        {severity === 'danger' && 'Cette action est irréversible !'}
                        {severity === 'error' && 'Attention : Cette action peut avoir des conséquences importantes.'}
                        {severity === 'warning' && 'Veuillez confirmer avant de continuer.'}
                    </Alert>
                )}

                <DialogContentText sx={{ color: 'text.primary', fontSize: '1rem' }}>
                    {message}
                </DialogContentText>

                {details && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {details}
                        </Typography>
                    </Box>
                )}

                {children && (
                    <Box sx={{ mt: 2 }}>
                        {children}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                {showCancel && (
                    <Button onClick={onClose} color="inherit">
                        {cancelText}
                    </Button>
                )}
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color={config.confirmColor}
                    autoFocus
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;


/**
 * Hook pour utiliser facilement le ConfirmDialog
 *
 * Exemple d'utilisation :
 *
 * const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
 *
 * <ConfirmDialogComponent />
 *
 * const handleDelete = async () => {
 *   const confirmed = await showConfirm({
 *     title: 'Supprimer l\'utilisateur',
 *     message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
 *     severity: 'danger'
 *   });
 *
 *   if (confirmed) {
 *     // Faire la suppression
 *   }
 * };
 */
export const useConfirmDialog = () => {
    const [dialogState, setDialogState] = React.useState({
        open: false,
        title: '',
        message: '',
        details: '',
        severity: 'question',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        showCancel: true,
        resolve: null
    });

    const showConfirm = React.useCallback((options) => {
        return new Promise((resolve) => {
            setDialogState({
                open: true,
                title: options.title || 'Confirmation',
                message: options.message || '',
                details: options.details || '',
                severity: options.severity || 'question',
                confirmText: options.confirmText || 'Confirmer',
                cancelText: options.cancelText || 'Annuler',
                showCancel: options.showCancel !== undefined ? options.showCancel : true,
                resolve
            });
        });
    }, []);

    const handleClose = React.useCallback(() => {
        if (dialogState.resolve) {
            dialogState.resolve(false);
        }
        setDialogState(prev => ({ ...prev, open: false }));
    }, [dialogState.resolve]);

    const handleConfirm = React.useCallback(() => {
        if (dialogState.resolve) {
            dialogState.resolve(true);
        }
        setDialogState(prev => ({ ...prev, open: false }));
    }, [dialogState.resolve]);

    const ConfirmDialogComponent = () => (
        <ConfirmDialog
            open={dialogState.open}
            onClose={handleClose}
            onConfirm={handleConfirm}
            title={dialogState.title}
            message={dialogState.message}
            details={dialogState.details}
            severity={dialogState.severity}
            confirmText={dialogState.confirmText}
            cancelText={dialogState.cancelText}
            showCancel={dialogState.showCancel}
        />
    );

    return { showConfirm, ConfirmDialogComponent };
};
