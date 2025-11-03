import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Box
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { lazyJsPDF, lazyXLSX, lazyHtml2Canvas } from '../../utils/lazyModules';

/**
 * Composant d'export de rapports dashboard
 * Supporte PDF, Excel et images
 */
const DashboardExport = ({ dashboardRef, data, title = 'Rapport Dashboard' }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    handleClose();

    try {
      const jsPDF = (await lazyJsPDF()).default;
      const html2canvas = (await lazyHtml2Canvas()).default;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // En-tête
      pdf.setFontSize(18);
      pdf.setTextColor(33, 150, 243);
      pdf.text(title, pageWidth / 2, 20, { align: 'center' });

      // Date du rapport
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, 28, { align: 'center' });

      // Capture du dashboard si une référence est fournie
      if (dashboardRef && dashboardRef.current) {
        const canvas = await html2canvas(dashboardRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let yPosition = 35;
        let remainingHeight = imgHeight;

        // Gérer pagination si l'image est trop grande
        while (remainingHeight > 0) {
          const heightToPrint = Math.min(remainingHeight, pageHeight - yPosition - 10);
          const sourceY = imgHeight - remainingHeight;

          pdf.addImage(
            imgData,
            'PNG',
            10,
            yPosition,
            imgWidth,
            heightToPrint,
            undefined,
            'FAST',
            0,
            -sourceY
          );

          remainingHeight -= heightToPrint;

          if (remainingHeight > 0) {
            pdf.addPage();
            yPosition = 10;
          }
        }
      }

      // Ajouter données statistiques si fournies
      if (data && data.stats) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.setTextColor(0);
        pdf.text('Statistiques détaillées', 10, 20);

        let yPos = 35;
        pdf.setFontSize(10);

        Object.entries(data.stats).forEach(([key, value]) => {
          const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          pdf.text(`${label}: ${value}`, 15, yPos);
          yPos += 7;

          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
        });
      }

      // Sauvegarder
      const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    handleClose();

    try {
      const XLSX = await lazyXLSX();

      const workbook = XLSX.utils.book_new();

      // Feuille de résumé
      const summaryData = [
        ['Rapport Dashboard'],
        ['Généré le', new Date().toLocaleString('fr-FR')],
        [],
        ['Statistiques']
      ];

      if (data && data.stats) {
        Object.entries(data.stats).forEach(([key, value]) => {
          const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          summaryData.push([label, value]);
        });
      }

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

      // Feuilles de données détaillées
      if (data && data.details) {
        Object.entries(data.details).forEach(([sheetName, sheetData]) => {
          const ws = XLSX.utils.json_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(workbook, ws, sheetName);
        });
      }

      const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToImage = async () => {
    setIsExporting(true);
    handleClose();

    try {
      const html2canvas = (await lazyHtml2Canvas()).default;

      if (!dashboardRef || !dashboardRef.current) {
        alert('Impossible de capturer le dashboard');
        return;
      }

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });

    } catch (error) {
      console.error('Erreur export image:', error);
      alert('Erreur lors de l\'export image');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={isExporting}
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
        <MenuItem onClick={exportToPDF}>
          <ListItemIcon>
            <PdfIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Export PDF</ListItemText>
        </MenuItem>

        <MenuItem onClick={exportToExcel}>
          <ListItemIcon>
            <ExcelIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Export Excel</ListItemText>
        </MenuItem>

        <MenuItem onClick={exportToImage} disabled={!dashboardRef}>
          <ListItemIcon>
            <ImageIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Export Image (PNG)</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardExport;
