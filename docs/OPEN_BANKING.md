# FINORA OPEN BANKING INTEGRATION SPECIFICATION

Tài liệu đặc tả kiến trúc kết nối ngân hàng tự động (Banking Integration Adapter) cho thị trường Việt Nam.

---

## 1. Trạng thái Kiến trúc (Architecture Status)

- **Trạng thái**: **BLOCKED / SẴN SÀNG TÍCH HỢP**
- **Nguyên nhân**: Theo quy định của Ngân hàng Nhà nước Việt Nam (Thông tư 28/2021/TT-NHNN và khung Open API NAPAS), việc truy cập API Open Banking yêu cầu giấy phép trung gian thanh toán và hợp đồng thỏa thuận dịch vụ trực tiếp với từng ngân hàng đối tác hoặc đơn vị cổng thanh toán (Casso, SePay, VietinBank iConnect, Vietcombank B2B Open API).
- **Phần đã hoàn thiện**:
  - Lớp Adapter `OpenBankingVietnamAdapter` tại `src/lib/banking/bankingAdapter.ts`.
  - Bộ giải mã chuẩn VietQR / EMVCo tại `src/lib/vietQrScanner.ts` và giao diện quét mã tại `src/components/payment/QrPaymentScannerModal.tsx`.
  - Cơ chế chống ghi trùng lặp (Idempotency) và lưu vết đồng bộ (Sync Logs).

---

## 2. Hướng dẫn tích hợp khi đã có thông tin đối tác

1. Đăng ký tài khoản doanh nghiệp tại cổng đối tác Open Banking (ví dụ Casso / SePay hoặc NAPAS Developer Portal).
2. Lấy API Key và Webhook Secret.
3. Cấu hình biến môi trường tại `.env`:
   ```bash
   BANKING_CLIENT_ID="casso_live_client_xxxxxxxx"
   BANKING_CLIENT_SECRET="casso_sec_xxxxxxxx"
   BANKING_WEBHOOK_URL="https://app.tichsan.site/api/banking/webhook"
   ```
4. Đăng ký Webhook endpoint trên Dashboard của đối tác với chữ ký bảo mật HMAC SHA-256.

---

## 3. Quy tắc an toàn & bảo mật (Security Principles)

- **Không lưu mật khẩu hoặc OTP ngân hàng**: Finora chỉ nhận biến động số dư qua Webhook hoặc Read-Only OAuth token.
- **Không tự động chuyển tiền**: Việc thanh toán luôn yêu cầu người dùng xác nhận trên app ngân hàng qua VietQR deep link.
- **Bảo toàn số dư**: Giao dịch nhận diện từ ngân hàng được kiểm tra trùng lặp với các giao dịch người dùng đã nhập tay trước khi ghi vào sổ.
