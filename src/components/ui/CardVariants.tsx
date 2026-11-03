import type { ReactNode } from 'react';
import { Box, Card, Typography, useTheme } from '@mui/material';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import { FINORA_TOKENS } from '../../theme/designTokens';
import { StatusBadge } from './StatusBadge';

export type ModuleColorKey =
  | 'income'
  | 'expense'
  | 'investments'
  | 'budgets'
  | 'savings'
  | 'accounts'
  | 'debts'
  | 'reports'
  | 'admin';

/**
 * Colored Icon Container
 * Wraps icons in a high-recognition 36x36px badge with semantic soft background
 */
export function IconContainer({
  icon,
  module = 'admin',
  size = 36,
  sx
}: {
  icon: ReactNode;
  module?: ModuleColorKey;
  size?: number;
  sx?: any;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const mod = FINORA_TOKENS.moduleIdentity[module] || FINORA_TOKENS.moduleIdentity.admin;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: `${FINORA_TOKENS.radius.inner}px`,
        bgcolor: isDark ? mod.bgDark : mod.bgLight,
        color: mod.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...sx
      }}
    >
      {icon}
    </Box>
  );
}

/**
 * Base Card
 * Master container with strict 6px radius, clear boundary, and subtle hover only when interactive
 */
export function BaseCard({
  children,
  interactive = false,
  onClick,
  variant = 'default',
  sx,
  className
}: {
  children: ReactNode;
  interactive?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'soft' | 'highlight' | 'status';
  sx?: any;
  className?: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const surface = FINORA_TOKENS.surfaces[isDark ? 'dark' : 'light'];

  let bgcolor = surface.cardDefault;
  let borderColor = surface.border;

  if (variant === 'soft') {
    bgcolor = surface.secondary;
  } else if (variant === 'highlight') {
    bgcolor = isDark ? '#16222F' : '#F0F9F5';
    borderColor = isDark ? 'rgba(16, 185, 129, 0.3)' : '#BFE5CD';
  }

  return (
    <Card
      elevation={0}
      onClick={onClick}
      className={className}
      sx={{
        borderRadius: `${FINORA_TOKENS.radius.outer}px`,
        bgcolor,
        border: '1px solid',
        borderColor,
        p: 2.5,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'all 0.18s ease',
        ...(interactive && {
          '&:hover': {
            borderColor: isDark ? surface.borderStrong : '#94A3B8',
            transform: 'translateY(-1px)',
            boxShadow: isDark
              ? '0 6px 16px rgba(0, 0, 0, 0.45)'
              : '0 6px 16px rgba(23, 107, 82, 0.08)'
          }
        }),
        ...sx
      }}
    >
      {children}
    </Card>
  );
}

/**
 * Metric Card
 * Structured fintech card for financial amounts, trend % and comparisons
 */
export function MetricCard({
  title,
  value,
  secondary,
  trend,
  trendPeriod,
  icon,
  module = 'admin',
  status,
  statusLabel,
  action,
  interactive = false,
  onClick
}: {
  title: string;
  value: ReactNode;
  secondary?: string;
  trend?: number; // e.g. +12.5 or -5.2
  trendPeriod?: string;
  icon?: ReactNode;
  module?: ModuleColorKey;
  status?: string;
  statusLabel?: string;
  action?: ReactNode;
  interactive?: boolean;
  onClick?: () => void;
}) {
  return (
    <BaseCard interactive={interactive} onClick={onClick}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {icon && <IconContainer icon={icon} module={module} size={34} />}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 750,
                color: 'text.secondary',
                fontSize: 11.5,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {title}
            </Typography>
            {statusLabel && (
              <Box sx={{ mt: 0.25 }}>
                <StatusBadge label={statusLabel} status={status || 'neutral'} size="small" />
              </Box>
            )}
          </Box>
        </Box>
        {action}
      </Box>

      {/* Main Metric Value */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 850,
          letterSpacing: '-0.025em',
          color: 'text.primary',
          fontFeatureSettings: '"tnum"',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.2,
          my: 0.5
        }}
      >
        {value}
      </Typography>

      {/* Footer Trend & Meta */}
      {(trend !== undefined || secondary) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {trend !== undefined && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: 11,
                fontWeight: 800,
                color: trend >= 0 ? '#10B981' : '#EF4444'
              }}
            >
              {trend >= 0 ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
              <span>{trend > 0 ? `+${trend}%` : `${trend}%`}</span>
            </Box>
          )}
          {trendPeriod && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
              {trendPeriod}
            </Typography>
          )}
          {secondary && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
              {secondary}
            </Typography>
          )}
        </Box>
      )}
    </BaseCard>
  );
}

/**
 * Admin Metric Card
 * High-density SaaS metric card with target benchmarks and healthy status
 */
export function AdminMetricCard({
  title,
  value,
  subtitle,
  badgeText,
  badgeStatus = 'success',
  icon,
  module = 'admin'
}: {
  title: string;
  value: ReactNode;
  subtitle?: string;
  badgeText?: string;
  badgeStatus?: string;
  icon?: ReactNode;
  module?: ModuleColorKey;
}) {
  return (
    <BaseCard>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary', fontSize: 11.5 }}>
          {title}
        </Typography>
        {icon && <IconContainer icon={icon} module={module} size={28} />}
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em', mb: 0.5 }}>
        {value}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
            {subtitle}
          </Typography>
        )}
        {badgeText && <StatusBadge label={badgeText} status={badgeStatus} size="small" />}
      </Box>
    </BaseCard>
  );
}

