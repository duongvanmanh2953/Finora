import type {
  InvestmentNote,
  NetWorthSummary,
  WealthProjectionPoint,
  WealthAssetCategory,
  RiskLevel
} from '../types/smartLedger';
import { todayKey, uid } from './finance';

export const ASSET_CATEGORY_METADATA: Record<
  WealthAssetCategory,
  { label: string; defaultRisk: RiskLevel; defaultReturn: number; iconName: string }
> = {
  CASH_EQUIVALENT: { label: 'Tiền mặt & Ngân hàng', defaultRisk: 'SAFE', defaultReturn: 0.5, iconName: 'Wallet' },
  SAVINGS_TERM: { label: 'Tiết kiệm kỳ hạn', defaultRisk: 'LOW', defaultReturn: 5.5, iconName: 'Landmark' },
  BOND: { label: 'Trái phiếu', defaultRisk: 'LOW', defaultReturn: 7.5, iconName: 'ShieldCheck' },
  STOCK_VN: { label: 'Cổ phiếu Việt Nam', defaultRisk: 'MEDIUM', defaultReturn: 12.0, iconName: 'TrendingUp' },
  STOCK_INTL: { label: 'Cổ phiếu quốc tế', defaultRisk: 'HIGH', defaultReturn: 10.0, iconName: 'Globe' },
  FUND_OPEN: { label: 'Chứng chỉ quỹ mở', defaultRisk: 'MEDIUM', defaultReturn: 9.5, iconName: 'PieChart' },
  ETF: { label: 'Quỹ hoán đổi ETF', defaultRisk: 'MEDIUM', defaultReturn: 10.5, iconName: 'Layers' },
  GOLD_PHYSICAL: { label: 'Vàng vật chất (SJC/9999)', defaultRisk: 'LOW', defaultReturn: 8.0, iconName: 'Coins' },
  GOLD_ACCOUNT: { label: 'Vàng tài khoản', defaultRisk: 'MEDIUM', defaultReturn: 7.5, iconName: 'Coins' },
  REAL_ESTATE: { label: 'Bất động sản', defaultRisk: 'MEDIUM', defaultReturn: 9.0, iconName: 'Home' },
  BUSINESS_EQUITY: { label: 'Góp vốn kinh doanh', defaultRisk: 'HIGH', defaultReturn: 15.0, iconName: 'Briefcase' },
  P2P_LENDING: { label: 'Cho vay / P2P', defaultRisk: 'HIGH', defaultReturn: 12.0, iconName: 'HandCoins' },
  CRYPTO: { label: 'Crypto & Tài sản số', defaultRisk: 'HIGH', defaultReturn: 0.0, iconName: 'Cpu' },
  INSURANCE_CASH_VAL: { label: 'Bảo hiểm tích lũy', defaultRisk: 'SAFE', defaultReturn: 4.5, iconName: 'Umbrella' },
  OTHER: { label: 'Tài sản khác', defaultRisk: 'MEDIUM', defaultReturn: 6.0, iconName: 'Package' }
};

/**
 * 1. TÍNH TOÁN TỔNG TÀI SẢN & TÀI SẢN RÒNG CHUẨN KẾ TOÁN TÀI CHÍNH
 * Quy tắc cốt lõi:
 * - Tiền mặt / Ngân hàng (Cash) là tài sản thực có.
 * - Đầu tư: Sử dụng `currentEstimatedValue` (Giá trị hiện tại ước tính), KHÔNG cộng dồn cả vốn gốc và giá trị thị trường để tránh double-counting!
 * - Vốn chưa thu hồi = (Vốn ban đầu + Vốn góp thêm) - Đã thu hồi.
 * - Lãi/lỗ tạm tính = Giá trị hiện tại - Vốn chưa thu hồi.
 */
