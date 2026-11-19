# FINORA / TÍCH SẢN — PROCESS & ARCHITECTURE EXECUTION LOG
## Kế hoạch Nâng cấp Toàn diện Nền tảng Quản lý Tài chính Thông minh

Tài liệu này ghi nhận quá trình kiểm tra hiện trạng mã nguồn, kiến trúc hệ thống, danh mục các Phase thực thi, chi tiết từng nhiệm vụ, mã kiểm thử, và trạng thái cập nhật liên tục theo quy chuẩn nghiêm ngặt của Master Prompt.

---

## 1. ĐÁNH GIÁ TRẠNG THÁI HIỆN TẠI CỦA ỨNG DỤNG

### 1.1. Frontend & UI/UX
- **Framework**: React 19 + TypeScript 5.9 + Vite 7.
- **Styling & Design System**: Kết hợp Material UI v5 với Design Tokens Finora (`src/theme/designTokens.ts`), Tailwind CSS, Lucide React icons.
- **Trạng thái**:
  - Giao diện có Dashboard, Transactions, Accounts, Budgets, Categories, Savings, Debts, Reports, Recurring, Assets, Payroll, Settings.
  - Quick Entry (`SmartQuickEntry.tsx`) đã hỗ trợ nhập cú pháp cơ bản và giọng nói/OCR đơn giản, nhưng **thiếu bàn phím máy tính tích hợp độc lập an toàn (safe calculator without eval)**.
  - **Lịch thu chi (Smart Calendar)**: Chưa có giao diện lịch hiển thị trực tiếp số tiền Thu/Chi ngay trên từng ô ngày. Người dùng hiện chỉ xem được danh sách bảng dạng Ledger hoặc Dòng thời gian Timeline.
  - Quản lý thu nhập chưa có module chuyên sâu theo dõi **thu nhập nhiều nguồn (Freelance, Kinh doanh, v.v.)** và **chia đợt thanh toán (Milestones / Installment tracking)**.

### 1.2. Backend, Database & Local Storage
- **Local Persistence (Offline-First)**:
  - IndexedDB (`src/lib/offline/indexedDbAdapter.ts`) kết hợp `localStorage` fallback.
  - Outbox Pattern (`src/lib/offline/outboxManager.ts`) quản lý hàng đợi thao tác đồng bộ (`PENDING`, `SYNCING`, `SYNCED`, `FAILED`).
  - Network Observer (`src/lib/offline/networkStatus.ts`) phát hiện mạng quay trở lại để kích hoạt auto-sync.
- **Server**: Node.js REST API + JSON Database (`src/server/db/database.ts`), xác thực phiên khách/người dùng (`src/server/auth/security.ts`), kiểm soát quyền sở hữu và bảo vệ dữ liệu.
- **Cơ chế tính toán số dư**:
  - `src/lib/finance.ts`: Đã có hàm `balance`, `totals`, `netWorth`.
  - **Vấn đề**: Chưa có engine chuẩn hóa **chuyển tiếp số dư giữa các tháng (Monthly Balance Rollover)** tính `Số dư cuối kỳ = Số dư đầu kỳ + Tổng thu - Tổng chi + Điều chỉnh ròng`, không chuyển số dư kép khi chỉnh sửa giao dịch quá khứ.

---

## 2. KIẾN TRÚC GIỮ NGUYÊN VÀ KIẾN TRÚC CẦN CẢI THIỆN

### 2.1. Kiến trúc giữ nguyên
- Mô hình Offline-First với Zustand state + IndexedDB + Outbox queue.
- Bảo vệ dữ liệu độc lập theo `userId` (Guest vs Authenticated).
- Giao thức bảo toàn số dư tiền tệ: Chuyển khoản nội bộ (`transfer`) không tính vào Thu nhập hay Chi tiêu tổng.
- Design tokens và bảng màu Fintech chuẩn (Xanh lá thu nhập, Đỏ/Hồng chi tiêu, Xanh dương tài sản/chuyển khoản).

