// src/components/PrintPreviewDialog.js - Version finale avec correction de null

import React, { useRef, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
    CircularProgress, Typography
} from '@mui/material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UserPrintSheet from './UserPrintSheet';

const PrintPreviewDialog = ({ open, onClose, user }) => {
    const printContainerRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!user) {
        return null;
    }

    const usersToPrint = Array.isArray(user) ? user : [user];

    const generateDocument = async (outputType = 'save') => {
        if (!printContainerRef.current || isGenerating) return;
        setIsGenerating(true);
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const sheets = printContainerRef.current.querySelectorAll('.print-sheet');

            for (let i = 0; i < sheets.length; i++) {
                const canvas = await html2canvas(sheets[i], { scale: 2.5 });
                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgHeight = (pdfWidth / canvas.width) * canvas.height;

                const yPos = (i % 2 === 0) ? 0 : pdfHeight / 2;

                if (i > 0 && i % 2 === 0) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'JPEG', 0, yPos, pdfWidth, imgHeight);
            }

            if (outputType === 'print') {
                pdf.autoPrint();
                window.open(pdf.output('bloburl'), '_blank');
            } else {
                // ✅ CORRECTION: Gère le cas où le premier utilisateur n'a pas de username
                const firstUsername = usersToPrint[0]?.username || 'utilisateur';
                const fileName = usersToPrint.length > 1 ? 'Fiches_Utilisateurs.pdf' : `Fiche_${firstUsername}.pdf`;
                pdf.save(fileName);
            }
        } catch (error) {
            console.error("Erreur PDF:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>Aperçu avant impression / enregistrement</DialogTitle>
            <DialogContent sx={{ position: 'relative', backgroundColor: '#e0e0e0', p: 2 }}>
                {isGenerating && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10 }}>
                        <CircularProgress /><Typography sx={{ ml: 2 }}>Génération du document...</Typography>
                    </Box>
                )}
                <Box ref={printContainerRef}>
                    {usersToPrint.map((u, index) => (
                        // ✅ CORRECTION: Utilise l'index comme clé de secours
                        <UserPrintSheet key={u?.username || index} user={u} />
                    ))}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Fermer</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => generateDocument('print')} disabled={isGenerating}>Imprimer</Button>
                <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={() => generateDocument('save')} disabled={isGenerating}>Enregistrer en PDF</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PrintPreviewDialog;