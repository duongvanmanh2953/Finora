# QUY CHUẨN BẢO MẬT HỆ THỐNG (SECURITY SPECIFICATION) — TÍCH SẢN

Tài liệu này đặc tả toàn bộ các tiêu chuẩn, cơ chế bảo mật và quy trình phòng thủ chiều sâu (Defense-in-Depth) được triển khai trên nền tảng **Tích Sản**.

---

## 1. Xác thực & Quản lý Phiên Đăng Nhập 120 Ngày

### 1.1. Kiến trúc Hai Tầng Token
- **Access Token (Ngắn hạn)**:
  - Thời gian sống (TTL): **15 phút**.
  - Truyền tải qua HTTP Header `Authorization: Bearer <token>` hoặc Cookie trình duyệt.
  - Hạn chế tối đa rủi ro nếu token bị lộ trên đường truyền.
- **Refresh Token (Dài hạn 120 ngày)**:
  - Thời gian sống: **Tối đa 120 ngày**.
  - Lưu trữ phía Client: Thuộc tính Cookie `HttpOnly`, `SameSite=Lax`, `Secure` (trong production), ngăn chặn tuyệt đối tấn công XSS đọc cắp token từ `localStorage`.
  - Lưu trữ phía Server: **Chỉ lưu dạng băm SHA-256 kèm Secret Pepper (`REFRESH_TOKEN_PEPPER`)**, không lưu token thô trong database.

### 1.2. Cơ chế Luân chuyển (Token Rotation) & Phát hiện Tái sử dụng (Reuse Detection)
1. Mỗi lần Client gửi yêu cầu gia hạn qua endpoint `/api/auth/refresh`, Refresh Token cũ sẽ bị vô hiệu hóa ngay lập tức (`isRevoked: true`).
2. Một cặp Access Token và Refresh Token mới sẽ được sinh ra và ghi nhận chuỗi thay thế (`replacedByTokenHash`).
3. **Phát hiện tái sử dụng**: Nếu một token cũ đã bị vô hiệu hóa được gửi lại, hệ thống nhận diện đây là hành vi đánh cắp phiên (Session Hijacking) và **thu hồi toàn bộ các phiên đăng nhập của người dùng đó trên mọi thiết bị ngay lập tức**.

---

## 2. Mã hóa Mật khẩu & Bảo vệ Thông tin Xác thực

### 2.1. Thuật toán Scrypt Memory-Hard
- Mật khẩu người dùng và mật khẩu Quản trị viên được băm bằng thuật toán `scrypt` tiêu chuẩn Node.js Crypto với thông số an toàn:
  - `salt`: 16 bytes ngẫu nhiên chuẩn mã hóa (`crypto.randomBytes(16)`).
  - Độ dài đầu ra: 64 bytes (128 ký tự hex).
  - So khớp mật khẩu: Sử dụng `crypto.timingSafeEqual` để loại trừ hoàn toàn nguy cơ tấn công kênh kề qua đo thời gian (Timing Attacks).

---

## 3. Quản trị Server CLI & Khóa Chu kỳ 7 Ngày (`Tichsan2953@`)

### 3.1. Nguyên tắc Không Backdoor & Không Hardcode
- Không tồn tại tài khoản Admin mặc định với mật khẩu cố định.
- Không tồn tại API công khai hoặc bí mật trên web để lấy mật khẩu Admin.
- Không hiển thị nút bấm Admin trên giao diện người dùng thông thường, Landing page hay Demo.
- Chuỗi `Tichsan2953@` chỉ là định danh lệnh gọi script CLI chạy trên server vật lý/SSH, **tuyệt đối không** phải là mật khẩu hoặc chuỗi xác thực.

### 3.2. Ràng buộc Chu kỳ 7 Ngày (7-Day Cooldown)
- Khi gọi lệnh CLI:
  1. Kiểm tra timestamp lần cấp mật khẩu gần nhất (`lastAdminResetTimestamp`).
  2. Nếu thời gian chưa đủ 7 ngày (`7 * 86400 * 1000 ms`), lệnh lập tức từ chối và thông báo chính xác số ngày còn lại cần đợi.
  3. Khi đủ 7 ngày: Tạo mật khẩu ngẫu nhiên độ dài cao, băm lưu vào DB, thu hồi toàn bộ session Admin cũ, in ra terminal **đúng 1 lần duy nhất** và bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.

---

## 4. Xác thực Hai Chiều & Idempotency trong Thanh toán PayOS

### 4.1. Cổng Pháp lý (Legal Compliance Gate)
- Mặc định: `PAYMENTS_ENABLED=false`, `LEGAL_COMPLIANCE_APPROVED=false`, `PAYOS_ENABLED=false`.
- Khi chưa bật, hệ thống chặn toàn bộ việc sinh payment link thật, chỉ xuất QR mẫu minh họa và hiển thị thông báo tuân thủ pháp lý.

### 4.2. Khóa Idempotency (`x-idempotency-key`)
- Mọi yêu cầu tạo đơn hàng thanh toán `/api/payment/create-order` đều yêu cầu `x-idempotency-key`.
- Khi nhận yêu cầu trùng lặp trong 24 giờ, hệ thống trả về kết quả đã xử lý trước đó, không sinh đơn hàng mới hay trừ tiền kép.

### 4.3. Xác minh Chữ ký Webhook & Đối soát Hai Phía
- Webhook nhận từ PayOS phải được xác minh chữ ký HMAC-SHA256 với `PAYOS_CHECKSUM_KEY`.
- Phải đối soát chéo `orderCode`, `amount`, trạng thái đơn hàng trong DB trước khi cấp quyền lợi gói cước.

---

## 5. Toàn vẹn Dữ liệu Kế toán & Phân quyền Dữ liệu

1. **Số tiền VND**: Luôn lưu trữ và tính toán dưới dạng số nguyên (`integer`), tuyệt đối không sử dụng số dấu phẩy động (`floating point`) gây sai lệch tiền tệ.
2. **Kiểm tra Ownership**: Mọi thao tác đọc/ghi sổ sách `/api/finance` đều xác thực token sở hữu. Người dùng không thể truy cập hay ghi đè dữ liệu của tài khoản khác bằng cách sửa ID trong request.
3. **Audit Log Toàn diện**: Mọi hành động quan trọng (đăng nhập, đổi mật khẩu, cấp quyền, webhook, lỗi bảo mật) đều được ghi nhận vào bảng Audit Log phục vụ giám sát và truy vết.

