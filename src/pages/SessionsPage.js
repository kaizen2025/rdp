// src/pages/SessionsPage.js - VERSION FINALE, SIMPLIFIÉE ET GARANTIE FONCTIONNELLE

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';

// Import des contextes et services
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

// --- CORRECTION MAJEURE : Import direct des composants de dialogue ---
import SendMessageDialog from '../components/SendMessageDialog';
import UserInfoDialog from '../components/UserInfoDialog';
import GlobalMessageDialog from '../components/GlobalMessageDialog';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import MessageIcon from '@mui/icons-material/Message';
import InfoIcon from '@mui/icons-material/Info';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import DnsIcon from '@mui/icons-material/Dns';
import TimerIcon from '@mui/icons-material/Timer';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const GroupedUserRow = memo(({ user, sessions, onSendMessage, onShowInfo, getUserInfo }) => {
    const userInfo = useMemo(() => getUserInfo(user), [getUserInfo, user]);
    const mainSession = useMemo(() => sessions[0], [sessions]);
    const serverList = useMemo(() => [...new Set(sessions.map(s => s.server))], [sessions]);
    const isActive = useMemo(() => sessions.some(s => s && s.isActive), [sessions]);

    const oldestSession = useMemo(() => {
        if (!isActive) return null;
        const sessionsWithTime = sessions.filter(s => s.logonTime);
        if (sessionsWithTime.length === 0) return null;
        return sessionsWithTime.reduce((oldest, current) => new Date(oldest.logonTime) > new Date(current.logonTime) ? current : oldest);
    }, [sessions, isActive]);

    const sessionDuration = useMemo(() => {
        if (!oldestSession) return 'N/A';
        const diffMs = new Date() - new Date(oldestSession.logonTime);
        const days = Math.floor(diffMs / 86400000);
        const hours = Math.floor((diffMs / 3600000) % 24);
        const minutes = Math.floor((diffMs / 60000) % 60);
        let durationStr = '';
        if (days > 0) durationStr += `${days}j `;
        if (hours > 0 || days > 0) durationStr += `${hours}h `;
        durationStr += `${minutes}m`;
        return durationStr.trim();
    }, [oldestSession]);

    return (
        <TableRow hover>
            <TableCell>{userInfo?.displayName || user}</TableCell>
            <TableCell><Typography variant="body2" fontWeight="bold">{user}</Typography></TableCell>
            <TableCell><Box sx={{ display: 'flex', gap: 0.5 }}>{serverList.map(s => <Chip key={s} label={s} size="small" />)}</Box></TableCell>
            <TableCell><Chip label={isActive ? 'Actif' : 'Déconnecté'} color={isActive ? 'success' : 'default'} size="small" icon={isActive ? <CheckCircleIcon/> : <RadioButtonUncheckedIcon/>} /></TableCell>
            <TableCell><Box sx={{display: 'flex', alignItems: 'center'}}><TimerIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }}/>{sessionDuration}</Box></TableCell>
            <TableCell>{oldestSession ? new Date(oldestSession.logonTime).toLocaleString('fr-FR') : 'N/A'}</TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    <Tooltip title="Envoyer un message"><IconButton size="small" onClick={() => onSendMessage(mainSession)} color="info" disabled={!isActive}><MessageIcon/></IconButton></Tooltip>
                    {userInfo && <Tooltip title="Fiche utilisateur"><IconButton size="small" onClick={() => onShowInfo({ ...mainSession, userInfo })}><InfoIcon/></IconButton></Tooltip>}
                </Box>
            </TableCell>
        </TableRow>
    );
});

