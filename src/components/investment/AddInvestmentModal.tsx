import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Paper
} from '@mui/material';
import {
  X,
  Plus,
  TrendingUp,
  Landmark,
  Coins,
  Building,
  FileText,
  ShieldCheck,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useFinance } from '../../store';
import { uid, todayKey, money } from '../../lib/finance';
import { MuiCurrencyInput } from '../mui/MuiInputs';
import { VERIFIED_VN_MARKET_CATALOG } from '../../lib/vietnamMarketService';
import type { WealthAssetCategory, RiskLevel, InvestmentNote } from '../../types/smartLedger';
import type { InvestmentAsset, AssetClass } from '../../types';

interface AddInvestmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CategoryOption {
  id: WealthAssetCategory;
  assetClass: AssetClass;
  label: string;
  sub: string;
  icon: any;
  defaultRisk: RiskLevel;
  defaultReturn: number;
  color: string;
}

const ASSET_CATEGORIES: CategoryOption[] = [
  {
    id: 'STOCK_VN',
    assetClass: 'stock',
    label: 'Cổ phiếu VN',
    sub: 'HOSE, HNX, UPCOM',
    icon: TrendingUp,
    defaultRisk: 'MEDIUM',
    defaultReturn: 12.0,
    color: '#2563EB'
  },
  {
    id: 'FUND_OPEN',
    assetClass: 'fund',
    label: 'Chứng chỉ quỹ',
    sub: 'Quỹ mở & ETF',
    icon: FileText,
    defaultRisk: 'MEDIUM',
    defaultReturn: 10.5,
    color: '#7C3AED'
  },
  {
    id: 'GOLD_PHYSICAL',
    assetClass: 'gold',
    label: 'Vàng SJC & 9999',
    sub: 'Vàng miếng, nhẫn',
    icon: Coins,
    defaultRisk: 'LOW',
    defaultReturn: 9.0,
    color: '#D97706'
  },
  {
    id: 'SAVINGS_TERM',
    assetClass: 'savings',
    label: 'Tiết kiệm Bank',
    sub: 'Tiền gửi có kỳ hạn',
    icon: Landmark,
    defaultRisk: 'SAFE',
    defaultReturn: 5.5,
    color: '#059669'
  },
  {
    id: 'REAL_ESTATE',
    assetClass: 'real_estate',
    label: 'Bất động sản',
    sub: 'Đất, nhà, căn hộ',
    icon: Building,
    defaultRisk: 'MEDIUM',
    defaultReturn: 11.0,
    color: '#0D9488'
  },
  {
    id: 'BOND',
    assetClass: 'bond',
    label: 'Trái phiếu & Khác',
    sub: 'Trái phiếu DN, P2P',
    icon: ShieldCheck,
    defaultRisk: 'HIGH',
    defaultReturn: 9.5,
    color: '#DC2626'
  }
];

