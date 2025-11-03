<<<<<<< HEAD
// src/pages/ComputersPage.js - VERSION FINALE AVEC VUES MULTIPLES

import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, Button, IconButton, FormControl, InputLabel,
    Select, MenuItem, Chip, Tooltip, Grid, Menu, Card, Divider, Dialog,
    DialogTitle, DialogContent, DialogActions, Autocomplete, TextField,
    ToggleButtonGroup, ToggleButton, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays } from 'date-fns';

// Icons
=======
import React, { useState, useMemo, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, IconButton, FormControl, InputLabel,
    Select, MenuItem, Chip, Tooltip, Grid, Menu, Card, Divider, Dialog,
    ButtonGroup, ListItemIcon, ListItemText as MuiListItemText,
    ToggleButtonGroup, ToggleButton // ✅ IMPORTS AJOUTÉS
} from '@mui/material';
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
import {
    Laptop as LaptopIcon, Add as AddIcon, Refresh as RefreshIcon,
    Edit as EditIcon, Delete as DeleteIcon, History as HistoryIcon,
    Build as BuildIcon, Assignment as AssignmentIcon, MoreVert as MoreVertIcon,
    CheckCircle as CheckCircleIcon, Error as ErrorIcon, Warning as WarningIcon,
<<<<<<< HEAD
    Mouse as MouseIcon, Bolt as BoltIcon, FilterListOff as FilterListOffIcon,
    ViewModule as ViewModuleIcon, ViewList as ViewListIcon
} from '@mui/icons-material';

// ... (tous les autres imports restent les mêmes)
import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';
import ComputerDialog from '../components/ComputerDialog';
import ComputerHistoryDialog from '../components/ComputerHistoryDialog';
import MaintenanceDialog from '../components/MaintenanceDialog';
import LoanDialog from '../components/LoanDialog';
import AccessoriesManagement from '../pages/AccessoriesManagement';
=======
    FilterListOff as FilterListOffIcon, ViewModule as ViewModuleIcon, ViewList as ViewListIcon,
    Bolt as BoltIcon
} from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

<<<<<<< HEAD
=======
// ✅ CORRECTION: Import du composant QuickLoanDialog
import QuickLoanDialog from '../components/QuickLoanDialog'; 

// Lazy load des autres dialogues
const ComputerDialog = React.lazy(() => import('../components/ComputerDialog'));
const ComputerHistoryDialog = React.lazy(() => import('../components/ComputerHistoryDialog'));
const MaintenanceDialog = React.lazy(() => import('../components/MaintenanceDialog'));
const LoanDialog = React.lazy(() => import('../components/LoanDialog'));
const AccessoriesManagement = React.lazy(() => import('./AccessoriesManagement'));
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea

const STATUS_CONFIG = {
    available: { label: 'Disponible', color: 'success', icon: <CheckCircleIcon sx={{fontSize: 16}} /> },
    loaned: { label: 'Prêté', color: 'info', icon: <AssignmentIcon sx={{fontSize: 16}} /> },
    reserved: { label: 'Réservé', color: 'warning', icon: <WarningIcon sx={{fontSize: 16}} /> },
    maintenance: { label: 'Maintenance', color: 'warning', icon: <BuildIcon sx={{fontSize: 16}} /> },
    retired: { label: 'Retiré', color: 'error', icon: <ErrorIcon sx={{fontSize: 16}} /> }
};

