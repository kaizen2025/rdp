// src/pages/UserLoanHistoryPage.js

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import apiService from '../services/apiService';

// Icons
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import UpdateIcon from '@mui/icons-material/Update';
import CancelIcon from '@mui/icons-material/Cancel';

const eventConfig = {
    created: { label: 'Prêt créé', color: 'success', icon: <EventAvailableIcon /> },
    returned: { label: 'Retourné', color: 'primary', icon: <AssignmentReturnIcon /> },
    extended: { label: 'Prolongé', color: 'info', icon: <UpdateIcon /> },
    cancelled: { label: 'Annulé', color: 'error', icon: <CancelIcon /> },
};

const UserLoanHistoryPage = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        const loadAllUsers = async () => {
            setLoadingUsers(true);
            try {
                // CORRECTION ICI
                const usersResult = await apiService.getExcelUsers();
                if (usersResult && usersResult.success) {
                    const formattedUsers = Object.values(usersResult.users).flat();
                    const uniqueUsers = Array.from(new Map(formattedUsers.map(user => [user.username, user])).values());
                    setAllUsers(uniqueUsers);
                } else {
                    setAllUsers([]);
                }
            } catch (error) {
                console.error("Erreur chargement utilisateurs:", error);
            } finally {
                setLoadingUsers(false);
            }
        };
        loadAllUsers();
    }, []);

    useEffect(() => {
        if (!selectedUser) { setHistory([]); return; }
        const loadHistory = async () => {
            setHistoryLoading(true);
            try {
                // CORRECTION ICI
                const userHistory = await apiService.getLoanHistory({ userName: selectedUser.username, limit: 1000 });
                setHistory(userHistory);
            } catch (error) {
                console.error("Erreur chargement historique utilisateur:", error);
            } finally {
                setHistoryLoading(false);
            }
        };
        loadHistory();
    }, [selectedUser]);

    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : '-';

    const getAvatarLetters = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <Box sx={{ p: 2 }}>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonSearchIcon color="primary" />
                    <Typography variant="h5">Historique des prêts par utilisateur</Typography>
                </Box>
                <Autocomplete
                    isOptionEqualToValue={(option, value) => option.username === value.username}
                    getOptionLabel={(option) => `${option.displayName} (${option.username})`}
                    options={allUsers}
                    loading={loadingUsers}
                    value={selectedUser}
                    onChange={(event, newValue) => {
                        setSelectedUser(newValue);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Rechercher un utilisateur..."
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <Box component="li" {...props}>
                            <Avatar sx={{ mr: 2, width: 24, height: 24, fontSize: '0.8rem' }}>
                                {getAvatarLetters(option.displayName)}
                            </Avatar>
                            {option.displayName} ({option.username})
                        </Box>
                    )}
                />
            </Paper>

            {selectedUser && (
                <Paper elevation={3} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Historique pour : {selectedUser.displayName}
                    </Typography>
                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Événement</TableCell>
                                        <TableCell>Ordinateur</TableCell>
                                        <TableCell>Date Événement</TableCell>
                                        <TableCell>Date Prêt</TableCell>
                                        <TableCell>Retour Prévu</TableCell>
                                        <TableCell>Retour Réel</TableCell>
                                        <TableCell>Technicien</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {history.length > 0 ? (
                                        history.map((event) => {
                                            const config = eventConfig[event.eventType] || {};
                                            return (
                                                <TableRow key={event.id}>
                                                    <TableCell>
                                                        <Chip
                                                            icon={config.icon}
                                                            label={config.label || event.eventType}
                                                            color={config.color || 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{event.computerName}</TableCell>
                                                    <TableCell>{formatDate(event.date)}</TableCell>
                                                    <TableCell>{formatDate(event.details?.loanDate)}</TableCell>
                                                    <TableCell>{formatDate(event.details?.expectedReturnDate)}</TableCell>
                                                    <TableCell>{formatDate(event.details?.actualReturnDate)}</TableCell>
                                                    <TableCell>{event.by}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
                                                Aucun historique de prêt pour cet utilisateur.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default UserLoanHistoryPage;