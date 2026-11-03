# FINORA — PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Multi-Asset Wealth Management, Dynamic Payroll, Personal Financial Intelligence & SaaS Administration

- **Product Name:** Finora (Hệ sinh thái Quản lý Tài chính & Tài sản Toàn diện)
- **Version:** 2.0.0
- **Document Status:** Official Architecture Specification
- **Author:** Finora Fintech Product & Architecture Team
- **Default Locale & Currency:** Vietnamese (`vi-VN`) / Vietnamese Đồng (`VND` — `₫`)

---

## 1. TỔNG QUAN SẢN PHẨM & MỤC TIÊU CHIẾN LƯỢC

Finora được định vị từ một ứng dụng ghi chép chi tiêu cá nhân (Expense Tracker) chuyển mình trở thành **Hệ sinh thái Quản lý Tài chính và Tài sản Cá nhân Toàn diện (Personal Finance & Wealth Management Ecosystem)** dành riêng cho người Việt Nam:
1. **Quản lý Tài sản Đầu tư Đa kênh (Multi-Asset Investment):** Theo dõi danh mục cổ phiếu, chứng chỉ quỹ mở, ETF, trái phiếu, vàng, tiền gửi tiết kiệm với định giá thị trường thực (Real Market Valuation).
2. **Quản lý Thu nhập Động & Tiền lương Thực tế (Dynamic Income & Payroll):** Xử lý chính xác các trường hợp lương thử việc 85%, biến động ngày công, làm thêm giờ (OT), thưởng KPI, bảo hiểm bắt buộc (BHXH, BHYT, BHTN) và biểu thuế TNCN 7 bậc lũy tiến.
3. **Trí tuệ Tài chính Cá nhân (Financial Intelligence):** Điểm sức khỏe tài chính (Financial Health Score), số tiền chi tiêu an toàn (Safe-to-Spend), dự báo dòng tiền đa kịch bản (Cashflow Forecasting), phát hiện chi phí định kỳ và hộp đen tài liệu số (Financial Vault).
4. **Hệ thống Quản trị SaaS Độc lập (Finora Admin Console):** Phân tách tuyệt đối giữa dữ liệu cá nhân của người dùng và hệ thống vận hành doanh nghiệp. Admin theo dõi MRR, ARR, người dùng, gói cước Pro, thanh toán payOS/MoMo, hóa đơn điện tử MISA mà không có quyền đọc trộm giao dịch của khách hàng.

---

## 2. USER PERSONAS & HÀNH TRÌNH KHÁCH HÀNG

### Persona 1: Nguyễn Tuấn Anh (29 tuổi, Kỹ sư phần mềm tại Hà Nội)
- **Đặc điểm:** Thu nhập biến đổi (Lương cơ bản + Thưởng dự án + Làm thêm giờ + Thu nhập tự do từ bên ngoài).
- **Danh mục tài sản:** 1 tài khoản Vietcombank, 1 thẻ tín dụng VPBank, danh mục cổ phiếu tại TCBS (TCB, FPT), 2 quỹ mở tại Fmarket (DCDS, VESAF), 2 cây vàng SJC.
- **Nỗi đau:** Các ứng dụng thông thường chỉ nhập được 1 mức lương cố định; không tự động tính thuế TNCN và bảo hiểm; không theo dõi được lãi/lỗ danh mục đầu tư theo giá thị trường; biểu đồ tách rời không thấy được toàn cảnh dòng tiền vào - ra - thặng dư.
- **Mục tiêu trong Finora:** Biết rõ mỗi tháng thực nhận bao nhiêu sau thuế, tự động cập nhật giá cổ phiếu/quỹ để biết tổng tài sản ròng, đặt ngưỡng Cắt lỗ (Stop Loss) / Chốt lời (Take Profit) để bảo vệ vốn.

### Persona 2: Lê Thu Trang (34 tuổi, Trưởng phòng Kinh doanh tại TP. Hồ Chí Minh)
- **Đặc điểm:** Quản lý tài chính gia đình và tiền gửi tiết kiệm nhiều ngân hàng.
- **Mục tiêu:** Tính toán số tiền chi tiêu an toàn từ nay đến cuối tháng (Safe-to-spend), xây dựng quỹ dự phòng 6 tháng chi phí thiết yếu, quản lý các khoản nợ vay mua nhà.

### Persona 3: Trần Hoàng Long (Nhà sáng lập & Quản trị nền tảng Finora SaaS)
- **Mục tiêu:** Điều hành Finora như một sản phẩm thương mại; quản lý doanh thu định kỳ (MRR/ARR), chi phí hạ tầng máy chủ, tích hợp cổng thanh toán payOS/MoMo, xuất hóa đơn điện tử hợp pháp cho người dùng gói Pro; **cam kết bảo mật tuyệt đối không bao giờ vi phạm quyền riêng tư tài chính của người dùng**.

---

## 3. PHÂN HỆ CHI TIẾT & YÊU CẦU NGHIỆP VỤ

