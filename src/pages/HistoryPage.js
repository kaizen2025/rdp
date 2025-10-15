import React, { useState, useEffect } from 'react';
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
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const loadHistory = async () => {
            const data = await window.electronAPI.getHistory();
            setHistory(data);
        };
        loadHistory();
    }, []);

    const clearHistory = async () => {
        if (window.confirm("Voulez-vous vraiment effacer tout l'historique ?")) {
            await window.electronAPI.saveHistory([]);
            setHistory([]);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">📜 Historique des connexions</Typography>
                <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={clearHistory}>
                    Effacer l'historique
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Heure</TableCell>
                            <TableCell>Serveur</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Utilisateur</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {history.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{entry.date}</TableCell>
                                <TableCell>{entry.time}</TableCell>
                                <TableCell>{entry.server}</TableCell>
                                <TableCell>{entry.type}</TableCell>
                                <TableCell>{entry.user}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default HistoryPage;