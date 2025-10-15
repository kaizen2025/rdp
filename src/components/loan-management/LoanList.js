// src/components/loan-management/LoanList.js

import React, { useState, useEffect, useCallback, useMemo, memo, Suspense, lazy } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';

import { useApp } from '../../contexts/AppContext';

// Lazy load des dialogues spécifiques à cette vue
const LoanHistoryDialog = lazy(() => import('../LoanHistoryDialog'));
const ExtendLoanDialog = lazy(() => import('../ExtendLoanDialog'));
const ReturnLoanDialog = lazy(() => import('../ReturnLoanDialog'));
const LoanDialog = lazy(() => import('../LoanDialog')); // Pour créer un prêt

// Icons
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import UpdateIcon from '@mui/icons-material/Update';
import SearchIcon from '@mui/icons-material/Search';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import LaptopIcon from '@mui/icons-material/Laptop';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';

// --- SOUS-COMPOSANTS (isolés pour la clarté) ---

const LOAN_STATUS = { RESERVED: 'reserved', ACTIVE: 'active', OVERDUE: 'overdue', CRITICAL: 'critical', RETURNED: 'returned', CANCELLED: 'cancelled' };
const statusTranslations = { available: 'Disponible', loaned: 'Prêté', reserved: 'Réservé', maintenance: 'En maintenance', retired: 'Retiré', active: 'Actif', overdue: 'En retard', critical: 'Retard critique', returned: 'Retourné', cancelled: 'Annulé' };
const translateStatus = (status) => statusTranslations[status] || status;

const StatCard = memo(({ title, value, icon, color = 'primary' }) => (
    <Card elevation={2}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box><Typography color="textSecondary" gutterBottom>{title}</Typography><Typography variant="h4" component="div">{value}</Typography></Box>
            <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>{icon}</Avatar>
        </CardContent>
    </Card>
));

const LoanStatistics = memo(({ loans, computers }) => {
    const stats = useMemo(() => {
        if (!loans || !computers) return {};
        const activeLoans = loans.filter(l => ['active', 'reserved', 'overdue', 'critical'].includes(l.status));
        return {
            available: computers.filter(c => c.status === 'available').length,
            loaned: activeLoans.length,
            overdue: loans.filter(l => l.status === 'overdue').length,
            critical: loans.filter(l => l.status === 'critical').length,
            maintenance: computers.filter(c => c.status === 'maintenance').length,
        };
    }, [loans, computers]);
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md><StatCard title="Disponibles" value={stats.available ?? '...'} icon={<LaptopIcon />} color="success" /></Grid>
            <Grid item xs={12} sm={6} md><StatCard title="Prêts Actifs" value={stats.loaned ?? '...'} icon={<AssignmentIcon />} color="info" /></Grid>
            <Grid item xs={12} sm={6} md><StatCard title="En Retard" value={stats.overdue ?? '...'} icon={<WarningIcon />} color="warning" /></Grid>
            <Grid item xs={12} sm={6} md><StatCard title="Critiques" value={stats.critical ?? '...'} icon={<ErrorIcon />} color="error" /></Grid>
            <Grid item xs={12} sm={6} md><StatCard title="Maintenance" value={stats.maintenance ?? '...'} icon={<BuildIcon />} color="secondary" /></Grid>
        </Grid>
    );
});

