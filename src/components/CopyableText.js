// src/components/CopyableText.js - Composant pour copier du texte

import React, { useState, useCallback, memo } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
// CORRECTION: Importation par défaut de l'icône
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

/**
 * Composant pour afficher du texte avec possibilité de copie
 * @param {string} text - Le texte à afficher et copier
 * @param {string} variant - La variante typographique MUI (default: 'body2')
 */
const CopyableText = memo(({ text, variant = 'body2' }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = useCallback(async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Erreur copie:', err);
        }
    }, [text]);

    return (
        <Tooltip title={copied ? 'Copié!' : 'Copier dans le presse-papiers'}>
            <Box
                onClick={copyToClipboard}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    '&:hover .copy-icon': { opacity: 1 }
                }}
            >
                <Typography variant={variant} noWrap>
                    {text || '-'}
                </Typography>
                <ContentCopyIcon
                    className="copy-icon"
                    sx={{
                        fontSize: '14px',
                        color: 'text.secondary',
                        opacity: copied ? 1 : 0,
                        transition: 'opacity 0.2s'
                    }}
                    color={copied ? 'success' : 'inherit'}
                />
            </Box>
        </Tooltip>
    );
});

CopyableText.displayName = 'CopyableText';

export default CopyableText;