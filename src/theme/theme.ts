import { createTheme, alpha } from '@mui/material/styles'

// Paleta inspirada em terminais e interfaces industriais
const colors = {
  primary: '#00d9ff',      // Cyan neon
  secondary: '#ff6b35',    // Laranja vibrante
  success: '#39ff14',      // Verde neon
  warning: '#ffd700',      // Amarelo dourado
  error: '#ff3366',        // Vermelho vibrante
  background: {
    dark: '#0a0a0f',       // Preto profundo
    paper: '#12121a',      // Cinza escuro
    card: '#1a1a28',       // Card background
  },
  text: {
    primary: '#e8e8e8',
    secondary: '#8888aa',
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary,
      light: alpha(colors.primary, 0.8),
      dark: alpha(colors.primary, 0.6),
      contrastText: '#000',
    },
    secondary: {
      main: colors.secondary,
      light: alpha(colors.secondary, 0.8),
      dark: alpha(colors.secondary, 0.6),
    },
    success: {
      main: colors.success,
    },
    warning: {
      main: colors.warning,
    },
    error: {
      main: colors.error,
    },
    background: {
      default: colors.background.dark,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
  },
  typography: {
    fontFamily: '"Outfit", "Roboto", sans-serif',
    h1: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 500,
    },
    button: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      textTransform: 'none',
    },
    body1: {
      fontFamily: '"Outfit", sans-serif',
    },
    body2: {
      fontFamily: '"Outfit", sans-serif',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: `linear-gradient(135deg, ${colors.background.dark} 0%, ${colors.background.paper} 50%, ${colors.background.dark} 100%)`,
          minHeight: '100vh',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, ${alpha(colors.primary, 0.03)} 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${alpha(colors.secondary, 0.03)} 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: -1,
          },
        },
        '::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '::-webkit-scrollbar-track': {
          background: colors.background.dark,
        },
        '::-webkit-scrollbar-thumb': {
          background: alpha(colors.primary, 0.3),
          borderRadius: 4,
          '&:hover': {
            background: alpha(colors.primary, 0.5),
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '1rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${alpha(colors.primary, 0.8)} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${alpha(colors.primary, 0.9)} 0%, ${alpha(colors.primary, 0.7)} 100%)`,
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: `linear-gradient(145deg, ${colors.background.card} 0%, ${alpha(colors.background.paper, 0.8)} 100%)`,
          border: `1px solid ${alpha(colors.primary, 0.1)}`,
          backdropFilter: 'blur(10px)',
          boxShadow: `0 4px 30px ${alpha('#000', 0.3)}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: alpha(colors.background.dark, 0.5),
            '& fieldset': {
              borderColor: alpha(colors.primary, 0.2),
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderColor: alpha(colors.primary, 0.4),
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(90deg, ${colors.background.paper} 0%, ${colors.background.card} 100%)`,
          borderBottom: `1px solid ${alpha(colors.primary, 0.2)}`,
          boxShadow: `0 2px 20px ${alpha('#000', 0.3)}`,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          background: `linear-gradient(180deg, ${colors.background.card} 0%, ${colors.background.paper} 100%)`,
          borderTop: `1px solid ${alpha(colors.primary, 0.2)}`,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: colors.text.secondary,
          '&.Mui-selected': {
            color: colors.primary,
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${alpha(colors.primary, 0.8)} 100%)`,
          boxShadow: `0 4px 20px ${alpha(colors.primary, 0.4)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${alpha(colors.primary, 0.9)} 0%, ${alpha(colors.primary, 0.7)} 100%)`,
            boxShadow: `0 6px 25px ${alpha(colors.primary, 0.5)}`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        filled: {
          background: alpha(colors.primary, 0.15),
          border: `1px solid ${alpha(colors.primary, 0.3)}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: colors.background.card,
          border: `1px solid ${alpha(colors.primary, 0.2)}`,
        },
      },
    },
  },
})

