// src/components/loan-management/ComputerList.js - VERSION FINALE AVEC SOUS-ONGLETS

import React, { useState, useEffect, useCallback, useMemo, memo, Suspense, lazy } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
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
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { useApp } from '../../contexts/AppContext';

// Lazy load des dialogues
const ComputerDialog = lazy(() => import('../ComputerDialog'));
const LoanDialog = lazy(() => import('../LoanDialog'));
const ComputerHistoryDialog = lazy(() => import('../ComputerHistoryDialog'));
const MaintenanceDialog = lazy(() => import('../MaintenanceDialog'));
const AccessoriesManagement = lazy(() => import('../../pages/AccessoriesManagement'));

// Icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import SearchIcon from '@mui/icons-material/Search';
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import LaptopIcon from '@mui/icons-material/Laptop';
import MouseIcon from '@mui/icons-material/Mouse';

// --- SOUS-COMPOSANT : TABLEAU DES ORDINATEURS ---

const ComputerTable = () => {
    const { config, showNotification } = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [computers, setComputers] = useState([]);
    const [loans, setLoans] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [computerDialogOpen, setComputerDialogOpen] = useState(false);
    const [loanDialogOpen, setLoanDialogOpen] = useState(false);
    const [computerHistoryDialogOpen, setComputerHistoryDialogOpen] = useState(false);
    const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
    const [selectedComputer, setSelectedComputer] = useState(null);
    const [isReservation, setIsReservation] = useState(false);

    const itStaffList = useMemo(() => (config?.it_technicians || []).map(t => t.name), [config]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [computersData, loansData, usersResult] = await Promise.all([
                window.electronAPI.getComputers(),
                window.electronAPI.getLoans(),
                window.electronAPI.syncExcelUsers(),
            ]);
            setComputers(computersData || []);
            setLoans(loansData || []);
            setUsers(usersResult.success ? Object.values(usersResult.users || {}).flat() : []);
        } catch (err) {
            setError(`Erreur de chargement: ${err.message}`);
            showNotification('error', `Erreur de chargement: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => { loadData(); }, [loadData]);

    const filteredComputers = useMemo(() => computers.filter(c => {
        const statusMatch = statusFilter === 'all' || c.status === statusFilter;
        if (!statusMatch) return false;
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (c.name?.toLowerCase().includes(term) || c.brand?.toLowerCase().includes(term) || c.model?.toLowerCase().includes(term) || c.serialNumber?.toLowerCase().includes(term));
    }), [computers, searchTerm, statusFilter]);

    const handleSaveComputer = async (computerData) => { /* ... (inchangé) ... */ };
    const handleCreateLoan = async (loanData) => { /* ... (inchangé) ... */ };
    const handleDeleteComputer = async (computer) => { /* ... (inchangé) ... */ };
    const handleAddMaintenance = async (computerId, maintenanceData) => { /* ... (inchangé) ... */ };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}><InputLabel>Statut Matériel</InputLabel><Select value={statusFilter} label="Statut Matériel" onChange={(e) => setStatusFilter(e.target.value)}><MenuItem value="all">Tous</MenuItem><MenuItem value="available">Disponibles</MenuItem><MenuItem value="loaned">Prêtés</MenuItem><MenuItem value="reserved">Réservés</MenuItem><MenuItem value="maintenance">Maintenance</MenuItem><MenuItem value="retired">Retirés</MenuItem></Select></FormControl>
                <TextField size="small" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }} sx={{ flexGrow: 1, maxWidth: 400 }} />
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelectedComputer(null); setComputerDialogOpen(true); }}>Ajouter Matériel</Button>
            </Box>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '60vh' }}>
                <Table size="small" stickyHeader>
                    <TableHead><TableRow><TableCell>Nom / Série</TableCell><TableCell>Marque</TableCell><TableCell>Modèle</TableCell><TableCell>Statut</TableCell><TableCell>Statistiques</TableCell><TableCell sx={{ position: 'sticky', right: 0, background: 'white' }}>Actions</TableCell></TableRow></TableHead>
                    <TableBody>{filteredComputers.map(c => <ComputerTableRow key={c.id} computer={c} onEdit={comp => { setSelectedComputer(comp); setComputerDialogOpen(true); }} onDelete={handleDeleteComputer} onLoan={comp => { setSelectedComputer(comp); setIsReservation(false); setLoanDialogOpen(true); }} onReserve={comp => { setSelectedComputer(comp); setIsReservation(true); setLoanDialogOpen(true); }} onMaintenance={comp => { setSelectedComputer(comp); setMaintenanceDialogOpen(true); }} onHistory={comp => { setSelectedComputer(comp); setComputerHistoryDialogOpen(true); }} />)}</TableBody>
                </Table>
            </TableContainer>
            <Suspense fallback={<CircularProgress />}>
                {computerDialogOpen && <ComputerDialog open={computerDialogOpen} onClose={() => setComputerDialogOpen(false)} computer={selectedComputer} onSave={handleSaveComputer} />}
                {loanDialogOpen && <LoanDialog open={loanDialogOpen} onClose={() => setLoanDialogOpen(false)} computer={selectedComputer} users={users} itStaff={itStaffList} onSave={handleCreateLoan} isReservation={isReservation} computers={computers} loans={loans} />}
                {computerHistoryDialogOpen && <ComputerHistoryDialog open={computerHistoryDialogOpen} onClose={() => setComputerHistoryDialogOpen(false)} computer={selectedComputer} />}
                {maintenanceDialogOpen && <MaintenanceDialog open={maintenanceDialogOpen} onClose={() => setMaintenanceDialogOpen(false)} computer={selectedComputer} onSave={handleAddMaintenance} />}
            </Suspense>
        </Box>
    );
};

// --- COMPOSANT PRINCIPAL DE L'ONGLET "INVENTAIRE MATÉRIEL" ---

const ComputerList = ({ refreshKey }) => {
    const [subTab, setSubTab] = useState(0);

    return (
        <Box sx={{ p: 2 }}>
            <Tabs value={subTab} onChange={(e, v) => setSubTab(v)} centered>
                <Tab icon={<LaptopIcon />} iconPosition="start" label="Matériel Informatique" />
                <Tab icon={<MouseIcon />} iconPosition="start" label="Accessoires" />
            </Tabs>
            <Box sx={{ pt: 2 }}>
                {subTab === 0 && <ComputerTable key={refreshKey} />}
                {subTab === 1 && <AccessoriesManagement key={refreshKey} />}
            </Box>
        </Box>
    );
};

// Le reste des sous-composants (ComputerTableRow, etc.) doit être défini ici ou importé
const statusTranslations = { available: 'Disponible', loaned: 'Prêté', reserved: 'Réservé', maintenance: 'En maintenance', retired: 'Retiré' };
const translateStatus = (status) => statusTranslations[status] || status;

const ComputerTableRow = memo(({ computer, onEdit, onDelete, onLoan, onReserve, onMaintenance, onHistory }) => {
    const getStatusChip = useCallback(() => {
        const statusConfig = {
            available: { color: 'success', icon: <CheckCircleIcon /> },
            loaned: { color: 'warning', icon: <AssignmentIcon /> },
            reserved: { color: 'info', icon: <EventIcon /> },
            maintenance: { color: 'secondary', icon: <BuildIcon /> },
            retired: { color: 'default', icon: <DeleteIcon /> },
        };
        const config = statusConfig[computer.status] || { color: 'default' };
        return <Chip label={translateStatus(computer.status)} color={config.color} size="small" icon={config.icon} />;
    }, [computer.status]);

    return (
        <TableRow hover>
            <TableCell><Typography variant="body2" fontWeight="bold">{computer.name}</Typography><Typography variant="caption" color="textSecondary">S/N: {computer.serialNumber}</Typography></TableCell>
            <TableCell>{computer.brand}</TableCell>
            <TableCell>{computer.model}</TableCell>
            <TableCell>{getStatusChip()}</TableCell>
            <TableCell><Typography variant="body2">{computer.totalLoans || 0} prêt(s)</Typography>{computer.totalDaysLoaned > 0 && <Typography variant="caption" color="textSecondary">{computer.totalDaysLoaned} jours total</Typography>}</TableCell>
            <TableCell sx={{ position: 'sticky', right: 0, background: 'white', zIndex: 1 }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Modifier"><IconButton size="small" onClick={() => onEdit(computer)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Historique complet"><IconButton size="small" onClick={() => onHistory(computer)}><HistoryIcon /></IconButton></Tooltip>
                    {computer.status === 'available' && (
                        <>
                            <Tooltip title="Prêter"><IconButton size="small" color="primary" onClick={() => onLoan(computer)}><AssignmentIcon /></IconButton></Tooltip>
                            <Tooltip title="Réserver"><IconButton size="small" color="info" onClick={() => onReserve(computer)}><EventIcon /></IconButton></Tooltip>
                        </>
                    )}
                    <Tooltip title="Maintenance"><IconButton size="small" color="secondary" onClick={() => onMaintenance(computer)}><BuildIcon /></IconButton></Tooltip>
                    <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => onDelete(computer)}><DeleteIcon /></IconButton></Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );
});

export default ComputerList;