// src/pages/ConnectionsPageEnhanced.js - VERSION AMÉLIORÉE AVEC MONITORING

import React, { useState, useMemo, useEffect, memo } from 'react';
import { useApp } from '../contexts/AppContext';
import {
    Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Tooltip, Switch, FormControlLabel, List, ListItem, ListItemText,
    ListItemIcon, Grid, Snackbar, TextField, Divider, Tabs, Tab
} from '@mui/material';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icons
import {
    AdminPanelSettings as AdminPanelSettingsIcon,
    ManageAccounts as ManageAccountsIcon,
    NetworkPing as NetworkPingIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Computer as ComputerIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    DragIndicator as DragIndicatorIcon,
    Info as InfoIcon,
    Notes as NotesIcon,
    Monitoring as MonitoringIcon
} from '@mui/icons-material';

import ServerMonitoringPanel from '../components/server-monitoring/ServerMonitoringPanel';

// Composants DialoguesSimples (utiliser les composants existants de ConnectionsPage.js)
const ManualConnectionDialog = ({ open, server, config, onClose, onSubmit }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '', domain: '' });
    useEffect(() => { if (open) setCredentials({ username: '', password: '', domain: config?.domain || '' }); }, [open, config]);
    const handleSubmit = () => { if (credentials.username && credentials.password) { onSubmit({ ...credentials, server }); onClose(); } };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Connexion Manuelle - {server}</DialogTitle>
            <DialogContent>
                <TextField autoFocus margin="dense" label="Nom d'utilisateur" fullWidth value={credentials.username} onChange={(e) => setCredentials(p => ({...p, username: e.target.value}))} />
                <TextField margin="dense" label="Mot de passe" type="password" fullWidth value={credentials.password} onChange={(e) => setCredentials(p => ({...p, password: e.target.value}))} />
                <TextField margin="dense" label="Domaine (optionnel)" fullWidth value={credentials.domain} onChange={(e) => setCredentials(p => ({...p, domain: e.target.value}))} />
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} variant="contained">Se connecter</Button></DialogActions>
        </Dialog>
    );
};

const GroupEditDialog = ({ open, type, item, onClose, onSubmit }) => {
    const [value, setValue] = useState('');
    useEffect(() => { if (open) setValue(item || ''); }, [open, item]);
    const title = type === 'addGroup' ? "Créer un groupe" : `Renommer "${item}"`;
    return (<Dialog open={open} onClose={onClose}><DialogTitle>{title}</DialogTitle><DialogContent><TextField autoFocus margin="dense" label="Nom du groupe" fullWidth value={value} onChange={e => setValue(e.target.value)} /></DialogContent><DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={() => { onSubmit(value); onClose(); }}>Confirmer</Button></DialogActions></Dialog>);
};

