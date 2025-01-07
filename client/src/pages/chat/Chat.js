import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider,
    CircularProgress
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useSignal } from '../../hooks/useSignal';
import { useSnackbar } from '../../hooks/useSnackbar';

function Chat() {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const { encryptMessage, decryptMessage } = useSignal();
    const { showSnackbar } = useSnackbar();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!socket) return;

        // Load recent messages
        socket.emit('getRecentMessages', {}, async (response) => {
            if (response.success) {
                try {
                    // Decrypt messages
                    const decryptedMessages = await Promise.all(
                        response.messages.map(async (msg) => {
                            if (msg.userId !== user.id) {
                                const decrypted = await decryptMessage(msg.userId, msg.content);
                                return { ...msg, content: decrypted };
                            }
                            return msg;
                        })
                    );
                    setMessages(decryptedMessages);
                } catch (error) {
                    console.error('Error decrypting messages:', error);
                    showSnackbar('Error loading messages', 'error');
                }
            }
            setIsLoading(false);
        });

        // Listen for new messages
        socket.on('newMessage', async (message) => {
            try {
                if (message.userId !== user.id) {
                    const decrypted = await decryptMessage(message.userId, message.content);
                    message.content = decrypted;
                }
                setMessages((prev) => [...prev, message]);
            } catch (error) {
                console.error('Error decrypting message:', error);
                showSnackbar('Error decrypting message', 'error');
            }
        });

        return () => {
            socket.off('newMessage');
        };
    }, [socket, user.id, decryptMessage, showSnackbar]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || !socket) return;

        try {
            // Encrypt message for each recipient
            const encryptedContent = await encryptMessage('broadcast', message.trim());

            socket.emit('sendMessage', { content: encryptedContent }, (response) => {
                if (response.success) {
                    setMessage('');
                } else {
                    showSnackbar('Failed to send message', 'error');
                }
            });
        } catch (error) {
            console.error('Error sending message:', error);
            showSnackbar('Error sending message', 'error');
        }
    };

    if (!isConnected) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh'
                }}
            >
                <Typography variant="h6" color="textSecondary">
                    Connecting to chat...
                </Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ height: '100vh', py: 2 }}>
            <Paper
                elevation={3}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">Secure Chat Room</Typography>
                    <Typography variant="caption" color="textSecondary">
                        End-to-end encrypted with Signal Protocol
                    </Typography>
                </Box>

                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <List>
                            {messages.map((msg, index) => (
                                <Box key={msg.id || index}>
                                    <ListItem
                                        sx={{
                                            flexDirection: 'column',
                                            alignItems: msg.userId === user.id ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="textSecondary"
                                            sx={{ mb: 0.5 }}
                                        >
                                            {msg.userId === user.id ? 'You' : msg.username}
                                        </Typography>
                                        <Paper
                                            elevation={1}
                                            sx={{
                                                p: 1,
                                                bgcolor: msg.userId === user.id ? 'primary.main' : 'grey.100',
                                                color: msg.userId === user.id ? 'white' : 'inherit',
                                                maxWidth: '70%'
                                            }}
                                        >
                                            <Typography variant="body1">{msg.content}</Typography>
                                        </Paper>
                                        <Typography
                                            variant="caption"
                                            color="textSecondary"
                                            sx={{ mt: 0.5 }}
                                        >
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </Typography>
                                    </ListItem>
                                    {index < messages.length - 1 && (
                                        <Divider variant="middle" sx={{ my: 1 }} />
                                    )}
                                </Box>
                            ))}
                            <div ref={messagesEndRef} />
                        </List>
                    )}
                </Box>

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        p: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.default'
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            variant="outlined"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            endIcon={<SendIcon />}
                            disabled={!message.trim()}
                        >
                            Send
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default Chat; 