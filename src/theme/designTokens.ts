/**
 * Finora Global Design Tokens System
 * Strict Fintech standard: Inter font scale, 4px spacing rhythm, semantic status mapping,
 * WCAG 2.2 AA compliant contrast.
 */

export interface SemanticColorToken {
  text: string;
  bg: string;
  border: string;
  contrastText: string;
}

export const FINORA_TOKENS = {
  // Brand Palette: Deep Calm Emerald & Editorial Indigo Accent
  brand: {
    primary: '#315C50',
    primaryHover: '#274A40',
    primaryActive: '#1E3D34',
    primarySoft: '#EAF2EE',
    primarySubtle: 'rgba(49, 92, 80, 0.08)',
    accent: '#6C63B5',
    accentSoft: '#F0EFFA',
    accentHover: '#5B52A3'
  },

  // Neutral Surfaces (Calm Technology, Light Editorial & Dark Luxury)
  surfaces: {
    light: {
      appBg: '#F7F8F7',
      surface: '#FFFFFF',
      cardDefault: '#FFFFFF',
      surfaceSecondary: '#F1F4F2',
      secondary: '#F1F4F2',
      elevated: '#FFFFFF',
      border: '#E4E9E5',
      borderStrong: '#D4DDD7',
      textPrimary: '#17211E',
      textSecondary: '#65736C',
      textMuted: '#89948E',
      disabled: '#B5BDB8'
    },
    dark: {
      appBg: '#0D1117',
      surface: '#161B22',
      cardDefault: '#161B22',
      surfaceSecondary: '#1C2128',
      secondary: '#1C2128',
      elevated: '#21262D',
      border: 'rgba(255, 255, 255, 0.12)',
      borderStrong: 'rgba(255, 255, 255, 0.22)',
      textPrimary: '#F0F6FC',
      textSecondary: '#8B949E',
      textMuted: '#6E7681',
      disabled: '#484F58'
    }
  },

  // Semantic Colors (Explicit Text, Background, Border & Contrast)
  semantic: {
    success: {
      light: { text: '#15803D', bg: '#ECFDF3', border: '#B9F3CD', contrastText: '#FFFFFF' },
      dark: { text: '#34D399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)', contrastText: '#FFFFFF' }
    },
    warning: {
      light: { text: '#B45309', bg: '#FFFBEB', border: '#FDE68A', contrastText: '#FFFFFF' },
      dark: { text: '#FBBF24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', contrastText: '#FFFFFF' }
    },
    danger: {
      light: { text: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', contrastText: '#FFFFFF' },
      dark: { text: '#F87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)', contrastText: '#FFFFFF' }
    },
    info: {
      light: { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', contrastText: '#FFFFFF' },
      dark: { text: '#60A5FA', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)', contrastText: '#FFFFFF' }
    },
    neutral: {
      light: { text: '#475569', bg: '#F1F5F9', border: '#E2E8F0', contrastText: '#FFFFFF' },
      dark: { text: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', contrastText: '#FFFFFF' }
    }
  },

  // Typography Scale (Inter / Be Vietnam Pro, Tabular Numerals for Finance)
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    numbersFontFamily: '"Inter", -apple-system, sans-serif',
    display: { size: 36, weight: 800, lineHeight: 1.2, letterSpacing: '-0.03em' },
    h1: { size: 28, weight: 750, lineHeight: 1.25, letterSpacing: '-0.025em' },
    h2: { size: 24, weight: 700, lineHeight: 1.3, letterSpacing: '-0.02em' },
    h3: { size: 20, weight: 700, lineHeight: 1.35, letterSpacing: '-0.015em' },
    h4: { size: 18, weight: 650, lineHeight: 1.35, letterSpacing: '-0.01em' },
    bodyLarge: { size: 16, weight: 450, lineHeight: 1.5, letterSpacing: '0em' },
    body: { size: 14, weight: 400, lineHeight: 1.5, letterSpacing: '0em' },
    bodySmall: { size: 13, weight: 400, lineHeight: 1.45, letterSpacing: '0em' },
    caption: { size: 12, weight: 500, lineHeight: 1.35, letterSpacing: '0.01em' },
    micro: { size: 11, weight: 550, lineHeight: 1.3, letterSpacing: '0.02em' }
  },

  // 4px Spacing Rhythm
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64
  },

  // Border Radius Standards
  radius: {
    badge: 6,
    input: 8,
    button: 8,
    cardSmall: 10,
    cardStandard: 12,
    cardLarge: 16,
    modal: 16,
    dialog: 18,
    // Backward-compat aliases
    outer: 12,
    inner: 8
  },

  // Backward-compat aliases for older components
  primary: {
    main: '#315C50',
    hover: '#274A40',
    darkMain: '#34D399',
    darkHover: '#10B981'
  },

  moduleIdentity: {
    income: { color: '#15803D', bgLight: '#ECFDF3', bgDark: 'rgba(21, 128, 61, 0.15)' },
    expense: { color: '#B91C1C', bgLight: '#FEF2F2', bgDark: 'rgba(185, 28, 28, 0.15)' },
    investments: { color: '#6C63B5', bgLight: '#F0EFFA', bgDark: 'rgba(108, 99, 181, 0.15)' },
    budgets: { color: '#D97706', bgLight: '#FFFBEB', bgDark: 'rgba(217, 119, 6, 0.15)' },
    savings: { color: '#0D9488', bgLight: '#CCFBF1', bgDark: 'rgba(13, 148, 136, 0.15)' },
    accounts: { color: '#1D4ED8', bgLight: '#EFF6FF', bgDark: 'rgba(29, 78, 216, 0.15)' },
    debts: { color: '#EA580C', bgLight: '#FFEDD5', bgDark: 'rgba(234, 88, 12, 0.15)' },
    reports: { color: '#6C63B5', bgLight: '#F0EFFA', bgDark: 'rgba(108, 99, 181, 0.15)' },
    admin: { color: '#0284C7', bgLight: '#E0F2FE', bgDark: 'rgba(2, 132, 199, 0.15)' }
  },

  // Component Standard Heights
  heights: {
    btnSmall: 32,
    btnMedium: 40,
    btnLarge: 44,
    input: 42,
    tableRow: 50,
    sidebarItem: 42,
    topbar: 62,
    sidebarExpanded: 248,
    sidebarCollapsed: 72
  },

  // Speedometer Risk Zones (0-100 score)
  gaugeZones: {
    low: { min: 0, max: 24, color: '#15803D', label: 'An toàn / Rủi ro thấp' },
    moderate: { min: 25, max: 49, color: '#D97706', label: 'Trung bình / Ổn định' },
    high: { min: 50, max: 74, color: '#EA580C', label: 'Cảnh báo / Rủi ro cao' },
    critical: { min: 75, max: 100, color: '#DC2626', label: 'Nguy cấp / Cần can thiệp' }
  }
};

export type SemanticStatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Global Status Color & Label Resolver (Shared between User App & Admin Console)
 */
export function resolveUniversalStatus(status: string): {
  type: SemanticStatusType;
  color: string;
  bg: string;
  border: string;
  label: string;
} {
  const s = status.toLowerCase().trim();

  // Success / Active / Running
  if (['running', 'active', 'completed', 'paid', 'verified', 'approved', 'success', 'hoạt động', 'hoàn tất'].includes(s)) {
    return {
      type: 'success',
      color: FINORA_TOKENS.semantic.success.light.text,
      bg: FINORA_TOKENS.semantic.success.light.bg,
      border: FINORA_TOKENS.semantic.success.light.border,
      label: 'Hoạt động'
    };
  }

  // Warning / Pending / Degraded / Maintenance
  if (['pending', 'paused', 'degraded', 'maintenance', 'chờ xử lý', 'tạm dừng', 'cần chú ý'].includes(s)) {
    return {
      type: 'warning',
      color: FINORA_TOKENS.semantic.warning.light.text,
      bg: FINORA_TOKENS.semantic.warning.light.bg,
      border: FINORA_TOKENS.semantic.warning.light.border,
      label: 'Chờ xử lý'
    };
  }

  // Danger / Error / Failed / Expired
  if (['error', 'failed', 'expired', 'stopped', 'bị từ chối', 'thất bại', 'quá hạn', 'lỗ'].includes(s)) {
    return {
      type: 'danger',
      color: FINORA_TOKENS.semantic.danger.light.text,
      bg: FINORA_TOKENS.semantic.danger.light.bg,
      border: FINORA_TOKENS.semantic.danger.light.border,
      label: 'Lỗi / Thất bại'
    };
  }

  // Info / Checking
  if (['checking', 'draft', 'scheduled', 'mới'].includes(s)) {
    return {
      type: 'info',
      color: FINORA_TOKENS.semantic.info.light.text,
      bg: FINORA_TOKENS.semantic.info.light.bg,
      border: FINORA_TOKENS.semantic.info.light.border,
      label: 'Thông tin'
    };
  }

  // Neutral / Disabled / Inactive
  return {
    type: 'neutral',
    color: FINORA_TOKENS.semantic.neutral.light.text,
    bg: FINORA_TOKENS.semantic.neutral.light.bg,
    border: FINORA_TOKENS.semantic.neutral.light.border,
    label: 'Không hoạt động'
  };
}

export const resolveFinoraStatus = (status: string) => resolveUniversalStatus(status).type;
