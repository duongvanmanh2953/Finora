import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Tooltip
} from '@mui/material';
import LayoutGridRounded from '@mui/icons-material/GridViewRounded';
import ListRounded from '@mui/icons-material/FormatListBulletedRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRounded from '@mui/icons-material/TrendingDownRounded';
import TollRounded from '@mui/icons-material/TollRounded';
import SavingsRounded from '@mui/icons-material/SavingsRounded';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import SyncRounded from '@mui/icons-material/SyncRounded';

import { useFinance } from '../../store';
import { money, todayKey } from '../../lib/finance';
import {
  calculateAccruedInterest,
  VN_GOLD_PRICES
} from '../../lib/investmentCalculator';

import type { InvestmentAsset } from '../../types';

interface UnifiedPortfolioDashboardProps {
  onOpenSettings?: () => void;
  onOpenAddModal?: () => void;
  onOpenOrderModal?: (asset: InvestmentAsset) => void;
}

export function UnifiedPortfolioDashboard({
  onOpenSettings,
  onOpenOrderModal
}: UnifiedPortfolioDashboardProps) {
  const { data, update } = useFinance();

  // View state: 'grid' vs 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Strategy filter: 'ALL' | 'DCA' | 'TRADE' | 'SAFE'
  const [strategyFilter, setStrategyFilter] = useState<'ALL' | 'DCA' | 'TRADE' | 'SAFE'>('ALL');

  // Asset class filter: 'ALL' | 'STOCK' | 'FUND' | 'GOLD' | 'SAVINGS' | 'BOND'
  const [assetClassFilter, setAssetClassFilter] = useState<string>('ALL');

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const rawInvestments = data?.investments || [];

  // 1. Process & Normalize Assets with Auto-Accrued Interest and Gold Buy Prices
  const enrichedAssets = useMemo(() => {
    const today = todayKey();

    return rawInvestments.map(asset => {
      let currentVal = (asset.quantity || 0) * (asset.currentUnitPrice || 0);
      let accrued = asset.accruedInterest || 0;

      // Auto Accrued Interest for Bank Savings or Bonds
      if (asset.annualYieldRate && asset.startDate) {
        const accruedObj = calculateAccruedInterest(
          asset.totalCostBasis || 0,
          asset.annualYieldRate,
          asset.startDate,
          today
        );
        accrued = accruedObj.accruedInterest;
        currentVal = (asset.totalCostBasis || 0) + accrued;
      }

      // Valuation for Gold based on shop BUY price (tiệm mua vào)
      const isGold =
        asset.name.toLowerCase().includes('vàng') ||
        asset.symbol.toLowerCase().includes('sjc') ||
        asset.symbol.toLowerCase().includes('9999');
      if (isGold) {
        const isSjc = asset.symbol.toLowerCase().includes('sjc') || asset.name.toLowerCase().includes('sjc');
        const goldInfo = isSjc ? VN_GOLD_PRICES[0] : VN_GOLD_PRICES[1];
        const unitIsChi = asset.unit?.toLowerCase().includes('chỉ');
        const buyPricePerUnit = unitIsChi ? Math.round(goldInfo.buyPrice / 10) : goldInfo.buyPrice;
        currentVal = (asset.quantity || 0) * buyPricePerUnit;
      }

      const pnl = currentVal - (asset.totalCostBasis || 0);
      const pnlPercent =
        asset.totalCostBasis && asset.totalCostBasis > 0 ? (pnl / asset.totalCostBasis) * 100 : 0;

      return {
        ...asset,
        calculatedCurrentValue: currentVal,
        calculatedPnL: pnl,
        calculatedPnLPercent: pnlPercent,
        calculatedAccruedInterest: accrued,
        isGold
      };
    });
  }, [rawInvestments]);

  // 2. Filter Assets
  const filteredAssets = useMemo(() => {
    return enrichedAssets.filter(asset => {
      // Strategy filter
      if (strategyFilter === 'DCA') {
        if (asset.strategy_type !== 'DCA') return false;
      } else if (strategyFilter === 'TRADE') {
        if (asset.strategy_type !== 'TRADE') return false;
      } else if (strategyFilter === 'SAFE') {
        const isSafe =
          asset.isGold ||
          asset.assetClass === 'bond' ||
          Boolean(asset.annualYieldRate) ||
          asset.name.toLowerCase().includes('tiết kiệm') ||
          asset.name.toLowerCase().includes('sổ');
        if (!isSafe) return false;
      }

      // Asset Class filter
      if (assetClassFilter !== 'ALL') {
        if (assetClassFilter === 'STOCK' && asset.assetClass !== 'stock') return false;
        if (assetClassFilter === 'FUND' && asset.assetClass !== 'fund') return false;
        if (assetClassFilter === 'BOND' && asset.assetClass !== 'bond') return false;
        if (assetClassFilter === 'GOLD' && !asset.isGold) return false;
        if (assetClassFilter === 'SAVINGS' && !asset.annualYieldRate) return false;
      }

      return true;
    });
  }, [enrichedAssets, strategyFilter, assetClassFilter]);

  // 3. Paginated Subset
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const paginatedAssets = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return filteredAssets.slice(startIdx, startIdx + pageSize);
  }, [filteredAssets, page, pageSize]);

  // 4. Executive Metrics
  const metrics = useMemo(() => {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalDailyAccrued = 0;

    enrichedAssets.forEach(a => {
      totalInvested += a.totalCostBasis || 0;
      totalCurrentValue += a.calculatedCurrentValue || 0;
      totalDailyAccrued += a.calculatedAccruedInterest || 0;
    });

    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalPnL,
      totalPnLPercent,
      totalDailyAccrued
    };
  }, [enrichedAssets]);

  // Delete an asset holding
  const handleDeleteAsset = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài sản "${name}" khỏi danh mục?`)) return;
    await update(d => ({
      ...d,
      investments: (d.investments || []).filter(item => item.id !== id)
    }), `Đã xóa tài sản ${name}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 1. Executive NAV Summary Bento (4-column Responsive Grid via Box) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2
        }}
      >
        {/* Total NAV */}
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
            gap: 0.5
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.78rem' }}>
            TỔNG GIÁ TRỊ TÀI SẢN (NAV)
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {money(metrics.totalCurrentValue)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            {enrichedAssets.length} mã trong danh mục
          </Typography>
        </Paper>

        {/* Total Invested Basis */}
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
            gap: 0.5
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.78rem' }}>
            TỔNG VỐN ĐẦU TƯ
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {money(metrics.totalInvested)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Giá vốn bình quân thực tế
          </Typography>
        </Paper>

        {/* Total Unrealized P&L */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '6px',
            border: '1px solid',
            borderColor: metrics.totalPnL >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            bgcolor: metrics.totalPnL >= 0 ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.78rem' }}>
              LÃI / LỖ CHƯA CHỐT
            </Typography>
            {metrics.totalPnL >= 0 ? (
              <TrendingUpRounded sx={{ fontSize: 18, color: '#10B981' }} />
            ) : (
              <TrendingDownRounded sx={{ fontSize: 18, color: '#EF4444' }} />
            )}
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: metrics.totalPnL >= 0 ? '#10B981' : '#EF4444',
              letterSpacing: '-0.02em'
            }}
          >
            {metrics.totalPnL >= 0 ? '+' : ''}
            {money(metrics.totalPnL)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: metrics.totalPnL >= 0 ? '#10B981' : '#EF4444',
              fontWeight: 750,
              fontSize: '0.75rem'
            }}
          >
            {metrics.totalPnLPercent >= 0 ? '+' : ''}
            {metrics.totalPnLPercent.toFixed(2)}% so với vốn
          </Typography>
        </Paper>

        {/* Daily Accrued Interest (Zero-effort feature) */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '6px',
            border: '1px solid',
            borderColor: 'rgba(217, 119, 6, 0.3)',
            bgcolor: 'rgba(217, 119, 6, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 750, fontSize: '0.78rem' }}>
              LÃI TÍCH LŨY TỰ ĐỘNG
            </Typography>
            <SavingsRounded sx={{ fontSize: 18, color: '#D97706' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706', letterSpacing: '-0.02em' }}>
            +{money(metrics.totalDailyAccrued)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Tiết kiệm & Trái phiếu tự sinh lãi
          </Typography>
        </Paper>
      </Box>

      {/* 2. Control Toolbar: Strategy Filter Tabs, Asset Filter Pills & View Switcher */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: '6px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {/* Strategy Tabs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <Chip
              label="Tất cả tài sản"
              clickable
              size="small"
              onClick={() => {
                setStrategyFilter('ALL');
                setPage(1);
              }}
              sx={{
                borderRadius: '4px',
                fontWeight: 750,
                fontSize: '0.78rem',
                bgcolor: strategyFilter === 'ALL' ? '#2563EB' : 'action.hover',
                color: strategyFilter === 'ALL' ? '#FFFFFF' : 'text.primary',
                '&:hover': { bgcolor: strategyFilter === 'ALL' ? '#1D4ED8' : 'action.selected' }
              }}
            />
            <Chip
              label="🌱 Tích sản DCA"
              clickable
              size="small"
              onClick={() => {
                setStrategyFilter('DCA');
                setPage(1);
              }}
              sx={{
                borderRadius: '4px',
                fontWeight: 750,
                fontSize: '0.78rem',
                bgcolor: strategyFilter === 'DCA' ? 'rgba(16, 185, 129, 0.2)' : 'action.hover',
                color: strategyFilter === 'DCA' ? '#059669' : 'text.primary',
                border: strategyFilter === 'DCA' ? '1px solid #059669' : '1px solid transparent',
                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.25)' }
              }}
            />
            <Chip
              label="⚡ Danh mục Trade"
              clickable
              size="small"
              onClick={() => {
                setStrategyFilter('TRADE');
                setPage(1);
              }}
              sx={{
                borderRadius: '4px',
                fontWeight: 750,
                fontSize: '0.78rem',
                bgcolor: strategyFilter === 'TRADE' ? 'rgba(239, 68, 68, 0.2)' : 'action.hover',
                color: strategyFilter === 'TRADE' ? '#DC2626' : 'text.primary',
                border: strategyFilter === 'TRADE' ? '1px solid #DC2626' : '1px solid transparent',
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.25)' }
              }}
            />
            <Chip
              icon={<ShieldRounded style={{ fontSize: 15 }} />}
              label="🛡️ Tài sản An toàn"
              clickable
              size="small"
              onClick={() => {
                setStrategyFilter('SAFE');
                setPage(1);
              }}
              sx={{
                borderRadius: '4px',
                fontWeight: 750,
                fontSize: '0.78rem',
                bgcolor: strategyFilter === 'SAFE' ? 'rgba(217, 119, 6, 0.2)' : 'action.hover',
                color: strategyFilter === 'SAFE' ? '#D97706' : 'text.primary',
                border: strategyFilter === 'SAFE' ? '1px solid #D97706' : '1px solid transparent',
                '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.25)' }
              }}
            />
          </Box>

          {/* View Mode Toggle & Config Action */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: 'divider',
                p: '2px',
                bgcolor: 'action.hover'
              }}
            >
              <Tooltip title="Chế độ Ô lưới (Bento Grid)">
                <IconButton
                  size="small"
                  onClick={() => setViewMode('grid')}
                  sx={{
                    borderRadius: '4px',
                    p: 0.5,
                    bgcolor: viewMode === 'grid' ? 'background.paper' : 'transparent',
                    color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                    boxShadow: viewMode === 'grid' ? 1 : 0
                  }}
                >
                  <LayoutGridRounded sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chế độ Danh sách (Table View)">
                <IconButton
                  size="small"
                  onClick={() => setViewMode('table')}
                  sx={{
                    borderRadius: '4px',
                    p: 0.5,
                    bgcolor: viewMode === 'table' ? 'background.paper' : 'transparent',
                    color: viewMode === 'table' ? 'primary.main' : 'text.secondary',
                    boxShadow: viewMode === 'table' ? 1 : 0
                  }}
                >
                  <ListRounded sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>

            {onOpenSettings && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SyncRounded sx={{ fontSize: 16 }} />}
                onClick={onOpenSettings}
                sx={{
                  borderRadius: '4px',
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '0.78rem',
                  py: 0.5,
                  px: 1.25
                }}
              >
                Nguồn MCP / Broker
              </Button>
            )}
          </Box>
        </Box>

        {/* Secondary Category Filter Chips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, mr: 0.5 }}>
            Loại hình:
          </Typography>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'STOCK', label: 'Cổ phiếu VN' },
            { id: 'FUND', label: 'Chứng chỉ quỹ' },
            { id: 'GOLD', label: 'Vàng SJC/9999' },
            { id: 'SAVINGS', label: 'Tiết kiệm Bank' },
            { id: 'BOND', label: 'Trái phiếu' }
          ].map(c => (
            <Chip
              key={c.id}
              label={c.label}
              clickable
              size="small"
              variant={assetClassFilter === c.id ? 'filled' : 'outlined'}
              onClick={() => {
                setAssetClassFilter(c.id);
                setPage(1);
              }}
              sx={{
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 650,
                height: 22,
                borderColor: assetClassFilter === c.id ? 'primary.main' : 'divider'
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* 3. Main Content: Bento Grid View or Detailed Table View */}
      {filteredAssets.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: '6px',
            border: '1px dashed',
            borderColor: 'divider',
            textAlign: 'center',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
            Chưa có tài sản nào trong danh mục này
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Sử dụng thanh nhập nhanh ở trên (ví dụ: "mua 200 TCB giá 31.8 tích sản") để thêm tài sản chỉ trong 1 giây!
          </Typography>
        </Paper>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
            gap: 2
          }}
        >
          {paginatedAssets.map(asset => {
            const isProfit = (asset.calculatedPnL || 0) >= 0;
            return (
              <Paper
                key={asset.id}
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {/* Top Header: Symbol, Strategy Chip & Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: asset.isGold
                          ? 'rgba(217, 119, 6, 0.15)'
                          : asset.annualYieldRate
                          ? 'rgba(5, 150, 105, 0.15)'
                          : 'rgba(37, 99, 235, 0.15)',
                        color: asset.isGold ? '#D97706' : asset.annualYieldRate ? '#059669' : '#2563EB'
                      }}
                    >
                      {asset.isGold ? (
                        <TollRounded sx={{ fontSize: 20 }} />
                      ) : asset.annualYieldRate ? (
                        <SavingsRounded sx={{ fontSize: 20 }} />
                      ) : (
                        <ShowChartRounded sx={{ fontSize: 20 }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {asset.symbol}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }} noWrap>
                        {asset.name || asset.symbol}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    size="small"
                    label={asset.strategy_type === 'DCA' ? 'DCA' : 'TRADE'}
                    sx={{
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      height: 20,
                      bgcolor: asset.strategy_type === 'DCA' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: asset.strategy_type === 'DCA' ? '#059669' : '#DC2626'
                    }}
                  />
                </Box>

                {/* Body: Quantity, Market Value & PnL */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                      Số lượng:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 750 }}>
                      {asset.quantity.toLocaleString('vi-VN')} {asset.unit || 'đơn vị'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                      Giá trị hiện tại:
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {money(asset.calculatedCurrentValue)}
                    </Typography>
                  </Box>

                  {/* Accrued Interest or PnL Pill */}
                  {asset.annualYieldRate ? (
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: '4px',
                        bgcolor: 'rgba(217, 119, 6, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700, fontSize: '0.72rem' }}>
                        Lãi đã sinh ({asset.annualYieldRate}%):
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 800, fontSize: '0.75rem' }}>
                        +{money(asset.calculatedAccruedInterest)}
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: '4px',
                        bgcolor: isProfit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: isProfit ? '#059669' : '#DC2626',
                          fontWeight: 700,
                          fontSize: '0.72rem'
                        }}
                      >
                        Lãi/Lỗ:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: isProfit ? '#059669' : '#DC2626',
                          fontWeight: 800,
                          fontSize: '0.75rem'
                        }}
                      >
                        {isProfit ? '+' : ''}
                        {money(asset.calculatedPnL)} ({isProfit ? '+' : ''}
                        {asset.calculatedPnLPercent.toFixed(1)}%)
                      </Typography>
                    </Box>
                  )}

                  {/* Trade Notes / DCA target pill */}
                  {asset.trade_note && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontStyle: 'italic' }} noWrap>
                      Ghi chú: {asset.trade_note}
                    </Typography>
                  )}
                </Box>

                {/* Card Bottom: Quick Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  {onOpenOrderModal ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onOpenOrderModal(asset)}
                      sx={{ borderRadius: '4px', fontSize: '0.72rem', py: 0.25, px: 1, textTransform: 'none', fontWeight: 700 }}
                    >
                      Khớp lệnh
                    </Button>
                  ) : (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      Cập nhật: {asset.updatedAt || 'Hôm nay'}
                    </Typography>
                  )}

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteAsset(asset.id, asset.symbol)}
                    sx={{ borderRadius: '4px', p: 0.5 }}
                  >
                    <DeleteOutlineRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Paper>
            );
          })}
        </Box>
      ) : (
        /* TABLE VIEW */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: '6px',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>MÃ / TÀI SẢN</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>CHIẾN LƯỢC</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>SỐ LƯỢNG</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>GIÁ VỐN</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>GIÁ THỊ TRƯỜNG</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>GIÁ TRỊ HIỆN TẠI</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>LÃI / LỖ (P&L)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>THAO TÁC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAssets.map(asset => {
                const isProfit = (asset.calculatedPnL || 0) >= 0;
                return (
                  <TableRow key={asset.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {asset.symbol}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ({asset.name || asset.symbol})
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={asset.strategy_type === 'DCA' ? '🌱 DCA' : '⚡ TRADE'}
                        sx={{
                          borderRadius: '4px',
                          fontWeight: 750,
                          fontSize: '0.72rem',
                          height: 22,
                          bgcolor: asset.strategy_type === 'DCA' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: asset.strategy_type === 'DCA' ? '#059669' : '#DC2626'
                        }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>
                        {asset.quantity.toLocaleString('vi-VN')} {asset.unit || ''}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2">{money(asset.totalCostBasis || 0)}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2">{money(asset.currentUnitPrice || 0)}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {money(asset.calculatedCurrentValue)}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      {asset.annualYieldRate ? (
                        <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 800 }}>
                          +{money(asset.calculatedAccruedInterest)} (Lãi)
                        </Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{
                            color: isProfit ? '#059669' : '#DC2626',
                            fontWeight: 800
                          }}
                        >
                          {isProfit ? '+' : ''}
                          {money(asset.calculatedPnL)} ({isProfit ? '+' : ''}
                          {asset.calculatedPnLPercent.toFixed(1)}%)
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                        {onOpenOrderModal && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onOpenOrderModal(asset)}
                            sx={{ borderRadius: '4px', fontSize: '0.72rem', py: 0.25, px: 1, textTransform: 'none', fontWeight: 700 }}
                          >
                            Lệnh
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAsset(asset.id, asset.symbol)}
                          sx={{ borderRadius: '4px', p: 0.5 }}
                        >
                          <DeleteOutlineRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 4. Pagination Controller */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => setPage(val)}
            size="small"
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: '4px',
                fontWeight: 650
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
}
