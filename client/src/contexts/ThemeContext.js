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
        primary: '#F8F9FA',
        secondary: alpha('#F8F9FA', 0.7),
      },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
        background: 'linear-gradient(45deg, #00E5FF 30%, #0288D1 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontWeight: 500,
        letterSpacing: '0.01em',
      },
      subtitle2: {
        fontWeight: 500,
        letterSpacing: '0.01em',
      },
      body1: {
        fontWeight: 400,
        letterSpacing: '0.01em',
        lineHeight: 1.7,
      },
      body2: {
        fontWeight: 400,
        letterSpacing: '0.01em',
        lineHeight: 1.7,
      },
      button: {
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'none',
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
              'radial-gradient(at 0% 0%, rgba(0, 229, 255, 0.15) 0px, transparent 50%), ' +
              'radial-gradient(at 100% 0%, rgba(2, 136, 209, 0.15) 0px, transparent 50%), ' +
              'radial-gradient(at 100% 100%, rgba(0, 229, 255, 0.15) 0px, transparent 50%), ' +
              'radial-gradient(at 0% 100%, rgba(2, 136, 209, 0.15) 0px, transparent 50%)',
            color: '#F8F9FA',
            fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
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
            fontWeight: 600,
            letterSpacing: '0.02em',
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
