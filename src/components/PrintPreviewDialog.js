// src/components/PrintPreviewDialog.js - Version finale optimisée pour PDF et impression

import React, { useRef, useState, forwardRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
    CircularProgress, Typography, Grid, Paper, Card, CardHeader, CardContent
} from '@mui/material';

// Icônes
import {
    Print as PrintIcon, PictureAsPdf as PictureAsPdfIcon, Person as PersonIcon,
    VpnKey as VpnKeyIcon, Email as EmailIcon, Business as BusinessIcon,
    Computer as ComputerIcon, Phone as PhoneIcon, SupportAgent as SupportAgentIcon,
    Security as SecurityIcon, Info as InfoIcon
} from '@mui/icons-material';

// Bibliothèques de génération
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Importation du fichier CSS pour la gestion de l'impression
import './UserPrintSheet.css';

const InfoItem = ({ label, value, isConfidential = false, icon, className = '' }) => (
    <Box sx={{ mb: 1.5 }} className={className}>
        <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '11px'
            }}
        >
            {icon}
            {label}
        </Typography>
        <Typography
            variant="body1"
            className={isConfidential ? 'password-field' : ''}
            sx={{
                fontWeight: isConfidential ? 'bold' : 500,
                fontFamily: isConfidential ? 'Monaco, "Cascadia Code", "Roboto Mono", monospace' : 'inherit',
                color: isConfidential ? 'error.main' : 'text.primary',
                backgroundColor: isConfidential ? '#ffebee' : '#f8f9fa',
                p: isConfidential ? '12px 16px' : '10px 12px',
                borderRadius: 1,
                display: 'inline-block',
                minWidth: isConfidential ? '140px' : '100px',
                border: isConfidential ? '2px dashed #f44336' : '1px solid #e0e0e0',
                fontSize: isConfidential ? '14px' : '13px',
                letterSpacing: isConfidential ? '0.5px' : 'normal'
            }}
        >
            {value || 'N/A'}
        </Typography>
    </Box>
);

const SectionCard = ({ title, icon, children, severity = 'default', className = '', ...props }) => {
    const getSeverityStyles = () => ({
        error: { borderColor: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.02)' },
        info: { borderColor: '#2196f3', backgroundColor: 'rgba(33, 150, 243, 0.02)' },
        success: { borderColor: '#4caf50', backgroundColor: 'rgba(76, 175, 80, 0.02)' },
        default: { borderColor: '#e0e0e0', backgroundColor: '#fafafa' }
    }[severity]);

    return (
        <Card 
            variant="outlined" 
            className={`section-no-break ${className}`}
            sx={{
                height: '100%',
                ...getSeverityStyles(),
                border: '2px solid',
                ...props.sx
            }}
        >
            <CardHeader 
                avatar={React.cloneElement(icon, {
                    color: severity === 'default' ? 'primary' : severity,
                    sx: { fontSize: 24 }
                })}
                title={
                    <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                        {title}
                    </Typography>
                }
                sx={{
                    backgroundColor: getSeverityStyles().backgroundColor,
                    borderBottom: `1px solid ${getSeverityStyles().borderColor}`,
                    py: 1.5,
                    px: 2
                }}
            />
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {children}
            </CardContent>
        </Card>
    );
};

