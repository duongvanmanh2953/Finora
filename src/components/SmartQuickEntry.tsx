import { useState, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
  InputBase,
  IconButton,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import SendRounded from '@mui/icons-material/SendRounded';
import SparklesRounded from '@mui/icons-material/AutoAwesomeRounded';
import CalendarTodayRounded from '@mui/icons-material/CalendarTodayRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import TagRounded from '@mui/icons-material/TagRounded';
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ArrowDropDownRounded from '@mui/icons-material/ArrowDropDownRounded';

import { useFinance } from '../store';
import { money, todayKey, uid } from '../lib/finance';
import { AssetLogoBadge, CategoryAvatarBadge, BankLogoBadge } from '../lib/brandBadges';
import type { TxType, Account } from '../types';

export type QuickEntryType = 'expense' | 'income' | 'invest';

export interface ParsedNLPResult {
  type: QuickEntryType;
  amount: number;
  categoryKey: string;
  categoryName: string;
  note: string;
  date: string;
  accountId?: string;
  ticker?: string;
  quantity?: number;
  price?: number;
}

const QUICK_AMOUNTS = [
  { label: '20k', value: 20000 },
  { label: '50k', value: 50000 },
  { label: '100k', value: 100000 },
  { label: '200k', value: 200000 },
  { label: '500k', value: 500000 },
  { label: '1tr', value: 1000000 },
  { label: '2tr', value: 2000000 },
  { label: '5tr', value: 5000000 }
];

export function parseNaturalLanguageInput(raw: string, currentType: QuickEntryType): ParsedNLPResult {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const today = todayKey();

  let recognizedType: QuickEntryType = currentType;
  let amount = 0;
  let categoryKey = 'other';
  let categoryName = 'Khác';
  let note = text;
  let ticker: string | undefined;
  let quantity: number | undefined;
  let price: number | undefined;

  // 1. Detect Investment patterns: e.g. "mua 100 TCB giá 32" / "ban 50 FPT"
  const investMatch = text.match(/(mua|bán|ban)\s+(\d+)\s+([A-Za-z0-9]+)(\s+giá\s+(\d+k?))?/i);
  if (investMatch) {
    recognizedType = 'invest';
    quantity = parseInt(investMatch[2], 10);
    ticker = investMatch[3].toUpperCase();
    const rawPrice = investMatch[5];
    if (rawPrice) {
      if (rawPrice.endsWith('k')) {
        price = parseInt(rawPrice, 10) * 1000;
      } else {
        const p = parseInt(rawPrice, 10);
        price = p < 1000 ? p * 1000 : p;
      }
      amount = (quantity || 0) * (price || 0);
    } else {
      price = 25000;
      amount = (quantity || 0) * price;
    }
    categoryKey = 'invest';
    categoryName = 'Đầu tư';
    note = `${investMatch[1].toUpperCase()} ${quantity} ${ticker}`;
    return { type: recognizedType, amount, categoryKey, categoryName, note, date: today, ticker, quantity, price };
  }

  // 2. Parse Amount (e.g. "45k", "500k", "1.5tr", "2tr5", "85000")
  const amountMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|nghìn|đ|vnd)?/i);
  if (amountMatch) {
    const numPart = parseFloat(amountMatch[1].replace(',', '.'));
    const unitPart = amountMatch[2]?.toLowerCase();
    if (unitPart === 'k' || unitPart === 'nghìn') {
      amount = Math.round(numPart * 1000);
    } else if (unitPart === 'tr' || unitPart === 'triệu') {
      amount = Math.round(numPart * 1000000);
    } else if (numPart < 1000 && !unitPart) {
      amount = Math.round(numPart * 1000);
    } else {
      amount = Math.round(numPart);
    }
  }

  // 3. Category Detection
  if (
    lower.includes('cf') ||
    lower.includes('cafe') ||
    lower.includes('cà phê') ||
    lower.includes('trà') ||
    lower.includes('ăn') ||
    lower.includes('phở') ||
    lower.includes('cơm') ||
    lower.includes('bún')
  ) {
    categoryKey = 'food';
    categoryName = 'Ăn uống';
    if (!note || note === text) note = 'Cà phê & Ăn uống';
  } else if (
    lower.includes('xăng') ||
    lower.includes('xe') ||
    lower.includes('grab') ||
    lower.includes('be') ||
    lower.includes('gửi xe') ||
    lower.includes('vé xe')
  ) {
    categoryKey = 'transport';
    categoryName = 'Di chuyển';
    if (!note || note === text) note = 'Đi lại & Xăng xe';
  } else if (
    lower.includes('điện') ||
    lower.includes('nước') ||
    lower.includes('nhà') ||
    lower.includes('phòng') ||
    lower.includes('mạng') ||
    lower.includes('wifi') ||
    lower.includes('tiền mạng')
  ) {
    categoryKey = 'housing';
    categoryName = 'Hóa đơn';
    if (!note || note === text) note = 'Hóa đơn sinh hoạt';
  } else if (
    lower.includes('mua') ||
    lower.includes('shopee') ||
    lower.includes('lazada') ||
    lower.includes('tiki') ||
    lower.includes('quần áo') ||
    lower.includes('giày')
  ) {
    categoryKey = 'shopping';
    categoryName = 'Mua sắm';
    if (!note || note === text) note = 'Mua sắm đồ dùng';
  } else if (
    lower.includes('lương') ||
    lower.includes('thưởng') ||
    lower.includes('bonus') ||
    lower.includes('thu nhập') ||
    lower.includes('hoa hồng')
  ) {
    recognizedType = 'income';
    categoryKey = 'salary';
    categoryName = 'Tiền lương';
    if (!note || note === text) note = 'Thu nhập tiền lương';
  }

  return {
    type: recognizedType,
    amount,
    categoryKey,
    categoryName,
    note: note || (recognizedType === 'income' ? 'Khoản thu' : 'Khoản chi'),
    date: today
  };
}

