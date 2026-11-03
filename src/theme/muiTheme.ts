import { createTheme, alpha, type ThemeOptions } from '@mui/material/styles';
import type {} from '@mui/x-date-pickers/themeAugmentation';

/**
 * Global Semantic Palette for Baoyu Design Standard
 */
export const SEMANTIC_PALETTE = {
  // Cổ phiếu (Stocks): Electric Blue
  stocks: {
    main: '#2563EB',
    bg: alpha('#2563EB', 0.12),
    border: alpha('#2563EB', 0.25),
    contrastText: '#FFFFFF'
  },
  // Chứng chỉ quỹ (Mutual Funds / ETFs): Royal Purple
  funds: {
    main: '#7C3AED',
    bg: alpha('#7C3AED', 0.12),
    border: alpha('#7C3AED', 0.25),
    contrastText: '#FFFFFF'
  },
  // Trái phiếu (Bonds): Teal / Cyan
  bonds: {
    main: '#0D9488',
    bg: alpha('#0D9488', 0.12),
    border: alpha('#0D9488', 0.25),
    contrastText: '#FFFFFF'
  },
  // Vàng (Gold): Amber / Warm Gold
  gold: {
    main: '#D97706',
    bg: alpha('#D97706', 0.12),
    border: alpha('#D97706', 0.25),
    contrastText: '#FFFFFF'
  },
  // Thu nhập (Income): Emerald Green
  income: {
    main: '#10B981',
    bg: alpha('#10B981', 0.12),
    border: alpha('#10B981', 0.25),
    contrastText: '#FFFFFF'
  },
  // Chi tiêu (Expense): Coral Red
  expense: {
    main: '#EF4444',
    bg: alpha('#EF4444', 0.12),
    border: alpha('#EF4444', 0.25),
    contrastText: '#FFFFFF'
  }
};