<<<<<<< HEAD
// --- VUE CARTE (COMPACTÉE) ---
=======
// ✅ AMÉLIORATION: Vue Carte plus compacte et organisée
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
const ComputerCard = ({ computer, onEdit, onDelete, onHistory, onMaintenance, onLoan, onQuickLoan }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const statusConfig = STATUS_CONFIG[computer.status] || {};
    return (
        <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
<<<<<<< HEAD
            <Box sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600" noWrap>{computer.name}</Typography>
                    <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}><MoreVertIcon /></IconButton>
                </Box>
                <Chip icon={statusConfig.icon} label={statusConfig.label} size="small" color={statusConfig.color} sx={{ mb: 1 }} />
                <Typography variant="caption" display="block" color="text.secondary">S/N: {computer.serialNumber}</Typography>
                <Typography variant="caption" display="block" color="text.secondary">Modèle: {computer.brand} {computer.model}</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Divider />
            <Box sx={{ p: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Tooltip title="Modifier"><IconButton size="small" onClick={() => onEdit(computer)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Historique"><IconButton size="small" onClick={() => onHistory(computer)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Maintenance"><IconButton size="small" onClick={() => onMaintenance(computer)}><BuildIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
                {computer.status === 'available' && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button size="small" variant="outlined" startIcon={<BoltIcon />} onClick={() => onQuickLoan(computer)}>Rapide</Button>
                        <Button size="small" variant="contained" startIcon={<AssignmentIcon />} onClick={() => onLoan(computer)}>Complet</Button>
                    </Box>
                )}
            </Box>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { onDelete(computer); setAnchorEl(null); }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} />Supprimer</MenuItem>
=======
            <Box sx={{ p: 1.5, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600" noWrap>{computer.name}</Typography>
                    <Chip icon={statusConfig.icon} label={statusConfig.label} size="small" color={statusConfig.color} />
                </Box>
                <Typography variant="caption" display="block" color="text.secondary">S/N: {computer.serialNumber}</Typography>
                <Typography variant="caption" display="block" color="text.secondary">Modèle: {computer.brand} {computer.model}</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {computer.status === 'available' ? (
                    <ButtonGroup variant="outlined" size="small">
                        <Button startIcon={<BoltIcon />} onClick={() => onQuickLoan(computer)}>Rapide</Button>
                        <Button startIcon={<AssignmentIcon />} onClick={() => onLoan(computer)}>Complet</Button>
                    </ButtonGroup>
                ) : <Box />}
                <Tooltip title="Plus d'options">
                    <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}><MoreVertIcon /></IconButton>
                </Tooltip>
            </Box>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { onEdit(computer); setAnchorEl(null); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon><MuiListItemText>Modifier</MuiListItemText></MenuItem>
                <MenuItem onClick={() => { onHistory(computer); setAnchorEl(null); }}><ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon><MuiListItemText>Historique</MuiListItemText></MenuItem>
                <MenuItem onClick={() => { onMaintenance(computer); setAnchorEl(null); }}><ListItemIcon><BuildIcon fontSize="small" /></ListItemIcon><MuiListItemText>Maintenance</MuiListItemText></MenuItem>
                <Divider />
                <MenuItem onClick={() => { onDelete(computer); setAnchorEl(null); }} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><MuiListItemText>Supprimer</MuiListItemText></MenuItem>
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
            </Menu>
        </Card>
    );
};

<<<<<<< HEAD
// --- VUE LISTE COMPACTE ---
const ComputerListItem = ({ computer, onEdit, onLoan, onQuickLoan }) => {
    const statusConfig = STATUS_CONFIG[computer.status] || {};
    return (
        <ListItem divider secondaryAction={
            computer.status === 'available' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => onQuickLoan(computer)}>Prêt Rapide</Button>
                    <Button size="small" variant="contained" onClick={() => onLoan(computer)}>Prêt Complet</Button>
                </Box>
            )
        }>
            <ListItemIcon><LaptopIcon color={computer.status === 'available' ? 'success' : 'action'} /></ListItemIcon>
            <ListItemText
                primary={<Typography variant="body2" fontWeight={500}>{computer.name}</Typography>}
                secondary={`${computer.brand} ${computer.model} - S/N: ${computer.serialNumber}`}
            />
            <Chip label={statusConfig.label} color={statusConfig.color} size="small" sx={{ mr: 2 }} />
            <Tooltip title="Modifier"><IconButton size="small" onClick={() => onEdit(computer)}><EditIcon /></IconButton></Tooltip>
        </ListItem>
    );
};

// ... (QuickLoanDialog reste identique)
const QuickLoanDialog = ({ open, onClose, computer, users, onSave }) => {
    const { currentTechnician } = useApp();
    const [selectedUser, setSelectedUser] = useState(null);
    const [returnDate, setReturnDate] = useState(addDays(new Date(), 7));

    const handleSave = () => {
        if (!selectedUser) {
            alert("Veuillez sélectionner un utilisateur.");
            return;
        }
        const loanData = {
            computerId: computer.id,
            computerName: computer.name,
            userName: selectedUser.username,
            userDisplayName: selectedUser.displayName,
            itStaff: currentTechnician?.name || 'N/A',
            loanDate: new Date().toISOString(),
            expectedReturnDate: returnDate.toISOString(),
            status: 'active',
            notes: 'Prêt rapide',
            accessories: [],
        };
        onSave(loanData);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Prêt Rapide - {computer?.name}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}>
                        <Autocomplete
                            options={users}
                            getOptionLabel={(option) => `${option.displayName} (${option.username})`}
                            onChange={(e, newValue) => setSelectedUser(newValue)}
                            renderInput={(params) => <TextField {...params} label="Utilisateur" required autoFocus />}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <DatePicker
                            label="Date de retour"
                            value={returnDate}
                            onChange={setReturnDate}
                            minDate={new Date()}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSave} variant="contained" disabled={!selectedUser}>Créer le prêt</Button>
            </DialogActions>
        </Dialog>
