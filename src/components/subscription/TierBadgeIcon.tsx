import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { Crown, Gem, Flame, ShieldCheck } from 'lucide-react';
import type { PlanTier } from '../../types';

export type TierIconType = 'gold' | 'pro' | 'elite' | 'free';

export interface TierConfig {
  id: TierIconType;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
  color: string;
  gradient: string;
  bgLight: string;
  border: string;
  glow: string;
  desc: string;
}

export const TIER_THEMES: Record<TierIconType, TierConfig> = {
  gold: {
    id: 'gold',
    name: 'VIP Gold Hoàng Gia',
    shortName: 'VIP Gold',
    icon: Crown,
    color: '#DFBA73',
    gradient: 'linear-gradient(135deg, #DFBA73 0%, #C5A059 100%)',
    bgLight: 'rgba(223, 186, 115, 0.15)',
    border: 'rgba(223, 186, 115, 0.6)',
    glow: 'drop-shadow(0 0 6px rgba(223, 186, 115, 0.65))',
    desc: 'Vương miện Vàng Hoàng Gia — Biểu trưng cho sự thịnh vượng và đặc quyền tối thượng.'
  },
  pro: {
    id: 'pro',
    name: 'Wealth Pro Quyền Lực',
    shortName: 'Pro Tím',
    icon: Gem,
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    bgLight: 'rgba(139, 92, 246, 0.16)',
    border: 'rgba(139, 92, 246, 0.6)',
    glow: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.65))',
    desc: 'Đá Quý Tím Quyền Lực — Biểu trưng cho vương quyền và sức mạnh bứt phá tài chính.'
  },
  elite: {
    id: 'elite',
    name: 'Elite Hỏa Quyền',
    shortName: 'Hỏa Long',
    icon: Flame,
    color: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    bgLight: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.6)',
    glow: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.65))',
    desc: 'Ngọn Lửa Hỏa Long Đỏ — Biểu trưng cho tốc độ tăng trưởng phi mã và sức mạnh dẫn dắt.'
  },
  free: {
    id: 'free',
    name: 'Khởi Đầu Bạc An Toàn',
    shortName: 'Free Bạc',
    icon: ShieldCheck,
    color: '#94A3B8',
    gradient: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
    bgLight: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.35)',
    glow: 'none',
    desc: 'Lá Chắn Bạc — Bảo vệ an toàn dòng tiền với các tiện ích cơ bản trọn đời.'
  }
};

export function getTierFromPlan(plan?: PlanTier | string, isTrial = false): TierConfig {
  if (isTrial || plan === 'gold') return TIER_THEMES.gold;
  if (plan === 'pro') return TIER_THEMES.pro;
  if (plan === 'elite' || plan === 'enterprise') return TIER_THEMES.elite;
  return TIER_THEMES.free;
}

interface TierBadgeIconProps {
  tier?: PlanTier | string;
  isTrial?: boolean;
  size?: number; // size of container
  iconSize?: number; // size of icon
  showTooltip?: boolean;
  pulseGlow?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function TierBadgeIcon({
  tier = 'free',
  isTrial = false,
  size = 34,
  iconSize = 18,
  showTooltip = true,
  pulseGlow = true,
  interactive = false,
  onClick,
  style
}: TierBadgeIconProps) {
  const config = getTierFromPlan(tier, isTrial);
  const IconComponent = config.icon;

  const badgeContent = (
    <Box
      onClick={onClick}
      sx={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: size <= 28 ? '6px' : '8px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: config.bgLight,
        border: `1.5px solid ${config.border}`,
        cursor: interactive || onClick ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        boxShadow: pulseGlow && config.id !== 'free'
          ? `0 2px 10px ${config.bgLight}`
          : 'none',
        '&:hover': interactive || onClick ? {
          transform: 'translateY(-1px) scale(1.04)',
          borderColor: config.color,
          boxShadow: `0 4px 14px ${config.bgLight}`
        } : undefined,
        ...style
      }}
    >
      <IconComponent
        size={iconSize}
        color={config.color}
        style={{
          filter: config.glow,
          transition: 'transform 0.2s ease'
        }}
      />
    </Box>
  );

  if (!showTooltip) return badgeContent;

  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Box sx={{ fontWeight: 800, fontSize: 12, color: config.color, mb: 0.25 }}>
            {config.name}
          </Box>
          <Box sx={{ fontSize: 11, color: '#E2E8F0' }}>
            {config.desc}
          </Box>
        </Box>
      }
      arrow
    >
      {badgeContent}
    </Tooltip>
  );
}

