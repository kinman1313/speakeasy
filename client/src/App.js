import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/lab';
import AdapterDayjs from '@date-io/dayjs';
import theme from './theme';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { SignalProvider } from './contexts/SignalContext';
import { SnackbarProvider } from './contexts/SnackbarContext';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <SnackbarProvider>
                    <Router>
                        <AuthProvider>
                            <SocketProvider>
                                <SignalProvider>
                                    <AppRoutes />
                                </SignalProvider>
                            </SocketProvider>
                        </AuthProvider>
                    </Router>
                </SnackbarProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App; 