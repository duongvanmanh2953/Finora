/**
 * Finora Vietnam Personal Income Tax (PIT / Thuế TNCN) Engine
 * Complies with Vietnamese PIT Law, Decrees & Circulars (Labor Code 2019, Law on PIT No. 04/2007/QH12 & amendments)
 */

export interface PitDeductionConfig {
  personalMonthly: number; // Standard: 11,000,000 VND
  dependentMonthly: number; // Standard: 4,400,000 VND per dependent
  dependentCount: number;
  monthlyInsurance: number; // Actual or calculated SHUI (BHXH, BHYT, BHTN)
  charitableContributions?: number; // Đóng góp từ thiện, nhân đạo, khuyến học
}

export const STANDARD_PIT_CONFIG: PitDeductionConfig = {
  personalMonthly: 11000000,
  dependentMonthly: 4400000,
  dependentCount: 0,
  monthlyInsurance: 0,
  charitableContributions: 0
};

// 7 Progressive Tax Brackets (Monthly)
export const MONTHLY_PIT_BRACKETS = [
  { level: 1, maxTaxable: 5000000, rate: 0.05, subtract: 0 },
  { level: 2, maxTaxable: 10000000, rate: 0.10, subtract: 250000 },
  { level: 3, maxTaxable: 18000000, rate: 0.15, subtract: 750000 },
  { level: 4, maxTaxable: 32000000, rate: 0.20, subtract: 1650000 },
  { level: 5, maxTaxable: 52000000, rate: 0.25, subtract: 3250000 },
  { level: 6, maxTaxable: 80000000, rate: 0.30, subtract: 5850000 },
  { level: 7, maxTaxable: Infinity, rate: 0.35, subtract: 9850000 }
];

// 7 Progressive Tax Brackets (Annualized for Tax Settlement / Quyết toán thuế năm)
export const ANNUAL_PIT_BRACKETS = [
  { level: 1, maxTaxable: 60000000, rate: 0.05, subtract: 0 },
  { level: 2, maxTaxable: 120000000, rate: 0.10, subtract: 3000000 },
  { level: 3, maxTaxable: 216000000, rate: 0.15, subtract: 9000000 },
  { level: 4, maxTaxable: 384000000, rate: 0.20, subtract: 19800000 },
  { level: 5, maxTaxable: 624000000, rate: 0.25, subtract: 39000000 },
  { level: 6, maxTaxable: 960000000, rate: 0.30, subtract: 70200000 },
  { level: 7, maxTaxable: Infinity, rate: 0.35, subtract: 118200000 }
];

/**
 * Calculates monthly Personal Income Tax for Employment / Salary
 */
export function calculateMonthlySalaryPit(
  grossSalary: number,
  config: Partial<PitDeductionConfig> = {}
): {
  grossSalary: number;
  totalDeduction: number;
  taxableIncome: number; // Thu nhập tính thuế
  taxDue: number; // Thuế TNCN phải nộp
  effectiveTaxRate: number; // Tỷ lệ thuế thực tế (%)
  bracketLevel: number;
  bracketBreakdown: Array<{ level: number; rate: number; taxableInBracket: number; taxAmount: number }>;
} {
  const mergedConfig: PitDeductionConfig = { ...STANDARD_PIT_CONFIG, ...config };

  const totalDeduction =
    mergedConfig.personalMonthly +
    mergedConfig.dependentCount * mergedConfig.dependentMonthly +
    (mergedConfig.monthlyInsurance || 0) +
    (mergedConfig.charitableContributions || 0);

  const taxableIncome = Math.max(0, grossSalary - totalDeduction);

  if (taxableIncome <= 0) {
    return {
      grossSalary,
      totalDeduction,
      taxableIncome: 0,
      taxDue: 0,
      effectiveTaxRate: 0,
      bracketLevel: 0,
      bracketBreakdown: []
    };
  }

  let remaining = taxableIncome;
  let prevLimit = 0;
  let totalTax = 0;
  let highestBracket = 1;
  const breakdown: Array<{ level: number; rate: number; taxableInBracket: number; taxAmount: number }> = [];

  for (const b of MONTHLY_PIT_BRACKETS) {
    if (remaining <= 0) break;
    highestBracket = b.level;
    const span = b.maxTaxable === Infinity ? remaining : b.maxTaxable - prevLimit;
    const taxableInSpan = Math.min(remaining, span);
    const taxInSpan = Math.round(taxableInSpan * b.rate);

    breakdown.push({
      level: b.level,
      rate: b.rate,
      taxableInBracket: taxableInSpan,
      taxAmount: taxInSpan
    });

    totalTax += taxInSpan;
    remaining -= taxableInSpan;
    prevLimit = b.maxTaxable;
  }

  const effectiveTaxRate = grossSalary > 0 ? Math.round((totalTax / grossSalary) * 1000) / 10 : 0;

  return {
    grossSalary,
    totalDeduction,
    taxableIncome,
    taxDue: totalTax,
    effectiveTaxRate,
    bracketLevel: highestBracket,
    bracketBreakdown: breakdown
  };
}

