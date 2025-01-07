import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Link,
    Paper
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

function ResetPassword() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await resetPassword(email);
            if (result) {
                setSuccess(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
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
                    <Typography component="h1" variant="h5">
                        Reset Password
                    </Typography>
                    {success ? (
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Password reset instructions have been sent to your email.
                            </Typography>
                            <Link component={RouterLink} to="/login" variant="body2">
                                Return to Sign In
                            </Link>
                        </Box>
                    ) : (
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{ mt: 3, width: '100%' }}
                        >
                            <Typography variant="body2" sx={{ mb: 3 }}>
                                Enter your email address and we'll send you instructions to reset your
                                password.
                            </Typography>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {error && (
                                <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                                    {error}
                                </Typography>
                            )}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Reset Password'}
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Link component={RouterLink} to="/login" variant="body2">
                                    Back to Sign In
                                </Link>
                            </Box>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}

export default ResetPassword; 