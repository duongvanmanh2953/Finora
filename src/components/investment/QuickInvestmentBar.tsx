import { useState, useRef } from 'react';
import {
  Box,
  Paper,
  InputBase,
  IconButton,
  Chip,
  Typography,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Collapse
} from '@mui/material';
import SendRounded from '@mui/icons-material/SendRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import AutoGraphRounded from '@mui/icons-material/AutoGraphRounded';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import SavingsRounded from '@mui/icons-material/SavingsRounded';
import TollRounded from '@mui/icons-material/TollRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import LightbulbRounded from '@mui/icons-material/LightbulbRounded';

import { useFinance } from '../../store';
import { money, todayKey, uid } from '../../lib/finance';
import {
  parseInvestmentNLP,
  calculateAccruedInterest,
  type ParsedInvestmentCommand
} from '../../lib/investmentCalculator';
import type {
  UnifiedAssetType,
  StrategyType
} from '../../types/unifiedInvestment';
import type { InvestmentAsset } from '../../types';

interface QuickInvestmentBarProps {
  onSuccess?: () => void;
}

const ASSET_TYPE_SHORTCUTS: { type: UnifiedAssetType; label: string; icon: any; sample: string }[] = [
  { type: 'STOCK_VN', label: 'Cổ phiếu VN', icon: ShowChartRounded, sample: 'mua 200 TCB giá 31.8 tích sản' },
  { type: 'FUND_VN', label: 'Chứng chỉ quỹ', icon: TrendingUpRounded, sample: 'mua 500 DCDS giá 28.5 tích sản' },
  { type: 'GOLD_VN', label: 'Vàng SJC / 9999', icon: TollRounded, sample: 'mua 2 chỉ vàng nhẫn 9999 tích sản' },
  { type: 'SAVINGS_VN', label: 'Tiết kiệm Bank', icon: SavingsRounded, sample: 'gửi tiết kiệm 50tr 6 tháng VCB lãi 4.7%' },
  { type: 'BOND_VN', label: 'Trái phiếu', icon: ReceiptLongRounded, sample: 'mua 10 trái phiếu VHM 100tr lãi 9.5%' }
];

