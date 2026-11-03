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

  // 3. GAUGE SCORES COMPUTATION (Normalized 0 to 100: Higher = Healthier & Safer, pointing to Green)
  
  // A. Debt Safety Score (100 = No debt pressure, 0 = Overleveraged)
  const debtToAssetsRatio = totalAssets > 0 ? (totalDebtOwed / totalAssets) * 100 : 0;
  const rawDebtRisk = Math.min(100, Math.round(debtToAssetsRatio * 1.5 + (totalDebtOwed > 100000000 ? 25 : 0)));
  const debtSafetyScore = Math.max(0, 100 - rawDebtRisk);

  // B. Liquidity Runway Score (100 = 6+ months runway, 0 = 0 runway)
  const liquiditySafetyScore = Math.min(100, Math.max(0, Math.round((Number(runwayMonths) / 6) * 100)));

  // C. Investment Health Score (100 = Low risk, healthy portfolio, 0 = Concentrated high risk)
  const highRiskRatio = currentInvestmentValue > 0 ? (highRiskValue / currentInvestmentValue) * 100 : 0;
  const rawInvestmentRisk = Math.min(100, Math.round(highRiskRatio * 0.7 + (notes.filter(n => n.status === 'AT_RISK_LOSS').length > 0 ? 30 : 0)));
  const investmentHealthScore = Math.max(0, 100 - rawInvestmentRisk);

  // D. Overall Financial Health Master Score
  const overallHealthScore = Math.round(
    debtSafetyScore * 0.35 +
    liquiditySafetyScore * 0.35 +
    investmentHealthScore * 0.30
  );

  // E. Goal Feasibility
  const activeGoals = data.goals || [];
  const primaryGoal = activeGoals[0];
  const goalCurrent = primaryGoal ? (primaryGoal.contributions || []).reduce((s, c) => s + c.amount, 0) : 0;
  const goalTarget = primaryGoal ? primaryGoal.target : 1;
  const goalProgressPct = primaryGoal ? Math.round((goalCurrent / goalTarget) * 100) : 0;
  const goalFeasibilityScore = primaryGoal ? Math.min(100, Math.round(goalProgressPct * 0.6 + (Number(runwayMonths) >= 3 ? 35 : 15))) : 80;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.15rem' }, color: 'text.primary' }}>
            Bộ Đo Lường Sức Khỏe & An Toàn Tài Chính (Speedometer Gauges)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            Hệ thống 4 tốc kế đồng bộ 4 vùng trực quan: Áp lực nợ, Thanh khoản dự phòng, Sức khỏe đầu tư & Khả thi mục tiêu
          </Typography>
        </Box>
      </Box>

      {/* Grid of Gauges: 1 Master Overall + 3 Component Gauges */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: '1.2fr 1fr 1fr 1fr' },
          gap: 2
        }}
      >
        {/* Gauge 1: Master Health Index */}
        <SemiCircleGauge
          title="Sức khỏe Tài chính Tổng thể"
          subtitle="Chỉ số an toàn tổng hợp 360°"
          score={overallHealthScore}
          formulaExplanation="Tổng hợp từ: An toàn nợ (35%), Thanh khoản dự phòng (35%) và An toàn danh mục đầu tư (30%). Điểm càng cao tài chính càng vững mạnh."
          factors={[
            { label: 'Tỷ lệ nợ/tài sản', impact: `${debtToAssetsRatio.toFixed(1)}%`, isPositive: debtToAssetsRatio < 30 },
            { label: 'Quỹ dự phòng sinh hoạt', impact: `${runwayMonths} tháng`, isPositive: Number(runwayMonths) >= 3 },
            { label: 'Tỷ trọng tài sản rủi ro cao', impact: `${highRiskRatio.toFixed(0)}%`, isPositive: highRiskRatio < 25 }
          ]}
          recommendation={
            overallHealthScore >= 75
              ? 'Tài chính rất vững mạnh và an toàn. Bạn có thể tự tin mở rộng các kênh sinh lời.'
              : overallHealthScore >= 50
              ? 'Mức độ ổn định khá. Nên duy trì quỹ dự phòng tiền mặt tối thiểu 6 tháng chi tiêu.'
              : 'Cần tái cơ cấu tài chính: ưu tiên giảm nợ ngắn hạn và bổ sung dòng tiền dự phòng.'
          }
        />

        {/* Gauge 2: Debt Safety */}
        <SemiCircleGauge
          title="Chỉ số An toàn Dư nợ"
          subtitle="Tỷ lệ đòn bẩy trên tổng tài sản"
          score={debtSafetyScore}
          formulaExplanation="Tỷ lệ an toàn nợ so với tài sản. Điểm tối đa khi bạn không có nợ hoặc tỷ lệ nợ dưới 10% tổng tài sản."
          factors={[
            { label: 'Tổng nợ phải trả', impact: money(totalDebtOwed), isPositive: totalDebtOwed === 0 },
            { label: 'Đòn bẩy trên tài sản', impact: `${debtToAssetsRatio.toFixed(1)}%`, isPositive: debtToAssetsRatio < 30 }
          ]}
          recommendation={totalDebtOwed === 0 ? 'Tuyệt vời! Bạn không chịu bất kỳ áp lực nợ nào.' : 'Áp dụng quy tắc quả cầu tuyết trả dứt điểm các khoản nợ lãi cao trước.'}
        />

        {/* Gauge 3: Liquidity Runway */}
        <SemiCircleGauge
          title="Thanh khoản Dự phòng"
          subtitle="Khả năng đáp ứng chi tiêu ngay"
          score={liquiditySafetyScore}
          formulaExplanation="Đo lường thời gian duy trì sinh hoạt thiết yếu bằng tiền mặt hiện có khi nguồn thu nhập chính bị gián đoạn."
          factors={[
            { label: 'Tiền mặt & Ngân hàng', impact: money(totalCash), isPositive: totalCash > 20000000 },
            { label: 'Duy trì cuộc sống', impact: `${runwayMonths} tháng`, isPositive: Number(runwayMonths) >= 6 }
          ]}
          recommendation={Number(runwayMonths) >= 6 ? 'Quỹ khẩn cấp đạt chuẩn 6 tháng lý tưởng.' : 'Nên tích lũy thêm vào tài khoản tiết kiệm thanh khoản cao.'}
        />

        {/* Gauge 4: Goal Feasibility */}
        <SemiCircleGauge
          title="Khả thi Mục tiêu Tài chính"
          subtitle={primaryGoal ? primaryGoal.name : 'Mục tiêu tích lũy'}
          score={goalFeasibilityScore}
          formulaExplanation="Đánh giá xác suất hoàn thành mục tiêu đúng hạn dựa trên tiến độ tích lũy thực tế kết hợp với dòng tiền thặng dư mỗi tháng."
          factors={[
            { label: 'Tiến độ tích lũy', impact: `${goalProgressPct}%`, isPositive: goalProgressPct >= 50 },
            { label: 'Số tiền còn lại', impact: money(Math.max(0, goalTarget - goalCurrent)) }
          ]}
          recommendation={goalFeasibilityScore >= 70 ? 'Mục tiêu đang diễn biến rất thuận lợi theo đúng kế hoạch.' : 'Cân nhắc tối ưu chi phí sinh hoạt hàng tháng để gia tăng tốc độ tích lũy.'}
        />
      </Box>
    </Box>
  );
}