const ServerInfoDialog = ({ open, server, onClose }) => {
    if (!server) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" /> Informations - {server.name}
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Nom d'affichage</Typography><Typography>{server.name}</Typography></Grid>
                    <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">IP / Nom d'hôte</Typography><Typography>{server.hostname}</Typography></Grid>
                    {server.notes && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Notes rapides</Typography><Typography>{server.notes}</Typography></Grid>}
                    {server.informations && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Informations détaillées</Typography><Paper variant="outlined" sx={{ p: 1, mt: 0.5, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>{server.informations}</Paper></Grid>}
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2">Identifiants spécifiques</Typography>
                        {server.useCustomCredentials ? (
                            <Box>
                                <Typography>Utilisateur: {server.username}</Typography>
                                <Typography>Domaine: {server.domain || '(par défaut)'}</Typography>
                            </Box>
                        ) : (
                            <Typography color="text.secondary">Non (utilise les identifiants par défaut)</Typography>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Fermer</Button></DialogActions>
        </Dialog>
    );
};

const ServerEditDialog = ({ open, server, groupName, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({ name: '', hostname: '', notes: '', informations: '', useCustomCredentials: false, username: '', password: '', domain: '' });
    
    useEffect(() => { 
        if (open) {
            const initialData = server 
                ? { ...{ notes: '', informations: '', useCustomCredentials: false, username: '', password: '', domain: '' }, ...server }
                : { name: '', hostname: '', notes: '', informations: '', useCustomCredentials: false, username: '', password: '', domain: '' };
            setFormData(initialData);
        }
    }, [open, server]);

    const handleChange = (e) => { 
        const { name, value, type, checked } = e.target; 
        setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value })); 
    };
    
    const handleSubmit = () => { 
        const dataToSubmit = {
            name: formData.name,
            hostname: formData.hostname,
            notes: formData.notes,
            informations: formData.informations,
            useCustomCredentials: formData.useCustomCredentials,
        };
        if (formData.useCustomCredentials) {
            dataToSubmit.username = formData.username;
            dataToSubmit.password = formData.password;
            dataToSubmit.domain = formData.domain;
        }
        onSubmit(dataToSubmit); 
        onClose(); 
    };

    return ( 
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth> 
            <DialogTitle>{server ? `Modifier ${server.name}` : `Ajouter un serveur à ${groupName}`}</DialogTitle> 
            <DialogContent> 
                <Grid container spacing={2} sx={{ pt: 1 }}> 
                    <Grid item xs={12} sm={6}><TextField name="name" label="Nom d'affichage" value={formData.name} onChange={handleChange} fullWidth required /></Grid> 
                    <Grid item xs={12} sm={6}><TextField name="hostname" label="IP / Nom d'hôte" value={formData.hostname} onChange={handleChange} fullWidth required /></Grid> 
                    <Grid item xs={12}><TextField name="notes" label="Notes rapides (optionnel)" value={formData.notes} onChange={handleChange} fullWidth helperText="Info courte visible au survol de l'icône" /></Grid>
                    <Grid item xs={12}><TextField name="informations" label="Informations détaillées (optionnel)" value={formData.informations} onChange={handleChange} fullWidth multiline rows={4} placeholder="Rôle du serveur, configuration, notes de maintenance..." /></Grid>
                    <Grid item xs={12}><FormControlLabel control={<Switch name="useCustomCredentials" checked={formData.useCustomCredentials} onChange={handleChange} />} label="Utiliser des identifiants spécifiques pour ce serveur" /></Grid> 
                    {formData.useCustomCredentials && (
                        <> 
                            <Grid item xs={12} sm={6}><TextField name="username" label="Utilisateur" value={formData.username} onChange={handleChange} fullWidth /></Grid> 
                            <Grid item xs={12} sm={6}><TextField name="password" label="Mot de passe" type="password" value={formData.password} onChange={handleChange} fullWidth /></Grid> 
                            <Grid item xs={12}><TextField name="domain" label="Domaine (si différent)" value={formData.domain} onChange={handleChange} fullWidth /></Grid> 
                        </>
                    )} 
                </Grid> 
            </DialogContent> 
            <DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} variant="contained">Sauvegarder</Button></DialogActions> 
        </Dialog> 
    );
};

const SortableServerItem = memo(({ id, server, groupName, editMode, actions }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 1 : 0, position: 'relative' };

    return (
        <ListItem ref={setNodeRef} style={style} divider secondaryAction={
            <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Informations"><IconButton size="small" onClick={() => actions.onShowInfo(server)}><InfoIcon /></IconButton></Tooltip>
                <Tooltip title="Connexion Admin (app bureau)"><span><IconButton size="small" onClick={() => actions.onAdminConnect(server)} disabled={!window.electronAPI}><AdminPanelSettingsIcon /></IconButton></span></Tooltip>
                <Tooltip title="Connexion Manuelle (app bureau)"><span><IconButton size="small" onClick={() => actions.onManualConnect(server)} disabled={!window.electronAPI}><ManageAccountsIcon /></IconButton></span></Tooltip>
                <Tooltip title="Ping (app bureau)"><span><IconButton size="small" onClick={() => actions.onPing(server)} disabled={!window.electronAPI}><NetworkPingIcon /></IconButton></span></Tooltip>
                {editMode && (
                    <>
                        <Tooltip title="Modifier"><IconButton size="small" onClick={() => actions.onEditServer(groupName, server)}><EditIcon /></IconButton></Tooltip>
                        <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => actions.onDeleteServer(groupName, server)}><DeleteIcon /></IconButton></Tooltip>
                    </>
                )}
            </Box>
        }>
            {editMode && <DragIndicatorIcon color="action" sx={{ cursor: 'grab', touchAction: 'none' }} {...attributes} {...listeners} />}
            <ListItemIcon><ComputerIcon color={server.useCustomCredentials ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText 
                primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        {server.name}
                        {server.informations && <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'action.active' }} />}
                    </Box>
                } 
                secondary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography component="span" variant="body2" color="text.secondary">{server.hostname}</Typography>
                        {server.notes && <NotesIcon sx={{ ml: 1, fontSize: 16, color: 'action.active' }} />}
                    </Box>
                } 
            />
        </ListItem>
    );
});

