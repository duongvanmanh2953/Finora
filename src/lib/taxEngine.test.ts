import { describe, it, expect } from 'vitest';
import {
  calculateMonthlySalaryPit,
  calculateFreelanceWithholding,
  projectAnnualTaxSettlement
} from './taxEngine';

describe('Finora Vietnam Personal Income Tax (PIT) Engine', () => {
  it('1. Calculates salary PIT correctly across progressive brackets', () => {
    // Gross: 30,000,000 VND, 0 dependents, no insurance
    // Deductions: 11,000,000 VND (personal)
    // Taxable: 19,000,000 VND
    // Bậc 1 (5M @ 5%): 250,000
    // Bậc 2 (5M @ 10%): 500,000
    // Bậc 3 (8M @ 15%): 1,200,000
    // Bậc 4 (1M @ 20%): 200,000
    // Total Tax: 250k + 500k + 1200k + 200k = 2,150,000 VND
    const result = calculateMonthlySalaryPit(30000000, {
      personalMonthly: 11000000,
      dependentCount: 0,
      monthlyInsurance: 0
    });

    expect(result.taxableIncome).toBe(19000000);
    expect(result.taxDue).toBe(2150000);
    expect(result.bracketLevel).toBe(4);
    expect(result.bracketBreakdown).toHaveLength(4);
  });

  it('2. Properly applies dependent deduction (4.4M/person)', () => {
    // Gross: 20,000,000 VND, 2 dependents
    // Deductions: 11M + 2 * 4.4M = 19.8M
    // Taxable: 20M - 19.8M = 200,000 VND
    // Tax: 200,000 * 5% = 10,000 VND
    const result = calculateMonthlySalaryPit(20000000, {
      dependentCount: 2
    });

    expect(result.taxableIncome).toBe(200000);
    expect(result.taxDue).toBe(10000);
  });

  it('3. Calculates Freelance 10% withholding over 2M threshold', () => {
    // Payout under 2M: 0 withholding
    const under = calculateFreelanceWithholding(1500000);
    expect(under.withheldTax).toBe(0);
    expect(under.netPayout).toBe(1500000);

    // Payout 10M: 10% withholding = 1,000,000
    const over = calculateFreelanceWithholding(10000000);
    expect(over.withheldTax).toBe(1000000);
    expect(over.netPayout).toBe(9000000);
  });

  it('4. Projects annual tax settlement and flags refund vs additional payable', () => {
    // Annual gross: 300,000,000 VND (12 months)
    // 0 dependents, no insurance
    // Personal deduction: 12 * 11M = 132,000,000
    // Taxable: 168,000,000 VND
    // Falls into Annual Bracket 3 (120M to 216M, 15% - 9,000,000):
    // 168M * 15% - 9M = 25.2M - 9M = 16,200,000 VND
    // If prepaid 20,000,000 VND -> Refund 3,800,000 VND
    const settlement = projectAnnualTaxSettlement({
      totalGrossIncomeYtd: 300000000,
      monthsActive: 12,
      dependentCount: 0,
      totalInsurancePaidYtd: 0,
      totalTaxPrepaidYtd: 20000000
    });

    expect(settlement.totalTaxPayableAnnual).toBe(16200000);
    expect(settlement.settlementStatus).toBe('REFUND_EXPECTED');
    expect(settlement.balanceDifference).toBe(-3800000);
    expect(settlement.taxOptimizationAdvice.length).toBeGreaterThan(0);
  });
});