/**
 * Calculates Freelance / Contractor PIT withholding (Khấu trừ tại nguồn 10% với khoản chi từ 2 triệu VNĐ trở lên)
 */
export function calculateFreelanceWithholding(
  payoutAmount: number,
  hasTaxCommitment: boolean = false
): {
  payoutAmount: number;
  withheldTax: number;
  netPayout: number;
  rateApplied: number;
} {
  if (payoutAmount < 2000000 || hasTaxCommitment) {
    return {
      payoutAmount,
      withheldTax: 0,
      netPayout: payoutAmount,
      rateApplied: 0
    };
  }

  const withheldTax = Math.round(payoutAmount * 0.10);
  return {
    payoutAmount,
    withheldTax,
    netPayout: payoutAmount - withheldTax,
    rateApplied: 0.10
  };
}

/**
 * Annual Personal Income Tax Settlement Projection (Dự báo Quyết toán thuế TNCN cả năm)
 */
export interface AnnualTaxSettlementInput {
  totalGrossIncomeYtd: number;
  monthsActive: number; // e.g. 12 for full year or elapsed months
  dependentCount: number;
  totalInsurancePaidYtd: number;
  totalTaxPrepaidYtd: number; // Đã khấu trừ hoặc tạm nộp trong năm
  otherDeductionsYtd?: number;
}

export interface AnnualTaxSettlementResult {
  totalGrossIncome: number;
  totalAnnualDeductions: number;
  taxableIncomeAnnual: number;
  totalTaxPayableAnnual: number;
  totalTaxPrepaid: number;
  balanceDifference: number; // Dương = Nộp thêm, Âm = Được hoàn thuế
  settlementStatus: 'REFUND_EXPECTED' | 'ADDITIONAL_PAYMENT_REQUIRED' | 'BALANCED';
  taxOptimizationAdvice: string[];
}

export function projectAnnualTaxSettlement(input: AnnualTaxSettlementInput): AnnualTaxSettlementResult {
  const months = Math.min(12, Math.max(1, input.monthsActive || 12));
  const personalDeduction = months * STANDARD_PIT_CONFIG.personalMonthly;
  const dependentDeduction = months * input.dependentCount * STANDARD_PIT_CONFIG.dependentMonthly;
  const totalAnnualDeductions =
    personalDeduction +
    dependentDeduction +
    (input.totalInsurancePaidYtd || 0) +
    (input.otherDeductionsYtd || 0);

  const taxableIncomeAnnual = Math.max(0, input.totalGrossIncomeYtd - totalAnnualDeductions);

  let totalTaxPayableAnnual = 0;
  if (taxableIncomeAnnual > 0) {
    // Fast shortcut calculation using annual brackets
    for (let i = ANNUAL_PIT_BRACKETS.length - 1; i >= 0; i--) {
      const b = ANNUAL_PIT_BRACKETS[i];
      const lowerBound = i === 0 ? 0 : ANNUAL_PIT_BRACKETS[i - 1].maxTaxable;
      if (taxableIncomeAnnual > lowerBound) {
        totalTaxPayableAnnual = Math.round(taxableIncomeAnnual * b.rate - b.subtract);
        break;
      }
    }
  }

  const balanceDifference = totalTaxPayableAnnual - input.totalTaxPrepaidYtd;
  let settlementStatus: 'REFUND_EXPECTED' | 'ADDITIONAL_PAYMENT_REQUIRED' | 'BALANCED' = 'BALANCED';

  if (balanceDifference < -1000) {
    settlementStatus = 'REFUND_EXPECTED';
  } else if (balanceDifference > 1000) {
    settlementStatus = 'ADDITIONAL_PAYMENT_REQUIRED';
  }

  const advice: string[] = [];
  if (settlementStatus === 'REFUND_EXPECTED') {
    advice.push(`Bạn dự kiến được hoàn lại ${(Math.abs(balanceDifference)).toLocaleString('vi-VN')} ₫ tiền thuế nộp thừa.`);
    advice.push('Hãy chuẩn bị chứng từ khấu trừ thuế TNCN từ các tổ chức chi trả trước ngày quyết toán 30/04.');
  } else if (settlementStatus === 'ADDITIONAL_PAYMENT_REQUIRED') {
    advice.push(`Bạn cần nộp bổ sung khoảng ${balanceDifference.toLocaleString('vi-VN')} ₫ khi quyết toán thuế cuối năm.`);
    advice.push('Lưu ý đăng ký giảm trừ người phụ thuộc đủ điều kiện để tối ưu nghĩa vụ thuế.');
  } else {
    advice.push('Nghĩa vụ thuế của bạn đã được cân bằng chính xác với số thuế đã tạm khấu trừ.');
  }

  return {
    totalGrossIncome: input.totalGrossIncomeYtd,
    totalAnnualDeductions,
    taxableIncomeAnnual,
    totalTaxPayableAnnual,
    totalTaxPrepaid: input.totalTaxPrepaidYtd,
    balanceDifference,
    settlementStatus,
    taxOptimizationAdvice: advice
  };
}
