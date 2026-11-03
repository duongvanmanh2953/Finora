import type { PayrollRecord, Money } from '../types';
import { uid } from './finance';

// ============================================================================
// VIETNAMESE LABOR & TAX CONSTANTS (Compliance: Labor Code 2019, PIT Law, SHUI Law)
// ============================================================================

export const STATUTORY_LIMITS = {
  // Base salary level for public sector (Mức lương cơ sở từ 01/07/2024): 2,340,000 ₫
  BASE_SALARY_GOV: 2340000,
  // Regional minimum wage Region 1 (Mức lương tối thiểu vùng I): 4,960,000 ₫
  MIN_WAGE_REGION_1: 4960000,
  // BHXH & BHYT Cap (20 times base salary)
  BHXH_BHYT_SALARY_CAP: 20 * 2340000, // 46,800,000 ₫
  // BHTN Cap (20 times regional minimum wage)
  BHTN_SALARY_CAP: 20 * 4960000, // 99,200,000 ₫

  // Employee Contribution Rates (10.5%)
  EMPLOYEE_BHXH_RATE: 0.08,   // 8%
  EMPLOYEE_BHYT_RATE: 0.015,  // 1.5%
  EMPLOYEE_BHTN_RATE: 0.01,   // 1%
  EMPLOYEE_TOTAL_RATE: 0.105, // 10.5%

  // Employer Contribution Rates (21.5% - for reference)
  EMPLOYER_BHXH_RATE: 0.175,  // 17.5%
  EMPLOYER_BHYT_RATE: 0.03,   // 3%
  EMPLOYER_BHTN_RATE: 0.01,   // 1%
  EMPLOYER_BHTNL_RATE: 0.005, // 0.5%
  EMPLOYER_TOTAL_RATE: 0.215, // 21.5%

  // PIT Deductions
  PERSONAL_DEDUCTION: 11000000, // 11,000,000 ₫/tháng
  DEPENDENT_DEDUCTION: 4400000  // 4,400,000 ₫/người/tháng
};

// 7 Progressive Tax Brackets (Biểu thuế lũy tiến từng phần 7 bậc)
export interface TaxBracket {
  level: number;
  threshold: number; // Upper limit of bracket
  rate: number;
  subtraction: number; // Fast calculation shortcut
}

export const PIT_BRACKETS: TaxBracket[] = [
  { level: 1, threshold: 5000000, rate: 0.05, subtraction: 0 },
  { level: 2, threshold: 10000000, rate: 0.10, subtraction: 250000 },
  { level: 3, threshold: 18000000, rate: 0.15, subtraction: 750000 },
  { level: 4, threshold: 32000000, rate: 0.20, subtraction: 1650000 },
  { level: 5, threshold: 52000000, rate: 0.25, subtraction: 3250000 },
  { level: 6, threshold: 80000000, rate: 0.30, subtraction: 5850000 },
  { level: 7, threshold: Infinity, rate: 0.35, subtraction: 9850000 }
];

/**
 * Calculates progressive Personal Income Tax (PIT - Thuế TNCN)
 * for a given assessable income (Thu nhập tính thuế)
 */
export function calculateProgressivePit(assessableIncome: number): {
  pitWithheld: Money;
  bracketBreakdown: { bracket: number; rangeLabel: string; rate: number; taxableInBracket: Money; tax: Money }[];
} {
  if (assessableIncome <= 0) {
    return { pitWithheld: 0, bracketBreakdown: [] };
  }

  const breakdown: { bracket: number; rangeLabel: string; rate: number; taxableInBracket: Money; tax: Money }[] = [];
  let remaining = assessableIncome;
  let totalTax = 0;
  let previousThreshold = 0;

  for (const b of PIT_BRACKETS) {
    if (remaining <= 0) break;
    const bracketSpan = b.threshold === Infinity ? remaining : b.threshold - previousThreshold;
    const taxableInThisBracket = Math.min(remaining, bracketSpan);
    const taxInThisBracket = Math.round(taxableInThisBracket * b.rate);

    totalTax += taxInThisBracket;
    remaining -= taxableInThisBracket;

    const rangeLabel =
      b.threshold === Infinity
        ? `Trên 80 triệu`
        : `${previousThreshold / 1000000} - ${b.threshold / 1000000} triệu`;

    breakdown.push({
      bracket: b.level,
      rangeLabel,
      rate: b.rate,
      taxableInBracket: taxableInThisBracket,
      tax: taxInThisBracket
    });

    previousThreshold = b.threshold;
  }

  return { pitWithheld: totalTax, bracketBreakdown: breakdown };
}

