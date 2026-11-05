import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import {
  Search,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  ReceiptText,
  UploadCloud,
  X,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  List,
  LayoutGrid,
  RotateCcw
} from 'lucide-react';
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';

import { useFinance } from '../../store';
import { balance, dateLabel, downloadCsv, money, uid, todayKey } from '../../lib/finance';
import { Confirm, Empty, PageHead } from '../../components/ui';
import { HelpButton } from '../../components/HelpButton';
import { ItemActionMenu } from '../../components/ItemActionMenu';
import {
  MuiTextField,
  MuiCurrencyInput,
  MuiSelect,
  MuiDatePicker,
  MuiTransactionTypeToggle
} from '../../components/mui/MuiInputs';
import { BankLogoBadge, CategoryAvatarBadge } from '../../lib/brandBadges';
import { SmartQuickEntry } from '../../components/SmartQuickEntry';
import { TransactionManagerCRUD } from '../../components/TransactionManagerCRUD';
import type { Transaction, TxType } from '../../types';

type FormValues = {
  name: string;
  amount: string;
  type: TxType;
  categoryId: string;
  accountId: string;
  toAccountId: string;
  date: string;
  method: string;
  note: string;
  status: 'completed' | 'pending';
};

const schema = z.object({
  name: z.string().trim().min(2, 'Tên cần ít nhất 2 ký tự'),
  amount: z.coerce.number<number>().int().positive('Số tiền phải lớn hơn 0'),
  date: z.string().min(1, 'Vui lòng chọn ngày')
});

export const SAMPLE_RECEIPTS = [
  {
    name: 'Hóa đơn Siêu thị VinMart',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="420" viewBox="0 0 320 420" fill="%23fff"><rect width="320" height="420" fill="%23fafafa" stroke="%23e5e7eb" stroke-width="2"/><text x="160" y="40" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="%23111">VINMART DAILY</text><text x="160" y="60" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%23666">HOA DON THANH TOAN</text><line x1="20" y1="80" x2="300" y2="80" stroke="%23ccc" stroke-dasharray="4"/><text x="20" y="110" font-family="sans-serif" font-size="12" fill="%23333">1. Sua tuoi Vinamilk</text><text x="300" y="110" font-family="sans-serif" font-size="12" text-anchor="end" fill="%23333">38,000</text><text x="20" y="140" font-family="sans-serif" font-size="12" fill="%23333">2. Banh mi sandwich</text><text x="300" y="140" font-family="sans-serif" font-size="12" text-anchor="end" fill="%23333">24,000</text><text x="20" y="170" font-family="sans-serif" font-size="12" fill="%23333">3. Tao Envy My (1kg)</text><text x="300" y="170" font-family="sans-serif" font-size="12" text-anchor="end" fill="%23333">188,000</text><line x1="20" y1="200" x2="300" y2="200" stroke="%23ccc"/><text x="20" y="230" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23111">TONG CONG:</text><text x="300" y="230" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="end" fill="%23e11d48">250,000 VND</text><text x="160" y="270" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%23888">Da thanh toan qua The VCB</text><rect x="110" y="300" width="100" height="80" fill="%23eee"/><text x="160" y="345" font-family="sans-serif" font-size="10" text-anchor="middle" fill="%23666">[ QR CODE ]</text></svg>'
  },
  {
    name: 'Biên lai Chuyển khoản Techcombank',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="420" viewBox="0 0 320 420" fill="%23fff"><rect width="320" height="420" fill="%23f8fafc" stroke="%23e2e8f0" stroke-width="2"/><rect width="320" height="60" fill="%23dc2626"/><text x="160" y="38" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="%23fff">TECHCOMBANK</text><text x="160" y="95" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="%23059669">CHUYEN KHOAN THANH CONG</text><text x="160" y="135" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="%23111">18,500,000 VND</text><line x1="20" y1="160" x2="300" y2="160" stroke="%23e2e8f0"/><text x="20" y="190" font-family="sans-serif" font-size="11" fill="%2364748b">Nguoi thu huong:</text><text x="300" y="190" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="end" fill="%231e293b">DUONG VAN MANH</text><text x="20" y="220" font-family="sans-serif" font-size="11" fill="%2364748b">Ngan hang:</text><text x="300" y="220" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="end" fill="%231e293b">Techcombank</text><text x="20" y="250" font-family="sans-serif" font-size="11" fill="%2364748b">Noi dung:</text><text x="300" y="250" font-family="sans-serif" font-size="12" text-anchor="end" fill="%231e293b">Cong ty ABC tra luong T10</text><rect x="40" y="310" width="240" height="60" rx="8" fill="%23fee2e2"/><text x="160" y="345" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="%23dc2626">Ma GD: FT26306899120</text></svg>'
  }
];

