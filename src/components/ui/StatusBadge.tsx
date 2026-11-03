import type { ReactNode } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { FINORA_TOKENS, resolveFinoraStatus, type SemanticStatusType } from '../../theme/designTokens';

export type StatusBadgeVariant = 'filled' | 'soft' | 'outline' | 'dot';

export interface StatusBadgeProps {
  label: string;
  status?: SemanticStatusType | string;
  variant?: StatusBadgeVariant;
  icon?: ReactNode;
  size?: 'small' | 'medium';
  className?: string;
}

export function StatusBadge({
  label,
  status = 'neutral',
  variant = 'soft',
  icon,
  size = 'small',
  className
}: StatusBadgeProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Automatically map string domain status if needed
  const semanticType: SemanticStatusType =
    status === 'success' || status === 'warning' || status === 'danger' || status === 'info' || status === 'neutral'
      ? status
      : resolveFinoraStatus(status);

  const token = FINORA_TOKENS.semantic[semanticType][isDark ? 'dark' : 'light'];

  const isSmall = size === 'small';
  const py = isSmall ? '3px' : '5px';
  const px = isSmall ? '8px' : '12px';
  const fontSize = isSmall ? '0.72rem' : '0.8rem';
  const dotSize = isSmall ? 6 : 8;

  let bg = token.bg;
  let text = token.text;
  let border = token.border;

  if (variant === 'filled') {
    bg = semanticType === 'neutral' ? (isDark ? '#475569' : '#64748B') : token.text;
    text = '#FFFFFF';
    border = 'transparent';
  } else if (variant === 'outline') {
    bg = 'transparent';
    border = token.border;
    text = token.text;
  } else if (variant === 'dot') {
    bg = 'transparent';
    border = 'transparent';
    text = isDark ? '#E2E8F0' : '#1E293B';
  }

  return (
    <Box
      component="span"
      className={className}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        px,
        py,
        borderRadius: `${FINORA_TOKENS.radius.inner}px`,
        bgcolor: bg,
        color: text,
        border: border !== 'transparent' ? `1px solid ${border}` : 'none',
        fontWeight: 700,
        fontSize,
        lineHeight: 1.2,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        transition: 'all 0.15s ease'
      }}
    >
      {variant === 'dot' && (
        <Box
          component="span"
          sx={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            bgcolor: token.text,
            flexShrink: 0
          }}
        />
      )}
      {icon && (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', fontSize: '1.1em' }}>
          {icon}
        </Box>
      )}
      <Typography
        component="span"
        sx={{
          fontSize: 'inherit',
          fontWeight: 'inherit',
          color: 'inherit',
          lineHeight: 'inherit'
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