/**
 * Input parameters for calculating monthly payroll
 */
export interface PayrollInput {
  id?: string;
  userId?: string;
  month: string;
  contractSalary: number;
  isProbation?: boolean;
  probationRate?: number;
  baseSalaryForInsurance?: number;
  standardWorkDays?: number;
  actualWorkDays?: number;
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
  overtimeWeekdayHours?: number;
  overtimeWeekendHours?: number;
  overtimeHolidayHours?: number;
  taxableAllowances?: number;
  nonTaxableAllowances?: number;
  performanceBonus?: number;
  salesCommission?: number;
  dependentCount?: number;
  status?: 'draft' | 'verified' | 'paid';
  targetAccountId?: string;
  actualPaidDate?: string;
}

/**
 * Complete Payroll Calculation Engine adhering strictly to Vietnamese statutory standards
 */
export function calculatePayroll(input: PayrollInput): PayrollRecord {
  const standardWorkDays = input.standardWorkDays ?? 22;
  const actualWorkDays = input.actualWorkDays ?? standardWorkDays;
  const paidLeaveDays = input.paidLeaveDays ?? 0;
  const unpaidLeaveDays = input.unpaidLeaveDays ?? 0;

  const isProbation = Boolean(input.isProbation);
  const probationRate = isProbation ? (input.probationRate ?? 0.85) : 1;

  // 1. Effective monthly contract salary after probation adjustment
  const effectiveMonthlyContract = Math.round(input.contractSalary * probationRate);

  // Daily and Hourly rates
  const dailyRate = standardWorkDays > 0 ? effectiveMonthlyContract / standardWorkDays : 0;
  const hourlyRate = dailyRate / 8;

  // Base worked days pay (actual + paid leaves)
  const totalPaidDays = Math.min(standardWorkDays, actualWorkDays + paidLeaveDays);
  const baseSalaryEarned = Math.round(dailyRate * totalPaidDays);

  // 2. Overtime calculation
  const otWeekdayHours = input.overtimeWeekdayHours ?? 0;
  const otWeekendHours = input.overtimeWeekendHours ?? 0;
  const otHolidayHours = input.overtimeHolidayHours ?? 0;

  const otWeekdayPay = Math.round(otWeekdayHours * hourlyRate * 1.5);
  const otWeekendPay = Math.round(otWeekendHours * hourlyRate * 2.0);
  const otHolidayPay = Math.round(otHolidayHours * hourlyRate * 3.0);
  const overtimePayTotal = otWeekdayPay + otWeekendPay + otHolidayPay;

  // Tax-exempt OT pay is the premium portion (0.5x, 1.0x, 2.0x)
  const otTaxExemptPay = Math.round(
    otWeekdayHours * hourlyRate * 0.5 +
    otWeekendHours * hourlyRate * 1.0 +
    otHolidayHours * hourlyRate * 2.0
  );

  // 3. Allowances & Bonuses
  const taxableAllowances = input.taxableAllowances ?? 0;
  const nonTaxableAllowances = input.nonTaxableAllowances ?? 0;
  const performanceBonus = input.performanceBonus ?? 0;
  const salesCommission = input.salesCommission ?? 0;

  // 4. Gross Income (Tổng thu nhập trước trích nộp)
  const grossIncome =
    baseSalaryEarned +
    overtimePayTotal +
    taxableAllowances +
    nonTaxableAllowances +
    performanceBonus +
    salesCommission;

  // 5. Compulsory Social, Health, Unemployment Insurance (SHUI)
  const insuranceBase = input.baseSalaryForInsurance ?? input.contractSalary;
  
  // Cap checks
  const cappedBhxhBhytBase = Math.min(insuranceBase, STATUTORY_LIMITS.BHXH_BHYT_SALARY_CAP);
  const cappedBhtnBase = Math.min(insuranceBase, STATUTORY_LIMITS.BHTN_SALARY_CAP);

  const socialInsuranceEmployee = Math.round(cappedBhxhBhytBase * STATUTORY_LIMITS.EMPLOYEE_BHXH_RATE);
  const healthInsuranceEmployee = Math.round(cappedBhxhBhytBase * STATUTORY_LIMITS.EMPLOYEE_BHYT_RATE);
  const unemploymentInsuranceEmployee = Math.round(cappedBhtnBase * STATUTORY_LIMITS.EMPLOYEE_BHTN_RATE);
  const totalInsuranceEmployee = socialInsuranceEmployee + healthInsuranceEmployee + unemploymentInsuranceEmployee;

  // Employer insurance (company portion)
  const socialInsuranceEmployer = Math.round(cappedBhxhBhytBase * STATUTORY_LIMITS.EMPLOYER_BHXH_RATE);
  const healthInsuranceEmployer = Math.round(cappedBhxhBhytBase * STATUTORY_LIMITS.EMPLOYER_BHYT_RATE);
  const unemploymentInsuranceEmployer = Math.round(cappedBhtnBase * STATUTORY_LIMITS.EMPLOYER_BHTN_RATE);
  const workAccidentEmployer = Math.round(cappedBhxhBhytBase * STATUTORY_LIMITS.EMPLOYER_BHTNL_RATE);
  const totalInsuranceEmployer =
    socialInsuranceEmployer + healthInsuranceEmployer + unemploymentInsuranceEmployer + workAccidentEmployer;

  // 6. Taxable and Assessable Income
  // Taxable income = Gross - Non-taxable allowances - Tax-exempt OT
  const taxableIncome = Math.max(0, grossIncome - nonTaxableAllowances - otTaxExemptPay);

  // Family Deductions (Giảm trừ gia cảnh)
  const personalDeduction = STATUTORY_LIMITS.PERSONAL_DEDUCTION;
  const dependentCount = input.dependentCount ?? 0;
  const dependentDeductionTotal = dependentCount * STATUTORY_LIMITS.DEPENDENT_DEDUCTION;
  const totalDeductions = personalDeduction + dependentDeductionTotal + totalInsuranceEmployee;

  // Assessable Income for 7-bracket PIT = Taxable Income - Total Deductions
  const assessableIncome = Math.max(0, taxableIncome - totalDeductions);

  // 7. PIT Withheld
  const { pitWithheld } = calculateProgressivePit(assessableIncome);

  // 8. Net Take-Home Salary (Lương thực nhận)
  const netSalary = Math.max(0, grossIncome - totalInsuranceEmployee - pitWithheld);

  return {
    id: input.id ?? uid(),
    userId: input.userId ?? 'demo',
    month: input.month,
    status: input.status ?? 'draft',

    contractSalary: input.contractSalary,
    isProbation,
    probationRate,
    baseSalaryForInsurance: insuranceBase,

    standardWorkDays,
    actualWorkDays,
    paidLeaveDays,
    unpaidLeaveDays,

    overtimeWeekdayHours: otWeekdayHours,
    overtimeWeekendHours: otWeekendHours,
    overtimeHolidayHours: otHolidayHours,
    overtimePayTotal,
    overtimeTaxExemptPay: otTaxExemptPay,

    taxableAllowances,
    nonTaxableAllowances,
    performanceBonus,
    salesCommission,

    grossIncome,

    socialInsuranceEmployee,
    healthInsuranceEmployee,
    unemploymentInsuranceEmployee,
    totalInsuranceEmployee,

    socialInsuranceEmployer,
    healthInsuranceEmployer,
    unemploymentInsuranceEmployer,
    totalInsuranceEmployer,

    personalDeduction,
    dependentCount,
    dependentDeductionTotal,
    taxableIncome,
    assessableIncome,
    pitWithheld,

    netSalary,
    targetAccountId: input.targetAccountId,
    actualPaidDate: input.actualPaidDate
  };
}

