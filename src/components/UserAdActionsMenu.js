// src/pages/UsersManagementPage.js - VERSION AMÉLIORÉE AVEC MENU AD INTÉGRÉ

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';

// Icons
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/Launch';
import PrintIcon from '@mui/icons-material/Print';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import UserDialog from '../components/UserDialog';
import PrintPreviewDialog from '../components/PrintPreviewDialog';
import AdGroupToggleButton from '../components/AdGroupToggleButton';
import UserAdActionsMenu from '../components/UserAdActionsMenu';

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// --- SOUS-COMPOSANTS POUR L'AFFICHAGE ---

const UsernameCell = memo(({ displayName, username }) => {
    const [copied, setCopied] = useState(false);
    const copyToClipboard = useCallback(async (text) => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, []);

    return (
        <Box>
            <Typography variant="body2" fontWeight={500} noWrap>{displayName || '-'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary" noWrap>{username}</Typography>
                <Tooltip title="Copier l'identifiant">
                    <IconButton size="small" onClick={() => copyToClipboard(username)} sx={{ p: 0.2 }}>
                        {copied ? <CheckCircleIcon fontSize="inherit" color="success" /> : <ContentCopyIcon fontSize="inherit" />}
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
});

const PasswordCell = memo(({ password, label }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = useCallback(async (text) => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
    }, []);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
            <Typography variant="caption" sx={{ minWidth: 40 }}>{label}:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
                {isVisible ? password : '••••••••'}
            </Typography>
            <Tooltip title={isVisible ? 'Masquer' : 'Afficher'}>
                <IconButton size="small" onClick={() => setIsVisible(!isVisible)} sx={{ p: 0.2 }}>
                    {isVisible ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}
                </IconButton>
            </Tooltip>
            <Tooltip title="Copier">
                <IconButton size="small" onClick={() => copyToClipboard(password)} sx={{ p: 0.2 }}>
                    {isCopied ? <CheckCircleIcon fontSize="inherit" color="success" /> : <ContentCopyIcon fontSize="inherit" />}
                </IconButton>
            </Tooltip>
        </Box>
    );
});

