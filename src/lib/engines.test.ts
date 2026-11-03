import { describe, it, expect } from 'vitest';
import {
  calculatePayroll,
  calculateProgressivePit,
  STATUTORY_LIMITS
} from './payrollEngine';
import {
  calculateWeightedAverageBuy,
  calculateSellOrder,
  calculateSLTPMetrics
} from './investmentEngine';

describe('Finora Payroll & Vietnamese Tax Engine (FINORA_INCOME_AND_PAYROLL_SPEC)', () => {
  it('correctly calculates 7-bracket progressive PIT tax', () => {
    // 0 assessable income -> 0 tax
    expect(calculateProgressivePit(0).pitWithheld).toBe(0);

    // 5M -> Bracket 1 (5%) = 250,000 VND
    expect(calculateProgressivePit(5000000).pitWithheld).toBe(250000);

    // 10M -> 5M * 5% + 5M * 10% = 250,000 + 500,000 = 750,000 VND
    expect(calculateProgressivePit(10000000).pitWithheld).toBe(750000);

    // 18M -> 750,000 + 8M * 15% (1.2M) = 1,950,000 VND
    expect(calculateProgressivePit(18000000).pitWithheld).toBe(1950000);

    // 32M -> 1,950,000 + 14M * 20% (2.8M) = 4,750,000 VND
    expect(calculateProgressivePit(32000000).pitWithheld).toBe(4750000);
  });

  it('correctly calculates standard monthly payroll with employee SHUI (10.5%)', () => {
    const record = calculatePayroll({
      month: '2026-11',
      contractSalary: 30000000,
      standardWorkDays: 22,
      actualWorkDays: 22,
      dependentCount: 0
    });

    // 10.5% SHUI on 30,000,000 = 3,150,000 VND
    expect(record.socialInsuranceEmployee).toBe(2400000); // 8%
    expect(record.healthInsuranceEmployee).toBe(450000);  // 1.5%
    expect(record.unemploymentInsuranceEmployee).toBe(300000); // 1%
    expect(record.totalInsuranceEmployee).toBe(3150000);

    // Taxable income = 30M
    // Deductions = 11M (personal) + 3.15M (insurance) = 14.15M
    // Assessable income = 30M - 14.15M = 15.85M
    // Tax = 5M*5% + 5M*10% + 5.85M*15% = 250k + 500k + 877.5k = 1,627,500
    expect(record.taxableIncome).toBe(30000000);
    expect(record.assessableIncome).toBe(15850000);
    expect(record.pitWithheld).toBe(1627500);

    // Net take-home = 30M - 3.15M - 1.6275M = 25,222,500 VND
    expect(record.netSalary).toBe(25222500);
  });

  it('enforces statutory salary cap on insurance contributions', () => {
    // Salary 100M VND exceeds BHXH/BHYT cap (46.8M) and BHTN cap (99.2M)
    const record = calculatePayroll({
      month: '2026-11',
      contractSalary: 100000000,
      standardWorkDays: 22,
      actualWorkDays: 22,
      dependentCount: 0
    });

    // BHXH 8% capped at 46.8M = 3,744,000 VND
    expect(record.socialInsuranceEmployee).toBe(Math.round(STATUTORY_LIMITS.BHXH_BHYT_SALARY_CAP * 0.08));
    // BHYT 1.5% capped at 46.8M = 702,000 VND
    expect(record.healthInsuranceEmployee).toBe(Math.round(STATUTORY_LIMITS.BHXH_BHYT_SALARY_CAP * 0.015));
    // BHTN 1% capped at 99.2M = 992,000 VND
    expect(record.unemploymentInsuranceEmployee).toBe(Math.round(STATUTORY_LIMITS.BHTN_SALARY_CAP * 0.01));
  });

  it('correctly handles probation rate at 85%', () => {
    const record = calculatePayroll({
      month: '2026-11',
      contractSalary: 20000000,
      isProbation: true,
      probationRate: 0.85,
      standardWorkDays: 22,
      actualWorkDays: 22
    });

    // Gross salary during probation = 20M * 85% = 17,000,000 VND
    expect(record.grossIncome).toBe(17000000);
  });

  it('correctly calculates overtime pay and exempts OT premium from tax', () => {
    const record = calculatePayroll({
      month: '2026-11',
      contractSalary: 22000000,
      standardWorkDays: 22,
      actualWorkDays: 22,
      overtimeWeekdayHours: 10 // Hourly rate = 22M / 22 / 8 = 125,000 VND. 10h @ 150% = 1,875,000 VND
    });

    // OT pay total = 10 * 125,000 * 1.5 = 1,875,000 VND
    expect(record.overtimePayTotal).toBe(1875000);
    // Tax exempt OT premium = 10 * 125,000 * 0.5 = 625,000 VND
    expect(record.overtimeTaxExemptPay).toBe(625000);
    // Taxable income = Gross - exempt OT = 23,875,000 - 625,000 = 23,250,000 VND
    expect(record.taxableIncome).toBe(23250000);
  });
});

describe('Finora Investment Ledger & SL/TP Engine (FINORA_INVESTMENT_ARCHITECTURE)', () => {
  it('correctly calculates Weighted Average Cost Basis on BUY', () => {
    // Existing: 100 shares @ 50,000 = 5,000,000 VND
    // Buy new: 100 shares @ 60,000 + 10,000 fee = 6,010,000 VND
    // Total = 11,010,000 VND / 200 shares = 55,050 VND/share
    const res = calculateWeightedAverageBuy(100, 5000000, 100, 60000, 10000);
    expect(res.newQuantity).toBe(200);
    expect(res.newTotalCostBasis).toBe(11010000);
    expect(res.newAveragePrice).toBe(55050);
  });

  it('correctly calculates Realized P/L on SELL with 0.1% tax', () => {
    // 200 shares @ cost basis 10,000,000 VND (50,000/share)
    // Sell 100 shares @ 70,000/share = 7,000,000 VND
    // Cost basis of sold = 5,000,000 VND
    // Fee = 15,000 VND
    // Tax (0.1%) = 7,000 VND
    // Net proceeds = 7,000,000 - 15,000 - 7,000 = 6,978,000 VND
    // Realized P/L = 6,978,000 - 5,000,000 = 1,978,000 VND (+39.56%)
    const res = calculateSellOrder(200, 10000000, 100, 70000, 15000, 0.001);
    expect(res.remainingQty).toBe(100);
    expect(res.remainingCostBasis).toBe(5000000);
    expect(res.grossAmount).toBe(7000000);
    expect(res.taxAmount).toBe(7000);
    expect(res.netProceeds).toBe(6978000);
    expect(res.realizedPnL).toBe(1978000);
  });

  it('calculates Risk/Reward Ratio and triggers correct SL/TP status', () => {
    // Entry: 100,000. TP: 120,000 (+20k). SL: 90,000 (-10k). R:R = 2.0
    const normal = calculateSLTPMetrics(100000, 105000, 120000, 90000);
    expect(normal.riskRewardRatio).toBe(2);
    expect(normal.status).toBe('safe');

    // Price hits TP (121,000 >= 120,000)
    const tpHit = calculateSLTPMetrics(100000, 121000, 120000, 90000);
    expect(tpHit.status).toBe('tp_hit');

    // Price hits SL (89,000 <= 90,000)
    const slHit = calculateSLTPMetrics(100000, 89000, 120000, 90000);
    expect(slHit.status).toBe('sl_hit');
  });
});

