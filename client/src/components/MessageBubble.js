import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ message, isOwn }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const theme = useTheme();

  const handleMenuOpen = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    handleMenuClose();
  };

  const handleReply = () => {
    // Implement reply functionality
    handleMenuClose();
  };

  const handleDelete = () => {
    // Implement delete functionality
    handleMenuClose();
  };

  const handlePlayVoice = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const renderContent = () => {
    switch (message.type) {
      case 'voice':
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 200,
            }}
          >
            <IconButton size='small' onClick={handlePlayVoice}>
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <audio ref={audioRef} src={message.content} onEnded={() => setIsPlaying(false)} />
            <Typography variant='caption'>{message.metadata?.duration}s</Typography>
          </Box>
        );
      case 'gif':
        return (
          <Box
            component='img'
            src={message.content}
            alt='GIF'
            sx={{
              maxWidth: '300px',
              width: '100%',
              height: 'auto',
              borderRadius: 1,
            }}
          />
        );
      case 'file':
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
              borderRadius: 1,
            }}
          >
            <Typography variant='body2'>📎 {message.metadata?.fileName}</Typography>
          </Box>
        );
      default:
        return <Typography variant='body1'>{message.content}</Typography>;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        flexDirection: isOwn ? 'row-reverse' : 'row',
        mb: 2,
      }}
    >
      <Avatar
        src={message.avatar}
        sx={{
          width: 32,
          height: 32,
          border: '2px solid',
          borderColor: isOwn ? 'primary.main' : 'secondary.main',
          boxShadow: '0 0 10px rgba(0, 229, 255, 0.2)',
        }}
      >
        {message.username?.[0]?.toUpperCase()}
      </Avatar>

      <Paper
        elevation={0}
        className={`glass ${isOwn ? 'glow' : ''}`}
        sx={{
          maxWidth: '70%',
          p: 2,
          background: isOwn
            ? 'linear-gradient(145deg, rgba(0,229,255,0.15) 0%, rgba(0,229,255,0.05) 100%)'
            : 'linear-gradient(145deg, rgba(19,47,76,0.4) 0%, rgba(19,47,76,0.2) 100%)',
          color: isOwn ? 'primary.main' : 'text.primary',
          borderRadius: '16px',
          position: 'relative',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: isOwn ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          boxShadow: isOwn
            ? '0 8px 32px 0 rgba(0, 229, 255, 0.15)'
            : '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
          ...(message.status === 'sending' && {
            opacity: 0.7,
          }),
          ...(message.status === 'failed' && {
            background: 'linear-gradient(145deg, rgba(211,47,47,0.15) 0%, rgba(211,47,47,0.05) 100%)',
            borderColor: 'rgba(211, 47, 47, 0.3)',
            color: 'error.main',
          }),
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: isOwn
              ? '0 12px 40px 0 rgba(0, 229, 255, 0.2)'
              : '0 12px 40px 0 rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        {!isOwn && (
          <Typography
            variant='caption'
            className="gradient-text"
            sx={{
              fontWeight: 500,
              mb: 0.5,
              display: 'block',
            }}
          >
            {message.username}
          </Typography>
        )}

        {renderContent()}

        <Typography
          variant='caption'
          sx={{
            color: isOwn ? 'primary.main' : 'text.secondary',
            mt: 0.5,
            display: 'block',
            textAlign: 'right',
            opacity: 0.7,
          }}
        >
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          {message.status === 'failed' && ' • Failed to send'}
        </Typography>

        <IconButton
          size='small'
          onClick={handleMenuOpen}
          className="glass-hover"
          sx={{
            position: 'absolute',
            top: 8,
            [isOwn ? 'left' : 'right']: 8,
            color: isOwn ? 'primary.main' : 'text.secondary',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            '&:hover': {
              background: isOwn
                ? 'rgba(0, 229, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.1)',
            },
            '.MuiPaper-root:hover &': {
              opacity: 1,
            },
          }}
        >
          <MoreVertIcon fontSize='small' />
        </IconButton>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isOwn ? 'left' : 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isOwn ? 'left' : 'right',
        }}
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
          onClick={handleReply}
          sx={{
            gap: 1,
            '&:hover': {
              background: 'rgba(0, 229, 255, 0.05)',
            }
          }}
        >
          <ListItemIcon>
            <ReplyIcon fontSize='small' sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleCopy}
          sx={{
            gap: 1,
            '&:hover': {
              background: 'rgba(0, 229, 255, 0.05)',
            }
          }}
        >
          <ListItemIcon>
            <CopyIcon fontSize='small' sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        {isOwn && (
          <MenuItem
            onClick={handleDelete}
            sx={{
              gap: 1,
              '&:hover': {
                background: 'rgba(211, 47, 47, 0.05)',
              }
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize='small' sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default MessageBubble;
