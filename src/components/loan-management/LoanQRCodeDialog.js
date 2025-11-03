// src/components/loan-management/LoanQRCodeDialog.js - GÉNÉRATION DE QR CODES POUR ÉTIQUETTES

import React, { useState, useRef, Suspense } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Paper, CircularProgress, TextField, Stack
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import { loadQRCode, loadHtml2Canvas } from '../../utils/lazyModules';

/**
 * Composant lazy-loaded pour le QR Code
 */
const QRCodeDisplay = ({ value, size }) => {
    const [QRCodeSVG, setQRCodeSVG] = useState(null);

    React.useEffect(() => {
        loadQRCode().then(setQRCodeSVG);
    }, []);

    if (!QRCodeSVG) return <CircularProgress />;

    return <QRCodeSVG value={value} size={size} level="H" includeMargin />;
};

/**
 * Dialogue pour générer et imprimer des QR codes d'étiquettes
 */
const LoanQRCodeDialog = ({ open, onClose, computer, loan }) => {
    const printRef = useRef(null);
    const [customText, setCustomText] = useState('');

    if (!computer) return null;

    const qrData = JSON.stringify({
        type: 'computer',
        id: computer.id,
        name: computer.name,
        serial: computer.serial_number || '',
        loanId: loan?.id || null
    });

    const handlePrint = () => {
        const printContent = printRef.current;
        const windowPrint = window.open('', '', 'width=600,height=600');
        windowPrint.document.write(`
            <html>
                <head>
                    <title>Étiquette - ${computer.name}</title>
                    <style>
                        @page { margin: 0; }
                        body { 
                            margin: 0; 
                            padding: 20px; 
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        }
                        .label { 
                            border: 2px solid #000;
                            padding: 15px;
                            text-align: center;
                            background: white;
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        windowPrint.document.close();
        windowPrint.focus();
        setTimeout(() => {
            windowPrint.print();
            windowPrint.close();
        }, 250);
    };

    const handleDownloadImage = async () => {
        try {
            const html2canvas = await loadHtml2Canvas();
            const canvas = await html2canvas(printRef.current, {
                backgroundColor: '#ffffff',
                scale: 2
            });
            
            const link = document.createElement('a');
            link.download = `etiquette_${computer.name}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Erreur téléchargement image:', error);
            alert('Erreur lors du téléchargement de l\'image');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Étiquette QR Code - {computer.name}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                    {/* Aperçu de l'étiquette */}
                    <Paper 
                        ref={printRef}
                        elevation={3}
                        className="label"
                        sx={{ 
                            p: 3, 
                            border: '2px solid', 
                            borderColor: 'primary.main',
                            minWidth: 300,
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            {computer.name}
                        </Typography>
                        
                        <Suspense fallback={<CircularProgress />}>
                            <QRCodeDisplay value={qrData} size={200} />
                        </Suspense>

                        {computer.serial_number && (
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                S/N: {computer.serial_number}
                            </Typography>
                        )}

                        {customText && (
                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                {customText}
                            </Typography>
                        )}

                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
                            RDS Viewer - Anecoop IT
                        </Typography>
                    </Paper>

                    {/* Personnalisation */}
                    <TextField
                        fullWidth
                        label="Texte personnalisé (optionnel)"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Ex: Bureau 204"
                        helperText="Ce texte apparaîtra sur l'étiquette"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fermer</Button>
                <Button
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadImage}
                    variant="outlined"
                >
                    Télécharger PNG
                </Button>
                <Button
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    variant="contained"
                >
                    Imprimer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoanQRCodeDialog;
