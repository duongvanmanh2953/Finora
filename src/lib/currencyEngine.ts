/**
 * Finora Multi-Currency Engine
 * Standards-compliant currency exchange & reporting conversion engine
 */

export type SupportedCurrency = 'VND' | 'USD' | 'EUR' | 'JPY' | 'AUD' | 'GBP' | 'SGD' | 'CAD';

export interface ExchangeRateConfig {
  baseCurrency: 'VND';
  updatedAt: string;
  rates: Record<SupportedCurrency, number>; // value of 1 foreign unit in base VND
}

/**
 * Standard baseline exchange rates to VND (Updated reference rates)
 */
export const DEFAULT_EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  VND: 1,
  USD: 25450,
  EUR: 27200,
  JPY: 165,
  AUD: 16500,
  GBP: 32500,
  SGD: 19000,
  CAD: 18200
};

export const CURRENCY_METADATA: Record<SupportedCurrency, { name: string; symbol: string; flag: string; decimals: number }> = {
  VND: { name: 'Việt Nam Đồng', symbol: '₫', flag: '🇻🇳', decimals: 0 },
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2 },
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2 },
  JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimals: 0 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', decimals: 2 },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧', decimals: 2 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', decimals: 2 },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', decimals: 2 }
};

/**
 * Converts an amount from one currency to another using the provided rates (or defaults)
 */
export function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  customRates: Partial<Record<SupportedCurrency, number>> = {}
): number {
  if (from === to) return amount;
  if (!amount || isNaN(amount)) return 0;

  const rates: Record<SupportedCurrency, number> = {
    ...DEFAULT_EXCHANGE_RATES,
    ...customRates
  };

  const rateFrom = rates[from] || 1;
  const rateTo = rates[to] || 1;

  // Convert to VND base first, then to target currency
  const amountInVnd = amount * rateFrom;
  const targetAmount = amountInVnd / rateTo;

  const decimals = CURRENCY_METADATA[to]?.decimals ?? 2;
  const factor = Math.pow(10, decimals);
  return Math.round(targetAmount * factor) / factor;
}

/**
 * Formats an amount with standard currency locale and symbol
 */
export function formatCurrencyAmount(
  amount: number,
  currency: SupportedCurrency = 'VND',
  locale: string = 'vi-VN'
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  const meta = CURRENCY_METADATA[currency] || CURRENCY_METADATA.VND;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: meta.decimals,
      minimumFractionDigits: meta.decimals
    }).format(amount);
  } catch {
    // Fallback if locale or currency code is unsupported
    const formatted = amount.toLocaleString(locale, {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals
    });
    return `${formatted} ${meta.symbol}`;
  }
}

/**
 * Calculates total net worth unified into VND base currency
 * across accounts that may have different foreign currencies
 */
export interface MultiCurrencyAccount {
  id: string;
  name: string;
  balance: number;
  currency?: SupportedCurrency;
}

export function calculateUnifiedPortfolioBalance(
  accounts: MultiCurrencyAccount[],
  targetCurrency: SupportedCurrency = 'VND',
  customRates?: Partial<Record<SupportedCurrency, number>>
): {
  totalTargetBalance: number;
  targetCurrency: SupportedCurrency;
  breakdown: Array<{
    accountId: string;
    name: string;
    originalBalance: number;
    currency: SupportedCurrency;
    convertedBalance: number;
    rateUsed: number;
  }>;
} {
  const breakdown = accounts.map(acc => {
    const cur = acc.currency || 'VND';
    const converted = convertCurrency(acc.balance, cur, targetCurrency, customRates);
    const rateUsed = convertCurrency(1, cur, targetCurrency, customRates);
    return {
      accountId: acc.id,
      name: acc.name,
      originalBalance: acc.balance,
      currency: cur,
      convertedBalance: converted,
      rateUsed
    };
  });

  const totalTargetBalance = breakdown.reduce((sum, item) => sum + item.convertedBalance, 0);

  return {
    totalTargetBalance,
    targetCurrency,
    breakdown
  };
}
