import { createContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

export const SnackbarContext = createContext();

export function SnackbarProvider({ children }) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info');

    const showSnackbar = useCallback((message, severity = 'info') => {
        setMessage(message);
        setSeverity(severity);
        setOpen(true);
    }, []);

    const handleClose = useCallback((event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    }, []);

    const value = {
        showSnackbar
    };

    return (
        <SnackbarContext.Provider value={value}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
}
