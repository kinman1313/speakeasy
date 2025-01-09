import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Paper, TextField, IconButton, Typography, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../contexts/ThemeContext';
import MessageList from '../../components/chat/MessageList';
import ChatHeader from '../../components/chat/ChatHeader';

export default function Chat() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const socket = useSocket();
    const { messageColor } = useTheme();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        socket.on('message', handleNewMessage);

        return () => {
            socket.off('message', handleNewMessage);
        };
    }, [user, socket, navigate]);

    const handleNewMessage = (msg) => {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            setLoading(true);
            const newMessage = {
                content: message.trim(),
                sender: user.id,
                timestamp: new Date().toISOString()
            };

            socket.emit('message', newMessage);
            setMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ height: '100vh', py: 2 }}>
            <Paper
                elevation={3}
                sx={{
                    height: '100%',
                    display: 'flex', 
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    overflow: 'hidden'
                }}
            >
                <ChatHeader />

                <Box sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <MessageList
                        messages={messages}
                        currentUser={user}
                        messageColor={messageColor}
                    />
                    <div ref={messagesEndRef} />
                </Box>

                <Box
                    component="form" 
                    onSubmit={handleSubmit}
                    sx={{
                        p: 2, 
                        backgroundColor: 'background.paper',
                        borderTop: 1,
                        borderColor: 'divider'
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Type a message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                        <IconButton
                            type="submit" 
                            color="primary"
                            disabled={loading || !message.trim()}
                            sx={{
                                p: '10px',
                                borderRadius: 2
                            }}
                        >
                            {loading ? <CircularProgress size={24} /> : <SendIcon />}
                        </IconButton>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
} 