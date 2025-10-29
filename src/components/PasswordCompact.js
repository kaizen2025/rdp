// src/components/PasswordCompact.js - Composant pour afficher/masquer les mots de passe

import React, { useState, memo } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
// CORRECTION: Importation par défaut des icônes
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

/**
 * Composant pour afficher un mot de passe de manière sécurisée
 * avec possibilité de le masquer/afficher et de le copier
 */
const PasswordCompact = memo(({ password, label = null }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    const hasPassword = password && password.trim().length > 0;

    const handleCopy = async () => {
        if (!hasPassword) return;
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {label && (
                <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, minWidth: 40 }}>
                    {label}:
                </Typography>
            )}
            <Typography
                variant="body2"
                sx={{
                    fontFamily: 'monospace',
                    minWidth: '80px',
                    fontSize: '0.875rem',
                    color: hasPassword ? 'text.primary' : 'text.disabled'
                }}
            >
                {hasPassword ? (isVisible ? password : '••••••••') : 'Non défini'}
            </Typography>
            <Tooltip title={hasPassword ? (isVisible ? 'Masquer' : 'Afficher') : 'Aucun mot de passe'}>
                <span>
                    <IconButton
                        size="small"
                        onClick={() => setIsVisible(!isVisible)}
                        sx={{ p: 0.5 }}
                        disabled={!hasPassword}
                    >
                        {isVisible ?
                            <VisibilityOff sx={{ fontSize: '16px' }} /> :
                            <Visibility sx={{ fontSize: '16px' }} />
                        }
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={hasPassword ? (copied ? 'Copié!' : 'Copier') : 'Aucun mot de passe à copier'}>
                <span>
                    <IconButton
                        size="small"
                        onClick={handleCopy}
                        sx={{ p: 0.5 }}
                        color={copied ? 'success' : 'default'}
                        disabled={!hasPassword}
                    >
                        <ContentCopyIcon sx={{ fontSize: '14px' }} />
                    </IconButton>
                </span>
            </Tooltip>
        </Box>
    );
});

PasswordCompact.displayName = 'PasswordCompact';

export default PasswordCompact;