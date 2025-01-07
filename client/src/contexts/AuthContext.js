import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(response.data);
            setIsAuthenticated(true);
        } catch (err) {
            localStorage.removeItem('token');
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
                email,
                password
            });

            const { token, user: userData } = response.data;
            localStorage.setItem('token', token);
            setUser(userData);
            setIsAuthenticated(true);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            return false;
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, userData);
            const { token, user: newUser } = response.data;
            localStorage.setItem('token', token);
            setUser(newUser);
            setIsAuthenticated(true);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const requestPasswordReset = async (email) => {
        try {
            setError(null);
            await axios.post(`${process.env.REACT_APP_API_URL}/auth/reset-password`, { email });
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Password reset request failed');
            return false;
        }
    };

    const resetPassword = async (token, newPassword) => {
        try {
            setError(null);
            await axios.post(`${process.env.REACT_APP_API_URL}/auth/reset-password/${token}`, {
                password: newPassword
            });
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Password reset failed');
            return false;
        }
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 