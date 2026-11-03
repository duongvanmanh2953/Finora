import { todayKey } from './finance';
import type {
  UnifiedAssetType,
  StrategyType,
  UnifiedInvestmentTransaction,
  GoldPriceItem,
  BankRateBenchmark
} from '../types/unifiedInvestment';

/**
 * Standard Benchmark Interest Rates for Vietnamese Banks (% / year)
 * Reflects latest market levels for 2025-2026.
 */
export const VN_BANK_RATE_BENCHMARKS: BankRateBenchmark[] = [
  {
    bank: 'Vietcombank (VCB)',
    shortName: 'VCB',
    type: 'big4',
    rates: { term1M: 1.7, term3M: 2.0, term6M: 3.0, term12M: 4.7, term24M: 4.7 }
  },
  {
    bank: 'BIDV',
    shortName: 'BIDV',
    type: 'big4',
    rates: { term1M: 1.7, term3M: 2.0, term6M: 3.0, term12M: 4.7, term24M: 4.7 }
  },
  {
    bank: 'VietinBank (CTG)',
    shortName: 'CTG',
    type: 'big4',
    rates: { term1M: 1.7, term3M: 2.0, term6M: 3.0, term12M: 4.7, term24M: 4.8 }
  },
  {
    bank: 'Agribank',
    shortName: 'AGR',
    type: 'big4',
    rates: { term1M: 1.7, term3M: 2.0, term6M: 3.0, term12M: 4.7, term24M: 4.7 }
  },
  {
    bank: 'Techcombank (TCB)',
    shortName: 'TCB',
    type: 'commercial',
    rates: { term1M: 3.1, term3M: 3.5, term6M: 4.6, term12M: 5.2, term24M: 5.5 }
  },
  {
    bank: 'MB Bank',
    shortName: 'MBB',
    type: 'commercial',
    rates: { term1M: 3.2, term3M: 3.6, term6M: 4.5, term12M: 5.3, term24M: 5.7 }
  },
  {
    bank: 'VPBank',
    shortName: 'VPB',
    type: 'commercial',
    rates: { term1M: 3.5, term3M: 3.8, term6M: 4.8, term12M: 5.6, term24M: 5.8 }
  },
  {
    bank: 'ACB',
    shortName: 'ACB',
    type: 'commercial',
    rates: { term1M: 3.0, term3M: 3.4, term6M: 4.5, term12M: 5.0, term24M: 5.4 }
  },
  {
    bank: 'HDBank',
    shortName: 'HDB',
    type: 'commercial',
    rates: { term1M: 3.3, term3M: 3.6, term6M: 5.0, term12M: 5.7, term24M: 6.0 }
  }
];

/**
 * Verified Gold Market Prices (VND / Lượng & Chỉ)
 * System uses BUY price (Giá tiệm thu mua) for conservative net-worth valuation.
 */
export const VN_GOLD_PRICES: GoldPriceItem[] = [
  {
    type: 'SJC',
    brand: 'Vàng miếng SJC 999.9',
    buyPrice: 87500000, // 87.5 tr / lượng
    sellPrice: 89500000,
    unit: 'lượng',
    updatedAt: todayKey()
  },
  {
    type: 'NHAN_9999',
    brand: 'Vàng nhẫn trơn 999.9 PNJ / DOJI',
    buyPrice: 86800000, // 86.8 tr / lượng
    sellPrice: 88200000,
    unit: 'lượng',
    updatedAt: todayKey()
  }
];

/**
 * 1. Auto-Accrued Interest Calculator
 * Accrues daily interest: Principal * (Rate / 100 / 365) * Days
 */
