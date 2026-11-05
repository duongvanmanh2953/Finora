import { useMemo, useState } from 'react';
import {
  format,
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
  Table as TableIcon
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
  TableRow
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
import { FullscreenModal, FullscreenButton } from '../../components/ui/FullscreenModal';
import { canUsePeriodInReport, isProUser } from '../../lib/subscription';
import { MuiSelect, MuiDatePicker } from '../../components/mui/MuiInputs';
import { CategoryAvatarBadge } from '../../lib/brandBadges';

type Period = '7days' | '30days' | 'month' | 'year' | 'custom';

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
        date: string;
        fullDate: string;
        income: number;
        expense: number;
        net: number;
        netWorth: number;
        savingsRate: number;
      }
    >();

    for (const t of filtered) {
      if (t.type === 'transfer' || t.status !== 'completed') continue;
      const key = isDayAggregate ? t.date.slice(5, 10) : t.date.slice(0, 7);
      const existing = map.get(key) || {
        date: key,
        fullDate: t.date,
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
      map.set(key, existing);
    }

    const sorted = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));

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
      ['Khoảng thời gian', bounds.from, bounds.to],
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
  const CustomComposedTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          p: 1.75,
          boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
          minWidth: 220
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25, pb: 1, borderBottom: '1px solid var(--border-subtle)' }}>
          <Calendar size={13} color="var(--brand-primary)" />
          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 12, color: 'text.primary' }}>
            Thời gian: {label}
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

  const renderHeroComposedChart = (chartHeight: number | string = 380) => (
    <Box sx={{ width: '100%', height: chartHeight, minHeight: typeof chartHeight === 'number' ? chartHeight : 280, minWidth: 0, overflow: 'hidden', flex: 1 }}>
      {unifiedTrend.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={unifiedTrend}
            margin={{ top: 15, right: showNetWorth ? 35 : 10, left: -15, bottom: 20 }}
          >
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#27866A" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#27866A" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis
              dataKey="date"
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
              width={45}
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
          {/* Quick Period Buttons: Scrollable on mobile */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              flexWrap: 'nowrap',
              WebkitOverflowScrolling: 'touch',
              alignItems: 'center',
              py: 0.5,
              maxWidth: '100%',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            <Calendar size={15} style={{ color: 'var(--brand-primary)', marginRight: 4 }} />
            {[
              { id: '7days', label: '7 ngày qua' },
              { id: '30days', label: '30 ngày qua' },
              { id: 'month', label: 'Tháng này' },
              { id: 'year', label: 'Năm nay (Pro)' },
              { id: 'custom', label: 'Tùy chỉnh khoảng ngày' }
            ].map(p => {
              const active = period === p.id;
              return (
                <Chip
                  key={p.id}
                  label={p.label}
                  size="small"
                  clickable
                  color={active ? 'primary' : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  onClick={() => handlePeriodPreset(p.id as Period)}
                  sx={{
                    fontWeight: active ? 800 : 600,
                    fontSize: 11.5,
                    height: 28,
                    bgcolor: active ? 'primary.main' : 'transparent'
                  }}
                />
              );
            })}
          </Box>

          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: 11.5 }}>
            {duration} ngày ({bounds.from} → {bounds.to})
          </Typography>
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

      {/* Executive Financial Health Strip (3 High-Contrast Obsidian Cards) */}
      <Box
        id="tour-reports-kpi"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3
        }}
      >
        {/* Total Inflow Card */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '6px',
            bgcolor: 'background.paper',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: 12 }}>
              Thu nhập trong kỳ
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
          <Box sx={{ mt: 1.25 }}>
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
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
              Kỳ trước: {money(previous.income)}
            </Typography>
          </Box>
        </Paper>

        {/* Total Outflow Card */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '6px',
            bgcolor: 'background.paper',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: 12 }}>
              Chi tiêu trong kỳ
            </Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: 1.5,
                bgcolor: expenseChange > 0 ? 'rgba(214, 91, 88, 0.12)' : 'rgba(21, 150, 107, 0.12)',
                color: expenseChange > 0 ? 'var(--accent-expense)' : 'var(--accent-income)',
                fontWeight: 800,
                fontSize: 10.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.4
              }}
            >
              {expenseChange > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              <span>{expenseChange >= 0 ? '+' : ''}{expenseChange}%</span>
            </Box>
          </Box>
          <Box sx={{ mt: 1.25 }}>
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
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
              Kỳ trước: {money(previous.expense)}
            </Typography>
          </Box>
        </Paper>

        {/* Net Cashflow & Savings Rate Card */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '6px',
            bgcolor: 'background.paper',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: 12 }}>
              Dòng tiền ròng & Tiết kiệm
            </Typography>
            <Chip
              label={`Tiết kiệm ${savingsRate}%`}
              size="small"
              sx={{
                height: 20,
                fontSize: 10.5,
                fontWeight: 800,
                bgcolor: savingsRate >= 20 ? 'rgba(21, 150, 107, 0.12)' : 'rgba(214, 91, 88, 0.12)',
                color: savingsRate >= 20 ? 'var(--accent-income)' : 'var(--accent-expense)'
              }}
            />
          </Box>
          <Box sx={{ mt: 1.25 }}>
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
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
              Tài sản ròng hiện tại: {money(netWorth(data))}
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
          borderRadius: '6px',
          bgcolor: 'background.paper',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
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
                <Layers size={18} color="var(--brand-primary)" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
                  Biểu đồ Dòng tiền & Tài sản Hợp nhất
                </Typography>
                <FullscreenButton onClick={() => setFullscreenChartOpen(true)} title="Xem biểu đồ toàn màn hình (Xoay ngang 90°)" />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                Tích hợp trực quan: Cột kép Thu/Chi, Đường cong Thặng dư ròng và Quỹ đạo Tài sản trên một khung nhìn thống nhất
              </Typography>
            </Box>
          </Box>

          {/* Metric Toggle Chips: Scrollable on mobile */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              flexWrap: 'nowrap',
              WebkitOverflowScrolling: 'touch',
              alignItems: 'center',
              py: 0.5,
              maxWidth: '100%',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
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
          </Box>
        </Box>

        {/* The Recharts Composed Canvas */}
        {renderHeroComposedChart(380)}

        {/* CASHFLOW WATERFALL RECONCILIATION BRIDGE */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: '6px',
            bgcolor: 'action.hover',
            border: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
            gap: 2,
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: 11 }}>
              SỐ DƯ ĐẦU KỲ ({bounds.from})
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>
              {money(startNetWorth)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: 11 }}>
              TỔNG DÒNG THU (+)
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--accent-income)', fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>
              +{money(result.income)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: 11 }}>
              TỔNG DÒNG CHI (-)
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--accent-expense)', fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>
              -{money(result.expense)}
            </Typography>
          </Box>

          <Box sx={{ borderLeft: { sm: '1px solid var(--border-subtle)' }, pl: { sm: 2 } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: 11 }}>
              SỐ DƯ CUỐI KỲ ({bounds.to})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                {money(endNetWorth)}
              </Typography>
              <Chip
                label={`${netWorthGrowthPct >= 0 ? '+' : ''}${netWorthGrowthPct}%`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 800,
                  bgcolor: netWorthGrowthPct >= 0 ? 'rgba(21, 150, 107, 0.12)' : 'rgba(214, 91, 88, 0.12)',
                  color: netWorthGrowthPct >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'
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
        {/* LEFT: EXPENSE BREAKDOWN (DONUT + PROGRESS BARS) */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: '6px',
            bgcolor: 'background.paper',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PieIcon size={17} color="var(--brand-primary)" />
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
          <Box sx={{ width: '100%', height: 230, minHeight: 230, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {expenseCategories.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={expenseCategories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
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
                      borderRadius: '4px',
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

          {/* Top Categories Ranking List */}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {expenseCategories.slice(0, 5).map(c => (
              <Box key={c.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryAvatarBadge categoryId={c.id} categoryName={c.name} txType="expense" />
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                      {c.name}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                      {money(c.value)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                      {c.pct}% tổng chi
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={c.pct}
                  sx={{
                    height: 5,
                    borderRadius: '6px',
                    bgcolor: 'action.hover',
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

        {/* RIGHT: TIMELINE LEDGER TABLE */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: '6px',
            bgcolor: 'background.paper',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TableIcon size={17} color="var(--brand-primary)" />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
                Đối soát Dòng tiền Chi tiết theo Mốc Thời gian
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
              Thống kê đối ứng Thu vào, Chi ra và Chênh lệch thặng dư/thâm hụt của từng chu kỳ
            </Typography>
          </Box>

          <TableContainer sx={{ flex: 1, maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: 11.5, bgcolor: 'background.paper' }}>Thời gian</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11.5, bgcolor: 'background.paper' }}>Thu nhập</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11.5, bgcolor: 'background.paper' }}>Chi tiêu</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11.5, bgcolor: 'background.paper' }}>Dòng tiền ròng</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11.5, bgcolor: 'background.paper' }}>Tiết kiệm</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unifiedTrend.length ? (
                  unifiedTrend.map(row => (
                    <TableRow key={row.date} hover>
                      <TableCell sx={{ fontWeight: 650, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
                        {row.date}
                      </TableCell>
                      <TableCell align="right" sx={{ color: row.income > 0 ? 'var(--accent-income)' : 'text.secondary', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
                        {row.income > 0 ? `+${money(row.income)}` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: row.expense > 0 ? 'var(--accent-expense)' : 'text.secondary', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
                        {row.expense > 0 ? `-${money(row.expense)}` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: row.net >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
                        {row.net !== 0 ? `${row.net >= 0 ? '+' : ''}${money(row.net)}` : '0 ₫'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${row.savingsRate}%`}
                          size="small"
                          sx={{
                            height: 19,
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
        </Paper>
      </Box>

      {/* Fullscreen Chart Modal with 90deg Landscape Rotation */}
      <FullscreenModal
        open={fullscreenChartOpen}
        onClose={() => setFullscreenChartOpen(false)}
        title="Biểu đồ Dòng tiền & Tài sản Hợp nhất"
        subtitle="Khung nhìn toàn cảnh: Cột kép Thu/Chi, Đường cong Thặng dư ròng và Quỹ đạo Tài sản (Hỗ trợ xoay ngang 90°)"
      >
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {renderHeroComposedChart('100%')}
        </Box>
      </FullscreenModal>
    </>
  );
}
