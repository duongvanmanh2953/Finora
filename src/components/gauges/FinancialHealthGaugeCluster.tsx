import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { SemiCircleGauge } from './SemiCircleGauge';
import { useFinance } from '../../store';
import { balance, debtRemaining, money } from '../../lib/finance';
import { getSampleWealthInvestmentNotes } from '../../lib/investmentProjectionEngine';

export function FinancialHealthGaugeCluster() {
  const data = useFinance(s => s.data);
  if (!data) return null;

  // 1. LIQUID CASH & DEBT CALCULATION
  const cashAccounts = (data.accounts || []).filter(a => a.type === 'cash' || a.type === 'bank' || a.type === 'ewallet');
  const totalCash = cashAccounts.reduce((sum, a) => sum + balance(a, data.transactions || []), 0);

  const debtsOwed = (data.debts || []).filter(d => d.kind === 'owed');
  const totalDebtOwed = debtsOwed.reduce((sum, d) => sum + debtRemaining(d), 0);

  const notes = (data.smartInvestmentNotes && data.smartInvestmentNotes.length > 0)
    ? data.smartInvestmentNotes
    : getSampleWealthInvestmentNotes();

  const currentInvestmentValue = notes.reduce((s, n) => s + (n.currentEstimatedValue || 0), 0);
  const highRiskValue = notes.filter(n => n.risk_level === 'HIGH').reduce((s, n) => s + (n.currentEstimatedValue || 0), 0);

  const totalAssets = totalCash + currentInvestmentValue;

  // 2. RECENT 30-DAY EXPENSE FOR RUNWAY
  const last30DaysExpense = useMemo(() => {
    const expenseTxs = (data.transactions || []).filter(t => t.type === 'expense' && t.status === 'completed');
    const sum = expenseTxs.slice(0, 30).reduce((s, t) => s + t.amount, 0);
    return Math.max(10000000, sum); // default benchmark 10m/month if new account
  }, [data.transactions]);

  const runwayMonths = (totalCash / (last30DaysExpense || 1)).toFixed(1);

  // 3. GAUGE SCORES COMPUTATION (0 to 100, higher = more risky)
  
  // A. Debt Risk Score: Debt / Assets ratio + Absolute debt
  const debtToAssetsRatio = totalAssets > 0 ? (totalDebtOwed / totalAssets) * 100 : 0;
  const debtScore = Math.min(100, Math.round(debtToAssetsRatio * 1.5 + (totalDebtOwed > 100000000 ? 25 : 0)));

  // B. Liquidity Risk Score: Inverse of runway months (ideal: >= 6 months = 0 risk)
  const liquidityScore = Math.max(0, Math.min(100, Math.round((6 - Number(runwayMonths)) * 16.6)));

  // C. Investment & Unrecovered Risk Score: High risk ratio + unrecovered ratio
  const highRiskRatio = currentInvestmentValue > 0 ? (highRiskValue / currentInvestmentValue) * 100 : 0;
  const investmentRiskScore = Math.min(100, Math.round(highRiskRatio * 0.7 + (notes.filter(n => n.status === 'AT_RISK_LOSS').length > 0 ? 30 : 0)));

  // D. Overall Financial Risk (Weighted Aggregate)
  const overallRiskScore = Math.round(
    debtScore * 0.35 +
    liquidityScore * 0.35 +
    investmentRiskScore * 0.30
  );

  // E. Goal Feasibility (Inverted: higher score = higher feasibility)
  const activeGoals = data.goals || [];
  const primaryGoal = activeGoals[0];
  const goalCurrent = primaryGoal ? (primaryGoal.contributions || []).reduce((s, c) => s + c.amount, 0) : 0;
  const goalTarget = primaryGoal ? primaryGoal.target : 1;
  const goalProgressPct = primaryGoal ? Math.round((goalCurrent / goalTarget) * 100) : 0;
  // Feasibility combines progress rate + healthy runway
  const goalFeasibilityScore = primaryGoal ? Math.min(100, Math.round(goalProgressPct * 0.6 + (Number(runwayMonths) >= 3 ? 35 : 15))) : 80;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '1.15rem', color: 'text.primary' }}>
            Bộ Đo Lường Rủi Ro & Sức Khỏe Tài Chính (Speedometer Gauges)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Hệ thống 5 tốc kế chuyên sâu phân tích Định lượng: Áp lực nợ, Khả năng thanh toán ngay, Danh mục đầu tư & Tính khả thi mục tiêu
          </Typography>
        </Box>
      </Box>

      {/* Grid of Gauges: 1 Master Overall + 4 Component Gauges */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr', lg: '1.2fr 1fr 1fr 1fr' },
          gap: 2
        }}
      >
        {/* Gauge 1: Overall Risk (Master) */}
        <SemiCircleGauge
          title="Rủi ro Tài chính Tổng thể"
          subtitle="Chỉ số an toàn tổng hợp 360°"
          score={overallRiskScore}
          formulaExplanation="Được tổng hợp từ: Áp lực nợ (35%), Rủi ro thanh khoản/Quỹ dự phòng (35%) và Tỷ trọng tài sản rủi ro cao (30%). Điểm càng thấp càng an toàn."
          factors={[
            { label: 'Tỷ lệ nợ/tài sản', impact: `${debtToAssetsRatio.toFixed(1)}%`, isPositive: debtToAssetsRatio < 30 },
            { label: 'Quỹ dự phòng sinh hoạt', impact: `${runwayMonths} tháng`, isPositive: Number(runwayMonths) >= 3 },
            { label: 'Tỷ trọng tài sản rủi ro cao', impact: `${highRiskRatio.toFixed(0)}%`, isPositive: highRiskRatio < 25 }
          ]}
          recommendation={
            overallRiskScore < 25
              ? 'Tài chính rất an toàn. Bạn có thể gia tăng tỷ trọng đầu tư sinh lời.'
              : overallRiskScore < 50
              ? 'Mức độ ổn định. Cần tiếp tục duy trì quỹ dự phòng ít nhất 6 tháng.'
              : 'Cần ưu tiên trả bớt các khoản nợ ngắn hạn và giảm tỷ trọng đầu tư mạo hiểm.'
          }
        />

        {/* Gauge 2: Debt Pressure */}
        <SemiCircleGauge
          title="Áp lực Nợ & Nghĩa vụ"
          subtitle="Tỷ lệ đòn bẩy trên tổng tài sản"
          score={debtScore}
          formulaExplanation="Tỷ lệ tổng dư nợ phải trả so với tổng tài sản hiện có. Dưới 30% là ngưỡng an toàn chuẩn quốc tế."
          factors={[
            { label: 'Tổng nợ phải trả', impact: money(totalDebtOwed), isPositive: totalDebtOwed === 0 },
            { label: 'Đòn bẩy trên tài sản', impact: `${debtToAssetsRatio.toFixed(1)}%`, isPositive: debtToAssetsRatio < 30 }
          ]}
          recommendation={totalDebtOwed === 0 ? 'Tuyệt vời! Bạn không có bất kỳ khoản nợ nào.' : 'Ưu tiên phương pháp quả cầu tuyết trả dứt điểm các khoản nợ lãi cao.'}
        />

        {/* Gauge 3: Liquidity Risk */}
        <SemiCircleGauge
          title="Rủi ro Thanh khoản"
          subtitle="Khả năng dùng tiền mặt ngay"
          score={liquidityScore}
          formulaExplanation="Dựa trên số tháng bạn có thể duy trì sinh hoạt thiết yếu bằng tiền mặt hiện có nếu đột ngột mất thu nhập."
          factors={[
            { label: 'Tiền mặt & Ngân hàng', impact: money(totalCash), isPositive: totalCash > 20000000 },
            { label: 'Duy trì cuộc sống', impact: `${runwayMonths} tháng`, isPositive: Number(runwayMonths) >= 6 }
          ]}
          recommendation={Number(runwayMonths) >= 6 ? 'Quỹ dự phòng khẩn cấp đạt chuẩn 6 tháng lý tưởng.' : 'Nên tăng dần số dư tiền gửi thanh khoản cao lên tối thiểu 3-6 tháng chi tiêu.'}
        />

        {/* Gauge 4: Goal Feasibility */}
        <SemiCircleGauge
          title="Khả thi Mục tiêu Tài chính"
          subtitle={primaryGoal ? primaryGoal.name : 'Mục tiêu tích lũy'}
          score={goalFeasibilityScore}
          inverted={true}
          formulaExplanation="Đánh giá xác suất hoàn thành mục tiêu đúng hạn dựa trên tiến độ tích lũy thực tế kết hợp với dòng tiền thặng dư mỗi tháng."
          factors={[
            { label: 'Tiến độ tích lũy', impact: `${goalProgressPct}%`, isPositive: goalProgressPct >= 50 },
            { label: 'Số tiền còn lại', impact: money(Math.max(0, goalTarget - goalCurrent)) }
          ]}
          recommendation={goalFeasibilityScore >= 70 ? 'Mục tiêu đang diễn biến rất thuận lợi theo đúng lộ trình.' : 'Cân nhắc tối ưu chi phí sinh hoạt hàng tháng để gia tăng tốc độ tích lũy.'}
        />
      </Box>
    </Box>
  );
}