=======
// ✅ AMÉLIORATION: Vue Liste corrigée et plus propre
const ComputerListItem = ({ computer, onEdit, onDelete, onHistory, onMaintenance, onLoan, onQuickLoan }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const statusConfig = STATUS_CONFIG[computer.status] || {};
    return (
        <Paper elevation={1} sx={{ display: 'flex', alignItems: 'center', p: 1.5, mb: 1, '&:hover': { bgcolor: 'action.hover' } }}>
            <ListItemIcon sx={{ mr: 1 }}><LaptopIcon color={computer.status === 'available' ? 'success' : 'action'} /></ListItemIcon>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body1" fontWeight={500} noWrap>{computer.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{computer.brand} {computer.model} - S/N: {computer.serialNumber}</Typography>
            </Box>
            <Chip label={statusConfig.label} color={statusConfig.color} size="small" sx={{ mx: 2, flexShrink: 0 }} />
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                {computer.status === 'available' && (
                    <ButtonGroup variant="outlined" size="small">
                        <Button onClick={() => onQuickLoan(computer)}>Prêt Rapide</Button>
                        <Button onClick={() => onLoan(computer)}>Prêt Complet</Button>
                    </ButtonGroup>
                )}
            </Box>
            <Tooltip title="Plus d'options">
                <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}><MoreVertIcon /></IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { onEdit(computer); setAnchorEl(null); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon><MuiListItemText>Modifier</MuiListItemText></MenuItem>
                <MenuItem onClick={() => { onHistory(computer); setAnchorEl(null); }}><ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon><MuiListItemText>Historique</MuiListItemText></MenuItem>
                <MenuItem onClick={() => { onMaintenance(computer); setAnchorEl(null); }}><ListItemIcon><BuildIcon fontSize="small" /></ListItemIcon><MuiListItemText>Maintenance</MuiListItemText></MenuItem>
                <Divider />
                <MenuItem onClick={() => { onDelete(computer); setAnchorEl(null); }} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><MuiListItemText>Supprimer</MuiListItemText></MenuItem>
            </Menu>
        </Paper>
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
    );
};

const ComputersPage = () => {
    const { showNotification } = useApp();
    const { cache, invalidate, isLoading } = useCache();
    
<<<<<<< HEAD
    const [view, setView] = useState('grid'); // 'grid', 'list', 'table'
=======
    // ✅ AMÉLIORATION: Vue liste par défaut
    const [view, setView] = useState('list');
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [brandFilter, setBrandFilter] = useState('all');
    const [dialog, setDialog] = useState({ type: null, data: null });

<<<<<<< HEAD
    // ... (toute la logique de gestion des données et des dialogues reste identique)
=======
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
    const { computers, users, itStaff, loans } = useMemo(() => ({
        computers: cache.computers || [],
        users: Object.values(cache.excel_users || {}).flat(),
        itStaff: cache.config?.it_staff || [],
        loans: cache.loans || [],
    }), [cache]);

    const filteredComputers = useMemo(() => {
        let result = [...computers];
        if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter);
        if (locationFilter !== 'all') result = result.filter(c => c.location === locationFilter);
        if (brandFilter !== 'all') result = result.filter(c => c.brand === brandFilter);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c => ['name', 'brand', 'model', 'serialNumber', 'assetTag'].some(field => c[field]?.toLowerCase().includes(term)));
        }
        return result;
    }, [computers, statusFilter, locationFilter, brandFilter, searchTerm]);

