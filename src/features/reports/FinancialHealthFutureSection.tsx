import { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
  LinearProgress
} from '@mui/material';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Compass,
  Flame,
  Sparkles,
  Repeat,
  Target,
  Trophy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { useFinance } from '../../store';
import { money, goalSaved } from '../../lib/finance';
import {
  calculateTrueSpendableBalance,
  analyzeFinancialRisks,
  calculateFinancialFreedom,
  type RiskAlert,
  type TrueSpendableResult,
  type FinancialFreedomProgress
} from '../../lib/riskAndInsightEngine';
import {
  detectRecurringPatterns,
  generateBudgetSuggestions,
  type DetectedRecurringPattern,
  type BudgetSuggestion
} from '../../lib/financialIntelligence';
import { FinancialHealthGaugeCluster } from '../../components/gauges/FinancialHealthGaugeCluster';

export function FinancialHealthFutureSection() {
  const data = useFinance(s => s.data);
  if (!data) return null;

  const [expandedAlerts, setExpandedAlerts] = useState(true);
  const [expandedFuture, setExpandedFuture] = useState(true);

  // 1. TRUE SPENDABLE BALANCE ANALYSIS
  const spendable: TrueSpendableResult = useMemo(() => {
    return calculateTrueSpendableBalance(data);
  }, [data]);

  // 2. RISK ALERTS
  const riskAlerts: RiskAlert[] = useMemo(() => {
    return analyzeFinancialRisks(data);
  }, [data]);

  // 3. FINANCIAL FREEDOM PROGRESS
  const freedom: FinancialFreedomProgress = useMemo(() => {
    return calculateFinancialFreedom(data);
  }, [data]);

  // 4. DETECTED RECURRING TRANSACTIONS / SUBSCRIPTIONS
  const recurringPatterns: DetectedRecurringPattern[] = useMemo(() => {
    return detectRecurringPatterns(data.transactions || [], data.recurring || []);
  }, [data.transactions, data.recurring]);

  // 5. BUDGET SUGGESTIONS FOR TRIMMING
  const budgetSuggestions: BudgetSuggestion[] = useMemo(() => {
    return generateBudgetSuggestions(data.transactions || [], data.categories || [], data.budgets || []);
  }, [data.transactions, data.categories, data.budgets]);

  // 6. GOALS ACHIEVED & IN-PROGRESS EVALUATION
  const { completedGoals, inProgressGoals } = useMemo(() => {
    const goals = data.goals || [];
    const completed = goals.filter(g => goalSaved(g) >= g.target);
    const inProgress = goals.filter(g => goalSaved(g) < g.target);
    return { completedGoals: completed, inProgressGoals: inProgress };
  }, [data.goals]);

  // Status Color Helper
  const getStatusColor = (status: 'safe' | 'warning' | 'danger') => {
    if (status === 'safe') return '#10B981';
    if (status === 'warning') return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Box sx={{ width: '100%', mb: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. SPEEDOMETER GAUGES CLUSTER */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.75 },
          borderRadius: '12px',
          bgcolor: 'background.paper',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}
      >
        <FinancialHealthGaugeCluster />
      </Paper>

      {/* 2. TRUE SPENDABLE CASH DIAGNOSTIC & BURN RATE */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.75 },
          borderRadius: '12px',
          bgcolor: 'background.paper',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Zap size={20} color="var(--brand-primary)" />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16.5 }}>
                Chẩn Đoán Số Dư Thực Chi An Toàn (True Spendable)
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
              Khấu trừ các nghĩa vụ sắp tới (hóa đơn, thẻ tín dụng, nợ đến hạn) để xác định số tiền thực sự có thể chi tiêu
            </Typography>
          </Box>
          <Chip
            label={spendable.status === 'safe' ? "Thanh khoản an toàn" : spendable.status === 'warning' ? "Cảnh báo thắt chặt" : "Nguy cơ thâm hụt"}
            size="small"
            sx={{
              bgcolor: `${getStatusColor(spendable.status)}1A`,
              color: getStatusColor(spendable.status),
              fontWeight: 800,
              border: `1px solid ${getStatusColor(spendable.status)}4D`
            }}
          />
        </Box>

        {/* 4 CARDS: LIQUIDITY -> DEDUCTIONS -> TRUE BALANCE -> DAILY LIMIT */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3
          }}
        >
          {/* Card 1: Total Liquid */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px', bgcolor: 'action.hover', borderLeft: '4px solid #3B82F6' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              1. TỔNG THANH KHOẢN HIỆN CÓ
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: '#3B82F6' }}>
              {money(spendable.liquidity)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              Tiền mặt + Ngân hàng khả dụng
            </Typography>
          </Paper>

          {/* Card 2: Committed Obligations */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px', bgcolor: 'action.hover', borderLeft: '4px solid #EF4444' }}>
            <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700 }}>
              2. (-) NGHĨA VỤ ĐÃ CAM KẾT
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: '#EF4444' }}>
              -{money(spendable.upcomingRecurringBills + spendable.creditCardDueBalance + spendable.debtsDueThisMonth)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              Hóa đơn ({money(spendable.upcomingRecurringBills)}) + Nợ/Thẻ ({money(spendable.creditCardDueBalance + spendable.debtsDueThisMonth)})
            </Typography>
          </Paper>

          {/* Card 3: True Balance */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px', bgcolor: 'action.hover', borderLeft: `4px solid ${getStatusColor(spendable.status)}` }}>
            <Typography variant="caption" sx={{ color: getStatusColor(spendable.status), fontWeight: 800 }}>
              3. (=) SỐ DƯ THỰC AN TOÀN
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: getStatusColor(spendable.status) }}>
              {money(spendable.trueBalance)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              Số tiền tiêu mà không sợ hụt tiền trả nợ
            </Typography>
          </Paper>

          {/* Card 4: Daily Limit & Burn Rate */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px', bgcolor: 'action.hover', borderLeft: '4px solid #8B5CF6' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#8B5CF6', fontWeight: 750 }}>
                4. HẠN MỨC TIÊU/NGÀY
              </Typography>
              <Flame size={15} color="#8B5CF6" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: '#8B5CF6' }}>
              {money(spendable.dailySafeToSpend)}<span style={{ fontSize: '0.75rem', fontWeight: 600 }}>/ngày</span>
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              Còn {spendable.daysRemainingInMonth} ngày trong tháng hiện tại
            </Typography>
          </Paper>
        </Box>

        {/* BURN RATE STRIP */}
        <Box sx={{ p: 1.75, borderRadius: '8px', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Flame size={17} color="#F59E0B" />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Tốc độ đốt tiền 7 ngày gần nhất: <strong>{money(spendable.burnRate7Days)}/ngày</strong>
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
            {spendable.burnRateDaysLeft < 999 ? (
              <span>Dự kiến cạn kiệt thanh khoản sau: <strong style={{ color: spendable.burnRateDaysLeft < 30 ? '#EF4444' : '#F59E0B' }}>{spendable.burnRateDaysLeft} ngày</strong> ({spendable.burnRateExhaustionDate})</span>
            ) : (
              <span>Thanh khoản dồi dào vững vàng (&gt;999 ngày)</span>
            )}
          </Typography>
        </Box>
      </Paper>

      {/* 3. ACTIVE RISK ALERTS & WARNINGS (DISTINCT RED/AMBER PALETTE) */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.75 },
          borderRadius: '12px',
          bgcolor: 'background.paper',
          borderColor: riskAlerts.length ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-subtle)',
          borderLeft: riskAlerts.length ? '5px solid #EF4444' : '5px solid #10B981',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: riskAlerts.length ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldAlert size={18} color={riskAlerts.length ? "#EF4444" : "#10B981"} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 850, fontSize: 16.5, color: riskAlerts.length ? '#DC2626' : '#059669' }}>
                🚨 CẢNH BÁO RỦI RO & BẤT THƯỜNG ({riskAlerts.length})
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
                Phát hiện sớm nguy cơ thiếu hụt dòng tiền, quá hạn thanh toán và thâm hụt danh mục
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setExpandedAlerts(prev => !prev)}>
            {expandedAlerts ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </IconButton>
        </Box>

        <Collapse in={expandedAlerts}>
          {riskAlerts.length ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {riskAlerts.map(alert => {
                const isCritical = alert.level === 'critical';
                const isWarning = alert.level === 'warning';
                const color = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#3B82F6';
                const titleColor = isCritical ? '#B91C1C' : isWarning ? '#B45309' : '#1D4ED8';
                return (
                  <Box
                    key={alert.id}
                    sx={{
                      p: 1.75,
                      borderRadius: '8px',
                      bgcolor: `${color}0D`,
                      border: `1px solid ${color}33`,
                      borderLeft: `4px solid ${color}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 1.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                      {isCritical ? (
                        <AlertTriangle size={18} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
                      ) : (
                        <Info size={18} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: titleColor }}>
                          {alert.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
                          {alert.description}
                        </Typography>
                      </Box>
                    </Box>

                    {alert.actionLabel && (
                      <Chip
                        label={alert.actionLabel}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: 11,
                          bgcolor: `${color}1A`,
                          color,
                          alignSelf: { xs: 'flex-end', sm: 'center' },
                          flexShrink: 0
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
              <CheckCircle2 size={24} color="#10B981" style={{ margin: '0 auto 8px auto' }} />
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981' }}>
                Hệ thống ổn định: Chưa phát hiện rủi ro nợ xấu hoặc thâm hụt ngân sách
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Tất cả các chỉ số an toàn thanh khoản và danh mục đều nằm trong ngưỡng kiểm soát an toàn.
              </Typography>
            </Box>
          )}
        </Collapse>
      </Paper>

      {/* 4. SMART AI RECOMMENDATIONS & OPTIMIZATIONS (DISTINCT ROYAL PURPLE PALETTE) */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.75 },
          borderRadius: '12px',
          bgcolor: 'background.paper',
          borderColor: 'rgba(139, 92, 246, 0.35)',
          borderLeft: '5px solid #8B5CF6',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: 'rgba(139, 92, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={18} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, fontSize: 16.5, color: '#7C3AED' }}>
              💡 KHUYẾN NGHỊ TỐI ƯU HÓA & ĐỀ XUẤT HÀNH ĐỘNG
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
              Các giải pháp cụ thể giúp bạn cắt giảm lãng phí, tối ưu hóa ngân sách và gia tăng tốc độ tích sản
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2.5 }}>
          {/* Tip 1: Budget Trimming */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: '10px',
              bgcolor: 'rgba(16, 185, 129, 0.03)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderLeft: '4px solid #10B981'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TrendingUp size={16} color="#10B981" />
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#047857' }}>
                1. Tinh gọn ngân sách chi tiêu
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Nếu cắt giảm 10% các khoản chi ngoài thiết yếu (cafe, ăn vặt, mua sắm tùy hứng), bạn sẽ giữ lại được khoảng <strong>1.500.000₫ – 3.000.000₫/tháng</strong> để chuyển thẳng vào quỹ tích sản sinh lời.
            </Typography>
            {budgetSuggestions.length > 0 && (
              <Chip
                label={`Gợi ý điều chỉnh ${budgetSuggestions[0].categoryName}`}
                size="small"
                sx={{ fontSize: 11, fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}
              />
            )}
          </Paper>

          {/* Tip 2: Recurring Subscriptions Audit */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: '10px',
              bgcolor: 'rgba(59, 130, 246, 0.03)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderLeft: '4px solid #3B82F6'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Repeat size={16} color="#3B82F6" />
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#1D4ED8' }}>
                2. Rà soát hóa đơn & dịch vụ định kỳ
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Phát hiện {recurringPatterns.length} mẫu giao dịch lặp lại định kỳ. Hãy hủy các gói đăng ký không còn sử dụng (app, dịch vụ streaming, thẻ tập ít đi) để giải phóng dòng tiền ròng.
            </Typography>
            <Chip
              label="Kiểm tra mục Giao dịch định kỳ"
              size="small"
              sx={{ fontSize: 11, fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}
            />
          </Paper>

          {/* Tip 3: Emergency Fund Priority */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: '10px',
              bgcolor: 'rgba(245, 158, 11, 0.03)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderLeft: '4px solid #F59E0B'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ShieldCheck size={16} color="#F59E0B" />
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#B45309' }}>
                3. Nguyên tắc phòng thủ trước khi tấn công
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Tuyệt đối duy trì quỹ khẩn cấp tối thiểu 3 đến 6 tháng chi phí sinh hoạt trước khi phân bổ vào các kênh đầu tư có rủi ro biến động giá.
            </Typography>
          </Paper>

          {/* Tip 4: Compounding Acceleration */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: '10px',
              bgcolor: 'rgba(139, 92, 246, 0.03)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderLeft: '4px solid #8B5CF6'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Target size={16} color="#8B5CF6" />
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#7C3AED' }}>
                4. Đòn bẩy thời gian & Lãi kép
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Tích lũy đều đặn 5.000.000₫/tháng với lợi suất kỳ vọng 9%/năm sẽ tạo ra hơn <strong>400.000.000₫</strong> sau 5 năm và vượt <strong>1.100.000.000₫</strong> sau 10 năm nhờ sức mạnh lãi kép.
            </Typography>
          </Paper>
        </Box>
      </Paper>

      {/* 5. GOAL ACHIEVEMENTS & IN-PROGRESS MILESTONES (DISTINCT EMERALD & CYAN PALETTE) */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.75 },
          borderRadius: '12px',
          bgcolor: 'background.paper',
          borderColor: 'rgba(16, 185, 129, 0.35)',
          borderLeft: '5px solid #10B981',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trophy size={18} color="#10B981" />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, fontSize: 16.5, color: '#059669' }}>
              🎯 ĐẠT MỤC TIÊU & TIẾN ĐỘ TÍCH SẢN
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
              Theo dõi các mục tiêu tài chính đã hoàn thành và tiến độ các mục tiêu đang bám đuổi
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {/* Card: Đã đạt mục tiêu */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: '10px',
              bgcolor: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle2 size={16} color="#10B981" />
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#047857' }}>
                  Mục tiêu đã hoàn thành ({completedGoals.length})
                </Typography>
              </Box>
              <Chip
                label="Thành tích xuất sắc"
                size="small"
                sx={{ fontSize: 10.5, fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}
              />
            </Box>
            {completedGoals.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {completedGoals.slice(0, 3).map(g => (
                  <Box key={g.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {g.name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#10B981' }}>
                      {money(goalSaved(g))} / {money(g.target)} (100%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                Tiếp tục tích lũy kiên trì để chinh phục cột mốc mục tiêu đầu tiên!
              </Typography>
            )}
          </Paper>

          {/* Card: Tiến độ đang hoàn thành */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: '10px',
              bgcolor: 'rgba(6, 182, 212, 0.04)',
              border: '1px solid rgba(6, 182, 212, 0.25)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp size={16} color="#06B6D4" />
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0891B2' }}>
                  Tiến độ đang hoàn thành ({inProgressGoals.length})
                </Typography>
              </Box>
              <Chip
                label="Đang tăng tốc"
                size="small"
                sx={{ fontSize: 10.5, fontWeight: 800, bgcolor: 'rgba(6, 182, 212, 0.15)', color: '#0891B2' }}
              />
            </Box>
            {inProgressGoals.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 1 }}>
                {inProgressGoals.slice(0, 2).map(g => {
                  const saved = goalSaved(g);
                  const pct = Math.min(100, Math.round((saved / (g.target || 1)) * 100));
                  return (
                    <Box key={g.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {g.name}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0891B2' }}>
                          {pct}% ({money(saved)})
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(6, 182, 212, 0.15)',
                          '& .MuiLinearProgress-bar': { bgcolor: '#06B6D4', borderRadius: 3 }
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                Chưa có mục tiêu đang thực hiện. Hãy tạo mục tiêu mới trong Sổ Tiết Kiệm!
              </Typography>
            )}
          </Paper>
        </Box>
      </Paper>

      {/* 6. FUTURE OUTLOOK & FINANCIAL FREEDOM ROADMAP (CYBER BLUE & CYAN) */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.75 },
          borderRadius: '12px',
          bgcolor: 'background.paper',
          borderColor: 'rgba(2, 132, 199, 0.35)',
          borderLeft: '5px solid #0284C7',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: 'rgba(2, 132, 199, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Compass size={18} color="#0284C7" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 850, fontSize: 16.5, color: '#0369A1' }}>
                🚀 HƯỚNG TỚI TƯƠNG LAI: LỘ TRÌNH TỰ DO TÀI CHÍNH (FIRE)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
                Đo lường mức độ độc lập tài chính và số tháng tự do nếu dừng hoàn toàn công việc
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setExpandedFuture(prev => !prev)}>
            {expandedFuture ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </IconButton>
        </Box>

        <Collapse in={expandedFuture}>
          {/* Freedom Metrics Strip */}
          <Box
            sx={{
              p: 2,
              borderRadius: '10px',
              bgcolor: 'action.hover',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
              mb: 3
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                TỶ LỆ TỰ DO TÀI CHÍNH
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0284C7', mt: 0.5 }}>
                {freedom.freedomRatio}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Thu nhập thụ động / Chi phí thiết yếu
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                THU NHẬP THỤ ĐỘNG/THÁNG
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#10B981', mt: 0.5 }}>
                {money(freedom.monthlyPassiveIncome)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Từ cổ tức, lãi tiền gửi, tiền thuê
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                SỐ THÁNG TỰ DO DỰ KIẾN
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#8B5CF6', mt: 0.5 }}>
                {freedom.freedomRunwayMonths > 999 ? '∞ Vô hạn' : `${freedom.freedomRunwayMonths} tháng`}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Duy trì sống tự do không cần làm việc
              </Typography>
            </Box>
          </Box>

          {/* 4 STAGES ROADMAP */}
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
            Hành trình 4 Cột mốc Vững bền:
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 1.5
            }}
          >
            {/* Stage 1 */}
            <Box sx={{ p: 1.5, borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', bgcolor: 'background.paper', borderTop: '3px solid #3B82F6' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Chip label="Cột mốc 1" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }} />
                <Typography variant="body2" sx={{ fontWeight: 750, color: '#1D4ED8' }}>
                  Phòng thủ an toàn
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Xây dựng quỹ khẩn cấp đủ 3–6 tháng chi phí sinh hoạt.
              </Typography>
            </Box>

            {/* Stage 2 */}
            <Box sx={{ p: 1.5, borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.3)', bgcolor: 'background.paper', borderTop: '3px solid #06B6D4' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Chip label="Cột mốc 2" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4' }} />
                <Typography variant="body2" sx={{ fontWeight: 750, color: '#0891B2' }}>
                  Sạch nợ tiêu dùng
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Xóa sạch dư nợ thẻ tín dụng và các khoản nợ lãi suất cao.
              </Typography>
            </Box>

            {/* Stage 3 */}
            <Box sx={{ p: 1.5, borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', bgcolor: 'background.paper', borderTop: '3px solid #8B5CF6' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Chip label="Cột mốc 3" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }} />
                <Typography variant="body2" sx={{ fontWeight: 750, color: '#7C3AED' }}>
                  Tăng tốc tích sản
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Đạt tỷ lệ tiết kiệm &gt; 30%, dòng tiền thụ động bù đắp 50% chi phí.
              </Typography>
            </Box>

            {/* Stage 4 */}
            <Box sx={{ p: 1.5, borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', bgcolor: 'background.paper', borderTop: '3px solid #10B981' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Chip label="Cột mốc 4" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }} />
                <Typography variant="body2" sx={{ fontWeight: 750, color: '#059669' }}>
                  Tự do tài chính
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Thu nhập thụ động vượt 100% chi phí sinh hoạt. Tự chủ thời gian trọn vẹn.
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}