export function calculateComprehensiveNetWorth(
  cashBalance: number,
  notes: InvestmentNote[] = [],
  totalLiabilities: number = 0,
  forceConservativeMode: boolean = false
): NetWorthSummary {
  let totalInvestedCapital = 0;
  let totalRecoveredCapital = 0;
  let unrecoveredCapital = 0;
  let totalInvestmentValue = 0;
  let fullInvestmentValue = 0;
  let conservativeInvestmentValue = 0;

  let safeAmount = cashBalance;
  let lowAmount = 0;
  let mediumAmount = 0;
  let highAmount = 0;

  let highLiquidityAmount = cashBalance; // Cash is 100% immediate

  let activeCount = 0;
  let hiddenCount = 0;
  let recoveredCount = 0;
  let atRiskCount = 0;

  for (const n of notes) {
    const totalContributed = (n.initialCapital || 0) + (n.additionalCapitalContributed || 0);
    const recovered = n.recoveredAmount || 0;
    const currentUnrecovered = Math.max(0, totalContributed - recovered);
    const currentValue = n.currentEstimatedValue ?? currentUnrecovered;

    totalInvestedCapital += totalContributed;
    totalRecoveredCapital += recovered;

    if (n.status === 'RECOVERED') {
      recoveredCount++;
      continue;
    }

    if (n.status === 'AT_RISK_LOSS') {
      atRiskCount++;
    }

    unrecoveredCapital += currentUnrecovered;

    // Check include_in_net_worth
    const isIncluded = n.include_in_net_worth !== false;
    if (!isIncluded) {
      hiddenCount++;
      continue;
    }

    activeCount++;
    fullInvestmentValue += currentValue;

    // Risk breakdown (chỉ tính các khoản active)
    switch (n.risk_level) {
      case 'SAFE':
        safeAmount += currentValue;
        break;
      case 'LOW':
        lowAmount += currentValue;
        break;
      case 'MEDIUM':
        mediumAmount += currentValue;
        break;
      case 'HIGH':
        highAmount += currentValue;
        break;
      default:
        mediumAmount += currentValue;
    }

    // Conservative mode: Loại trừ tài sản HIGH risk và AT_RISK_LOSS
    if (n.risk_level !== 'HIGH' && n.status !== 'AT_RISK_LOSS') {
      conservativeInvestmentValue += currentValue;
    }

    // Thanh khoản cao
    if (n.liquidity_level === 'IMMEDIATE' || n.liquidity_level === 'T_PLUS_2') {
      highLiquidityAmount += currentValue;
    }
  }

  const fullNetWorth = Math.round(cashBalance + fullInvestmentValue - totalLiabilities);
  const conservativeNetWorth = Math.round(cashBalance + conservativeInvestmentValue - totalLiabilities);

  totalInvestmentValue = forceConservativeMode ? conservativeInvestmentValue : fullInvestmentValue;
  const headlineNetWorth = forceConservativeMode ? conservativeNetWorth : fullNetWorth;
  const unrealizedPnL = Math.round(fullInvestmentValue - unrecoveredCapital);

  const totalAssetsBasis = Math.max(1, cashBalance + fullInvestmentValue);

  return {
    cashBalance,
    totalInvestmentValue,
    unrecoveredCapital,
    totalInvestedCapital,
    totalRecoveredCapital,
    unrealizedPnL,
    totalLiabilities,
    fullNetWorth,
    conservativeNetWorth,
    headlineNetWorth,
    isSafeModeActive: forceConservativeMode,
    riskBreakdown: {
      safe: { amount: safeAmount, percentage: Math.round((safeAmount / totalAssetsBasis) * 100) },
      low: { amount: lowAmount, percentage: Math.round((lowAmount / totalAssetsBasis) * 100) },
      medium: { amount: mediumAmount, percentage: Math.round((mediumAmount / totalAssetsBasis) * 100) },
      high: { amount: highAmount, percentage: Math.round((highAmount / totalAssetsBasis) * 100) }
    },
    highLiquidityRatio: Math.min(100, Math.round((highLiquidityAmount / totalAssetsBasis) * 100)),
    activeCount,
    hiddenCount,
    recoveredCount,
    atRiskCount
  };
}

/**
 * 2. ĐỘNG CƠ DỰ PHÓNG TÀI SẢN 3 KỊCH BẢN (THỰC TẾ DỰA TRÊN DÒNG TIỀN VÀ LẠM PHÁT)
 * - Tích lũy hàng tháng (monthlySavings)
 * - Lãi kép danh mục theo tỷ suất lợi nhuận kỳ vọng
 * - 3 Kịch bản:
 *   + Thận trọng (Conservative): Lợi suất 4.5%/năm, lạm phát 4.0%
 *   + Cơ sở (Base): Lợi suất danh mục thực tế (hoặc slider rate), lạm phát 3.5%
 *   + Tích cực (Optimistic): Lợi suất cơ sở + 3.5%/năm, lạm phát 3.0%
 */