### 3.1. Phân hệ Đầu tư Đa Tài sản (Investment Management)

#### User Stories:
- **US-INV-01:** Là một nhà đầu tư, tôi muốn chọn loại tài sản (Cổ phiếu, Quỹ mở, ETF, Trái phiếu, Vàng, Tiền gửi) rồi tìm kiếm mã trong danh mục chuẩn hóa để không phải tự gõ tên doanh nghiệp hay thông tin trùng lặp.
- **US-INV-02:** Là một nhà đầu tư, tôi muốn ghi nhận giao dịch mua/bán kèm phí giao dịch, thuế chuyển nhượng để Finora tính toán chính xác Giá vốn bình quân (Cost Basis) và Lãi/Lỗ thực tế (Realized & Unrealized P/L).
- **US-INV-03:** Là một nhà đầu tư, tôi muốn thiết lập kế hoạch giao dịch với mức Cắt lỗ (Stop Loss) và Chốt lời (Take Profit), hệ thống phải tự động tính tỷ lệ Lợi nhuận/Rủi ro (Risk/Reward Ratio) và giá hòa vốn sau thuế phí.

#### Tiêu chí chấp nhận (Acceptance Criteria):
1. **Danh mục tài sản hỗ trợ:**
   - Cổ phiếu niêm yết (HOSE, HNX, UPCOM): Mã chứng khoán, tên công ty, sàn, giá khớp lệnh, % biến động, khối lượng.
   - Quỹ mở & ETF: Mã quỹ (DCDS, VESAF, SSISCA, E1VFVN30...), công ty quản lý quỹ, giá trị tài sản ròng trên một chứng chỉ quỹ (NAV/CCQ), ngày công bố NAV.
   - Vàng (SJC, Nhẫn 9999): Giá mua/bán theo lượng hoặc chỉ.
   - Tiền gửi tiết kiệm: Kỳ hạn, lãi suất %/năm, phương thức trả lãi (đầu kỳ, cuối kỳ, hàng tháng), ngày đáo hạn.
   - Tài sản tùy chỉnh: Cho phép người dùng nhập giá trị tự định giá định kỳ.
2. **Minh bạch trạng thái dữ liệu (Data Freshness Tagging):**
   - Mọi giá trị thị trường phải hiển thị nhãn: `Thời gian thực (Realtime)`, `Trễ 15 phút (Delayed)`, `Cuối ngày (End-of-day)`, `NAV mới nhất (Published NAV)`, hoặc `Nhập tay (Manual)`.
   - Tuyệt đối không hiển thị giá trong bộ nhớ đệm (cache) cũ mà giả danh là giá trực tiếp.
3. **Cơ chế Cắt lỗ & Chốt lời (SL/TP Engine) với 3 chế độ:**
   - **Chế độ A (Chỉ theo dõi - Tracking Only):** Lưu ngưỡng SL/TP, hiển thị cảnh báo trực quan trên giao diện khi giá tiệm cận.
   - **Chế độ B (Cảnh báo biến động giá - Price Alerts):** Gửi thông báo trình duyệt / mobile khi giá thị trường chạm ngưỡng kích hoạt.
   - **Chế độ C (Lệnh điều kiện công ty chứng khoán - Broker Conditional Orders):** Chỉ khả dụng khi người dùng kết nối OAuth tài khoản chứng khoán được hỗ trợ và có xác thực ký số OTP. Không bao giờ tự ý gửi lệnh ngầm.

---

### 3.2. Phân hệ Quản lý Lương & Thu nhập Động (Dynamic Payroll)

#### User Stories:
- **US-INC-01:** Là một nhân viên, tôi muốn bảng lương phản ánh đúng các biến động tháng (lương thử việc 85%, số ngày công thực tế, nghỉ không lương, tiền thưởng KPI, làm thêm giờ) thay vì chỉ một con số cố định.
- **US-INC-02:** Là một người nộp thuế tại Việt Nam, tôi muốn hệ thống tự tính số tiền đóng bảo hiểm bắt buộc (BHXH, BHYT, BHTN) và thuế TNCN lũy tiến 7 bậc để đối soát với phiếu lương của công ty.

#### Business Rules & Công thức Nghiệp vụ:
1. **Lương thực tế theo ngày công:**
   $$\text{Lương thời gian} = \frac{\text{Lương hợp đồng}}{\text{Ngày công chuẩn trong tháng}} \times \text{Ngày công đi làm thực tế}$$
2. **Làm thêm giờ (Overtime):**
   - Ngày thường: Tối thiểu 150% đơn giá lương ngày làm việc.
   - Ngày nghỉ hàng tuần: Tối thiểu 200%.
   - Ngày lễ, tết, ngày nghỉ có hưởng lương: Tối thiểu 300% (chưa kể tiền lương ngày lễ).
   - Phần tiền làm thêm giờ vượt quá mức lương ngày bình thường được miễn thuế TNCN theo Luật Thuế hiện hành.