const SessionsPage = () => {
    const { config, showNotification, events } = useApp();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [users, setUsers] = useState({});
    const [filter, setFilter] = useState('');
    const [serverFilter, setServerFilter] = useState('all');
    const [dialogState, setDialogState] = useState({ type: null, data: null });

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true); else setIsLoading(true);
        setError('');
        try {
            const [sessionsData, usersData] = await Promise.all([
                apiService.getRdsSessions(),
                apiService.getExcelUsers()
            ]);
            setSessions(sessionsData || []);
            if (usersData.success) setUsers(usersData.users || {});
        } catch (err) {
            setError(`Erreur de chargement : ${err.message}`);
            showNotification('error', `Erreur: ${err.message}`);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadData();
        const unsubscribe = events.on('data_updated:rds_sessions', () => loadData(true));
        return unsubscribe;
    }, [loadData, events]);

    const getUserInfo = useCallback((username) => {
        for (const serverUsers of Object.values(users)) {
            const user = serverUsers.find(u => u.username === username);
            if (user) return user;
        }
        return null;
    }, [users]);

    const groupedSessions = useMemo(() => {
        const validSessions = sessions.filter(s => {
            if (!s || !s.username) return false;
            if (serverFilter !== 'all' && s.server !== serverFilter) return false;
            return true;
        });

        const grouped = validSessions.reduce((acc, session) => {
            (acc[session.username] = acc[session.username] || []).push(session);
            return acc;
        }, {});

        return Object.entries(grouped).filter(([user, userSessions]) => {
            if (!filter) return true;
            const term = filter.toLowerCase();
            const userInfo = getUserInfo(user);
            return user.toLowerCase().includes(term) ||
                   (userInfo?.displayName && userInfo.displayName.toLowerCase().includes(term)) ||
                   userSessions.some(s => s.server && s.server.toLowerCase().includes(term));
        });
    }, [sessions, filter, serverFilter, getUserInfo]);

    return (
        <Box sx={{ p: 2 }}>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">Sessions RDS ({sessions.length})</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" startIcon={<AnnouncementIcon />} onClick={() => setDialogState({ type: 'globalMessage' })}>Message à tous</Button>
                        <Tooltip title="Forcer le rafraîchissement">
                            <span>
                                <IconButton onClick={() => loadData(true)} disabled={isRefreshing}>
                                    {isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
                    <TextField label="Rechercher..." size="small" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{flexGrow: 1}} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}/>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Serveur</InputLabel>
                        <Select value={serverFilter} label="Serveur" onChange={(e) => setServerFilter(e.target.value)}>
                            <MenuItem value="all">Tous les serveurs</MenuItem>
                            {(config?.rds_servers || []).map(server => (
                                <MenuItem key={server} value={server}>{server}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Paper>

            <TableContainer component={Paper}>
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: '20%' }}><PersonIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }}/>Nom Complet</TableCell>
                            <TableCell sx={{ width: '12%' }}><VpnKeyIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }}/>Utilisateur</TableCell>
                            <TableCell sx={{ width: '13%' }}><DnsIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }}/>Serveurs</TableCell>
                            <TableCell sx={{ width: '12%' }}>État</TableCell>
                            <TableCell sx={{ width: '13%' }}><TimerIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }}/>Durée</TableCell>
                            <TableCell sx={{ width: '12%' }}>Heure Connexion</TableCell>
                            <TableCell sx={{ width: '18%' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading && sessions.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ p: 4 }}><CircularProgress /></TableCell></TableRow>
                        ) : groupedSessions.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ p: 4 }}>Aucune session active trouvée.</TableCell></TableRow>
                        ) : (
                            groupedSessions.map(([user, userSessions]) => (
                                <GroupedUserRow key={user} user={user} sessions={userSessions} onSendMessage={(s) => setDialogState({ type: 'sendMessage', data: s })} onShowInfo={(s) => setDialogState({ type: 'userInfo', data: s })} getUserInfo={getUserInfo} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* On retire Suspense car les imports sont maintenant directs */}
            {dialogState.type === 'sendMessage' && <SendMessageDialog open={true} onClose={() => setDialogState({ type: null })} selectedSessions={[`${dialogState.data.server}-${dialogState.data.sessionId}`]} sessions={sessions} />}
            {dialogState.type === 'userInfo' && <UserInfoDialog open={true} onClose={() => setDialogState({ type: null })} user={dialogState.data} />}
            {dialogState.type === 'globalMessage' && <GlobalMessageDialog open={true} onClose={() => setDialogState({ type: null })} servers={config?.rds_servers || []} />}
        </Box>
    );
};

export default SessionsPage;