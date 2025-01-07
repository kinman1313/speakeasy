import { useState } from 'react';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    Link,
    TextField,
    Typography,
    Card,
    CardContent,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

function NewPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { resetPassword, error } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validateForm = () => {
        const errors = {};
        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (!confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const success = await resetPassword(token, password);
            if (success) {
                setIsSubmitted(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setFormErrors({ submit: 'Failed to reset password. Please try again.' });
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
                                Set New Password
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Please enter your new password
                            </Typography>
                        </Box>

                        {isSubmitted ? (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body1" sx={{ mb: 3 }}>
                                    Your password has been successfully reset. You will be redirected to the login page.
                                </Typography>
                                <Link component={RouterLink} to="/login" variant="body2" sx={{ textDecoration: 'none' }}>
                                    Go to sign in
                                </Link>
                            </Box>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    label="New Password"
                                    margin="normal"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={Boolean(formErrors.password)}
                                    helperText={formErrors.password}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Confirm New Password"
                                    margin="normal"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    error={Boolean(formErrors.confirmPassword)}
                                    helperText={formErrors.confirmPassword}
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
                                    {isSubmitting ? 'Resetting password...' : 'Reset password'}
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

export default NewPassword; 