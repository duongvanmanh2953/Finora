# BẢNG KIỂM TRA PHÁT HÀNH (RELEASE CHECKLIST) — TÍCH SẢN

Bảng kiểm tra bắt buộc trước khi đưa phiên bản mới của **Tích Sản** lên môi trường Production.

---

## 1. Kiểm tra Thương hiệu & Giao diện (Branding & UI)
- [x] Tên thương hiệu hiển thị thống nhất là **Tích Sản** trên toàn bộ hệ thống.
- [x] Không còn xuất hiện tên cũ "Finora" trên UI production, Landing page, Dashboard, Login, Footer.
- [x] Tiêu đề tab trình duyệt (`<title>`) và metadata SEO trong `index.html` hiển thị đúng thương hiệu Tích Sản.
- [x] Logo và Favicon hiển thị sắc nét trên cả desktop, tablet và mobile.
- [x] 7 thẻ Tổng quan tài chính hiển thị đúng 7 màu nền phân biệt theo quy chuẩn:
  - [x] Tài sản: Blue (Blue tint)
  - [x] Thu nhập: Emerald (Green tint)
  - [x] Chi tiêu: Coral (Red tint)
  - [x] Dòng tiền: Teal (Teal tint)
  - [x] Tiết kiệm: Purple (Purple tint)
  - [x] Ngân sách: Amber (Yellow tint)
  - [x] Nợ nghĩa vụ: Rose (Rose tint)
- [x] Bộ đo Speedometer Gauges:
  - [x] Giá trị và kim khởi chạy mượt mà từ 0 đến giá trị thực.
  - [x] Kim xoay nằm chuẩn xác dưới nắp trục tâm (pivot cap), không đâm xuyên tâm hay vượt cung đo.
  - [x] 5 dải màu hiển thị sáng rõ, tương phản cao.
- [x] Hệ màu nhận diện VIP Gold: Tách biệt hoàn toàn Warm Amber / Champagne Gold khỏi màu cảnh báo Warning.

---

## 2. Kiểm tra Xác thực & Phiên Đăng Nhập (Authentication)
- [x] Đăng ký tài khoản mới thành công và tự động cấp 30 ngày VIP Gold dùng thử.
- [x] Hiển thị thông báo chúc mừng tặng 1 tháng VIP Gold đúng nội dung yêu cầu.
- [x] Hết 30 ngày tự động chuyển về gói Free mà không làm mất dữ liệu tài chính của người dùng.
- [x] Mật khẩu được băm an toàn bằng thuật toán `scrypt` memory-hard.
- [x] Access Token có thời hạn ngắn (15 phút).
- [x] Phiên đăng nhập dài hạn duy trì tối đa 120 ngày qua cơ chế Refresh Token Rotation.
- [x] Cookie Refresh Token lưu cờ `HttpOnly`, `SameSite=Lax`.
- [x] Cơ chế phát hiện token tái sử dụng (Reuse Detection) hoạt động: Lập tức thu hồi toàn bộ session của tài khoản khi phát hiện token cũ bị dùng lại.
- [x] Đăng xuất xóa sạch tokens và thu hồi phiên trong database.

---

## 3. Kiểm tra Quản trị Viên & Bảo mật Máy chủ (Admin & Security)
- [x] Ẩn hoàn toàn nút Admin và menu Quản trị khỏi giao diện người dùng thông thường và Demo mode.
- [x] Lệnh CLI `Tichsan2953@` (hoặc `scripts/admin-bootstrap.sh`) chạy thành công trên máy chủ.
- [x] Mật khẩu Admin được sinh ngẫu nhiên mạnh và in ra terminal đúng một lần duy nhất.
- [x] Không lưu mật khẩu Admin dạng văn bản thô (plaintext) trong bất kỳ file nào.
- [x] Cơ chế khóa chu kỳ luân chuyển mật khẩu 7 ngày (7-Day Cooldown) hoạt động: Từ chối lệnh nếu chưa đủ 7 ngày kể từ lần reset trước.
- [x] Màn hình Admin quản lý được danh sách người dùng, cấp gói thủ công kèm Audit Log.
- [x] Màn hình Admin quản lý chi phí bên thứ ba (VPS, Domain, Email, AI, Cổng thanh toán) hoạt động đầy đủ.
- [x] Màn hình System Health theo dõi trạng thái API, Database, SMTP, PayOS, OAuth và tài nguyên máy chủ.

---

## 4. Kiểm tra Thanh toán PayOS & Tuân thủ Pháp lý (Payment & Legal Gate)
- [x] Cờ kiểm soát pháp lý mặc định: `PAYMENTS_ENABLED=false`, `LEGAL_COMPLIANCE_APPROVED=false`, `PAYOS_ENABLED=false`.
- [x] Khi người dùng bấm mua gói trả phí: Mở modal thông báo pháp lý theo đúng quy chuẩn và hiển thị QR mẫu minh họa không thể quét trừ tiền.
- [x] Không sinh đơn hàng thật hoặc thu tiền khi chưa được phê duyệt pháp lý.
- [x] Khóa Idempotency (`x-idempotency-key`) chống thanh toán trùng lặp khi người dùng bấm liên tục.
- [x] Cơ chế xác minh chữ ký Webhook HMAC-SHA256 với `PAYOS_CHECKSUM_KEY` và đối soát hai chiều (`orderCode`, `amount`).

---

## 5. Kiểm thử Mã Nguồn & Triển khai (Code Quality & Build)
- [x] Không còn mock data hoặc hardcode dữ liệu giả trên các luồng production.
- [x] Kiểm tra kiểu dữ liệu TypeScript không còn lỗi (`npx tsc --noEmit` pass 100%).
- [x] Bộ kiểm thử tự động Vitest vượt qua toàn bộ (`npx vitest run` pass 100%).
- [x] Đóng gói Docker build thành công không lỗi (`docker build`).
- [x] Tệp `.env` được bảo vệ trong `.gitignore` không bị đẩy lên repository.

