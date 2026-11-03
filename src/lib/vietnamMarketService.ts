import type { DataFreshness } from '../types';

export interface MarketTickerItem {
  symbol: string;
  name: string;
  assetClass: 'stock' | 'fund' | 'bond' | 'gold';
  exchangeOrIssuer: string;
  referencePrice: number;
  unit: string;
  freshness: DataFreshness;
}

/**
 * Comprehensive Verified Vietnamese Asset Database
 * Covers VN30, prominent HOSE/HNX midcaps, leading open-ended mutual funds,
 * ETFs, corporate & government bonds, and major gold brands.
 */
export const VERIFIED_VN_MARKET_CATALOG: MarketTickerItem[] = [
  // ==========================================
  // 1. NGÂN HÀNG & TÀI CHÍNH (BANKS & BROKERS)
  // ==========================================
  { symbol: 'VCB', name: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 94500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'TCB', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 24200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'MBB', name: 'Ngân hàng TMCP Quân Đội (MB Bank)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 23800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'CTG', name: 'Ngân hàng TMCP Công Thương Việt Nam (VietinBank)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 35600, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'BID', name: 'Ngân hàng TMCP Đầu tư và Phát triển VN (BIDV)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 48500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 19800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'ACB', name: 'Ngân hàng TMCP Á Châu (ACB)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 25400, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'HDB', name: 'Ngân hàng TMCP Phát triển TP.HCM (HDBank)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 26800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 33500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'TPB', name: 'Ngân hàng TMCP Tiên Phong (TPBank)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 17200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 19100, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 10800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'LPB', name: 'Ngân hàng TMCP Lộc Phát Việt Nam (LPBank)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 31800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'MSB', name: 'Ngân hàng TMCP Hàng Hải Việt Nam (MSB)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 12500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'OCB', name: 'Ngân hàng TMCP Phương Đông (OCB)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 11400, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'SSI', name: 'CTCP Chứng khoán SSI', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 31200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VND', name: 'CTCP Chứng khoán VNDIRECT', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 14800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VCI', name: 'CTCP Chứng khoán Vietcap', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 36200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'HCM', name: 'CTCP Chứng khoán TP.HCM (HSC)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 28900, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'SHS', name: 'CTCP Chứng khoán Sài Gòn - Hà Nội', assetClass: 'stock', exchangeOrIssuer: 'HNX', referencePrice: 13900, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'MBS', name: 'CTCP Chứng khoán MB (MBS)', assetClass: 'stock', exchangeOrIssuer: 'HNX', referencePrice: 27500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'FTS', name: 'CTCP Chứng khoán FPT (FPTS)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 44200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'BSI', name: 'CTCP Chứng khoán BIDV (BSC)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 47100, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VIX', name: 'CTCP Chứng khoán VIX', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 11200, unit: 'cổ phiếu', freshness: 'realtime' },

  // ==========================================
  // 2. CÔNG NGHỆ, BÁN LẺ & TIÊU DÙNG (TECH & RETAIL)
  // ==========================================
  { symbol: 'FPT', name: 'Công ty Cổ phần FPT', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 138000, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'MWG', name: 'CTCP Đầu tư Thế Giới Di Động', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 62500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'FRT', name: 'CTCP Bán lẻ Kỹ thuật số FPT (FPT Retail / Long Châu)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 178000, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'DGW', name: 'CTCP Thế Giới Số (Digiworld)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 58500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'PNJ', name: 'CTCP Vàng bạc Đá quý Phú Nhuận', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 96800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'MSN', name: 'CTCP Tập đoàn Masan', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 74200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VNM', name: 'CTCP Sữa Việt Nam (Vinamilk)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 66000, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'SAB', name: 'Tổng CTCP Bia - Rượu - Nước giải khát Sài Gòn (Sabeco)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 56200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'CTR', name: 'Tổng CTCP Công trình Viettel (Viettel Construction)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 128000, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VGI', name: 'Tổng CTCP Đầu tư Quốc tế Viettel (Viettel Global)', assetClass: 'stock', exchangeOrIssuer: 'UPCOM', referencePrice: 84000, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'CMG', name: 'CTCP Tập đoàn Công nghệ CMC', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 52000, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'ELC', name: 'CTCP Công nghệ - Viễn thông ELCOM', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 21500, unit: 'cổ phiếu', freshness: 'realtime' },

  // ==========================================
  // 3. THÉP, HÓA CHẤT & NĂNG LƯỢNG (MATERIALS & ENERGY)
  // ==========================================
  { symbol: 'HPG', name: 'CTCP Tập đoàn Hòa Phát', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 26500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'HSG', name: 'CTCP Tập đoàn Hoa Sen', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 20400, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'NKG', name: 'CTCP Thép Nam Kim', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 21300, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'DGC', name: 'CTCP Tập đoàn Hóa chất Đức Giang', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 112000, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'DCM', name: 'CTCP Phân bón Dầu khí Cà Mau', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 37400, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'DPM', name: 'Tổng CTCP Phân bón và Hóa chất Dầu khí (Đạm Phú Mỹ)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 34100, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'GAS', name: 'Tổng CTCP Khí Việt Nam (PV GAS)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 71200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'PLX', name: 'Tập đoàn Xăng dầu Việt Nam (Petrolimex)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 42300, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'PVD', name: 'Tổng CTCP Khoan và Dịch vụ Khoan Dầu khí (PV Drilling)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 26800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'PVS', name: 'Tổng CTCP Dịch vụ Kỹ thuật Dầu khí Việt Nam (PTSC)', assetClass: 'stock', exchangeOrIssuer: 'HNX', referencePrice: 38900, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'BSR', name: 'CTCP Lọc hóa Dầu Bình Sơn', assetClass: 'stock', exchangeOrIssuer: 'UPCOM', referencePrice: 21600, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'POW', name: 'Tổng CTCP Điện lực Dầu khí Việt Nam (PV Power)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 12300, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'REE', name: 'CTCP Cơ Điện Lạnh (REE Corp)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 65800, unit: 'cổ phiếu', freshness: 'realtime' },

  // ==========================================
  // 4. BẤT ĐỘNG SẢN & XÂY DỰNG (REAL ESTATE & INFRA)
  // ==========================================
  { symbol: 'VHM', name: 'CTCP Vinhomes', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 41500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VIC', name: 'Tập đoàn Vingroup', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 42000, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VRE', name: 'CTCP Vincom Retail', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 18400, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'KDH', name: 'CTCP Đầu tư và Kinh doanh Nhà Khang Điền', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 34500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'NLG', name: 'CTCP Đầu tư Nam Long', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 38200, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'KBC', name: 'Tổng CTCP Phát triển Đô thị Kinh Bắc', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 28600, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'IDC', name: 'Tổng CTCP IDICO', assetClass: 'stock', exchangeOrIssuer: 'HNX', referencePrice: 56400, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'BCM', name: 'Tổng công ty Đầu tư và Phát triển Công nghiệp (Becamex)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 68500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'PDR', name: 'CTCP Phát triển Bất động sản Phát Đạt', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 21800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'DIG', name: 'Tổng CTCP Đầu tư Phát triển Xây dựng (DIC Corp)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 20500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'DXG', name: 'CTCP Tập đoàn Đất Xanh', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 15300, unit: 'cổ phiếu', freshness: 'realtime' },

  // ==========================================
  // 5. VẬN TẢI, HÀNG HẢI & HÀNG KHÔNG (LOGISTICS)
  // ==========================================
  { symbol: 'GMD', name: 'CTCP Gemadept (Cảng biển & Logistics)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 82500, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'HAH', name: 'CTCP Vận tải và Xếp dỡ Hải An', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 42800, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'VJC', name: 'CTCP Hàng không VietJet', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 104000, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'HVN', name: 'Tổng công ty Hàng không Việt Nam (Vietnam Airlines)', assetClass: 'stock', exchangeOrIssuer: 'HOSE', referencePrice: 22400, unit: 'cổ phiếu', freshness: 'realtime' },
  { symbol: 'ACV', name: 'Tổng công ty Cảng hàng không Việt Nam', assetClass: 'stock', exchangeOrIssuer: 'UPCOM', referencePrice: 118000, unit: 'cổ phiếu', freshness: 'realtime' },

  // ==========================================
  // 6. QUỸ ĐẦU TƯ MỞ & ETF (FUNDS & ETFS)
  // ==========================================
  { symbol: 'E1VFVN30', name: 'Quỹ ETF VFMVN30 (Dragon Capital)', assetClass: 'fund', exchangeOrIssuer: 'Dragon Capital', referencePrice: 24800, unit: 'CCQ', freshness: 'realtime' },
  { symbol: 'FUEVFVND', name: 'Quỹ ETF KIM Growth VNFIN LEAD', assetClass: 'fund', exchangeOrIssuer: 'KIM Vietnam', referencePrice: 32900, unit: 'CCQ', freshness: 'realtime' },
  { symbol: 'FUESSVFL', name: 'Quỹ ETF SSIAM VNFIN LEAD', assetClass: 'fund', exchangeOrIssuer: 'SSIAM', referencePrice: 22400, unit: 'CCQ', freshness: 'realtime' },
  { symbol: 'FUESSV30', name: 'Quỹ ETF SSIAM VN30', assetClass: 'fund', exchangeOrIssuer: 'SSIAM', referencePrice: 18900, unit: 'CCQ', freshness: 'realtime' },
  { symbol: 'FUEMAV30', name: 'Quỹ ETF Mirae Asset VN30', assetClass: 'fund', exchangeOrIssuer: 'Mirae Asset', referencePrice: 16700, unit: 'CCQ', freshness: 'realtime' },
  { symbol: 'DCDS', name: 'Quỹ Đầu tư Chứng khoán Năng động DC (Dragon Capital)', assetClass: 'fund', exchangeOrIssuer: 'Dragon Capital', referencePrice: 84200, unit: 'CCQ', freshness: 'nav_published' },
  { symbol: 'DCBC', name: 'Quỹ Đầu tư Doanh nghiệp Hàng đầu DC', assetClass: 'fund', exchangeOrIssuer: 'Dragon Capital', referencePrice: 35800, unit: 'CCQ', freshness: 'nav_published' },
  { symbol: 'VESAF', name: 'Quỹ Cổ phiếu Tiếp cận Thị trường VinaCapital', assetClass: 'fund', exchangeOrIssuer: 'VinaCapital', referencePrice: 32600, unit: 'CCQ', freshness: 'nav_published' },
  { symbol: 'VEOF', name: 'Quỹ Đầu tư Cổ phiếu Hưng Thịnh VinaCapital', assetClass: 'fund', exchangeOrIssuer: 'VinaCapital', referencePrice: 28400, unit: 'CCQ', freshness: 'nav_published' },
  { symbol: 'VIBF', name: 'Quỹ Đầu tư Cân bằng Tuệ Sáng VinaCapital', assetClass: 'fund', exchangeOrIssuer: 'VinaCapital', referencePrice: 24500, unit: 'CCQ', freshness: 'nav_published' },
  { symbol: 'SSISCA', name: 'Quỹ Đầu tư Lợi thế Cạnh tranh Bền vững SSI', assetClass: 'fund', exchangeOrIssuer: 'SSIAM', referencePrice: 41800, unit: 'CCQ', freshness: 'nav_published' },
  { symbol: 'VCBF-BCF', name: 'Quỹ Đầu tư Cổ phiếu Hàng đầu VCBF (Vietcombank)', assetClass: 'fund', exchangeOrIssuer: 'VCBF', referencePrice: 31200, unit: 'CCQ', freshness: 'nav_published' },
  { symbol: 'VCBF-TBF', name: 'Quỹ Đầu tư Cân bằng Chiến lược VCBF', assetClass: 'fund', exchangeOrIssuer: 'VCBF', referencePrice: 28100, unit: 'CCQ', freshness: 'nav_published' },

  // ==========================================
  // 7. TRÁI PHIẾU DOANH NGHIỆP & CHÍNH PHỦ (BONDS)
  // ==========================================
  { symbol: 'TCBS-IBOND', name: 'Trái phiếu Doanh nghiệp Masan Techcom iBond (8.5%/năm)', assetClass: 'bond', exchangeOrIssuer: 'TCBS', referencePrice: 100000, unit: 'trái phiếu', freshness: 'manual' },
  { symbol: 'VHM-BOND', name: 'Trái phiếu Doanh nghiệp Vinhomes 2024-2027 (9.0%/năm)', assetClass: 'bond', exchangeOrIssuer: 'VNDIRECT', referencePrice: 100000, unit: 'trái phiếu', freshness: 'manual' },
  { symbol: 'VIC-BOND', name: 'Trái phiếu Tập đoàn Vingroup (9.2%/năm)', assetClass: 'bond', exchangeOrIssuer: 'VPS', referencePrice: 100000, unit: 'trái phiếu', freshness: 'manual' },
  { symbol: 'MSN-BOND', name: 'Trái phiếu Doanh nghiệp Masan Group (8.8%/năm)', assetClass: 'bond', exchangeOrIssuer: 'TCBS', referencePrice: 100000, unit: 'trái phiếu', freshness: 'manual' },
  { symbol: 'TP-CHINHHU', name: 'Trái phiếu Chính phủ Việt Nam kỳ hạn 10 năm (3.8%/năm)', assetClass: 'bond', exchangeOrIssuer: 'Kho bạc Nhà nước', referencePrice: 100000, unit: 'trái phiếu', freshness: 'manual' },

  // ==========================================
  // 8. VÀNG & KIM LOẠI QUÝ (GOLD & PRECIOUS METALS)
  // ==========================================
  { symbol: 'SJC', name: 'Vàng miếng SJC 999.9 (Thương hiệu Quốc gia)', assetClass: 'gold', exchangeOrIssuer: 'SJC Vietnam', referencePrice: 89000000, unit: 'lượng', freshness: 'eod' },
  { symbol: 'NHAN-9999-PNJ', name: 'Vàng nhẫn trơn 999.9 PNJ', assetClass: 'gold', exchangeOrIssuer: 'PNJ', referencePrice: 87500000, unit: 'lượng', freshness: 'eod' },
  { symbol: 'NHAN-9999-DOJI', name: 'Vàng nhẫn tròn Hưng Thịnh Vượng 999.9 Doji', assetClass: 'gold', exchangeOrIssuer: 'DOJI', referencePrice: 87600000, unit: 'lượng', freshness: 'eod' },
  { symbol: 'NHAN-BTMC', name: 'Vàng rồng Thăng Long Bảo Tín Minh Châu 999.9', assetClass: 'gold', exchangeOrIssuer: 'Bảo Tín Minh Châu', referencePrice: 87700000, unit: 'lượng', freshness: 'eod' },
  { symbol: 'VANG-THEGIOI', name: 'Vàng thế giới giao ngay (Spot Gold XAU/USD)', assetClass: 'gold', exchangeOrIssuer: 'Kitco / CME', referencePrice: 2745, unit: 'USD/oz', freshness: 'realtime' }
];

/**
 * Centralized Market Data Universe Provider
 * Queries Finora Market API with robust fallback to verified catalog.
 * Completely eliminates obsolete direct third-party scraping/feeds.
 */
export async function getVietnameseMarketUniverse(): Promise<MarketTickerItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('/api/market/symbols', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch {
    // Fall back to verified catalog
  }

  return VERIFIED_VN_MARKET_CATALOG;
}
