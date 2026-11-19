import { useMemo, useState } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays
} from 'date-fns';
import {
  Download,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Layers,
  Table as TableIcon,
  LayoutList,
  ArrowLeftRight,
  PiggyBank,
  BarChart3,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Box,
  Button,
  Paper,
  Chip,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';

import { useFinance } from '../../store';
import {
  downloadCsv,
  inRange,
  money,
  netWorth,
  netWorthAt,
  shortMoney,
  totals
} from '../../lib/finance';
import { Empty, PageHead } from '../../components/ui';
import { HelpButton } from '../../components/HelpButton';
import { FullscreenModal, FullscreenButton, FullscreenChartContent } from '../../components/ui/FullscreenModal';
import { canUsePeriodInReport, isProUser } from '../../lib/subscription';
import { MuiSelect, MuiDatePicker } from '../../components/mui/MuiInputs';
import { CategoryAvatarBadge } from '../../lib/brandBadges';
import { HorizontalScrollBox } from '../../components/common/HorizontalScrollBox';
import { MonthlyBalanceRolloverSection } from '../accounts/MonthlyBalanceRolloverSection';
import { FinancialAssetSavingsSection } from './FinancialAssetSavingsSection';
import { FinancialHealthFutureSection } from './FinancialHealthFutureSection';

type Period = '7days' | '30days' | 'month' | 'year' | 'custom';

// Helpers to format Vietnamese dd/MM/yyyy standard dates
const formatVnDate = (isoStr: string) => {
  try {
    return format(parseISO(isoStr), 'dd/MM/yyyy');
  } catch {
    return isoStr;
  }
};

const formatVnMonth = (isoStr: string) => {
  try {
    const fullIso = isoStr.length === 7 ? `${isoStr}-01` : isoStr;
    return format(parseISO(fullIso), 'MM/yyyy');
  } catch {
    return isoStr;
  }
};

export default function Reports() {
  const data = useFinance(s => s.data)!;
  const openPricing = useFinance(s => s.openPricing);

  // Time filters
  const [period, setPeriod] = useState<Period>('month');
  const [from, setFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [account, setAccount] = useState('all');
  const [category, setCategory] = useState('all');

  // Interactive Series Toggles for Composed Chart
  const [showIncome, setShowIncome] = useState(true);
  const [showExpense, setShowExpense] = useState(true);
  const [showNet, setShowNet] = useState(true);
  const [showNetWorth, setShowNetWorth] = useState(false);
  const [fullscreenChartOpen, setFullscreenChartOpen] = useState(false);
  const [timelineViewMode, setTimelineViewMode] = useState<'cards' | 'table'>('cards');
  const [activeReportTab, setActiveReportTab] = useState<'all' | 'overview' | 'rollover' | 'savings' | 'health'>('all');

  const isPro = isProUser(data);

  const handlePeriodPreset = (newPeriod: Period) => {
    if (newPeriod !== 'month' && !canUsePeriodInReport(data, newPeriod as any)) {
      openPricing('Xem báo cáo đa kỳ (7 ngày/30 ngày/Năm/Tùy chỉnh) là đặc quyền Tích Sản VIP Gold');
      return;
    }
    setPeriod(newPeriod);
    const now = new Date();
    if (newPeriod === '7days') {
      setFrom(format(subDays(now, 6), 'yyyy-MM-dd'));
      setTo(format(now, 'yyyy-MM-dd'));
    } else if (newPeriod === '30days') {
      setFrom(format(subDays(now, 29), 'yyyy-MM-dd'));
      setTo(format(now, 'yyyy-MM-dd'));
    } else if (newPeriod === 'month') {
      const financialDay = data.user.financialMonthStart || 1;
      const fStart = new Date(
        now.getFullYear(),
        now.getMonth() - (now.getDate() < financialDay ? 1 : 0),
        financialDay
      );
      setFrom(format(fStart, 'yyyy-MM-dd'));
      setTo(format(now, 'yyyy-MM-dd'));
    } else if (newPeriod === 'year') {
      setFrom(format(startOfYear(now), 'yyyy-MM-dd'));
      setTo(format(now, 'yyyy-MM-dd'));
    }
  };

  const bounds = useMemo(() => ({ from, to }), [from, to]);

  const filtered = useMemo(() => {
    return data.transactions.filter(
      t =>
        inRange(t, bounds.from, bounds.to) &&
        (account === 'all' || t.accountId === account || t.toAccountId === account) &&
        (category === 'all' || t.categoryId === category)
    );
  }, [data.transactions, bounds.from, bounds.to, account, category]);

  const result = totals(filtered);
  const difference = result.income - result.expense;
  const savingsRate = result.income > 0 ? Math.round((difference / result.income) * 100) : 0;

  const duration = Math.max(
    1,
    Math.ceil((new Date(bounds.to).getTime() - new Date(bounds.from).getTime()) / 86400000) + 1
  );

  // Compare with prior equivalent period
  const priorFrom = format(subDays(new Date(bounds.from), duration), 'yyyy-MM-dd');
  const priorTo = format(subDays(new Date(bounds.from), 1), 'yyyy-MM-dd');
  const previous = totals(
    data.transactions.filter(
      t =>
        inRange(t, priorFrom, priorTo) &&
        (account === 'all' || t.accountId === account || t.toAccountId === account) &&
        (category === 'all' || t.categoryId === category)
    )
  );

  const expenseChange = previous.expense
    ? Math.round(((result.expense - previous.expense) / previous.expense) * 100)
    : 0;

  // Expense categories ranking
  const expenseCategories = useMemo(() => {
    const list = data.categories
      .filter(c => c.type === 'expense')
      .map(c => {
        const spent = filtered
          .filter(t => t.type === 'expense' && t.status === 'completed' && t.categoryId === c.id)
          .reduce((n, t) => n + t.amount, 0);
        return {
          id: c.id,
          name: c.name,
          value: spent,
          color: c.color,
          pct: result.expense > 0 ? Math.round((spent / result.expense) * 100) : 0
        };
      })
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);

    return list;
  }, [data.categories, filtered, result.expense]);

  // Unified Composed Dataset (Inflow + Outflow + Net Surplus/Deficit + Net Worth)
  const unifiedTrend = useMemo(() => {
    const isDayAggregate = duration <= 35;
    const map = new Map<
      string,
      {
        key: string;
        fullDate: string;
        displayDate: string;
        shortLabel: string;
        income: number;
        expense: number;
        net: number;
        netWorth: number;
        savingsRate: number;
      }
    >();

    for (const t of filtered) {
      if (t.type === 'transfer' || t.status !== 'completed') continue;
      const groupKey = isDayAggregate ? t.date : t.date.slice(0, 7);
      const existing = map.get(groupKey) || {
        key: groupKey,
        fullDate: t.date,
        displayDate: isDayAggregate ? formatVnDate(t.date) : `Tháng ${formatVnMonth(t.date)}`,
        shortLabel: isDayAggregate ? format(parseISO(t.date), 'dd/MM') : formatVnMonth(t.date),
        income: 0,
        expense: 0,
        net: 0,
        netWorth: 0,
        savingsRate: 0
      };
      existing[t.type] += t.amount;
      existing.net = existing.income - existing.expense;
      existing.savingsRate =
        existing.income > 0 ? Math.round(((existing.income - existing.expense) / existing.income) * 100) : 0;
      map.set(groupKey, existing);
    }

    const sorted = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));

    // Calculate actual net worth at each milestone
    for (const row of sorted) {
      row.netWorth = netWorthAt(data, row.fullDate);
    }

    return sorted;
  }, [filtered, duration, data]);

  // Cashflow Waterfall Reconciliation Data
  const startNetWorth = useMemo(() => netWorthAt(data, bounds.from), [data, bounds.from]);
  const endNetWorth = useMemo(() => netWorthAt(data, bounds.to), [data, bounds.to]);
  const netWorthDelta = endNetWorth - startNetWorth;
  const netWorthGrowthPct = startNetWorth > 0 ? Math.round((netWorthDelta / startNetWorth) * 100) : 0;

  const handleExportCsv = () => {
    if (!isPro) {
      openPricing('Xuất dữ liệu báo cáo phân tích CSV/Excel là tính năng Tích Sản VIP Gold');
      return;
    }
    const csv = [
      ['Khoảng thời gian', formatVnDate(bounds.from), formatVnDate(bounds.to)],
      ['Tổng thu nhập', result.income],
      ['Tổng chi tiêu', result.expense],
      ['Thặng dư ròng', difference],
      ['Tỷ lệ tiết kiệm', `${savingsRate}%`],
      [],
      ['Danh mục', 'Số tiền chi', 'Tỷ lệ %'],
      ...expenseCategories.map(c => [c.name, c.value, `${c.pct}%`])
    ];
    downloadCsv('finora-bao-cao.csv', csv);
  };

  // Custom Fintech Tooltip for Composed Chart
  const CustomComposedTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          p: 1.75,
          boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
          minWidth: 230
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25, pb: 1, borderBottom: '1px solid var(--border-subtle)' }}>
          <Calendar size={13} color="var(--brand-primary)" />
          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 12.5, color: 'text.primary' }}>
            Thời gian: {item.displayDate}
          </Typography>
        </Box>

        {showIncome && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#15966B' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>Thu nhập:</Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--accent-income)', fontVariantNumeric: 'tabular-nums' }}>
              +{money(item.income)}
            </Typography>
          </Box>
        )}

        {showExpense && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#D65B58' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>Chi tiêu:</Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--accent-expense)', fontVariantNumeric: 'tabular-nums' }}>
              -{money(item.expense)}
            </Typography>
          </Box>
        )}

        {showNet && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, pt: 0.5, borderTop: '1px dashed var(--border-subtle)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4E7BC5' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>Dòng tiền ròng:</Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 850, color: item.net >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)', fontVariantNumeric: 'tabular-nums' }}>
              {item.net >= 0 ? '+' : ''}{money(item.net)}
            </Typography>
          </Box>
        )}

        {showNetWorth && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, pt: 0.5, borderTop: '1px dashed var(--border-subtle)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#27866A' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>Tài sản ròng:</Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 850, color: 'var(--brand-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {money(item.netWorth)}
            </Typography>
          </Box>
        )}

        {item.income > 0 && (
          <Box sx={{ mt: 1, pt: 0.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover', px: 1, py: 0.4, borderRadius: 1.5 }}>
            <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>Tỷ lệ tiết kiệm:</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11, color: item.savingsRate >= 20 ? 'var(--accent-income)' : 'var(--accent-warning)' }}>
              {item.savingsRate}%
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderHeroComposedChart = (
    chartHeight: number | `${number}%` = 380,
    chartWidth: number | `${number}%` = '100%',
    isFullscreen = false
  ) => (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflowX: isFullscreen ? 'visible' : 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        pb: 0.5,
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'var(--border-subtle)',
          borderRadius: 3,
          '&:hover': { bgcolor: 'var(--text-muted)' }
        }
      }}
    >
      <Box
        sx={{
          width: chartWidth,
          minWidth:
            !isFullscreen && unifiedTrend.length > 7
              ? Math.max(520, unifiedTrend.length * 44)
              : '100%',
          height: chartHeight,
          minHeight: typeof chartHeight === 'number' ? chartHeight : 280
        }}
      >
        {unifiedTrend.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={unifiedTrend}
              margin={{ top: 15, right: showNetWorth ? 35 : 15, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#27866A" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#27866A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
              <XAxis
                dataKey="shortLabel"
                stroke="var(--text-secondary)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-subtle)' }}
              />
              <YAxis
                yAxisId="cashflow"
                stroke="var(--text-secondary)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={val => shortMoney(val)}
                width={62}
              />
              {showNetWorth && (
                <YAxis
                  yAxisId="wealth"
                  orientation="right"
                  stroke="#27866A"
                  fontSize={11.5}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => shortMoney(val)}
                  width={48}
                />
              )}
              <ReferenceLine yAxisId="cashflow" y={0} stroke="var(--border-subtle)" strokeWidth={1.5} />
              <RechartsTooltip content={<CustomComposedTooltip />} />

              {showIncome && (
                <Bar
                  yAxisId="cashflow"
                  dataKey="income"
                  name="Thu nhập"
                  fill="#15966B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )}
              {showExpense && (
                <Bar
                  yAxisId="cashflow"
                  dataKey="expense"
                  name="Chi tiêu"
                  fill="#D65B58"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )}
              {showNet && (
                <Line
                  yAxisId="cashflow"
                  type="monotone"
                  dataKey="net"
                  name="Dòng tiền ròng"
                  stroke="#4E7BC5"
                  strokeWidth={2.75}
                  dot={{ r: 3, fill: '#4E7BC5', strokeWidth: 1.5, stroke: 'var(--bg-surface)' }}
                  activeDot={{ r: 6, fill: '#4E7BC5', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
              {showNetWorth && (
                <Area
                  yAxisId="wealth"
                  type="monotone"
                  dataKey="netWorth"
                  name="Tài sản ròng"
                  stroke="#27866A"
                  strokeWidth={2}
                  fill="url(#netWorthGradient)"
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <Empty text="Chưa có dữ liệu dòng tiền trong khoảng thời gian này" />
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <PageHead
        eyebrow="TRUNG TÂM PHÂN TÍCH TÀI CHÍNH"
        title="Báo cáo & Thống kê"
        subtitle="Toàn cảnh bức tranh tài chính đa chiều: Dòng tiền Thu/Chi, Thặng dư ròng, Quỹ đạo tài sản và Phân bổ danh mục"
        actions={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpButton pageKey="reports" />
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download size={14} />}
              onClick={handleExportCsv}
              sx={{ fontWeight: 700, fontSize: 13 }}
            >
              Xuất dữ liệu {!isPro && '(Pro)'}
            </Button>
          </Box>
        }
      />

      {/* EXECUTIVE MODULE NAVIGATION TABS */}
      <Paper
        variant="outlined"
        sx={{
          p: 0.75,
          mb: 2.5,
          borderRadius: '10px',
          bgcolor: 'background.paper',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
        }}
      >
        <HorizontalScrollBox gap="8px" buttonSize={24} scrollStep={220}>
          <Button
            size="small"
            variant={activeReportTab === 'all' ? 'contained' : 'text'}
            onClick={() => setActiveReportTab('all')}
            startIcon={<Layers size={15} />}
            sx={{
              fontWeight: 750,
              fontSize: 12.5,
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.75,
              py: 0.75,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Tất cả báo cáo (Xem trọn vẹn)
          </Button>

          <Button
            size="small"
            variant={activeReportTab === 'health' ? 'contained' : 'text'}
            onClick={() => setActiveReportTab('health')}
            startIcon={<Sparkles size={15} style={{ color: '#8B5CF6' }} />}
            sx={{
              fontWeight: 750,
              fontSize: 12.5,
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.75,
              py: 0.75,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              color: activeReportTab === 'health' ? '#FFFFFF' : '#8B5CF6',
              bgcolor: activeReportTab === 'health' ? '#8B5CF6' : 'rgba(139, 92, 246, 0.08)',
              '&:hover': {
                bgcolor: activeReportTab === 'health' ? '#7C3AED' : 'rgba(139, 92, 246, 0.16)'
              }
            }}
          >
            Sức khỏe Tài chính & Khuyến nghị
          </Button>

          <Button
            size="small"
            variant={activeReportTab === 'overview' ? 'contained' : 'text'}
            onClick={() => setActiveReportTab('overview')}
            startIcon={<BarChart3 size={15} />}
            sx={{
              fontWeight: 750,
              fontSize: 12.5,
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.75,
              py: 0.75,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Dòng tiền & Toàn cảnh
          </Button>

          <Button
            size="small"
            variant={activeReportTab === 'rollover' ? 'contained' : 'text'}
            onClick={() => setActiveReportTab('rollover')}
            startIcon={<ArrowLeftRight size={15} />}
            sx={{
              fontWeight: 750,
              fontSize: 12.5,
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.75,
              py: 0.75,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Chuyển tiếp Số dư (Rollover)
          </Button>

          <Button
            size="small"
            variant={activeReportTab === 'savings' ? 'contained' : 'text'}
            onClick={() => setActiveReportTab('savings')}
            startIcon={<PiggyBank size={15} />}
            sx={{
              fontWeight: 750,
              fontSize: 12.5,
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.75,
              py: 0.75,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Tài sản & Tiết kiệm (50/30/20)
          </Button>
        </HorizontalScrollBox>
      </Paper>

      {/* Clean Time Presets & Filter Center */}
      <Paper
        id="tour-reports-timeframe"
        variant="outlined"
        sx={{
          p: { xs: 1.75, sm: 2 },
          mb: 3,
          borderRadius: '6px',
          bgcolor: 'background.paper',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          {/* Period Selection with MUI Select */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: { xs: '100%', sm: 220 } }}>
              <MuiSelect
                label="Chọn khoảng thời gian"
                value={period}
                onChange={val => handlePeriodPreset(val as Period)}
                options={[
                  { value: '7days', label: '7 ngày qua' },
                  { value: '30days', label: '30 ngày qua' },
                  { value: 'month', label: 'Tháng này' },
                  { value: 'year', label: 'Cả năm nay (Pro)' },
                  { value: 'custom', label: 'Tùy chỉnh khoảng ngày...' }
                ]}
              />
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: 12 }}>
              {duration} ngày ({formatVnDate(bounds.from)} đến {formatVnDate(bounds.to)})
            </Typography>
          </Box>
        </Box>

        {/* Detailed inputs (shown when custom period or filters needed) */}
        {period === 'custom' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.2fr 1.2fr 1.5fr 1.5fr' },
              gap: 1.5,
              mt: 2,
              pt: 2,
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <MuiDatePicker label="Từ ngày" value={from} onChange={val => setFrom(val)} />
            <MuiDatePicker label="Đến ngày" value={to} onChange={val => setTo(val)} />
            <MuiSelect
              label="Tài khoản"
              value={account}
              onChange={val => setAccount(val)}
              options={[
                { value: 'all', label: 'Tất cả tài khoản' },
                ...data.accounts.map(a => ({ value: a.id, label: a.name }))
              ]}
            />
            <MuiSelect
              label="Danh mục"
              value={category}
              onChange={val => setCategory(val)}
              options={[
                { value: 'all', label: 'Tất cả danh mục' },
                ...data.categories.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </Box>
        )}
      </Paper>

      {/* 0. PRIORITY MODULE: SỨC KHỎE TÀI CHÍNH & KHUYẾN NGHỊ (ƯU TIÊN LÊN ĐẦU TIÊN) */}
      {(activeReportTab === 'all' || activeReportTab === 'health') && (
        <Box sx={{ mt: 1, mb: 3 }}>
          <FinancialHealthFutureSection />
        </Box>
      )}

      {/* 1. OVERVIEW & CASHFLOW MODULE */}
      {(activeReportTab === 'all' || activeReportTab === 'overview') && (
        <>
          {/* Executive Financial Health Strip (3 Distinct Vibrant Tone Cards) */}
          <Box
            id="tour-reports-kpi"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3
        }}
      >
        {/* Total Inflow Card - Emerald Tint */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '10px',
            bgcolor: 'background.paper',
            background: 'linear-gradient(135deg, rgba(21, 150, 107, 0.08) 0%, rgba(21, 150, 107, 0.01) 100%), var(--bg-surface)',
            borderColor: 'rgba(21, 150, 107, 0.3)',
            borderTop: '3.5px solid #10B981',
            boxShadow: '0 2px 8px rgba(21, 150, 107, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(21, 150, 107, 0.14)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Thu nhập trong kỳ
            </Typography>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: 'rgba(21, 150, 107, 0.14)',
                color: 'var(--accent-income)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(21, 150, 107, 0.2)'
              }}
            >
              <TrendingUp size={17} />
            </Box>
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: 'var(--accent-income)',
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              +{money(result.income)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5, display: 'block', mt: 0.5 }}>
              Kỳ trước đối chiếu: <strong>{money(previous.income)}</strong>
            </Typography>
          </Box>
        </Paper>

        {/* Total Outflow Card - Rose Coral Tint */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '10px',
            bgcolor: 'background.paper',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.01) 100%), var(--bg-surface)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            borderTop: '3.5px solid #EF4444',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(239, 68, 68, 0.14)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Chi tiêu trong kỳ
            </Typography>
            <Box
              sx={{
                px: 0.85,
                py: 0.35,
                borderRadius: '6px',
                bgcolor: expenseChange > 0 ? 'rgba(214, 91, 88, 0.14)' : 'rgba(21, 150, 107, 0.14)',
                color: expenseChange > 0 ? 'var(--accent-expense)' : 'var(--accent-income)',
                fontWeight: 800,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 0.4
              }}
            >
              {expenseChange > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              <span>{expenseChange >= 0 ? '+' : ''}{expenseChange}%</span>
            </Box>
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: 'var(--accent-expense)',
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              -{money(result.expense)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5, display: 'block', mt: 0.5 }}>
              Kỳ trước đối chiếu: <strong>{money(previous.expense)}</strong>
            </Typography>
          </Box>
        </Paper>

        {/* Net Cashflow & Savings Rate Card - Indigo Sapphire Tint */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '10px',
            bgcolor: 'background.paper',
            background: 'linear-gradient(135deg, rgba(78, 123, 197, 0.09) 0%, rgba(78, 123, 197, 0.01) 100%), var(--bg-surface)',
            borderColor: 'rgba(78, 123, 197, 0.3)',
            borderTop: '3.5px solid #4E7BC5',
            boxShadow: '0 2px 8px rgba(78, 123, 197, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(78, 123, 197, 0.14)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Dòng tiền ròng & Tiết kiệm
            </Typography>
            <Chip
              label={`Tiết kiệm ${savingsRate}%`}
              size="small"
              sx={{
                height: 22,
                fontSize: 10.5,
                fontWeight: 800,
                bgcolor: savingsRate >= 20 ? 'rgba(21, 150, 107, 0.15)' : 'rgba(214, 91, 88, 0.15)',
                color: savingsRate >= 20 ? 'var(--accent-income)' : 'var(--accent-expense)',
                border: `1px solid ${savingsRate >= 20 ? 'rgba(21, 150, 107, 0.3)' : 'rgba(214, 91, 88, 0.3)'}`
              }}
            />
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: difference >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)',
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {difference >= 0 ? '+' : ''}
              {money(difference)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5, display: 'block', mt: 0.5 }}>
              Tài sản ròng hiện tại: <strong>{money(netWorth(data))}</strong>
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* HERO SECTION: BIỂU ĐỒ HỢP NHẤT TOÀN DIỆN (COMPOSED FINANCIAL CANVAS) */}
      <Paper
        id="tour-reports-charts"
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.75 },
          mb: 3,
          borderRadius: '10px',
          bgcolor: 'background.paper',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}
      >
        {/* Composed Chart Control Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', lg: 'center' },
            gap: 2,
            mb: 2.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: { xs: '100%', lg: 'auto' } }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Layers size={19} color="var(--brand-primary)" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 16.5 } }}>
                  Biểu đồ Dòng tiền & Tài sản Hợp nhất
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12, display: 'block', mt: 0.25 }}>
                Tích hợp trực quan: Cột kép Thu/Chi, Đường cong Thặng dư ròng và Quỹ đạo Tài sản trên một khung nhìn thống nhất
              </Typography>
            </Box>
          </Box>

          {/* Metric Toggle Chips & Fullscreen Action at Top-Right */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              justifyContent: { xs: 'space-between', lg: 'flex-end' },
              width: { xs: '100%', lg: 'auto' }
            }}
          >
            <HorizontalScrollBox gap="8px" buttonSize={24} scrollStep={180} sx={{ flex: 1, minWidth: 0 }}>
              <Chip
                label="Thu nhập (+)"
                size="small"
                clickable
                variant={showIncome ? 'filled' : 'outlined'}
                onClick={() => setShowIncome(prev => !prev)}
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  height: 28,
                  bgcolor: showIncome ? 'rgba(21, 150, 107, 0.15)' : 'transparent',
                  color: showIncome ? '#15966B' : 'text.secondary',
                  borderColor: showIncome ? '#15966B' : 'var(--border-subtle)',
                  flexShrink: 0
                }}
              />
              <Chip
                label="Chi tiêu (-)"
                size="small"
                clickable
                variant={showExpense ? 'filled' : 'outlined'}
                onClick={() => setShowExpense(prev => !prev)}
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  height: 28,
                  bgcolor: showExpense ? 'rgba(214, 91, 88, 0.15)' : 'transparent',
                  color: showExpense ? '#D65B58' : 'text.secondary',
                  borderColor: showExpense ? '#D65B58' : 'var(--border-subtle)',
                  flexShrink: 0
                }}
              />
              <Chip
                label="Dòng tiền ròng (±)"
                size="small"
                clickable
                variant={showNet ? 'filled' : 'outlined'}
                onClick={() => setShowNet(prev => !prev)}
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  height: 28,
                  bgcolor: showNet ? 'rgba(78, 123, 197, 0.15)' : 'transparent',
                  color: showNet ? '#4E7BC5' : 'text.secondary',
                  borderColor: showNet ? '#4E7BC5' : 'var(--border-subtle)',
                  flexShrink: 0
                }}
              />
              <Chip
                label="Tài sản ròng (Trục phải)"
                size="small"
                clickable
                variant={showNetWorth ? 'filled' : 'outlined'}
                onClick={() => setShowNetWorth(prev => !prev)}
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  height: 28,
                  bgcolor: showNetWorth ? 'rgba(39, 134, 106, 0.15)' : 'transparent',
                  color: showNetWorth ? 'var(--brand-primary)' : 'text.secondary',
                  borderColor: showNetWorth ? 'var(--brand-primary)' : 'var(--border-subtle)',
                  flexShrink: 0
                }}
              />
            </HorizontalScrollBox>

            {/* Expanded fullscreen button positioned at top-right of chart */}
            <FullscreenButton
              onClick={() => setFullscreenChartOpen(true)}
              title="Mở rộng xem biểu đồ toàn màn hình (Xoay ngang 90°)"
              size={18}
            />
          </Box>
        </Box>

        {/* The Recharts Composed Canvas with responsive fit */}
        {renderHeroComposedChart(360)}

        {/* CASHFLOW WATERFALL RECONCILIATION BRIDGE - Distinct Card Row Segments */}
        <Box
          sx={{
            mt: 3,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 1.5,
            alignItems: 'stretch'
          }}
        >
          {/* Card 1: Số dư đầu kỳ */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: '8px',
              bgcolor: 'action.hover',
              border: '1px solid var(--border-subtle)',
              borderLeft: '3.5px solid var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
              SỐ DƯ ĐẦU KỲ ({formatVnDate(bounds.from)})
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', mt: 0.5, fontSize: 15 }}>
              {money(startNetWorth)}
            </Typography>
          </Box>

          {/* Card 2: Dòng thu */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: '8px',
              bgcolor: 'rgba(21, 150, 107, 0.06)',
              border: '1px solid rgba(21, 150, 107, 0.25)',
              borderLeft: '3.5px solid #10B981',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: 'var(--accent-income)', fontWeight: 750, fontSize: 11, textTransform: 'uppercase' }}>
              TỔNG DÒNG THU (+)
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: 'var(--accent-income)', fontVariantNumeric: 'tabular-nums', mt: 0.5, fontSize: 15 }}>
              +{money(result.income)}
            </Typography>
          </Box>

          {/* Card 3: Dòng chi */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: '8px',
              bgcolor: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderLeft: '3.5px solid #EF4444',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: 'var(--accent-expense)', fontWeight: 750, fontSize: 11, textTransform: 'uppercase' }}>
              TỔNG DÒNG CHI (-)
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: 'var(--accent-expense)', fontVariantNumeric: 'tabular-nums', mt: 0.5, fontSize: 15 }}>
              -{money(result.expense)}
            </Typography>
          </Box>

          {/* Card 4: Số dư cuối kỳ */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: '8px',
              bgcolor: 'rgba(39, 134, 106, 0.08)',
              border: '1px solid rgba(39, 134, 106, 0.3)',
              borderLeft: '3.5px solid var(--brand-primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: 'var(--brand-primary)', fontWeight: 750, fontSize: 11, textTransform: 'uppercase' }}>
              SỐ DƯ CUỐI KỲ ({formatVnDate(bounds.to)})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', fontVariantNumeric: 'tabular-nums', fontSize: 15 }}>
                {money(endNetWorth)}
              </Typography>
              <Chip
                label={`${netWorthGrowthPct >= 0 ? '+' : ''}${netWorthGrowthPct}%`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 800,
                  bgcolor: netWorthGrowthPct >= 0 ? 'rgba(21, 150, 107, 0.15)' : 'rgba(214, 91, 88, 0.15)',
                  color: netWorthGrowthPct >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)',
                  border: `1px solid ${netWorthGrowthPct >= 0 ? 'rgba(21, 150, 107, 0.3)' : 'rgba(214, 91, 88, 0.3)'}`
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* SECONDARY ROW: EXPENSE CATEGORIES DONUT & TIMELINE LEDGER TABLE */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1.25fr' },
          gap: 2.5
        }}
      >
        {/* LEFT: EXPENSE BREAKDOWN (DONUT + CATEGORY ROW CARDS) */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: '10px',
            bgcolor: 'background.paper',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PieIcon size={18} color="var(--brand-primary)" />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
                Cơ cấu Chi tiêu theo Danh mục
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
              {expenseCategories.length
                ? `Nhóm "${expenseCategories[0].name}" chiếm tỷ trọng lớn nhất (${expenseCategories[0].pct}%)`
                : 'Chưa có khoản chi nào trong kỳ'}
            </Typography>
          </Box>

          {/* Donut Canvas */}
          <Box sx={{ width: '100%', height: 210, minHeight: 210, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {expenseCategories.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={expenseCategories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#27866A'} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any) => [money(Number(val)), 'Số tiền chi']}
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '6px',
                      fontSize: 12,
                      fontWeight: 650
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <Empty text="Không có dữ liệu chi tiêu" />
            )}
          </Box>

          {/* Top Categories Ranking List - Card Dòng Phân Tách Rõ Ràng */}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {expenseCategories.slice(0, 5).map((c, idx) => (
              <Box
                key={c.id}
                sx={{
                  p: 1.25,
                  borderRadius: '8px',
                  bgcolor: 'action.hover',
                  border: '1px solid var(--border-subtle)',
                  transition: 'background-color 0.2s ease, transform 0.2s ease',
                  '&:hover': {
                    bgcolor: 'action.selected',
                    borderColor: 'var(--brand-primary)',
                    transform: 'translateX(2px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`#${idx + 1}`}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: 9.5,
                        fontWeight: 800,
                        bgcolor: idx === 0 ? 'rgba(21, 150, 107, 0.15)' : 'action.selected',
                        color: idx === 0 ? 'var(--accent-income)' : 'text.secondary'
                      }}
                    />
                    <CategoryAvatarBadge categoryId={c.id} categoryName={c.name} txType="expense" />
                    <Typography variant="body2" sx={{ fontWeight: 750, fontSize: 13 }}>
                      {c.name}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                      {money(c.value)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 650 }}>
                      {c.pct}% tổng chi
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={c.pct}
                  sx={{
                    height: 5,
                    borderRadius: '4px',
                    bgcolor: 'background.paper',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: c.color || 'primary.main',
                      borderRadius: '4px'
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        </Paper>

        {/* RIGHT: TIMELINE LEDGER TABLE / ROW-CARDS */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: '10px',
            bgcolor: 'background.paper',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TableIcon size={18} color="var(--brand-primary)" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
                  Đối soát Dòng tiền Chi tiết theo Mốc Thời gian
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12, display: 'block', mt: 0.25 }}>
                Thống kê đối ứng Thu vào, Chi ra và Chênh lệch thặng dư/thâm hụt của từng chu kỳ
              </Typography>
            </Box>

            {/* View Mode Toggle: Row-Cards vs Table */}
            <ToggleButtonGroup
              size="small"
              value={timelineViewMode}
              exclusive
              onChange={(_e, next) => {
                if (next) setTimelineViewMode(next);
              }}
              sx={{
                height: 28,
                bgcolor: 'action.hover',
                '& .MuiToggleButton-root': {
                  px: 1,
                  py: 0.25,
                  fontSize: 11,
                  fontWeight: 700,
                  border: 'none',
                  textTransform: 'none',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#fff',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }
                }
              }}
            >
              <ToggleButton value="cards">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LayoutList size={13} />
                  <span>Thẻ dòng</span>
                </Box>
              </ToggleButton>
              <ToggleButton value="table">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TableIcon size={13} />
                  <span>Bảng biểu</span>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* VIEW MODE 1: ROW CARDS (Tối ưu cho cả Mobile & Desktop, phân tách rõ rệt) */}
          {timelineViewMode === 'cards' ? (
            <Box
              sx={{
                flex: 1,
                maxHeight: 460,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                pr: 0.5,
                '&::-webkit-scrollbar': { width: 5 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'var(--border-subtle)', borderRadius: 3 }
              }}
            >
              {unifiedTrend.length ? (
                unifiedTrend.map(row => {
                  const isPositive = row.net >= 0;
                  return (
                    <Box
                      key={row.key}
                      sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        bgcolor: 'action.hover',
                        border: '1px solid var(--border-subtle)',
                        borderLeft: `4px solid ${isPositive ? 'var(--accent-income)' : 'var(--accent-expense)'}`,
                        transition: 'background-color 0.2s ease, transform 0.15s ease',
                        '&:hover': {
                          bgcolor: 'action.selected',
                          borderColor: isPositive ? 'rgba(21, 150, 107, 0.4)' : 'rgba(214, 91, 88, 0.4)',
                          transform: 'translateX(2px)'
                        }
                      }}
                    >
                      {/* Top Header Line: Date and Status Badge */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Calendar size={14} color="var(--brand-primary)" />
                          <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 13, color: 'text.primary' }}>
                            {row.displayDate}
                          </Typography>
                        </Box>
                        <Chip
                          label={isPositive ? `Thặng dư +${row.savingsRate}%` : `Thâm hụt ${row.savingsRate}%`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10,
                            fontWeight: 800,
                            bgcolor: isPositive ? 'rgba(21, 150, 107, 0.14)' : 'rgba(214, 91, 88, 0.14)',
                            color: isPositive ? 'var(--accent-income)' : 'var(--accent-expense)',
                            border: `1px solid ${isPositive ? 'rgba(21, 150, 107, 0.3)' : 'rgba(214, 91, 88, 0.3)'}`
                          }}
                        />
                      </Box>

                      {/* 3 Metric Columns: Thu - Chi - Ròng */}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 1,
                          pt: 0.75,
                          borderTop: '1px dashed var(--border-subtle)'
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10.5, display: 'block', fontWeight: 650 }}>
                            Thu nhập
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 750,
                              fontSize: 12.5,
                              color: row.income > 0 ? 'var(--accent-income)' : 'text.secondary',
                              fontVariantNumeric: 'tabular-nums'
                            }}
                          >
                            {row.income > 0 ? `+${money(row.income)}` : '—'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10.5, display: 'block', fontWeight: 650 }}>
                            Chi tiêu
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 750,
                              fontSize: 12.5,
                              color: row.expense > 0 ? 'var(--accent-expense)' : 'text.secondary',
                              fontVariantNumeric: 'tabular-nums'
                            }}
                          >
                            {row.expense > 0 ? `-${money(row.expense)}` : '—'}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10.5, display: 'block', fontWeight: 700 }}>
                            Dòng tiền ròng
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 850,
                              fontSize: 13,
                              color: isPositive ? 'var(--accent-income)' : 'var(--accent-expense)',
                              fontVariantNumeric: 'tabular-nums'
                            }}
                          >
                            {row.net !== 0 ? `${row.net >= 0 ? '+' : ''}${money(row.net)}` : '0 ₫'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Empty text="Chưa có dữ liệu đối soát trong kỳ" />
              )}
            </Box>
          ) : (
            /* VIEW MODE 2: TABLE VIEW WITH ENHANCED CONTRAST */
            <TableContainer sx={{ flex: 1, maxHeight: 440, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" stickyHeader sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: 'action.hover', borderBottom: '1.5px solid var(--border-subtle)' } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: 11.5, color: 'text.primary' }}>Thời gian (dd/mm/yyyy)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11.5, color: 'text.primary' }}>Thu nhập</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11.5, color: 'text.primary' }}>Chi tiêu</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11.5, color: 'text.primary' }}>Dòng tiền ròng</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11.5, color: 'text.primary' }}>Tiết kiệm</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unifiedTrend.length ? (
                    unifiedTrend.map(row => (
                      <TableRow
                        key={row.key}
                        hover
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: '1px solid var(--border-subtle)'
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
                          {row.displayDate}
                        </TableCell>
                        <TableCell align="right" sx={{ color: row.income > 0 ? 'var(--accent-income)' : 'text.secondary', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
                          {row.income > 0 ? `+${money(row.income)}` : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: row.expense > 0 ? 'var(--accent-expense)' : 'text.secondary', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
                          {row.expense > 0 ? `-${money(row.expense)}` : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: row.net >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)', fontWeight: 850, fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
                          {row.net !== 0 ? `${row.net >= 0 ? '+' : ''}${money(row.net)}` : '0 ₫'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${row.savingsRate}%`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              fontWeight: 800,
                              bgcolor: row.savingsRate >= 20 ? 'rgba(21, 150, 107, 0.12)' : 'action.hover',
                              color: row.savingsRate >= 20 ? 'var(--accent-income)' : 'text.secondary'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Chưa có giao dịch phát sinh
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </>
  )}

  {/* 2. MONTHLY BALANCE ROLLOVER & TRANSITION RECONCILIATION */}
  {(activeReportTab === 'all' || activeReportTab === 'rollover') && (
    <Box sx={{ mt: 1, mb: 3 }}>
      <MonthlyBalanceRolloverSection />
    </Box>
  )}

  {/* 3. ASSET & SAVINGS ANALYSIS (50/30/20 & PROJECTION) */}
  {(activeReportTab === 'all' || activeReportTab === 'savings') && (
    <Box sx={{ mt: 1, mb: 3 }}>
      <FinancialAssetSavingsSection
        filteredTransactions={filtered}
        income={result.income}
        expense={result.expense}
        difference={difference}
        savingsRate={savingsRate}
      />
    </Box>
  )}

      {/* Fullscreen Chart Modal */}
      <FullscreenModal
        open={fullscreenChartOpen}
        onClose={() => setFullscreenChartOpen(false)}
        title="Biểu đồ Dòng tiền & Tài sản Hợp nhất"
        subtitle="Khung nhìn toàn cảnh: Cột kép Thu/Chi, Đường cong Thặng dư ròng và Quỹ đạo Tài sản"
      >
        <FullscreenChartContent>
          {({ width, height }) => (
            <Box sx={{ width, height, minHeight: height, display: 'flex', flexDirection: 'column' }}>
              {renderHeroComposedChart(height, width)}
            </Box>
          )}
        </FullscreenChartContent>
      </FullscreenModal>
    </>
  );
}
