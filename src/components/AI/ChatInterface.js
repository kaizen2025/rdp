/**
 * Interface de chat pour l'Agent IA
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    Avatar,
    CircularProgress,
    Chip,
    Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    SmartToy as BotIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService'; // ✅ IMPORT AJOUTÉ

const ChatInterface = ({ sessionId, onMessageSent }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConversationHistory = useCallback(async () => {
        try {
            // ✅ UTILISATION APISERVICE
            const data = await apiService.getAIConversationHistory(sessionId);

            if (data.success && data.conversations) {
                const formattedMessages = data.conversations.reverse().map(conv => ([
                    {
                        type: 'user',
                        content: conv.user_message,
                        timestamp: new Date(conv.created_at)
                    },
                    {
                        type: 'assistant',
                        content: conv.ai_response,
                        confidence: conv.confidence_score,
                        timestamp: new Date(conv.created_at)
                    }
                ])).flat();

                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error('Erreur chargement historique:', error);
        }
    }, [sessionId]);

    useEffect(() => {
        // Charger l'historique des conversations au montage
        loadConversationHistory();
    }, [loadConversationHistory]);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const messageToSend = inputMessage;
        setInputMessage('');
        setIsLoading(true);

        try {
            // ✅ UTILISATION APISERVICE
            const data = await apiService.sendAIMessage(sessionId, messageToSend);

            if (data.success) {
                const assistantMessage = {
                    type: 'assistant',
                    content: data.response,
                    confidence: data.confidence,
                    documentsUsed: data.documentsUsed,
                    responseTime: data.responseTime,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, assistantMessage]);

                if (onMessageSent) {
                    onMessageSent(data);
                }
            } else {
                const errorMessage = {
                    type: 'assistant',
                    content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
                    isError: true,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Erreur envoi message:', error);
            const errorMessage = {
                type: 'assistant',
                content: 'Erreur de connexion au serveur.',
                isError: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Zone des messages */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 2,
                    backgroundColor: '#f5f5f5'
                }}
            >
                {messages.length === 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary'
                        }}
                    >
                        <BotIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
                        <Typography variant="h6" gutterBottom>
                            Bonjour! Je suis votre assistant IA local
                        </Typography>
                        <Typography variant="body2" align="center" sx={{ maxWidth: 500 }}>
                            Posez-moi des questions sur vos documents ou uploadez de nouveaux fichiers
                            pour commencer
                        </Typography>
                    </Box>
                )}

                {messages.map((message, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            mb: 2,
                            justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                        }}
                    >
                        {message.type === 'assistant' && (
                            <Avatar
                                sx={{
                                    bgcolor: 'primary.main',
                                    mr: 1,
                                    width: 32,
                                    height: 32
                                }}
                            >
                                <BotIcon fontSize="small" />
                            </Avatar>
                        )}

                        <Box sx={{ maxWidth: '70%' }}>
                            <Paper
                                sx={{
                                    p: 1.5,
                                    backgroundColor: message.type === 'user'
                                        ? 'primary.main'
                                        : message.isError
                                        ? '#ffebee'
                                        : 'white',
                                    color: message.type === 'user' ? 'white' : 'text.primary'
                                }}
                            >
                                <Typography
                                    variant="body1"
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {message.content}
                                </Typography>

                                {message.type === 'assistant' && !message.isError && (
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {message.confidence !== undefined && (
                                            <Chip
                                                size="small"
                                                label={`Confiance: ${Math.round(message.confidence * 100)}%`}
                                                color={message.confidence > 0.7 ? 'success' : 'warning'}
                                            />
                                        )}
                                        {message.documentsUsed > 0 && (
                                            <Chip
                                                size="small"
                                                label={`${message.documentsUsed} doc(s)`}
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                )}
                            </Paper>
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    mt: 0.5,
                                    color: 'text.secondary',
                                    textAlign: message.type === 'user' ? 'right' : 'left'
                                }}
                            >
                                {formatTime(message.timestamp)}
                            </Typography>
                        </Box>

                        {message.type === 'user' && (
                            <Avatar
                                sx={{
                                    bgcolor: 'secondary.main',
                                    ml: 1,
                                    width: 32,
                                    height: 32
                                }}
                            >
                                <PersonIcon fontSize="small" />
                            </Avatar>
                        )}
                    </Box>
                ))}

                {isLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                            sx={{
                                bgcolor: 'primary.main',
                                mr: 1,
                                width: 32,
                                height: 32
                            }}
                        >
                            <BotIcon fontSize="small" />
                        </Avatar>
                        <Paper sx={{ p: 1.5 }}>
                            <CircularProgress size={20} />
                        </Paper>
                    </Box>
                )}

                <div ref={messagesEndRef} />
            </Box>

            {/* Zone de saisie */}
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Posez votre question..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        variant="outlined"
                        size="small"
                    />
                    <Tooltip title="Envoyer">
                        <span>
                            <IconButton
                                color="primary"
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                                size="large"
                            >
                                <SendIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Paper>
        </Box>
    );
};

export default ChatInterface;
