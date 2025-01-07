import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import { useAuth } from '../../hooks/useAuth';

function Login() {
    const { login, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        if (!email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Email is invalid';
        }
        if (!password) {
            errors.password = 'Password is required';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const success = await login(email, password);
            if (!success) {
                setFormErrors({ submit: 'Invalid email or password' });
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
                                Welcome back
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Sign in to continue to {process.env.REACT_APP_NAME}
                            </Typography>
                        </Box>

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

                            <TextField
                                fullWidth
                                label="Password"
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
                                {isSubmitting ? 'Signing in...' : 'Sign in'}
                            </Button>

                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Link
                                    component={RouterLink}
                                    to="/reset-password"
                                    variant="body2"
                                    sx={{ textDecoration: 'none' }}
                                >
                                    Forgot password?
                                </Link>
                            </Box>

                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Typography variant="body2">
                                    Don't have an account?{' '}
                                    <Link
                                        component={RouterLink}
                                        to="/register"
                                        variant="body2"
                                        sx={{ textDecoration: 'none' }}
                                    >
                                        Sign up
                                    </Link>
                                </Typography>
                            </Box>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
}

export default Login; 