export function SmartQuickEntry() {
  const { data, update, notify } = useFinance();
  const [entryType, setEntryType] = useState<QuickEntryType>('expense');
  const [inputText, setInputText] = useState('');
  const [overrideAmount, setOverrideAmount] = useState<number | null>(null);
  const [customCategory, setCustomCategory] = useState<{ key: string; name: string } | null>(null);
  const [customDate, setCustomDate] = useState<string | null>(null);
  const [customAccountId, setCustomAccountId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<null | HTMLElement>(null);
  const [dateMenuAnchor, setDateMenuAnchor] = useState<null | HTMLElement>(null);

  const categories = data?.categories || [];
  const accounts: Account[] = data?.accounts || [];
  const activeAccount = accounts.find(a => a.id === customAccountId) || accounts[0];

  // Live parsed recognition
  const parsed = useMemo(() => {
    const res = parseNaturalLanguageInput(inputText, entryType);
    if (overrideAmount !== null) {
      res.amount = overrideAmount;
    }
    if (customCategory) {
      res.categoryKey = customCategory.key;
      res.categoryName = customCategory.name;
    }
    if (customDate) {
      res.date = customDate;
    }
    res.accountId = activeAccount?.id;
    return res;
  }, [inputText, entryType, overrideAmount, customCategory, customDate, activeAccount]);

  // Handle Quick Amount Chips: sets or updates input text with readable format and updates amount
  const handleApplyQuickAmount = (val: number, label: string) => {
    setOverrideAmount(val);

    // Replace existing amount token in input, or append
    const baseText = inputText.replace(/(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|nghìn|đ|vnd)?/gi, '').trim();
    if (baseText) {
      setInputText(`${baseText} ${label}`);
    } else {
      setInputText(label);
    }

    inputRef.current?.focus();
  };

  const handleRecordTransaction = async () => {
    if (parsed.amount <= 0) {
      notify('Vui lòng nhập hoặc chọn số tiền (> 0 ₫)');
      inputRef.current?.focus();
      return;
    }

    if (!activeAccount) {
      notify('Vui lòng chọn tài khoản giao dịch');
      return;
    }

    if (parsed.type === 'invest' && parsed.ticker) {
      // Record investment buy
      await update(d => {
        const inv = {
          id: uid(),
          symbol: parsed.ticker!,
          name: parsed.note,
          assetClass: 'stock' as const,
          quantity: parsed.quantity || 1,
          totalCostBasis: parsed.amount,
          currentUnitPrice: parsed.price || parsed.amount,
          updatedAt: todayKey()
        };
        const newTx = {
          id: uid(),
          name: `Đầu tư ${parsed.ticker}`,
          amount: parsed.amount,
          type: 'expense' as const,
          categoryId: 'invest',
          accountId: activeAccount.id,
          date: parsed.date,
          method: 'Chuyển khoản',
          note: parsed.note,
          status: 'completed' as const
        };
        return {
          ...d,
          investments: [...(d.investments || []), inv],
          transactions: [newTx, ...d.transactions]
        };
      }, `Đã ghi nhận lệnh mua ${parsed.ticker} (${money(parsed.amount)})!`);
    } else {
      // Record standard Income / Expense
      const txType: TxType = parsed.type === 'income' ? 'income' : 'expense';
      await update(d => {
        const newTx = {
          id: uid(),
          name: parsed.note,
          amount: parsed.amount,
          type: txType,
          categoryId: parsed.categoryKey,
          accountId: activeAccount.id,
          date: parsed.date,
          method: activeAccount.type === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
          note: parsed.note,
          status: 'completed' as const
        };
        return {
          ...d,
          transactions: [newTx, ...d.transactions]
        };
      }, `Đã ghi nhận ${txType === 'income' ? 'Khoản thu' : 'Khoản chi'}: ${money(parsed.amount)}`);
    }

    // Reset input states
    setInputText('');
    setOverrideAmount(null);
    setCustomCategory(null);
    setCustomDate(null);
  };

  const activeColor =
    entryType === 'expense'
      ? '#EF4444'
      : entryType === 'income'
      ? '#10B981'
      : '#2563EB';

  const yesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: '6px', // Strictly 6px container
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.75,
        boxShadow: theme =>
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.4)'
            : '0 1px 4px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* 1. Top Bar: Segmented Type Switcher & NLP Tag */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <ToggleButtonGroup
          value={entryType}
          exclusive
          onChange={(_, val) => {
            if (val) {
              setEntryType(val);
              setOverrideAmount(null);
              setCustomCategory(null);
            }
          }}
          size="small"
          sx={{
            bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'),
            p: 0.5,
            borderRadius: '4px', // Strictly 4px inner
            border: '1px solid',
            borderColor: 'divider',
            '& .MuiToggleButton-root': {
              borderRadius: '4px',
              border: 'none',
              px: { xs: 1.5, sm: 2 },
              py: 0.6,
              fontWeight: 700,
              fontSize: '0.8rem',
              color: 'text.secondary',
              transition: 'all 0.15s ease',
              '&.Mui-selected': {
                bgcolor: activeColor,
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
              }
            }
          }}
        >
          <ToggleButton value="expense">Chi tiêu</ToggleButton>
          <ToggleButton value="income">Thu nhập</ToggleButton>
          <ToggleButton value="invest">Đầu tư</ToggleButton>
        </ToggleButtonGroup>

        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            fontWeight: 650,
            fontSize: '0.8rem'
          }}
        >
          <SparklesRounded sx={{ fontSize: 16, color: '#D97706' }} />
          Nhập tắt thông minh (NLP)
        </Typography>
      </Box>

      {/* 2. NLP Input Bar with Friendly Icon-Only Send Button (No bulky text) */}
      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          py: 0.5,
          borderRadius: '4px', // Strictly 4px inner
          borderColor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'primary.main'),
          borderWidth: 1.5,
          bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.25)' : 'background.default'),
          gap: 1,
          transition: 'border-color 0.15s ease',
          '&:focus-within': {
            borderColor: activeColor,
            boxShadow: `0 0 0 2px ${activeColor}33`
          }
        }}
      >
        <InputBase
          inputRef={inputRef}
          fullWidth
          value={inputText}
          onChange={e => {
            setInputText(e.target.value);
            setOverrideAmount(null);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleRecordTransaction();
            }
          }}
          placeholder={
            entryType === 'invest'
              ? 'Ví dụ: mua 100 TCB giá 32 hoặc mua 50 FPT...'
              : entryType === 'income'
              ? 'Ví dụ: lương tháng 32tr hoặc thưởng dự án 5tr...'
              : 'Ví dụ: cf sáng 45k hoặc đổ xăng 50k hoặc ăn trưa 65k...'
          }
          sx={{
            fontSize: { xs: 13.5, sm: 14.5 },
            fontWeight: 500,
            color: 'text.primary',
            '& input::placeholder': {
              color: 'text.secondary',
              opacity: 0.8
            }
          }}
        />

        {/* Clean, Friendly Send Icon Button with Tooltip */}
        <Tooltip title="Lưu giao dịch (Enter ↵)">
          <IconButton
            size="medium"
            onClick={handleRecordTransaction}
            aria-label="Lưu giao dịch"
            sx={{
              width: 38,
              height: 38,
              borderRadius: '4px', // Strictly 4px inner
              bgcolor: activeColor,
              color: '#FFFFFF',
              flexShrink: 0,
              boxShadow: `0 2px 8px ${activeColor}55`,
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: activeColor,
                filter: 'brightness(1.1)',
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

      {/* 3. Live Recognition Status Bar: Airy, Non-Colliding Interactive Badges */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px', // Explicit 10px gap prevents elements sticking together
          p: 1.5,
          borderRadius: '4px',
          bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'action.hover'),
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 750,
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            fontSize: '0.78rem',
            mr: 0.5
          }}
        >
          <CheckCircleRounded sx={{ fontSize: 15, color: activeColor }} />
          Nhận diện:
        </Typography>

        {/* Amount Badge (Click to focus input) */}
        <Tooltip title="Nhấp để nhập hoặc sửa số tiền">
          <Box
            onClick={() => inputRef.current?.focus()}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              px: 1.25,
              py: 0.5,
              borderRadius: '4px',
              bgcolor: parsed.amount > 0 ? `${activeColor}1F` : 'action.selected',
              color: parsed.amount > 0 ? activeColor : 'text.secondary',
              border: '1px solid',
              borderColor: parsed.amount > 0 ? `${activeColor}66` : 'divider',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: `${activeColor}33`,
                borderColor: activeColor
              }
            }}
          >
            <PaymentsRounded sx={{ fontSize: 16 }} />
            <span>{parsed.amount > 0 ? money(parsed.amount) : '0 ₫'}</span>
          </Box>
        </Tooltip>

        {/* Category Badge with Dropdown Indicator (Click to change category) */}
        <Tooltip title="Nhấp để đổi danh mục thu/chi">
          <Box
            onClick={e => setCategoryMenuAnchor(e.currentTarget)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              px: 1.25,
              py: 0.5,
              borderRadius: '4px',
              bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'background.paper'),
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.primary',
              fontSize: '0.82rem',
              fontWeight: 650,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'primary.main'
              }
            }}
          >
            <TagRounded sx={{ fontSize: 16, color: 'primary.main' }} />
            <span>{parsed.categoryName}</span>
            <ArrowDropDownRounded sx={{ fontSize: 18, color: 'text.secondary', ml: -0.5 }} />
          </Box>
        </Tooltip>

        {/* Account Badge with Dropdown Indicator (Click to change account) */}
        {activeAccount && (
          <Tooltip title="Nhấp để đổi tài khoản thanh toán">
            <Box
              onClick={e => setAccountMenuAnchor(e.currentTarget)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                px: 1.25,
                py: 0.5,
                borderRadius: '4px',
                bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'background.paper'),
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.primary',
                fontSize: '0.82rem',
                fontWeight: 650,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main'
                }
              }}
            >
              <AccountBalanceWalletRounded sx={{ fontSize: 15, color: '#D97706' }} />
              <span>{activeAccount.name}</span>
              <ArrowDropDownRounded sx={{ fontSize: 18, color: 'text.secondary', ml: -0.5 }} />
            </Box>
          </Tooltip>
        )}

        {/* Date Badge with Dropdown (Click to switch Today / Yesterday / Custom) */}
        <Tooltip title="Nhấp để đổi ngày giao dịch">
          <Box
            onClick={e => setDateMenuAnchor(e.currentTarget)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              px: 1.25,
              py: 0.5,
              borderRadius: '4px',
              bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'background.paper'),
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              fontSize: '0.82rem',
              fontWeight: 650,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'primary.main'
              }
            }}
          >
            <CalendarTodayRounded sx={{ fontSize: 14 }} />
            <span>{parsed.date === todayKey() ? `Hôm nay (${parsed.date})` : parsed.date === yesterdayDate() ? `Hôm qua (${parsed.date})` : parsed.date}</span>
            <ArrowDropDownRounded sx={{ fontSize: 18, color: 'text.secondary', ml: -0.5 }} />
          </Box>
        </Tooltip>

        {/* Ticker Badge if Invest */}
        {parsed.ticker && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              px: 1.25,
              py: 0.5,
              borderRadius: '4px',
              bgcolor: 'rgba(37, 99, 235, 0.15)',
              color: '#2563EB',
              border: '1px solid rgba(37, 99, 235, 0.35)',
              fontSize: '0.82rem',
              fontWeight: 800
            }}
          >
            <AssetLogoBadge symbol={parsed.ticker} name={parsed.ticker} size="small" />
            <span>{parsed.ticker} ({parsed.quantity || 1} cp)</span>
          </Box>
        )}
      </Box>

      {/* Category Dropdown Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={() => setCategoryMenuAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: '6px', minWidth: 200, maxHeight: 300 } } }}
      >
        {categories
          .filter(c => (entryType === 'invest' ? true : c.type === entryType))
          .map(c => (
            <MenuItem
              key={c.id}
              selected={c.id === parsed.categoryKey}
              onClick={() => {
                setCustomCategory({ key: c.id, name: c.name });
                setCategoryMenuAnchor(null);
              }}
              sx={{ fontSize: 13, fontWeight: 600, py: 0.75 }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CategoryAvatarBadge categoryId={c.id} categoryName={c.name} txType={c.type} />
              </ListItemIcon>
              <ListItemText
                primary={c.name}
                sx={{ '& .MuiListItemText-primary': { fontSize: 13, fontWeight: 600 } }}
              />
            </MenuItem>
          ))}
      </Menu>

      {/* Account Dropdown Menu */}
      <Menu
        anchorEl={accountMenuAnchor}
        open={Boolean(accountMenuAnchor)}
        onClose={() => setAccountMenuAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: '6px', minWidth: 200, maxHeight: 300 } } }}
      >
        {accounts.map(a => (
          <MenuItem
            key={a.id}
            selected={a.id === activeAccount?.id}
            onClick={() => {
              setCustomAccountId(a.id);
              setAccountMenuAnchor(null);
            }}
            sx={{ fontSize: 13, fontWeight: 600, py: 0.75 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <BankLogoBadge accountName={a.name} accountType={a.type} size="small" />
            </ListItemIcon>
            <ListItemText
              primary={a.name}
              secondary={money(a.openingBalance || 0)}
              sx={{ '& .MuiListItemText-primary': { fontSize: 13, fontWeight: 600 } }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Date Dropdown Menu */}
      <Menu
        anchorEl={dateMenuAnchor}
        open={Boolean(dateMenuAnchor)}
        onClose={() => setDateMenuAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: '6px', minWidth: 160 } } }}
      >
        <MenuItem
          onClick={() => {
            setCustomDate(todayKey());
            setDateMenuAnchor(null);
          }}
          selected={parsed.date === todayKey()}
          sx={{ fontSize: 13, fontWeight: 600 }}
        >
          Hôm nay ({todayKey()})
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCustomDate(yesterdayDate());
            setDateMenuAnchor(null);
          }}
          selected={parsed.date === yesterdayDate()}
          sx={{ fontSize: 13, fontWeight: 600 }}
        >
          Hôm qua ({yesterdayDate()})
        </MenuItem>
      </Menu>

      {/* 4. 1-Tap Quick Amount Buttons: Instantly fills input & updates amount */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: '0.78rem',
            mr: 0.5,
            userSelect: 'none'
          }}
        >
          Chọn nhanh số tiền:
        </Typography>

        {QUICK_AMOUNTS.map(chip => (
          <Chip
            key={chip.label}
            label={chip.label}
            clickable
            size="small"
            variant="outlined"
            onClick={() => handleApplyQuickAmount(chip.value, chip.label)}
            sx={{
              borderRadius: '4px', // Strictly 4px inner
              px: 1.2,
              py: 0.6,
              fontSize: '0.8rem',
              fontWeight: 750,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: theme =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.14)',
              bgcolor: theme =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              color: 'text.primary',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: activeColor,
                color: '#FFFFFF',
                borderColor: activeColor,
                transform: 'translateY(-1px)',
                boxShadow: `0 2px 6px ${activeColor}44`
              },
              '&:active': {
                transform: 'scale(0.96)'
              }
            }}
          />
        ))}
      </Box>
    </Paper>
  );
}
