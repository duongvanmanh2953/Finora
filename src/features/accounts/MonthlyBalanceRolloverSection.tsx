import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { format, subMonths, parseISO } from 'date-fns';
import { useFinance } from '../../store';
import { money, formatVnMonth } from '../../lib/finance';
import {
  getMonthBalanceSummary,
  getMonthlyBalanceHistory,
  getAccountBreakdownForMonth,
  verifyRolloverIntegrity,
  type MonthBalanceSummary,
  type AccountMonthBreakdown
} from '../../lib/balanceRollover';
import { MuiSelect, MuiMonthPicker } from '../../components/mui/MuiInputs';
import { BankLogoBadge } from '../../lib/brandBadges';

interface Props {
  defaultAccountId?: string;
}

export function MonthlyBalanceRolloverSection({ defaultAccountId = 'all' }: Props) {
  const data = useFinance(s => s.data);
  const accounts = data?.accounts || [];
  const transactions = data?.transactions || [];

  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [selectedAccountId, setSelectedAccountId] = useState<string>(defaultAccountId);
  const [activeSubTab, setActiveSubTab] = useState<'waterfall' | 'breakdown' | 'multiMonth'>('waterfall');

  // Calculate current month rollover summary
  const summary: MonthBalanceSummary = useMemo(() => {
    return getMonthBalanceSummary(selectedMonth, accounts, transactions, selectedAccountId);
  }, [selectedMonth, accounts, transactions, selectedAccountId]);

  // Account-level breakdown for the month
  const accountBreakdowns: AccountMonthBreakdown[] = useMemo(() => {
    return getAccountBreakdownForMonth(selectedMonth, accounts, transactions);
  }, [selectedMonth, accounts, transactions]);

  // Multi-month rollover history (past 6 months)
  const multiMonthHistory: MonthBalanceSummary[] = useMemo(() => {
    return getMonthlyBalanceHistory(accounts, transactions, 6, selectedAccountId);
  }, [accounts, transactions, selectedAccountId]);

  // Verify integrity across past 12 months
  const auditResult = useMemo(() => {
    return verifyRolloverIntegrity(accounts, transactions, 12);
  }, [accounts, transactions]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.75 },
        borderRadius: '12px',
        bgcolor: 'background.paper',
        borderColor: 'var(--border-subtle)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        mb: 3,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* SECTION HEADER */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3,
          pb: 2,
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: 'rgba(39, 134, 106, 0.12)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArrowLeftRight size={20} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Chuyển tiếp Số dư Hàng tháng (Monthly Rollover)
            </Typography>
            <Chip
              icon={<ShieldCheck size={14} color="#10b981" />}
              label={auditResult.isValid ? "Tự động nối chuỗi • Khớp 100%" : "Có chênh lệch cần kiểm tra"}
              size="small"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.75 }}>
            Bảo toàn dòng tiền liền mạch: Số dư cuối kỳ tháng trước chuyển giao nguyên vẹn làm số dư đầu kỳ tháng sau. Chuyển tiền nội bộ không làm thất thoát tổng tài sản.
          </Typography>
        </Box>

        {/* CONTROLS */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
          <Box sx={{ minWidth: 150, flex: { xs: 1, sm: 'initial' } }}>
            <MuiMonthPicker
              label="Chọn tháng đối soát"
              value={selectedMonth}
              onChange={(val) => val && setSelectedMonth(val)}
            />
          </Box>
          <Box sx={{ minWidth: 180, flex: { xs: 1, sm: 'initial' } }}>
            <MuiSelect
              label="Tài khoản / Ví"
              value={selectedAccountId}
              onChange={(val) => setSelectedAccountId(val)}
              options={[
                { value: 'all', label: 'Tất cả tài khoản' },
                ...accounts.map(a => ({ value: a.id, label: a.name }))
              ]}
            />
          </Box>
        </Box>
      </Box>

      {/* VIEW TABS */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant={activeSubTab === 'waterfall' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setActiveSubTab('waterfall')}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: 13 }}
        >
          Cầu đối soát Waterfall
        </Button>
        <Button
          variant={activeSubTab === 'breakdown' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setActiveSubTab('breakdown')}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: 13 }}
        >
          Chi tiết theo Tài khoản ({accounts.length})
        </Button>
        <Button
          variant={activeSubTab === 'multiMonth' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setActiveSubTab('multiMonth')}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: 13 }}
        >
          Chuỗi chuyển tiếp 6 tháng liên tiếp
        </Button>
      </Box>

      {/* 1. WATERFALL VIEW */}
      {activeSubTab === 'waterfall' && (
        <Box>
          {/* WATERFALL FLOW CARDS */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
              gap: 2,
              mb: 3
            }}
          >
            {/* 1. Opening Balance */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                borderLeft: '4px solid #3b82f6',
                position: 'relative'
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                1. SỐ DƯ ĐẦU KỲ
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: '#3b82f6' }}>
                {money(summary.openingBalance)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                (Số dư cuối {formatVnMonth(format(subMonths(parseISO(`${selectedMonth}-01`), 1), 'yyyy-MM'))})
              </Typography>
            </Paper>

            {/* 2. Total Income */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                borderLeft: '4px solid #10b981'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                  2. (+) TỔNG THU NHẬP
                </Typography>
                <TrendingUp size={16} color="#10b981" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: '#10b981' }}>
                +{money(summary.totalIncome)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Dòng tiền vào thực tế
              </Typography>
            </Paper>

            {/* 3. Total Expense */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                borderLeft: '4px solid #f43f5e'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#f43f5e', fontWeight: 700 }}>
                  3. (-) TỔNG CHI TIÊU
                </Typography>
                <TrendingDown size={16} color="#f43f5e" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: '#f43f5e' }}>
                -{money(summary.totalExpense)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Dòng tiền ra thực tế
              </Typography>
            </Paper>

            {/* 4. Net Transfers */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                borderLeft: '4px solid #8b5cf6'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 700 }}>
                  4. (+/-) ĐIỀU CHỈNH CHUYỂN VÍ
                </Typography>
                <ArrowLeftRight size={16} color="#8b5cf6" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: '#8b5cf6' }}>
                {summary.netTransfers >= 0 ? `+${money(summary.netTransfers)}` : `-${money(Math.abs(summary.netTransfers))}`}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                {selectedAccountId === 'all' ? 'Trung hòa = 0₫ (Toàn bộ ví)' : 'Chênh lệch chuyển đến/đi'}
              </Typography>
            </Paper>

            {/* 5. Closing Balance */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                borderLeft: '4px solid #059669',
                borderColor: '#059669'
              }}
            >
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800 }}>
                5. (=) SỐ DƯ CUỐI KỲ
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: '#059669' }}>
                {money(summary.closingBalance)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Chuyển làm đầu kỳ tháng tiếp
              </Typography>
            </Paper>
          </Box>

          {/* FORMULA RECONCILIATION BAR */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle2 size={18} color="#10b981" />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Công thức chuẩn:
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
              {money(summary.openingBalance)} (Đầu kỳ) + {money(summary.totalIncome)} (Thu) - {money(summary.totalExpense)} (Chi)
              {summary.netTransfers !== 0 ? ` + ${money(summary.netTransfers)} (Chuyển ví)` : ''} = <strong>{money(summary.closingBalance)}</strong> (Cuối kỳ)
            </Typography>
          </Paper>
        </Box>
      )}

      {/* 2. BREAKDOWN BY ACCOUNT */}
      {activeSubTab === 'breakdown' && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Tài khoản / Ví</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Số dư đầu kỳ</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#10b981' }}>+ Thu nhập</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#f43f5e' }}>- Chi tiêu</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#8b5cf6' }}>Chuyển đến / đi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>= Số dư cuối kỳ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accountBreakdowns.map((b) => (
                <TableRow key={b.account.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <BankLogoBadge accountName={b.account.name} accountType={b.account.type} size="medium" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {b.account.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Loại: {b.account.type}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {money(b.openingBalance)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#10b981', fontWeight: 600 }}>
                    +{money(b.income)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#f43f5e', fontWeight: 600 }}>
                    -{money(b.expense)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                    {b.netTransfers >= 0 ? `+${money(b.netTransfers)}` : `-${money(Math.abs(b.netTransfers))}`}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#059669' }}>
                    {money(b.closingBalance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 3. MULTI-MONTH CONTINUITY TIMELINE */}
      {activeSubTab === 'multiMonth' && (
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Theo dõi chuỗi 6 tháng liên tiếp để đối soát tính bảo toàn số dư (Số dư cuối kỳ tháng trước = Số dư đầu kỳ tháng sau).
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tháng</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Số dư đầu kỳ</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#10b981' }}>+ Tổng thu</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#f43f5e' }}>- Tổng chi</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#8b5cf6' }}>Dòng tiền ròng</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>= Số dư cuối kỳ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Bảo toàn</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {multiMonthHistory.map((m, idx) => {
                  const nextMonth = multiMonthHistory[idx + 1];
                  const isContinuous = !nextMonth || Math.abs(m.closingBalance - nextMonth.openingBalance) < 1;
                  return (
                    <TableRow key={m.month} hover>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {formatVnMonth(m.month)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {money(m.openingBalance)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#10b981', fontWeight: 600 }}>
                        +{money(m.totalIncome)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#f43f5e', fontWeight: 600 }}>
                        -{money(m.totalExpense)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: m.netCashflow >= 0 ? '#10b981' : '#f43f5e' }}>
                        {m.netCashflow >= 0 ? `+${money(m.netCashflow)}` : `-${money(Math.abs(m.netCashflow))}`}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#059669' }}>
                        {money(m.closingBalance)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={isContinuous ? "Khớp 100%" : "Cần kiểm tra"}
                          size="small"
                          color={isContinuous ? "success" : "warning"}
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
}
