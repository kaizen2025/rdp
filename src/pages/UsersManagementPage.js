// src/pages/UsersManagementPage.js - VERSION FINALE, AMÉLIORÉE ET CORRIGÉE

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
    Box, Paper, Typography, Button, TextField, IconButton, Tooltip, CircularProgress,
    InputAdornment, FormControl, InputLabel, Select, MenuItem, Chip, Snackbar, Alert,
    Grid, LinearProgress, Menu, ListItemIcon, ListItemText
} from '@mui/material';

// Icons
import {
    PersonAdd as PersonAddIcon, Refresh as RefreshIcon, Search as SearchIcon,
    Clear as ClearIcon, ContentCopy as ContentCopyIcon, CheckCircle as CheckCircleIcon,
    Edit as EditIcon, Delete as DeleteIcon, Launch as LaunchIcon, Print as PrintIcon,
    Visibility, VisibilityOff, MoreVert as MoreVertIcon, VpnKey as VpnKeyIcon,
    Language as LanguageIcon, Settings as SettingsIcon
} from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';
import UserDialog from '../components/UserDialog';
import PrintPreviewDialog from '../components/PrintPreviewDialog';
import AdActionsDialog from '../components/AdActionsDialog';
import PasswordCompact from '../components/PasswordCompact';
import CopyableText from '../components/CopyableText';

const debounce = (func, wait) => {
    let timeout;
    return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); };
};

const AdGroupBadge = memo(({ groupName, isMember, onToggle, isLoading }) => {
    const isVpn = groupName === 'VPN';
    const icon = isVpn ? <VpnKeyIcon sx={{ fontSize: '14px' }} /> : <LanguageIcon sx={{ fontSize: '14px' }} />;
    const displayName = isVpn ? 'VPN' : 'INT';
    const fullGroupName = isVpn ? 'VPN' : 'Sortants_responsables (Internet)';
    return (
        <Tooltip title={`${isMember ? 'Retirer de' : 'Ajouter à'} ${fullGroupName}`}>
            <Chip
                size="small"
                icon={isLoading ? <CircularProgress size={14} color="inherit" /> : icon}
                label={displayName}
                color={isMember ? (isVpn ? 'primary' : 'success') : 'default'}
                variant="outlined"
                onClick={onToggle}
                disabled={isLoading}
                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            />
        </Tooltip>
    );
});

const UserRow = memo(({ user, style, isOdd, onEdit, onDelete, onConnect, onPrint, onOpenAdMenu, vpnMembers, internetMembers, onMembershipChange }) => {
    const { showNotification } = useApp();
    const [isUpdatingVpn, setIsUpdatingVpn] = useState(false);
    const [isUpdatingInternet, setIsUpdatingInternet] = useState(false);

    const toggleGroup = useCallback(async (group, isMember, setLoading) => {
        setLoading(true);
        try {
            const action = isMember ? apiService.removeUserFromGroup : apiService.addUserToGroup;
            await action(user.username, group);
            showNotification('success', `${user.username} ${isMember ? 'retiré de' : 'ajouté à'} ${group}`);
            onMembershipChange();
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); } 
        finally { setLoading(false); }
    }, [user.username, onMembershipChange, showNotification]);

    return (
        <Box style={style} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, backgroundColor: isOdd ? 'grey.50' : 'white', borderBottom: '1px solid #e0e0e0', '&:hover': { backgroundColor: 'action.hover' }, gap: 2 }}>
            <Box sx={{ flex: '1 1 150px', minWidth: 120, overflow: 'hidden' }}><Typography variant="body2" fontWeight="bold" noWrap>{user.displayName}</Typography><CopyableText text={user.username} /></Box>
            <Box sx={{ flex: '0.8 1 100px', minWidth: 80 }}><Typography variant="body2">{user.department || '-'}</Typography></Box>
            <Box sx={{ flex: '1.2 1 180px', minWidth: 150, overflow: 'hidden' }}><CopyableText text={user.email} /></Box>
            <Box sx={{ flex: '1 1 160px', minWidth: 140, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <PasswordCompact password={user.password} label="RDS" />
                {user.officePassword && <PasswordCompact password={user.officePassword} label="Office" />}
            </Box>
            <Box sx={{ flex: '1 1 120px', minWidth: 100, display: 'flex', gap: 1 }}><AdGroupBadge groupName="VPN" isMember={vpnMembers.has(user.username)} onToggle={() => toggleGroup('VPN', vpnMembers.has(user.username), setIsUpdatingVpn)} isLoading={isUpdatingVpn} /><AdGroupBadge groupName="Sortants_responsables" isMember={internetMembers.has(user.username)} onToggle={() => toggleGroup('Sortants_responsables', internetMembers.has(user.username), setIsUpdatingInternet)} isLoading={isUpdatingInternet} /></Box>
            <Box sx={{ flex: '0 0 auto', display: 'flex' }}>
                <Tooltip title="Connexion RDP (app bureau)"><IconButton size="small" onClick={() => onConnect(user)} disabled={!window.electronAPI}><LaunchIcon /></IconButton></Tooltip>
                <Tooltip title="Éditer (Excel)"><IconButton size="small" onClick={() => onEdit(user)}><EditIcon /></IconButton></Tooltip>
                <Tooltip title="Imprimer Fiche"><IconButton size="small" onClick={() => onPrint(user)}><PrintIcon /></IconButton></Tooltip>
                <Tooltip title="Actions AD"><IconButton size="small" onClick={(e) => onOpenAdMenu(e, user)}><MoreVertIcon /></IconButton></Tooltip>
                <Tooltip title="Supprimer (Excel)"><IconButton size="small" onClick={() => onDelete(user)}><DeleteIcon color="error" /></IconButton></Tooltip>
            </Box>
        </Box>
    );
});

