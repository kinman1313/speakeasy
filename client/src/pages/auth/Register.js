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

function Register() {
    const { register, error } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        if (!formData.username) {
            errors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const success = await register({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            if (!success) {
                setFormErrors({ submit: 'Registration failed. Please try again.' });
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
                                Create an account
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Sign up to join {process.env.REACT_APP_NAME}
                            </Typography>
                        </Box>

                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Username"
                                margin="normal"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                error={Boolean(formErrors.username)}
                                helperText={formErrors.username}
                            />

                            <TextField
                                fullWidth
                                label="Email address"
                                margin="normal"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={Boolean(formErrors.email)}
                                helperText={formErrors.email}
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                margin="normal"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
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
                                label="Confirm Password"
                                margin="normal"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange}
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
                                {isSubmitting ? 'Creating account...' : 'Create account'}
                            </Button>

                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Typography variant="body2">
                                    Already have an account?{' '}
                                    <Link
                                        component={RouterLink}
                                        to="/login"
                                        variant="body2"
                                        sx={{ textDecoration: 'none' }}
                                    >
                                        Sign in
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

export default Register; 