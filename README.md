# TÍCH SẢN — Nền Tảng Quản Lý Tài Chính & Tích Lũy Tài Sản Cá Nhân

**Tích Sản** là hệ thống quản lý tài chính cá nhân, dòng tiền và phân bổ tài sản thực tế theo chuẩn Fintech hiện đại. Hệ thống được phát triển với kiến trúc bảo mật sâu, phiên đăng nhập 120 ngày, phân quyền Admin CLI an toàn, cơ chế dùng thử VIP Gold 30 ngày và sẵn sàng kết nối cổng thanh toán PayOS.

---

## 1. Điểm Nhấn Kiến Trúc & Tính Năng Nổi Bật

1. **Quản trị Máy chủ CLI (`Tichsan2953@`)**:
   - Khởi tạo và luân chuyển mật khẩu Admin trực tiếp qua SSH/Shell máy chủ.
   - Không lưu mật khẩu thô (plaintext), băm bằng thuật toán `scrypt` an toàn.
   - Khóa chu kỳ reset tối đa 1 lần mỗi 7 ngày (7-Day Cooldown).
   - Ẩn hoàn toàn nút Admin khỏi giao diện người dùng thông thường và Demo.
2. **Phiên Đăng Nhập 120 Ngày (120-Day Long Session)**:
   - Access token ngắn hạn (15 phút) hạn chế rủi ro lộ token.
   - Refresh token dài hạn tối đa 120 ngày luân chuyển liên tục (Token Rotation).
   - Lưu trữ dạng băm SHA-256 kèm Secret Pepper trong database; Cookie `HttpOnly` chống XSS.
   - Tự động phát hiện token tái sử dụng (Reuse Detection) và vô hiệu hóa ngay phiên xâm phạm.
3. **Chính Sách Gói Cước & Trial 30 Ngày**:
   - Mặc định đăng ký mới thuộc gói Miễn Phí (Free).
   - Hệ thống tự động tặng ngay **30 ngày trải nghiệm VIP Gold miễn phí** mà không yêu cầu thẻ tín dụng hay nạp tiền.
   - Hết 30 ngày tự động chuyển về Free, bảo toàn 100% dữ liệu đã ghi chép.
4. **Cổng Pháp Lý & Tích Hợp PayOS (VietQR)**:
   - Mặc định an toàn pháp lý (`PAYMENTS_ENABLED=false`, `LEGAL_COMPLIANCE_APPROVED=false`).
   - Hiển thị thông báo tuân thủ pháp lý và QR mẫu minh họa khi chưa đủ điều kiện thu tiền.
   - Tích hợp sẵn sàng PayOS SDK, đối soát hai chiều (`orderCode`, `amount`), chữ ký Webhook HMAC-SHA256 và khóa Idempotency.
5. **Tổng Quan Tài Chính & Speedometer Gauges**:
   - 7 thẻ tổng quan với 7 sắc màu nền phân biệt rõ rệt (Tài sản: Blue, Thu nhập: Emerald, Chi tiêu: Coral, Dòng tiền: Teal, Tiết kiệm: Purple, Ngân sách: Amber, Nợ: Rose).
   - Bộ đo sức khỏe tài chính GSAP chạy từ 0 đến giá trị thực, kim xoay dưới nắp trục tâm che khít, 5 dải màu tương phản cao.

---

## 2. Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### 2.1. Yêu cầu
- Node.js 20.18+ (hoặc 22+)
- pnpm 10+ hoặc npm

### 2.2. Khởi chạy
```bash
# 1. Cài đặt dependencies
pnpm install

# 2. Cấu hình biến môi trường
cp .env.example .env

# 3. Chạy môi trường phát triển (bao gồm Frontend & API Handler)
pnpm dev
```
Mở trình duyệt tại: `http://localhost:5173`.

### 2.3. Lệnh Quản trị Máy chủ
Để lấy thông tin đăng nhập hoặc luân chuyển mật khẩu Admin:
```bash
./Tichsan2953@
# hoặc
bash scripts/admin-bootstrap.sh
```

---

## 3. Kiểm Thử & Đóng Gói Production

```bash
# Kiểm tra kiểu dữ liệu TypeScript
npx tsc --noEmit

# Chạy toàn bộ Unit Tests & Business Logic Tests
npx vitest run

# Đóng gói Production
pnpm build

# Build Docker Container
docker compose build --no-cache
docker compose up -d
```

---

## 4. Tài Liệu Kỹ Thuật Chi Tiết
- [Hướng dẫn thiết lập Biến Môi Trường (ENV Setup)](docs/ENV_SETUP.md)
- [Quy chuẩn Bảo mật (Security Specification)](docs/SECURITY.md)
- [Quy trình Thanh toán & Đối soát PayOS](docs/PAYMENT_FLOW.md)
- [Quy trình Phục hồi & Khởi tạo Admin](docs/ADMIN_RECOVERY.md)
- [Hướng dẫn Triển khai & Rollback (Deployment)](docs/DEPLOYMENT.md)
- [Bản đồ Tính năng & Phân hệ (Feature Inventory)](docs/FEATURE_INVENTORY.md)
- [Bảng Kiểm tra Phát hành (Release Checklist)](docs/RELEASE_CHECKLIST.md)

---
© 2026 Tích Sản Platform. Bản quyền được bảo hộ.