export function QuickInvestmentBar({ onSuccess }: QuickInvestmentBarProps) {
  const { data, update, notify } = useFinance();
  const [inputText, setInputText] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('DCA');
  const [selectedAssetType, setSelectedAssetType] = useState<UnifiedAssetType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse natural language investment command
  const parsed: ParsedInvestmentCommand | null = inputText.trim()
    ? parseInvestmentNLP(inputText, selectedStrategy)
    : null;

  // Handle Quick Category Chip click
  const handleSelectShortcut = (shortcut: typeof ASSET_TYPE_SHORTCUTS[0]) => {
    setSelectedAssetType(shortcut.type);
    setInputText(shortcut.sample);
    inputRef.current?.focus();
  };

  // Submit and save investment record
  const handleRecordInvestment = async () => {
    if (!inputText.trim()) {
      notify('Vui lòng nhập lệnh đầu tư (ví dụ: mua 200 TCB giá 31.8 tích sản)');
      inputRef.current?.focus();
      return;
    }

    if (!parsed || parsed.totalAmount <= 0) {
      notify('Chưa đủ thông tin để lưu tài sản. Vui lòng ghi rõ mã/tên, số lượng và giá!');
      inputRef.current?.focus();
      return;
    }

    const defaultAccId = data?.user?.defaultAccountId || (data?.accounts?.[0]?.id ?? 'cash');
    const today = todayKey();

    // Map unified asset to Finora InvestmentAsset format
    let assetClassCategory: 'stock' | 'crypto' | 'real_estate' | 'fund' | 'bond' | 'custom' = 'stock';
    if (parsed.assetType === 'FUND_VN') assetClassCategory = 'fund';
    else if (parsed.assetType === 'BOND_VN') assetClassCategory = 'bond';
    else if (parsed.assetType === 'GOLD_VN') assetClassCategory = 'custom';
    else if (parsed.assetType === 'SAVINGS_VN') assetClassCategory = 'custom';

    // Calculate accrued interest for savings/bonds
    let initialAccrued = 0;
    if (parsed.annualYieldRate && parsed.termMonths) {
      initialAccrued = calculateAccruedInterest(parsed.totalAmount, parsed.annualYieldRate, today).accruedInterest;
    }

    const newAsset: InvestmentAsset = {
      id: uid(),
      symbol: parsed.symbol,
      name: parsed.name,
      assetClass: assetClassCategory,
      quantity: parsed.quantity,
      unit: parsed.unit,
      totalCostBasis: parsed.totalAmount,
      currentUnitPrice: parsed.unitPrice,
      strategy_type: parsed.strategy_type,
      quick_note: parsed.quick_note,
      trade_note: parsed.strategy_type === 'TRADE' ? parsed.trade_note || parsed.quick_note : undefined,
      annualYieldRate: parsed.annualYieldRate,
      termMonths: parsed.termMonths,
      startDate: today,
      bankOrIssuer: parsed.name,
      accruedInterest: initialAccrued,
      updatedAt: today
    };

    // Also record transaction
    const newTx = {
      id: uid(),
      name: `Đầu tư: ${parsed.symbol} (${parsed.quantity} ${parsed.unit})`,
      amount: parsed.totalAmount,
      type: 'expense' as const,
      categoryId: 'invest',
      accountId: defaultAccId,
      date: today,
      method: 'Chuyển khoản',
      note: `[${parsed.strategy_type}] ${parsed.quick_note || ''}`.trim(),
      status: 'completed' as const
    };

    await update(d => ({
      ...d,
      investments: [newAsset, ...(d.investments || [])],
      transactions: [newTx, ...d.transactions]
    }), `Đã thêm tài sản ${parsed.symbol} vào danh mục [${parsed.strategy_type}] (${money(parsed.totalAmount)})!`);

    setInputText('');
    setSelectedAssetType(null);
    onSuccess?.();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: '8px',
        border: '1px solid',
        borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : '#E2E8F0',
        bgcolor: theme => theme.palette.mode === 'dark' ? '#1E2633' : '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5
      }}
    >
      {/* 1. Header Row: Title, Strategy Selector & Zero-Effort Badge */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '4px',
              bgcolor: 'rgba(37, 99, 235, 0.12)',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AutoGraphRounded sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 750, color: 'text.primary', fontSize: '0.90rem' }}>
            Nhập lệnh nhanh 1 dòng
          </Typography>
        </Box>

        {/* Strategy Switcher: DCA Tích sản vs Lướt sóng TRADE */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: { xs: 'none', sm: 'inline-block' } }}>
            Chiến lược:
          </Typography>
          <ToggleButtonGroup
            value={selectedStrategy}
            exclusive
            onChange={(_, val) => val && setSelectedStrategy(val)}
            size="small"
            sx={{
              height: 28,
              '& .MuiToggleButton-root': {
                borderRadius: '4px',
                px: 1.25,
                py: 0.25,
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid',
                borderColor: 'divider',
                textTransform: 'none',
                '&.Mui-selected': {
                  bgcolor: selectedStrategy === 'DCA' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: selectedStrategy === 'DCA' ? '#059669' : '#DC2626',
                  borderColor: selectedStrategy === 'DCA' ? '#059669' : '#DC2626'
                }
              }
            }}
          >
            <ToggleButton value="DCA">Tích sản DCA</ToggleButton>
            <ToggleButton value="TRADE">Lướt sóng Trade</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* 2. Primary 1-line Input Bar with Sleek Send Button */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          py: 0.5,
          borderRadius: '4px',
          borderColor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.18)' : '#2563EB'),
          borderWidth: 1.5,
          borderStyle: 'solid',
          bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.25)' : '#F8FAFC'),
          gap: 1,
          transition: 'border-color 0.15s ease',
          '&:focus-within': {
            borderColor: '#2563EB',
            boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.25)'
          }
        }}
      >
        <InputBase
          inputRef={inputRef}
          fullWidth
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleRecordInvestment();
            }
          }}
          placeholder="Ví dụ: mua 200 TCB giá 31.8 tích sản | gửi tiết kiệm 50tr 6 tháng Vietcombank lãi 4.7%..."
          sx={{
            fontSize: { xs: 13.5, sm: 14.5 },
            fontWeight: 500,
            color: 'text.primary',
            '& input::placeholder': {
              color: 'text.secondary',
              opacity: 0.85
            }
          }}
        />

        {/* Clean, Modern Send Button with Tooltip */}
        <Tooltip title="Lưu tài sản vào danh mục (Enter ↵)">
          <IconButton
            size="medium"
            onClick={handleRecordInvestment}
            aria-label="Lưu tài sản đầu tư"
            sx={{
              width: 38,
              height: 38,
              borderRadius: '4px',
              bgcolor: '#2563EB',
              color: '#FFFFFF',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: '#1D4ED8',
                transform: 'scale(1.05)'
              },
              '&:active': {
                transform: 'scale(0.96)'
              }
            }}
          >
            <SendRounded sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* 3. Live Natural Language Recognition Feedback */}
      <Collapse in={Boolean(parsed && parsed.totalAmount > 0)}>
        {parsed && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
              p: 1.25,
              borderRadius: '4px',
              bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(37, 99, 235, 0.05)'),
              border: '1px solid',
              borderColor: 'rgba(37, 99, 235, 0.25)'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 750,
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.78rem'
              }}
            >
              <CheckCircleRounded sx={{ fontSize: 15 }} />
              Nhận diện:
            </Typography>

            <Chip
              size="small"
              label={parsed.symbol}
              sx={{
                borderRadius: '4px',
                fontWeight: 800,
                bgcolor: '#2563EB',
                color: '#FFFFFF',
                height: 24,
                fontSize: '0.75rem'
              }}
            />

            <Chip
              size="small"
              label={`${parsed.quantity.toLocaleString('vi-VN')} ${parsed.unit}`}
              variant="outlined"
              sx={{ borderRadius: '4px', fontWeight: 650, height: 24, fontSize: '0.75rem' }}
            />

            <Chip
              size="small"
              label={`Giá: ${money(parsed.unitPrice)}`}
              variant="outlined"
              sx={{ borderRadius: '4px', fontWeight: 650, height: 24, fontSize: '0.75rem' }}
            />

            <Chip
              size="small"
              label={`Tổng vốn: ${money(parsed.totalAmount)}`}
              sx={{
                borderRadius: '4px',
                fontWeight: 750,
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                color: '#059669',
                height: 24,
                fontSize: '0.75rem'
              }}
            />

            <Chip
              size="small"
              label={parsed.strategy_type === 'DCA' ? '🌱 Tích sản DCA' : '⚡ Lướt sóng Trade'}
              sx={{
                borderRadius: '4px',
                fontWeight: 750,
                bgcolor: parsed.strategy_type === 'DCA' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: parsed.strategy_type === 'DCA' ? '#059669' : '#DC2626',
                height: 24,
                fontSize: '0.75rem'
              }}
            />

            {parsed.annualYieldRate && (
              <Chip
                size="small"
                label={`Lãi suất: ${parsed.annualYieldRate}%/năm (${parsed.termMonths || 12}T)`}
                sx={{
                  borderRadius: '4px',
                  fontWeight: 700,
                  bgcolor: 'rgba(217, 119, 6, 0.15)',
                  color: '#D97706',
                  height: 24,
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Box>
        )}
      </Collapse>

      {/* 4. Quick Category Shortcuts with Explicit Breathing Room */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: '0.78rem',
            mr: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <LightbulbRounded sx={{ fontSize: 15, color: '#F59E0B' }} />
          Mẫu nhập nhanh:
        </Typography>

        {ASSET_TYPE_SHORTCUTS.map(sc => {
          const IconComponent = sc.icon;
          const isSelected = selectedAssetType === sc.type;
          return (
            <Chip
              key={sc.type}
              icon={<IconComponent style={{ fontSize: 14 }} />}
              label={sc.label}
              clickable
              size="small"
              variant={isSelected ? 'filled' : 'outlined'}
              onClick={() => handleSelectShortcut(sc)}
              sx={{
                borderRadius: '4px',
                px: 1.1,
                py: 0.5,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                borderColor: isSelected ? '#2563EB' : 'divider',
                bgcolor: isSelected
                  ? '#2563EB'
                  : theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'),
                color: isSelected ? '#FFFFFF' : 'text.primary',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: '#2563EB',
                  color: '#FFFFFF',
                  borderColor: '#2563EB',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                },
                '&:active': {
                  transform: 'scale(0.96)'
                }
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
}
