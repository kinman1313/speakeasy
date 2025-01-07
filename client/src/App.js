import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { theme } from './theme';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import Chat from './pages/chat/Chat';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider>
                <AuthProvider>
                    <Router>
                        <Routes>
                            <Route path='/login' element={<Login />} />
                            <Route path='/register' element={<Register />} />
                            <Route path='/reset-password' element={<ResetPassword />} />
                            <Route
                                path='/'
                                element={
                                    <PrivateRoute>
                                        <Layout>
                                            <Chat />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route path='*' element={<Navigate to='/' replace />} />
                        </Routes>
                    </Router>
                </AuthProvider>
            </SnackbarProvider>
        </ThemeProvider>
  );
}

export default App;