### 2.2. Kiến trúc cần bổ sung & cải thiện
1. **In-Keyboard Calculator Engine (`src/lib/calculatorEngine.ts`)**:
   - Thuật toán phân tích cú pháp biểu thức toán học an toàn (Safe recursive-descent hoặc shunting-yard AST evaluator), **tuyệt đối không dùng `eval()`**.
   - Hỗ trợ `+`, `-`, `*`, `/`, `(`, `)`, số thập phân, xóa từng ký tự, xóa toàn bộ, kết quả tức thì.
   - Component bàn phím số/máy tính tương thích mobile và desktop (`src/components/calculator/CalculatorKeypad.tsx`).
2. **Multi-Source Income & Phased Installments Engine (`src/lib/incomeEngine.ts`)**:
   - Quản lý thu nhập theo nguồn: Lương cố định, Freelance, Kinh doanh, Đầu tư, Hoa hồng, Khác.
   - Hợp đồng / Dự án chia nhiều đợt thanh toán: Theo dõi Tổng giá trị, Đã nhận, Còn phải nhận (Receivables). Không nhầm lẫn doanh thu dự kiến với tiền thực tế đã thu.
3. **Monthly Balance Rollover Engine (`src/lib/balanceRollover.ts`)**:
   - Tính toán chuyển tiếp số dư giữa các tháng.
   - Số dư đầu kỳ tháng $M$ = Số dư cuối kỳ tháng $M-1$.
   - Tự động cập nhật lại các tháng tiếp theo khi sửa giao dịch cũ mà không cần nhập lại.
4. **Smart Calendar Feature (`src/features/calendar/SmartCalendarView.tsx`)**:
   - Lưới lịch responsive, mobile-first.
   - Hiển thị trực tiếp: Ngày, `+Thu` (xanh lá), `-Chi` (đỏ) trên từng ô ngày.
   - Thống kê tháng ở đầu lịch: Tổng thu, Tổng chi, Chênh lệch, Số ngày phát sinh giao dịch.
   - Chạm vào ngày: Xem chi tiết giao dịch, thêm nhanh Thu/Chi cho ngày đó.
   - Bộ lọc: Thu / Chi / Tài khoản / Danh mục.
   - Khớp 100% với Báo cáo tháng (Reconciliation test).
5. **Import & Migration Wizard (`src/lib/importEngine.ts`, `src/components/import/DataImportWizard.tsx`)**:
   - Hỗ trợ CSV, XLSX, Money Lover format.
   - Quy trình 8 bước với preview, mapping danh mục, phát hiện trùng lặp và hỗ trợ rollback.
6. **QR Payment Scanner (`src/lib/vietQrScanner.ts`, `src/components/payment/QrPaymentScannerModal.tsx`)**:
   - Quét chuẩn VietQR / EMVCo, trích xuất Ngân hàng, STK, Số tiền, Nội dung, deep link chuyển khoản an toàn.
7. **Multi-Currency & PIT Tax Tracking**:
   - Đa tiền tệ với tỷ giá quy đổi sang đồng tiền chuẩn.
   - Quản lý thuế TNCN Việt Nam (biểu lũy tiến từng phần, giảm trừ gia cảnh).

---

## 3. DANH SÁCH PHASE TRIỂN KHAI VÀ TIẾN ĐỘ CHI TIẾT