const LoanTableRow = memo(({ loan, computers, users, onReturn, onExtend, onShowHistory, onCancel }) => {
    const computer = useMemo(() => computers.find(c => c.id === loan.computerId), [computers, loan.computerId]);
    const user = useMemo(() => users.find(u => u.username === loan.userName), [users, loan.userName]);
    const isCritical = loan.status === LOAN_STATUS.CRITICAL;
    const isOverdue = loan.status === LOAN_STATUS.OVERDUE || isCritical;
    const canExtend = loan.status === LOAN_STATUS.ACTIVE || loan.status === LOAN_STATUS.OVERDUE;
    const canReturn = loan.status !== LOAN_STATUS.RETURNED && loan.status !== LOAN_STATUS.CANCELLED;
    const canCancel = loan.status === LOAN_STATUS.RESERVED;
    const daysInfo = useMemo(() => {
        const now = new Date();
        const expectedReturn = new Date(loan.expectedReturnDate);
        const diffTime = expectedReturn - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return { text: `Dans ${diffDays} jour(s)`, color: 'info' };
        if (diffDays === 0) return { text: "Aujourd'hui", color: 'warning' };
        return { text: `Retard de ${Math.abs(diffDays)} jour(s)`, color: isCritical ? 'error' : 'warning' };
    }, [loan.expectedReturnDate, isCritical]);
    const getStatusChip = () => {
        const statusConfig = {
            [LOAN_STATUS.RESERVED]: { color: 'info', icon: <EventIcon /> },
            [LOAN_STATUS.ACTIVE]: { color: 'success', icon: <CheckCircleIcon /> },
            [LOAN_STATUS.OVERDUE]: { color: 'warning', icon: <WarningIcon /> },
            [LOAN_STATUS.CRITICAL]: { color: 'error', icon: <ErrorIcon /> },
            [LOAN_STATUS.RETURNED]: { color: 'default', icon: <AssignmentReturnIcon /> },
            [LOAN_STATUS.CANCELLED]: { color: 'default', icon: <DeleteIcon /> },
        };
        const config = statusConfig[loan.status] || { color: 'default' };
        return <Chip label={translateStatus(loan.status)} color={config.color} size="small" icon={config.icon} />;
    };
    return (
        <TableRow hover sx={{ backgroundColor: isCritical ? 'error.light' : isOverdue ? 'warning.light' : 'inherit' }}>
            <TableCell><Box><Typography variant="body2" fontWeight="bold">{computer?.name || 'N/A'}</Typography><Typography variant="caption" color="textSecondary">{computer?.model || ''}</Typography></Box></TableCell>
            <TableCell><Box><Typography variant="body2">{user?.displayName || loan.userName}</Typography><Typography variant="caption" color="textSecondary">{loan.userName}</Typography></Box></TableCell>
            <TableCell>{loan.itStaff}</TableCell>
            <TableCell>{new Date(loan.loanDate).toLocaleDateString()}</TableCell>
            <TableCell><Box><Typography variant="body2">{new Date(loan.expectedReturnDate).toLocaleDateString()}</Typography><Chip label={daysInfo.text} size="small" color={daysInfo.color} sx={{ mt: 0.5 }} /></Box></TableCell>
            <TableCell>{getStatusChip()}</TableCell>
            <TableCell>{loan.extensionCount > 0 && <Chip label={`${loan.extensionCount}x`} size="small" variant="outlined" icon={<UpdateIcon />} />}</TableCell>
            <TableCell sx={{ position: 'sticky', right: 0, zIndex: 1, background: 'white' }}><Box sx={{ display: 'flex', gap: 0.5 }}><Tooltip title="Historique du prêt"><IconButton size="small" onClick={() => onShowHistory(loan)}><HistoryIcon /></IconButton></Tooltip>{canReturn && <Tooltip title="Retour"><IconButton size="small" color="success" onClick={() => onReturn(loan)}><AssignmentReturnIcon /></IconButton></Tooltip>}{canExtend && <Tooltip title="Prolonger"><IconButton size="small" color="info" onClick={() => onExtend(loan)}><UpdateIcon /></IconButton></Tooltip>}{canCancel && <Tooltip title="Annuler"><IconButton size="small" color="error" onClick={() => onCancel(loan)}><DeleteIcon /></IconButton></Tooltip>}</Box></TableCell>
        </TableRow>
    );
});

// --- COMPOSANT PRINCIPAL DE CETTE VUE ---

