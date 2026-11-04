import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  useTheme
} from '@mui/material';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import SavingsRounded from '@mui/icons-material/SavingsRounded';
import LayersRounded from '@mui/icons-material/LayersRounded';

import { money } from '../../lib/finance';
import type { NetWorthSummary } from '../../types/smartLedger';

interface NetWorthControlHeaderProps {
  summary: NetWorthSummary;
  hideRiskyAssets: boolean;
  onToggleHideRiskyAssets: (hide: boolean) => void;
}

export function NetWorthControlHeader({
  summary,
  hideRiskyAssets,
  onToggleHideRiskyAssets
}: NetWorthControlHeaderProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      {/* 1. Header Toolbar: Mode Toggle (Toàn bộ vs Thận trọng) & Quick Stat */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.25
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              color: hideRiskyAssets ? (isDark ? '#34D399' : '#059669') : 'text.primary',
              fontWeight: 700,
              fontSize: '0.82rem'
            }}
          >
            <ShieldRounded sx={{ fontSize: 18 }} />
            <span>Chế độ tính tài sản:</span>
          </Box>

          <Box
            sx={{
              display: 'inline-flex',
              p: '2px',
              borderRadius: '6px',
              bgcolor: isDark ? '#1C2430' : '#F1F5F9',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Button
              size="small"
              onClick={() => onToggleHideRiskyAssets(false)}
              sx={{
                py: 0.25,
                px: 1.25,
                fontSize: '0.75rem',
                fontWeight: !hideRiskyAssets ? 700 : 500,
                color: !hideRiskyAssets ? (isDark ? '#F8FAFC' : '#0F172A') : 'text.secondary',
                bgcolor: !hideRiskyAssets ? (isDark ? '#2D3748' : '#FFFFFF') : 'transparent',
                borderRadius: '4px',
                boxShadow: !hideRiskyAssets ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'none',
                minWidth: 'auto',
                '&:hover': { bgcolor: !hideRiskyAssets ? (isDark ? '#374151' : '#FFFFFF') : 'action.hover' }
              }}
            >
              Toàn bộ danh mục
            </Button>
            <Button
              size="small"
              onClick={() => onToggleHideRiskyAssets(true)}
              sx={{
                py: 0.25,
                px: 1.25,
                fontSize: '0.75rem',
                fontWeight: hideRiskyAssets ? 700 : 500,
                color: hideRiskyAssets ? (isDark ? '#34D399' : '#059669') : 'text.secondary',
                bgcolor: hideRiskyAssets ? (isDark ? '#064E3B' : '#FFFFFF') : 'transparent',
                borderRadius: '4px',
                boxShadow: hideRiskyAssets ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'none',
                minWidth: 'auto',
                '&:hover': { bgcolor: hideRiskyAssets ? (isDark ? '#065F46' : '#FFFFFF') : 'action.hover' }
              }}
            >
              Thận trọng (Bảo toàn)
            </Button>
          </Box>
        </Box>

        <Chip
          size="small"
          label={`Thanh khoản ngay: ${summary.highLiquidityRatio}%`}
          sx={{
            height: 24,
            fontSize: '0.72rem',
            fontWeight: 650,
            borderRadius: '4px',
            bgcolor: isDark ? '#1E2633' : '#F8FAFC',
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider'
          }}
        />
      </Box>

      {/* 2. Four High-Contrast Metric Bento Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 1.5
        }}
      >
        {/* Card 1: Tổng Tài Sản Ròng */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#E2E8F0',
            bgcolor: isDark ? '#1E2633' : '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 0.75
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              TỔNG TÀI SẢN RÒNG
            </Typography>
            <AccountBalanceWalletRounded sx={{ fontSize: 18, color: hideRiskyAssets ? (isDark ? '#34D399' : '#059669') : '#3B82F6' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: isDark ? '#FFFFFF' : '#0F172A',
              letterSpacing: '-0.02em',
              fontFeatureSettings: '"tnum"',
              lineHeight: 1.2
            }}
          >
            {money(summary.headlineNetWorth)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            {hideRiskyAssets ? 'Chế độ thận trọng (loại rủi ro)' : 'Toàn bộ danh mục đầu tư'}
          </Typography>
        </Paper>

        {/* Card 2: Tiền Thực Có */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#E2E8F0',
            bgcolor: isDark ? '#1E2633' : '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 0.75
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              TIỀN THỰC CÓ
            </Typography>
            <SavingsRounded sx={{ fontSize: 18, color: isDark ? '#34D399' : '#059669' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: isDark ? '#34D399' : '#059669',
              letterSpacing: '-0.02em',
              fontFeatureSettings: '"tnum"',
              lineHeight: 1.2
            }}
          >
            {money(summary.cashBalance)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            Tiền mặt & số dư ngân hàng
          </Typography>
        </Paper>

        {/* Card 3: Vốn Chưa Thu Hồi */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#E2E8F0',
            bgcolor: isDark ? '#1E2633' : '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 0.75
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              VỐN CHƯA THU HỒI
            </Typography>
            <LayersRounded sx={{ fontSize: 18, color: isDark ? '#FBBF24' : '#D97706' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: isDark ? '#FBBF24' : '#D97706',
              letterSpacing: '-0.02em',
              fontFeatureSettings: '"tnum"',
              lineHeight: 1.2
            }}
          >
            {money(summary.unrecoveredCapital)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            Góp: {money(summary.totalInvestedCapital)} · Thu: {money(summary.totalRecoveredCapital)}
          </Typography>
        </Paper>

        {/* Card 4: Giá Trị Hiện Tại */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#E2E8F0',
            bgcolor: isDark ? '#1E2633' : '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 0.75
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              GIÁ TRỊ HIỆN TẠI
            </Typography>
            <TrendingUpRounded sx={{ fontSize: 18, color: isDark ? '#A78BFA' : '#7C3AED' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: isDark ? '#C4B5FD' : '#7C3AED',
              letterSpacing: '-0.02em',
              fontFeatureSettings: '"tnum"',
              lineHeight: 1.2
            }}
          >
            {money(summary.totalInvestmentValue)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: '0.72rem',
                color: summary.unrealizedPnL >= 0 ? (isDark ? '#34D399' : '#059669') : (isDark ? '#F87171' : '#DC2626')
              }}
            >
              {summary.unrealizedPnL >= 0 ? '+' : ''}{money(summary.unrealizedPnL)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              chênh lệch giá
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* 3. Streamlined Risk Breakdown Bar */}
      <Paper
        elevation={0}
        sx={{
          py: 1.25,
          px: 2,
          borderRadius: '8px',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#E2E8F0',
          bgcolor: isDark ? '#161B22' : '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.76rem', color: 'text.primary' }}>
            Cơ cấu rủi ro danh mục
          </Typography>
          {summary.riskBreakdown.high.percentage > 30 && (
            <Chip
              size="small"
              label={`Cảnh báo: Rủi ro cao chiếm ${summary.riskBreakdown.high.percentage}%`}
              sx={{
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.68rem',
                height: 18,
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                color: isDark ? '#F87171' : '#B91C1C'
              }}
            />
          )}
        </Box>

        {/* High-Contrast Progress Bar */}
        <Box
          sx={{
            display: 'flex',
            height: 8,
            borderRadius: '4px',
            overflow: 'hidden',
            bgcolor: isDark ? '#232E3D' : '#E2E8F0'
          }}
        >
          <Box sx={{ width: `${summary.riskBreakdown.safe.percentage}%`, bgcolor: '#10B981' }} />
          <Box sx={{ width: `${summary.riskBreakdown.low.percentage}%`, bgcolor: '#3B82F6' }} />
          <Box sx={{ width: `${summary.riskBreakdown.medium.percentage}%`, bgcolor: '#F59E0B' }} />
          <Box sx={{ width: `${summary.riskBreakdown.high.percentage}%`, bgcolor: '#EF4444' }} />
        </Box>

        {/* Clean Inline Legend */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            pt: 0.25
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
              An toàn: <strong style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{money(summary.riskBreakdown.safe.amount)}</strong> ({summary.riskBreakdown.safe.percentage}%)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3B82F6' }} />
            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
              Thấp: <strong style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{money(summary.riskBreakdown.low.amount)}</strong> ({summary.riskBreakdown.low.percentage}%)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
              Trung bình: <strong style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{money(summary.riskBreakdown.medium.amount)}</strong> ({summary.riskBreakdown.medium.percentage}%)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
              Cao: <strong style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{money(summary.riskBreakdown.high.amount)}</strong> ({summary.riskBreakdown.high.percentage}%)
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
