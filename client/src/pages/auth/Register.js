import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Link, Paper } from '@mui/material';

function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validateForm = () => {
        if (!username || !email || !password || !confirmPassword) {
            setError('All fields are required');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const success = await register(username, email, password);
            if (success) {
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth='sm'>
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    <Typography component='h1' variant='h5'>
                        Create Account
                    </Typography>
                    <Box component='form' onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
                        <TextField
                            margin='normal'
                            required
                            fullWidth
                            id='username'
                            label='Username'
                            name='username'
                            autoComplete='username'
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <TextField
                            margin='normal'
                            required
                            fullWidth
                            id='email'
                            label='Email Address'
                            name='email'
                            autoComplete='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin='normal'
                            required
                            fullWidth
                            name='password'
                            label='Password'
                            type='password'
                            id='password'
                            autoComplete='new-password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <TextField
                            margin='normal'
                            required
                            fullWidth
                            name='confirmPassword'
                            label='Confirm Password'
                            type='password'
                            id='confirmPassword'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {error && (
                            <Typography color='error' variant='body2' sx={{ mt: 2 }}>
                                {error}
                            </Typography>
                        )}
                        <Button type='submit' fullWidth variant='contained' sx={{ mt: 3, mb: 2 }} disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Link component={RouterLink} to='/login' variant='body2'>
                                Already have an account? Sign in
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default Register;
