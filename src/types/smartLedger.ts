/**
 * 4 Mức độ rủi ro tài sản chuẩn Fintech
 */
export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Mức độ thanh khoản
 */
export type LiquidityLevel = 'IMMEDIATE' | 'T_PLUS_2' | 'TERM' | 'ILLIQUID';

/**
 * 14+ Kênh danh mục đầu tư & tài sản
 */
export type WealthAssetCategory =
  | 'CASH_EQUIVALENT'     // Tiền mặt / Tiền gửi thanh toán
  | 'SAVINGS_TERM'        // Tiết kiệm kỳ hạn ngân hàng
  | 'BOND'                // Trái phiếu DN / CP
  | 'STOCK_VN'            // Cổ phiếu Việt Nam (HOSE/HNX/UPCOM)
  | 'STOCK_INTL'          // Cổ phiếu quốc tế
  | 'FUND_OPEN'           // Chứng chỉ quỹ mở (DCDS, VESAF...)
  | 'ETF'                 // Quỹ hoán đổi danh mục
  | 'GOLD_PHYSICAL'       // Vàng vật chất (SJC, Nhẫn 9999)
  | 'GOLD_ACCOUNT'        // Vàng tài khoản
  | 'REAL_ESTATE'         // Bất động sản
  | 'BUSINESS_EQUITY'     // Góp vốn kinh doanh / Cổ phần tư nhân
  | 'P2P_LENDING'         // Cho vay cá nhân / P2P
  | 'CRYPTO'              // Tài sản số
  | 'INSURANCE_CASH_VAL'  // Bảo hiểm có giá trị hoàn lại
  | 'OTHER';              // Tài sản khác

export type InvestmentStatus = 'UNRECOVERED' | 'PARTIALLY_RECOVERED' | 'RECOVERED' | 'AT_RISK_LOSS';

/**
 * Lịch sử thu hồi vốn từng đợt
 */
export interface CapitalRecoveryRecord {
  id: string;
  date: string;
  amount: number; // Số tiền thu hồi đợt này
  realizedPnL?: number; // Lãi / lỗ tương ứng ghi nhận vào ví
  targetAccountId?: string; // Ví tiền mặt nhận lại tiền
  note?: string;
}

/**
 * Khoản đầu tư / Vị thế tài sản trong Sổ cái Thông minh
 */
export interface InvestmentNote {
  id: string;
  title: string;
  category: WealthAssetCategory;
  symbol?: string; // Mã cổ phiếu / quỹ / thương hiệu vàng (nếu có)
  initialCapital: number; // Tổng vốn gốc ban đầu bỏ ra (VND)
  additionalCapitalContributed?: number; // Vốn nộp thêm sau đó
  recoveredAmount: number; // Tổng vốn đã thu hồi về ví
  currentEstimatedValue: number; // Giá trị thị trường ước tính hiện tại
  
  // 2 thuộc tính phân loại độc lập quan trọng
  risk_level: RiskLevel;
  include_in_net_worth: boolean; // Bật/tắt tính vào Tổng tài sản

  liquidity_level?: LiquidityLevel;
  status: InvestmentStatus;
  
  // Dữ liệu mở rộng theo loại tài sản
  startDate: string;
  maturityDate?: string;
  expectedAnnualReturnPct: number; // % Lãi suất/Lợi nhuận kỳ vọng năm
  
  // Thuộc tính riêng cho BĐS, Góp vốn, Vàng, Cổ phiếu
  quantity?: number;
  unitPrice?: number;
  unit?: string; // 'cổ phiếu', 'chỉ', 'lượng', 'm2', '%'
  rentalYieldMonthly?: number; // Tiền thuê BĐS hàng tháng
  ownershipPercentage?: number; // % Tỷ lệ sở hữu doanh nghiệp
  locationOrAddress?: string; // Địa chỉ BĐS
  brokerOrStorageLocation?: string; // Nơi lưu trữ vàng, CTCK (SSI, VPS, Két...)
  
  quickNote: string;
  recoveries?: CapitalRecoveryRecord[];
  sourceAccountId?: string; // Tài khoản nguồn trích tiền ban đầu
  updatedAt?: string;
}

/**
 * Thống kê Tổng tài sản đa chiều (Net Worth Analysis)
 */
export interface NetWorthSummary {
  cashBalance: number;              // Tiền thực có (ví, ngân hàng)
  totalInvestmentValue: number;      // Tổng giá trị tài sản đầu tư hiện tại
  unrecoveredCapital: number;        // Tổng vốn đầu tư chưa thu hồi
  totalInvestedCapital: number;      // Tổng vốn gốc đã bỏ ra từ trước đến nay
  totalRecoveredCapital: number;     // Tổng vốn đã thu hồi về ví
  unrealizedPnL: number;             // Lãi/lỗ tạm tính của các khoản đầu tư
  totalLiabilities: number;          // Nợ phải trả

  // 2 Chế độ hiển thị
  fullNetWorth: number;              // Chế độ 1: Toàn bộ tài sản
  conservativeNetWorth: number;      // Chế độ 2: Tài sản thận trọng (loại trừ HIGH risk & khoản ẩn/nguy cơ)
  headlineNetWorth: number;          // Giá trị đang được chọn hiển thị
  isSafeModeActive: boolean;

  // Cơ cấu phân bổ rủi ro 4 cấp (% và VND)
  riskBreakdown: {
    safe: { amount: number; percentage: number };
    low: { amount: number; percentage: number };
    medium: { amount: number; percentage: number };
    high: { amount: number; percentage: number };
  };

  // Thanh khoản cao
  highLiquidityRatio: number; // % tài sản có thể rút dùng ngay (Immediate + T+2)

  // Đếm trạng thái
  activeCount: number;
  hiddenCount: number;
  recoveredCount: number;
  atRiskCount: number;
}

/**
 * Điểm dữ liệu biểu đồ dự phóng tài chính tương lai
 */
export interface WealthProjectionPoint {
  milestoneKey: string;
  milestoneLabel: string;
  months: number;
  cumulativeSelfSaved: number;      // Vốn người dùng tự tích lũy tiết kiệm hàng tháng
  
  // 3 Kịch bản mô phỏng
  conservativeValue: number;        // Kịch bản thận trọng (lợi suất an toàn, lạm phát cao)
  baseValue: number;                // Kịch bản cơ sở (theo lãi suất kỳ vọng của danh mục)
  optimisticValue: number;          // Kịch bản tích cực (tăng trưởng tốt)
  
  purchasingPowerAdjusted: number;  // Sức mua sau khi trừ lạm phát
}
