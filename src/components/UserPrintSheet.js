// src/components/UserPrintSheet.js - Version finale optimisée pour PDF et impression

import React, { forwardRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import PersonIcon from '@mui/icons-material/Person';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneIcon from '@mui/icons-material/Phone';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';

// Importation du fichier CSS pour la gestion de l'impression
import './UserPrintSheet.css';

// Composant pour une ligne d'information
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
            // Ajout de la className pour le ciblage CSS
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

// Composant pour les sections avec icônes
const SectionCard = ({ title, icon, children, severity = 'default', className = '', ...props }) => {
    const getSeverityStyles = () => {
        switch (severity) {
            case 'error':
                return {
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.02)'
                };
            case 'info':
                return {
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.02)'
                };
            case 'success':
                return {
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.02)'
                };
            default:
                return {
                    borderColor: '#e0e0e0',
                    backgroundColor: '#fafafa'
                };
        }
    };

    return (
        <Card 
            variant="outlined" 
            // Ajout de la className pour le ciblage CSS (ex: .section-no-break)
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

    const currentDate = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const currentTime = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <Box 
            ref={ref} 
            // La classe principale pour le ciblage d'impression
            className="print-sheet"
            sx={{
                p: 3,
                backgroundColor: 'white',
                color: 'black',
                width: '210mm',
                minHeight: '297mm',
                boxSizing: 'border-box',
                fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
                // Les styles d'impression sont maintenant dans UserPrintSheet.css
            }}
        >
            {/* Header principal */}
            <Paper
                elevation={0}
                sx={{
                    border: '2px solid #1976d2',
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                {/* En-tête avec logo et titre */}
                <Box sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    color: 'white',
                    p: 3,
                    textAlign: 'center'
                }}>
                    <Typography variant="h4" sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        fontSize: '28px'
                    }}>
                        FICHE D'INFORMATION UTILISATEUR
                    </Typography>
                    <Typography variant="h6" sx={{
                        opacity: 0.9,
                        fontSize: '18px',
                        fontWeight: 400
                    }}>
                        Groupe Anecoop France
                    </Typography>
                </Box>

                <CardContent sx={{ p: 3 }}>
                    {/* Informations utilisateur en grille */}
                    <Grid container spacing={3}>
                        {/* Colonne 1 - Identité */}
                        <Grid item xs={12} md={6}>
                            <SectionCard
                                title="Identité & Profil"
                                icon={<PersonIcon />}
                                severity="info"
                            >
                                <InfoItem
                                    label="Nom complet"
                                    value={user.displayName}
                                    icon={<PersonIcon fontSize="small" />}
                                />
                                <InfoItem
                                    label="Identifiant Windows/Sage/Vpn"
                                    value={user.username}
                                    icon={<SecurityIcon fontSize="small" />}
                                />
                                <InfoItem
                                    label="Service / Département"
                                    value={user.department}
                                    icon={<BusinessIcon fontSize="small" />}
                                />
                            </SectionCard>
                        </Grid>

                        {/* Colonne 2 - Accès */}
                        <Grid item xs={12} md={6}>
                            <SectionCard
                                title="Accès & Contact"
                                icon={<ComputerIcon />}
                                severity="success"
                            >
                                <InfoItem
                                    label="Email professionnel"
                                    value={user.email}
                                    icon={<EmailIcon fontSize="small" />}
                                />
                                <InfoItem
                                    label="Serveur RDS assigné"
                                    value={user.server}
                                    icon={<ComputerIcon fontSize="small" />}
                                />
                                <InfoItem
                                    label="Domaine"
                                    value="ANECOOPFR.LOCAL"
                                    icon={<SecurityIcon fontSize="small" />}
                                />
                            </SectionCard>
                        </Grid>

                        {/* Section confidentielle - Pleine largeur */}
                        <Grid item xs={12}>
                            <SectionCard
                                title="🔐 Informations Confidentielles"
                                icon={<VpnKeyIcon />}
                                severity="error"
                                // Ajout de la classe pour le ciblage CSS
                                className="confidential-info"
                                sx={{
                                    border: '3px solid #f44336',
                                    backgroundColor: '#ffebee'
                                }}
                            >
                                <Box sx={{
    backgroundColor: '#ffffff',
    p: 2,
    borderRadius: 1,
    border: '1px solid #ffcdd2'
}}>
    <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
            <InfoItem
                label="Mot de passe Windows / SAGE / VPN"
                value={user.password || 'Non défini'}
                isConfidential
                icon={<VpnKeyIcon fontSize="small" color="error" />}
            />
        </Grid>
        <Grid item xs={12} sm={6}>
            <InfoItem
                label="Mot de passe Office 365"
                value={user.officePassword || 'Non défini'}
                isConfidential
                icon={<EmailIcon fontSize="small" color="error" />}
            />
        </Grid>
    </Grid>
</Box>
                            </SectionCard>
                        </Grid>

                        {/* Section Support - Pleine largeur */}
                        <Grid item xs={12}>
                            <SectionCard
                                title="Support Technique & Assistance"
                                icon={<SupportAgentIcon />}
                                severity="info"
                                // Ajout de la classe pour le ciblage CSS
                                className="support-section"
                            >
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={8}>
                                        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                                            Pour toute demande d'assistance technique, problème de connexion
                                            ou question concernant vos accès, contactez le support IT:
                                        </Typography>

                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            mb: 2,
                                            p: 2,
                                            backgroundColor: '#e3f2fd',
                                            borderRadius: 1,
                                            border: '1px solid #90caf9'
                                        }}>
                                            <PhoneIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    04 68 68 38 44
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Interne: poste 3855
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            p: 2,
                                            backgroundColor: '#f3e5f5',
                                            borderRadius: 1,
                                            border: '1px solid #ce93d8'
                                        }}>
                                            <EmailIcon sx={{ fontSize: 24, color: 'secondary.main' }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    support@anecoop-france.com
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <Box sx={{
                                            p: 2,
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: 1,
                                            border: '1px solid #dee2e6'
                                        }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                Horaires du support:
                                            </Typography>
                                            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                                                • Lundi - Vendredi<br />
                                                • 8h00 - 12h00<br />
                                                • 14h00 - 17h30<br />
                                                • Samedi: 8h00 - 12h00
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </SectionCard>
                        </Grid>
                    </Grid>
                </CardContent>

                {/* Footer */}
                <Box
                    // Ajout de la classe pour le ciblage CSS
                    className="print-footer"
                    sx={{
                        borderTop: '2px solid #e0e0e0',
                        p: 2,
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon fontSize="small" color="error" />
                        <Typography variant="body2" sx={{
                            fontWeight: 'bold',
                            color: 'error.main'
                        }}>
                            DOCUMENT CONFIDENTIEL - NE PAS DIVULGUER
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">
                                Généré le: {currentDate}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                                à {currentTime}
                            </Typography>
                        </Box>
                        <InfoIcon fontSize="small" color="action" />
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
});

UserPrintSheet.displayName = 'UserPrintSheet';

export default UserPrintSheet;