import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  InputBase,
  Paper,
  ButtonBase
} from '@mui/material';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import WorkspacePremiumRounded from '@mui/icons-material/WorkspacePremiumRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { AssetLogoBadge } from '../lib/brandBadges';
import {
  getVietnameseMarketUniverse,
  VERIFIED_VN_MARKET_CATALOG,
  type MarketTickerItem
} from '../lib/vietnamMarketService';

export type CascadingAssetClass = 'stock' | 'fund' | 'bond' | 'gold' | 'international';

export interface AssetTickerOption {
  symbol: string;
  name: string;
  assetClass: 'stock' | 'fund' | 'bond' | 'gold';
  exchangeOrIssuer: string;
  referencePrice: number;
  unit: string;
  currency?: string;
  country?: string;
}

export const CASCADING_ASSET_CLASSES = [
  {
    id: 'stock' as CascadingAssetClass,
    label: 'Cổ phiếu VN',
    subLabel: 'HOSE, HNX, UPCOM',
    color: '#2563EB',
    bg: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.35)',
    icon: TrendingUpRounded
  },
  {
    id: 'fund' as CascadingAssetClass,
    label: 'Quỹ mở & ETF',
    subLabel: 'Dragon Capital, VinaCapital, SSI',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.35)',
    icon: AccountBalanceRounded
  },
  {
    id: 'bond' as CascadingAssetClass,
    label: 'Trái phiếu',
    subLabel: 'Masan, Vingroup, Chính phủ',
    color: '#0D9488',
    bg: 'rgba(13, 148, 136, 0.12)',
    border: 'rgba(13, 148, 136, 0.35)',
    icon: ReceiptLongRounded
  },
  {
    id: 'gold' as CascadingAssetClass,
    label: 'Vàng SJC & 9999',
    subLabel: 'SJC, PNJ, DOJI, BTMC',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.35)',
    icon: WorkspacePremiumRounded
  },
  {
    id: 'international' as CascadingAssetClass,
    label: 'Cổ phiếu Mỹ / Tech',
    subLabel: 'AAPL, MSFT, NVDA, TSLA',
    color: '#4F46E5',
    bg: 'rgba(79, 70, 229, 0.12)',
    border: 'rgba(79, 70, 229, 0.35)',
    icon: PublicRounded
  }
];

// Curated Top Global / US Tech Stocks for users who specifically choose International
const CURATED_GLOBAL_TECH_STOCKS: MarketTickerItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stock', exchangeOrIssuer: 'NASDAQ (Mỹ)', referencePrice: 230, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', assetClass: 'stock', exchangeOrIssuer: 'NASDAQ (Mỹ)', referencePrice: 425, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', assetClass: 'stock', exchangeOrIssuer: 'NASDAQ (Mỹ)', referencePrice: 135, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', assetClass: 'stock', exchangeOrIssuer: 'NASDAQ (Mỹ)', referencePrice: 178, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', assetClass: 'stock', exchangeOrIssuer: 'NASDAQ (Mỹ)', referencePrice: 195, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'stock', exchangeOrIssuer: 'NASDAQ (Mỹ)', referencePrice: 260, unit: 'cổ phiếu', freshness: 'realtime' }
];

export interface InvestmentCascadingSelectProps {
  selectedAssetClass?: 'stock' | 'fund' | 'bond' | 'gold';
  selectedTicker?: string;
  onAssetChange?: (asset: AssetTickerOption) => void;
  onClassChange?: (assetClass: 'stock' | 'fund' | 'bond' | 'gold') => void;
}

