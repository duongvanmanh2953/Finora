import type { Money } from '../types';

export type UnifiedAssetType = 'STOCK_VN' | 'FUND_VN' | 'GOLD_VN' | 'SAVINGS_VN' | 'BOND_VN';

export type StrategyType = 'DCA' | 'TRADE';

export type GoldUnit = 'luong' | 'chi';

export interface AssetHolding {
  id: string;
  symbol: string;
  name: string;
  assetType: UnifiedAssetType;
  strategy_type: StrategyType;
  quantity: number;
  unit: string; // 'cổ phiếu' | 'CCQ' | 'lượng' | 'chỉ' | 'sổ' | 'trái phiếu'
  totalCostBasis: Money;
  currentUnitPrice: Money;
  currentValue: Money;
  unrealizedPnL: Money;
  unrealizedPnLPercent: number;

  // For SAVINGS_VN & BOND_VN
  annualYieldRate?: number; // % lãi suất/năm (vd: 5.8)
  startDate?: string; // YYYY-MM-DD
  maturityDate?: string; // YYYY-MM-DD
  termMonths?: number; // Kỳ hạn (1, 3, 6, 12, 24...)
  accruedInterest?: Money; // Tiền lãi tự động tính đến ngày hôm nay
  bankOrIssuer?: string; // Tên ngân hàng hoặc tổ chức phát hành

  // For TRADE
  targetTakeProfit?: Money;
  targetStopLoss?: Money;
  trade_note?: string; // Lý do mua, kế hoạch lướt sóng

  // For DCA
  dcaTargetAmount?: Money;
  dcaProgressPercent?: number;

  quick_note?: string;
  accountId?: string;
  updatedAt: string;
  freshness?: 'realtime' | 'delayed' | 'eod' | 'nav_published' | 'manual';
}

export interface UnifiedInvestmentTransaction {
  id: string;
  assetId?: string;
  symbol: string;
  name?: string;
  assetType: UnifiedAssetType;
  strategy_type: StrategyType;
  type: 'BUY' | 'SELL' | 'DEPOSIT_SAVINGS' | 'WITHDRAW_SAVINGS' | 'INTEREST_PAYOUT';
  date: string;
  quantity: number;
  unitPrice: Money;
  totalAmount: Money;
  fee?: Money;
  tax?: Money;
  quick_note?: string;
  trade_note?: string;
  accountId?: string;
}

export interface UserMcpConfig {
  enabled: boolean;
  mcpServerUrl?: string; // e.g. https://mcp.finlens.vn/mcp
  brokerProvider?: 'SSI' | 'DNSE' | 'TCBS' | 'VPS' | 'CUSTOM_MCP';
  brokerApiKey?: string;
  brokerApiSecret?: string;
  readOnlyMode: boolean; // Strictly true for zero mutation
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  lastSyncedAt?: string;
  errorMessage?: string;
}

export interface GoldPriceItem {
  type: 'SJC' | 'NHAN_9999';
  brand: string;
  buyPrice: number; // Giá tiệm mua vào (dùng để định giá danh mục)
  sellPrice: number; // Giá bán ra
  unit: 'lượng' | 'chỉ';
  updatedAt: string;
}

export interface BankRateBenchmark {
  bank: string;
  shortName: string;
  type: 'big4' | 'commercial';
  rates: {
    term1M: number;
    term3M: number;
    term6M: number;
    term12M: number;
    term24M: number;
  };
}
