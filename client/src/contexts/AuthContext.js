import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await authAPI.getProfile();
          setUser(response.data);
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async credentials => {
    const response = await authAPI.login(credentials);
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    return response.data;
  };

  const register = async userData => {
    const response = await authAPI.register(userData);
    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async data => {
    const response = await authAPI.updateProfile(data);
    setUser(response.data);
    return response.data;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!token,
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
