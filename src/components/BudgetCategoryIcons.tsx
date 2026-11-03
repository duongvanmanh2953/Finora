import React from 'react';
import { Box, Tooltip } from '@mui/material';
import RestaurantRounded from '@mui/icons-material/RestaurantRounded';
import DirectionsCarRounded from '@mui/icons-material/DirectionsCarRounded';
import HomeWorkRounded from '@mui/icons-material/HomeWorkRounded';
import ShoppingBagRounded from '@mui/icons-material/ShoppingBagRounded';
import SportsEsportsRounded from '@mui/icons-material/SportsEsportsRounded';
import FitnessCenterRounded from '@mui/icons-material/FitnessCenterRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import FlightRounded from '@mui/icons-material/FlightRounded';

export interface CategoryIconMeta {
  id: string;
  name: string;
  icon: React.ComponentType<{ sx?: any }>;
  color: string;
  bg: string;
}

export const BUDGET_CATEGORY_CONFIG: Record<string, CategoryIconMeta> = {
  food: {
    id: 'food',
    name: 'Ăn uống',
    icon: RestaurantRounded,
    color: '#F97316', // Warm Orange
    bg: 'rgba(249, 115, 22, 0.12)'
  },
  transport: {
    id: 'transport',
    name: 'Di chuyển / Xăng xe',
    icon: DirectionsCarRounded,
    color: '#2563EB', // Blue
    bg: 'rgba(37, 99, 235, 0.12)'
  },
  housing: {
    id: 'housing',
    name: 'Nhà cửa / Hóa đơn',
    icon: HomeWorkRounded,
    color: '#6366F1', // Indigo
    bg: 'rgba(99, 102, 241, 0.12)'
  },
  bills: {
    id: 'bills',
    name: 'Hóa đơn & Tiện ích',
    icon: HomeWorkRounded,
    color: '#6366F1', // Indigo
    bg: 'rgba(99, 102, 241, 0.12)'
  },
  shopping: {
    id: 'shopping',
    name: 'Mua sắm',
    icon: ShoppingBagRounded,
    color: '#EC4899', // Pink / Rose
    bg: 'rgba(236, 72, 153, 0.12)'
  },
  entertainment: {
    id: 'entertainment',
    name: 'Giải trí / Cá nhân',
    icon: SportsEsportsRounded,
    color: '#8B5CF6', // Purple
    bg: 'rgba(139, 92, 246, 0.12)'
  },
  health: {
    id: 'health',
    name: 'Sức khỏe / Thể thao',
    icon: FitnessCenterRounded,
    color: '#10B981', // Green
    bg: 'rgba(16, 185, 129, 0.12)'
  },
  invest: {
    id: 'invest',
    name: 'Đầu tư / Tích lũy',
    icon: TrendingUpRounded,
    color: '#0D9488', // Teal
    bg: 'rgba(13, 148, 136, 0.12)'
  },
  education: {
    id: 'education',
    name: 'Học tập / Phát triển',
    icon: SchoolRounded,
    color: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.12)'
  },
  travel: {
    id: 'travel',
    name: 'Du lịch / Nghỉ dưỡng',
    icon: FlightRounded,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)'
  }
};

export function getCategoryMeta(keyOrName?: string): CategoryIconMeta {
  if (!keyOrName) {
    return {
      id: 'other',
      name: 'Khác',
      icon: CategoryRounded,
      color: '#64748B',
      bg: 'rgba(100, 116, 139, 0.12)'
    };
  }

  const normalized = keyOrName.toLowerCase().trim();

  // 1. Direct ID match
  if (BUDGET_CATEGORY_CONFIG[normalized]) {
    return BUDGET_CATEGORY_CONFIG[normalized];
  }

  // 2. Keyword heuristic match
  if (normalized.includes('ăn') || normalized.includes('uống') || normalized.includes('food') || normalized.includes('cà phê') || normalized.includes('cafe')) {
    return BUDGET_CATEGORY_CONFIG.food;
  }
  if (normalized.includes('xe') || normalized.includes('xăng') || normalized.includes('di chuyển') || normalized.includes('grab') || normalized.includes('transport')) {
    return BUDGET_CATEGORY_CONFIG.transport;
  }
  if (normalized.includes('nhà') || normalized.includes('phòng') || normalized.includes('điện') || normalized.includes('nước') || normalized.includes('hóa đơn') || normalized.includes('bills')) {
    return BUDGET_CATEGORY_CONFIG.housing;
  }
  if (normalized.includes('mua') || normalized.includes('sắm') || normalized.includes('shop') || normalized.includes('quần áo')) {
    return BUDGET_CATEGORY_CONFIG.shopping;
  }
  if (normalized.includes('chơi') || normalized.includes('giải trí') || normalized.includes('phim') || normalized.includes('game')) {
    return BUDGET_CATEGORY_CONFIG.entertainment;
  }
  if (normalized.includes('thuốc') || normalized.includes('khám') || normalized.includes('sức khỏe') || normalized.includes('gym') || normalized.includes('thể thao')) {
    return BUDGET_CATEGORY_CONFIG.health;
  }
  if (normalized.includes('đầu tư') || normalized.includes('chứng khoán') || normalized.includes('cổ phiếu') || normalized.includes('quỹ') || normalized.includes('tích lũy')) {
    return BUDGET_CATEGORY_CONFIG.invest;
  }

  return {
    id: 'other',
    name: keyOrName,
    icon: CategoryRounded,
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.12)'
  };
}

export interface BudgetCategoryBadgeProps {
  categoryKey?: string;
  name?: string;
  size?: number;
  showLabel?: boolean;
}

/**
 * 36x36px square badge (borderRadius: '4px') using 12% opacity background matching category primary color
 */
export function BudgetCategoryBadge({
  categoryKey,
  name,
  size = 36,
  showLabel = false
}: BudgetCategoryBadgeProps) {
  const meta = getCategoryMeta(categoryKey || name);
  const IconComponent = meta.icon;
  const iconSize = Math.round(size * 0.55);

  const badgeElement = (
    <Box
      sx={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '4px', // Strictly 4px inner element
        backgroundColor: meta.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: meta.color,
        transition: 'transform 0.15s ease, background-color 0.15s ease',
        flexShrink: 0
      }}
    >
      <IconComponent sx={{ fontSize: iconSize }} />
    </Box>
  );

  if (!showLabel) {
    return (
      <Tooltip title={name || meta.name} arrow>
        {badgeElement}
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {badgeElement}
      <Box sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}>
        {name || meta.name}
      </Box>
    </Box>
  );
}