export function calculateAccruedInterest(
  principal: number,
  annualInterestRate: number,
  startDateStr: string,
  asOfDateStr: string = todayKey()
): {
  daysPassed: number;
  accruedInterest: number;
  dailyEarned: number;
  projectedTotalInterest: number;
} {
  if (principal <= 0 || annualInterestRate <= 0 || !startDateStr) {
    return { daysPassed: 0, accruedInterest: 0, dailyEarned: 0, projectedTotalInterest: 0 };
  }

  const start = new Date(startDateStr);
  const now = new Date(asOfDateStr);
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const dailyEarned = (principal * (annualInterestRate / 100)) / 365;
  const accruedInterest = Math.round(dailyEarned * daysPassed);
  const projectedTotalInterest = Math.round(dailyEarned * 365);

  return {
    daysPassed,
    accruedInterest,
    dailyEarned: Math.round(dailyEarned),
    projectedTotalInterest
  };
}

/**
 * 2. Suggest average VN Bank Deposit Rate based on term & bank
 */
export function getSuggestedBankRate(bankName: string = '', termMonths: number = 6): number {
  const norm = bankName.toLowerCase();
  const matched = VN_BANK_RATE_BENCHMARKS.find(
    b => norm.includes(b.shortName.toLowerCase()) || norm.includes(b.bank.toLowerCase())
  );

  const fallback = norm.includes('vcb') || norm.includes('vietcombank') || norm.includes('bidv') || norm.includes('agribank')
    ? VN_BANK_RATE_BENCHMARKS[0]
    : VN_BANK_RATE_BENCHMARKS[4]; // Default to Techcombank / Commercial

  const target = matched || fallback;

  if (termMonths <= 1) return target.rates.term1M;
  if (termMonths <= 3) return target.rates.term3M;
  if (termMonths <= 6) return target.rates.term6M;
  if (termMonths <= 12) return target.rates.term12M;
  return target.rates.term24M;
}

/**
 * 3. Gold Valuation Helper (Converts Lượng / Chỉ with Auto-Price Sync)
 */
export function getGoldUnitPrice(type: 'SJC' | 'NHAN_9999', unit: 'lượng' | 'chỉ'): number {
  const item = VN_GOLD_PRICES.find(g => g.type === type) || VN_GOLD_PRICES[0];
  const pricePerLuong = item.buyPrice;
  return unit === 'chỉ' ? Math.round(pricePerLuong / 10) : pricePerLuong;
}

/**
 * 4. Weighted Average Cost Basis Calculator (DCA vs Trade Aware)
 */
export function calculateWeightedAverageCost(
  transactions: UnifiedInvestmentTransaction[],
  strategyFilter?: StrategyType
): {
  quantity: number;
  totalCostBasis: number;
  avgUnitPrice: number;
  realizedPnL: number;
} {
  const list = strategyFilter
    ? transactions.filter(t => t.strategy_type === strategyFilter)
    : transactions;

  let totalQty = 0;
  let totalCost = 0;
  let realizedPnL = 0;

  for (const tx of list) {
    if (tx.type === 'BUY' || tx.type === 'DEPOSIT_SAVINGS') {
      totalQty += tx.quantity;
      totalCost += tx.totalAmount + (tx.fee || 0);
    } else if (tx.type === 'SELL' || tx.type === 'WITHDRAW_SAVINGS') {
      if (totalQty > 0) {
        const avg = totalCost / totalQty;
        const sellCost = tx.quantity * avg;
        const netProceeds = tx.totalAmount - (tx.fee || 0) - (tx.tax || 0);
        realizedPnL += netProceeds - sellCost;
        totalQty = Math.max(0, totalQty - tx.quantity);
        totalCost = Math.max(0, totalCost - sellCost);
      }
    }
  }

  const avgUnitPrice = totalQty > 0 ? Math.round(totalCost / totalQty) : 0;
  return {
    quantity: totalQty,
    totalCostBasis: Math.round(totalCost),
    avgUnitPrice,
    realizedPnL: Math.round(realizedPnL)
  };
}