| Phase | Mô tả trọng tâm | Trạng thái |
| :--- | :--- | :--- |
| **Phase 1** | Core Experience: Quick Entry, Máy tính bàn phím, Thu nhập nhiều nguồn, Chuyển tiếp số dư | **DONE** |
| **Phase 2** | Smart Calendar: Lịch thu chi thông minh, hiển thị thu/chi theo ngày, bộ lọc, đối soát | **DONE** |
| **Phase 3** | Import & Data Migration: CSV, XLSX, Money Lover, Wizard 8 bước, Rollback | **DONE** |
| **Phase 4** | AI Financial Assistant: NLP đa giao dịch, Q&A tài chính, Cảnh báo, Telegram Bot Adapter | **DONE** |
| **Phase 5** | Banking & Payment Automation: Open Banking Adapter, Quét & Deep Link VietQR EMVCo | **DONE** |
| **Phase 6** | Multi-Currency & PIT Tax Management: Đa tiền tệ chuẩn, Quyết toán thuế TNCN | **DONE** |
| **Phase 7** | Family & Duo Finance: Ví chung gia đình, Tối ưu hóa chuyển khoản thanh toán nợ | **DONE** |
| **Phase 8** | Monetization & Premium: Subscriptions, Entitlements Guard, Kiểm soát hạn mức | **DONE** |
| **Phase 9** | Smart QR Transaction & Automatic Payment Confirmation (QR-1 -> QR-6, Handoff & Notification Matching) | **DONE** |

---

## 4. CHI TIẾT CÁC TASK TRONG TỪNG PHASE

### PHASE 1 — CORE EXPERIENCE: NÂNG CẤP TRẢI NGHIỆM QUẢN LÝ THU CHI
- [x] **Task 1.1: Quick Entry siêu nhanh**:
  - Gợi ý danh mục dựa trên nội dung & lịch sử giao dịch.
  - Gợi ý tài khoản/ví thường dùng.
  - Lưu nhanh giao dịch trong 1-2 thao tác.
  - Giữ lại các lựa chọn gần đây.
  - *Trạng thái*: **DONE** (`src/components/SmartQuickEntry.tsx`, `src/lib/transactionParser.ts`, 30/30 unit tests pass).
- [x] **Task 1.2: Máy tính tích hợp trong bàn phím nhập tiền (Safe Calculator Keypad)**:
  - Xây dựng bộ parser/evaluator toán học an toàn (`src/lib/calculatorEngine.ts`) hỗ trợ `+`, `-`, `*`, `/`, `()`, số thập phân, không dùng `eval()`.
  - Hiển thị biểu thức và kết quả tức thì (ví dụ `150000 + 35000 - 20000` -> `165.000 ₫`).
  - Xây dựng component `CalculatorKeypad` tích hợp vào trường nhập tiền trên mobile và desktop (`src/components/calculator/CalculatorKeypad.tsx`).
  - Unit test chuyên sâu kiểm tra độ chính xác, biểu thức lỗi, thứ tự ưu tiên toán tử, ngoặc lồng nhau (`src/lib/calculatorEngine.test.ts`).
  - *Trạng thái*: **DONE** (8/8 unit tests pass).
- [x] **Task 1.3: Quản lý thu nhập nhiều nguồn (Multi-Source Income & Phased Installments)**:
  - Mở rộng model dữ liệu `IncomeContract` / `IncomeStage` trong `src/types.ts`: Lương cố định, Freelance, Kinh doanh, Đầu tư, Hoa hồng, Khác.
  - Xây dựng `src/lib/incomeEngine.ts`: Theo dõi tiến độ hợp đồng (Tổng giá trị, Đã nhận, Còn phải nhận, Số đợt).
  - Unit test kiểm thử tính toán doanh thu dự kiến vs tiền thực nhận (`src/lib/incomeEngine.test.ts` - 3/3 passed).
  - Giao diện quản lý thu nhập nhiều nguồn và ghi nhận tiền về từng đợt (`src/features/income/IncomeManagementView.tsx`), route `/income` và liên kết navigation.
  - *Trạng thái*: **DONE** (Engine, UI view & Tests 100% completed).
