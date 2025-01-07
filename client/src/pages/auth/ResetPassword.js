import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Link, TextField, Typography, Card, CardContent } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

function ResetPassword() {
    const { requestPasswordReset, error } = useAuth();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validateForm = () => {
        const errors = {};
        if (!email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Email is invalid';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const success = await requestPasswordReset(email);
            if (success) {
                setIsSubmitted(true);
            } else {
                setFormErrors({ submit: 'Failed to send reset email. Please try again.' });
            }
        } catch (err) {
            setFormErrors({ submit: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh'
                }}
            >
                <Card sx={{ width: '100%', maxWidth: 'sm' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ mb: 3, textAlign: 'center' }}>
                            <Typography variant="h4" gutterBottom>
                                Reset Password
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Enter your email address and we'll send you instructions to reset your password
                            </Typography>
                        </Box>

                        {isSubmitted ? (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body1" sx={{ mb: 3 }}>
                                    We've sent password reset instructions to your email address. Please check your inbox.
                                </Typography>
                                <Link component={RouterLink} to="/login" variant="body2" sx={{ textDecoration: 'none' }}>
                                    Return to sign in
                                </Link>
                            </Box>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    label="Email address"
                                    margin="normal"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    error={Boolean(formErrors.email)}
                                    helperText={formErrors.email}
                                />

                                {(error || formErrors.submit) && (
                                    <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                                        {error || formErrors.submit}
                                    </Typography>
                                )}

                                <Button
                                    fullWidth
                                    size="large"
                                    type="submit"
                                    variant="contained"
                                    sx={{ mt: 3 }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send reset instructions'}
                                </Button>

                                <Box sx={{ mt: 3, textAlign: 'center' }}>
                                    <Link
                                        component={RouterLink}
                                        to="/login"
                                        variant="body2"
                                        sx={{ textDecoration: 'none' }}
                                    >
                                        Back to sign in
                                    </Link>
                                </Box>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
}

export default ResetPassword; 