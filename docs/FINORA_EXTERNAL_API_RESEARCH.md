# FINORA — EXTERNAL FINANCIAL API RESEARCH & PROVIDER COMPARISON
## Comprehensive Market Data, Mutual Fund NAV, Asset Logos & Payment Gateways

- **Document ID:** `docs/FINORA_EXTERNAL_API_RESEARCH.md`
- **Revision:** 2.0.0
- **Scope:** Thị trường Chứng khoán Việt Nam (HOSE, HNX, UPCOM), Quỹ mở, ETF, Nguồn Logo định chế tài chính, Cổng thanh toán SaaS.

---

## 1. TỔNG QUAN NGUYÊN TẮC TÍCH HỢP DỮ LIỆU THỊ TRƯỜNG

1. **Tuyệt đối tuân thủ pháp lý & bản quyền:** Không cào dữ liệu (web scraping) trái phép hoặc reverse-engineer các endpoint nội bộ không được công bố của bên thứ ba.
2. **Minh bạch nguồn gốc dữ liệu:** Mọi số liệu hiển thị trên Finora đều phải có thông tin nguồn (Source), nhãn cập nhật (Realtime / Delayed / EOD / NAV Date) và dấu thời gian (Timestamp).
3. **Kiến trúc Adapter độc lập:** Toàn bộ logic giao diện và sổ kế toán đầu tư Finora chỉ tương tác với Interface chuẩn hóa nội bộ (`MarketDataProvider`), không phụ thuộc cứng vào bất kỳ bên cung cấp đơn lẻ nào.

---

## 2. KHẢO SÁT & SO SÁNH CÁC NHÀ CUNG CẤP DỮ LIỆU CHỨNG KHOÁN VIỆT NAM