const UsersManagementPage = () => {
    const { showNotification, events } = useApp();
    const { fetchWithCache, invalidate } = useCache();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [serverFilter, setServerFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
    const [userToPrint, setUserToPrint] = useState(null);
    const [vpnMembers, setVpnMembers] = useState(new Set());
    const [internetMembers, setInternetMembers] = useState(new Set());
    const [adDialogOpen, setAdDialogOpen] = useState(false);
    const [adMenuAnchor, setAdMenuAnchor] = useState(null);
    const [selectedUserForAd, setSelectedUserForAd] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const searchInputRef = useRef(null);

    const { servers, departments } = useMemo(() => ({
        servers: [...new Set(users.map(u => u.server).filter(Boolean))].sort(),
        departments: [...new Set(users.map(u => u.department).filter(Boolean))].sort()
    }), [users]);

    const loadGroupMembers = useCallback(async (force = false) => {
        try {
            const [vpnData, internetData] = await Promise.all([
                fetchWithCache('adGroup:VPN', () => apiService.getAdGroupMembers('VPN'), { force }),
                fetchWithCache('adGroup:Sortants_responsables', () => apiService.getAdGroupMembers('Sortants_responsables'), { force })
            ]);
            setVpnMembers(new Set((vpnData || []).map(m => m.SamAccountName)));
            setInternetMembers(new Set((internetData || []).map(m => m.SamAccountName)));
        } catch (error) { showNotification('error', `Erreur chargement groupes: ${error.message}`); }
    }, [fetchWithCache, showNotification]);

    const loadUsers = useCallback(async (force = false) => {
        try {
            const data = await fetchWithCache('excel_users', apiService.getExcelUsers, { force });
            if (data?.success && data?.users) {
                setUsers(Object.values(data.users).flat());
            } else {
                setUsers([]);
                showNotification('error', data?.error || 'Impossible de charger les utilisateurs Excel.');
            }
        } catch (error) { showNotification('error', `Erreur chargement utilisateurs: ${error.message}`); }
    }, [fetchWithCache, showNotification]);

    const handleRefresh = useCallback(async (force = true) => {
        setIsRefreshing(true);
        invalidate('excel_users');
        invalidate('adGroup:VPN');
        invalidate('adGroup:Sortants_responsables');
        try { await Promise.all([loadUsers(force), loadGroupMembers(force)]); } 
        finally { setIsRefreshing(false); }
    }, [loadUsers, loadGroupMembers, invalidate]);

    useEffect(() => {
        setIsLoading(true);
        handleRefresh(false).finally(() => setIsLoading(false));
        const onUsersUpdated = () => setUpdateAvailable(true);
        const unsubscribe = events.on('data_updated:excel_users', onUsersUpdated);
        return unsubscribe;
    }, [handleRefresh, events]);

    const filteredUsers = useMemo(() => {
        let result = users;

        // Filtre par serveur
        if (serverFilter !== 'all') {
            result = result.filter(u => u.server === serverFilter);
        }

        // Filtre par service/département
        if (departmentFilter !== 'all') {
            result = result.filter(u => u.department === departmentFilter);
        }

        // Filtre par recherche textuelle (amélioration: recherche ciblée)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(u => {
                const searchFields = [
                    u.displayName,
                    u.username,
                    u.email,
                    u.department,
                    u.server
                ];
                return searchFields.some(field =>
                    field && String(field).toLowerCase().includes(term)
                );
            });
        }

        return result;
    }, [users, searchTerm, serverFilter, departmentFilter]);

    const debouncedSetSearch = useMemo(() => debounce(setSearchTerm, 250), []);
    
    const handleSaveUser = async (userData) => {
        try {
            await apiService.saveUserToExcel({ user: userData, isEdit: !!selectedUser });
            showNotification('success', 'Utilisateur sauvegardé.');
            await handleRefresh(true);
            setUserDialogOpen(false);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleDeleteUser = useCallback(async (user) => {
        if (!window.confirm(`Supprimer ${user.displayName} du fichier Excel ?`)) return;
        try {
            await apiService.deleteUserFromExcel(user.username);
            showNotification('success', 'Utilisateur supprimé.');
            await handleRefresh(true);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    }, [handleRefresh, showNotification]);

    const handleConnectUser = useCallback((user) => {
        if (window.electronAPI?.launchRdp) {
            showNotification('info', `Lancement de la connexion RDP vers ${user.server}...`);
            window.electronAPI.launchRdp({ server: user.server });
        } else {
            showNotification('warning', 'La connexion RDP directe est uniquement disponible dans l\'application de bureau.');
        }
    }, [showNotification]);

    const Row = useCallback(({ index, style }) => (
        <UserRow
            user={filteredUsers[index]} style={style} isOdd={index % 2 === 1}
            onEdit={u => { setSelectedUser(u); setUserDialogOpen(true); }}
            onDelete={handleDeleteUser} onConnect={handleConnectUser}
            onPrint={u => { setUserToPrint(u); setPrintPreviewOpen(true); }}
            onOpenAdMenu={(e, u) => { setSelectedUserForAd(u); setAdMenuAnchor(e.currentTarget); }}
            vpnMembers={vpnMembers} internetMembers={internetMembers}
            onMembershipChange={() => handleRefresh(true)}
        />
    ), [filteredUsers, vpnMembers, internetMembers, handleDeleteUser, handleConnectUser, handleRefresh]);
    
    const clearFilters = () => {
        setSearchTerm('');
        if (searchInputRef.current) searchInputRef.current.value = '';
        setServerFilter('all');
        setDepartmentFilter('all');
    };

    return (
        <Box sx={{ p: 2, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {isRefreshing && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />}
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">Gestion des Utilisateurs</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}><Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => { setSelectedUser(null); setUserDialogOpen(true); }}>Ajouter</Button><Tooltip title="Actualiser les données (Excel + AD)"><span><IconButton onClick={() => handleRefresh(true)} disabled={isRefreshing}><RefreshIcon /></IconButton></span></Tooltip></Box>
                </Box>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}><TextField fullWidth size="small" placeholder="Rechercher (Nom, Identifiant, Email...)" onChange={e => debouncedSetSearch(e.target.value)} inputRef={searchInputRef} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} /></Grid>
                    <Grid item xs={6} sm={2}><FormControl fullWidth size="small"><InputLabel>Serveur</InputLabel><Select value={serverFilter} label="Serveur" onChange={e => setServerFilter(e.target.value)}><MenuItem value="all">Tous</MenuItem>{servers.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={2}><FormControl fullWidth size="small"><InputLabel>Service</InputLabel><Select value={departmentFilter} label="Service" onChange={e => setDepartmentFilter(e.target.value)}><MenuItem value="all">Tous</MenuItem>{departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={2}><Button fullWidth size="small" startIcon={<ClearIcon />} onClick={clearFilters}>Réinitialiser</Button></Grid>
                    <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}><Typography variant="body2" color="text.secondary">{filteredUsers.length} / {users.length} affichés</Typography></Grid>
                </Grid>
            </Paper>
            <Paper elevation={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.5, backgroundColor: 'primary.main', color: 'white', display: 'flex', gap: 2, fontWeight: 'bold' }}>
                    <Box sx={{ flex: '1 1 150px', minWidth: 120 }}>Utilisateur</Box><Box sx={{ flex: '0.8 1 100px', minWidth: 80 }}>Service</Box><Box sx={{ flex: '1.2 1 180px', minWidth: 150 }}>Email</Box><Box sx={{ flex: '1 1 160px', minWidth: 140 }}>Mots de passe</Box><Box sx={{ flex: '1 1 120px', minWidth: 100 }}>Groupes</Box><Box sx={{ flex: '0 0 auto', width: '180px' }}>Actions</Box>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> :
                     !filteredUsers.length ? <Typography sx={{ p: 4, textAlign: 'center' }}>Aucun utilisateur trouvé.</Typography> :
                     <AutoSizer>{({ height, width }) => <List height={height} width={width} itemCount={filteredUsers.length} itemSize={80} itemKey={i => filteredUsers[i].username}>{Row}</List>}</AutoSizer>}
                </Box>
            </Paper>
            {userDialogOpen && <UserDialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} user={selectedUser} onSave={handleSaveUser} servers={servers} />}
            {printPreviewOpen && <PrintPreviewDialog open={printPreviewOpen} onClose={() => setPrintPreviewOpen(false)} user={userToPrint} />}
            <Menu anchorEl={adMenuAnchor} open={Boolean(adMenuAnchor)} onClose={() => setAdMenuAnchor(null)}><MenuItem onClick={() => { setAdDialogOpen(true); setAdMenuAnchor(null); }}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon><ListItemText>Gérer le compte AD</ListItemText></MenuItem></Menu>
            {selectedUserForAd && <AdActionsDialog open={adDialogOpen} onClose={() => setAdDialogOpen(false)} user={selectedUserForAd} onActionComplete={() => handleRefresh(true)} />}
            <Snackbar open={updateAvailable} autoHideDuration={10000} onClose={() => setUpdateAvailable(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}><Alert severity="info" action={<Button color="inherit" size="small" onClick={() => { handleRefresh(true); setUpdateAvailable(false); }}>Recharger</Button>}>La liste des utilisateurs a été mise à jour.</Alert></Snackbar>
        </Box>
    );
};

export default memo(UsersManagementPage);