<<<<<<< HEAD
    const handleSaveComputer = async (computerData) => {
=======
    const handleSaveComputer = useCallback(async (computerData) => {
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
        try {
            await apiService.saveComputer(computerData);
            showNotification('success', 'Ordinateur sauvegardé.');
            await invalidate('computers');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setDialog({ type: null, data: null });
<<<<<<< HEAD
    };

    const handleDeleteComputer = async (computer) => {
=======
    }, [invalidate, showNotification]);

    const handleDeleteComputer = useCallback(async (computer) => {
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
        if (!window.confirm(`Supprimer ${computer.name} ?`)) return;
        try {
            await apiService.deleteComputer(computer.id);
            showNotification('success', 'Ordinateur supprimé.');
            await invalidate('computers');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
<<<<<<< HEAD
    };

    const handleSaveMaintenance = async (computerId, maintenanceData) => {
=======
    }, [invalidate, showNotification]);

    const handleSaveMaintenance = useCallback(async (computerId, maintenanceData) => {
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
        try {
            await apiService.addComputerMaintenance(computerId, maintenanceData);
            showNotification('success', 'Maintenance enregistrée.');
            await invalidate('computers');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setDialog({ type: null, data: null });
<<<<<<< HEAD
    };

    const handleCreateLoan = async (loanData) => {
=======
    }, [invalidate, showNotification]);

    const handleCreateLoan = useCallback(async (loanData) => {
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
        try {
            await apiService.createLoan(loanData);
            showNotification('success', 'Prêt créé avec succès.');
            await Promise.all([invalidate('computers'), invalidate('loans')]);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setDialog({ type: null, data: null });
<<<<<<< HEAD
    };
=======
    }, [invalidate, showNotification]);
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea

    const clearFilters = () => { setSearchTerm(''); setStatusFilter('all'); setLocationFilter('all'); setBrandFilter('all'); };
    const hasActiveFilters = searchTerm || statusFilter !== 'all' || locationFilter !== 'all' || brandFilter !== 'all';

    const stats = useMemo(() => ({
        total: computers.length,
        available: computers.filter(c => c.status === 'available').length,
        loaned: computers.filter(c => c.status === 'loaned').length,
        maintenance: computers.filter(c => c.status === 'maintenance').length
    }), [computers]);

<<<<<<< HEAD
=======
    const { locations, brands } = useMemo(() => ({
        locations: [...new Set(computers.map(c => c.location).filter(Boolean))].sort(),
        brands: [...new Set(computers.map(c => c.brand).filter(Boolean))].sort()
    }), [computers]);

>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
    return (
        <Box sx={{ p: 2 }}>
            <PageHeader
                title="Inventaire Matériel"
                subtitle="Vue d'ensemble du parc informatique"
                icon={LaptopIcon}
                stats={[
                    { label: 'Total', value: stats.total, icon: LaptopIcon },
                    { label: 'Disponibles', value: stats.available, icon: CheckCircleIcon },
                    { label: 'Prêtés', value: stats.loaned, icon: AssignmentIcon },
                    { label: 'En maintenance', value: stats.maintenance, icon: BuildIcon }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
<<<<<<< HEAD
                        <Button variant="outlined" startIcon={<MouseIcon />} onClick={() => setDialog({ type: 'accessories' })}>Gérer les accessoires</Button>
=======
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ type: 'computer' })}>Ajouter</Button>
                        <Tooltip title="Actualiser"><IconButton onClick={() => invalidate('computers')} color="primary"><RefreshIcon /></IconButton></Tooltip>
                    </Box>
                }
            />

            <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}><SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher..." fullWidth /></Grid>
<<<<<<< HEAD
                    <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Statut</InputLabel><Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>{/* ... */}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Localisation</InputLabel><Select value={locationFilter} label="Localisation" onChange={(e) => setLocationFilter(e.target.value)}>{/* ... */}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Marque</InputLabel><Select value={brandFilter} label="Marque" onChange={(e) => setBrandFilter(e.target.value)}>{/* ... */}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <ToggleButtonGroup value={view} exclusive onChange={(e, newView) => newView && setView(newView)} size="small">
                            <Tooltip title="Vue Cartes"><ToggleButton value="grid"><ViewModuleIcon /></ToggleButton></Tooltip>
                            <Tooltip title="Vue Liste"><ToggleButton value="list"><ViewListIcon /></ToggleButton></Tooltip>
=======
                    <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Statut</InputLabel><Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}><MenuItem value="all">Tous</MenuItem>{Object.entries(STATUS_CONFIG).map(([key, conf]) => <MenuItem key={key} value={key}>{conf.label}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Localisation</InputLabel><Select value={locationFilter} label="Localisation" onChange={(e) => setLocationFilter(e.target.value)}><MenuItem value="all">Toutes</MenuItem>{locations.map(loc => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Marque</InputLabel><Select value={brandFilter} label="Marque" onChange={(e) => setBrandFilter(e.target.value)}><MenuItem value="all">Toutes</MenuItem>{brands.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={3} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <ToggleButtonGroup value={view} exclusive onChange={(e, newView) => newView && setView(newView)} size="small">
                            <Tooltip title="Vue Liste"><ToggleButton value="list"><ViewListIcon /></ToggleButton></Tooltip>
                            <Tooltip title="Vue Cartes"><ToggleButton value="grid"><ViewModuleIcon /></ToggleButton></Tooltip>
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
                        </ToggleButtonGroup>
                    </Grid>
                    {hasActiveFilters && <Grid item xs={12}><Button size="small" onClick={clearFilters} startIcon={<FilterListOffIcon />}>Effacer les filtres</Button></Grid>}
                </Grid>
            </Paper>

            {isLoading ? <LoadingScreen type="cards" /> : filteredComputers.length === 0 ? (
<<<<<<< HEAD
                <EmptyState type="search" />
=======
                <EmptyState type="search" onAction={clearFilters} actionLabel="Réinitialiser les filtres" />
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
            ) : (
                <Box>
                    {view === 'grid' && (
                        <Grid container spacing={2}>
                            {filteredComputers.map(computer => (
<<<<<<< HEAD
                                <Grid item key={computer.id} xs={12} sm={6} md={4} lg={3} xl={2}>
=======
                                <Grid item key={computer.id} xs={12} sm={6} md={4} lg={3}>
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
                                    <ComputerCard computer={computer} onEdit={(c) => setDialog({ type: 'computer', data: c })} onDelete={handleDeleteComputer} onHistory={(c) => setDialog({ type: 'history', data: c })} onMaintenance={(c) => setDialog({ type: 'maintenance', data: c })} onLoan={(c) => setDialog({ type: 'loan', data: c })} onQuickLoan={(c) => setDialog({ type: 'quickLoan', data: c })} />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                    {view === 'list' && (
<<<<<<< HEAD
                        <Paper elevation={2}><List disablePadding>{filteredComputers.map(computer => <ComputerListItem key={computer.id} computer={computer} onEdit={(c) => setDialog({ type: 'computer', data: c })} onLoan={(c) => setDialog({ type: 'loan', data: c })} onQuickLoan={(c) => setDialog({ type: 'quickLoan', data: c })} />)}</List></Paper>
=======
                        <Box>{filteredComputers.map(computer => <ComputerListItem key={computer.id} computer={computer} onEdit={(c) => setDialog({ type: 'computer', data: c })} onDelete={handleDeleteComputer} onHistory={(c) => setDialog({ type: 'history', data: c })} onMaintenance={(c) => setDialog({ type: 'maintenance', data: c })} onLoan={(c) => setDialog({ type: 'loan', data: c })} onQuickLoan={(c) => setDialog({ type: 'quickLoan', data: c })} />)}</Box>
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
                    )}
                </Box>
            )}

<<<<<<< HEAD
            {/* ... (tous les dialogues restent identiques) */}
            <ComputerDialog open={dialog.type === 'computer'} onClose={() => setDialog({ type: null })} computer={dialog.data} onSave={handleSaveComputer} />
            <ComputerHistoryDialog open={dialog.type === 'history'} onClose={() => setDialog({ type: null })} computer={dialog.data} />
            <MaintenanceDialog open={dialog.type === 'maintenance'} onClose={() => setDialog({ type: null })} computer={dialog.data} onSave={handleSaveMaintenance} />
            <LoanDialog open={dialog.type === 'loan'} onClose={() => setDialog({ type: null })} computer={dialog.data} users={users} itStaff={itStaff} computers={computers} loans={loans} onSave={handleCreateLoan} />
            <QuickLoanDialog open={dialog.type === 'quickLoan'} onClose={() => setDialog({ type: null })} computer={dialog.data} users={users} onSave={handleCreateLoan} />
            <Dialog open={dialog.type === 'accessories'} onClose={() => setDialog({ type: null })} maxWidth="lg" fullWidth><AccessoriesManagement /></Dialog>
=======
            <React.Suspense fallback={<div />}>
                {dialog.type === 'computer' && <ComputerDialog open={true} onClose={() => setDialog({ type: null })} computer={dialog.data} onSave={handleSaveComputer} />}
                {dialog.type === 'history' && <ComputerHistoryDialog open={true} onClose={() => setDialog({ type: null })} computer={dialog.data} />}
                {dialog.type === 'maintenance' && <MaintenanceDialog open={true} onClose={() => setDialog({ type: null })} computer={dialog.data} onSave={handleSaveMaintenance} />}
                {dialog.type === 'loan' && <LoanDialog open={true} onClose={() => setDialog({ type: null })} computer={dialog.data} users={users} itStaff={itStaff} computers={computers} loans={loans} onSave={handleCreateLoan} />}
                {dialog.type === 'quickLoan' && <QuickLoanDialog open={true} onClose={() => setDialog({ type: null })} computer={dialog.data} users={users} onSave={handleCreateLoan} />}
                {dialog.type === 'accessories' && <Dialog open={true} onClose={() => setDialog({ type: null })} maxWidth="lg" fullWidth><AccessoriesManagement /></Dialog>}
            </React.Suspense>
>>>>>>> 450dedc5d374d1a778ce027ffc77fe956f62b2ea
        </Box>
    );
};

export default ComputersPage;