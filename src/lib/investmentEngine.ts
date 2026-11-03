import type {
  AssetClass,
  DataFreshness,
  InvestmentTransaction
} from '../types';

// ============================================================================
// 1. VIETNAMESE ASSET CATALOG (Verified Presets)
// ============================================================================

export interface AssetCatalogItem {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  exchangeOrManager: string;
  referencePrice: number;
  unit: string;
  freshness: DataFreshness;
}

export const VIETNAMESE_ASSET_CATALOG: AssetCatalogItem[] = [
  // HOSE & HNX Bluechips
  { symbol: 'FPT', name: 'Công ty Cổ phần FPT', assetClass: 'stock', exchangeOrManager: 'HOSE', referencePrice: 138000, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VCB', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', assetClass: 'stock', exchangeOrManager: 'HOSE', referencePrice: 94500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'HPG', name: 'Tập đoàn Hòa Phát', assetClass: 'stock', exchangeOrManager: 'HOSE', referencePrice: 26500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'TCB', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam', assetClass: 'stock', exchangeOrManager: 'HOSE', referencePrice: 24200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'SSI', name: 'Công ty Cổ phần Chứng khoán SSI', assetClass: 'stock', exchangeOrManager: 'HOSE', referencePrice: 31200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'MWG', name: 'Công ty Cổ phần Thế Giới Di Động', assetClass: 'stock', exchangeOrManager: 'HOSE', referencePrice: 62500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'MBB', name: 'Ngân hàng TMCP Quân Đội', assetClass: 'stock', exchangeOrManager: 'HOSE', referencePrice: 23800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VNM', name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)', assetClass: 'stock', exchangeOrManager: 'HOSE', referencePrice: 66000, unit: 'cổ phiếu', freshness: 'realtime' },

  // Mutual Funds & ETFs
  { symbol: 'DCDS', name: 'Quỹ Đầu tư Chứng khoán Năng động DC (Dragon Capital)', assetClass: 'fund', exchangeOrManager: 'Dragon Capital', referencePrice: 84200, unit: 'CCQ', freshness: 'nav_published' },
  { symbol: 'VESAF', name: 'Quỹ Đầu tư Cổ phiếu Tiếp cận Thị trường VinaCapital', assetClass: 'fund', exchangeOrManager: 'VinaCapital', referencePrice: 32600, unit: 'CCQ', freshness: 'nav_published' },
  { symbol: 'SSISCA', name: 'Quỹ Đầu tư Lợi thế Cạnh tranh Bền vững SSI', assetClass: 'fund', exchangeOrManager: 'SSIAM', referencePrice: 41800, unit: 'CCQ', freshness: 'nav_published' },
  { symbol: 'E1VFVN30', name: 'Quỹ ETF VFMVN30', assetClass: 'etf', exchangeOrManager: 'Dragon Capital', referencePrice: 24800, unit: 'chứng chỉ', freshness: 'realtime' },
  { symbol: 'FUEVFVND', name: 'Quỹ ETF KIM Growth VNFIN LEAD', assetClass: 'etf', exchangeOrManager: 'KIM Vietnam', referencePrice: 32900, unit: 'chứng chỉ', freshness: 'realtime' },

  // Gold & Precious Metals
  { symbol: 'SJC', name: 'Vàng miếng SJC 999.9', assetClass: 'gold', exchangeOrManager: 'SJC Vietnam', referencePrice: 89000000, unit: 'lượng', freshness: 'eod' },
  { symbol: 'Nhẫn 9999', name: 'Vàng nhẫn trơn 999.9 PNJ / Doji', assetClass: 'gold', exchangeOrManager: 'PNJ/Doji', referencePrice: 87500000, unit: 'lượng', freshness: 'eod' },

  // Deposits & Fixed Income
  { symbol: 'BIDV-SAVING', name: 'Tiền gửi Tiết kiệm BIDV 12 tháng (5.2%/năm)', assetClass: 'savings', exchangeOrManager: 'BIDV', referencePrice: 10000000, unit: 'sổ', freshness: 'manual' },
  { symbol: 'VCB-SAVING', name: 'Tiền gửi Tiết kiệm Vietcombank 6 tháng (4.8%/năm)', assetClass: 'savings', exchangeOrManager: 'Vietcombank', referencePrice: 20000000, unit: 'sổ', freshness: 'manual' },
  { symbol: 'TCBS-IBOND', name: 'Trái phiếu Doanh nghiệp Masan Techcom iBond (8.5%/năm)', assetClass: 'bond', exchangeOrManager: 'TCBS', referencePrice: 100000, unit: 'trái phiếu', freshness: 'manual' },

  // Digital Assets
  { symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', exchangeOrManager: 'Binance', referencePrice: 2350000000, unit: 'BTC', freshness: 'realtime' },
  { symbol: 'ETH', name: 'Ethereum', assetClass: 'crypto', exchangeOrManager: 'Binance', referencePrice: 78500000, unit: 'ETH', freshness: 'realtime' }
];

// ============================================================================
// 2. WEIGHTED AVERAGE COST & LEDGER TRANSACTION EXECUTION
// ============================================================================

/**
 * Calculates new Weighted Average Cost Basis after a BUY order
 * Formula: ((OldQty * OldCost) + (BuyQty * BuyPrice) + BuyFee) / (OldQty + BuyQty)
 */
export function calculateWeightedAverageBuy(
  existingQty: number,
  existingTotalCost: number,
  buyQty: number,
  buyPrice: number,
  buyFee: number = 0
): { newQuantity: number; newTotalCostBasis: number; newAveragePrice: number } {
  const newQuantity = existingQty + buyQty;
  const newTotalCostBasis = Math.round(existingTotalCost + (buyQty * buyPrice) + buyFee);
  const newAveragePrice = newQuantity > 0 ? Math.round(newTotalCostBasis / newQuantity) : 0;
  return { newQuantity, newTotalCostBasis, newAveragePrice };
}

/**
 * Executes a SELL / REDEEM order:
 * Calculates Realized P/L and remaining cost basis
 * Vietnamese Securities Tax: 0.1% on gross selling value
 */
export function calculateSellOrder(
  existingQty: number,
  existingTotalCost: number,
  sellQty: number,
  sellPrice: number,
  fee: number = 0,
  taxRate: number = 0.001 // 0.1% default
): {
  remainingQty: number;
  remainingCostBasis: number;
  grossAmount: number;
  taxAmount: number;
  netProceeds: number;
  realizedPnL: number;
  realizedPnLPercent: number;
} {
  const averageUnitCost = existingQty > 0 ? existingTotalCost / existingQty : 0;
  const soldCostBasis = Math.round(sellQty * averageUnitCost);

  const grossAmount = Math.round(sellQty * sellPrice);
  const taxAmount = Math.round(grossAmount * taxRate);
  const netProceeds = grossAmount - fee - taxAmount;

  const realizedPnL = netProceeds - soldCostBasis;
  const realizedPnLPercent = soldCostBasis > 0 ? (realizedPnL / soldCostBasis) * 100 : 0;

  const remainingQty = Math.max(0, existingQty - sellQty);
  const remainingCostBasis = remainingQty > 0 ? Math.round(existingTotalCost - soldCostBasis) : 0;

  return {
    remainingQty,
    remainingCostBasis,
    grossAmount,
    taxAmount,
    netProceeds,
    realizedPnL,
    realizedPnLPercent
  };
}

// ============================================================================
// 3. SL/TP (STOP LOSS & TAKE PROFIT) RISK ENGINE
// ============================================================================

export interface SLTPMetrics {
  entryPrice: number;
  currentPrice: number;
  targetTakeProfit?: number;
  targetStopLoss?: number;
  riskRewardRatio?: number;
  breakevenPrice: number;
  tpDistancePercent?: number; // % to TP
  slDistancePercent?: number; // % to SL
  status: 'safe' | 'near_tp' | 'near_sl' | 'tp_hit' | 'sl_hit' | 'no_plan';
  statusLabel: string;
  statusColor: string;
}

export function calculateSLTPMetrics(
  entryPrice: number,
  currentPrice: number,
  targetTakeProfit?: number,
  targetStopLoss?: number,
  roundTripTaxFeeRate: number = 0.0035 // ~0.35% buy + sell fee & 0.1% tax
): SLTPMetrics {
  const breakevenPrice = Math.round(entryPrice * (1 + roundTripTaxFeeRate));

  if (!targetTakeProfit && !targetStopLoss) {
    return {
      entryPrice,
      currentPrice,
      breakevenPrice,
      status: 'no_plan',
      statusLabel: 'Chưa đặt kế hoạch',
      statusColor: '#64748b'
    };
  }

  let riskRewardRatio: number | undefined;
  if (targetTakeProfit && targetStopLoss && targetTakeProfit > entryPrice && entryPrice > targetStopLoss) {
    const potentialGain = targetTakeProfit - entryPrice;
    const potentialRisk = entryPrice - targetStopLoss;
    riskRewardRatio = potentialRisk > 0 ? Math.round((potentialGain / potentialRisk) * 100) / 100 : undefined;
  }

  let tpDistancePercent: number | undefined;
  if (targetTakeProfit && targetTakeProfit > 0) {
    tpDistancePercent = Math.round(((targetTakeProfit - currentPrice) / currentPrice) * 1000) / 10;
  }

  let slDistancePercent: number | undefined;
  if (targetStopLoss && targetStopLoss > 0) {
    slDistancePercent = Math.round(((currentPrice - targetStopLoss) / currentPrice) * 1000) / 10;
  }

  let status: SLTPMetrics['status'] = 'safe';
  let statusLabel = 'Vị thế an toàn';
  let statusColor = '#10b981';

  if (targetTakeProfit && currentPrice >= targetTakeProfit) {
    status = 'tp_hit';
    statusLabel = 'Đạt mục tiêu Chốt lời (TP Hit)!';
    statusColor = '#10b981';
  } else if (targetStopLoss && currentPrice <= targetStopLoss) {
    status = 'sl_hit';
    statusLabel = 'Chạm ngưỡng Cắt lỗ (SL Hit)!';
    statusColor = '#ef4444';
  } else if (slDistancePercent !== undefined && slDistancePercent <= 3.0) {
    status = 'near_sl';
    statusLabel = 'Cảnh báo: Tiệm cận Cắt lỗ (<3%)';
    statusColor = '#f59e0b';
  } else if (tpDistancePercent !== undefined && tpDistancePercent <= 3.0 && tpDistancePercent > 0) {
    status = 'near_tp';
    statusLabel = 'Gần đạt Chốt lời (<3%)';
    statusColor = '#06b6d4';
  }

  return {
    entryPrice,
    currentPrice,
    targetTakeProfit,
    targetStopLoss,
    riskRewardRatio,
    breakevenPrice,
    tpDistancePercent,
    slDistancePercent,
    status,
    statusLabel,
    statusColor
  };
}

/**
 * Creates default seed investment transactions
 */
export function getSeedInvestmentTransactions(_todayStr: string): InvestmentTransaction[] {
  return [
    {
      id: 'tx-inv-1',
      assetId: 'inv-4',
      symbol: 'VCB',
      type: 'BUY',
      date: '2026-10-15',
      quantity: 500,
      unitPrice: 86000,
      totalAmount: 43000000,
      fee: 64500,
      tax: 0,
      note: 'Mua tích lũy dài hạn cổ phiếu VCB'
    },
    {
      id: 'tx-inv-2',
      assetId: 'inv-3',
      symbol: 'SJC',
      type: 'BUY',
      date: '2026-09-02',
      quantity: 2,
      unitPrice: 82500000,
      totalAmount: 165000000,
      fee: 0,
      tax: 0,
      note: 'Mua 2 lượng vàng miếng SJC bảo hiểm lạm phát'
    },
    {
      id: 'tx-inv-3',
      assetId: 'inv-1',
      symbol: 'BTC',
      type: 'BUY',
      date: '2026-08-10',
      quantity: 0.05,
      unitPrice: 1900000000,
      totalAmount: 95000000,
      fee: 95000,
      tax: 0,
      note: 'Mua tích lũy DCA Bitcoin'
    }
  ];
}
