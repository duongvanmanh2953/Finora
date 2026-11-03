import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import AddCircleRounded from '@mui/icons-material/AddCircleRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import NoteAltRounded from '@mui/icons-material/NoteAltRounded';
import LandmarkIcon from '@mui/icons-material/AccountBalanceRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import CoinsIcon from '@mui/icons-material/MonetizationOnRounded';
import LayersIcon from '@mui/icons-material/LayersRounded';
import BusinessIcon from '@mui/icons-material/BusinessCenterRounded';

import { useFinance } from '../../store';
import { uid, todayKey, money } from '../../lib/finance';
import { ASSET_CATEGORY_METADATA } from '../../lib/investmentProjectionEngine';
import type { WealthAssetCategory, RiskLevel, InvestmentNote } from '../../types/smartLedger';

interface QuickInvestmentNoteFormProps {
  onAdded?: (note: InvestmentNote) => void;
}

export function QuickInvestmentNoteForm({ onAdded }: QuickInvestmentNoteFormProps) {
  const { data, update, notify } = useFinance();

  const [category, setCategory] = useState<WealthAssetCategory>('SAVINGS_TERM');
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [expectedRateStr, setExpectedRateStr] = useState(String(ASSET_CATEGORY_METADATA.SAVINGS_TERM.defaultReturn));
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(ASSET_CATEGORY_METADATA.SAVINGS_TERM.defaultRisk);
  const [quickNote, setQuickNote] = useState('');
  const [deductFromCash, setDeductFromCash] = useState(true);

  const currentPreset = ASSET_CATEGORY_METADATA[category];

  // Handle Asset Category Quick Select
  const handleCategoryChange = (_: any, newCat: WealthAssetCategory | null) => {
    if (!newCat) return;
    setCategory(newCat);
    const meta = ASSET_CATEGORY_METADATA[newCat];
    setExpectedRateStr(String(meta.defaultReturn));
    setRiskLevel(meta.defaultRisk);
    if (!title || title.startsWith('Khoản ')) {
      setTitle(`Khoản ${meta.label}`);
    }
  };

  // Submit Investment Note
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = title.trim() || `Khoản ${currentPreset.label}`;
    const cleanAmount = parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0;
    const cleanRate = parseFloat(expectedRateStr) || 0;

    if (cleanAmount <= 0) {
      notify('Vui lòng nhập số tiền vốn đầu tư (> 0 ₫)');
      return;
    }

    const today = todayKey();
    const defaultAccId = data?.user?.defaultAccountId || (data?.accounts?.[0]?.id ?? 'cash');

    const newNote: InvestmentNote = {
      id: uid(),
      title: cleanTitle,
      category,
      initialCapital: cleanAmount,
      recoveredAmount: 0,
      currentEstimatedValue: cleanAmount,
      risk_level: riskLevel,
      include_in_net_worth: true,
      liquidity_level: category === 'CASH_EQUIVALENT' ? 'IMMEDIATE' : category === 'STOCK_VN' ? 'T_PLUS_2' : category === 'SAVINGS_TERM' ? 'TERM' : 'ILLIQUID',
      status: 'UNRECOVERED',
      startDate: today,
      expectedAnnualReturnPct: cleanRate,
      quickNote: quickNote.trim() || `Khởi tạo danh mục ${currentPreset.label}`,
      sourceAccountId: deductFromCash ? defaultAccId : undefined,
      updatedAt: today
    };

    await update(d => {
      const existingNotes = d.smartInvestmentNotes || [];

      // Optional: deduct from cash wallet
      let updatedTransactions = d.transactions;
      if (deductFromCash) {
        const transferTx = {
          id: uid(),
          name: `Đầu tư: ${cleanTitle}`,
          amount: cleanAmount,
          type: 'expense' as const,
          categoryId: 'invest',
          accountId: defaultAccId,
          date: today,
          method: 'Chuyển dịch tài sản',
          note: `[Đầu tư chưa thu hồi - ${currentPreset.label}] ${cleanTitle}`,
          status: 'completed' as const
        };
        updatedTransactions = [transferTx, ...d.transactions];
      }

      return {
        ...d,
        smartInvestmentNotes: [newNote, ...existingNotes],
        transactions: updatedTransactions
      };
    }, `Đã ghi nhận khoản đầu tư "${cleanTitle}" (${money(cleanAmount)}) vào Sổ tài sản!`);

    // Reset Form
    setTitle('');
    setAmountStr('');
    setQuickNote('');
    onAdded?.(newNote);
  };

  return (
    <Paper
      elevation={0}
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: { xs: 2, sm: 2.25 },
        borderRadius: '6px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.75
      }}
    >
      {/* 1. Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NoteAltRounded sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.92rem' }}>
            Ghi Sổ Nhanh Khoản Đầu Tư & Tài Sản
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            size="small"
            label={`Rủi ro: ${riskLevel === 'SAFE' ? 'An toàn' : riskLevel === 'LOW' ? 'Thấp' : riskLevel === 'MEDIUM' ? 'Trung bình' : 'Cao'}`}
            sx={{
              borderRadius: '4px',
              fontWeight: 750,
              fontSize: '0.72rem',
              height: 22,
              bgcolor:
                riskLevel === 'SAFE'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : riskLevel === 'LOW'
                  ? 'rgba(59, 130, 246, 0.15)'
                  : riskLevel === 'MEDIUM'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              color:
                riskLevel === 'SAFE'
                  ? '#059669'
                  : riskLevel === 'LOW'
                  ? '#2563EB'
                  : riskLevel === 'MEDIUM'
                  ? '#D97706'
                  : '#EF4444'
            }}
          />
        </Box>
      </Box>

      {/* 2. Fast Asset Class Selector (No Emoji) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
          CHỌN LOẠI TÀI SẢN:
        </Typography>
        <ToggleButtonGroup
          value={category}
          exclusive
          onChange={handleCategoryChange}
          size="small"
          sx={{
            flexWrap: 'wrap',
            gap: '6px',
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid !important',
              borderColor: 'divider !important',
              borderRadius: '4px !important',
              px: 1.25,
              py: 0.4,
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: 'action.hover',
              display: 'flex',
              gap: 0.5,
              alignItems: 'center',
              '&.Mui-selected': {
                bgcolor: 'rgba(23, 107, 82, 0.12) !important',
                color: '#176B52',
                borderColor: '#176B52 !important'
              }
            }
          }}
        >
          <ToggleButton value="SAVINGS_TERM">
            <LandmarkIcon sx={{ fontSize: 16 }} /> Tiết kiệm (5.5%)
          </ToggleButton>
          <ToggleButton value="BOND">
            <ShieldRounded sx={{ fontSize: 16 }} /> Trái phiếu (7.5%)
          </ToggleButton>
          <ToggleButton value="GOLD_PHYSICAL">
            <CoinsIcon sx={{ fontSize: 16 }} /> Vàng vật chất (8.0%)
          </ToggleButton>
          <ToggleButton value="STOCK_VN">
            <TrendingUpIcon sx={{ fontSize: 16 }} /> Cổ phiếu VN (12%)
          </ToggleButton>
          <ToggleButton value="FUND_OPEN">
            <LayersIcon sx={{ fontSize: 16 }} /> Quỹ đầu tư (9.5%)
          </ToggleButton>
          <ToggleButton value="REAL_ESTATE">
            Bất động sản (9.0%)
          </ToggleButton>
          <ToggleButton value="BUSINESS_EQUITY">
            <BusinessIcon sx={{ fontSize: 16 }} /> Góp vốn (15%)
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 3. Inputs Row: Title, Principal, Expected Return %, Risk Level */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '2fr 1.5fr 1fr 1fr' },
          gap: 1.25
        }}
      >
        <TextField
          fullWidth
          size="small"
          label="Tên khoản đầu tư / Mã tài sản"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={`Ví dụ: ${currentPreset.label}`}
          slotProps={{
            input: { sx: { borderRadius: '4px', fontSize: '0.85rem' } },
            inputLabel: { sx: { fontSize: '0.85rem' } }
          }}
        />

        <TextField
          fullWidth
          size="small"
          label="Số vốn ban đầu (VND)"
          value={amountStr}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            setAmountStr(raw ? Number(raw).toLocaleString('vi-VN') : '');
          }}
          placeholder="Ví dụ: 50.000.000"
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">₫</InputAdornment>,
              sx: { borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700 }
            },
            inputLabel: { sx: { fontSize: '0.85rem' } }
          }}
        />

        <TextField
          fullWidth
          size="small"
          label="% Lợi suất kỳ vọng/năm"
          value={expectedRateStr}
          onChange={e => setExpectedRateStr(e.target.value)}
          placeholder="Ví dụ: 8.5"
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
              sx: { borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700 }
            },
            inputLabel: { sx: { fontSize: '0.85rem' } }
          }}
        />

        <FormControl size="small" fullWidth>
          <InputLabel sx={{ fontSize: '0.85rem' }}>Mức rủi ro</InputLabel>
          <Select
            value={riskLevel}
            label="Mức rủi ro"
            onChange={e => setRiskLevel(e.target.value as RiskLevel)}
            sx={{ borderRadius: '4px', fontSize: '0.85rem', fontWeight: 650 }}
          >
            <MenuItem value="SAFE">An toàn</MenuItem>
            <MenuItem value="LOW">Rủi ro thấp</MenuItem>
            <MenuItem value="MEDIUM">Rủi ro TB</MenuItem>
            <MenuItem value="HIGH">Rủi ro cao</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 4. Quick Note & Action Buttons */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1.25, alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          label="Ghi chú (Số lượng, giá vốn, kỳ hạn, pháp lý...)"
          value={quickNote}
          onChange={e => setQuickNote(e.target.value)}
          placeholder="Ví dụ: Giữ kỳ hạn 6 tháng nhận lãi cuối kỳ | Mua 500 cp giá 32.5"
          slotProps={{
            input: { sx: { borderRadius: '4px', fontSize: '0.82rem' } },
            inputLabel: { sx: { fontSize: '0.82rem' } }
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-end' }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={deductFromCash}
                onChange={e => setDeductFromCash(e.target.checked)}
              />
            }
            label={
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                Trích trừ tiền ví mặt
              </Typography>
            }
            sx={{ mr: 0 }}
          />

          <Button
            type="submit"
            variant="contained"
            size="medium"
            startIcon={<AddCircleRounded sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: '4px',
              textTransform: 'none',
              fontWeight: 750,
              fontSize: '0.82rem',
              px: 2.25,
              py: 0.65,
              bgcolor: '#176B52',
              '&:hover': { bgcolor: '#12563F' },
              whiteSpace: 'nowrap'
            }}
          >
            Ghi vào Sổ tài sản
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
