// src/pages/AdGroupsPage.js - VERSION FINALE, COMPLÈTE ET DÉFINITIVEMENT CORRIGÉE

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { FixedSizeList } from 'react-window';
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
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';

const GROUPS = {
    'VPN': { name: 'VPN', description: 'Accès VPN distant', type: 'Sécurité' },
    'Sortants_responsables': { name: 'Sortants_responsables', description: 'Accès Internet', type: 'Sécurité' }
};

const MemberRow = memo(({ member, style, isOdd, onRemove, groupName }) => (
    <Box style={style} sx={{ display: 'flex', alignItems: 'center', px: 2, backgroundColor: isOdd ? 'grey.50' : 'white', borderBottom: '1px solid', borderColor: 'divider', '&:hover': { backgroundColor: 'action.hover' } }}>
        <Box sx={{ flex: 1, pr: 2 }}>
            <Typography variant="body2" fontWeight={500}>{member.DisplayName || member.name}</Typography>
            <Typography variant="caption" color="text.secondary">{member.SamAccountName || member.sam}</Typography>
        </Box>
        <Tooltip title="Retirer du groupe"><IconButton size="small" color="error" onClick={() => onRemove(member.SamAccountName || member.sam, groupName)}><PersonRemoveIcon fontSize="small" /></IconButton></Tooltip>
    </Box>
));

const TableHeader = memo(() => (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, backgroundColor: 'primary.main', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>
        <Box sx={{ flex: 1 }}><Typography variant="subtitle2" fontWeight={600}>Membre</Typography></Box>
        <Box sx={{ width: 100, textAlign: 'right' }}><Typography variant="subtitle2" fontWeight={600}>Actions</Typography></Box>
    </Box>
));

