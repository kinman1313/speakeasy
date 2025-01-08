import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Link, Box, Alert } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import axios from 'axios';
import { config } from '../config';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      setLoading(true);

      // Use the forgot-password endpoint to request a reset
      await axios.post(`${config.API_URL}/api/users/forgot-password`, { email });
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.error || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth='sm'>
      <Box
        sx={{
          mt: 8,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant='h3'
          component='h1'
          className="gradient-text"
          sx={{
            mb: 4,
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          Speakeasy
        </Typography>

        <Paper
          elevation={0}
          className="glass"
          sx={{
            p: 4,
            width: '100%',
            background: 'linear-gradient(145deg, rgba(19,47,76,0.4) 0%, rgba(19,47,76,0.2) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}
        >
          <Typography
            variant='h5'
            component='h2'
            gutterBottom
            className="gradient-text"
            sx={{
              textAlign: 'center',
              fontWeight: 600,
              mb: 3,
            }}
          >
            Reset Password
          </Typography>

          {error && (
            <Alert
              severity='error'
              sx={{
                mb: 2,
                background: 'rgba(211, 47, 47, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(211, 47, 47, 0.3)',
              }}
            >
              {error}
            </Alert>
          )}

          {message && (
            <Alert
              severity='success'
              sx={{
                mb: 2,
                background: 'rgba(46, 125, 50, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(46, 125, 50, 0.3)',
              }}
            >
              {message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label='Email'
              type='email'
              required
              fullWidth
              value={email}
              onChange={e => setEmail(e.target.value)}
              margin='normal'
              autoComplete='email'
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

            <LoadingButton
              type='submit'
              variant='contained'
              fullWidth
              loading={loading}
              className="glass-hover"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(45deg, #00E5FF 30%, #0288D1 90%)',
                boxShadow: '0 3px 5px 2px rgba(0, 229, 255, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #00E5FF 40%, #0288D1 100%)',
                  boxShadow: '0 4px 10px 2px rgba(0, 229, 255, .4)',
                },
              }}
            >
              Reset Password
            </LoadingButton>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to='/login'
                className="gradient-text"
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Back to Login
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
