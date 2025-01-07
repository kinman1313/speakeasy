import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../hooks/useSnackbar';

function ResetPassword() {
    const { token } = useParams();
    const { resetPassword } = useAuth();
    const { showSnackbar } = useSnackbar();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setError('');
            setLoading(true);
            await resetPassword(token, password);
            showSnackbar('Password reset successful. You can now log in with your new password.', 'success');
        } catch (err) {
            setError(err.message || 'Failed to reset password');
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
                <Typography component='h1' variant='h5'>
                    Reset Password
                </Typography>
                <Box component='form' onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    {error && <Alert severity='error'>{error}</Alert>}
                    <TextField
                        margin='normal'
                        required
                        fullWidth
                        name='password'
                        label='New Password'
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
                        label='Confirm New Password'
                        type='password'
                        id='confirmPassword'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                        type='submit'
                        fullWidth
                        variant='contained'
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default ResetPassword;