export function generateThreeScenarioProjections(
  currentNetWorth: number,
  monthlySavings: number = 5000000,
  expectedBaseReturnRate: number = 8.5,
  inflationRate: number = 3.5
): WealthProjectionPoint[] {
  const milestones = [
    { key: 'NOW', label: 'Hiện tại', months: 0 },
    { key: '3M', label: '3 Tháng', months: 3 },
    { key: '6M', label: '6 Tháng', months: 6 },
    { key: '1Y', label: '1 Năm', months: 12 },
    { key: '3Y', label: '3 Năm', months: 36 },
    { key: '5Y', label: '5 Năm', months: 60 },
    { key: '10Y', label: '10 Năm', months: 120 }
  ];

  const conservativeRate = Math.max(3.0, expectedBaseReturnRate * 0.6);
  const optimisticRate = expectedBaseReturnRate + 3.5;

  return milestones.map(m => {
    if (m.months === 0) {
      return {
        milestoneKey: m.key,
        milestoneLabel: m.label,
        months: 0,
        cumulativeSelfSaved: currentNetWorth,
        conservativeValue: currentNetWorth,
        baseValue: currentNetWorth,
        optimisticValue: currentNetWorth,
        purchasingPowerAdjusted: currentNetWorth
      };
    }

    const tYears = m.months / 12;
    const selfSavedCapital = currentNetWorth + (monthlySavings * m.months);

    // Formula tính giá trị tương lai với tiền gửi đều mỗi tháng (Future Value of an Annuity):
    // FV = PV * (1 + r/12)^n + PMT * [((1 + r/12)^n - 1) / (r/12)]
    const calcFV = (annualRate: number) => {
      const r = (annualRate / 100) / 12;
      const n = m.months;
      if (r <= 0) return selfSavedCapital;
      const compoundFactor = Math.pow(1 + r, n);
      const fvPrincipal = currentNetWorth * compoundFactor;
      const fvAnnuity = monthlySavings * ((compoundFactor - 1) / r);
      return Math.round(fvPrincipal + fvAnnuity);
    };

    const conservativeVal = calcFV(conservativeRate);
    const baseVal = calcFV(expectedBaseReturnRate);
    const optimisticVal = calcFV(optimisticRate);

    // Sức mua sau khi điều chỉnh lạm phát: PV = FV / (1 + i)^t
    const inflCompound = Math.pow(1 + inflationRate / 100, tYears);
    const purchasingPowerAdjusted = Math.round(baseVal / inflCompound);

    return {
      milestoneKey: m.key,
      milestoneLabel: m.label,
      months: m.months,
      cumulativeSelfSaved: Math.round(selfSavedCapital),
      conservativeValue: conservativeVal,
      baseValue: baseVal,
      optimisticValue: optimisticVal,
      purchasingPowerAdjusted
    };
  });
}

/**
 * 3. MẪU DỮ LIỆU ĐẦU TƯ ĐẦY ĐỦ 4 CẤP ĐỘ RỦI RO CHO ONBOARDING
 */
export function getSampleWealthInvestmentNotes(): InvestmentNote[] {
  const today = todayKey();
  return [
    {
      id: uid(),
      title: 'Sổ tiết kiệm Techcombank 6 Tháng',
      category: 'SAVINGS_TERM',
      initialCapital: 50000000,
      recoveredAmount: 0,
      currentEstimatedValue: 51375000,
      risk_level: 'SAFE',
      include_in_net_worth: true,
      liquidity_level: 'TERM',
      status: 'UNRECOVERED',
      startDate: today,
      expectedAnnualReturnPct: 5.5,
      quickNote: 'Gửi online kỳ hạn 6T, nhận lãi cuối kỳ'
    },
    {
      id: uid(),
      title: 'Vàng miếng SJC 9999 (1 lượng cất két)',
      category: 'GOLD_PHYSICAL',
      symbol: 'SJC',
      quantity: 1,
      unit: 'lượng',
      initialCapital: 82000000,
      recoveredAmount: 0,
      currentEstimatedValue: 88500000,
      risk_level: 'LOW',
      include_in_net_worth: true,
      liquidity_level: 'IMMEDIATE',
      status: 'UNRECOVERED',
      startDate: today,
      expectedAnnualReturnPct: 8.0,
      brokerOrStorageLocation: 'Két sắt gia đình',
      quickNote: 'Tích sản bảo hiểm chống lạm phát dài hạn'
    },
    {
      id: uid(),
      title: 'Tích sản Cổ phiếu Techcombank (TCB)',
      category: 'STOCK_VN',
      symbol: 'TCB',
      quantity: 1000,
      unit: 'cổ phiếu',
      initialCapital: 32000000,
      recoveredAmount: 0,
      currentEstimatedValue: 35800000,
      risk_level: 'MEDIUM',
      include_in_net_worth: true,
      liquidity_level: 'T_PLUS_2',
      status: 'UNRECOVERED',
      startDate: today,
      expectedAnnualReturnPct: 14.0,
      brokerOrStorageLocation: 'TCBS',
      quickNote: 'DCA định kỳ hàng tháng, ngân hàng đầu ngành tăng trưởng'
    },
    {
      id: uid(),
      title: 'Góp vốn Nhà thuốc nhượng quyền',
      category: 'BUSINESS_EQUITY',
      initialCapital: 40000000,
      recoveredAmount: 10000000, // Đã thu hồi 10 triệu
      currentEstimatedValue: 38000000, // Định giá hiện tại
      risk_level: 'HIGH',
      include_in_net_worth: true,
      liquidity_level: 'ILLIQUID',
      status: 'PARTIALLY_RECOVERED',
      startDate: today,
      expectedAnnualReturnPct: 18.0,
      ownershipPercentage: 15,
      quickNote: 'Góp vốn 15% cùng bạn đại học, chia cổ tức hàng quý'
    }
  ];
}