const AdGroupsPage = () => {
    const { showNotification, events } = useApp();
    const { fetchWithCache, invalidate } = useCache();
    const [selectedGroup, setSelectedGroup] = useState('VPN');
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    const loadGroupMembers = useCallback(async (force = false) => {
        const loadingState = force ? setIsRefreshing : setIsLoading;
        loadingState(true);
        try {
            const cacheKey = `adGroups:${selectedGroup}`;
            const membersData = await fetchWithCache(cacheKey, () => apiService.getAdGroupMembers(selectedGroup), { force });
            setMembers(Array.isArray(membersData) ? membersData : []);
        } catch (error) {
            showNotification('error', `Erreur chargement: ${error.message}`);
            setMembers([]);
        } finally {
            loadingState(false);
        }
    }, [selectedGroup, fetchWithCache, showNotification]);

    useEffect(() => {
        loadGroupMembers();
        const unsubscribe = events.on('data_updated:ad_groups', (payload) => {
            if (payload.group === selectedGroup) loadGroupMembers(true);
        });
        return unsubscribe;
    }, [selectedGroup, loadGroupMembers, events]);

    const filteredMembers = useMemo(() => {
        if (!searchTerm) return members;
        const term = searchTerm.toLowerCase();
        return members.filter(m => (m.DisplayName || m.name || '').toLowerCase().includes(term) || (m.SamAccountName || m.sam || '').toLowerCase().includes(term));
    }, [members, searchTerm]);

    const handleRemoveUser = async (username, groupName) => {
        if (!window.confirm(`Retirer ${username} du groupe ${groupName} ?`)) return;
        try {
            await apiService.removeUserFromGroup(username, groupName);
            showNotification('success', `${username} retiré du groupe.`);
            invalidate(`adGroups:${groupName}`);
            await loadGroupMembers(true);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleAddUser = async (username) => {
        try {
            await apiService.addUserToGroup(username, selectedGroup);
            showNotification('success', `${username} ajouté au groupe.`);
            invalidate(`adGroups:${selectedGroup}`);
            await loadGroupMembers(true);
            setAddUserDialogOpen(false);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const searchAdUsers = useCallback(async (term) => {
        if (!term || term.length < 2) { setAvailableUsers([]); return; }
        setSearchingUsers(true);
        try {
            const users = await apiService.searchAdUsers(term);
            setAvailableUsers(users || []);
        } catch (error) { showNotification('error', `Erreur recherche: ${error.message}`); setAvailableUsers([]); } 
        finally { setSearchingUsers(false); }
    }, [showNotification]);

    const Row = ({ index, style }) => {
        const member = filteredMembers[index];
        if (!member) return null;
        return (<MemberRow member={member} style={style} isOdd={index % 2 === 1} onRemove={handleRemoveUser} groupName={selectedGroup} />);
    };

    return (
        <Box sx={{ p: 2, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            {isRefreshing && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1300 }} />}
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">Gestion des Groupes Active Directory</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setAddUserDialogOpen(true)}>Ajouter</Button>
                        <Tooltip title="Actualiser"><IconButton onClick={() => loadGroupMembers(true)} disabled={isRefreshing}>{isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}</IconButton></Tooltip>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl sx={{ minWidth: 250 }}><InputLabel>Groupe</InputLabel><Select value={selectedGroup} label="Groupe" onChange={(e) => setSelectedGroup(e.target.value)}>{Object.entries(GROUPS).map(([key, group]) => (<MenuItem key={key} value={key}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><GroupIcon fontSize="small" />{group.name}<Chip label={group.type} size="small" variant="outlined" /></Box></MenuItem>))}</Select></FormControl>
                    <TextField size="small" placeholder="Rechercher un membre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }} sx={{ flexGrow: 1, maxWidth: 400 }} />
                    <Box sx={{ flexGrow: 1 }} />
                    <Chip icon={<GroupIcon />} label={`${filteredMembers.length} membre(s)`} color="primary" variant="outlined" />
                </Box>
                <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'info.lighter', borderRadius: 1, display: 'flex', gap: 1 }}><InfoIcon color="info" fontSize="small" /><Typography variant="body2" color="info.dark">{GROUPS[selectedGroup].description}</Typography></Box>
            </Paper>
            <Paper elevation={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <TableHeader />
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    {isLoading ? (<Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>) : filteredMembers.length === 0 ? (<Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Typography color="text.secondary">{members.length === 0 ? 'Aucun membre dans ce groupe' : 'Aucun résultat'}</Typography></Box>) : (<AutoSizer>{({ height, width }) => (<FixedSizeList height={height} itemCount={filteredMembers.length} itemSize={60} width={width} overscanCount={10}>{Row}</FixedSizeList>)}</AutoSizer>)}
                </Box>
            </Paper>
            <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Ajouter un utilisateur au groupe {selectedGroup}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Rechercher un utilisateur" fullWidth variant="outlined" value={userSearchTerm} onChange={(e) => { setUserSearchTerm(e.target.value); searchAdUsers(e.target.value); }} placeholder="Tapez au moins 2 caractères..." InputProps={{ startAdornment: (<InputAdornment position="start">{searchingUsers ? <CircularProgress size={20} /> : <SearchIcon />}</InputAdornment>), }} />
                    <Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                        {availableUsers.length === 0 ? (<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>{userSearchTerm.length < 2 ? 'Tapez au moins 2 caractères pour rechercher' : 'Aucun utilisateur trouvé'}</Typography>) : (<List>{availableUsers.map((user, index) => { const alreadyMember = members.some(m => (m.SamAccountName || m.sam) === user.SamAccountName); return (<React.Fragment key={user.SamAccountName}><ListItem button onClick={() => !alreadyMember && handleAddUser(user.SamAccountName)} disabled={alreadyMember}><ListItemIcon>{alreadyMember ? (<CheckCircleIcon color="success" />) : (<PersonAddIcon color="primary" />)}</ListItemIcon><ListItemText primary={user.DisplayName} secondary={<Box><Typography variant="caption" display="block">{user.SamAccountName}</Typography>{user.EmailAddress && (<Typography variant="caption" color="text.secondary">{user.EmailAddress}</Typography>)}</Box>} />{alreadyMember && (<Chip label="Déjà membre" size="small" color="success" />)}</ListItem>{index < availableUsers.length - 1 && <Divider />}</React.Fragment>); })}</List>)}
                    </Box>
                </DialogContent>
                <DialogActions><Button onClick={() => setAddUserDialogOpen(false)}>Fermer</Button></DialogActions>
            </Dialog>
        </Box>
    );
};

export default memo(AdGroupsPage);