3. **Bảo hiểm bắt buộc trích trừ vào lương người lao động (10.5%):**
   - BHXH (Bảo hiểm xã hội): 8%
   - BHYT (Bảo hiểm y tế): 1.5%
   - BHTN (Bảo hiểm thất nghiệp): 1%
   - Áp dụng trần đóng bảo hiểm: BHXH & BHYT tối đa 20 lần mức lương cơ sở; BHTN tối đa 20 lần mức lương tối thiểu vùng.
4. **Biểu thuế TNCN từng phần (Lũy tiến 7 bậc):**
   - Giảm trừ bản thân: 11.000.000 ₫/tháng.
   - Giảm trừ người phụ thuộc: 4.400.000 ₫/người/tháng.
   - Thu nhập tính thuế = Thu nhập chịu thuế - Các khoản đóng bảo hiểm - Các khoản giảm trừ gia cảnh.
   - Bậc 1 (đến 5tr): 5% | Bậc 2 (5-10tr): 10% | Bậc 3 (10-18tr): 15% | Bậc 4 (18-32tr): 20% | Bậc 5 (32-52tr): 25% | Bậc 6 (52-80tr): 30% | Bậc 7 (trên 80tr): 35%.

---

### 3.3. Phân hệ Trí tuệ Tài chính Cá nhân (Financial Intelligence)

#### User Stories:
- **US-INT-01:** Tôi muốn biết chỉ số Sức khỏe Tài chính (Financial Health Score) từ 0–100 điểm kèm gợi ý hành động cải thiện cụ thể.
- **US-INT-02:** Tôi muốn biết con số "Chi tiêu an toàn hôm nay (Safe-to-Spend)" để tự tin tiêu dùng mà không sợ bị âm tài khoản trước ngày lĩnh lương.
- **US-INT-03:** Tôi muốn dự báo dòng tiền 30 ngày / 90 ngày tới để lường trước các thời điểm thâm hụt tiền mặt khi có hóa đơn hoặc khoản trả nợ đến hạn.

#### Công thức Safe-to-Spend:
$$\text{Safe-to-Spend} = \frac{\text{Số dư khả dụng hiện tại} - \text{Hóa đơn/Nợ sắp tới} - \text{Hạn mức tiết kiệm tối thiểu}}{\text{Số ngày còn lại đến kỳ lương tiếp theo}}$$
- Phân biệt rạch ròi giữa **Tiền mặt khả dụng** (tiền gửi thanh toán, ví điện tử) và **Tài sản kém thanh khoản** (cổ phiếu đang nắm giữ, chứng chỉ quỹ chưa bán, vàng, bất động sản).

---

### 3.4. Phân hệ Quản trị SaaS Độc lập (Finora Admin Console)

#### Ranh giới Quyền riêng tư Bắt buộc (Privacy Boundary):
- Admin chỉ có quyền quản lý **thực thể doanh nghiệp Finora**: Tài khoản người dùng (Metadata), Gói cước (Free, Premium, Pro), Giao dịch thanh toán phí dịch vụ SaaS, Báo cáo doanh thu doanh nghiệp (MRR, ARR), Quản lý hạ tầng hệ thống và Hóa đơn điện tử đầu ra/vào của công ty Finora.
- **TUYỆT ĐỐI NGHIÊM CẤM:**
  - Không cho phép Admin xem danh sách giao dịch chi tiêu riêng tư của người dùng.
  - Không cho phép Admin xem số dư tài khoản ngân hàng, phiếu lương cá nhân, hay danh mục cổ phiếu của khách hàng.
  - Phân tách quyền ở tầng Database Row-Level Security (RLS) và API Authorization Middleware.

---

## 4. MA TRẬN YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

| Tiêu chí | Yêu cầu kỹ thuật | Phương pháp kiểm định |
| :--- | :--- | :--- |
| **Bảo mật dữ liệu** | Mã hóa AES-256-GCM cho API Key/Secret; SHA-256 cho chữ ký Webhook; TLS 1.3 | Automated Security Scans & OWASP ZAP |
| **Độ trễ phản hồi** | API truy vấn dữ liệu tài chính < 150ms; Biểu đồ Recharts kết xuất < 100ms | Lighthouse Performance Audit & Vitest Benchmark |
| **Độ chính xác số liệu** | Sử dụng số nguyên (BigInt / Fixed-point) cho đơn vị tiền tệ Đồng, không dùng floating-point làm tròn sai | Unit Test bảo toàn tiền tệ 37/37 tests |
| **Khả năng tương thích** | Responsive 100% từ 360px (Mobile) đến 1920px (Desktop màn rộng); Hỗ trợ Light & Dark Mode | Playwright Responsive Multi-Viewport Matrix |
| **Khả năng mở rộng** | Kiến trúc Adapter độc lập với nhà cung cấp dữ liệu thị trường (Provider-Agnostic) | Adapter Interface Contract Tests |

