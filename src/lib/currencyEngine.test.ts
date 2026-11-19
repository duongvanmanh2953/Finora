import { describe, it, expect } from 'vitest';
import {
  convertCurrency,
  formatCurrencyAmount,
  calculateUnifiedPortfolioBalance,
  DEFAULT_EXCHANGE_RATES
} from './currencyEngine';

describe('Finora Multi-Currency Engine', () => {
  it('1. Correctly converts between foreign currencies and VND base', () => {
    // 100 USD to VND
    const vndAmount = convertCurrency(100, 'USD', 'VND');
    expect(vndAmount).toBe(100 * DEFAULT_EXCHANGE_RATES.USD); // 2,545,000 VND

    // 2,545,000 VND to USD
    const usdAmount = convertCurrency(2545000, 'VND', 'USD');
    expect(usdAmount).toBe(100);

    // Cross-currency conversion: 100 EUR to USD
    // 100 EUR = 2,720,000 VND. 2,720,000 / 25,450 ≈ 106.88 USD
    const eurToUsd = convertCurrency(100, 'EUR', 'USD');
    expect(eurToUsd).toBeCloseTo(106.88, 1);
  });

  it('2. Respects custom exchange rates overrides', () => {
    const customRates = {
      USD: 26000
    };
    const converted = convertCurrency(50, 'USD', 'VND', customRates);
    expect(converted).toBe(50 * 26000); // 1,300,000 VND
  });

  it('3. Formats currency amounts correctly according to currency decimal rules', () => {
    const formattedVnd = formatCurrencyAmount(1500000, 'VND', 'vi-VN');
    expect(formattedVnd).toContain('1.500.000');

    const formattedUsd = formatCurrencyAmount(1250.5, 'USD', 'en-US');
    expect(formattedUsd).toContain('1,250.50');
    expect(formattedUsd).toContain('$');
  });

  it('4. Unifies multi-currency accounts into single portfolio balance', () => {
    const accounts = [
      { id: 'acc-1', name: 'Tiền mặt VND', balance: 10000000, currency: 'VND' as const },
      { id: 'acc-2', name: 'Tài khoản USD', balance: 1000, currency: 'USD' as const }, // 25,450,000 VND
      { id: 'acc-3', name: 'Tài khoản EUR', balance: 500, currency: 'EUR' as const }   // 13,600,000 VND
    ];

    const result = calculateUnifiedPortfolioBalance(accounts, 'VND');
    expect(result.targetCurrency).toBe('VND');
    expect(result.breakdown).toHaveLength(3);
    // Total = 10,000,000 + 25,450,000 + 13,600,000 = 49,050,000 VND
    expect(result.totalTargetBalance).toBe(49050000);
  });
});