const LoanList = () => {
    const { config, showNotification } = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [computers, setComputers] = useState([]);
    const [loans, setLoans] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loanStatusFilter, setLoanStatusFilter] = useState('active');

    const [loanHistoryDialogOpen, setLoanHistoryDialogOpen] = useState(false);
    const [extendLoanDialogOpen, setExtendLoanDialogOpen] = useState(false);
    const [returnLoanDialogOpen, setReturnLoanDialogOpen] = useState(false);
    const [loanDialogOpen, setLoanDialogOpen] = useState(false);
    const [isReservation, setIsReservation] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);

    const itStaffList = useMemo(() => (config?.it_technicians || []).map(t => t.name), [config]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [computersData, loansData, usersResult] = await Promise.all([
                window.electronAPI.getComputers(),
                window.electronAPI.getLoans(),
                window.electronAPI.syncExcelUsers(),
            ]);
            const formattedUsers = usersResult.success ? Object.values(usersResult.users || {}).flat() : [];
            setComputers(computersData || []);
            setLoans(loansData || []);
            setUsers(formattedUsers);
        } catch (err) {
            const errorMessage = `Erreur de chargement: ${err.message}`;
            setError(errorMessage);
            showNotification('error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredLoans = useMemo(() => {
        let result = loans;
        if (loanStatusFilter === 'active') {
            result = loans.filter(l => [LOAN_STATUS.ACTIVE, LOAN_STATUS.RESERVED, LOAN_STATUS.OVERDUE, LOAN_STATUS.CRITICAL].includes(l.status));
        } else if (loanStatusFilter === 'overdue') {
            result = loans.filter(l => [LOAN_STATUS.OVERDUE, LOAN_STATUS.CRITICAL].includes(l.status));
        } else if (loanStatusFilter === 'returned') {
            result = loans.filter(l => l.status === LOAN_STATUS.RETURNED);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(l => {
                const computerName = computers.find(c => c.id === l.computerId)?.name || '';
                const userName = users.find(u => u.username === l.userName)?.displayName || l.userName;
                return userName.toLowerCase().includes(term) ||
                       (l.itStaff && l.itStaff.toLowerCase().includes(term)) ||
                       computerName.toLowerCase().includes(term);
            });
        }
        return result;
    }, [loans, searchTerm, loanStatusFilter, computers, users]);

    const handleCreateLoan = async (loanData) => {
        try {
            const result = await window.electronAPI.createLoan(loanData);
            if (result.success) {
                showNotification('success', `${loanData.status === 'reserved' ? 'Réservation' : 'Prêt'} créé.`);
                await loadData();
            } else { throw new Error(result.error); }
        } catch (err) { showNotification('error', `Erreur création prêt: ${err.message}`); }
        setLoanDialogOpen(false);
    };

    const handleReturnLoan = async (loan, returnNotes, accessoryInfo) => {
        try {
            const result = await window.electronAPI.returnLoan(loan.id, returnNotes, accessoryInfo);
            if (result.success) {
                showNotification('success', 'Retour enregistré.');
                await loadData();
            } else { throw new Error(result.error); }
        } catch (err) { showNotification('error', `Erreur retour: ${err.message}`); }
        setReturnLoanDialogOpen(false);
    };

    const handleExtendLoan = async (loanId, newDate, reason) => {
        try {
            const result = await window.electronAPI.extendLoan(loanId, newDate, reason);
            if (result.success) {
                showNotification('success', `Prêt prolongé.`);
                await loadData();
            } else { throw new Error(result.error); }
        } catch (err) { showNotification('error', `Erreur prolongation: ${err.message}`); }
        setExtendLoanDialogOpen(false);
    };

    const handleCancelLoan = async (loan) => {
        const reason = window.prompt('Raison de l\'annulation :');
        if (!reason) return;
        try {
            const result = await window.electronAPI.cancelLoan(loan.id, reason);
            if (result.success) {
                showNotification('success', 'Prêt annulé.');
                await loadData();
            } else { throw new Error(result.error); }
        } catch (err) { showNotification('error', `Erreur annulation: ${err.message}`); }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: 2 }}>
            <LoanStatistics loans={loans} computers={computers} />
            
            <Box sx={{ display: 'flex', gap: 2, my: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Statut Prêt</InputLabel>
                    <Select value={loanStatusFilter} label="Statut Prêt" onChange={(e) => setLoanStatusFilter(e.target.value)}>
                        <MenuItem value="all">Tous</MenuItem>
                        <MenuItem value="active">En cours (Actifs & En retard)</MenuItem>
                        <MenuItem value="overdue">Uniquement en retard</MenuItem>
                        <MenuItem value="returned">Retournés</MenuItem>
                    </Select>
                </FormControl>
                <TextField size="small" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }} sx={{ flexGrow: 1, maxWidth: 400 }} />
                <Box sx={{ flexGrow: 1 }} />
                {/* --- CORRECTION : Ajout du bouton Réserver --- */}
                <Button variant="outlined" color="info" startIcon={<EventIcon />} onClick={() => { setIsReservation(true); setLoanDialogOpen(true); }}>Réserver</Button>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setIsReservation(false); setLoanDialogOpen(true); }}>Nouveau Prêt</Button>
            </Box>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '60vh' }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ordinateur</TableCell>
                            <TableCell>Utilisateur</TableCell>
                            <TableCell>Responsable IT</TableCell>
                            <TableCell>Date Prêt</TableCell>
                            <TableCell>Retour Prévu</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Prolongations</TableCell>
                            <TableCell sx={{ position: 'sticky', right: 0, background: 'white', zIndex: 1 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredLoans.map(l => 
                            <LoanTableRow 
                                key={l.id} 
                                loan={l} 
                                computers={computers} 
                                users={users} 
                                onReturn={loan => { setSelectedLoan(loan); setReturnLoanDialogOpen(true); }} 
                                onExtend={loan => { setSelectedLoan(loan); setExtendLoanDialogOpen(true); }} 
                                onShowHistory={loan => { setSelectedLoan(loan); setLoanHistoryDialogOpen(true); }} 
                                onCancel={handleCancelLoan} 
                            />
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Suspense fallback={<CircularProgress />}>
                {loanDialogOpen && <LoanDialog open={loanDialogOpen} onClose={() => setLoanDialogOpen(false)} computer={null} users={users} itStaff={itStaffList} onSave={handleCreateLoan} isReservation={isReservation} computers={computers} loans={loans} />}
                {loanHistoryDialogOpen && <LoanHistoryDialog open={loanHistoryDialogOpen} onClose={() => setLoanHistoryDialogOpen(false)} loan={selectedLoan} />}
                {extendLoanDialogOpen && <ExtendLoanDialog open={extendLoanDialogOpen} onClose={() => setExtendLoanDialogOpen(false)} loan={selectedLoan} onExtend={handleExtendLoan} />}
                {returnLoanDialogOpen && <ReturnLoanDialog open={returnLoanDialogOpen} onClose={() => setReturnLoanDialogOpen(false)} loan={selectedLoan} onReturn={handleReturnLoan} />}
            </Suspense>
        </Box>
    );
};

export default LoanList;