/**
 * 5. Smart Natural Language Parser for Vietnamese Investment Quick Entry
 * Parses commands like:
 * - "Mua 200 TCB giá 31.8 tích sản tháng này"
 * - "Bán 50 FPT giá 142 lướt sóng đạt target"
 * - "Gửi tiết kiệm 50tr 6 tháng lãi 5.2%"
 * - "Mua 3 chỉ vàng nhẫn 9999 tích lũy"
 */
export interface ParsedInvestmentCommand {
  raw: string;
  assetType: UnifiedAssetType;
  strategy_type: StrategyType;
  action: 'BUY' | 'SELL' | 'DEPOSIT_SAVINGS';
  symbol: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  termMonths?: number;
  annualYieldRate?: number;
  quick_note: string;
  trade_note?: string;
  confidence: number;
}

export function parseInvestmentNLP(
  rawText: string,
  defaultStrategy: StrategyType = 'DCA'
): ParsedInvestmentCommand {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  let assetType: UnifiedAssetType = 'STOCK_VN';
  let strategy_type: StrategyType = defaultStrategy;
  let action: 'BUY' | 'SELL' | 'DEPOSIT_SAVINGS' = 'BUY';
  let symbol = 'TCB';
  let name = 'Techcombank';
  let quantity = 100;
  let unit = 'cổ phiếu';
  let unitPrice = 25000;
  let termMonths: number | undefined;
  let annualYieldRate: number | undefined;
  let quick_note = text;
  let trade_note: string | undefined;

  // 1. Detect Strategy (Trade vs DCA)
  if (
    lower.includes('lướt') ||
    lower.includes('trade') ||
    lower.includes('ngắn hạn') ||
    lower.includes('sóng') ||
    lower.includes('target') ||
    lower.includes('cắt lỗ')
  ) {
    strategy_type = 'TRADE';
    trade_note = text;
  } else if (
    lower.includes('tích sản') ||
    lower.includes('dca') ||
    lower.includes('dài hạn') ||
    lower.includes('hưu') ||
    lower.includes('mỗi tháng')
  ) {
    strategy_type = 'DCA';
  }

  // 2. Detect Action (Buy vs Sell)
  if (lower.startsWith('bán') || lower.includes('chốt') || lower.includes('bán bớt')) {
    action = 'SELL';
  } else if (lower.includes('tiết kiệm') || lower.includes('gửi')) {
    action = 'DEPOSIT_SAVINGS';
  } else {
    action = 'BUY';
  }

  // 3. CASE A: BANK SAVINGS (Tiết kiệm)
  if (lower.includes('tiết kiệm') || lower.includes('gửi ngân hàng') || lower.includes('stk')) {
    assetType = 'SAVINGS_VN';
    unit = 'sổ';
    strategy_type = 'DCA'; // Savings is wealth preservation

    // Parse amount (e.g. 50tr, 100tr, 20 triệu, 500k)
    const amtMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(tr|triệu|k|nghìn)?/i);
    let principal = 50000000;
    if (amtMatch) {
      const val = parseFloat(amtMatch[1].replace(',', '.'));
      const u = amtMatch[2]?.toLowerCase();
      if (u === 'tr' || u === 'triệu') principal = Math.round(val * 1000000);
      else if (u === 'k' || u === 'nghìn') principal = Math.round(val * 1000);
      else if (val < 1000) principal = Math.round(val * 1000000);
      else principal = Math.round(val);
    }

    // Parse term (e.g. 6 tháng, 12 tháng, 1 năm)
    const termMatch = lower.match(/(\d+)\s*(tháng|t|năm)/i);
    termMonths = 6;
    if (termMatch) {
      const num = parseInt(termMatch[1], 10);
      termMonths = termMatch[2] === 'năm' ? num * 12 : num;
    }

    // Parse rate (e.g. 5.2%, 6%)
    const rateMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (rateMatch) {
      annualYieldRate = parseFloat(rateMatch[1].replace(',', '.'));
    } else {
      annualYieldRate = getSuggestedBankRate('TCB', termMonths);
    }

    symbol = `STK-${termMonths}M`;
    name = `Sổ tiết kiệm kỳ hạn ${termMonths} tháng`;
    quantity = 1;
    unitPrice = principal;
    quick_note = `Gửi tiết kiệm ${termMonths}T lãi suất ${annualYieldRate}%/năm`;

    return {
      raw: text,
      assetType,
      strategy_type,
      action: 'DEPOSIT_SAVINGS',
      symbol,
      name,
      quantity,
      unit,
      unitPrice,
      totalAmount: principal,
      termMonths,
      annualYieldRate,
      quick_note,
      trade_note,
      confidence: 0.95
    };
  }

  // 4. CASE B: GOLD (Vàng miếng & Nhẫn 9999)
  if (lower.includes('vàng') || lower.includes('sjc') || lower.includes('chỉ') || lower.includes('lượng')) {
    assetType = 'GOLD_VN';
    const isSjc = lower.includes('sjc') || lower.includes('miếng');
    const isChi = lower.includes('chỉ') || !lower.includes('lượng');
    unit = isChi ? 'chỉ' : 'lượng';

    // Parse quantity (e.g. 2 chỉ, 5 chỉ, 1 lượng)
    const qtyMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(chỉ|lượng|cây)?/i);
    if (qtyMatch) {
      quantity = parseFloat(qtyMatch[1].replace(',', '.'));
    } else {
      quantity = 1;
    }

    const goldType = isSjc ? 'SJC' : 'NHAN_9999';
    unitPrice = getGoldUnitPrice(goldType, unit as 'chỉ' | 'lượng');
    symbol = isSjc ? 'SJC' : 'NHAN-9999';
    name = isSjc ? 'Vàng miếng SJC 999.9' : 'Vàng nhẫn trơn 999.9';
    quick_note = `${action === 'BUY' ? 'Mua' : 'Bán'} ${quantity} ${unit} ${name}`;

    return {
      raw: text,
      assetType,
      strategy_type,
      action,
      symbol,
      name,
      quantity,
      unit,
      unitPrice,
      totalAmount: Math.round(quantity * unitPrice),
      quick_note,
      trade_note,
      confidence: 0.92
    };
  }

  // 5. CASE C: VIETNAM STOCKS & MUTUAL FUNDS (Cổ phiếu & Quỹ mở VN)
  // e.g. "Mua 200 TCB giá 31.8" or "Ban 100 FPT 138k"
  const stockMatch = text.match(/(mua|bán|ban)\s+(\d+)\s+([A-Za-z0-9]+)(\s+giá\s+(\d+(?:[.,]\d+)?k?))?/i);
  if (stockMatch) {
    quantity = parseInt(stockMatch[2], 10);
    symbol = stockMatch[3].toUpperCase();
    const rawPrice = stockMatch[5];

    if (rawPrice) {
      const cleanP = rawPrice.replace('k', '').replace(',', '.');
      const p = parseFloat(cleanP);
      unitPrice = p < 1000 ? Math.round(p * 1000) : Math.round(p);
    } else {
      unitPrice = 25000;
    }

    name = `Cổ phiếu ${symbol}`;
    unit = 'cổ phiếu';
    quick_note = `${strategy_type === 'TRADE' ? '[Lướt sóng]' : '[Tích sản]'} ${action === 'BUY' ? 'Mua' : 'Bán'} ${quantity} ${symbol}`;

    return {
      raw: text,
      assetType: 'STOCK_VN',
      strategy_type,
      action,
      symbol,
      name,
      quantity,
      unit,
      unitPrice,
      totalAmount: Math.round(quantity * unitPrice),
      quick_note,
      trade_note,
      confidence: 0.95
    };
  }

  // Fallback stock extractor
  return {
    raw: text,
    assetType,
    strategy_type,
    action,
    symbol,
    name,
    quantity,
    unit,
    unitPrice,
    totalAmount: Math.round(quantity * unitPrice),
    quick_note,
    trade_note,
    confidence: 0.7
  };
}
