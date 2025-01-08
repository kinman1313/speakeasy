import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { alpha } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'dark';
  });

  const [messageColor, setMessageColor] = useState(() => {
    const savedColor = localStorage.getItem('messageColor');
    return savedColor || '#00E5FF';
  });

  const [bubbleStyle, setBubbleStyle] = useState(() => {
    const savedStyle = localStorage.getItem('bubbleStyle');
    return savedStyle || 'modern';
  });

  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#00E5FF',
        light: '#6EFFFF',
        dark: '#00B2CC',
      },
      secondary: {
        main: '#0288D1',
        light: '#5EB8FF',
        dark: '#005B9F',
      },
      background: {
        default: '#0A1929',
        paper: alpha('#132F4C', 0.8),
        message: messageColor,
        card: 'linear-gradient(145deg, rgba(19,47,76,0.9) 0%, rgba(19,47,76,0.6) 100%)',
      },
      text: {
        primary: '#FFFFFF',
        secondary: alpha('#FFFFFF', 0.7),
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 600,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            padding: '8px 16px',
            background: 'linear-gradient(145deg, rgba(0,229,255,0.15) 0%, rgba(0,229,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: 'linear-gradient(145deg, rgba(0,229,255,0.25) 0%, rgba(0,229,255,0.15) 100%)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: 'transparent',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(145deg, rgba(19,47,76,0.9) 0%, rgba(19,47,76,0.6) 100%)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: 'transparent',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(145deg, rgba(19,47,76,0.9) 0%, rgba(19,47,76,0.6) 100%)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            backdropFilter: 'blur(10px)',
            background: 'linear-gradient(145deg, rgba(19,47,76,0.9) 0%, rgba(19,47,76,0.6) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#0A1929',
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha('#00E5FF', 0.2),
              borderRadius: '4px',
              '&:hover': {
                background: alpha('#00E5FF', 0.3),
              },
            },
          },
        },
      },
    },
  });

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('messageColor', messageColor);
    localStorage.setItem('bubbleStyle', bubbleStyle);
  }, [themeMode, messageColor, bubbleStyle]);

  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const value = {
    themeMode,
    setThemeMode,
    toggleTheme,
    messageColor,
    setMessageColor,
    bubbleStyle,
    setBubbleStyle,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
