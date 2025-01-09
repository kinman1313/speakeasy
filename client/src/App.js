import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import AppRoutes from './routes';
import { loadFonts } from './utils/fontLoader';

function App() {
  useEffect(() => {
    loadFonts();
  }, []);

  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#0A1929',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <ThemeProvider>
        <SnackbarProvider>
          <AuthProvider>
            <SocketProvider>
              <Router>
                <AppRoutes />
              </Router>
            </SocketProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </Suspense>
  );
}

export default App;
