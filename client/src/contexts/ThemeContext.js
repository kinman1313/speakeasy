import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            margin: 0,
            padding: 0,
            minHeight: '100vh',
            backgroundColor: '#0A1929',
            backgroundImage:
              'radial-gradient(at 0% 0%, rgba(0, 229, 255, 0.1) 0px, transparent 50%), ' +
              'radial-gradient(at 100% 0%, rgba(2, 136, 209, 0.1) 0px, transparent 50%), ' +
              'radial-gradient(at 100% 100%, rgba(0, 229, 255, 0.1) 0px, transparent 50%), ' +
              'radial-gradient(at 0% 100%, rgba(2, 136, 209, 0.1) 0px, transparent 50%)',
            color: '#FFFFFF',
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
          '#root': {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
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
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            padding: '8px 16px',
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

  const value = {
    themeMode,
    setThemeMode,
    messageColor,
    setMessageColor,
    bubbleStyle,
    setBubbleStyle,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
