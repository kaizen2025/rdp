// src/components/PasswordCompact.js - Composant pour afficher/masquer les mots de passe

import React, { useState, memo } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Visibility, VisibilityOff, ContentCopy as ContentCopyIcon } from '@mui/icons-material';

/**
 * Composant pour afficher un mot de passe de manière sécurisée
 * avec possibilité de le masquer/afficher et de le copier
 */
const PasswordCompact = memo(({ password, label = null }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!password) {
        return <Typography variant="caption" color="text.secondary">-</Typography>;
    }

    const handleCopy = async () => {
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
                <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                    {label}:
                </Typography>
            )}
            <Typography
                variant="body2"
                sx={{
                    fontFamily: 'monospace',
                    minWidth: '80px',
                    fontSize: '0.875rem'
                }}
            >
                {isVisible ? password : '••••••••'}
            </Typography>
            <Tooltip title={isVisible ? 'Masquer' : 'Afficher'}>
                <IconButton
                    size="small"
                    onClick={() => setIsVisible(!isVisible)}
                    sx={{ p: 0.5 }}
                >
                    {isVisible ?
                        <VisibilityOff sx={{ fontSize: '16px' }} /> :
                        <Visibility sx={{ fontSize: '16px' }} />
                    }
                </IconButton>
            </Tooltip>
            <Tooltip title={copied ? 'Copié!' : 'Copier'}>
                <IconButton
                    size="small"
                    onClick={handleCopy}
                    sx={{ p: 0.5 }}
                    color={copied ? 'success' : 'default'}
                >
                    <ContentCopyIcon sx={{ fontSize: '14px' }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
});

PasswordCompact.displayName = 'PasswordCompact';

export default PasswordCompact;
