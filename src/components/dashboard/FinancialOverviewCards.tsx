import { Box, Paper, Typography, Tooltip, useTheme } from '@mui/material';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  PiggyBank,
  PieChart,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { money, shortMoney } from '../../lib/finance';
import { FINORA_TOKENS } from '../../theme/designTokens';
import type { NetWorthSummary } from '../../types/smartLedger';

interface FinancialOverviewCardsProps {
  netWorthSummary: NetWorthSummary;
  accountCount: number;
  income: number;
  incomeChange: number;
  expense: number;
  expenseChange: number;
  avgDailyExpense: number;
  topExpenseCategoryName?: string;
  netCashflow: number;
  savingsRate: number;
  totalSavings: number;
  budgetTotal: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetUsagePct: number;
  overBudgetCount: number;
  totalDebtOwed: number;
  upcomingDebtPayment: number;
  nextDueDebtDate?: string;
  showBalance: boolean;
  hideRiskyAssets: boolean;
}

export function FinancialOverviewCards({
  netWorthSummary,
  accountCount,
  income,
  incomeChange,
  expense,
  expenseChange,
  avgDailyExpense,
  topExpenseCategoryName,
  netCashflow,
  savingsRate,
  totalSavings,
  budgetTotal,
  budgetSpent,
  budgetRemaining,
  budgetUsagePct,
  overBudgetCount,
  totalDebtOwed,
  upcomingDebtPayment,
  nextDueDebtDate,
  showBalance,
  hideRiskyAssets
}: FinancialOverviewCardsProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const tokens = FINORA_TOKENS.overviewCards;
  const modeKey = isDark ? 'dark' : 'light';

  const mask = (val: string) => (showBalance ? val : '••••••••');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
      {/* ROW 1: 4 Core Financial Metrics (Tài sản, Thu nhập, Chi tiêu, Dòng tiền) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, sm: 2 }
        }}
      >
        {/* Card 1: Tổng tài sản / Số dư (Blue) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderRadius: '10px',
            bgcolor: tokens.assets[modeKey].bg,
            border: '1px solid',
            borderColor: tokens.assets[modeKey].border,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 122,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: isDark ? '0 4px 16px rgba(124, 58, 237, 0.25)' : '0 4px 12px rgba(124, 58, 237, 0.15)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 750, color: tokens.assets[modeKey].text, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                TỔNG TÀI SẢN & SỐ DƯ
              </Typography>
              <Tooltip title="Tổng hợp từ số dư tiền mặt, tài khoản ngân hàng và các danh mục đầu tư đã phân loại.">
                <Info size={13} style={{ color: tokens.assets[modeKey].accent, opacity: 0.8, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
            <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: tokens.assets[modeKey].iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.assets[modeKey].accent }}>
              <Landmark size={15} />
            </Box>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: isDark ? '#FFFFFF' : '#0F172A',
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontSize: { xs: '1.25rem', sm: '1.45rem' }
              }}
            >
              {mask(money(netWorthSummary.headlineNetWorth))}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.70rem' }}>
                {accountCount} tài khoản · Tiền mặt: {shortMoney(netWorthSummary.cashBalance)}
              </Typography>
              {hideRiskyAssets && (
                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, fontSize: '0.68rem' }}>
                  Thận trọng
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Card 2: Tổng thu nhập (Emerald) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderRadius: '10px',
            bgcolor: tokens.income[modeKey].bg,
            border: '1px solid',
            borderColor: tokens.income[modeKey].border,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 122,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: isDark ? '0 4px 16px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(16, 185, 129, 0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 750, color: tokens.income[modeKey].text, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                TỔNG THU NHẬP
              </Typography>
              <Tooltip title="Tổng số tiền thu nhập thực nhận trong tháng hiện tại.">
                <Info size={13} style={{ color: tokens.income[modeKey].accent, opacity: 0.8, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
            <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: tokens.income[modeKey].iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.income[modeKey].accent }}>
              <TrendingUp size={15} />
            </Box>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: isDark ? '#34D399' : '#059669',
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontSize: { xs: '1.25rem', sm: '1.45rem' }
              }}
            >
              {mask(`+${money(income)}`)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
              {incomeChange !== 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', color: incomeChange > 0 ? '#10B981' : '#EF4444', fontWeight: 750, fontSize: '0.72rem' }}>
                  {incomeChange > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  <span>{incomeChange > 0 ? '+' : ''}{incomeChange}%</span>
                </Box>
              ) : null}
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.70rem' }}>
                so với tháng trước
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Card 3: Tổng chi tiêu (Coral) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderRadius: '10px',
            bgcolor: tokens.expense[modeKey].bg,
            border: '1px solid',
            borderColor: tokens.expense[modeKey].border,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 122,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: isDark ? '0 4px 16px rgba(239, 68, 68, 0.2)' : '0 4px 12px rgba(239, 68, 68, 0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 750, color: tokens.expense[modeKey].text, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                TỔNG CHI TIÊU
              </Typography>
              <Tooltip title="Tổng số tiền đã chi tiêu hoàn tất trong tháng hiện tại.">
                <Info size={13} style={{ color: tokens.expense[modeKey].accent, opacity: 0.8, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
            <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: tokens.expense[modeKey].iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.expense[modeKey].accent }}>
              <TrendingDown size={15} />
            </Box>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: isDark ? '#F87171' : '#DC2626',
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontSize: { xs: '1.25rem', sm: '1.45rem' }
              }}
            >
              {mask(`-${money(expense)}`)}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.70rem' }}>
                  TB: {shortMoney(avgDailyExpense)}/ngày
                </Typography>
                {expenseChange !== 0 && (
                  <Typography variant="caption" sx={{ color: expenseChange > 0 ? '#EF4444' : '#10B981', fontWeight: 700, fontSize: '0.68rem' }}>
                    {expenseChange > 0 ? '+' : ''}{expenseChange}%
                  </Typography>
                )}
              </Box>
              {topExpenseCategoryName && (
                <Typography variant="caption" sx={{ color: tokens.expense[modeKey].text, fontWeight: 700, fontSize: '0.68rem' }}>
                  Lớn nhất: {topExpenseCategoryName}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Card 4: Dòng tiền ròng (Teal) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderRadius: '10px',
            bgcolor: tokens.cashflow[modeKey].bg,
            border: '1px solid',
            borderColor: tokens.cashflow[modeKey].border,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 122,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: isDark ? '0 4px 16px rgba(13, 148, 136, 0.2)' : '0 4px 12px rgba(13, 148, 136, 0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 750, color: tokens.cashflow[modeKey].text, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                DÒNG TIỀN RÒNG
              </Typography>
              <Tooltip title="Chênh lệch dòng tiền trong tháng: Thu nhập trừ Chi tiêu. Dương là thặng dư, âm là thâm hụt.">
                <Info size={13} style={{ color: tokens.cashflow[modeKey].accent, opacity: 0.8, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
            <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: tokens.cashflow[modeKey].iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.cashflow[modeKey].accent }}>
              <ArrowRightLeft size={15} />
            </Box>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: netCashflow >= 0 ? (isDark ? '#2DD4BF' : '#0D9488') : (isDark ? '#F87171' : '#DC2626'),
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontSize: { xs: '1.25rem', sm: '1.45rem' }
              }}
            >
              {mask(`${netCashflow >= 0 ? '+' : ''}${money(netCashflow)}`)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.70rem' }}>
                {netCashflow >= 0 ? 'Thặng dư tích lũy' : 'Thâm hụt cần bù'}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.cashflow[modeKey].text, fontWeight: 700, fontSize: '0.68rem' }}>
                {income > 0 ? `Còn ${Math.max(0, Math.round((netCashflow / income) * 100))}% thu nhập` : '0%'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* ROW 2: 3 Operational & Safety Metrics (Tiết kiệm, Ngân sách, Nghĩa vụ nợ) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: { xs: 1.5, sm: 2 }
        }}
      >
        {/* Card 5: Tỷ lệ tiết kiệm (Purple) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderRadius: '10px',
            bgcolor: tokens.savings[modeKey].bg,
            border: '1px solid',
            borderColor: tokens.savings[modeKey].border,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 110,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: isDark ? '0 4px 16px rgba(124, 58, 237, 0.2)' : '0 4px 12px rgba(124, 58, 237, 0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 750, color: tokens.savings[modeKey].text, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                TỶ LỆ TIẾT KIỆM
              </Typography>
              <Tooltip title="Tỷ lệ phần trăm số tiền dôi dư hoặc chuyển vào hũ tích lũy so với tổng thu nhập. Chuẩn khuyến nghị: >= 20%.">
                <Info size={13} style={{ color: tokens.savings[modeKey].accent, opacity: 0.8, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
            <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: tokens.savings[modeKey].iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.savings[modeKey].accent }}>
              <PiggyBank size={15} />
            </Box>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: isDark ? '#C084FC' : '#7C3AED',
                  letterSpacing: '-0.02em',
                  fontFeatureSettings: '"tnum"',
                  fontSize: { xs: '1.25rem', sm: '1.45rem' }
                }}
              >
                {savingsRate}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.75rem' }}>
                ({mask(money(totalSavings))})
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.70rem', display: 'block', mt: 0.5 }}>
              {savingsRate >= 20 ? 'Đạt chuẩn 20% tích lũy vững mạnh' : 'Khuyến nghị nâng tỷ lệ lên >= 20%'}
            </Typography>
          </Box>
        </Paper>

        {/* Card 6: Ngân sách tháng (Amber) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderRadius: '10px',
            bgcolor: tokens.budget[modeKey].bg,
            border: '1px solid',
            borderColor: tokens.budget[modeKey].border,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 110,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: isDark ? '0 4px 16px rgba(217, 119, 6, 0.2)' : '0 4px 12px rgba(217, 119, 6, 0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 750, color: tokens.budget[modeKey].text, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                TIẾN ĐỘ NGÂN SÁCH
              </Typography>
              <Tooltip title="Tỷ lệ chi tiêu thực tế so với tổng hạn mức ngân sách tháng đã phân bổ.">
                <Info size={13} style={{ color: tokens.budget[modeKey].accent, opacity: 0.8, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
            <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: tokens.budget[modeKey].iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.budget[modeKey].accent }}>
              <PieChart size={15} />
            </Box>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: isDark ? '#FBBF24' : '#D97706',
                  letterSpacing: '-0.02em',
                  fontFeatureSettings: '"tnum"',
                  fontSize: { xs: '1.25rem', sm: '1.45rem' }
                }}
              >
                {budgetUsagePct}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.75rem' }}>
                (Còn {shortMoney(budgetRemaining)})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.70rem' }}>
                Đã chi {shortMoney(budgetSpent)} / {shortMoney(budgetTotal)}
              </Typography>
              {overBudgetCount > 0 ? (
                <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 750, fontSize: '0.68rem' }}>
                  {overBudgetCount} mục vượt mức
                </Typography>
              ) : (
                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, fontSize: '0.68rem' }}>
                  Kiểm soát an toàn
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Card 7: Nghĩa vụ tài chính & Nợ (Rose / Orange) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderRadius: '10px',
            bgcolor: tokens.debt[modeKey].bg,
            border: '1px solid',
            borderColor: tokens.debt[modeKey].border,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 110,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: isDark ? '0 4px 16px rgba(234, 88, 12, 0.2)' : '0 4px 12px rgba(234, 88, 12, 0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 750, color: tokens.debt[modeKey].text, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                NGHĨA VỤ NỢ & TRẢ GÓP
              </Typography>
              <Tooltip title="Tổng các khoản vay mượn, thẻ tín dụng hoặc trả góp cần thanh toán.">
                <Info size={13} style={{ color: tokens.debt[modeKey].accent, opacity: 0.8, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
            <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: tokens.debt[modeKey].iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.debt[modeKey].accent }}>
              <ShieldAlert size={15} />
            </Box>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: totalDebtOwed > 0 ? (isDark ? '#FB923C' : '#EA580C') : (isDark ? '#34D399' : '#059669'),
                letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"',
                fontSize: { xs: '1.25rem', sm: '1.45rem' }
              }}
            >
              {mask(money(totalDebtOwed))}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.70rem' }}>
                {totalDebtOwed === 0 ? 'Không có áp lực nợ' : `Sắp đến hạn: ${shortMoney(upcomingDebtPayment)}`}
              </Typography>
              {nextDueDebtDate && (
                <Typography variant="caption" sx={{ color: tokens.debt[modeKey].text, fontWeight: 700, fontSize: '0.68rem' }}>
                  Hạn: {nextDueDebtDate}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

