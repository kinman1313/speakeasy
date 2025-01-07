import { ThemeProvider } from '@mui/material/styles/index.js';
import CssBaseline from '@mui/material/CssBaseline/index.js';
import { BrowserRouter } from 'react-router-dom';
import theme from './theme.js';
import AppRoutes from './routes/index.js';
import { AuthProvider } from './contexts/AuthContext.js';
import { SocketProvider } from './contexts/SocketContext.js';
import { SignalProvider } from './contexts/SignalContext.js';
import { SnackbarProvider } from './contexts/SnackbarContext.js';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <AuthProvider>
                    <SocketProvider>
                        <SignalProvider>
                            <SnackbarProvider>
                                <AppRoutes />
                            </SnackbarProvider>
                        </SignalProvider>
                    </SocketProvider>
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App; 