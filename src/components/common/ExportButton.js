// src/components/common/ExportButton.js - Bouton d'export avec menu

import React, { useState } from 'react';
import {
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    FileDownload as ExportIcon,
    TableChart as ExcelIcon,
    Description as CsvIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { exportToCSV, exportToExcel, generateFilename } from '../../utils/exportUtils';

/**
 * Bouton d'export avec menu déroulant
 *
 * @param {Array} data - Données à exporter
 * @param {Array} columns - Configuration des colonnes
 * @param {string} title - Titre pour l'export Excel
 * @param {string} baseName - Nom de base du fichier
 * @param {boolean} disabled - Désactiver le bouton
 * @param {string} variant - Variante du bouton (contained, outlined, text)
 * @param {string} size - Taille du bouton
 */
const ExportButton = ({
    data = [],
    columns = [],
    title = 'Export',
    baseName = 'export',
    disabled = false,
    variant = 'outlined',
    size = 'medium',
    onExportStart,
    onExportComplete
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleExport = async (format) => {
        setIsExporting(true);
        handleClose();

        if (onExportStart) {
            onExportStart(format);
        }

        try {
            // Petit délai pour l'UX (montrer le spinner)
            await new Promise(resolve => setTimeout(resolve, 300));

            const filename = generateFilename(baseName, format);

            if (format === 'csv') {
                exportToCSV(data, columns, filename);
            } else if (format === 'excel') {
                exportToExcel(data, columns, title, filename);
            }

            if (onExportComplete) {
                onExportComplete(format, true);
            }
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            if (onExportComplete) {
                onExportComplete(format, false, error);
            }
        } finally {
            setIsExporting(false);
        }
    };

    const hasData = data && data.length > 0;

    return (
        <>
            <Button
                variant={variant}
                size={size}
                startIcon={isExporting ? <CircularProgress size={16} /> : <ExportIcon />}
                onClick={handleClick}
                disabled={disabled || !hasData || isExporting}
            >
                {isExporting ? 'Export en cours...' : 'Exporter'}
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={() => handleExport('csv')}>
                    <ListItemIcon>
                        <CsvIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Export CSV"
                        secondary={`${data.length} ligne(s)`}
                    />
                </MenuItem>
                <MenuItem onClick={() => handleExport('excel')}>
                    <ListItemIcon>
                        <ExcelIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Export Excel"
                        secondary="Format .xls avec styles"
                    />
                </MenuItem>
                <Divider />
                <MenuItem disabled>
                    <ListItemIcon>
                        <FilterIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Données filtrées"
                        secondary={hasData ? `${data.length} éléments` : 'Aucune donnée'}
                        primaryTypographyProps={{ variant: 'caption' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                    />
                </MenuItem>
            </Menu>
        </>
    );
};

export default ExportButton;
