import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip
} from '@mui/material';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import SavingsRounded from '@mui/icons-material/SavingsRounded';
import LayersRounded from '@mui/icons-material/LayersRounded';
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded';

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
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 1. Master Control Bar: Dual Modes (Đầy đủ vs Thận trọng) */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: '6px',
          border: '1px solid',
          borderColor: hideRiskyAssets ? 'rgba(16, 185, 129, 0.4)' : 'divider',
          bgcolor: hideRiskyAssets ? 'rgba(16, 185, 129, 0.04)' : 'background.paper',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          transition: 'all 0.2s ease'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '4px',
              bgcolor: hideRiskyAssets ? 'rgba(16, 185, 129, 0.15)' : 'action.hover',
              color: hideRiskyAssets ? '#059669' : 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {hideRiskyAssets ? (
              <ShieldRounded sx={{ fontSize: 22 }} />
            ) : (
              <LayersRounded sx={{ fontSize: 22 }} />
            )}
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Chế độ Thống kê Tổng Tài sản
              </Typography>
              {hideRiskyAssets ? (
                <Chip
                  size="small"
                  label="Chế độ 2: Thận trọng (An toàn)"
                  sx={{
                    borderRadius: '4px',
                    fontWeight: 750,
                    fontSize: '0.72rem',
                    height: 22,
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#059669',
                    border: '1px solid #059669'
                  }}
                />
              ) : (
                <Chip
                  size="small"
                  label="Chế độ 1: Đầy đủ (Toàn bộ tài sản)"
                  sx={{
                    borderRadius: '4px',
                    fontWeight: 650,
                    fontSize: '0.72rem',
                    height: 22,
                    bgcolor: 'action.hover',
                    color: 'text.secondary'
                  }}
                />
              )}
              <Tooltip title="Chế độ Thận trọng sẽ loại trừ các tài sản rủi ro cao (Crypto, Start-up, P2P, Trade ngắn hạn) và các khoản đang bị nghi ngờ rủi ro mất vốn để tránh ảo tưởng sức mạnh tài chính.">
                <HelpOutlineRounded sx={{ fontSize: 16, color: 'text.secondary', cursor: 'pointer' }} />
              </Tooltip>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {hideRiskyAssets
                ? 'Đang loại trừ các khoản rủi ro cao và nghi ngờ mất vốn. Chỉ tính tiền mặt và tài sản an toàn/cố định.'
                : 'Đang tổng hợp tất cả các nguồn vốn và giá trị tài sản đầu tư đã kích hoạt tính vào Net Worth.'}
            </Typography>
          </Box>
        </Box>

        {/* Master Switch */}
        <FormControlLabel
          control={
            <Switch
              checked={hideRiskyAssets}
              onChange={e => onToggleHideRiskyAssets(e.target.checked)}
              color="success"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 750, color: hideRiskyAssets ? '#059669' : 'text.primary' }}>
              Bật chế độ Thận trọng
            </Typography>
          }
          sx={{ mr: 0 }}
        />
      </Paper>

      {/* 2. Four High-Contrast Metric Bento Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2
        }}
      >
        {/* Card 1: Tổng Tài Sản Ròng (Headline Net Worth) */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '6px',
            border: '1px solid',
            borderColor: hideRiskyAssets ? 'rgba(16, 185, 129, 0.4)' : '#2563EB44',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.75rem' }}>
              TỔNG TÀI SẢN RÒNG (NET WORTH)
            </Typography>
            <AccountBalanceWalletRounded sx={{ fontSize: 18, color: hideRiskyAssets ? '#059669' : '#2563EB' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: hideRiskyAssets ? '#059669' : 'text.primary',
              letterSpacing: '-0.02em'
            }}
          >
            {money(summary.headlineNetWorth)}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              {hideRiskyAssets ? 'Theo chế độ thận trọng' : 'Theo chế độ đầy đủ'}
            </Typography>
            <Chip
              size="small"
              label={`Thanh khoản cao: ${summary.highLiquidityRatio}%`}
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, borderRadius: '4px' }}
            />
          </Box>
        </Paper>

        {/* Card 2: Tiền Thực Có (Tiền mặt & Ngân hàng) */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '6px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.75rem' }}>
              TIỀN THỰC CÓ (SỬ DỤNG NGAY)
            </Typography>
            <SavingsRounded sx={{ fontSize: 18, color: '#10B981' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {money(summary.cashBalance)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            Tiền mặt, số dư tài khoản ngân hàng & ví điện tử
          </Typography>
        </Paper>

        {/* Card 3: Vốn Chưa Thu Hồi */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '6px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.75rem' }}>
              VỐN ĐẦU TƯ CHƯA THU HỒI
            </Typography>
            <LayersRounded sx={{ fontSize: 18, color: '#D97706' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#D97706', letterSpacing: '-0.02em' }}>
            {money(summary.unrecoveredCapital)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            Đã góp {money(summary.totalInvestedCapital)} · Đã thu hồi {money(summary.totalRecoveredCapital)}
          </Typography>
        </Paper>

        {/* Card 4: Giá Trị Đầu Tư Ước Tính Hiện Tại */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '6px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.75rem' }}>
              GIÁ TRỊ ĐẦU TƯ ƯỚC TÍNH
            </Typography>
            <TrendingUpRounded sx={{ fontSize: 18, color: '#7C3AED' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#7C3AED', letterSpacing: '-0.02em' }}>
            {money(summary.totalInvestmentValue)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 750,
                fontSize: '0.72rem',
                color: summary.unrealizedPnL >= 0 ? '#10B981' : '#EF4444'
              }}
            >
              {summary.unrealizedPnL >= 0 ? '+' : ''}{money(summary.unrealizedPnL)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              tạm tính so với vốn
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* 3. Risk Breakdown Bar (4 Mức độ rủi ro: An toàn, Thấp, Trung bình, Cao) */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: '6px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
            CƠ CẤU RỦI RO TÀI SẢN (4 CẤP ĐỘ FINTECH)
          </Typography>
          {summary.riskBreakdown.high.percentage > 30 && (
            <Chip
              size="small"
              label={`Cảnh báo: Rủi ro cao chiếm ${summary.riskBreakdown.high.percentage}% (> 30%)`}
              sx={{
                borderRadius: '4px',
                fontWeight: 750,
                fontSize: '0.7rem',
                height: 20,
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                color: '#EF4444'
              }}
            />
          )}
        </Box>

        {/* Visual Progress Bar */}
        <Box
          sx={{
            display: 'flex',
            height: 10,
            borderRadius: '4px',
            overflow: 'hidden',
            bgcolor: 'action.hover'
          }}
        >
          <Box sx={{ width: `${summary.riskBreakdown.safe.percentage}%`, bgcolor: '#10B981' }} />
          <Box sx={{ width: `${summary.riskBreakdown.low.percentage}%`, bgcolor: '#3B82F6' }} />
          <Box sx={{ width: `${summary.riskBreakdown.medium.percentage}%`, bgcolor: '#F59E0B' }} />
          <Box sx={{ width: `${summary.riskBreakdown.high.percentage}%`, bgcolor: '#EF4444' }} />
        </Box>

        {/* Legend */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 1.5,
            pt: 0.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                An toàn ({summary.riskBreakdown.safe.percentage}%)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {money(summary.riskBreakdown.safe.amount)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3B82F6' }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                Rủi ro thấp ({summary.riskBreakdown.low.percentage}%)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {money(summary.riskBreakdown.low.amount)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                Rủi ro trung bình ({summary.riskBreakdown.medium.percentage}%)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {money(summary.riskBreakdown.medium.amount)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                Rủi ro cao ({summary.riskBreakdown.high.percentage}%)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {money(summary.riskBreakdown.high.amount)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
