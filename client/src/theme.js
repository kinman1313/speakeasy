import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#2196f3',
            light: '#64b5f6',
            dark: '#1976d2',
            contrastText: '#ffffff'
        },
        secondary: {
            main: '#f50057',
            light: '#ff4081',
            dark: '#c51162',
            contrastText: '#ffffff'
        },
        background: {
            default: '#0a1929',
            paper: '#132f4c'
        },
        text: {
            primary: '#ffffff',
            secondary: '#b3e5fc',
            disabled: '#78909c'
        },
        divider: 'rgba(255, 255, 255, 0.12)',
        error: {
            main: '#f44336',
            light: '#e57373',
            dark: '#d32f2f',
            contrastText: '#ffffff'
        },
        warning: {
            main: '#ff9800',
            light: '#ffb74d',
            dark: '#f57c00',
            contrastText: '#000000'
        },
        info: {
            main: '#29b6f6',
            light: '#4fc3f7',
            dark: '#0288d1',
            contrastText: '#000000'
        },
        success: {
            main: '#66bb6a',
            light: '#81c784',
            dark: '#388e3c',
            contrastText: '#000000'
        }
    },
    typography: {
        fontFamily: [
            'Roboto',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Arial',
            'sans-serif'
        ].join(','),
        h1: {
            fontSize: '2.5rem',
            fontWeight: 500,
            color: '#ffffff'
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 500,
            color: '#ffffff'
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
            color: '#ffffff'
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
            color: '#ffffff'
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            color: '#ffffff'
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
            color: '#ffffff'
        },
        body1: {
            color: '#ffffff'
        },
        body2: {
            color: '#b3e5fc'
        }
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#0a1929',
                    color: '#ffffff',
                    scrollbarColor: '#1976d2 #0a1929',
                    '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                        backgroundColor: '#0a1929',
                        width: '8px'
                    },
                    '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                        borderRadius: 8,
                        backgroundColor: '#1976d2',
                        minHeight: 24,
                        border: '2px solid #0a1929'
                    },
                    '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                        backgroundColor: '#2196f3'
                    },
                    '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
                        backgroundColor: '#2196f3'
                    },
                    '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: '#2196f3'
                    }
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '8px',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    padding: '8px 16px'
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#132f4c',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    color: '#ffffff'
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.23)'
                        },
                        '&:hover fieldset': {
                            borderColor: '#2196f3'
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#2196f3'
                        }
                    },
                    '& .MuiInputLabel-root': {
                        color: '#b3e5fc'
                    },
                    '& .MuiInputBase-input': {
                        color: '#ffffff'
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: '#132f4c',
                    color: '#ffffff'
                }
            }
        }
    }
});

export default theme;
