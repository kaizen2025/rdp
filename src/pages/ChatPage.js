// src/pages/ChatPage.js - VERSION COMPLÈTE AMÉLIORÉE

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import Draggable from 'react-draggable';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Popover from '@mui/material/Popover';
import ListItemIcon from '@mui/material/ListItemIcon';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TagIcon from '@mui/icons-material/Tag';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import EmojiPicker from 'emoji-picker-react';
import { useApp } from '../contexts/AppContext';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

function PaperComponent(props) {
    return (
        <Draggable handle="#draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
            <Paper {...props} />
        </Draggable>
    );
}

const AddChannelDialog = ({ open, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    
    const handleSubmit = () => {
        if (!name.trim()) return;
        onSave({ name, description });
        setName('');
        setDescription('');
    };
    
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Nouveau Canal</DialogTitle>
            <DialogContent>
                <TextField autoFocus margin="dense" label="Nom du canal" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
                <TextField margin="dense" label="Description" fullWidth multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSubmit} variant="contained">Créer</Button>
            </DialogActions>
        </Dialog>
    );
};

const MessageItem = memo(({ message, isFirstInGroup, currentUser, onEdit, onDelete, onReact }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [reactionAnchor, setReactionAnchor] = useState(null);
    const isOwn = message.authorId === currentUser?.id;

    return (
        <Box onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} sx={{ display: 'flex', px: 2, py: isFirstInGroup ? 1.5 : 0.2, '&:hover': { bgcolor: 'action.hover' } }}>
            {isFirstInGroup ? <Avatar sx={{ width: 36, height: 36, mr: 2, mt: 0.5 }}>{message.authorAvatar}</Avatar> : <Box sx={{ width: 36, mr: 2 }} />}
            <Box sx={{ flex: 1, position: 'relative' }}>
                {isFirstInGroup && (
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                        <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold' }}>{message.authorName}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Typography>
                    </Stack>
                )}
                <Paper elevation={0} sx={{ p: 1, bgcolor: 'transparent' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {message.text}
                        {message.edited && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>(modifié)</Typography>}
                    </Typography>
                    {message.file && <Chip icon={<DescriptionIcon />} label={message.file.name} size="small" variant="outlined" sx={{ mt: 1 }} />}
                </Paper>
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                        {Object.entries(message.reactions).map(([emoji, users]) => users.length > 0 && (
                            <Chip key={emoji} label={`${emoji} ${users.length}`} size="small" variant={users.includes(currentUser?.id) ? 'filled' : 'outlined'} onClick={() => onReact(message.id, emoji)} />
                        ))}
                    </Stack>
                )}
                {isHovered && (
                    <Paper sx={{ position: 'absolute', top: -12, right: 0, display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={(e) => setReactionAnchor(e.currentTarget)}><AddReactionIcon fontSize="small" /></IconButton>
                        {isOwn && <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}><MoreVertIcon fontSize="small" /></IconButton>}
                    </Paper>
                )}
                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                    <MenuItem onClick={() => { onEdit(message); setMenuAnchor(null); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Modifier</MenuItem>
                    <MenuItem onClick={() => { onDelete(message.id); setMenuAnchor(null); }}><ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>Supprimer</MenuItem>
                </Menu>
                <Popover open={Boolean(reactionAnchor)} anchorEl={reactionAnchor} onClose={() => setReactionAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Stack direction="row" sx={{ p: 0.5 }}>
                        {EMOJI_REACTIONS.map(emoji => <IconButton key={emoji} onClick={() => { onReact(message.id, emoji); setReactionAnchor(null); }}>{emoji}</IconButton>)}
                    </Stack>
                </Popover>
            </Box>
        </Box>
    );
});

const DateDivider = ({ date }) => {
    const formatDate = () => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const messageDate = new Date(date);
        if (today.toDateString() === messageDate.toDateString()) return 'AUJOURD\'HUI';
        if (yesterday.toDateString() === messageDate.toDateString()) return 'HIER';
        return messageDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    };
    return <Divider sx={{ my: 2 }}><Chip label={formatDate()} size="small" /></Divider>;
};

const ChatDialog = ({ open, onClose, onlineTechnicians = [] }) => {
    const { currentTechnician, showNotification } = useApp();
    const [currentChannel, setCurrentChannel] = useState('general');
    const [channelType, setChannelType] = useState('channel');
    const [channels, setChannels] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [editingMessage, setEditingMessage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);
    const [addChannelDialogOpen, setAddChannelDialogOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const loadInitialData = useCallback(async () => {
        try {
            const [channelsData, configData] = await Promise.all([
                window.electronAPI['chat:getChannels'](),
                window.electronAPI.getConfig()
            ]);
            setChannels(channelsData || []);
            setTechnicians(configData.it_technicians || []);
        } catch (error) {
            console.error('Erreur chargement données chat:', error);
        }
    }, []);

    const fetchUnreadCounts = useCallback(async () => {
        if (!currentTechnician?.id) return;
        try {
            const counts = await window.electronAPI['chat:getUnreadCount']();
            setUnreadCounts(counts || {});
        } catch (e) {
            console.error("Erreur getUnreadCount", e);
        }
    }, [currentTechnician]);

    const loadMessages = useCallback(async (channelId, type) => {
        if (!currentTechnician?.id) return;
        setIsLoading(true);
        try {
            const msgs = type === 'channel' ? await window.electronAPI['chat:getMessages'](channelId) : await window.electronAPI['chat:getDms'](channelId);
            setMessages(msgs || []);
            await window.electronAPI['chat:markAsRead'](channelId);
            fetchUnreadCounts();
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentTechnician, fetchUnreadCounts]);

    useEffect(() => {
        if (open) {
            loadInitialData();
            fetchUnreadCounts();
        }
    }, [open, loadInitialData, fetchUnreadCounts]);

    useEffect(() => {
        if (open && currentChannel) loadMessages(currentChannel, channelType);
    }, [open, currentChannel, channelType, loadMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !selectedFile) return;
        try {
            const fileData = selectedFile ? { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type } : null;
            if (editingMessage) {
                await window.electronAPI['chat:editMessage'](editingMessage.id, currentChannel, newMessage);
                setEditingMessage(null);
            } else {
                if (channelType === 'channel') await window.electronAPI['chat:addMessage']({ channelId: currentChannel, messageText: newMessage, fileData });
                else await window.electronAPI['chat:addDm']({ toUserId: currentChannel, messageText: newMessage, fileData });
            }
            setNewMessage('');
            setSelectedFile(null);
            await loadMessages(currentChannel, channelType);
        } catch (error) {
            showNotification('error', `Erreur envoi: ${error.message}`);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showNotification('error', 'Fichier trop volumineux (max 10 Mo)');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleAddChannel = async (channelData) => {
        try {
            await window.electronAPI['chat:addChannel'](channelData.name, channelData.description);
            showNotification('success', 'Canal créé avec succès.');
            await loadInitialData();
            setAddChannelDialogOpen(false);
        } catch (error) {
            showNotification('error', `Erreur création canal: ${error.message}`);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce message ?")) {
            try {
                await window.electronAPI['chat:deleteMessage'](messageId, currentChannel);
                await loadMessages(currentChannel, channelType);
            } catch (error) {
                showNotification('error', `Erreur suppression: ${error.message}`);
            }
        }
    };

    const handleReact = async (messageId, emoji) => {
        try {
            await window.electronAPI['chat:addReaction'](messageId, currentChannel, emoji);
            await loadMessages(currentChannel, channelType);
        } catch (error) {
            showNotification('error', `Erreur réaction: ${error.message}`);
        }
    };

    const currentTargetName = useMemo(() => {
        if (channelType === 'channel') return channels.find(c => c.id === currentChannel)?.name;
        return technicians.find(t => t.id === currentChannel)?.name;
    }, [currentChannel, channelType, channels, technicians]);

    return (
        <Dialog open={open} onClose={onClose} PaperComponent={PaperComponent} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '80vh' } }}>
            <DialogTitle sx={{ cursor: 'move', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} id="draggable-dialog-title">
                <Typography variant="h6">Chat Équipe IT</Typography>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, display: 'flex' }}>
                <AddChannelDialog open={addChannelDialogOpen} onClose={() => setAddChannelDialogOpen(false)} onSave={handleAddChannel} />
                <Paper elevation={0} sx={{ width: 280, display: 'flex', flexDirection: 'column', borderRadius: 0, bgcolor: 'grey.100', borderRight: 1, borderColor: 'divider' }}>
                    <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <ListSubheader>Canaux</ListSubheader>
                        {channels.map(c => (
                            <ListItemButton key={c.id} selected={channelType === 'channel' && currentChannel === c.id} onClick={() => { setChannelType('channel'); setCurrentChannel(c.id); }}>
                                <ListItemIcon sx={{ minWidth: 32 }}><TagIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary={c.name} />
                                <Badge badgeContent={unreadCounts[c.id] || 0} color="error" />
                            </ListItemButton>
                        ))}
                        <ListItemButton onClick={() => setAddChannelDialogOpen(true)}>
                            <ListItemIcon sx={{ minWidth: 32 }}><AddIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Ajouter un canal" />
                        </ListItemButton>
                        <ListSubheader>Messages Directs</ListSubheader>
                        {technicians.filter(t => t.id !== currentTechnician?.id).map(tech => {
                            const isOnline = onlineTechnicians.some(online => online.id === tech.id);
                            const dmKey = [currentTechnician?.id, tech.id].sort().join('--');
                            return (
                                <ListItemButton key={tech.id} selected={channelType === 'dm' && currentChannel === tech.id} onClick={() => { setChannelType('dm'); setCurrentChannel(tech.id); }}>
                                    <ListItemAvatar sx={{ minWidth: 48 }}>
                                        <Badge variant="dot" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} sx={{ '& .MuiBadge-badge': { backgroundColor: isOnline ? 'success.main' : 'grey.400' } }}>
                                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem' }}>{tech.avatar}</Avatar>
                                        </Badge>
                                    </ListItemAvatar>
                                    <ListItemText primary={tech.name} />
                                    <Badge badgeContent={unreadCounts[dmKey] || 0} color="error" />
                                </ListItemButton>
                            );
                        })}
                    </List>
                </Paper>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {isLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
                        ) : (
                            messages.map((msg, index) => {
                                const prevMsg = messages[index - 1];
                                const isFirstInGroup = !prevMsg || prevMsg.authorId !== msg.authorId || new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 300000;
                                const showDate = !prevMsg || new Date(prevMsg.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDate && <DateDivider date={msg.timestamp} />}
                                        <MessageItem message={msg} isFirstInGroup={isFirstInGroup} currentUser={currentTechnician} onEdit={(m) => { setEditingMessage(m); setNewMessage(m.text); }} onDelete={handleDeleteMessage} onReact={handleReact} />
                                    </React.Fragment>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </Box>
                    <Paper elevation={3} sx={{ p: 2, borderRadius: 0, borderTop: 1, borderColor: 'divider' }}>
                        {selectedFile && <Chip icon={<DescriptionIcon />} label={selectedFile.name} onDelete={() => setSelectedFile(null)} sx={{ mb: 1 }} />}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                            <IconButton onClick={() => fileInputRef.current.click()}><AttachFileIcon /></IconButton>
                            <IconButton onClick={(e) => setEmojiPickerOpen(e.currentTarget)}><AddReactionIcon /></IconButton>
                            <Popover open={Boolean(emojiPickerOpen)} anchorEl={emojiPickerOpen} onClose={() => setEmojiPickerOpen(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                                <EmojiPicker onEmojiClick={(emojiData) => setNewMessage(p => p + emojiData.emoji)} />
                            </Popover>
                            <TextField fullWidth multiline maxRows={5} placeholder={`Message pour ${currentTargetName}`} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} variant="outlined" size="small" />
                            <Button variant="contained" endIcon={<SendIcon />} onClick={handleSendMessage} disabled={!newMessage.trim() && !selectedFile}>{editingMessage ? 'Modifier' : 'Envoyer'}</Button>
                            {editingMessage && <Button variant="outlined" onClick={() => { setEditingMessage(null); setNewMessage(''); }}>Annuler</Button>}
                        </Box>
                        <Typography variant="caption" color="text.secondary">Shift + Entrée pour une nouvelle ligne.</Typography>
                    </Paper>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default ChatDialog;