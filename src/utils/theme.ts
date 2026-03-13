import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Create a theme instance
let theme = createTheme({
  palette: {
    primary: {
      main: '#3a86ff',
      light: '#6ba4ff',
      dark: '#0a5eca',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff006e',
      light: '#ff5293',
      dark: '#c5004d',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    error: {
      main: '#ef476f',
    },
    success: {
      main: '#06d6a0',
    },
    warning: {
      main: '#ffd166',
    },
    info: {
      main: '#118ab2',
    },
    grey: {
      50: '#f8f9fa',
      100: '#f1f3f5',
      200: '#e9ecef',
      300: '#dee2e6',
      400: '#ced4da',
      500: '#adb5bd',
      600: '#6c757d',
      700: '#495057',
      800: '#343a40',
      900: '#212529',
    },
    text: {
      primary: '#212529',
      secondary: '#495057',
      disabled: '#adb5bd',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01562em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.00833em',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '0em',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0.00735em',
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0em',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '0.0075em',
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      letterSpacing: '0.00938em',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0.01071em',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02857em',
    },
    caption: {
      fontSize: '0.75rem',
      letterSpacing: '0.03333em',
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          WebkitFontSmoothing: 'auto',
        },
        body: {
          minHeight: '100vh',
        },
        '& #root': {
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 16px',
          boxShadow: 'none',
          fontWeight: 600,
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '6px 12px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '@media (min-width: 600px)': {
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          },
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            '@media (min-width: 600px)': {
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: 16,
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.15)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(58, 134, 255, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(58, 134, 255, 0.12)',
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          padding: '8px 16px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '8px 0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontSize: '0.85rem',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
        },
        track: {
          borderRadius: 22 / 2,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// Apply responsive font sizes
theme = responsiveFontSizes(theme);

export default theme; 