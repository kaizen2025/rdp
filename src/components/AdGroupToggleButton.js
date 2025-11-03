// src/components/AdGroupToggleButton.js - Version améliorée

import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LanguageIcon from '@mui/icons-material/Language';
import { useApp } from '../contexts/AppContext';

const AdGroupToggleButton = ({
    username,
    groupName,
    groupDisplayName,
    initialIsMember,
    onMembershipChange
}) => {
    const { showNotification } = useApp();
    const [isMember, setIsMember] = useState(initialIsMember);
    const [isUpdating, setIsUpdating] = useState(false);

    // Mettre à jour l'état si la prop change
    useEffect(() => {
        setIsMember(initialIsMember);
    }, [initialIsMember]);

    const handleToggleMembership = async () => {
        setIsUpdating(true);
        const action = isMember ? 'removeUserFromGroup' : 'addUserToGroup';
        const actionVerb = isMember ? 'retiré de' : 'ajouté à';

        try {
            const result = await window.electronAPI[action]({
                username,
                groupName
            });

            if (result.success) {
                setIsMember(!isMember);
                showNotification(
                    'success',
                    `${username} ${actionVerb} ${groupDisplayName}`
                );
                if (onMembershipChange) {
                    onMembershipChange();
                }
            } else {
                throw new Error(result.error || `Échec de l'opération`);
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const tooltipTitle = isMember
        ? `Retirer de ${groupDisplayName}`
        : `Ajouter à ${groupDisplayName}`;

    const getIcon = () => {
        if (isUpdating) return <CircularProgress size={16} />;
        if (isMember) return <CheckCircleIcon />;
        if (groupName === 'VPN') return <VpnKeyIcon />;
        return <LanguageIcon />;
    };

    return (
        <Tooltip title={tooltipTitle}>
            <span>
                <Button
                    variant={isMember ? 'contained' : 'outlined'}
                    color={isMember ? 'success' : 'inherit'}
                    size="small"
                    startIcon={getIcon()}
                    onClick={handleToggleMembership}
                    disabled={isUpdating || !username}
                    sx={{
                        minWidth: '90px',
                        textTransform: 'none',
                        fontWeight: 500
                    }}
                >
                    {groupDisplayName}
                </Button>
            </span>
        </Tooltip>
    );
};

export default AdGroupToggleButton;