import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Divider, CircularProgress, Alert } from '@mui/material';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useMessages } from '../contexts/MessageContext';

const ChatLobby = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const { messages, loading, error, sendMessage } = useMessages();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async messageData => {
    try {
      await sendMessage(messageData);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isConnected) {
    return (
      <Box
        className="glass"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2,
          borderRadius: 2,
          p: 4,
        }}
      >
        <CircularProgress sx={{ color: 'primary.main' }} />
        <Typography className="gradient-text">Connecting to Speakeasy...</Typography>
      </Box>
    );
  }

  return (
    <Box
      className="glass"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        background: 'linear-gradient(145deg, rgba(19,47,76,0.4) 0%, rgba(19,47,76,0.2) 100%)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: 'linear-gradient(145deg, rgba(19,47,76,0.9) 0%, rgba(19,47,76,0.6) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="h5" className="gradient-text" sx={{ fontWeight: 600 }}>
          Speakeasy Lobby
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Welcome to the public chat room
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 3,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: 'primary.main' }} />
          </Box>
        ) : error ? (
            <Alert
              severity='error'
              sx={{
                mx: 2,
                background: 'rgba(211, 47, 47, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(211, 47, 47, 0.3)',
              }}
            >
            {error}
          </Alert>
        ) : messages.length === 0 ? (
          <Box
                className="glass"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 2,
              p: 4,
              borderRadius: 2,
            }}
          >
                <Typography variant='h6' className="gradient-text">Welcome to Speakeasy!</Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  Start a conversation by sending a message.
                </Typography>
          </Box>
        ) : (
                <Box
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    background: 'rgba(19,47,76,0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    p: 2,
                  }}
                >
                  <MessageList messages={messages} />
                </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box
        className="glass"
        sx={{
          p: 2,
          background: 'linear-gradient(145deg, rgba(19,47,76,0.9) 0%, rgba(19,47,76,0.6) 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <MessageInput onSendMessage={handleSendMessage} />
      </Box>
    </Box>
  );
};

export default ChatLobby;