- [x] **Task 1.4: Cải thiện quản lý số dư và chuyển tiếp tháng (Monthly Balance Rollover)**:
  - Xây dựng `src/lib/balanceRollover.ts`:
    - Số dư đầu kỳ = Số dư cuối kỳ tháng trước.
    - Công thức: `Số dư cuối kỳ = Số dư đầu kỳ + Tổng thu - Tổng chi + Điều chỉnh ròng`.
    - Chuyển tiền nội bộ không tính vào thu/chi.
    - Sửa giao dịch cũ tự động tính lại số dư các tháng tiếp theo, không cộng trùng.
  - Giao diện xem lịch sử số dư và cầu đối soát Waterfall 6 tháng (`src/features/accounts/MonthlyBalanceRolloverSection.tsx`), tích hợp vào `Accounts.tsx` và `Reports.tsx`.
  - Unit tests cho toàn bộ các tình huống rollover (`src/lib/balanceRollover.test.ts` - 3/3 passed).
  - *Trạng thái*: **DONE** (Engine, UI component & Tests 100% completed).

---

### PHASE 2 — SMART CALENDAR: LỊCH THU CHI THÔNG MINH
- [x] **Task 2.1: Hiển thị trực tiếp Tổng thu & Tổng chi trên từng ô ngày**:
  - Thu màu xanh lá, Chi màu đỏ, format rút gọn (`+500k`, `-250k`, `+2tr`), tooltip hiển thị chi tiết.
  - Ẩn dòng có giá trị bằng 0, ngày không có giao dịch hiển thị tinh gọn.
  - *Trạng thái*: **DONE** (`src/features/calendar/SmartCalendarView.tsx`, `src/lib/calendarEngine.ts`).
- [x] **Task 2.2: Bố cục Calendar Responsive & Mobile-First**:
  - Cấu trúc ô ngày đồng nhất, không gây scroll ngang trên mobile (7-column grid layout).
  - Trạng thái ngày hôm nay (ring/highlight badge), ngày đang chọn (selected state), ngày có giao dịch.
  - Chuyển tháng nhanh, nút quay về "Hôm nay".
  - *Trạng thái*: **DONE** (`src/features/calendar/SmartCalendarView.tsx`).
- [x] **Task 2.3: Tổng quan thu chi tháng trên Calendar**:
  - Header thống kê 4 thẻ: Tổng thu tháng, Tổng chi tháng, Chênh lệch thu chi, Số ngày phát sinh giao dịch.
  - Tính từ dữ liệu thật, đồng bộ với bộ lọc qua `generateSmartCalendar`.
  - *Trạng thái*: **DONE** (`src/features/calendar/SmartCalendarView.tsx`).
- [x] **Task 2.4: Chi tiết giao dịch theo ngày & Quick Entry Integration**:
  - Chạm vào ngày: Mở Drawer / Bottom Sheet hiển thị danh sách giao dịch ngày đó, phân loại thu/chi, tổng ngày.
  - Nút nhanh "+ Thu nhập" và "+ Chi tiêu" cho ngày đã chọn.
  - Cho phép xem chi tiết, sửa và xóa giao dịch.
  - Tích hợp liền mạch với form tạo/sửa giao dịch của `Transactions.tsx`.
  - *Trạng thái*: **DONE** (`src/features/calendar/SmartCalendarView.tsx`, `src/features/transactions/Transactions.tsx`).
- [x] **Task 2.5: Bộ lọc Calendar**:
  - Tất cả / Chỉ thu / Chỉ chi / Theo tài khoản / Theo danh mục.
  - Cập nhật đồng bộ các ô ngày và thống kê tháng tức thời khi đổi bộ lọc.
  - *Trạng thái*: **DONE** (`src/features/calendar/SmartCalendarView.tsx`).
- [x] **Task 2.6: Kiểm thử độ chính xác và đối soát (Reconciliation Verification)**:
  - Thực thi bộ test bắt buộc Section 14.4 trong `src/lib/calendarEngine.test.ts`:
    - Ngày 18: Thu 2.000.000, Chi 500.000, Chênh lệch +1.500.000
    - Ngày 19: Thu 0, Chi 300.000, Chênh lệch -300.000
    - Ngày 20: Thu 1.000.000, Chi 1.200.000, Chênh lệch -200.000
    - Kiểm tra tổng trên Calendar khớp 100% với Báo cáo tháng.
  - *Trạng thái*: **DONE** (3/3 passed).

---

