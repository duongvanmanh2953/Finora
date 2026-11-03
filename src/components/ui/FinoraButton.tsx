import type { ReactNode } from 'react';
import { Button as MuiButton, CircularProgress, useTheme } from '@mui/material';
import { FINORA_TOKENS, type SemanticStatusType } from '../../theme/designTokens';

export type FinoraButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'ghost';

export interface FinoraButtonProps {
  children?: ReactNode;
  variant?: FinoraButtonVariant;
  size?: 'small' | 'medium' | 'large';
  icon?: ReactNode;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  sx?: any;
}

export function FinoraButton({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  startIcon,
  endIcon,
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className,
  sx
}: FinoraButtonProps) {
  const effectiveStartIcon = icon || startIcon;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Size specifications
  const sizeStyles = {
    small: {
      py: '5px',
      px: '12px',
      fontSize: 12.5,
      height: 32
    },
    medium: {
      py: '7px',
      px: '16px',
      fontSize: 13.5,
      height: 38
    },
    large: {
      py: '10px',
      px: '22px',
      fontSize: 14.5,
      height: 44
    }
  }[size];

  // Variant color definitions
  let bgcolor = FINORA_TOKENS.primary[isDark ? 'darkMain' : 'main'];
  let color = '#FFFFFF';
  let border = 'none';
  let hoverBg = FINORA_TOKENS.primary[isDark ? 'darkHover' : 'hover'];

  if (variant === 'secondary') {
    bgcolor = isDark ? '#1E293B' : '#F1F5F3';
    color = isDark ? '#F8FAFC' : '#17211D';
    border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : '#CBD5E1'}`;
    hoverBg = isDark ? '#334155' : '#E2E8E4';
  } else if (variant === 'ghost') {
    bgcolor = 'transparent';
    color = isDark ? '#CBD5E1' : '#475569';
    border = 'none';
    hoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  } else if (variant === 'neutral') {
    bgcolor = isDark ? 'rgba(148, 163, 184, 0.12)' : '#F0F2F0';
    color = isDark ? '#CBD5E1' : '#475569';
    border = `1px solid ${isDark ? 'rgba(148, 163, 184, 0.25)' : '#E1E6E2'}`;
    hoverBg = isDark ? 'rgba(148, 163, 184, 0.22)' : '#E2E8E4';
  } else if (variant === 'success' || variant === 'warning' || variant === 'danger' || variant === 'info') {
    const semanticToken = FINORA_TOKENS.semantic[variant as SemanticStatusType][isDark ? 'dark' : 'light'];
    bgcolor = semanticToken.bg;
    color = semanticToken.text;
    border = `1px solid ${semanticToken.border}`;
    hoverBg = isDark ? `rgba(255, 255, 255, 0.1)` : '#FFFFFF';
  }

  return (
    <MuiButton
      type={type}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      onClick={onClick}
      className={className}
      startIcon={!loading ? effectiveStartIcon : undefined}
      endIcon={endIcon}
      sx={{
        borderRadius: `${FINORA_TOKENS.radius.inner}px`,
        textTransform: 'none',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        boxShadow: 'none',
        transition: 'all 0.15s ease',
        bgcolor,
        color,
        border,
        ...sizeStyles,
        '&:hover': {
          bgcolor: hoverBg,
          boxShadow: 'none'
        },
        '&.Mui-disabled': {
          opacity: 0.5,
          color: isDark ? '#94A3B8' : '#94A3B8'
        },
        ...sx
      }}
    >
      {loading ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
      {children}
    </MuiButton>
  );
}