const UserPrintSheet = forwardRef(({ user }, ref) => {
    if (!user) return null;
    const currentDate = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
        <Box ref={ref} className="print-sheet" sx={{ p: 3, backgroundColor: 'white', color: 'black', width: '210mm', minHeight: '297mm', boxSizing: 'border-box', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
            <Paper elevation={0} sx={{ border: '2px solid #1976d2', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', p: 3, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontSize: '28px' }}>FICHE D'INFORMATION UTILISATEUR</Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontSize: '18px', fontWeight: 400 }}>Groupe Anecoop France</Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}><SectionCard title="Identité & Profil" icon={<PersonIcon />} severity="info"><InfoItem label="Nom complet" value={user.displayName} icon={<PersonIcon fontSize="small" />} /><InfoItem label="Identifiant Windows/Sage/Vpn" value={user.username} icon={<SecurityIcon fontSize="small" />} /><InfoItem label="Service / Département" value={user.department} icon={<BusinessIcon fontSize="small" />} /></SectionCard></Grid>
                        <Grid item xs={12} md={6}><SectionCard title="Accès & Contact" icon={<ComputerIcon />} severity="success"><InfoItem label="Email professionnel" value={user.email} icon={<EmailIcon fontSize="small" />} /><InfoItem label="Serveur RDS assigné" value={user.server} icon={<ComputerIcon fontSize="small" />} /><InfoItem label="Domaine" value="ANECOOPFR.LOCAL" icon={<SecurityIcon fontSize="small" />} /></SectionCard></Grid>
                        <Grid item xs={12}><SectionCard title="🔐 Informations Confidentielles" icon={<VpnKeyIcon />} severity="error" className="confidential-info" sx={{ border: '3px solid #f44336', backgroundColor: '#ffebee' }}><Box sx={{ backgroundColor: '#ffffff', p: 2, borderRadius: 1, border: '1px solid #ffcdd2' }}><Grid container spacing={3}><Grid item xs={12} sm={6}><InfoItem label="Mot de passe Windows / SAGE / VPN" value={user.password || 'Non défini'} isConfidential icon={<VpnKeyIcon fontSize="small" color="error" />} /></Grid><Grid item xs={12} sm={6}><InfoItem label="Mot de passe Office 365" value={user.officePassword || 'Non défini'} isConfidential icon={<EmailIcon fontSize="small" color="error" />} /></Grid></Grid></Box></SectionCard></Grid>
                        <Grid item xs={12}><SectionCard title="Support Technique & Assistance" icon={<SupportAgentIcon />} severity="info" className="support-section"><Grid container spacing={2}><Grid item xs={12} md={8}><Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>Pour toute demande d'assistance technique, problème de connexion ou question concernant vos accès, contactez le support IT:</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9' }}><PhoneIcon sx={{ fontSize: 32, color: 'primary.main' }} /><Box><Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>04 68 68 38 44</Typography><Typography variant="body2" color="text.secondary">Interne: poste 3855</Typography></Box></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, backgroundColor: '#f3e5f5', borderRadius: 1, border: '1px solid #ce93d8' }}><EmailIcon sx={{ fontSize: 24, color: 'secondary.main' }} /><Box><Typography variant="body1" sx={{ fontWeight: 500 }}>support@anecoop-france.com</Typography></Box></Box></Grid><Grid item xs={12} md={4}><Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #dee2e6' }}><Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Horaires du support:</Typography><Typography variant="body2" sx={{ lineHeight: 1.4 }}>• Lundi - Vendredi<br />• 8h00 - 12h00<br />• 14h00 - 17h30<br />• Samedi: 8h00 - 12h00</Typography></Box></Grid></Grid></SectionCard></Grid>
                    </Grid>
                </CardContent>
                <Box className="print-footer" sx={{ borderTop: '2px solid #e0e0e0', p: 2, backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SecurityIcon fontSize="small" color="error" /><Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>DOCUMENT CONFIDENTIEL - NE PAS DIVULGUER</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Box sx={{ textAlign: 'right' }}><Typography variant="caption" color="text.secondary">Généré le: {currentDate}</Typography><br /><Typography variant="caption" color="text.secondary">à {currentTime}</Typography></Box><InfoIcon fontSize="small" color="action" /></Box>
                </Box>
            </Paper>
        </Box>
    );
});

UserPrintSheet.displayName = 'UserPrintSheet';

const PrintPreviewDialog = ({ open, onClose, user }) => {
    const printContentRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateDocument = async (outputType = 'save') => {
        if (!printContentRef.current || isGenerating) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(printContentRef.current, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasAspectRatio = canvas.height / canvas.width;
            const finalHeight = pdfWidth * canvasAspectRatio;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, finalHeight);
            if (outputType === 'print') {
                pdf.autoPrint();
                const blobUrl = pdf.output('bloburl');
                const printWindow = window.open(blobUrl, '_blank');
                if (!printWindow) alert("Veuillez autoriser les pop-ups pour imprimer ce document.");
            } else {
                pdf.save(`Fiche_Utilisateur_${user.username}.pdf`);
            }
        } catch (error) {
            console.error("Erreur lors de la génération du document:", error);
            alert("Une erreur est survenue lors de la génération du document.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>Aperçu avant impression / enregistrement</DialogTitle>
            <DialogContent sx={{ position: 'relative', backgroundColor: '#e0e0e0' }}>
                {isGenerating && <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10 }}><CircularProgress /><Typography sx={{ ml: 2 }}>Génération du document...</Typography></Box>}
                <UserPrintSheet ref={printContentRef} user={user} />
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