export default function Transactions() {
  const data = useFinance(s => s.data)!;
  const update = useFinance(s => s.update);

  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [open, setOpen] = useState(params.get('add') === '1');

  // Submenu tabs: 'ledger' (Sổ giao dịch CRUD) vs 'timeline' (Dòng thời gian & Hóa đơn)
  const activeSubTab = (params.get('tab') as 'ledger' | 'timeline') || 'ledger';

  const handleSubTabChange = (newTab: 'ledger' | 'timeline') => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    });
  };

  // View mode: 'timeline' (revolutionary feed) vs 'table' (classic grid)
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Filters
  const [search, setSearch] = useState(params.get('search') || '');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [account, setAccount] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [formError, setFormError] = useState('');

  const defaults: FormValues = {
    name: '',
    amount: '',
    type: 'expense',
    categoryId: 'food',
    accountId: data.accounts[0]?.id || '',
    toAccountId: '',
    date: todayKey(),
    method: 'Chuyển khoản',
    note: '',
    status: 'completed'
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    defaultValues: defaults
  });

  const formType = watch('type');

  useEffect(() => {
    if (params.get('add') === '1') setOpen(true);
    if (params.has('search')) {
      setSearch(params.get('search') || '');
      setPage(0);
    }
  }, [params]);

  const close = () => {
    setOpen(false);
    setEditing(null);
    setReceiptUrl('');
    setFormError('');
    setParams({});
  };

  const startEdit = (t: Transaction) => {
    setEditing(t);
    setReceiptUrl(t.receiptUrl || '');
    reset({
      name: t.name,
      amount: String(t.amount),
      type: t.type,
      categoryId: t.categoryId || 'food',
      accountId: t.accountId,
      toAccountId: t.toAccountId || '',
      date: t.date,
      method: t.method,
      note: t.note || '',
      status: t.status
    });
    setOpen(true);
  };

  const filtered = useMemo(
    () =>
      data.transactions
        .filter(
          t =>
            (t.name + ' ' + t.note).toLowerCase().includes(search.toLowerCase()) &&
            (type === 'all' || t.type === type) &&
            (category === 'all' || t.categoryId === category) &&
            (account === 'all' || t.accountId === account || t.toAccountId === account) &&
            (!from || t.date >= from) &&
            (!to || t.date <= to)
        )
        .sort((a, b) =>
          sort === 'old'
            ? a.date.localeCompare(b.date)
            : sort === 'high'
            ? b.amount - a.amount
            : sort === 'low'
            ? a.amount - b.amount
            : b.date.localeCompare(a.date)
        ),
    [data.transactions, search, type, category, account, from, to, sort]
  );

  // Executive KPI summary based on filtered transactions
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const t of filtered) {
      if (t.type === 'income') {
        income += t.amount;
        incomeCount++;
      } else if (t.type === 'expense') {
        expense += t.amount;
        expenseCount++;
      }
    }

    return {
      income,
      expense,
      net: income - expense,
      incomeCount,
      expenseCount,
      totalCount: filtered.length
    };
  }, [filtered]);

  // Count transactions per type matching current query and context
  const typeCounts = useMemo(() => {
    let all = 0;
    let expense = 0;
    let income = 0;
    let transfer = 0;

    for (const t of data.transactions) {
      const matchSearch = !search || (t.name + ' ' + t.note).toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || t.categoryId === category;
      const matchAcc = account === 'all' || t.accountId === account || t.toAccountId === account;
      const matchFrom = !from || t.date >= from;
      const matchTo = !to || t.date <= to;

      if (matchSearch && matchCat && matchAcc && matchFrom && matchTo) {
        all++;
        if (t.type === 'expense') expense++;
        else if (t.type === 'income') income++;
        else if (t.type === 'transfer') transfer++;
      }
    }

    return { all, expense, income, transfer };
  }, [data.transactions, search, category, account, from, to]);

  const paginatedList = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  // Group paginated transactions by Date for Timeline view
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of paginatedList) {
      const list = map.get(t.date) || [];
      list.push(t);
      map.set(t.date, list);
    }
    return Array.from(map.entries());
  }, [paginatedList]);

  const save = handleSubmit(async values => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message || 'Dữ liệu chưa hợp lệ');
      return;
    }
    if (values.type === 'transfer' && (!values.toAccountId || values.toAccountId === values.accountId)) {
      setFormError('Chọn tài khoản nhận khác tài khoản gửi');
      return;
    }

    const selectedCategory =
      data.categories.find(c => c.id === values.categoryId && c.type === values.type && !c.hidden)?.id ||
      data.categories.find(c => c.type === values.type && !c.hidden)?.id;

    if (values.type !== 'transfer' && !selectedCategory) {
      setFormError('Vui lòng chọn danh mục hợp lệ');
      return;
    }

    const tx: Transaction = {
      id: editing?.id || uid(),
      name: values.name.trim(),
      amount: parsed.data.amount,
      type: values.type,
      categoryId: values.type === 'transfer' ? undefined : selectedCategory,
      accountId: values.accountId,
      toAccountId: values.type === 'transfer' ? values.toAccountId : undefined,
      date: values.date,
      method: values.method,
      note: values.note || '',
      status: values.status,
      receiptUrl: receiptUrl || undefined
    };

    await update(
      d => ({
        ...d,
        transactions: editing
          ? d.transactions.map(t => (t.id === editing.id ? tx : t))
          : [tx, ...d.transactions]
      }),
      editing ? 'Đã cập nhật giao dịch' : 'Đã thêm giao dịch mới'
    );

    close();
    reset(defaults);
  });

  const exportRows = [
    ['ID', 'Tên', 'Số tiền', 'Loại', 'Danh mục', 'Tài khoản', 'Ngày', 'Phương thức', 'Ghi chú', 'Trạng thái'],
    ...filtered.map(t => [
      t.id,
      t.name,
      t.amount,
      t.type,
      data.categories.find(c => c.id === t.categoryId)?.name || '',
      data.accounts.find(a => a.id === t.accountId)?.name || '',
      t.date,
      t.method,
      t.note,
      t.status
    ])
  ];

  return (
    <>
      <PageHead
        eyebrow="DÒNG TIỀN & SỔ GIAO DỊCH"
        title="Quản lý giao dịch"
        subtitle={`Theo dõi và đối soát ${data.transactions.length} giao dịch trong sổ tài chính cá nhân`}
        actions={
          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap' }}>
            <HelpButton pageKey="transactions" />
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Download size={14} />}
              onClick={() => downloadCsv('finora-giao-dich.csv', exportRows)}
              sx={{ fontWeight: 600, fontSize: 13 }}
            >
              Xuất CSV
            </Button>
            <Button
              id="tour-tx-add-btn"
              variant="contained"
              color="primary"
              startIcon={<Plus size={15} />}
              onClick={() => {
                reset(defaults);
                setEditing(null);
                setOpen(true);
              }}
              sx={{ fontWeight: 700, fontSize: 13 }}
            >
              Thêm giao dịch
            </Button>
          </Box>
        }
      />

      {/* Submenu Navigation: Sổ giao dịch (CRUD) vs Dòng thời gian & Hóa đơn */}
      <Box id="tour-tx-subtabs" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs
          value={activeSubTab}
          onChange={(_, v) => handleSubTabChange(v)}
          sx={{
            minHeight: 42,
            '& .MuiTab-root': {
              minHeight: 42,
              py: 0.5,
              px: { xs: 1.5, sm: 2.5 },
              fontWeight: 800,
              fontSize: { xs: '0.8rem', sm: '0.88rem' },
              textTransform: 'none'
            }
          }}
        >
          <Tab
            value="ledger"
            label="Sổ giao dịch (Quản lý CRUD)"
            icon={<List size={16} />}
            iconPosition="start"
          />
          <Tab
            value="timeline"
            label="Dòng thời gian & Hóa đơn"
            icon={<Calendar size={16} />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Smart NLP Quick Entry Bar */}
      <Box id="tour-tx-quick-bar" sx={{ mb: 3 }}>
        <SmartQuickEntry />
      </Box>

      {/* SUBMENU 1: Full CRUD Transaction Manager Table & Filters */}
      {activeSubTab === 'ledger' && (
        <Box id="tour-tx-table" sx={{ mb: 3 }}>
          <TransactionManagerCRUD />
        </Box>
      )}

      {/* SUBMENU 2: 3D Debossed Flow Summary Bento & Interactive Timeline Feed */}
      {activeSubTab === 'timeline' && (
        <>
          {/* 3D Debossed Executive Flow Summary Bento */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 3
            }}
          >
        {/* Total Inflow */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 104,
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: 'var(--border-strong)' }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 11.5 }}>
              Tổng thu vào
            </Typography>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'rgba(21, 150, 107, 0.12)',
                color: 'var(--accent-income)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TrendingUp size={15} />
            </Box>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                fontSize: { xs: 16, sm: 19 },
                color: 'var(--accent-income)',
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              +{money(summary.income)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
              {summary.incomeCount} khoản thu đã ghi
            </Typography>
          </Box>
        </Box>

        {/* Total Outflow */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 104,
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: 'var(--border-strong)' }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 11.5 }}>
              Tổng chi tiêu
            </Typography>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'rgba(214, 91, 88, 0.12)',
                color: 'var(--accent-expense)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TrendingDown size={15} />
            </Box>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                fontSize: { xs: 16, sm: 19 },
                color: 'var(--accent-expense)',
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              -{money(summary.expense)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
              {summary.expenseCount} khoản chi tiêu
            </Typography>
          </Box>
        </Box>

        {/* Net Cashflow */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 104,
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: 'var(--border-strong)' }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 11.5 }}>
              Dòng tiền ròng
            </Typography>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: summary.net >= 0 ? 'rgba(21, 150, 107, 0.12)' : 'rgba(214, 91, 88, 0.12)',
                color: summary.net >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Scale size={15} />
            </Box>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                fontSize: { xs: 16, sm: 19 },
                color: summary.net >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)',
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {summary.net >= 0 ? '+' : ''}
              {money(summary.net)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
              {summary.net >= 0 ? 'Thặng dư tài chính' : 'Thâm hụt dòng tiền'}
            </Typography>
          </Box>
        </Box>

        {/* Activity & Filter Count */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 104,
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: 'var(--border-strong)' }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 11.5 }}>
              Khối lượng giao dịch
            </Typography>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'rgba(78, 123, 197, 0.12)',
                color: 'var(--accent-info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ReceiptText size={15} />
            </Box>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                fontSize: { xs: 16, sm: 19 },
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {summary.totalCount} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>mục</span>
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
              {filtered.length === data.transactions.length ? 'Toàn bộ sổ giao dịch' : 'Khớp bộ lọc hiện tại'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Filter and View Mode Control Center */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.25 },
          mb: 3,
          borderRadius: '6px',
          bgcolor: 'background.paper',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        {/* Row 1: Search Bar + Segmented Type Switcher + View Mode Toggle */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', lg: 'center' },
            gap: 2,
            mb: 2
          }}
        >
          {/* Search Box */}
          <Box sx={{ flex: 1, minWidth: { xs: '100%', lg: 320 }, maxWidth: { lg: 420 } }}>
            <MuiTextField
              placeholder="Tìm theo tên, ghi chú, đối tác..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: <Search size={16} style={{ marginRight: 8, color: 'var(--text-muted)' }} />,
                  endAdornment: search ? (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearch('');
                        setPage(0);
                      }}
                      sx={{ p: 0.5, color: 'text.secondary' }}
                    >
                      <X size={14} />
                    </IconButton>
                  ) : null
                }
              }}
            />
          </Box>

          {/* Right Toolbar: Segmented Type Filter + View Mode Switcher */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: { xs: 'space-between', sm: 'flex-start', lg: 'flex-end' },
              gap: 1.5
            }}
          >
            {/* Unified Segmented Type Control (Linear / iOS Style) */}
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, next) => {
                if (next) {
                  setType(next);
                  setPage(0);
                }
              }}
              size="small"
              sx={{
                bgcolor: 'action.hover',
                p: 0.5,
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                overflowX: 'auto',
                maxWidth: '100%',
                '& .MuiToggleButtonGroup-grouped': {
                  border: 'none',
                  borderRadius: '6px !important',
                  mx: 0.25,
                  px: { xs: 1.25, sm: 1.75 },
                  py: 0.6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'action.selected',
                    color: 'text.primary'
                  },
                  '&.Mui-selected': {
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    fontWeight: 750,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.06)'
                  }
                }
              }}
            >
              <ToggleButton value="all">
                Tất cả
                <Box
                  component="span"
                  sx={{
                    ml: 0.75,
                    px: 0.75,
                    py: 0.1,
                    borderRadius: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: type === 'all' ? 'action.hover' : 'transparent',
                    color: type === 'all' ? 'text.primary' : 'text.secondary',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {typeCounts.all}
                </Box>
              </ToggleButton>
              <ToggleButton value="expense">
                <Box
                  component="span"
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'var(--accent-expense)',
                    mr: 0.75,
                    display: 'inline-block'
                  }}
                />
                Chi tiêu
                <Box
                  component="span"
                  sx={{
                    ml: 0.75,
                    px: 0.75,
                    py: 0.1,
                    borderRadius: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: type === 'expense' ? 'rgba(214, 91, 88, 0.12)' : 'transparent',
                    color: type === 'expense' ? 'var(--accent-expense)' : 'text.secondary',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {typeCounts.expense}
                </Box>
              </ToggleButton>
              <ToggleButton value="income">
                <Box
                  component="span"
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'var(--accent-income)',
                    mr: 0.75,
                    display: 'inline-block'
                  }}
                />
                Thu nhập
                <Box
                  component="span"
                  sx={{
                    ml: 0.75,
                    px: 0.75,
                    py: 0.1,
                    borderRadius: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: type === 'income' ? 'rgba(21, 150, 107, 0.12)' : 'transparent',
                    color: type === 'income' ? 'var(--accent-income)' : 'text.secondary',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {typeCounts.income}
                </Box>
              </ToggleButton>
              <ToggleButton value="transfer">
                <Box
                  component="span"
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'var(--accent-transfer)',
                    mr: 0.75,
                    display: 'inline-block'
                  }}
                />
                Chuyển khoản
                <Box
                  component="span"
                  sx={{
                    ml: 0.75,
                    px: 0.75,
                    py: 0.1,
                    borderRadius: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: type === 'transfer' ? 'rgba(78, 123, 197, 0.12)' : 'transparent',
                    color: type === 'transfer' ? 'var(--accent-transfer)' : 'text.secondary',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {typeCounts.transfer}
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* View Mode Toggle: Timeline vs Table */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, next) => {
                if (next) setViewMode(next);
              }}
              size="small"
              sx={{
                bgcolor: 'action.hover',
                borderRadius: '4px',
                p: 0.35,
                border: '1px solid var(--border-subtle)',
                '& .MuiToggleButtonGroup-grouped': {
                  border: 'none',
                  borderRadius: '5px !important',
                  px: 1.25,
                  py: 0.5,
                  fontSize: 12,
                  fontWeight: 650,
                  textTransform: 'none',
                  gap: 0.75,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'background.paper',
                    color: 'var(--brand-primary)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }
                }
              }}
            >
              <Tooltip title="Chế độ dòng thời gian">
                <ToggleButton value="timeline">
                  <List size={15} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Dòng thời gian</Box>
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Chế độ bảng dữ liệu">
                <ToggleButton value="table">
                  <LayoutGrid size={15} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Bảng</Box>
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Row 2: Secondary Dropdown Filters (Category, Account, Sort, Date Pickers) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(5, 1fr)'
            },
            gap: 1.5,
            pt: 1.75,
            borderTop: '1px solid var(--border-subtle)',
            alignItems: 'center'
          }}
        >
          <MuiSelect
            label="Danh mục"
            value={category}
            onChange={val => {
              setCategory(val);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'Tất cả danh mục' },
              ...data.categories.map(c => ({ value: c.id, label: c.name }))
            ]}
          />

          <MuiSelect
            label="Tài khoản"
            value={account}
            onChange={val => {
              setAccount(val);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'Tất cả tài khoản' },
              ...data.accounts.map(a => ({
                value: a.id,
                label: a.name,
                subtitle: `${money(balance(a, data.transactions))}`
              }))
            ]}
          />

          <MuiSelect
            label="Sắp xếp"
            value={sort}
            onChange={val => setSort(val)}
            options={[
              { value: 'new', label: 'Mới nhất trước' },
              { value: 'old', label: 'Cũ nhất trước' },
              { value: 'high', label: 'Số tiền giảm dần' },
              { value: 'low', label: 'Số tiền tăng dần' }
            ]}
          />

          <MuiDatePicker
            label="Từ ngày"
            value={from}
            onChange={val => {
              setFrom(val);
              setPage(0);
            }}
          />

          <MuiDatePicker
            label="Đến ngày"
            value={to}
            onChange={val => {
              setTo(val);
              setPage(0);
            }}
          />
        </Box>

        {/* Row 3: Active Filters Summary & Quick Reset */}
        {(from || to || search || type !== 'all' || category !== 'all' || account !== 'all' || sort !== 'new') && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1.5,
              mt: 2,
              pt: 1.5,
              borderTop: '1px dashed var(--border-subtle)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: 11.5 }}>
                Đang lọc:
              </Typography>
              {search && (
                <Chip
                  size="small"
                  label={`Tìm kiếm: "${search}"`}
                  onDelete={() => setSearch('')}
                  sx={{ fontSize: 11, height: 24, bgcolor: 'action.hover' }}
                />
              )}
              {type !== 'all' && (
                <Chip
                  size="small"
                  label={`Loại: ${type === 'expense' ? 'Chi tiêu' : type === 'income' ? 'Thu nhập' : 'Chuyển khoản'}`}
                  onDelete={() => setType('all')}
                  sx={{ fontSize: 11, height: 24, bgcolor: 'action.hover' }}
                />
              )}
              {category !== 'all' && (
                <Chip
                  size="small"
                  label={`Danh mục: ${data.categories.find(c => c.id === category)?.name || category}`}
                  onDelete={() => setCategory('all')}
                  sx={{ fontSize: 11, height: 24, bgcolor: 'action.hover' }}
                />
              )}
              {account !== 'all' && (
                <Chip
                  size="small"
                  label={`Tài khoản: ${data.accounts.find(a => a.id === account)?.name || account}`}
                  onDelete={() => setAccount('all')}
                  sx={{ fontSize: 11, height: 24, bgcolor: 'action.hover' }}
                />
              )}
              {(from || to) && (
                <Chip
                  size="small"
                  label={`Thời gian: ${from || '...'} → ${to || '...'}`}
                  onDelete={() => {
                    setFrom('');
                    setTo('');
                  }}
                  sx={{ fontSize: 11, height: 24, bgcolor: 'action.hover' }}
                />
              )}
            </Box>

            <Button
              size="small"
              color="inherit"
              startIcon={<RotateCcw size={13} />}
              onClick={() => {
                setSearch('');
                setType('all');
                setCategory('all');
                setAccount('all');
                setFrom('');
                setTo('');
                setSort('new');
                setPage(0);
              }}
              sx={{
                fontSize: 12,
                textTransform: 'none',
                color: 'text.secondary',
                fontWeight: 650,
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </Box>
        )}
      </Paper>

      {/* Main Content Area */}
      {paginatedList.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 5,
            borderRadius: '6px',
            textAlign: 'center',
            background: 'var(--card-inset-bg)',
            boxShadow: 'var(--card-inset-shadow)'
          }}
        >
          <Empty text="Không tìm thấy giao dịch nào phù hợp với bộ lọc. Hãy thử điều chỉnh điều kiện tìm kiếm hoặc thêm mới." />
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus size={15} />}
            onClick={() => {
              reset(defaults);
              setEditing(null);
              setOpen(true);
            }}
            sx={{ mt: 2 }}
          >
            Thêm giao dịch mới
          </Button>
        </Paper>
      ) : viewMode === 'timeline' ? (
        /* REVOLUTIONARY TIMELINE FEED VIEW */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {groupedByDate.map(([dateStr, txList]) => {
            // Day net flow
            let dayIncome = 0;
            let dayExpense = 0;
            for (const t of txList) {
              if (t.type === 'income') dayIncome += t.amount;
              else if (t.type === 'expense') dayExpense += t.amount;
            }
            const dayNet = dayIncome - dayExpense;

            return (
              <Box key={dateStr} sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {/* Date Group Header Banner */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1,
                    py: 0.5
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={15} style={{ color: 'var(--brand-primary)' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13.5, color: 'text.primary' }}>
                      {dateLabel(dateStr)}
                    </Typography>
                    <Chip
                      label={`${txList.length} giao dịch`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        bgcolor: 'action.hover',
                        color: 'text.secondary'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {dayIncome > 0 && (
                      <Typography variant="caption" sx={{ color: 'var(--accent-income)', fontWeight: 700 }}>
                        +{money(dayIncome)}
                      </Typography>
                    )}
                    {dayExpense > 0 && (
                      <Typography variant="caption" sx={{ color: 'var(--accent-expense)', fontWeight: 700 }}>
                        -{money(dayExpense)}
                      </Typography>
                    )}
                    {(dayIncome > 0 || dayExpense > 0) && (
                      <Chip
                        label={`Ròng: ${dayNet >= 0 ? '+' : ''}${money(dayNet)}`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 800,
                          bgcolor: dayNet >= 0 ? 'rgba(21, 150, 107, 0.1)' : 'rgba(214, 91, 88, 0.1)',
                          color: dayNet >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Day's Transaction Items */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {txList.map(t => {
                    const cat = data.categories.find(c => c.id === t.categoryId);
                    const acc = data.accounts.find(a => a.id === t.accountId);
                    const toAcc = t.toAccountId ? data.accounts.find(a => a.id === t.toAccountId) : null;
                    const isInstallment =
                      t.name.toLowerCase().includes('trả góp') || (t.note && t.note.toLowerCase().includes('trả góp'));

                    return (
                      <Paper
                        key={t.id}
                        variant="outlined"
                        sx={{
                          p: { xs: 1.75, sm: 2 },
                          borderRadius: '6px',
                          background: 'var(--card-inset-bg)',
                          boxShadow: 'var(--card-inset-shadow)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: { xs: 1.5, sm: 2 },
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            borderColor: 'var(--border-strong)',
                            transform: 'translateX(2px)'
                          }
                        }}
                      >
                        {/* Left: Category Avatar & Details */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0, flex: 1 }}>
                          <CategoryAvatarBadge categoryId={t.categoryId} categoryName={cat?.name} txType={t.type} />
                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: { xs: 13.5, sm: 14.5 },
                                  color: 'text.primary',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {t.name}
                              </Typography>
                              {isInstallment && (
                                <Chip
                                  label="Trả góp"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    bgcolor: 'rgba(180, 83, 9, 0.12)',
                                    color: '#b45309'
                                  }}
                                />
                              )}
                              <Chip
                                label={cat?.name || 'Chuyển khoản'}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 20,
                                  fontSize: 10.5,
                                  fontWeight: 650,
                                  display: { xs: 'none', sm: 'inline-flex' }
                                }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                              <BankLogoBadge accountName={acc?.name} accountType={acc?.type} size="small" />
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
                                {acc?.name}
                              </Typography>
                              {toAcc && (
                                <>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
                                  <BankLogoBadge accountName={toAcc.name} accountType={toAcc.type} size="small" />
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
                                    {toAcc.name}
                                  </Typography>
                                </>
                              )}
                              <span style={{ color: 'var(--border-strong)', fontSize: 11 }}>•</span>
                              <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: 11 }}>
                                {t.method}
                              </Typography>
                            </Box>

                            {t.note && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'var(--text-muted)',
                                  fontSize: 11.5,
                                  display: 'block',
                                  mt: 0.25,
                                  fontStyle: 'italic'
                                }}
                              >
                                {t.note}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Right: Amount, Status, Receipt Pill, Actions */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 900,
                                fontSize: { xs: 14.5, sm: 16.5 },
                                letterSpacing: '-0.02em',
                                fontFeatureSettings: '"tnum"',
                                fontVariantNumeric: 'tabular-nums',
                                color:
                                  t.type === 'income'
                                    ? 'var(--accent-income)'
                                    : t.type === 'expense'
                                    ? 'var(--accent-expense)'
                                    : 'var(--accent-info)'
                              }}
                            >
                              {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                              {money(t.amount)}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.25 }}>
                              <Chip
                                label={t.status === 'completed' ? 'Hoàn tất' : 'Chờ'}
                                size="small"
                                color={t.status === 'completed' ? 'success' : 'warning'}
                                variant="outlined"
                                sx={{ height: 18, fontSize: 9.5, fontWeight: 700 }}
                              />
                            </Box>
                          </Box>

                          {/* Receipt button if present */}
                          {t.receiptUrl && (
                            <Tooltip title="Xem hóa đơn / chứng từ">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => setViewingReceipt(t.receiptUrl || null)}
                                sx={{
                                  bgcolor: 'rgba(5, 150, 105, 0.1)',
                                  border: '1px solid rgba(5, 150, 105, 0.25)',
                                  width: 32,
                                  height: 32
                                }}
                              >
                                <ReceiptText size={16} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Quick Action Menu */}
                          <ItemActionMenu
                            ariaLabel={`Thao tác giao dịch ${t.name}`}
                            items={[
                              {
                                label: 'Xem chi tiết',
                                icon: <Eye size={15} />,
                                onClick: () => setDetail(t)
                              },
                              {
                                label: 'Chỉnh sửa giao dịch',
                                icon: <Pencil size={15} />,
                                onClick: () => startEdit(t)
                              },
                              {
                                label: 'Xóa giao dịch',
                                icon: <Trash2 size={15} />,
                                color: 'error' as const,
                                onClick: () => setDeleting(t)
                              }
                            ]}
                          />
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        /* DATA GRID / TABLE VIEW */
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            borderRadius: '6px',
            overflow: 'hidden',
            background: 'var(--card-inset-bg)',
            boxShadow: 'var(--card-inset-shadow)'
          }}
        >
          {/* Desktop Table */}
          <Table size="small" sx={{ display: { xs: 'none', md: 'table' } }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Giao dịch</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Danh mục</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tài khoản</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Ngày</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>
                  Số tiền
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedList.map(t => {
                const cat = data.categories.find(c => c.id === t.categoryId);
                const acc = data.accounts.find(a => a.id === t.accountId);
                const toAcc = t.toAccountId ? data.accounts.find(a => a.id === t.toAccountId) : null;
                const isInstallment =
                  t.name.toLowerCase().includes('trả góp') || (t.note && t.note.toLowerCase().includes('trả góp'));

                return (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CategoryAvatarBadge categoryId={t.categoryId} categoryName={cat?.name} txType={t.type} />
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {t.name}
                            </Typography>
                            {isInstallment && (
                              <Chip
                                label="Trả góp"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  bgcolor: 'rgba(180, 83, 9, 0.1)',
                                  color: '#b45309'
                                }}
                              />
                            )}
                          </Box>
                          {t.note && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 11.5 }}>
                              {t.note}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontSize: 13 }}>
                      <Chip
                        label={cat?.name || 'Chuyển khoản'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11, height: 22 }}
                      />
                    </TableCell>

                    <TableCell sx={{ fontSize: 13 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <BankLogoBadge accountName={acc?.name} accountType={acc?.type} size="small" />
                        <Typography variant="body2" sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                          {acc?.name}
                        </Typography>
                        {toAcc && (
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
                            <BankLogoBadge accountName={toAcc.name} accountType={toAcc.type} size="small" />
                            <Typography variant="body2" sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                              {toAcc.name}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      {dateLabel(t.date)}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={t.status === 'completed' ? 'Hoàn tất' : 'Chờ xử lý'}
                        size="small"
                        color={t.status === 'completed' ? 'success' : 'warning'}
                        variant="outlined"
                        sx={{ fontSize: 10.5, height: 20, fontWeight: 700 }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          fontFeatureSettings: '"tnum"',
                          fontVariantNumeric: 'tabular-nums',
                          color:
                            t.type === 'income'
                              ? 'var(--accent-income)'
                              : t.type === 'expense'
                              ? 'var(--accent-expense)'
                              : 'inherit'
                        }}
                      >
                        {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                        {money(t.amount)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                        {t.receiptUrl && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setViewingReceipt(t.receiptUrl || null)}
                            title="Xem hóa đơn / biên lai"
                          >
                            <ReceiptText size={15} />
                          </IconButton>
                        )}
                        <ItemActionMenu
                          ariaLabel={`Thao tác giao dịch ${t.name}`}
                          items={[
                            {
                              label: 'Xem chi tiết',
                              icon: <Eye size={15} />,
                              onClick: () => setDetail(t)
                            },
                            {
                              label: 'Chỉnh sửa giao dịch',
                              icon: <Pencil size={15} />,
                              onClick: () => startEdit(t)
                            },
                            {
                              label: 'Xóa giao dịch',
                              icon: <Trash2 size={15} />,
                              color: 'error' as const,
                              onClick: () => setDeleting(t)
                            }
                          ]}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Mobile Table Card Fallback */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 1.5 }}>
            {paginatedList.map(t => {
              const cat = data.categories.find(c => c.id === t.categoryId);
              const acc = data.accounts.find(a => a.id === t.accountId);
              const isInstallment =
                t.name.toLowerCase().includes('trả góp') || (t.note && t.note.toLowerCase().includes('trả góp'));

              return (
                <Box
                  key={t.id}
                  sx={{
                    p: 1.5,
                    borderRadius: '4px',
                    bgcolor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <CategoryAvatarBadge categoryId={t.categoryId} categoryName={cat?.name} txType={t.type} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 750 }}>
                          {t.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                          <BankLogoBadge accountName={acc?.name} accountType={acc?.type} size="small" />
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: 11 }}>
                            {acc?.name} · {dateLabel(t.date)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 850,
                        fontSize: 14,
                        fontFeatureSettings: '"tnum"',
                        fontVariantNumeric: 'tabular-nums',
                        color:
                          t.type === 'income'
                            ? 'var(--accent-income)'
                            : t.type === 'expense'
                            ? 'var(--accent-expense)'
                            : 'inherit'
                      }}
                    >
                      {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                      {money(t.amount)}
                    </Typography>
                  </Box>

                  {isInstallment && (
                    <Chip
                      label="Giao dịch trả góp thẻ"
                      size="small"
                      sx={{
                        alignSelf: 'flex-start',
                        height: 20,
                        fontSize: 10,
                        fontWeight: 750,
                        bgcolor: 'rgba(180, 83, 9, 0.1)',
                        color: '#b45309'
                      }}
                    />
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pt: 0.75,
                      borderTop: '1px solid var(--border-subtle)'
                    }}
                  >
                    {t.receiptUrl ? (
                      <Button
                        size="small"
                        variant="text"
                        color="primary"
                        startIcon={<ReceiptText size={13} />}
                        onClick={() => setViewingReceipt(t.receiptUrl || null)}
                        sx={{ fontSize: 11, minWidth: 0, px: 1, py: 0.25 }}
                      >
                        Biên lai
                      </Button>
                    ) : (
                      <span />
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setDetail(t)}
                        sx={{ fontSize: 11.5, minWidth: 0, px: 1, py: 0.25, color: 'text.secondary' }}
                      >
                        Chi tiết
                      </Button>
                      <ItemActionMenu
                        ariaLabel={`Thao tác giao dịch ${t.name}`}
                        items={[
                          {
                            label: 'Xem chi tiết',
                            icon: <Eye size={15} />,
                            onClick: () => setDetail(t)
                          },
                          {
                            label: 'Chỉnh sửa giao dịch',
                            icon: <Pencil size={15} />,
                            onClick: () => startEdit(t)
                          },
                          {
                            label: 'Xóa giao dịch',
                            icon: <Trash2 size={15} />,
                            color: 'error' as const,
                            onClick: () => setDeleting(t)
                          }
                        ]}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </TableContainer>
      )}

      {/* Pagination Bar */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 15, 25, 50]}
          labelRowsPerPage="Hiển thị:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên tổng ${count}`}
          sx={{
            '& .MuiTablePagination-toolbar': {
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-end' },
              px: { xs: 1, sm: 2 },
              minHeight: 52
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: { xs: 11, sm: 12.5 }
            }
          }}
        />
      </Box>
      </>
      )}

      {/* MUI Modal: Add / Edit Transaction (100% MUI, Zero native inputs) */}
      <Dialog
        open={open}
        onClose={close}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              m: { xs: 1, sm: 2 },
              width: { xs: 'calc(100% - 16px)', sm: 'auto' },
              borderRadius: '6px',
              maxHeight: 'calc(100% - 32px)'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18 }}>
          {editing ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {formError}
            </Alert>
          )}

          {/* Toggle Type */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <MuiTransactionTypeToggle
                value={field.value}
                onChange={val => field.onChange(val)}
              />
            )}
          />

          {/* Transaction Name */}
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Vui lòng nhập tên giao dịch' }}
            render={({ field }) => (
              <MuiTextField
                label="Tên giao dịch"
                placeholder="VD: Mua thực phẩm, Ăn trưa..."
                value={field.value}
                onChange={field.onChange}
                error={!!errors.name}
                helperText={errors.name?.message}
                autoFocus
              />
            )}
          />

          {/* Amount with Smart VND Denominations */}
          <Controller
            name="amount"
            control={control}
            rules={{ required: 'Vui lòng nhập số tiền' }}
            render={({ field }) => (
              <MuiCurrencyInput
                label="Số tiền (₫)"
                value={field.value}
                onChange={val => field.onChange(val)}
                error={!!errors.amount}
                helperText={errors.amount?.message}
              />
            )}
          />

          {/* Category Select (with color dot) */}
          {formType !== 'transfer' && (
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <MuiSelect
                  label="Danh mục"
                  value={field.value}
                  onChange={field.onChange}
                  options={data.categories
                    .filter(c => c.type === formType && !c.hidden)
                    .map(c => ({
                      value: c.id,
                      label: c.name,
                      icon: (
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: c.color,
                            flexShrink: 0
                          }}
                        />
                      )
                    }))}
                />
              )}
            />
          )}

          {/* Source Account (with balance) */}
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <MuiSelect
                label={formType === 'transfer' ? 'Tài khoản gửi' : 'Tài khoản thanh toán'}
                value={field.value}
                onChange={field.onChange}
                options={data.accounts
                  .filter(a => a.active)
                  .map(a => ({
                    value: a.id,
                    label: a.name,
                    subtitle: `Số dư: ${money(balance(a, data.transactions))}`
                  }))}
              />
            )}
          />

          {/* Target Account for Transfer */}
          {formType === 'transfer' && (
            <Controller
              name="toAccountId"
              control={control}
              render={({ field }) => (
                <MuiSelect
                  label="Tài khoản nhận"
                  value={field.value}
                  onChange={field.onChange}
                  options={data.accounts
                    .filter(a => a.active)
                    .map(a => ({
                      value: a.id,
                      label: a.name,
                      subtitle: `Số dư: ${money(balance(a, data.transactions))}`
                    }))}
                />
              )}
            />
          )}

          {/* Date Picker */}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <MuiDatePicker
                label="Ngày giao dịch"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          {/* Method & Status */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <MuiSelect
                  label="Phương thức"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'Chuyển khoản', label: 'Chuyển khoản' },
                    { value: 'Tiền mặt', label: 'Tiền mặt' },
                    { value: 'Ví điện tử', label: 'Ví điện tử' },
                    { value: 'Thẻ', label: 'Thẻ tín dụng / ghi nợ' }
                  ]}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <MuiSelect
                  label="Trạng thái"
                  value={field.value}
                  onChange={val => field.onChange(val as 'completed' | 'pending')}
                  options={[
                    { value: 'completed', label: 'Hoàn tất' },
                    { value: 'pending', label: 'Chờ xử lý' }
                  ]}
                />
              )}
            />
          </Box>

          {/* Note */}
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <MuiTextField
                label="Ghi chú (Tùy chọn)"
                placeholder="Ghi chú chi tiết về giao dịch..."
                value={field.value}
                onChange={field.onChange}
                multiline
                rows={2}
              />
            )}
          />

          {/* Receipt / Bill Attachment */}
          <Box sx={{ border: '1px dashed var(--border-subtle)', borderRadius: '6px', p: 2, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptText size={18} color="#059669" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Đính kèm hóa đơn / biên lai (Receipt)
                </Typography>
              </Box>
              {receiptUrl && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<X size={14} />}
                  onClick={() => setReceiptUrl('')}
                >
                  Gỡ ảnh
                </Button>
              )}
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Lưu trữ biên lai để đối soát chi tiêu khi cần. Tải ảnh từ máy hoặc chọn hóa đơn mẫu demo:
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5, alignItems: 'center' }}>
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<UploadCloud size={14} />}
              >
                Chọn ảnh từ máy
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        if (ev.target?.result) setReceiptUrl(ev.target.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </Button>

              {SAMPLE_RECEIPTS.map((s, idx) => (
                <Chip
                  key={idx}
                  label={s.name}
                  size="small"
                  onClick={() => setReceiptUrl(s.url)}
                  variant="outlined"
                  sx={{ cursor: 'pointer', fontSize: 11 }}
                />
              ))}
            </Box>

            {receiptUrl && (
              <Box
                sx={{
                  mt: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1,
                  borderRadius: '4px',
                  bgcolor: 'background.paper',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <img
                  src={receiptUrl}
                  alt="Biên lai đính kèm"
                  style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 4, background: '#fff' }}
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Đã đính kèm ảnh biên lai
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setViewingReceipt(receiptUrl)}
                    sx={{ p: 0, fontSize: 11, minWidth: 'auto', textTransform: 'none' }}
                  >
                    Xem phóng to
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={close} color="inherit">
            Hủy
          </Button>
          <Button variant="contained" color="primary" onClick={save} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu giao dịch'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              m: { xs: 1, sm: 2 },
              width: { xs: 'calc(100% - 16px)', sm: 'auto' },
              borderRadius: '4px'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Chi tiết giao dịch</DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Box sx={{ display: 'grid', gap: 1.5, fontSize: 13 }}>
              {[
                ['Tên giao dịch', detail.name],
                ['Số tiền', money(detail.amount)],
                ['Loại', detail.type === 'income' ? 'Thu nhập' : detail.type === 'expense' ? 'Chi tiêu' : 'Chuyển khoản'],
                ['Danh mục', data.categories.find(c => c.id === detail.categoryId)?.name || 'Chuyển khoản'],
                ['Tài khoản', data.accounts.find(a => a.id === detail.accountId)?.name || ''],
                ['Ngày', dateLabel(detail.date)],
                ['Phương thức', detail.method],
                ['Trạng thái', detail.status === 'completed' ? 'Hoàn tất' : 'Chờ xử lý'],
                ['Ghi chú', detail.note || '—']
              ].map(([k, v]) => (
                <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {k}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {v}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetail(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Confirm
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            await update(
              d => ({
                ...d,
                transactions: d.transactions.filter(t => t.id !== deleting.id)
              }),
              `Đã xóa giao dịch "${deleting.name}"`
            );
          }
        }}
        title="Xác nhận xóa giao dịch"
        message={`Xóa giao dịch “${deleting?.name || ''}”? Các chỉ số và số dư tài khoản sẽ được tính toán lại ngay lập tức.`}
      />

      {/* Receipt Preview Dialog */}
      <Dialog
        open={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              m: { xs: 1, sm: 2 },
              width: { xs: 'calc(100% - 16px)', sm: 'auto' },
              borderRadius: '4px'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Hóa đơn / Biên lai đối soát</span>
          <IconButton size="small" onClick={() => setViewingReceipt(null)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', p: 3, bgcolor: '#111317' }}>
          {viewingReceipt && (
            <img
              src={viewingReceipt}
              alt="Hóa đơn phóng to"
              style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '4px', background: '#fff' }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {viewingReceipt && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Download size={14} />}
              component="a"
              href={viewingReceipt}
              download="finora-receipt.svg"
            >
              Tải hóa đơn về máy
            </Button>
          )}
          <Button onClick={() => setViewingReceipt(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
