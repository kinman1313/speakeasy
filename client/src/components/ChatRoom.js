import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  PersonAdd as InviteIcon,
  ExitToApp as LeaveIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PinnedMessages from './PinnedMessages';
import TypingIndicator from './TypingIndicator';

const ChatRoom = ({ roomId, onLeaveRoom, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [error, setError] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const typingTimeoutRef = useRef({});
  const notificationSound = useRef(new Audio('/notification.mp3'));

  useEffect(() => {
    if (socket && roomId) {
      console.log('Setting up socket listeners for room:', roomId); // Debug log

      // Join room
      socket.emit('joinRoom', { roomId });

      // Load room data
      socket.emit('getRoomData', { roomId }, response => {
        if (response.success) {
          setRoom(response.room);
          setMembers(response.members);
          setMessages(response.messages);
          setPinnedMessages(response.messages.filter(m => m.isPinned));
          setUnreadCount(response.unreadCount || 0);
        } else {
          setError('Failed to load room data');
        }
      });

      // Listen for new messages
      socket.on('message', data => {
        console.log('Received message event:', data); // Debug log
        if (data.type === 'new') {
          setMessages(prev => [...prev, data.message]);
        } else if (data.type === 'reaction') {
          setMessages(prev =>
            prev.map(msg =>
              msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg
            )
          );
        }
      });

      // Listen for voice messages
      socket.on('voiceMessage', ({ messageId, duration }) => {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId ? { ...msg, metadata: { ...msg.metadata, duration } } : msg
          )
        );
      });

      // Listen for GIF messages
      socket.on('gifMessage', ({ messageId, dimensions }) => {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId ? { ...msg, metadata: { ...msg.metadata, ...dimensions } } : msg
          )
        );
      });

      // Listen for file messages
      socket.on('fileMessage', ({ messageId, fileName, fileSize, fileType }) => {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId
              ? { ...msg, metadata: { ...msg.metadata, fileName, fileSize, fileType } }
              : msg
          )
        );
      });

      // Listen for message pins
      socket.on('messagePinned', ({ messageId, pinnedBy, pinnedAt }) => {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId ? { ...msg, isPinned: true, pinnedBy, pinnedAt } : msg
          )
        );
        setPinnedMessages(prev => [...prev, messages.find(m => m._id === messageId)]);
      });

      socket.on('messageUnpinned', ({ messageId }) => {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId
              ? { ...msg, isPinned: false, pinnedBy: null, pinnedAt: null }
              : msg
          )
        );
        setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
      });

      // Listen for message edits
      socket.on('messageEdited', ({ messageId, content, editedAt }) => {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId ? { ...msg, content, isEdited: true, editedAt } : msg
          )
        );
        setPinnedMessages(prev =>
          prev.map(msg =>
            msg._id === messageId ? { ...msg, content, isEdited: true, editedAt } : msg
          )
        );
      });

      // Listen for message deletions
      socket.on('messageDeleted', ({ messageId, deletedAt }) => {
        setMessages(prev =>
          prev.map(msg => (msg._id === messageId ? { ...msg, isDeleted: true, deletedAt } : msg))
        );
        setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
      });

      // Listen for typing indicators
      socket.on('typing', ({ userId, username, isTyping }) => {
        setTypingUsers(prev => {
          if (isTyping && !prev.includes(username)) {
            return [...prev, username];
          } else if (!isTyping) {
            return prev.filter(u => u !== username);
          }
          return prev;
        });
      });

      // Listen for message read status
      socket.on('messageRead', ({ messageId, userId, readAt }) => {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId
              ? {
                  ...msg,
                  readBy: [...(msg.readBy || []), { user: userId, readAt }],
                }
              : msg
          )
        );
      });

      // Listen for member updates
      socket.on('memberUpdate', ({ members: updatedMembers }) => {
        setMembers(updatedMembers);
      });

      // Handle errors
      socket.on('error', error => {
        console.error('Socket error:', error);
        setError(error.message);
      });

      return () => {
        console.log('Cleaning up socket listeners'); // Debug log
        socket.emit('leaveRoom', { roomId });
        socket.off('message');
        socket.off('voiceMessage');
        socket.off('gifMessage');
        socket.off('fileMessage');
        socket.off('messagePinned');
        socket.off('messageUnpinned');
        socket.off('messageEdited');
        socket.off('messageDeleted');
        socket.off('typing');
        socket.off('messageRead');
        socket.off('memberUpdate');
        socket.off('error');
      };
    }
  }, [socket, roomId, user._id, notificationsEnabled]);

  const handleSendMessage = messageData => {
    if (socket) {
      console.log('Sending message:', messageData); // Debug log

      // Create a temporary message with a local ID
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        type: messageData.type,
        content: messageData.content,
        metadata: messageData.metadata,
        userId: user._id,
        username: user.username,
        createdAt: new Date().toISOString(),
        pending: true,
      };

      // Add message to local state immediately
      setMessages(prev => [...prev, tempMessage]);

      // Emit to server
      socket.emit('message', {
        ...messageData,
        roomId,
      });
    }
  };

  const handleTyping = isTyping => {
    if (socket) {
      // Clear existing timeout
      if (typingTimeoutRef.current[roomId]) {
        clearTimeout(typingTimeoutRef.current[roomId]);
      }

      socket.emit('typing', { roomId, isTyping });

      // Set timeout to stop typing indicator after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current[roomId] = setTimeout(() => {
          socket.emit('typing', { roomId, isTyping: false });
        }, 3000);
      }
    }
  };

  const handleInviteMember = () => {
    if (socket && inviteEmail.trim()) {
      socket.emit(
        'inviteMember',
        {
          roomId,
          email: inviteEmail.trim(),
        },
        response => {
          if (response.success) {
            setInviteDialogOpen(false);
            setInviteEmail('');
          } else {
            setError(response.error || 'Failed to send invite');
          }
        }
      );
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leaveRoom', { roomId }, response => {
        if (response.success) {
          onLeaveRoom && onLeaveRoom();
        } else {
          setError('Failed to leave room');
        }
      });
    }
  };

  const handleDeleteRoom = () => {
    if (socket && room?.ownerId === user.id) {
      socket.emit('deleteRoom', { roomId }, response => {
        if (response.success) {
          onClose && onClose();
        } else {
          setError('Failed to delete room');
        }
      });
    }
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(145deg, rgba(19,47,76,0.4) 0%, rgba(19,47,76,0.2) 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: 2,
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      {/* Room Header */}
      <Box
        className="glass"
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(145deg, rgba(19,47,76,0.9) 0%, rgba(19,47,76,0.6) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px 16px 0 0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='h6' className="gradient-text" sx={{ fontWeight: 600 }}>
            {room?.name || 'Loading...'}
          </Typography>
          {unreadCount > 0 && (
            <Typography
              variant='caption'
              className="glow"
              sx={{
                backgroundColor: 'rgba(0, 229, 255, 0.15)',
                color: 'primary.main',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                fontWeight: 500,
              }}
            >
              {unreadCount} unread
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}>
            <IconButton
              className="glass-hover"
              sx={{
                '&:hover': {
                  color: 'primary.main',
                  background: 'rgba(0, 229, 255, 0.1)'
                }
              }}
              onClick={toggleNotifications}
            >
              {notificationsEnabled ? <NotificationsIcon /> : <NotificationsOffIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title='Invite Member'>
            <IconButton
              className="glass-hover"
              sx={{
                '&:hover': {
                  color: 'primary.main',
                  background: 'rgba(0, 229, 255, 0.1)'
                }
              }}
              onClick={() => setInviteDialogOpen(true)}
            >
              <InviteIcon />
            </IconButton>
          </Tooltip>
          <IconButton
            className="glass-hover"
            sx={{
              '&:hover': {
                color: 'primary.main',
                background: 'rgba(0, 229, 255, 0.1)'
              }
            }}
            onClick={e => setSettingsAnchorEl(e.currentTarget)}
          >
            <MoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Room Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          p: 2,
          gap: 2,
        }}
      >
        {/* Messages Area */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          <PinnedMessages messages={pinnedMessages} roomId={roomId} />
          <Box sx={{
            flex: 1,
            overflow: 'hidden',
            borderRadius: 2,
            background: 'rgba(19,47,76,0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <MessageList messages={messages} />
          </Box>
          <Box sx={{ position: 'relative' }}>
            <TypingIndicator typingUsers={typingUsers} />
            <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
          </Box>
        </Box>

        {/* Members Sidebar */}
        <Box
          className="glass"
          sx={{
            width: 240,
            borderRadius: 2,
            display: { xs: 'none', sm: 'block' },
            overflow: 'hidden',
          }}
        >
          <List>
            <ListItem>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }} className="gradient-text">
                Members ({members.length})
              </Typography>
            </ListItem>
            {members.map(member => (
              <ListItem
                key={member.id}
                sx={{
                  '&:hover': {
                    background: 'rgba(0, 229, 255, 0.05)',
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={member.avatar}
                    alt={member.name}
                    sx={{
                      border: '2px solid',
                      borderColor: member.id === room?.ownerId ? 'primary.main' : 'transparent'
                    }}
                  >
                    {member.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.name}
                  secondary={member.id === room?.ownerId ? 'Owner' : ''}
                  primaryTypographyProps={{
                    sx: { fontWeight: 500 }
                  }}
                  secondaryTypographyProps={{
                    sx: { color: 'primary.main' }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={() => setSettingsAnchorEl(null)}
        PaperProps={{
          className: "glass",
          elevation: 0,
          sx: {
            overflow: 'visible',
            mt: 1.5,
          }
        }}
      >
        <MenuItem
          onClick={handleLeaveRoom}
          sx={{
            gap: 1,
            '&:hover': {
              background: 'rgba(0, 229, 255, 0.05)',
            }
          }}
        >
          <LeaveIcon sx={{ color: 'error.main' }} />
          <ListItemText primary='Leave Room' />
        </MenuItem>
        {room?.ownerId === user.id && (
          <MenuItem
            onClick={handleDeleteRoom}
            sx={{
              gap: 1,
              '&:hover': {
                background: 'rgba(0, 229, 255, 0.05)',
              }
            }}
          >
            <DeleteIcon sx={{ color: 'error.main' }} />
            <ListItemText primary='Delete Room' />
          </MenuItem>
        )}
      </Menu>

      {/* Invite Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        PaperProps={{
          className: "glass",
          elevation: 0,
        }}
      >
        <DialogTitle className="gradient-text">Invite to Speakeasy</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Email Address'
            type='email'
            fullWidth
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setInviteDialogOpen(false)}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInviteMember}
            variant='contained'
            className="glass-hover"
            sx={{
              background: 'linear-gradient(45deg, #00E5FF 30%, #0288D1 90%)',
              boxShadow: '0 3px 5px 2px rgba(0, 229, 255, .3)',
            }}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setError('')}
          severity='error'
          sx={{
            background: 'rgba(211, 47, 47, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(211, 47, 47, 0.3)',
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatRoom;