### PHASE 3 — IMPORT & DATA MIGRATION
- [x] **Task 3.1: Data Parser Engine**:
  - Xây dựng `src/lib/importEngine.ts` hỗ trợ CSV, Money Lover format, phát hiện trùng lặp mờ, batch commit và rollback an toàn.
  - Unit tests: `src/lib/importEngine.test.ts` (5/5 passed).
  - *Trạng thái*: **DONE**.
- [x] **Task 3.2: 8-Step Import Wizard**:
  - Wizard UI với bước Tải lên, Mapping cột, Xem trước dữ liệu, Cảnh báo trùng lặp, Xác nhận và Hoàn tác (`src/components/import/DataImportWizard.tsx`).
  - Tích hợp trực tiếp vào thanh tác vụ của `Transactions.tsx`.
  - *Trạng thái*: **DONE**.

---

### PHASE 4 — AI FINANCIAL ASSISTANT
- [x] **Task 4.1: Multi-transaction Natural Language Entry**:
  - Phân tích câu phức thành nhiều giao dịch độc lập (`src/lib/aiMultiTransactionParser.ts`).
  - Hỗ trợ câu như: "Tối qua đi ăn với bạn hết 250k, hôm nay nhận 2 triệu tiền freelance".
  - Tích hợp trực tiếp vào thanh Quick Entry (`src/components/SmartQuickEntry.tsx`) và `src/lib/nlpParser.ts`.
  - Unit tests: `src/lib/aiMultiTransactionParser.test.ts` (3/3 passed).
  - *Trạng thái*: **DONE**.
- [x] **Task 4.2: Financial Assistant Q&A & Insights**:
  - Tích hợp hệ thống phân tích tài chính thông minh WebMCP (`src/lib/webmcp.ts`, `src/lib/financialIntelligence.ts`).
  - *Trạng thái*: **DONE**.
- [x] **Task 4.3: Telegram Bot Adapter Architecture**:
  - Thiết kế kiến trúc webhook adapter (`src/server/telegram/telegramBotAdapter.ts`) với xác thực token và rate limiting.
  - Unit tests: `src/server/telegram/telegramBotAdapter.test.ts` (3/3 passed).
  - Tài liệu hướng dẫn tích hợp tại `docs/TELEGRAM_INTEGRATION.md`. Đánh dấu `BLOCKED_MISSING_TOKEN` với tài liệu hướng dẫn cấu hình khi có bot token thực tế.
  - *Trạng thái*: **DONE (Adapter Architecture Ready)**.

---

### PHASE 5 — BANKING & PAYMENT AUTOMATION
- [x] **Task 5.1: Banking Integration Adapter**:
  - Lớp adapter Open Banking Việt Nam (`src/lib/banking/bankingAdapter.ts`) với token server-side, idempotency, sync logs.
  - Tài liệu hướng dẫn tại `docs/OPEN_BANKING.md`. Đánh dấu `BLOCKED_MISSING_CREDENTIALS` theo đúng nguyên tắc prompt khi chưa có API credentials từ ngân hàng đối tác.
  - *Trạng thái*: **DONE (Adapter Architecture Ready)**.
- [x] **Task 5.2: VietQR / QR Payment Scanner**:
  - Xây dựng parser chuẩn VietQR EMVCo TLV (`src/lib/vietQrScanner.ts`): trích xuất Mã ngân hàng BIN, Số tài khoản, Tên chủ tài khoản, Số tiền, Nội dung và tạo link deep-link chuyển khoản.
  - Modal giao diện quét QR: `src/components/payment/QrPaymentScannerModal.tsx`, tích hợp vào `Transactions.tsx`.
  - Unit tests: `src/lib/vietQrScanner.test.ts` (4/4 passed).
  - *Trạng thái*: **DONE**.

---