const UserRow = memo(({ user, style, onEdit, onDelete, onConnect, onPrint, onOpenAdMenu, isOdd, isVpnMember, isInternetMember, onMembershipChange }) => (
    <Box 
        style={style} 
        sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: 2, 
            backgroundColor: isOdd ? 'grey.50' : 'white', 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            '&:hover': { backgroundColor: 'action.hover' } 
        }}
    >
        <Box sx={{ flex: '2 1 200px', pr: 2, minWidth: 180, overflow: 'hidden' }}>
            <UsernameCell displayName={user.displayName} username={user.username} />
        </Box>
        <Box sx={{ flex: '1 1 120px', pr: 2, minWidth: 100, overflow: 'hidden' }}>
            <Typography variant="body2" noWrap>{user.department || '-'}</Typography>
        </Box>
        <Box sx={{ flex: '2 1 200px', pr: 2, minWidth: 180, overflow: 'hidden' }}>
            <Typography variant="body2" noWrap title={user.email || ''}>{user.email || '-'}</Typography>
        </Box>
        <Box sx={{ flex: '0 0 240px', pr: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <PasswordCell password={user.password} label="Win" />
            <PasswordCell password={user.officePassword} label="Office" />
        </Box>
        <Box sx={{ flex: '0 0 240px', display: 'flex', gap: 1, pr: 2, alignItems: 'center' }}>
            <AdGroupToggleButton username={user.username} groupName="VPN" groupDisplayName="VPN" initialIsMember={isVpnMember} onMembershipChange={onMembershipChange} />
            <AdGroupToggleButton username={user.username} groupName="Sortants_responsables" groupDisplayName="Internet" initialIsMember={isInternetMember} onMembershipChange={onMembershipChange} />
        </Box>
        <Box sx={{ flex: '0 0 180px', display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
            <Tooltip title="Connexion RDP"><IconButton size="small" onClick={() => onConnect(user)}><LaunchIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Modifier (Excel)"><IconButton size="small" onClick={() => onEdit(user)}><EditIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Imprimer Fiche"><IconButton size="small" color="info" onClick={() => onPrint(user)}><PrintIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Actions Active Directory"><IconButton size="small" onClick={(e) => onOpenAdMenu(e, user)}><MoreVertIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Supprimer (Excel)"><IconButton size="small" color="error" onClick={() => onDelete(user)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
    </Box>
));

const TableHeader = memo(() => (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, backgroundColor: 'primary.main', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>
        <Box sx={{ flex: '2 1 200px', pr: 2, minWidth: 180 }}><Typography variant="subtitle2" fontWeight={600}>Utilisateur</Typography></Box>
        <Box sx={{ flex: '1 1 120px', pr: 2, minWidth: 100 }}><Typography variant="subtitle2" fontWeight={600}>Service</Typography></Box>
        <Box sx={{ flex: '2 1 200px', pr: 2, minWidth: 180 }}><Typography variant="subtitle2" fontWeight={600}>Email</Typography></Box>
        <Box sx={{ flex: '0 0 240px', pr: 2 }}><Typography variant="subtitle2" fontWeight={600}>Mots de passe</Typography></Box>
        <Box sx={{ flex: '0 0 240px', pr: 2 }}><Typography variant="subtitle2" fontWeight={600}>Groupes Sécurité</Typography></Box>
        <Box sx={{ flex: '0 0 180px', textAlign: 'right' }}><Typography variant="subtitle2" fontWeight={600}>Actions</Typography></Box>
    </Box>
));

const UsersManagementPage = () => {
    const { showNotification } = useApp();
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
    const [adMenuAnchor, setAdMenuAnchor] = useState(null);
    const [selectedUserForMenu, setSelectedUserForMenu] = useState(null);

    const { servers, departments } = useMemo(() => {
        const serversSet = new Set(users.map(u => u.server).filter(Boolean));
        const departmentsSet = new Set(users.map(u => u.department).filter(Boolean));
        return { servers: Array.from(serversSet).sort(), departments: Array.from(departmentsSet).sort() };
    }, [users]);

    const loadGroupMembers = useCallback(async (force = false) => {
        try {
            const [vpnData, internetData] = await Promise.all([
                fetchWithCache('adGroup:VPN', () => window.electronAPI.getAdGroupMembers('VPN'), { force }),
                fetchWithCache('adGroup:Sortants_responsables', () => window.electronAPI.getAdGroupMembers('Sortants_responsables'), { force })
            ]);
            setVpnMembers(new Set((vpnData.data || []).map(m => m.SamAccountName)));
            setInternetMembers(new Set((internetData.data || []).map(m => m.SamAccountName)));
        } catch (error) {
            showNotification('error', `Erreur chargement membres AD: ${error.message}`);
        }
    }, [fetchWithCache, showNotification]);

    const loadUsers = useCallback(async (force = false) => {
        const loadingState = force ? setIsRefreshing : setIsLoading;
        loadingState(true);
        try {
            const { data: usersResult } = await fetchWithCache('users', () => window.electronAPI.syncExcelUsers(), { force });
            if (usersResult.success) {
                setUsers(Object.values(usersResult.users || {}).flat());
                await loadGroupMembers(force);
            } else {
                throw new Error(usersResult.error);
            }
        } catch (error) {
            showNotification('error', `Erreur chargement: ${error.message}`);
        } finally {
            loadingState(false);
        }
    }, [fetchWithCache, showNotification, loadGroupMembers]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        let result = [...users];
        if (serverFilter !== 'all') result = result.filter(u => u.server === serverFilter);
        if (departmentFilter !== 'all') result = result.filter(u => u.department === departmentFilter);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(u => 
                u.username?.toLowerCase().includes(term) ||
                u.displayName?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term) ||
                u.department?.toLowerCase().includes(term)
            );
        }
        return result;
    }, [users, searchTerm, serverFilter, departmentFilter]);

    const debouncedSetSearch = useMemo(() => debounce(setSearchTerm, 300), []);

    const handleSaveUser = async (userData) => {
        try {
            const result = await window.electronAPI.saveUserToExcel({ user: userData, isEdit: !!userData.username });
            if (result.success) {
                showNotification('success', 'Utilisateur sauvegardé dans Excel.');
                invalidate('users');
                await loadUsers(true);
            } else throw new Error(result.error);
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        }
        setUserDialogOpen(false);
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Supprimer ${user.username} du fichier Excel ?`)) return;
        try {
            const result = await window.electronAPI.deleteUserFromExcel({ username: user.username });
            if (result.success) {
                showNotification('success', 'Utilisateur supprimé d\'Excel.');
                invalidate('users');
                await loadUsers(true);
            } else throw new Error(result.error);
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        }
    };

    const handleConnectUser = (user) => {
        if (!user.server) { showNotification('warning', 'Aucun serveur associé.'); return; }
        window.electronAPI.connectWithStoredCredentials({ server: user.server, username: user.username, password: user.password });
        showNotification('info', `Tentative de connexion à ${user.server}...`);
    };

    const handlePrintUser = (user) => { setUserToPrint(user); setPrintPreviewOpen(true); };
    const clearFilters = () => { setSearchTerm(''); setServerFilter('all'); setDepartmentFilter('all'); };

    const handleOpenAdMenu = (event, user) => {
        setAdMenuAnchor(event.currentTarget);
        setSelectedUserForMenu(user);
    };

    const handleCloseAdMenu = () => {
        setAdMenuAnchor(null);
        setSelectedUserForMenu(null);
    };

    const handleAdActionComplete = (actionType) => {
        showNotification('success', `Action '${actionType}' terminée. Rafraîchissement des données...`);
        loadUsers(true);
    };

    const Row = useCallback(({ index, style }) => {
        const user = filteredUsers[index];
        if (!user) return null;
        return (
            <UserRow
                user={user} style={style} isOdd={index % 2 === 1}
                onEdit={(u) => { setSelectedUser(u); setUserDialogOpen(true); }}
                onDelete={handleDeleteUser} onConnect={handleConnectUser} onPrint={handlePrintUser}
                onOpenAdMenu={handleOpenAdMenu}
                isVpnMember={vpnMembers.has(user.username)}
                isInternetMember={internetMembers.has(user.username)}
                onMembershipChange={() => loadGroupMembers(true)}
            />
        );
    }, [filteredUsers, vpnMembers, internetMembers, loadGroupMembers]);

    const hasActiveFilters = searchTerm || serverFilter !== 'all' || departmentFilter !== 'all';

    return (
        <Box sx={{ p: 2, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            {isRefreshing && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1300 }} />}
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">Gestion des Utilisateurs</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => { setSelectedUser(null); setUserDialogOpen(true); }}>Ajouter (Excel)</Button>
                        <Tooltip title="Actualiser"><IconButton onClick={() => loadUsers(true)} disabled={isRefreshing}>{isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}</IconButton></Tooltip>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField size="small" placeholder="Rechercher..." defaultValue={searchTerm} onChange={(e) => debouncedSetSearch(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} sx={{ minWidth: 300 }} />
                    <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Serveur</InputLabel><Select value={serverFilter} label="Serveur" onChange={(e) => setServerFilter(e.target.value)}><MenuItem value="all">Tous les serveurs</MenuItem>{servers.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
                    <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Service</InputLabel><Select value={departmentFilter} label="Service" onChange={(e) => setDepartmentFilter(e.target.value)}><MenuItem value="all">Tous les services</MenuItem>{departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</Select></FormControl>
                    {hasActiveFilters && (<Button size="small" startIcon={<ClearIcon />} onClick={clearFilters}>Effacer</Button>)}
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="body2" color="text.secondary">{filteredUsers.length} / {users.length} affiché(s)</Typography>
                </Box>
            </Paper>
            <Paper elevation={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <TableHeader />
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    {isLoading ? (<Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>) : 
                    filteredUsers.length === 0 ? (<Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Typography color="text.secondary">{users.length === 0 ? 'Aucun utilisateur trouvé' : 'Aucun résultat pour les filtres'}</Typography></Box>) : 
                    (<AutoSizer>{({ height, width }) => (<List height={height} itemCount={filteredUsers.length} itemSize={85} width={width} overscanCount={10} itemKey={index => filteredUsers[index].username}>{Row}</List>)}</AutoSizer>)}
                </Box>
            </Paper>
            {userDialogOpen && (<UserDialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} user={selectedUser} onSave={handleSaveUser} servers={servers} />)}
            {printPreviewOpen && (<PrintPreviewDialog open={printPreviewOpen} onClose={() => setPrintPreviewOpen(false)} user={userToPrint} />)}
            {selectedUserForMenu && (
                <UserAdActionsMenu
                    anchorEl={adMenuAnchor}
                    onClose={handleCloseAdMenu}
                    user={selectedUserForMenu}
                    onActionComplete={handleAdActionComplete}
                />
            )}
        </Box>
    );
};

export default memo(UsersManagementPage);