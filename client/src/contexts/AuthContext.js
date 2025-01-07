import { createContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useSignal } from '../hooks/useSignal';
import { useSnackbar } from '../hooks/useSnackbar';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const { showSnackbar } = useSnackbar();
    const {
        generatePreKey,
        generateSignedPreKey,
        generateIdentityKeyPair,
        generateRegistrationId
    } = useSignal();

    const api = axios.create({
        baseURL: process.env.REACT_APP_API_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    const register = useCallback(async (username, email, password) => {
        try {
            // Generate Signal Protocol keys
            const identityKeyPair = await generateIdentityKeyPair();
            const registrationId = await generateRegistrationId();
            const preKey = await generatePreKey();
            const signedPreKey = await generateSignedPreKey(identityKeyPair);

            const response = await api.post('/auth/register', {
                username,
                email,
                password,
                signalKeys: {
                    identityKey: identityKeyPair.pubKey,
                    registrationId,
                    preKey: {
                        keyId: preKey.keyId,
                        publicKey: preKey.publicKey
                    },
                    signedPreKey: {
                        keyId: signedPreKey.keyId,
                        publicKey: signedPreKey.publicKey,
                        signature: signedPreKey.signature
                    }
                }
            });

            const { token: newToken, user: userData } = response.data;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);
            showSnackbar('Registration successful', 'success');
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            showSnackbar(error.response?.data?.message || 'Registration failed', 'error');
            return false;
        }
    }, [api, generatePreKey, generateSignedPreKey, generateIdentityKeyPair, generateRegistrationId, showSnackbar]);

    const login = useCallback(async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token: newToken, user: userData } = response.data;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);
            showSnackbar('Login successful', 'success');
            return true;
        } catch (error) {
            console.error('Login error:', error);
            showSnackbar(error.response?.data?.message || 'Login failed', 'error');
            return false;
        }
    }, [api, showSnackbar]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        showSnackbar('Logged out successfully', 'success');
    }, [showSnackbar]);

    const resetPassword = useCallback(async (email) => {
        try {
            await api.post('/auth/reset-password', { email });
            showSnackbar('Password reset email sent', 'success');
            return true;
        } catch (error) {
            console.error('Password reset error:', error);
            showSnackbar(error.response?.data?.message || 'Password reset failed', 'error');
            return false;
        }
    }, [api, showSnackbar]);

    const updateProfile = useCallback(async (data) => {
        try {
            const response = await api.put('/auth/profile', data);
            setUser(response.data);
            showSnackbar('Profile updated successfully', 'success');
            return true;
        } catch (error) {
            console.error('Profile update error:', error);
            showSnackbar(error.response?.data?.message || 'Profile update failed', 'error');
            return false;
        }
    }, [api, showSnackbar]);

    useEffect(() => {
        const loadUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/profile');
                setUser(response.data);
            } catch (error) {
                console.error('Error loading user:', error);
                localStorage.removeItem('token');
                setToken(null);
            }
            setLoading(false);
        };

        loadUser();
    }, [token, api]);

    const value = {
        user,
        token,
        loading,
        register,
        login,
        logout,
        resetPassword,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
} 