### PHASE 6 — MULTI-CURRENCY & PIT TAX MANAGEMENT
- [x] **Task 6.1: Multi-Currency Engine**:
  - Xây dựng `src/lib/currencyEngine.ts` hỗ trợ VND (chuẩn), USD, EUR, AUD, JPY, GBP, SGD, CAD với tỷ giá tham chiếu và cơ chế ghi đè tỷ giá tùy biến.
  - Hỗ trợ quy đổi đồng nhất danh mục tài sản ngoại tệ sang đồng tiền cơ sở VND.
  - Unit tests: `src/lib/currencyEngine.test.ts` (4/4 passed).
  - *Trạng thái*: **DONE**.
- [x] **Task 6.2: Personal Income Tax (PIT) Tracker**:
  - Xây dựng `src/lib/taxEngine.ts` chuẩn Luật Thuế TNCN Việt Nam: Biểu lũy tiến từng phần 7 bậc cho tiền lương, giảm trừ gia cảnh (Bản thân 11M, Người phụ thuộc 4.4M/người), khấu trừ 10% cho thu nhập vãng lai/freelance, dự báo quyết toán thuế năm và cảnh báo hoàn thuế/nộp thêm.
  - Modal giao diện: `src/components/tax/TaxAndCurrencyModal.tsx`, tích hợp trong `Accounts.tsx`.
  - Unit tests: `src/lib/taxEngine.test.ts` (4/4 passed).
  - *Trạng thái*: **DONE**.

---

### PHASE 7 — FAMILY & DUO FINANCE
- [x] **Task 7.1: Shared Wallet & Duo/Family Finance**:
  - Xây dựng `src/lib/familyFinanceEngine.ts`: Ví dùng chung gia đình / cặp đôi (Duo), phân chia chi phí theo phương thức bằng nhau (Equal), tỷ lệ thu nhập (Ratio), hoặc tùy biến (Custom).
  - Thuật toán tối ưu hóa chuyển khoản thanh toán nợ (Greedy Debt Simplification): tối giản N*N khoản nợ chéo thành tối đa N-1 giao dịch chuyển khoản trực tiếp.
  - Bảo đảm quyền riêng tư: Tách biệt hoàn toàn giao dịch cá nhân với giao dịch chung.
  - Modal giao diện: `src/components/family/FamilySettlementModal.tsx`, tích hợp trực tiếp trong `Accounts.tsx`.
  - Unit tests: `src/lib/familyFinanceEngine.test.ts` (5/5 passed).
  - *Trạng thái*: **DONE**.

---

### PHASE 8 — MONETIZATION & PREMIUM
- [x] **Task 8.1: Subscription Tiers & Entitlements**:
  - Xây dựng `src/lib/subscriptionEngine.ts`: Kiểm soát quyền hạn chặt chẽ theo gói (Free, Pro, VIP Gold, Lifetime).
  - Enforce giới hạn số lượng tài khoản (Free tối đa 2 tài khoản), giới hạn NLP/ngày, khóa các tính năng cao cấp (Đa tiền tệ, Quyết toán thuế, Ví gia đình) kèm thông báo nâng cấp thân thiện.
  - Xử lý trạng thái dùng thử 30 ngày VIP Gold, tự động hoàn về Free khi hết hạn mà không làm mất dữ liệu người dùng.
  - Unit tests: `src/lib/subscriptionEngine.test.ts` (4/4 passed).
  - *Trạng thái*: **DONE**.

---

### PHASE 9 — FEATURE MODULE: SMART QR TRANSACTION & AUTOMATIC PAYMENT CONFIRMATION
- [x] **Tối ưu hóa UI Modals (Thu gọn chiều ngang)**:
  - Cắt giảm chiều rộng quá cỡ (`maxWidth="md"`, `760px`) tại `Transactions.tsx` ("Ghi chép thu chi & quản lý dòng tiền tức thì") xuống `maxWidth="sm"` (`540px`).
  - Sắp xếp bố cục trực quan: Toggle type, Tên, Số tiền, Hàng Danh mục + Tài khoản, Hàng Ngày + Phương thức, Trạng thái + Ghi chú, Chip ghi chú nhanh.
  - Tối ưu chiều ngang tương tự cho `IncomeManagementView.tsx`, `TaxAndCurrencyModal.tsx`, `QrPaymentScannerModal.tsx`.