const ConnectionsPageEnhanced = () => {
    const { config, handleSaveConfig, showNotification } = useApp();
    const [currentTab, setCurrentTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [pingResult, setPingResult] = useState({ open: false, text: '' });
    const [editMode, setEditMode] = useState(false);
    const [editableGroups, setEditableGroups] = useState({});
    const [dialog, setDialog] = useState({ open: false, type: null, item: null, group: '' });
    const [manualConnectionDialog, setManualConnectionDialog] = useState({ open: false, server: '' });
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const allServers = useMemo(() => {
        const servers = [];
        Object.values(editableGroups).forEach(groupServers => {
            servers.push(...groupServers);
        });
        return servers;
    }, [editableGroups]);

    useEffect(() => {
        const groups = config?.server_groups || {};
        const upgradedGroups = {};
        for (const groupName in groups) {
            upgradedGroups[groupName] = (groups[groupName] || []).map(server =>
                typeof server === 'string' ? { name: server, hostname: server } : server
            );
        }
        setEditableGroups(upgradedGroups);
    }, [config, editMode]);

    const filteredServerGroups = useMemo(() => {
        if (!searchTerm) return editableGroups;
        const term = searchTerm.toLowerCase();
        const filtered = {};
        for (const groupName in editableGroups) {
            const matchingServers = editableGroups[groupName].filter(s => s.name.toLowerCase().includes(term) || s.hostname.toLowerCase().includes(term));
            if (matchingServers.length > 0 || groupName.toLowerCase().includes(term)) filtered[groupName] = matchingServers;
        }
        return filtered;
    }, [searchTerm, editableGroups]);

    const handleAdminConnect = (server) => {
        if (!window.electronAPI) return showNotification('info', 'Fonctionnalité disponible uniquement dans l\'application de bureau.');
        if (server.useCustomCredentials) {
            window.electronAPI.connectWithStoredCredentials({ server: server.hostname, username: server.username, password: server.password, domain: server.domain });
        } else {
            window.electronAPI.quickConnect(server.hostname);
        }
    };
    
    const handlePing = async (server) => {
        if (!window.electronAPI) return showNotification('info', 'Fonctionnalité disponible uniquement dans l\'application de bureau.');
        setPingResult({ open: true, text: `Ping de ${server.hostname}...` });
        const res = await window.electronAPI.pingServer(server.hostname);
        setPingResult({ open: true, text: res.output });
    };

    const handleManualConnect = (server) => setManualConnectionDialog({ open: true, server: server.hostname });

    const handleSaveChanges = async () => {
        const success = await handleSaveConfig({ newConfig: { ...config, server_groups: editableGroups } });
        if (success) {
            setEditMode(false);
            showNotification('success', 'Groupes de serveurs mis à jour.');
        } else {
            showNotification('error', 'La sauvegarde a échoué.');
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || !active || active.id === over.id) return;
    
        const activeId = active.id;
        const overId = over.id;
    
        const [activeGroup, activeServerName] = activeId.split('/');
        const overIsGroup = !overId.includes('/');
        const overGroup = overIsGroup ? overId : overId.split('/')[0];
    
        setEditableGroups(prev => {
            const newGroups = { ...prev };
            const activeServerIndex = newGroups[activeGroup].findIndex(s => s.name === activeServerName);
            if (activeServerIndex === -1) return prev;
    
            const [movedServer] = newGroups[activeGroup].splice(activeServerIndex, 1);
    
            if (overIsGroup) {
                newGroups[overGroup].push(movedServer);
            } else {
                const overServerName = overId.split('/')[1];
                const overServerIndex = newGroups[overGroup].findIndex(s => s.name === overServerName);
                if (overServerIndex !== -1) {
                    newGroups[overGroup].splice(overServerIndex, 0, movedServer);
                } else {
                    newGroups[overGroup].push(movedServer);
                }
            }
            return newGroups;
        });
    };

    const handleDialogSubmit = (data) => {
        const { type, group, item } = dialog;
        let newGroups = { ...editableGroups };
        if (type === 'addGroup') { if (data && !newGroups[data]) newGroups[data] = []; }
        else if (type === 'renameGroup') { if (data && data !== item && !newGroups[data]) { newGroups[data] = newGroups[item]; delete newGroups[item]; } }
        else if (type === 'deleteGroup') { delete newGroups[item]; }
        else if (type === 'addServer') { if (data.name && !newGroups[group].some(s => s.name === data.name)) { newGroups[group] = [...newGroups[group], data].sort((a,b) => a.name.localeCompare(b.name)); } }
        else if (type === 'editServer') { const index = newGroups[group].findIndex(s => s.name === item.name); if (index > -1) newGroups[group][index] = data; }
        else if (type === 'deleteServer') { newGroups[group] = newGroups[group].filter(s => s.name !== item.name); }
        setEditableGroups(newGroups);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Box sx={{ p: 2 }}>
                <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5">Gestion des Serveurs</Typography>
                        <FormControlLabel control={<Switch checked={editMode} onChange={(e) => setEditMode(e.target.checked)} />} label="Mode édition" />
                    </Box>
                </Paper>

                {/* Onglets : Gestion / Monitoring */}
                <Paper elevation={2} sx={{ mb: 2 }}>
                    <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
                        <Tab label="Gestion des serveurs" />
                        <Tab icon={<MonitoringIcon />} iconPosition="start" label="Monitoring temps réel" />
                    </Tabs>
                </Paper>

                {currentTab === 0 && (
                    <Box>
                        <TextField fullWidth label="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small" sx={{ mb: 2 }} />
                        {editMode && (<Box sx={{ mb: 2, display: 'flex', gap: 2 }}><Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveChanges}>Sauvegarder</Button><Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialog({ open: true, type: 'addGroup' })}>Nouveau Groupe</Button><Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setEditMode(false)}>Annuler</Button></Box>)}
                        <Grid container spacing={2}>
                            {Object.entries(filteredServerGroups).map(([groupName, servers]) => (
                                <Grid item xs={12} md={6} key={groupName}>
                                    <Paper elevation={1} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="h6">{groupName} ({servers.length})</Typography>
                                            {editMode && (<Box><Tooltip title="Ajouter"><IconButton size="small" onClick={() => setDialog({ open: true, type: 'addServer', group: groupName })}><AddIcon /></IconButton></Tooltip><Tooltip title="Renommer"><IconButton size="small" onClick={() => setDialog({ open: true, type: 'renameGroup', item: groupName })}><EditIcon /></IconButton></Tooltip><Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => setDialog({ open: true, type: 'deleteGroup', item: groupName })}><DeleteIcon /></IconButton></Tooltip></Box>)}
                                        </Box>
                                        <List dense>
                                            <SortableContext items={servers.map(s => `${groupName}/${s.name}`)} strategy={verticalListSortingStrategy}>
                                                {servers.map(server => (
                                                    <SortableServerItem
                                                        key={server.name}
                                                        id={`${groupName}/${server.name}`}
                                                        server={server}
                                                        groupName={groupName}
                                                        editMode={editMode}
                                                        actions={{ onShowInfo: (s) => setDialog({ open: true, type: 'showInfo', item: s }), onAdminConnect: handleAdminConnect, onManualConnect: handleManualConnect, onPing: handlePing, onEditServer: (g, s) => setDialog({ open: true, type: 'editServer', group: g, item: s }), onDeleteServer: (g, s) => setDialog({ open: true, type: 'deleteServer', group: g, item: s }) }}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </List>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {currentTab === 1 && (
                    <ServerMonitoringPanel servers={allServers} />
                )}

                <ServerInfoDialog open={dialog.open && dialog.type === 'showInfo'} server={dialog.item} onClose={() => setDialog({ open: false })} />
                <ServerEditDialog open={dialog.open && ['addServer', 'editServer'].includes(dialog.type)} server={dialog.item} groupName={dialog.group} onClose={() => setDialog({ open: false })} onSubmit={handleDialogSubmit} />
                <GroupEditDialog open={dialog.open && ['addGroup', 'renameGroup'].includes(dialog.type)} type={dialog.type} item={dialog.item} onClose={() => setDialog({ open: false })} onSubmit={handleDialogSubmit} />
                <Dialog open={dialog.open && ['deleteGroup', 'deleteServer'].includes(dialog.type)} onClose={() => setDialog({ open: false })}><DialogTitle>Confirmer</DialogTitle><DialogContent><Typography>Supprimer "{dialog.item?.name || dialog.item}" ?</Typography></DialogContent><DialogActions><Button onClick={() => setDialog({ open: false })}>Annuler</Button><Button onClick={() => { handleDialogSubmit(); setDialog({ open: false }); }} color="error">Supprimer</Button></DialogActions></Dialog>
                <Snackbar open={pingResult.open} autoHideDuration={6000} onClose={() => setPingResult({ open: false, text: '' })} message={pingResult.text} />
                <ManualConnectionDialog open={manualConnectionDialog.open} server={manualConnectionDialog.server} config={config} onClose={() => setManualConnectionDialog({ open: false, server: '' })} onSubmit={(creds) => window.electronAPI.connectWithStoredCredentials(creds)} />
            </Box>
        </DndContext>
    );
};

export default ConnectionsPageEnhanced;