export function InvestmentCascadingSelect({
  selectedAssetClass = 'stock',
  selectedTicker = 'TCB',
  onAssetChange,
  onClassChange
}: InvestmentCascadingSelectProps) {
  const [currentClass, setCurrentClass] = useState<CascadingAssetClass>(
    selectedTicker && ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA'].includes(selectedTicker.toUpperCase())
      ? 'international'
      : selectedAssetClass
  );
  const [currentTicker, setCurrentTicker] = useState<string>(selectedTicker);
  const [searchQuery, setSearchQuery] = useState('');
  const [marketUniverse, setMarketUniverse] = useState<MarketTickerItem[]>(VERIFIED_VN_MARKET_CATALOG);

  // Load public Vietnamese stock market tickers asynchronously
  useEffect(() => {
    let mounted = true;
    void getVietnameseMarketUniverse().then(universe => {
      if (mounted && universe?.length) {
        setMarketUniverse(universe);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Filter tickers dynamically based on selected Asset Class in Step 1
  const availableTickers = useMemo(() => {
    if (currentClass === 'international') {
      return CURATED_GLOBAL_TECH_STOCKS;
    }
    return marketUniverse.filter(a => a.assetClass === currentClass);
  }, [marketUniverse, currentClass]);

  // Filtered by user search
  const filteredTickers = useMemo(() => {
    if (!searchQuery.trim()) return availableTickers;
    const q = searchQuery.toLowerCase().trim();
    return availableTickers.filter(
      t => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    );
  }, [availableTickers, searchQuery]);

  // Currently active selected asset
  const activeAsset = useMemo(() => {
    const listToSearch = currentClass === 'international' ? CURATED_GLOBAL_TECH_STOCKS : marketUniverse;
    const found = listToSearch.find(t => t.symbol.toUpperCase() === currentTicker.toUpperCase());
    if (found) return found;

    if (currentTicker.trim()) {
      return {
        symbol: currentTicker.toUpperCase(),
        name: `Tài sản ${currentTicker.toUpperCase()}`,
        assetClass: (currentClass === 'international' ? 'stock' : currentClass) as 'stock' | 'fund' | 'bond' | 'gold',
        exchangeOrIssuer: currentClass === 'international' ? 'US (Finnhub)' : 'VN',
        referencePrice: currentClass === 'international' ? 100 : 25000,
        unit: currentClass === 'gold' ? 'lượng' : currentClass === 'fund' ? 'CCQ' : 'cổ phiếu'
      };
    }
    return availableTickers[0] || null;
  }, [availableTickers, currentTicker, currentClass, marketUniverse]);

  const handleSelectClass = (newClass: CascadingAssetClass) => {
    setCurrentClass(newClass);
    setSearchQuery('');

    const targetClass = newClass === 'international' ? 'stock' : newClass;
    onClassChange?.(targetClass);

    const matching = newClass === 'international'
      ? CURATED_GLOBAL_TECH_STOCKS
      : marketUniverse.filter(a => a.assetClass === newClass);

    if (matching.length > 0) {
      const defaultItem = matching[0];
      setCurrentTicker(defaultItem.symbol);
      onAssetChange?.({
        symbol: defaultItem.symbol,
        name: defaultItem.name,
        assetClass: targetClass,
        exchangeOrIssuer: defaultItem.exchangeOrIssuer,
        referencePrice: defaultItem.referencePrice,
        unit: defaultItem.unit,
        currency: newClass === 'international' ? 'USD' : 'VND'
      });
    }
  };

  const handleSelectAsset = (item: MarketTickerItem) => {
    setCurrentTicker(item.symbol);
    const targetClass = currentClass === 'international' ? 'stock' : item.assetClass;
    onAssetChange?.({
      symbol: item.symbol,
      name: item.name,
      assetClass: targetClass,
      exchangeOrIssuer: item.exchangeOrIssuer,
      referencePrice: item.referencePrice,
      unit: item.unit,
      currency: currentClass === 'international' ? 'USD' : 'VND'
    });
  };

  const activeClassMeta = CASCADING_ASSET_CLASSES.find(c => c.id === currentClass) || CASCADING_ASSET_CLASSES[0];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      {/* ================================================================ */}
      {/* BƯỚC 1: CHỌN LOẠI TÀI SẢN (SELECTION TILES)                       */}
      {/* ================================================================ */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Bước 1: Chọn Phân Loại Đầu Tư
          </Typography>
          <Typography variant="caption" sx={{ color: activeClassMeta.color, fontWeight: 700 }}>
            {activeClassMeta.label}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 1
          }}
        >
          {CASCADING_ASSET_CLASSES.map(cls => {
            const isSelected = cls.id === currentClass;
            const IconComp = cls.icon;
            return (
              <ButtonBase
                key={cls.id}
                onClick={() => handleSelectClass(cls.id)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  p: 1.25,
                  borderRadius: '4px',
                  border: '1.5px solid',
                  borderColor: isSelected ? cls.color : 'divider',
                  bgcolor: isSelected ? cls.bg : 'background.paper',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: cls.color,
                    bgcolor: cls.bg,
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '4px',
                      bgcolor: isSelected ? cls.color : 'action.hover',
                      color: isSelected ? '#FFFFFF' : cls.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconComp sx={{ fontSize: 16 }} />
                  </Box>
                  {isSelected && <CheckCircleRounded sx={{ fontSize: 16, color: cls.color }} />}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.8rem', color: isSelected ? cls.color : 'text.primary', lineHeight: 1.2 }}>
                  {cls.label}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontSize: '0.675rem', width: '100%', mt: 0.25 }}>
                  {cls.subLabel}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>
      </Box>

      {/* ================================================================ */}
      {/* BƯỚC 2: TÌM & CHỌN MÃ TÀI SẢN (SEARCH + SMART RESULTS)            */}
      {/* ================================================================ */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Bước 2: Tìm & Chọn Mã ({availableTickers.length} mã {activeClassMeta.label})
          </Typography>
          {currentClass === 'international' ? (
            <Chip size="small" label="Finnhub US Stocks" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4F46E5' }} />
          ) : (
            <Chip size="small" label="Thị trường Việt Nam" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(37, 99, 235, 0.12)', color: '#2563EB' }} />
          )}
        </Box>

        {/* Quick Search Input Bar */}
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.25,
            py: 0.5,
            borderRadius: '4px',
            borderColor: 'divider',
            bgcolor: 'background.default',
            mb: 1.25,
            '&:focus-within': {
              borderColor: activeClassMeta.color
            }
          }}
        >
          <SearchRounded sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
          <InputBase
            fullWidth
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Tìm mã hoặc tên (${currentClass === 'stock' ? 'VCB, FPT, HPG, TCB...' : currentClass === 'fund' ? 'DCDS, E1VFVN30, VESAF...' : 'Nhập mã để tìm...'})`}
            sx={{ fontSize: '0.85rem', fontWeight: 500 }}
          />
          {searchQuery && (
            <Chip
              label="Xóa"
              size="small"
              clickable
              onClick={() => setSearchQuery('')}
              sx={{ height: 20, fontSize: 11, cursor: 'pointer' }}
            />
          )}
        </Paper>

        {/* Scrollable Quick Selection Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 1,
            maxHeight: 220,
            overflowY: 'auto',
            p: 0.5,
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {filteredTickers.slice(0, 15).map(item => {
            const isItemActive = item.symbol.toUpperCase() === currentTicker.toUpperCase();
            return (
              <ButtonBase
                key={item.symbol}
                onClick={() => handleSelectAsset(item)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  p: 1,
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: isItemActive ? activeClassMeta.color : 'transparent',
                  bgcolor: isItemActive ? activeClassMeta.bg : 'background.paper',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  '&:hover': {
                    bgcolor: activeClassMeta.bg,
                    borderColor: activeClassMeta.color
                  }
                }}
              >
                <AssetLogoBadge symbol={item.symbol} name={item.name} size="small" />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: isItemActive ? activeClassMeta.color : 'text.primary' }}>
                      {item.symbol}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>
                      {currentClass === 'international' ? `$${item.referencePrice}` : `${new Intl.NumberFormat('vi-VN').format(item.referencePrice)} ₫`}
                    </Typography>
                  </Box>
                  <Typography variant="caption" noWrap sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem' }}>
                    {item.name}
                  </Typography>
                </Box>
              </ButtonBase>
            );
          })}

          {filteredTickers.length === 0 && (
            <Box sx={{ gridColumn: '1 / -1', p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                Không tìm thấy mã "{searchQuery}" trong danh mục {activeClassMeta.label}.
              </Typography>
              <ButtonBase
                onClick={() => {
                  const customItem: MarketTickerItem = {
                    symbol: searchQuery.toUpperCase(),
                    name: `Tài sản ${searchQuery.toUpperCase()}`,
                    assetClass: currentClass === 'international' ? 'stock' : (currentClass as any),
                    exchangeOrIssuer: currentClass === 'stock' ? 'HOSE/HNX' : 'Thị trường',
                    referencePrice: 25000,
                    unit: 'cổ phiếu',
                    freshness: 'manual'
                  };
                  handleSelectAsset(customItem);
                }}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '4px',
                  bgcolor: 'primary.main',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                Chọn mã tự nhập "{searchQuery.toUpperCase()}"
              </ButtonBase>
            </Box>
          )}
        </Box>
      </Box>

      {/* ================================================================ */}
      {/* LIVE SELECTED ASSET BANNER                                       */}
      {/* ================================================================ */}
      {activeAsset && (
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: '4px',
            bgcolor: activeClassMeta.bg,
            border: '1px solid',
            borderColor: activeClassMeta.border
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AssetLogoBadge symbol={activeAsset.symbol} name={activeAsset.name} size="medium" />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: activeClassMeta.color, lineHeight: 1.2 }}>
                  {activeAsset.symbol}
                </Typography>
                <Chip
                  size="small"
                  label={activeAsset.exchangeOrIssuer}
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px' }}
                />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.825rem' }}>
                {activeAsset.name}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>
              Giá tham chiếu
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
              {currentClass === 'international' ? `$${activeAsset.referencePrice}` : `${new Intl.NumberFormat('vi-VN').format(activeAsset.referencePrice)} ₫`}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
