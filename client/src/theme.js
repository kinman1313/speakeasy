import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2196f3',
            light: '#64b5f6',
            dark: '#1976d2',
            contrastText: '#fff'
        },
        secondary: {
            main: '#f50057',
            light: '#ff4081',
            dark: '#c51162',
            contrastText: '#fff'
        },
        background: {
            default: '#f5f5f5',
            paper: '#fff'
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 600
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 600
        },
        subtitle1: {
            fontSize: '1rem',
            fontWeight: 400
        },
        subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500
        },
        body1: {
            fontSize: '1rem',
            fontWeight: 400
        },
        body2: {
            fontSize: '0.875rem',
            fontWeight: 400
        },
        button: {
            textTransform: 'none',
            fontWeight: 500
        }
    },
    shape: {
        borderRadius: 8
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                    padding: '8px 16px'
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none'
                    }
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8
                    }
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)'
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                rounded: {
                    borderRadius: 12
                }
            }
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 12
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8
                }
            }
        }
    }
});

export default theme; 