export function AddInvestmentModal({ open, onClose, onSuccess }: AddInvestmentModalProps) {
  const { data, update, notify } = useFinance();

  // Selected Category
  const [selectedCategory, setSelectedCategory] = useState<WealthAssetCategory>('STOCK_VN');
  
  // Form fields
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState<string>('20000000');
  const [quantity, setQuantity] = useState<string>('100');
  const [unitPrice, setUnitPrice] = useState<string>('200000');
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('MEDIUM');
  const [sourceAccountId, setSourceAccountId] = useState<string>('none');
  const [note, setNote] = useState<string>('');

  const currentCat = useMemo(
    () => ASSET_CATEGORIES.find(c => c.id === selectedCategory) || ASSET_CATEGORIES[0],
    [selectedCategory]
  );

  const numericAmount = parseInt(amountStr.replace(/\D/g, ''), 10) || 0;

  // When category changes, set defaults
  const handleSelectCategory = (cat: CategoryOption) => {
    setSelectedCategory(cat.id);
    setRiskLevel(cat.defaultRisk);
    setExpectedReturn(cat.defaultReturn);
    if (!name || name.startsWith('Khoản ')) {
      setName(`Khoản đầu tư ${cat.label}`);
    }
  };

  // Quick ticker click from catalog
  const handleSelectPresetTicker = (ticker: typeof VERIFIED_VN_MARKET_CATALOG[0]) => {
    setSymbol(ticker.symbol);
    setName(ticker.name);
    setUnitPrice(String(ticker.referencePrice));
    const qty = parseFloat(quantity) || 100;
    const total = qty * ticker.referencePrice;
    setAmountStr(String(total));
  };

  // Suggest popular tickers for current category
  const suggestedTickers = useMemo(() => {
    if (selectedCategory === 'STOCK_VN') {
      return VERIFIED_VN_MARKET_CATALOG.filter(t => t.assetClass === 'stock').slice(0, 6);
    }
    if (selectedCategory === 'FUND_OPEN') {
      return VERIFIED_VN_MARKET_CATALOG.filter(t => t.assetClass === 'fund').slice(0, 6);
    }
    if (selectedCategory === 'GOLD_PHYSICAL') {
      return VERIFIED_VN_MARKET_CATALOG.filter(t => t.assetClass === 'gold').slice(0, 4);
    }
    return [];
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (numericAmount <= 0) {
      notify('Vui lòng nhập số tiền đầu tư hợp lệ (> 0 ₫)');
      return;
    }

    const today = todayKey();
    const finalTitle = name.trim() || symbol.trim() || `Khoản ${currentCat.label}`;
    const cleanQty = parseFloat(quantity) || 1;
    const cleanUnitPrice = parseFloat(unitPrice) || (numericAmount / cleanQty);

    // 1. Create Smart Investment Note for Wealth Management & Risk Engine
    const newNote: InvestmentNote = {
      id: uid(),
      title: finalTitle,
      category: selectedCategory,
      symbol: symbol.trim() ? symbol.trim().toUpperCase() : undefined,
      initialCapital: numericAmount,
      recoveredAmount: 0,
      currentEstimatedValue: numericAmount,
      expectedAnnualReturnPct: expectedReturn,
      risk_level: riskLevel,
      include_in_net_worth: true,
      status: 'UNRECOVERED',
      startDate: today,
      quickNote: note ? `${note} (Tạo từ Modal Thêm tài sản)` : 'Tạo từ Modal Thêm tài sản'
    };

    // 2. If it is Stock/Fund/Gold/Bond, also register in portfolio holdings
    const isMarketable = ['STOCK_VN', 'FUND_OPEN', 'GOLD_PHYSICAL', 'BOND'].includes(selectedCategory);
    let newAsset: InvestmentAsset | null = null;

    if (isMarketable) {
      newAsset = {
        id: uid(),
        symbol: (symbol.trim() || finalTitle).toUpperCase(),
        name: finalTitle,
        assetClass: currentCat.assetClass,
        quantity: cleanQty,
        totalCostBasis: numericAmount,
        currentUnitPrice: cleanUnitPrice,
        annualYieldRate: expectedReturn,
        updatedAt: today,
        freshness: 'realtime'
      };
    }

    // 3. Update Store
    await update(d => {
      const existingNotes = d.smartInvestmentNotes || [];
      const existingInvestments = d.investments || [];
      const updatedNotes = [newNote, ...existingNotes];
      const updatedInvestments = newAsset ? [newAsset, ...existingInvestments] : existingInvestments;

      // Handle cash deduction if source account selected
      let updatedTransactions = d.transactions || [];
      if (sourceAccountId !== 'none') {
        const deductTx = {
          id: uid(),
          name: `Đầu tư: ${finalTitle}`,
          amount: numericAmount,
          type: 'expense' as const,
          categoryId: 'investment',
          accountId: sourceAccountId,
          date: today,
          method: 'Chuyển khoản đầu tư',
          note: `Trích tiền ví để ghi nhận khoản đầu tư ${finalTitle}`,
          status: 'completed' as const
        };
        updatedTransactions = [deductTx, ...updatedTransactions];
      }

      return {
        ...d,
        smartInvestmentNotes: updatedNotes,
        investments: updatedInvestments,
        transactions: updatedTransactions
      };
    }, `Đã ghi nhận tài sản "${finalTitle}" (${money(numericAmount)}) thành công!`);

    onClose();
    onSuccess?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          fontWeight: 800,
          fontSize: '1.15rem'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={20} color="var(--brand-primary, #315C50)" />
          <span>Thêm Mục Đầu Tư Mới</span>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2.5 }}>
          {/* STEP 1: Select Asset Class Cards */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase' }}>
              1. Chọn Loại Tài Sản
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: 1.25
              }}
            >
              {ASSET_CATEGORIES.map(cat => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <Paper
                    key={cat.id}
                    variant="outlined"
                    onClick={() => handleSelectCategory(cat)}
                    sx={{
                      p: 1.25,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: isSelected ? cat.color : 'divider',
                      bgcolor: isSelected ? `${cat.color}0c` : 'background.paper',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      '&:hover': {
                        borderColor: cat.color,
                        bgcolor: `${cat.color}08`
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: `${cat.color}18`,
                          color: cat.color
                        }}
                      >
                        <IconComponent size={16} />
                      </Box>
                      {isSelected && <CheckCircle size={15} color={cat.color} />}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: isSelected ? cat.color : 'text.primary' }}>
                      {cat.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      {cat.sub}
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          </Box>

          {/* Catalog Quick Suggestions */}
          {suggestedTickers.length > 0 && (
            <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: 'action.hover', border: '1px solid var(--border-subtle)' }}>
              <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                Mã gợi ý phổ biến ({currentCat.label}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {suggestedTickers.map(t => (
                  <Chip
                    key={t.symbol}
                    size="small"
                    label={`${t.symbol} · ${money(t.referencePrice)}`}
                    onClick={() => handleSelectPresetTicker(t)}
                    clickable
                    variant={symbol === t.symbol ? 'filled' : 'outlined'}
                    color={symbol === t.symbol ? 'primary' : 'default'}
                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* STEP 2: Name / Symbol and Amounts */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
              2. Thông Tin Khoản Đầu Tư
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 1.5 }}>
              <TextField
                size="small"
                label="Mã tài sản (nếu có)"
                placeholder="VD: TCB, SJC..."
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                fullWidth
              />
              <TextField
                size="small"
                label="Tên / Mô tả khoản đầu tư"
                required
                placeholder={`VD: ${currentCat.label}...`}
                value={name}
                onChange={e => setName(e.target.value)}
                fullWidth
              />
            </Box>

            {/* Amount & Return */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr' }, gap: 1.5 }}>
              <MuiCurrencyInput
                label="Số vốn đầu tư (₫)"
                value={amountStr}
                onChange={val => {
                  setAmountStr(val);
                  const n = parseInt(val.replace(/\D/g, ''), 10) || 0;
                  const qty = parseFloat(quantity) || 1;
                  if (qty > 0) setUnitPrice(String(Math.round(n / qty)));
                }}
              />
              <TextField
                size="small"
                label="Lãi suất kỳ vọng (%/năm)"
                type="number"
                value={expectedReturn}
                onChange={e => setExpectedReturn(parseFloat(e.target.value) || 0)}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }
                }}
              />
            </Box>

            {/* Optional Quantity and Unit Price */}
            {['STOCK_VN', 'FUND_OPEN', 'GOLD_PHYSICAL'].includes(selectedCategory) && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <TextField
                  size="small"
                  label="Số lượng (CP/Chỉ/CCQ)"
                  value={quantity}
                  onChange={e => {
                    setQuantity(e.target.value);
                    const q = parseFloat(e.target.value) || 0;
                    const p = parseFloat(unitPrice) || 0;
                    if (q > 0 && p > 0) setAmountStr(String(Math.round(q * p)));
                  }}
                />
                <TextField
                  size="small"
                  label="Đơn giá mua (₫)"
                  value={unitPrice}
                  onChange={e => {
                    setUnitPrice(e.target.value);
                    const q = parseFloat(quantity) || 0;
                    const p = parseFloat(e.target.value) || 0;
                    if (q > 0 && p > 0) setAmountStr(String(Math.round(q * p)));
                  }}
                />
              </Box>
            )}

            {/* Risk Level and Funding Source Account */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Mức độ rủi ro</InputLabel>
                <Select
                  value={riskLevel}
                  label="Mức độ rủi ro"
                  onChange={e => setRiskLevel(e.target.value as RiskLevel)}
                >
                  <MenuItem value="SAFE">🟢 An toàn (Tiết kiệm Bank, Trái phiếu CP)</MenuItem>
                  <MenuItem value="LOW">🟢 Thấp (Vàng vật chất, Quỹ mở an toàn)</MenuItem>
                  <MenuItem value="MEDIUM">🟡 Trung bình (Cổ phiếu, Quỹ ETF, BĐS)</MenuItem>
                  <MenuItem value="HIGH">🔴 Cao (Mạo hiểm, Tiền số, P2P)</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Nguồn tiền trích xuất</InputLabel>
                <Select
                  value={sourceAccountId}
                  label="Nguồn tiền trích xuất"
                  onChange={e => setSourceAccountId(e.target.value)}
                >
                  <MenuItem value="none">Không trừ tiền (Tài sản đã có sẵn)</MenuItem>
                  {(data?.accounts || []).filter(a => a.active).map(acc => (
                    <MenuItem key={acc.id} value={acc.id}>
                      Trừ từ ví: {acc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              size="small"
              label="Ghi chú thêm"
              placeholder="Ghi chú mục tiêu, thời hạn nắm giữ..."
              value={note}
              onChange={e => setNote(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 700 }}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Plus size={16} />}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: 'var(--brand-primary, #315C50)',
              '&:hover': { bgcolor: 'var(--brand-primary-hover, #274A40)' },
              px: 2.5
            }}
          >
            Lưu Mục Đầu Tư
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
