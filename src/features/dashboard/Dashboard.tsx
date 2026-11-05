import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  format,
  parseISO,
  subMonths,
  addMonths,
  startOfMonth,
  endOfMonth,
  subDays,
  differenceInCalendarDays
} from 'date-fns';
import {
  Plus,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Sparkles
} from 'lucide-react';
import {
  Box,
  Paper,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
  InputBase,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

import { useFinance } from '../../store';
import {
  balance,
  budgetSpent,
  dateLabel,
  goalSaved,
  inRange,
  money,
  monthKey,
  shortMoney,
  totals
} from '../../lib/finance';
import { calculateComprehensiveNetWorth, getSampleWealthInvestmentNotes } from '../../lib/investmentProjectionEngine';
import { getHiddenAssetIds } from '../../components/smartLedger/UnrecoveredAssetsTable';
import { Empty, FinoraButton } from '../../components/ui';
import { MagicQuickBar } from '../../components/MagicQuickBar';
import { BankLogoBadge, CategoryAvatarBadge, FundLogoBadge } from '../../lib/brandBadges';
import { FinancialHealthGaugeCluster } from '../../components/gauges/FinancialHealthGaugeCluster';
import { FinancialOverviewCards } from '../../components/dashboard/FinancialOverviewCards';
import { HelpButton } from '../../components/HelpButton';

type CashflowPeriod = '7days' | '30days' | '3months' | '6months' | 'year';

export default function Dashboard() {
  const data = useFinance(s => s.data)!;
  const openPricing = useFinance(s => s.openPricing);

  // Month navigation state
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date());
  const currentMonthKey = monthKey(selectedMonthDate);

  // Privacy: Show or hide financial balances
  const [showBalance, setShowBalance] = useState<boolean>(true);

  // Cashflow chart period filter
  const [cashflowPeriod, setCashflowPeriod] = useState<CashflowPeriod>('30days');

  // Search filter for recent transactions
  const [txSearch, setTxSearch] = useState<string>('');

  // Month Navigation Handlers
  const handlePrevMonth = () => setSelectedMonthDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonthDate(prev => addMonths(prev, 1));
  const handleCurrentMonth = () => setSelectedMonthDate(new Date());

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng!';
    if (hour < 18) return 'Chào buổi chiều!';
    return 'Chào buổi tối!';
  }, []);

  // Selected Month Range Bounds
  const monthBounds = useMemo(() => {
    const start = format(startOfMonth(selectedMonthDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(selectedMonthDate), 'yyyy-MM-dd');
    return { from: start, to: end };
  }, [selectedMonthDate]);

  // Transactions in Selected Month
  const monthTransactions = useMemo(() => {
    return data.transactions.filter(t => inRange(t, monthBounds.from, monthBounds.to));
  }, [data.transactions, monthBounds]);

  const { income, expense } = totals(monthTransactions);
  const netSavings = income - expense;
  const savingsRate = income > 0 ? Math.round((netSavings / income) * 100) : 0;

  // Comparison with Previous Month
  const prevMonthDate = subMonths(selectedMonthDate, 1);
  const prevMonthBounds = {
    from: format(startOfMonth(prevMonthDate), 'yyyy-MM-dd'),
    to: format(endOfMonth(prevMonthDate), 'yyyy-MM-dd')
  };
  const prevMonthTransactions = data.transactions.filter(t =>
    inRange(t, prevMonthBounds.from, prevMonthBounds.to)
  );
  const prevTotals = totals(prevMonthTransactions);

  const incomeChange = prevTotals.income
    ? Math.round(((income - prevTotals.income) / prevTotals.income) * 100)
    : 0;
  const expenseChange = prevTotals.expense
    ? Math.round(((expense - prevTotals.expense) / prevTotals.expense) * 100)
    : 0;

  // Total Cash Assets across all active liquid accounts
  const liquidCashBalance = useMemo(() => {
    return data.accounts
      .filter(a => a.active && a.type !== 'credit_card')
      .reduce((sum, a) => sum + balance(a, data.transactions), 0);
  }, [data.accounts, data.transactions]);

  // Total Liabilities
  const totalLiabilities = useMemo(() => {
    const debtOwed = (data.debts || [])
      .filter(d => d.kind === 'owed')
      .reduce((sum, d) => sum + d.principal, 0);
    const ccDebt = (data.accounts || [])
      .filter(a => a.active && a.type === 'credit_card')
      .reduce((sum, a) => sum + Math.max(0, -balance(a, data.transactions)), 0);
    return debtOwed + ccDebt;
  }, [data.debts, data.accounts, data.transactions]);

  // Comprehensive Net Worth (incorporating investment notes & safe mode & hidden assets sync)
  const netWorthSummary = useMemo(() => {
    const rawNotes = (data.smartInvestmentNotes && data.smartInvestmentNotes.length > 0)
      ? data.smartInvestmentNotes
      : getSampleWealthInvestmentNotes();
    const hiddenSet = new Set(getHiddenAssetIds());
    const notes = rawNotes.map(n => ({
      ...n,
      include_in_net_worth: hiddenSet.has(n.id) ? false : (n.include_in_net_worth !== false)
    }));
    return calculateComprehensiveNetWorth(
      liquidCashBalance,
      notes,
      totalLiabilities,
      Boolean(data.hideRiskyAssetsGlobal)
    );
  }, [liquidCashBalance, data.smartInvestmentNotes, totalLiabilities, data.hideRiskyAssetsGlobal]);

  // Overall Monthly Budget Calculation
  const activeBudgets = useMemo(() => {
    return data.budgets.filter(b => b.month === currentMonthKey);
  }, [data.budgets, currentMonthKey]);

  const totalBudgetLimit = useMemo(() => {
    return activeBudgets.reduce((sum, b) => sum + b.limit, 0);
  }, [activeBudgets]);

  const totalBudgetSpent = useMemo(() => {
    return activeBudgets.reduce((sum, b) => sum + budgetSpent(b, data.transactions), 0);
  }, [activeBudgets, data.transactions]);

  const remainingBudget = Math.max(0, totalBudgetLimit - totalBudgetSpent);
  const budgetUsagePct = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

  // Cashflow Trend Series based on selected cashflowPeriod
  const cashflowBounds = useMemo(() => {
    const now = new Date();
    const to = format(now, 'yyyy-MM-dd');
    let from: string;
    if (cashflowPeriod === '7days') from = format(subDays(now, 6), 'yyyy-MM-dd');
    else if (cashflowPeriod === '30days') from = format(subDays(now, 29), 'yyyy-MM-dd');
    else if (cashflowPeriod === '3months') from = format(subMonths(now, 3), 'yyyy-MM-dd');
    else if (cashflowPeriod === '6months') from = format(subMonths(now, 6), 'yyyy-MM-dd');
    else from = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
    return { from, to };
  }, [cashflowPeriod]);

  const cashflowDataset = useMemo(() => {
    const days = differenceInCalendarDays(parseISO(cashflowBounds.to), parseISO(cashflowBounds.from)) + 1;
    const isDayAggregate = days <= 35;

    const map = new Map<string, { date: string; income: number; expense: number; net: number }>();
    const filteredTx = data.transactions.filter(t => inRange(t, cashflowBounds.from, cashflowBounds.to));

    for (const t of filteredTx) {
      if (t.type === 'transfer' || t.status !== 'completed') continue;
      const key = isDayAggregate ? t.date.slice(5, 10) : t.date.slice(0, 7);
      const row = map.get(key) || { date: key, income: 0, expense: 0, net: 0 };
      row[t.type] += t.amount;
      row.net = row.income - row.expense;
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [data.transactions, cashflowBounds]);

  // Deterministic Cashflow Insight
  const cashflowInsight = useMemo(() => {
    if (income > expense) {
      return `Tháng này bạn đang thặng dư ${money(income - expense)} với tỷ lệ tiết kiệm đạt ${savingsRate}%.`;
    }
    if (expense > income) {
      return `Chi tiêu tháng này đang vượt thu nhập ${money(expense - income)}. Hãy cân nhắc cắt giảm các nhóm không thiết yếu.`;
    }
    return `Thu nhập và chi tiêu của bạn đang cân bằng ở mức ${money(income)}.`;
  }, [income, expense, savingsRate]);

  // Expense Categories Distribution
  const expenseCategories = useMemo(() => {
    const list = data.categories
      .filter(c => c.type === 'expense')
      .map(c => {
        const spent = monthTransactions
          .filter(t => t.type === 'expense' && t.status === 'completed' && t.categoryId === c.id)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          id: c.id,
          name: c.name,
          value: spent,
          color: c.color,
          pct: expense > 0 ? Math.round((spent / expense) * 100) : 0
        };
      })
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);

    return list;
  }, [data.categories, monthTransactions, expense]);

  // Recent Transactions (filtered by search if typed)
  const recentTransactions = useMemo(() => {
    return [...data.transactions]
      .filter(t => {
        if (!txSearch) return true;
        const q = txSearch.toLowerCase();
        return t.name.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q));
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [data.transactions, txSearch]);

  const mask = (val: string) => (showBalance ? val : '••••••••');

  return (
    <Box sx={{ pb: 6 }}>
      {/* 5.1. PAGE HEADER (Compact, Executive Fintech Header) */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              fontSize: 11.5,
              letterSpacing: '0.04em',
              color: 'var(--brand-primary)',
              textTransform: 'uppercase'
            }}
          >
            {greeting}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 850,
              fontSize: { xs: 21, sm: 26, md: 28 },
              letterSpacing: '-0.03em',
              color: 'text.primary',
              mt: 0.25,
              lineHeight: 1.2
            }}
          >
            Tổng quan tài chính
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: 12, sm: 13 }, mt: 0.25 }}>
            Theo dõi và kiểm soát dòng tiền của bạn.
          </Typography>
        </Box>

        {/* Right Controls: Month Selector, Visibility, + Thêm giao dịch */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.75, sm: 1.25 },
            flexWrap: 'wrap',
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }
          }}
        >
          {/* Month Selector Pill */}
          <Paper
            variant="outlined"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '6px',
              p: 0.5,
              bgcolor: 'background.paper',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <Tooltip title="Tháng trước">
              <IconButton size="small" onClick={handlePrevMonth} sx={{ p: 0.5 }}>
                <ChevronLeft size={16} />
              </IconButton>
            </Tooltip>

            <Box
              component="button"
              onClick={handleCurrentMonth}
              sx={{
                background: 'none',
                border: 'none',
                px: { xs: 0.75, sm: 1.25 },
                fontSize: { xs: 11.5, sm: 12.5 },
                fontWeight: 750,
                color: 'text.primary',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75
              }}
            >
              <Calendar size={13} style={{ color: 'var(--brand-primary)' }} />
              <span>Tháng {format(selectedMonthDate, 'MM/yyyy')}</span>
            </Box>

            <Tooltip title="Tháng tiếp theo">
              <IconButton size="small" onClick={handleNextMonth} sx={{ p: 0.5 }}>
                <ChevronRight size={16} />
              </IconButton>
            </Tooltip>
          </Paper>

          {/* Visibility Eye Button */}
          <Tooltip title={showBalance ? 'Ẩn số dư tài chính' : 'Hiện số dư tài chính'}>
            <IconButton
              size="small"
              onClick={() => setShowBalance(!showBalance)}
              sx={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                bgcolor: 'background.paper'
              }}
            >
              {showBalance ? <Eye size={17} /> : <EyeOff size={17} />}
            </IconButton>
          </Tooltip>

          {/* Guided Tour Help Button */}
          <HelpButton pageKey="dashboard" />

          {/* + Thêm giao dịch Button */}
          <Box id="tour-dashboard-add-tx">
            <Link to="/transactions?add=1" style={{ textDecoration: 'none' }}>
              <FinoraButton
                variant="primary"
              size="medium"
              startIcon={<Plus size={16} color="#FFFFFF" strokeWidth={2.5} />}
              sx={{
                minHeight: 38,
                fontSize: { xs: 12, sm: 13 },
                px: { xs: 1.5, sm: 2 },
                bgcolor: '#10B981',
                color: '#FFFFFF',
                fontWeight: 750,
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                '&:hover': {
                  bgcolor: '#059669'
                }
              }}
            >
              Thêm giao dịch
            </FinoraButton>
            </Link>
          </Box>
        </Box>
      </Box>

      {/* 5.2. MAIN FINANCIAL SUMMARY (7 Key Financial Overview Cards) */}
      <Box id="tour-net-worth-card">
        <FinancialOverviewCards
          netWorthSummary={netWorthSummary}
          accountCount={data.accounts.length}
          income={income}
          incomeChange={incomeChange}
          expense={expense}
          expenseChange={expenseChange}
          avgDailyExpense={Math.round(expense / Math.max(1, new Date().getDate()))}
          topExpenseCategoryName={expenseCategories[0]?.name}
          netCashflow={income - expense}
          savingsRate={savingsRate}
          totalSavings={netSavings}
          budgetTotal={totalBudgetLimit}
          budgetSpent={totalBudgetSpent}
          budgetRemaining={remainingBudget}
          budgetUsagePct={budgetUsagePct}
          overBudgetCount={activeBudgets.filter(b => budgetSpent(b, data.transactions) > b.limit).length}
          totalDebtOwed={(data.debts || []).filter(d => d.kind === 'owed').reduce((s, d) => s + (d.principal || 0), 0)}
          upcomingDebtPayment={(data.debts || []).find(d => d.kind === 'owed')?.principal || 0}
          nextDueDebtDate={(data.debts || []).find(d => d.kind === 'owed')?.dueDate}
          showBalance={showBalance}
          hideRiskyAssets={Boolean(data.hideRiskyAssetsGlobal)}
        />
      </Box>

      {/* 5.3. FINANCIAL HEALTH SPEEDOMETER GAUGES CLUSTER */}
      <Box id="tour-gauges-cluster" sx={{ mb: 3 }}>
        <FinancialHealthGaugeCluster />
      </Box>

      {/* 5.4. HABIT LOOP - MAGIC QUICK-BAR (1-TAP QUICK CHIPS & SMS PARSER) */}
      <Box id="tour-quick-bar">
        <MagicQuickBar onOpenPricing={openPricing} />
      </Box>

      {/* 6 & 7. CASH FLOW ANALYTICS & EXPENSE DONUT */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.45fr 1fr' },
          gap: 2.5,
          mt: 3,
          mb: 3
        }}
      >
        {/* SECTION 6: DÒNG TIỀN (INCOME VS EXPENSE) */}
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1.5,
              mb: 2
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
                Dòng tiền Hợp nhất
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                Biểu đồ kết hợp: Cột Thu/Chi và Đường cong Thặng dư ròng
              </Typography>
            </Box>

            {/* Time Controls */}
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, pt: { xs: 0.5, sm: 0 } }}>
              {[
                { id: '7days', label: '7 ngày' },
                { id: '30days', label: '30 ngày' },
                { id: '3months', label: '3 tháng' },
                { id: '6months', label: '6 tháng' },
                { id: 'year', label: '12 tháng' }
              ].map(p => (
                <Chip
                  key={p.id}
                  label={p.label}
                  size="small"
                  clickable
                  color={cashflowPeriod === p.id ? 'primary' : 'default'}
                  variant={cashflowPeriod === p.id ? 'filled' : 'outlined'}
                  onClick={() => setCashflowPeriod(p.id as CashflowPeriod)}
                  sx={{
                    height: 24,
                    fontSize: 10.5,
                    fontWeight: cashflowPeriod === p.id ? 800 : 600,
                    bgcolor: cashflowPeriod === p.id ? 'primary.main' : 'transparent'
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Composed Chart Visualization */}
          <Box sx={{ width: '100%', height: 280, minHeight: 280 }}>
            {cashflowDataset.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashflowDataset} margin={{ top: 15, right: 15, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border-subtle)' }}
                  />
                  <YAxis
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={val => shortMoney(val)}
                  />
                  <ReferenceLine y={0} stroke="var(--border-subtle)" strokeWidth={1} />
                  <RechartsTooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0]?.payload;
                      if (!d) return null;
                      return (
                        <Box
                          sx={{
                            bgcolor: 'background.paper',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            p: 1.5,
                            boxShadow: '0 8px 20px rgba(0,0,0,0.22)',
                            minWidth: 190
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block', mb: 0.75 }}>
                            {label}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Thu nhập:</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--accent-income)' }}>
                              +{money(d.income)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Chi tiêu:</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--accent-expense)' }}>
                              -{money(d.expense)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5, borderTop: '1px dashed var(--border-subtle)' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Chênh lệch:</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 850, color: d.net >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)' }}>
                              {d.net >= 0 ? '+' : ''}{money(d.net)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                  />
                  <Bar dataKey="income" name="Thu nhập" fill="#15966B" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="Chi tiêu" fill="#D65B58" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Thặng dư ròng"
                    stroke="#4E7BC5"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#4E7BC5', strokeWidth: 1.5, stroke: 'var(--bg-surface)' }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <Empty text="Chưa có dữ liệu dòng tiền trong khoảng thời gian này" />
            )}
          </Box>

          {/* Cashflow Insight Pill */}
          <Box
            sx={{
              mt: 2,
              p: 1.25,
              borderRadius: '4px',
              bgcolor: 'action.hover',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Sparkles size={16} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 650, fontSize: 12 }}>
              {cashflowInsight}
            </Typography>
          </Box>
        </Paper>

        {/* SECTION 7: CHI TIÊU THEO DANH MỤC (EXPENSE DONUT & RANKING) */}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
                Chi tiêu theo danh mục
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                Tháng {format(selectedMonthDate, 'MM/yyyy')}
              </Typography>
            </Box>
            <Link to="/reports" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none' }}>
              Chi tiết →
            </Link>
          </Box>

          {expenseCategories.length ? (
            <>
              {/* Donut Chart with Recharts */}
              <Box sx={{ width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={expenseCategories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`dash-cell-${index}`} fill={entry.color || '#27866A'} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(val: any) => [money(Number(val)), 'Chi tiêu']}
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
              </Box>

              {/* Top 3 Categories */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 1 }}>
                {expenseCategories.slice(0, 3).map(c => (
                  <Box key={c.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryAvatarBadge categoryId={c.id} categoryName={c.name} txType="expense" />
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12.5 }}>
                          {c.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800 }}>
                        {money(c.value)}{' '}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({c.pct}%)</span>
                      </Typography>
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
            </>
          ) : (
            <Empty text="Chưa phát sinh chi tiêu trong tháng này" />
          )}
        </Paper>
      </Box>

      {/* 8, 9, 10, 11: RECENT TRANSACTIONS & FINANCIAL HUBS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.45fr 1fr' },
          gap: 2.5
        }}
      >
        {/* SECTION 8: GIAO DỊCH GẦN ĐÂY */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: '6px',
            background: 'var(--card-inset-bg)',
            boxShadow: 'var(--card-inset-shadow)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1.5,
              mb: 2
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
                Giao dịch gần đây
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                Đối soát các khoản thu, chi và chuyển tiền mới nhất
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 0.35,
                  borderRadius: 1.5,
                  bgcolor: 'action.hover',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <Search size={13} style={{ color: 'var(--text-muted)' }} />
                <InputBase
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  placeholder="Lọc giao dịch..."
                  sx={{ fontSize: 12, width: { xs: 90, sm: 120 } }}
                />
              </Box>

              <Link
                to="/transactions"
                style={{
                  fontSize: 12,
                  fontWeight: 750,
                  color: 'var(--brand-primary)',
                  textDecoration: 'none'
                }}
              >
                Xem tất cả →
              </Link>
            </Box>
          </Box>

          {/* Desktop Table View */}
          <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>Giao dịch</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>Tài khoản</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>Ngày</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: 12 }}>
                    Số tiền
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: 12 }}>
                    Trạng thái
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.map(t => {
                  const cat = data.categories.find(c => c.id === t.categoryId);
                  const acc = data.accounts.find(a => a.id === t.accountId);

                  return (
                    <TableRow key={t.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <CategoryAvatarBadge categoryId={t.categoryId} categoryName={cat?.name} txType={t.type} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 750, fontSize: 13 }}>
                              {t.name}
                            </Typography>
                            {t.note && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 11 }}>
                                {t.note}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontSize: 12 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <BankLogoBadge accountName={acc?.name} accountType={acc?.type} size="small" />
                          <span>{acc?.name}</span>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {dateLabel(t.date)}
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 850,
                            fontFeatureSettings: '"tnum"',
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: 13,
                            color:
                              t.type === 'income'
                                ? 'var(--accent-income)'
                                : t.type === 'expense'
                                ? 'var(--accent-expense)'
                                : 'var(--accent-info)'
                          }}
                        >
                          {mask(
                            `${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}${money(t.amount)}`
                          )}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={t.status === 'completed' ? 'Hoàn tất' : 'Chờ'}
                          size="small"
                          color={t.status === 'completed' ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ height: 18, fontSize: 9.5, fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card Row Fallback */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
            {recentTransactions.map(t => {
              const cat = data.categories.find(c => c.id === t.categoryId);
              const acc = data.accounts.find(a => a.id === t.accountId);

              return (
                <Box
                  key={t.id}
                  sx={{
                    p: 1.25,
                    borderRadius: '4px',
                    bgcolor: 'action.hover',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <CategoryAvatarBadge categoryId={t.categoryId} categoryName={cat?.name} txType={t.type} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 750, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                        {acc?.name} · {dateLabel(t.date)}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 900,
                      fontSize: 13.5,
                      fontFeatureSettings: '"tnum"',
                      fontVariantNumeric: 'tabular-nums',
                      color:
                        t.type === 'income'
                          ? 'var(--accent-income)'
                          : t.type === 'expense'
                          ? 'var(--accent-expense)'
                          : 'var(--accent-info)',
                      flexShrink: 0
                    }}
                  >
                    {mask(
                      `${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}${money(t.amount)}`
                    )}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* RIGHT COLUMN: BUDGETS, GOALS & ACCOUNTS */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* SECTION 9: NGÂN SÁCH THÁNG NÀY */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.25,
              borderRadius: '6px',
              background: 'var(--card-inset-bg)',
              boxShadow: 'var(--card-inset-shadow)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 15 }}>
                  Ngân sách tháng này
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
                  Đã chi {mask(money(totalBudgetSpent))} / {mask(money(totalBudgetLimit))}
                </Typography>
              </Box>
              <Link to="/budgets" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                Quản lý →
              </Link>
            </Box>

            {/* Total Budget Progress */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Còn lại: {mask(money(remainingBudget))}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: budgetUsagePct >= 100 ? 'var(--accent-expense)' : budgetUsagePct >= 80 ? 'var(--accent-warning)' : 'var(--accent-income)'
                  }}
                >
                  {budgetUsagePct}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, budgetUsagePct)}
                sx={{
                  height: 7,
                  borderRadius: '6px',
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: budgetUsagePct >= 100 ? '#ef4444' : budgetUsagePct >= 80 ? '#f59e0b' : '#16865B',
                    borderRadius: '4px'
                  }
                }}
              />
            </Box>

            {/* Category level progress */}
            {activeBudgets.length ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {activeBudgets.slice(0, 3).map(b => {
                  const spent = budgetSpent(b, data.transactions);
                  const pct = Math.round((spent / b.limit) * 100);
                  const isExceeded = pct >= 100;
                  const isWarning = pct >= 80;

                  return (
                    <Box key={b.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 650, fontSize: 12.5 }}>
                          {b.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: isExceeded ? 'var(--accent-expense)' : isWarning ? 'var(--accent-warning)' : 'text.secondary'
                          }}
                        >
                          {mask(shortMoney(spent))} / {shortMoney(b.limit)} ({pct}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, pct)}
                        sx={{
                          height: 5,
                          borderRadius: '6px',
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: isExceeded ? '#ef4444' : isWarning ? '#f59e0b' : '#16865B',
                            borderRadius: '4px'
                          }
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            ) : null}
          </Paper>

          {/* SECTION 10 & 11: MỤC TIÊU TIẾT KIỆM & TÀI KHOẢN CỦA TÔI */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.25,
              borderRadius: '6px',
              background: 'var(--card-inset-bg)',
              boxShadow: 'var(--card-inset-shadow)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 15 }}>
                Tài khoản & Mục tiêu
              </Typography>
              <Link to="/accounts" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                Tài khoản →
              </Link>
            </Box>

            {/* Account List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {data.accounts.slice(0, 3).map(a => {
                const bal = balance(a, data.transactions);
                return (
                  <Box
                    key={a.id}
                    sx={{
                      p: 1,
                      borderRadius: '4px',
                      bgcolor: 'action.hover',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BankLogoBadge accountName={a.name} accountType={a.type} size="small" />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12.5 }}>
                        {a.name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        fontFeatureSettings: '"tnum"',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 12.5
                      }}
                    >
                      {mask(money(bal))}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Savings Goals */}
            {data.goals.length ? (
              <Box sx={{ pt: 1.5, borderTop: '1px solid var(--border-subtle)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                    MỤC TIÊU TÍCH LŨY
                  </Typography>
                  <Link to="/savings" style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    Xem {data.goals.length} mục tiêu →
                  </Link>
                </Box>
                {data.goals.slice(0, 2).map(g => {
                  const saved = goalSaved(g);
                  const pct = Math.min(100, Math.round((saved / g.target) * 100));

                  return (
                    <Box key={g.id} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <FundLogoBadge name={g.name} kind={g.icon} size="small" />
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12 }}>
                            {g.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>
                          {mask(money(saved))} ({pct}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 4,
                          borderRadius: '4px',
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: pct >= 100 ? '#16865B' : '#5479AD',
                            borderRadius: '4px'
                          }
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            ) : null}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