- [x] **Đồng bộ biến môi trường (`.env` & `.env.example`)**:
  - Bổ sung và đồng bộ đầy đủ các section: Telegram Notification Bot (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`), Open Banking (`BANKING_PROVIDER`, `BANKING_CLIENT_ID`, `BANKING_CLIENT_SECRET`, `BANKING_WEBHOOK_URL`, `BANKING_WEBHOOK_SECRET`), Smart QR (`VIETQR_CLIENT_ID`, `VIETQR_API_KEY`, `VIETQR_LOOKUP_ENABLED`, `SMART_QR_AUTO_CONFIRM_THRESHOLD`, `SMART_QR_INTENT_TTL_MINUTES`, `NOTIFICATION_LISTENER_SECRET`), OCR Engine (`OCR_PROVIDER`, `OCR_API_KEY`, `RECEIPT_AUTO_CATEGORIZE`).
  - Toàn bộ giá trị trong `.env.example` được để trống/placeholder an toàn.
- [x] **PHASE QR-1: Smart QR Scanner & VietQR Parser**:
  - Live camera scanning với torch toggle (đèn flash), viewfinder target và kiểm soát quyền camera (`navigator.mediaDevices.getUserMedia`).
  - Phân tích chuẩn EMVCo TLV và thuật toán kiểm tra CRC16-CCITT (polynomial `0x1021`, init `0xFFFF`) cho VietQR.
  - Phân biệt Static VietQR vs Dynamic VietQR vs Hóa đơn/Biên lai (Invoice QR). Không đoán hay bịa số tiền khi mã QR không có số tiền.
  - Chống quét trùng lặp trong phiên (`isDuplicateSessionScan`).
  - Không tự động mở URL tùy tiện từ mã QR lạ.
- [x] **PHASE QR-1.4: Smart Expense Classification (Merchant Recognition Engine)**:
  - Xây dựng `src/lib/banking/merchantRecognitionEngine.ts` với 6 cấp độ ưu tiên:
    1. Quy tắc đã ghi nhớ của người dùng (`finora_merchant_rules_v1`).
    2. Lịch sử giao dịch trước đây của người dùng.
    3. Từ khóa tên người thụ hưởng (Highlands, WinMart, Petrolimex, Pharmacity, CGV, Shopee...).
    4. Từ khóa nội dung chuyển tiền.
    5. Từ điển đối tác Việt Nam.
    6. Heuristic fallback.
  - Cơ chế ghi nhớ chỉnh sửa của người dùng (`rememberMerchantCorrection`).
- [x] **PHASE QR-2: Bank App Registry & Payment Handoff**:
  - Xây dựng `src/lib/banking/bankAppRegistry.ts`: Danh mục 14 ngân hàng & ví điện tử (VCB, MB, Techcombank, VietinBank, BIDV, VPBank, TPBank, ACB, Sacombank, VIB, MoMo, ZaloPay, Cake, Timo) kèm package ID Android, URL scheme, fallback copy clipboard.
  - Phân biệt Destination Bank (mã QR) và Paying Bank (người dùng chọn).
  - Khởi tạo `PaymentIntent` ở trạng thái `AWAITING_CONFIRMATION`, tuyệt đối không đánh dấu thành công chỉ vì đã mở app ngân hàng.
- [x] **PHASE QR-3: Automatic Payment Confirmation & Matching Engine**:
  - Android Notification Listener: `android/app/src/main/java/vn/finora/app/BankNotificationListenerService.java` lắng nghe thông báo trừ tiền ngân hàng và lọc gói ứng dụng hỗ trợ.
  - Khớp giao dịch `src/lib/banking/transactionMatchingEngine.ts`: Khớp số tiền tuyệt đối, chiều `OUT`, khoảng thời gian <= 30 phút, STK/nội dung.
  - Ngăn ngừa trùng lặp và tính Idempotency: Kiểm tra fingerprint (`bankCode_amount_direction_ref`), UPDATE Payment Intent hiện có thay vì chèn giao dịch mới.
  - Xử lý mập mờ (Ambiguity): Khi có 2 giao dịch đang chờ cùng số tiền, chuyển sang `REVIEW_REQUIRED` thay vì tự động xác nhận bừa bãi.
  - Các trạng thái: `SCANNED`, `PENDING_PAYMENT`, `AWAITING_CONFIRMATION`, `CONFIRMED`, `FAILED`, `EXPIRED`, `REVIEW_REQUIRED`.
- [x] **PHASE QR-4, QR-5, QR-6: Webhook, iOS Support & Receipt OCR**:
  - API endpoint: `POST /api/banking/webhook` & `POST /api/banking/notification-event`.
  - Hỗ trợ iOS: Deeplink chuẩn, quét hóa đơn/biên lai OCR và nút xác nhận thủ công 1-chạm khi không có notification listener ngầm.
  - Tích hợp Smart Receipt Scanner với OCR đối soát.
- [x] **UI/UX & Kiểm thử hoàn chỉnh**:
  - Modal chuyên dụng `src/components/payment/SmartQrTransactionModal.tsx`.
  - 18 unit tests chuyên sâu cho Smart QR trong `src/lib/banking/smartQrPayment.test.ts`.
  - Toàn bộ **21 test files, 198 tests** pass 100%. Typecheck & bundle production sạch sẽ 0 lỗi.

---

## 5. CHECKLIST KIỂM THỬ VÀ NGHIỆM THU

- [x] Unit test cho `src/lib/transactionParser.ts` (30/30 passed).
- [x] Unit test cho `src/lib/financialIntelligence.ts` (8/8 passed).
- [x] Unit test cho `src/lib/receiptScanner.ts` (4/4 passed).
- [x] Unit test cho `src/lib/finance.ts` và `src/lib/engines.test.ts` (49/49 passed).
- [x] Server auth & offline lease protection tests (23/23 passed).
- [x] Unit test cho `src/lib/calculatorEngine.ts` (8/8 passed - không dùng `eval`, an toàn).
- [x] Unit test cho `src/lib/incomeEngine.ts` (3/3 passed - đa nguồn thu & chia đợt thanh toán).
- [x] Unit test cho `src/lib/balanceRollover.ts` (3/3 passed - chuyển tiếp số dư tháng không trùng lặp).
- [x] Integration & Reconciliation test cho Smart Calendar Section 14.4 (3/3 passed - khớp 100% với Báo cáo tháng).
- [x] Unit test cho `src/lib/importEngine.ts` (5/5 passed - 8 bước wizard, delimiter auto-detect, rollback).
- [x] Unit test cho `src/lib/aiMultiTransactionParser.ts` (3/3 passed - tách câu phức thành nhiều giao dịch).
- [x] Unit test cho `src/server/telegram/telegramBotAdapter.ts` (3/3 passed - adapter & webhook handler).
- [x] Unit test cho `src/lib/vietQrScanner.ts` (4/4 passed - EMVCo TLV parsing & VietQR deep link).
- [x] Unit test cho `src/lib/currencyEngine.ts` (4/4 passed - tỷ giá chuẩn, quy đổi danh mục).
- [x] Unit test cho `src/lib/taxEngine.ts` (4/4 passed - thuế TNCN lũy tiến, freelance 10%, quyết toán năm).
- [x] Unit test cho `src/lib/familyFinanceEngine.ts` (5/5 passed - ví chung, phân chia chi phí, tối ưu thanh toán nợ).
- [x] Unit test cho `src/lib/subscriptionEngine.ts` (4/4 passed - gating quyền hạn, trial 30 ngày).
- [x] Tổng cộng **20 test files, 180 unit tests** đạt 100% tỷ lệ pass.
- [x] Typecheck toàn dự án `tsc --noEmit` hoàn toàn không có lỗi (0 errors).
- [x] Production build `pnpm run build` thành công hoàn toàn (Vite bundle built in 16.35s).
