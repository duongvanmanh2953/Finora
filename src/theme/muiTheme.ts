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
        main: isDark ? '#4E9B7C' : '#355E52',
        light: isDark ? '#6BB599' : '#457265',
        dark: isDark ? '#3B7E63' : '#2A4E44',
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
        default: isDark ? '#0D1117' : '#F1F5F9',
        paper: isDark ? '#161B22' : '#FFFFFF'
      },
      text: {
        primary: isDark ? '#F8FAFC' : '#0F172A',
        secondary: isDark ? '#CBD5E1' : '#334155'
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.16)' : '#CBD5E1'
    },
    shape: {
      borderRadius: 6
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
      // 0. BACKDROP: Elegant dimmed overlay with blur ONLY for modals, dialogs & drawers
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            // Dimmed dark background with blur effect strictly for Dialogs & Drawers
            '.MuiDialog-root > &, .MuiDrawer-root > &': {
              backgroundColor: isDark ? 'rgba(6, 11, 20, 0.75)' : 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            },
            // Never blur or darken for invisible backdrops, Select dropdowns, Menus and Popovers
            '&.MuiBackdrop-invisible, &.MuiModal-backdropInvisible, .MuiPopover-root > &, .MuiMenu-root > &, .MuiSelect-root ~ &': {
              backgroundColor: 'transparent !important',
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important'
            }
          },
          invisible: {
            backgroundColor: 'transparent !important',
            backdropFilter: 'none !important',
            WebkitBackdropFilter: 'none !important'
          }
        }
      },
      // 1. CONTAINERS: Standard 6px radius (tactile, friendly, not overly rounded)
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            borderRadius: 6,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
            boxShadow: isDark
              ? '0 2px 8px 0 rgba(0, 0, 0, 0.45)'
              : '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 6
          },
          rounded: {
            borderRadius: 6
          },
          outlined: {
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            borderRadius: 6,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
            boxShadow: isDark
              ? '0 2px 8px 0 rgba(0, 0, 0, 0.45)'
              : '0 1px 3px 0 rgba(15, 23, 42, 0.08)'
          }
        }
      },
      MuiModal: {
        defaultProps: {
          disableScrollLock: false
        }
      },
      MuiDialog: {
        defaultProps: {
          disableScrollLock: false
        },
        styleOverrides: {
          paper: {
            borderRadius: 10,
            backgroundImage: 'none',
            backgroundColor: isDark ? '#111622' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid #CBD5E1',
            boxShadow: isDark
              ? '0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)'
              : '0 24px 48px -12px rgba(15, 23, 42, 0.18), 0 8px 16px -8px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
            margin: 16,
            maxWidth: 'min(calc(100vw - 32px), 640px)',
            boxSizing: 'border-box',
            overflowX: 'hidden'
          }
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#161D2A' : '#F8FAFC',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
            padding: '16px 22px',
            color: isDark ? '#F8FAFC' : '#0F172A',
            fontWeight: 750
          }
        }
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '20px 22px',
            backgroundColor: isDark ? '#111622' : '#FFFFFF',
            '&:first-of-type': {
              paddingTop: 20
            },
            '.MuiDialogTitle-root + &': {
              paddingTop: '20px !important'
            }
          },
          dividers: {
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0'
          }
        }
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#161D2A' : '#F8FAFC',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
            padding: '14px 22px'
          }
        }
      },
      MuiMenu: {
        defaultProps: {
          disableScrollLock: false,
          slotProps: {
            backdrop: {
              invisible: true,
              sx: {
                backgroundColor: 'transparent !important',
                backdropFilter: 'none !important',
                WebkitBackdropFilter: 'none !important'
              }
            }
          }
        },
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            color: isDark ? '#F0F6FC' : '#0F172A',
            borderRadius: 6,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #CBD5E1',
            boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.55)' : '0 10px 25px -5px rgba(15, 23, 42, 0.12)'
          }
        }
      },
      MuiPopover: {
        defaultProps: {
          disableScrollLock: false,
          slotProps: {
            backdrop: {
              invisible: true,
              sx: {
                backgroundColor: 'transparent !important',
                backdropFilter: 'none !important',
                WebkitBackdropFilter: 'none !important'
              }
            }
          }
        },
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            color: isDark ? '#F0F6FC' : '#0F172A',
            borderRadius: 6,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #CBD5E1',
            boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.55)' : '0 10px 25px -5px rgba(15, 23, 42, 0.12)'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            textTransform: 'none',
            fontWeight: 650,
            fontSize: 13,
            boxShadow: 'none',
            padding: '7px 14px',
            minHeight: 38,
            transition: 'all 0.15s ease',
            '&:hover': {
              boxShadow: 'none'
            }
          },
          sizeSmall: {
            minHeight: 32,
            padding: '4px 10px',
            fontSize: 12,
            borderRadius: 6
          },
          sizeLarge: {
            minHeight: 44,
            padding: '9px 18px',
            fontSize: 14,
            borderRadius: 6
          },
          contained: {
            backgroundColor: isDark ? '#4E9B7C' : '#1E5A48',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: isDark ? '#10B981' : '#164638'
            }
          },
          outlined: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : '#CBD5E1',
            color: isDark ? '#F0F6FC' : '#0F172A',
            borderRadius: 6,
            '&:hover': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : '#94A3B8',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.04)'
            }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            fontSize: 13.5,
            minHeight: 40,
            color: isDark ? '#F8FAFC' : '#0F172A',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
            '& fieldset': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : '#CBD5E1',
              borderWidth: 1.5
            },
            '&:hover': {
              backgroundColor: isDark ? '#243248' : '#F1F5F9'
            },
            '&:hover fieldset': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : '#94A3B8'
            },
            '&.Mui-focused': {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              boxShadow: isDark ? '0 0 0 3px rgba(78, 155, 124, 0.22)' : '0 0 0 3px rgba(30, 90, 72, 0.12)'
            },
            '&.Mui-focused fieldset': {
              borderColor: isDark ? '#4E9B7C' : '#1E5A48',
              borderWidth: 1.5
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            fontWeight: 650,
            fontSize: 11.5
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
            borderRadius: 6,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : undefined
          }
        }
      },
      MuiSelect: {
        defaultProps: {
          MenuProps: {
            disableScrollLock: false,
            slotProps: {
              backdrop: {
                invisible: true,
                sx: {
                  backgroundColor: 'transparent !important',
                  backdropFilter: 'none !important',
                  WebkitBackdropFilter: 'none !important'
                }
              }
            }
          }
        },
        styleOverrides: {
          root: {
            borderRadius: 6
          },
          icon: {
            color: isDark ? '#CBD5E1' : '#68756F'
          }
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isDark ? '#CBD5E1' : '#334155',
            fontWeight: 600,
            fontSize: 13.5,
            '&.Mui-focused': {
              color: isDark ? '#34D399' : '#1E5A48',
              fontWeight: 700
            }
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#10161F' : '#E2E8F0',
            '& .MuiTableCell-head': {
              color: isDark ? '#CBD5E1' : '#334155',
              fontWeight: 750,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid #CBD5E1',
              padding: '7px 10px'
            }
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
            padding: '8px 10px',
            fontSize: 12,
            lineHeight: 1.35,
            color: isDark ? '#F8FAFC' : '#0F172A'
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 40
          },
          indicator: {
            backgroundColor: isDark ? '#10B981' : '#1E5A48',
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
            color: isDark ? '#94A3B8' : '#475569',
            '&.Mui-selected': {
              color: isDark ? '#F8FAFC' : '#1E5A48',
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
