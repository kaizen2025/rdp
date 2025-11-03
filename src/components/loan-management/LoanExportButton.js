// src/components/loan-management/LoanExportButton.js - EXPORT EXCEL DES PRÊTS

import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { loadXLSX, loadJsPDF } from '../../utils/lazyModules';

/**
 * Bouton d'export avec menu déroulant pour Excel et PDF
 */
const LoanExportButton = ({ loans, filters }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    /**
     * Export vers Excel avec lazy loading
     */
    const exportToExcel = async () => {
        setIsExporting(true);
        handleClose();

        try {
            const XLSX = await loadXLSX();

            // Préparer les données
            const data = loans.map(loan => ({
                'ID': loan.id,
                'Ordinateur': loan.computer_name || '',
                'Utilisateur': loan.user_name || '',
                'Département': loan.user_department || '',
                'Technicien': loan.technician_name || '',
                'Date début': new Date(loan.loan_date).toLocaleDateString('fr-FR'),
                'Date retour prévue': new Date(loan.expected_return_date).toLocaleDateString('fr-FR'),
                'Date retour réelle': loan.actual_return_date ? new Date(loan.actual_return_date).toLocaleDateString('fr-FR') : 'N/A',
                'Statut': loan.status,
                'Notes': loan.notes || '',
            }));

            // Créer le workbook
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Prêts');

            // Ajuster la largeur des colonnes
            const colWidths = [
                { wch: 8 },  // ID
                { wch: 20 }, // Ordinateur
                { wch: 25 }, // Utilisateur
                { wch: 20 }, // Département
                { wch: 20 }, // Technicien
                { wch: 15 }, // Date début
                { wch: 18 }, // Date retour prévue
                { wch: 18 }, // Date retour réelle
                { wch: 12 }, // Statut
                { wch: 30 }, // Notes
            ];
            ws['!cols'] = colWidths;

            // Télécharger
            const fileName = `prets_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error('Erreur export Excel:', error);
            alert('Erreur lors de l\'export Excel');
        } finally {
            setIsExporting(false);
        }
    };

    /**
     * Export vers PDF avec lazy loading
     */
    const exportToPDF = async () => {
        setIsExporting(true);
        handleClose();

        try {
            const jsPDF = await loadJsPDF();
            const doc = new jsPDF();

            // Titre
            doc.setFontSize(16);
            doc.text('Rapport des Prêts', 14, 20);
            
            doc.setFontSize(10);
            doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
            doc.text(`Total: ${loans.length} prêt(s)`, 14, 34);

            // Tableau des prêts (simple)
            let y = 45;
            doc.setFontSize(8);
            
            loans.slice(0, 30).forEach((loan, index) => { // Limiter à 30 pour l'exemple
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                const line = `${loan.id} | ${loan.computer_name} | ${loan.user_name} | ${loan.status}`;
                doc.text(line, 14, y);
                y += 6;
            });

            if (loans.length > 30) {
                doc.text('... (données tronquées, utilisez Excel pour l\'export complet)', 14, y + 5);
            }

            // Télécharger
            const fileName = `prets_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Erreur export PDF:', error);
            alert('Erreur lors de l\'export PDF');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <Button
                variant="contained"
                startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                onClick={handleClick}
                disabled={isExporting || loans.length === 0}
            >
                Exporter
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem onClick={exportToExcel}>
                    <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Excel (.xlsx)</ListItemText>
                </MenuItem>
                <MenuItem onClick={exportToPDF}>
                    <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>PDF (.pdf)</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default LoanExportButton;
