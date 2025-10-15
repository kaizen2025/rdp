// src/components/AdGroupToggleButton.js

import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import { useApp } from '../contexts/AppContext';

const AdGroupToggleButton = ({ username, groupName, groupDisplayName, initialIsMember, onMembershipChange }) => {
    const { showNotification } = useApp();
    const [isMember, setIsMember] = useState(initialIsMember);
    const [isUpdating, setIsUpdating] = useState(false);

    // Mettre à jour l'état si la prop change (après un refresh global)
    useEffect(() => {
        setIsMember(initialIsMember);
    }, [initialIsMember]);

    const handleToggleMembership = async () => {
        setIsUpdating(true);
        const action = isMember ? 'removeUserFromGroup' : 'addUserToGroup';
        const actionVerb = isMember ? 'retiré de' : 'ajouté à';
        try {
            const result = await window.electronAPI[action]({ username, groupName });
            if (result.success) {
                setIsMember(!isMember);
                showNotification('success', `Utilisateur ${username} ${actionVerb} ${groupDisplayName}.`);
                if (onMembershipChange) {
                    onMembershipChange(); // Notifier le parent de rafraîchir les listes
                }
            } else {
                throw new Error(result.error || `Échec de l'opération pour le groupe ${groupDisplayName}.`);
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const tooltipTitle = isMember
        ? `Retirer ${username} du groupe ${groupDisplayName}`
        : `Ajouter ${username} au groupe ${groupDisplayName}`;

    return (
        <Tooltip title={tooltipTitle}>
            <span> {/* Le span est nécessaire pour que le Tooltip fonctionne sur un bouton désactivé */}
                <Button
                    variant="contained"
                    color={isMember ? 'success' : 'error'}
                    size="small"
                    startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : (isMember ? <CheckCircleIcon /> : <DoNotDisturbOnIcon />)}
                    onClick={handleToggleMembership}
                    disabled={isUpdating || !username}
                    sx={{ minWidth: '110px', textTransform: 'none', fontWeight: 'bold' }}
                >
                    {groupDisplayName}
                </Button>
            </span>
        </Tooltip>
    );
};

export default AdGroupToggleButton;