### 2.1. SSI FastConnect API (Công ty Cổ phần Chứng khoán SSI)
- **URL Tài liệu Chính thức:** [https://www.ssi.com.vn/khach-hang-ca-nhan/fastconnect-api](https://www.ssi.com.vn/khach-hang-ca-nhan/fastconnect-api) & [https://iboard.ssi.com.vn](https://iboard.ssi.com.vn)
- **Phương thức kết nối:** RESTful API cho dữ liệu lịch sử và WebSocket Streaming (SignalR / Socket.IO) cho bảng giá thời gian thực.
- **Phạm vi dữ liệu:** Cổ phiếu, ETF, Phái sinh, Chứng quyền (CW) niêm yết trên HOSE, HNX, UPCOM.
- **Trường dữ liệu:** Bảng giá (Priceboard), Sổ lệnh 3 giá (Top 3 Bids/Asks), Giá trần/sàn/tham chiếu, Khối lượng khớp lệnh, Lịch sử nến OHLCV (1m, 5m, 1h, 1D), Chỉ số ngành và thị trường (VN-Index, VN30, HNX-Index).
- **Xác thực:** ConsumerID + Private Key RSA ký chữ ký điện tử cho mỗi yêu cầu.
- **Tần suất & Giới hạn:** Hỗ trợ Streaming thời gian thực; Giới hạn tần suất 30–60 requests/phút đối với REST API.
- **Đánh giá tích hợp:** Cực kỳ ổn định, chính thống, được cấp phép chuẩn mực bởi Ủy ban Chứng khoán Nhà nước (UBCKNN). Phù hợp làm nhà cung cấp chính thống cho người dùng có tài khoản mở tại SSI hoặc đối tác B2B.

### 2.2. DNSE OpenAPI (Công ty Cổ phần Chứng khoán DNSE)
- **URL Tài liệu Chính thức:** [https://www.dnse.com.vn/open-api](https://www.dnse.com.vn/open-api) & [https://developer.dnse.com.vn](https://developer.dnse.com.vn)
- **Phương thức kết nối:** Modern RESTful API (OpenAPI 3.0) + WebSocket streaming.
- **Phạm vi dữ liệu:** Dữ liệu thị trường toàn diện, giá khớp lệnh trực tiếp, chỉ số chứng khoán, thông tin cơ bản doanh nghiệp và tỷ lệ margin.
- **Xác thực:** API Key / Secret Key, hỗ trợ OAuth2 token cho ứng dụng của bên thứ ba.
- **Tần suất & Giới hạn:** Thân thiện với nhà phát triển, có môi trường Sandbox kiểm thử riêng biệt.
- **Đánh giá tích hợp:** DNSE là một trong những công ty chứng khoán công nghệ tiên phong tại Việt Nam hỗ trợ OpenAPI công khai cho lập trình viên với tài liệu chuẩn Swagger rõ ràng nhất.

### 2.3. TCBS OpenAPI & iWealth (Công ty Cổ phần Chứng khoán Kỹ Thương)
- **URL Tài liệu Chính thức:** [https://tcinvest.tcbs.com.vn](https://tcinvest.tcbs.com.vn)
- **Phạm vi dữ liệu:** Cổ phiếu, Trái phiếu doanh nghiệp (iBond), Quỹ mở (iFund), Chỉ số định giá P/E, P/B, ROE, Beta, Khuyến nghị phân tích kỹ thuật.
- **Đặc điểm:** Thế mạnh lớn về dữ liệu trái phiếu doanh nghiệp bán lẻ và phân tích định giá cơ bản. Phù hợp trích xuất thông tin doanh nghiệp tham chiếu.

### 2.4. Thư viện Mã nguồn mở Vnstock (Tác giả Thịnh Vũ)
- **URL Tài liệu Chính thức:** [https://github.com/thinh-vu/vnstock](https://github.com/thinh-vu/vnstock) & [https://vnstocks.com](https://vnstocks.com)
- **Ngôn ngữ & Giao thức:** Python SDK, có thể đóng gói thành microservice REST API (FastAPI / Node wrapper).
- **Phạm vi dữ liệu:** Toàn bộ cổ phiếu HOSE, HNX, UPCOM, báo cáo tài chính (Bảng cân đối kế toán, Kết quả kinh doanh, Lưu chuyển tiền tệ), hồ sơ doanh nghiệp và dữ liệu quỹ mở.
- **Đánh giá:** Rất phong phú cho phân tích lịch sử và danh mục doanh nghiệp. Tuy nhiên khi triển khai ở cấp độ thương mại SaaS cần đăng ký gói dịch vụ thương mại chính thức (Vnstock Commercial / Pro API) để đảm bảo SLA và bản quyền phát hành lại.

---

## 3. KHẢO SÁT NGUỒN DỮ LIỆU CHỨNG CHỈ QUỸ MỞ (MUTUAL FUNDS) TẠI VIỆT NAM

Quỹ mở tại Việt Nam không giao dịch liên tục từng giây như cổ phiếu mà khớp lệnh theo chu kỳ định giá (thường là hàng ngày vào cuối ngày làm việc hoặc một số ngày cố định trong tuần).

### Các Quỹ mở Cốt lõi cần hỗ trợ:
1. **Dragon Capital Việt Nam (DCVFM):**
   - Quỹ DCDS (Quỹ Đầu tư Chứng khoán Năng động DC).
   - Quỹ DCBC (Quỹ Đầu tư Doanh nghiệp Hàng đầu DC).
   - Quỹ Trái phiếu DCBF.
   - Nguồn công bố NAV: [https://dragoncapital.com.vn](https://dragoncapital.com.vn)
2. **VinaCapital Fund Management:**
   - Quỹ VESAF (Quỹ Đầu tư Cổ phiếu Tiếp cận Thị trường VinaCapital).
   - Quỹ VEOF (Quỹ Đầu tư Cổ phiếu Hưng thịnh VinaCapital).
   - Quỹ VIBF (Quỹ Đầu tư Cân bằng Tuệ sáng VinaCapital).
   - Nguồn công bố NAV: [https://vinacapital.com](https://vinacapital.com)
3. **SSIAM (Công ty TNHH Quản lý Quỹ SSI):**
   - Quỹ SSISCA (Quỹ Đầu tư Lợi thế Cạnh tranh Bền vững SSI).
   - Nguồn công bố NAV: [https://www.ssiam.com.vn](https://www.ssiam.com.vn)
4. **Nền tảng phân phối Quỹ tập trung Fmarket (Công ty CP Fmarket Việt Nam):**
   - Giấy phép phân phối chứng chỉ quỹ của UBCKNN.
   - URL: [https://fmarket.vn](https://fmarket.vn)
   - Tập hợp hơn 40 quỹ mở của Dragon Capital, VinaCapital, SSIAM, Vietcombank Fund (VCBF), Mirae Asset (MAGEF), Baoviet Fund (BVF)...
   - Dữ liệu cung cấp: Lịch sử NAV/CCQ hàng ngày, tỷ suất sinh lời 1 tháng, 3 tháng, 1 năm, 3 năm, biểu phí phát hành và mua lại.

---

## 4. KHẢO SÁT NGUỒN LOGO DOANH NGHIỆP & TÀI SẢN (ASSET LOGOS)

Để giao diện Finora đạt tiêu chuẩn thẩm mỹ cao cấp (theo quy tắc `baoyu-design` và `design-taste-frontend`), logo tài sản không được hiển thị méo mó, mờ vỡ hay dùng ảnh placeholder chung chung:
1. **Bộ biểu tượng Vector Độc quyền (Bespoke In-House SVGs):**
   - Đã được xây dựng trong `src/lib/brandBadges.tsx`: VCB, TCB, MB, VPB, ACB, CTG, BIDV, TPB, STB, MoMo, ZaloPay, VNPay, DCDS, VESAF, SSISCA, SJC.
   - Ưu điểm: Hiển thị tức thì 0ms, không phụ thuộc mạng, tỷ lệ vector hoàn hảo ở cả Light/Dark Mode.
2. **Nguồn tham chiếu bổ trợ khi mở rộng danh mục:**
   - Cổng công bố thông tin Ủy ban Chứng khoán Nhà nước / Sàn HOSE & HNX.
   - API logo doanh nghiệp thương mại có bản quyền (Brandfetch API, Clearbit Logo API) với cơ chế fallback tự động về chữ ký thương hiệu viết tắt (Monogram Badge) dạng hai chữ cái in hoa trang nhã.

---

## 5. MA TRẬN SO SÁNH TỔNG HỢP CÁC NHÀ CUNG CẤP DỮ LIỆU

| Tiêu chí so sánh | SSI FastConnect | DNSE OpenAPI | TCBS OpenAPI | Vnstock API | Fmarket / Công ty Quỹ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phạm vi tài sản** | Cổ phiếu, ETF, CW | Cổ phiếu, Chỉ số | Cổ phiếu, Trái phiếu | Cổ phiếu, Chỉ số, Quỹ | 40+ Quỹ mở, ETF |
| **Cập nhật dữ liệu** | Realtime Streaming | Realtime Streaming | Realtime / EOD | Realtime / EOD | Hàng ngày sau 17:00 |
| **Hỗ trợ WebSocket** | Có (SignalR) | Có (WebSocket) | Một phần | Không (REST only) | Không cần thiết |
| **Dữ liệu lịch sử** | Nến 1m đến 1D (5 năm) | Nến OHLCV đa khung | Nến kỹ thuật, P/E | 10+ năm toàn diện | Lịch sử NAV từ thành lập |
| **Xác thực an toàn** | RSA Key + ConsumerID | API Key + OAuth2 | Token phiên | API Token | Token / Công bố công khai |
| **Môi trường Sandbox** | Có (yêu cầu duyệt) | Có sẵn cho dev | Hạn chế | Có bản Community | N/A |
| **Hỗ trợ đặt lệnh** | Có (Ủy quyền giao dịch) | Có (OpenAPI Trading) | Qua iInvest | Không (Chỉ đọc) | Không (Chỉ đọc) |
| **Chi phí tích hợp** | Miễn phí cho KH SSI | Gói Developer miễn phí | Tích hợp nội bộ | Miễn phí/Pro thương mại | Dữ liệu công bố công khai |
| **Khuyến nghị Finora** | **Nhà cung cấp Cổ phiếu P1** | **Nhà cung cấp Cổ phiếu P1** | **Tham chiếu Trái phiếu P2** | **Dữ liệu Lịch sử & BCTC** | **Nhà cung cấp Quỹ mở P1** |

---

## 6. KHẢO SÁT CỔNG THANH TOÁN SAAS & HÓA ĐƠN ĐIỆN TỬ TẠI VIỆT NAM

### 6.1. Cổng thanh toán trực tuyến
- **payOS ([https://payos.vn](https://payos.vn)):** Cổng thanh toán tạo mã VietQR tự động, hỗ trợ webhook callback thời gian thực khi tiền về tài khoản ngân hàng. Miễn phí giao dịch hoặc phí cực thấp, bảo mật chữ ký HMAC SHA-256. Rất lý tưởng cho mô hình nâng cấp Finora Pro theo chu kỳ tháng/năm.
- **MoMo Payment Gateway ([https://business.momo.vn](https://business.momo.vn)):** Cổng thanh toán ví điện tử phổ biến nhất Việt Nam, hỗ trợ quét QR và Recurring Subscription Tokenization.
- **VNPay-QR ([https://vnpay.vn](https://vnpay.vn)):** Độ phủ rộng nhất tại các ứng dụng ngân hàng di động.

### 6.2. Giải pháp Hóa đơn Điện tử (E-Invoice Integration)
- **MISA meInvoice ([https://www.meinvoice.vn](https://www.meinvoice.vn) / [https://open.misa.vn](https://open.misa.vn)):** Nền tảng hóa đơn điện tử hàng đầu tuân thủ Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC của Tổng cục Thuế.
- Cung cấp REST API tạo lập hóa đơn, ký số điện tử tập trung (HSM), gửi mã cơ quan thuế và xuất file XML/PDF có giá trị pháp lý cho khách hàng mua gói Finora Pro.

---

## 7. ĐỀ XUẤT KIẾN TRÚC TRIỂN KHAI CHO FINORA

1. **Giai đoạn P1 (Hiện tại & Cốt lõi):**
   - Xây dựng lớp trừu tượng `MarketDataProvider` với cấu trúc chuẩn: `getQuote(symbol)`, `getHistory(symbol, timeframe)`, `getFundNav(fundCode)`.
   - Cung cấp sẵn cơ chế Local Mock / Verified Fixture Provider cho môi trường phát triển & kiểm thử độc lập mà không làm đứt gãy ứng dụng khi offline.
   - Tích hợp dữ liệu Quỹ mở theo lịch công bố NAV chính thức từ Fmarket / Dragon Capital / VinaCapital.
2. **Giai đoạn P2 (Đồng bộ thời gian thực):**
   - Kết nối DNSE OpenAPI / SSI FastConnect cho bảng giá cổ phiếu Việt Nam có cơ chế đệm dữ liệu (Caching 10 giây trong phiên giao dịch để bảo vệ rate limit).
   - Tích hợp payOS Webhook cho luồng nâng cấp Finora Pro.

