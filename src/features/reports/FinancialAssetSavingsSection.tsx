import { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  Button
} from '@mui/material';
import {
  PiggyBank,
  Wallet,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Coins,
  Receipt,
  Scale
} from 'lucide-react';

import { useFinance } from '../../store';
import { money, balance, debtRemaining, netWorth } from '../../lib/finance';
import { AssetProjectionSection } from '../../components/smartLedger/AssetProjectionSection';
import type { Transaction } from '../../types';

interface FinancialAssetSavingsSectionProps {
  filteredTransactions: Transaction[];
  income: number;
  expense: number;
  difference: number;
  savingsRate: number;
}

export function FinancialAssetSavingsSection({
  filteredTransactions,
  income,
  difference,
  savingsRate
}: FinancialAssetSavingsSectionProps) {
  const data = useFinance(s => s.data);
  if (!data) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'projection'>('overview');

  // 1. LIQUID CASH & ACCOUNTS
  const liquidAccounts = useMemo(() => {
    return (data.accounts || []).filter(a => a.type === 'cash' || a.type === 'bank' || a.type === 'ewallet');
  }, [data.accounts]);

  const totalLiquid = useMemo(() => {
    return liquidAccounts.reduce((sum, a) => sum + balance(a, data.transactions || []), 0);
  }, [liquidAccounts, data.transactions]);

  // 2. INVESTMENTS VALUE
  const smartNotes = data.smartInvestmentNotes || [];
  const totalInvestments = useMemo(() => {
    return smartNotes.reduce((sum, n) => sum + (n.currentEstimatedValue || 0), 0);
  }, [smartNotes]);

  // 3. RECEIVABLES & DEBTS
  const debts = data.debts || [];
  const totalReceivable = useMemo(() => {
    return debts.filter(d => d.kind === 'lent').reduce((sum, d) => sum + debtRemaining(d), 0);
  }, [debts]);

  const totalDebtOwed = useMemo(() => {
    return debts.filter(d => d.kind === 'owed').reduce((sum, d) => sum + debtRemaining(d), 0);
  }, [debts]);

  // 4. TOTAL ASSETS & CURRENT NET WORTH
  const currentNetWorth = netWorth(data);

  // 5. 50/30/20 RULE CALCULATION BASED ON TRANSACTIONS
  const rule503020 = useMemo(() => {
    const expenseTxs = filteredTransactions.filter(t => t.type === 'expense' && t.status === 'completed');
    const categoriesMap = new Map((data.categories || []).map(c => [c.id, c.name.toLowerCase()]));

    let needsSpent = 0;
    let wantsSpent = 0;

    const needsKeywords = ['ăn', 'thực phẩm', 'uống', 'nhà', 'thuê', 'điện', 'nước', 'xăng', 'xe', 'y tế', 'thuốc', 'bảo hiểm', 'học', 'giáo dục', 'hóa đơn', 'internet', 'sinh hoạt'];

    for (const tx of expenseTxs) {
      const catName = (tx.categoryId ? categoriesMap.get(tx.categoryId) : '') || '';
      const isNeed = needsKeywords.some(kw => catName.includes(kw));
      if (isNeed) {
        needsSpent += tx.amount;
      } else {
        wantsSpent += tx.amount;
      }
    }

    const totalIncome = Math.max(1, income);
    const needsPct = Math.round((needsSpent / totalIncome) * 100);
    const wantsPct = Math.round((wantsSpent / totalIncome) * 100);
    const savingsAmount = Math.max(0, difference);
    const actualSavingsPct = Math.round((savingsAmount / totalIncome) * 100);

    let assessment = 'Đạt chuẩn vàng 50/30/20';
    let assessmentColor = '#10B981';

    if (needsPct > 60) {
      assessment = 'Chi phí thiết yếu cao (>60% thu nhập)';
      assessmentColor = '#EF4444';
    } else if (wantsPct > 35) {
      assessment = 'Chi tiêu linh hoạt vượt chuẩn (>35% thu nhập)';
      assessmentColor = '#F59E0B';
    } else if (actualSavingsPct >= 25) {
      assessment = 'Tỷ lệ tích lũy vượt bậc (≥25% thu nhập)';
      assessmentColor = '#10B981';
    }

    return {
      needsSpent,
      needsPct,
      wantsSpent,
      wantsPct,
      savingsAmount,
      actualSavingsPct,
      assessment,
      assessmentColor
    };
  }, [filteredTransactions, data.categories, income, difference]);

  // 7. EMERGENCY FUND RUNWAY (Months of survival)
  const monthlyBurn = useMemo(() => {
    // 30 days expense benchmark
    const expenseTxs = (data.transactions || []).filter(t => t.type === 'expense' && t.status === 'completed');
    const sum = expenseTxs.slice(0, 30).reduce((s, t) => s + t.amount, 0);
    return Math.max(8000000, sum); // default min benchmark 8m/month
  }, [data.transactions]);

  const runwayMonths = useMemo(() => {
    return (totalLiquid / monthlyBurn).toFixed(1);
  }, [totalLiquid, monthlyBurn]);

  const runwayScore = Number(runwayMonths);
  const runwayStatus = useMemo(() => {
    if (runwayScore >= 6) {
      return {
        label: 'Vững chắc tối ưu (≥ 6 tháng)',
        color: '#10B981',
        desc: 'Bạn có đủ thanh khoản để đối mặt với mọi rủi ro gián đoạn công việc hoặc sự cố kinh tế.',
        level: 'good'
      };
    }
    if (runwayScore >= 3) {
      return {
        label: 'An toàn cơ bản (3 - 6 tháng)',
        color: '#3B82F6',
        desc: 'Đạt ngưỡng phòng vệ cơ bản. Nên tích lũy thêm để gia tăng vùng đệm an toàn lên mức 6 tháng.',
        level: 'warning'
      };
    }
    return {
      label: 'Báo động mỏng (< 3 tháng)',
      color: '#EF4444',
      desc: 'Quỹ thanh khoản dự phòng đang ở mức mỏng. Cần hạn chế các khoản mua sắm tùy hứng và tăng tốc dự phòng.',
      level: 'danger'
    };
  }, [runwayScore]);

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* SECTION HEADER & VIEW SWITCHER */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: '12px',
          bgcolor: 'background.paper',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          mb: 3
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: 'rgba(59, 130, 246, 0.12)',
                  color: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PiggyBank size={20} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Phân tích Tài sản & Sức chứa Tiết kiệm
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Tỷ lệ tích lũy đạt {savingsRate}% trong kỳ • Bóc tách cơ cấu tài sản ròng, đối chuẩn tỷ lệ 50/30/20 và mô phỏng tương lai
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={activeTab === 'overview' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setActiveTab('overview')}
              startIcon={<Scale size={15} />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: 13 }}
            >
              Cơ cấu & Quy tắc 50/30/20
            </Button>
            <Button
              variant={activeTab === 'projection' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setActiveTab('projection')}
              startIcon={<TrendingUp size={15} />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: 13 }}
            >
              Mô phỏng Lãi kép Tương lai
            </Button>
          </Box>
        </Box>
      </Paper>

      {activeTab === 'overview' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 4 ASSET & DEBT METRIC CARDS */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2
            }}
          >
            {/* Card 1: Liquid Cash */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.25,
                borderRadius: '10px',
                bgcolor: 'background.paper',
                borderLeft: '4px solid #3B82F6',
                borderColor: 'var(--border-subtle)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, textTransform: 'uppercase' }}>
                  Tiền mặt & Ngân hàng
                </Typography>
                <Wallet size={17} color="#3B82F6" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 1, color: '#3B82F6' }}>
                {money(totalLiquid)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                {liquidAccounts.length} ví/tài khoản thanh khoản cao
              </Typography>
            </Paper>

            {/* Card 2: Investment Notes */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.25,
                borderRadius: '10px',
                bgcolor: 'background.paper',
                borderLeft: '4px solid #10B981',
                borderColor: 'var(--border-subtle)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, textTransform: 'uppercase' }}>
                  Danh mục Tích sản
                </Typography>
                <Coins size={17} color="#10B981" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 1, color: '#10B981' }}>
                {money(totalInvestments)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                {smartNotes.length} vị thế đầu tư ghi nhận
              </Typography>
            </Paper>

            {/* Card 3: Receivables */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.25,
                borderRadius: '10px',
                bgcolor: 'background.paper',
                borderLeft: '4px solid #8B5CF6',
                borderColor: 'var(--border-subtle)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, textTransform: 'uppercase' }}>
                  Cho vay (Phải thu)
                </Typography>
                <Receipt size={17} color="#8B5CF6" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 1, color: '#8B5CF6' }}>
                {money(totalReceivable)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Dòng tiền người khác nợ bạn
              </Typography>
            </Paper>

            {/* Card 4: Debts Owed */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.25,
                borderRadius: '10px',
                bgcolor: 'background.paper',
                borderLeft: '4px solid #EF4444',
                borderColor: 'var(--border-subtle)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, textTransform: 'uppercase' }}>
                  Tổng nợ phải trả
                </Typography>
                <AlertTriangle size={17} color="#EF4444" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 1, color: '#EF4444' }}>
                -{money(totalDebtOwed)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Nghĩa vụ tài chính cần giải phóng
              </Typography>
            </Paper>
          </Box>

          {/* ROW 2: 50/30/20 RULE BENCHMARK & EMERGENCY FUND RUNWAY */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' },
              gap: 2.5
            }}
          >
            {/* LEFT: 50/30/20 SAVINGS RULE */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: '12px',
                bgcolor: 'background.paper',
                borderColor: 'var(--border-subtle)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Scale size={18} color="var(--brand-primary)" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
                      Đối Chuẩn Quy Tắc Phân Bổ 50 / 30 / 20
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                    Mô hình vàng quản lý tài chính cá nhân chuẩn quốc tế
                  </Typography>
                </Box>
                <Chip
                  label={rule503020.assessment}
                  size="small"
                  sx={{
                    bgcolor: `${rule503020.assessmentColor}1A`,
                    color: rule503020.assessmentColor,
                    fontWeight: 800,
                    border: `1px solid ${rule503020.assessmentColor}4D`
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
                {/* 1. Needs (Thiết yếu - Chuẩn 50%) */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>1. Chi phí Thiết yếu (Needs)</span>
                      <Chip label="Chuẩn ≤ 50%" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: rule503020.needsPct > 55 ? '#EF4444' : 'text.primary' }}>
                      {money(rule503020.needsSpent)} ({rule503020.needsPct}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, rule503020.needsPct)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: rule503020.needsPct > 55 ? '#EF4444' : '#3B82F6',
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: 11 }}>
                    Bao gồm ăn uống gia đình, tiền nhà, điện nước, xăng xe và các nhu cầu cơ bản sinh tồn.
                  </Typography>
                </Box>

                {/* 2. Wants (Linh hoạt - Chuẩn 30%) */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>2. Chi tiêu Linh hoạt (Wants)</span>
                      <Chip label="Chuẩn ≤ 30%" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: rule503020.wantsPct > 35 ? '#EF4444' : 'text.primary' }}>
                      {money(rule503020.wantsSpent)} ({rule503020.wantsPct}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, rule503020.wantsPct)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: rule503020.wantsPct > 35 ? '#EF4444' : '#F59E0B',
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: 11 }}>
                    Bao gồm mua sắm cá nhân, ăn tiệm, cafe, giải trí, sở thích nâng cao chất lượng sống.
                  </Typography>
                </Box>

                {/* 3. Savings (Tích lũy & Đầu tư - Chuẩn 20%) */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>3. Tiết kiệm & Tích sản (Savings)</span>
                      <Chip label="Chuẩn ≥ 20%" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981' }}>
                      {money(rule503020.savingsAmount)} ({rule503020.actualSavingsPct}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, rule503020.actualSavingsPct)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#10B981',
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: 11 }}>
                    Khoản tiền tích sản ròng để xây dựng tự do tài chính và đầu tư sinh lãi kép.
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* RIGHT: EMERGENCY FUND RUNWAY */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: '12px',
                bgcolor: 'background.paper',
                borderColor: 'var(--border-subtle)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ShieldCheck size={18} color={runwayStatus.color} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
                    Quỹ Dự Phòng Khẩn Cấp
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                  Thời gian sống sót an toàn nếu đột ngột mất toàn bộ nguồn thu nhập
                </Typography>

                <Box sx={{ my: 3, textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: '10px' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                    Thanh khoản duy trì thực tế
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: runwayStatus.color, my: 0.5 }}>
                    {runwayMonths} <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>tháng</span>
                  </Typography>
                  <Chip
                    label={runwayStatus.label}
                    size="small"
                    sx={{
                      bgcolor: `${runwayStatus.color}1A`,
                      color: runwayStatus.color,
                      fontWeight: 800,
                      border: `1px solid ${runwayStatus.color}4D`
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12.5, lineHeight: 1.5 }}>
                  {runwayStatus.desc}
                </Typography>
              </Box>

              <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                  Chi phí duy trì/tháng:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {money(monthlyBurn)}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      ) : (
        /* PROJECTION VIEW: WEALTH ACCUMULATION ENGINE */
        <Box>
          <AssetProjectionSection
            currentNetWorth={currentNetWorth}
            initialMonthlySavings={Math.max(2000000, difference > 0 ? difference : 5000000)}
            initialExpectedRate={9.0}
          />
        </Box>
      )}
    </Box>
  );
}