// src/pages/AdGroupsPage.js - VERSION AVEC CORRECTION DU BUG DE RECHERCHE

import React, { useState, useMemo, memo, useCallback } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
    Box, Paper, Typography, Button, IconButton, Tooltip, CircularProgress,
    InputAdornment, Chip, FormControl, InputLabel, Select,
    MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, List,
    ListItem, ListItemText, ListItemIcon, Divider
} from '@mui/material';

// Icons
import {
    Refresh as RefreshIcon, Search as SearchIcon, Group as GroupIcon,
    PersonAdd as PersonAddIcon, PersonRemove as PersonRemoveIcon,
    CheckCircle as CheckCircleIcon, Info as InfoIcon
} from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';
import useDataFetching from '../hooks/useDataFetching';

import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';
import TextField from '@mui/material/TextField';

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
        <Box sx={{ width: 60, textAlign: 'right' }}><Typography variant="subtitle2" fontWeight={600}>Actions</Typography></Box>
    </Box>
));

const AdGroupsPage = () => {
    const { config, showNotification } = useApp();
    const adGroups = useMemo(() => config?.ad_groups || {}, [config]);
    const groupKeys = useMemo(() => Object.keys(adGroups), [adGroups]);
    
    const [selectedGroup, setSelectedGroup] = useState(groupKeys[0] || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    const fetchMembers = useCallback(() => {
        if (!selectedGroup) return Promise.resolve([]);
        return apiService.getAdGroupMembers(selectedGroup);
    }, [selectedGroup]);

    const { data: members, isLoading, refresh: refreshMembers } = useDataFetching(fetchMembers, { entityName: `ad_groups:${selectedGroup}` });

    const filteredMembers = useMemo(() => {
        const memberList = Array.isArray(members) ? members : [];
        if (!searchTerm) return memberList;
        const term = searchTerm.toLowerCase();
        return memberList.filter(m => 
            (m.DisplayName || m.name || '').toLowerCase().includes(term) || 
            (m.SamAccountName || m.sam || '').toLowerCase().includes(term)
        );
    }, [members, searchTerm]);

    const handleRemoveUser = async (username, groupName) => {
        if (!window.confirm(`Retirer ${username} du groupe ${groupName} ?`)) return;
        try {
            await apiService.removeUserFromGroup(username, groupName);
            showNotification('success', `${username} retiré du groupe.`);
            refreshMembers();
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleAddUser = async (username) => {
        try {
            await apiService.addUserToGroup(username, selectedGroup);
            showNotification('success', `${username} ajouté au groupe.`);
            refreshMembers();
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

    const handleOpenAddDialog = () => {
        setUserSearchTerm('');
        setAvailableUsers([]);
        setAddUserDialogOpen(true);
    };

    const Row = ({ index, style }) => {
        const member = filteredMembers[index];
        if (!member) return null;
        return (<MemberRow member={member} style={style} isOdd={index % 2 === 1} onRemove={handleRemoveUser} groupName={selectedGroup} />);
    };

    const currentGroupData = useMemo(() => adGroups[selectedGroup] || {}, [adGroups, selectedGroup]);

    return (
        <Box sx={{ p: 2 }}>
            <PageHeader
                title="Groupes Active Directory"
                subtitle="Gestion des membres des groupes de sécurité et de distribution"
                icon={GroupIcon}
                stats={[
                    { label: 'Membres', value: members?.length || 0, icon: GroupIcon },
                    { label: 'Groupes disponibles', value: groupKeys.length, icon: InfoIcon }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenAddDialog} sx={{ borderRadius: 2 }}>Ajouter au groupe</Button>
                        <Tooltip title="Actualiser"><IconButton onClick={refreshMembers} disabled={isLoading} color="primary"><>{isLoading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}</></IconButton></Tooltip>
                    </Box>
                }
            />

            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 2 }}>
                    <FormControl sx={{ minWidth: 300 }}>
                        <InputLabel>Groupe</InputLabel>
                        <Select value={selectedGroup} label="Groupe" onChange={(e) => setSelectedGroup(e.target.value)} sx={{ borderRadius: 2 }}>
                            {Object.entries(adGroups).map(([key, group]) => (
                                <MenuItem key={key} value={key}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <GroupIcon fontSize="small" />
                                        {group.name}
                                        <Chip label={group.type} size="small" variant="outlined" />
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ flexGrow: 1 }}><SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher un membre..." fullWidth /></Box>
                    <Chip icon={<GroupIcon />} label={`${filteredMembers.length} membre(s)`} color="primary" variant="filled" sx={{ height: 40, fontSize: '0.875rem', fontWeight: 600 }} />
                </Box>
                {currentGroupData.description && (
                    <Box sx={{ p: 1.5, backgroundColor: 'info.lighter', borderRadius: 1, display: 'flex', gap: 1 }}>
                        <InfoIcon color="info" fontSize="small" />
                        <Typography variant="body2" color="info.dark">{currentGroupData.description}</Typography>
                    </Box>
                )}
            </Paper>

            {isLoading && !members ? (
                <LoadingScreen type="list" items={6} />
            ) : filteredMembers.length === 0 ? (
                <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                    <EmptyState
                        type={searchTerm ? 'search' : 'empty'}
                        title={searchTerm ? 'Aucun membre trouvé' : 'Aucun membre dans ce groupe'}
                        description={searchTerm ? 'Essayez avec d\'autres termes de recherche' : `Le groupe "${selectedGroup}" ne contient pas encore de membres`}
                        actionLabel={searchTerm ? 'Réinitialiser la recherche' : 'Ajouter un membre'}
                        onAction={searchTerm ? () => setSearchTerm('') : handleOpenAddDialog}
                    />
                </Paper>
            ) : (
                <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2, minHeight: 500 }}>
                    <TableHeader />
                    <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 400 }}>
                        <AutoSizer>
                            {({ height, width }) => (
                                <FixedSizeList height={height} itemCount={filteredMembers.length} itemSize={60} width={width} overscanCount={10}>
                                    {Row}
                                </FixedSizeList>
                            )}
                        </AutoSizer>
                    </Box>
                </Paper>
            )}

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