export function getFinoraTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: isDark ? '#34D399' : '#315C50',
        light: isDark ? '#6EE7B7' : '#3D7465',
        dark: isDark ? '#10B981' : '#274A40',
        contrastText: '#ffffff'
      },
      secondary: {
        main: isDark ? '#A78BFA' : '#6C63B5',
        light: isDark ? '#C4B5FD' : '#857DC5',
        dark: isDark ? '#8B5CF6' : '#5B52A3',
        contrastText: '#ffffff'
      },
      success: {
        main: '#15803D',
        light: '#22C55E',
        contrastText: '#ffffff'
      },
      error: {
        main: '#B91C1C',
        contrastText: '#ffffff'
      },
      warning: {
        main: '#B45309',
        contrastText: '#ffffff'
      },
      info: {
        main: '#1D4ED8',
        contrastText: '#ffffff'
      },
      background: {
        default: isDark ? '#0D1117' : '#F7F8F7',
        paper: isDark ? '#161B22' : '#FFFFFF'
      },
      text: {
        primary: isDark ? '#F0F6FC' : '#17211E',
        secondary: isDark ? '#8B949E' : '#65736C'
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E4E9E5'
    },
    shape: {
      borderRadius: 8
    },
    spacing: 8,
    typography: {
      fontFamily: [
        'Inter',
        'Be Vietnam Pro',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'sans-serif'
      ].join(','),
      h1: { fontSize: 28, fontWeight: 750, letterSpacing: '-0.025em', lineHeight: 1.25 },
      h2: { fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
      h3: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.35 },
      h4: { fontSize: 18, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: 1.35 },
      h5: { fontSize: 16, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: 1.4 },
      h6: { fontSize: 15, fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.4 },
      subtitle1: { fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em' },
      subtitle2: { fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em' },
      body1: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
      body2: { fontSize: 13, fontWeight: 400, lineHeight: 1.45 },
      caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.35 },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '-0.005em'
      }
    },
    components: {
      // 1. OUTER CONTAINERS: Strictly borderRadius: 6px
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            borderRadius: 12,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E4E9E5',
            boxShadow: isDark
              ? '0 2px 8px 0 rgba(0, 0, 0, 0.45)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.04)'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 12
          },
          rounded: {
            borderRadius: 12
          },
          outlined: {
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            borderRadius: 12,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E4E9E5',
            boxShadow: isDark
              ? '0 2px 8px 0 rgba(0, 0, 0, 0.45)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.04)'
          }
        }
      },
      MuiDialog: {
        defaultProps: {
          disableScrollLock: true
        },
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundImage: 'none',
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #E4E9E5',
            boxShadow: isDark ? '0 20px 48px rgba(0, 0, 0, 0.65)' : '0 20px 48px rgba(23, 33, 30, 0.08)'
          }
        }
      },
      MuiMenu: {
        defaultProps: {
          disableScrollLock: true
        },
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            color: isDark ? '#F0F6FC' : '#17211E',
            borderRadius: 10,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #E4E9E5',
            boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.55)' : '0 12px 32px rgba(23,33,30,0.08)'
          }
        }
      },
      MuiPopover: {
        defaultProps: {
          disableScrollLock: true
        },
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            color: isDark ? '#F0F6FC' : '#17211E',
            borderRadius: 10,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #E4E9E5',
            boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.55)' : '0 12px 32px rgba(23,33,30,0.08)'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 650,
            fontSize: 13.5,
            boxShadow: 'none',
            padding: '8px 16px',
            minHeight: 40,
            transition: 'all 0.15s ease',
            '&:hover': {
              boxShadow: 'none'
            }
          },
          sizeSmall: {
            minHeight: 32,
            padding: '4px 12px',
            fontSize: 12.5
          },
          sizeLarge: {
            minHeight: 44,
            padding: '10px 20px',
            fontSize: 14.5
          },
          contained: {
            backgroundColor: isDark ? '#34D399' : '#315C50',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: isDark ? '#10B981' : '#274A40'
            }
          },
          outlined: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : '#D4DDD7',
            color: isDark ? '#F0F6FC' : '#17211E',
            borderRadius: 8,
            '&:hover': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : '#B5BDB8',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.02)'
            }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark ? '#1C2128' : '#FFFFFF',
            fontSize: 13.5,
            minHeight: 42,
            color: isDark ? '#F0F6FC' : '#17211E',
            '& fieldset': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#E4E9E5'
            },
            '&:hover fieldset': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.30)' : '#D4DDD7'
            },
            '&.Mui-focused fieldset': {
              borderColor: isDark ? '#34D399' : '#315C50',
              borderWidth: 1.5
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 650,
            fontSize: 12
          }
        }
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            color: isDark ? '#F8FAFC' : '#17211F',
            fontSize: 13,
            margin: '2px 4px',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F6F9F7'
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#E3EBE6',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.28)' : '#D0DDD5'
              }
            }
          }
        }
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : undefined
          }
        }
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 4
          },
          icon: {
            color: isDark ? '#CBD5E1' : '#68756F'
          }
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isDark ? '#CBD5E1' : '#68756F',
            fontWeight: 500,
            '&.Mui-focused': {
              color: isDark ? '#34D399' : '#20705B',
              fontWeight: 700
            }
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#10161F' : '#F8FAF8',
            '& .MuiTableCell-head': {
              color: isDark ? '#CBD5E1' : '#68756F',
              fontWeight: 700,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid #D0DDD5',
              padding: '10px 16px'
            }
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#D0DDD5',
            padding: '12px 16px',
            fontSize: 13,
            color: isDark ? '#F8FAFC' : '#17211F'
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 40
          },
          indicator: {
            backgroundColor: isDark ? '#10B981' : '#20705B',
            height: 2.5,
            borderRadius: '2px 2px 0 0'
          }
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 40,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 4,
            color: isDark ? '#94A3B8' : '#68756F',
            '&.Mui-selected': {
              color: isDark ? '#F8FAFC' : '#20705B',
              fontWeight: 700
            }
          }
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#1E293B' : '#17211F',
            color: '#FFFFFF',
            fontSize: 11.5,
            fontWeight: 500,
            borderRadius: 4,
            padding: '6px 10px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : 'none'
          }
        }
      }
    }
  };

  return createTheme(themeOptions);
}
