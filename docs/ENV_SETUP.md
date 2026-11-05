# HƯỚNG DẪN THIẾT LẬP BIẾN MÔI TRƯỜNG (ENV SETUP GUIDE) — TÍCH SẢN

Tài liệu này hướng dẫn chi tiết cách đăng ký, lấy API Keys từ các nhà cung cấp dịch vụ chính thức và cấu hình vào tệp `.env` trên máy chủ hoặc môi trường phát triển cục bộ của hệ thống **Tích Sản**.

---

## 1. Quy tắc Thiết lập Chung
1. Sao chép tệp mẫu:
   ```bash
   cp .env.example .env
   ```
2. Mở tệp `.env` bằng trình chỉnh sửa (ví dụ: `nano .env` hoặc `vim .env`).
3. Điền các giá trị thực tế tương ứng.
4. **Tuyệt đối không** commit tệp `.env` lên Git repository.

---

## 2. Hướng dẫn lấy API Keys theo từng dịch vụ

### 2.1. Google OAuth (Đăng nhập Google)
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo dự án mới hoặc chọn dự án hiện có (ví dụ: `Tich-San-Platform`).
3. Điều hướng tới: **APIs & Services** > **OAuth consent screen**:
   - Chọn loại User Type: **External**.
   - Điền thông tin ứng dụng: Tên ứng dụng `Tích Sản`, Email hỗ trợ `hotro@tichsan.vn`.
4. Điều hướng tới: **APIs & Services** > **Credentials**:
   - Bấm **Create Credentials** > chọn **OAuth client ID**.
   - Application type: **Web application**.
   - Authorized JavaScript origins: `https://tichsan.vn` (hoặc `http://localhost:5173` khi test dev).
   - Authorized redirect URIs: `https://tichsan.vn/api/auth/google/callback` (hoặc `http://localhost:5173/api/auth/google/callback`).
5. Sao chép `Client ID` và `Client Secret` rồi dán vào `.env`:
   ```ini
   GOOGLE_OAUTH_ENABLED=true
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_CALLBACK_URL=https://tichsan.vn/api/auth/google/callback
   ```

### 2.2. Facebook OAuth (Đăng nhập Facebook)
1. Truy cập [Meta for Developers](https://developers.facebook.com/).
2. Chọn **My Apps** > **Create App** > chọn **Authenticate and request data from users with Facebook Login**.
3. Điền App Name: `Tích Sản`.
4. Trong phần Cài đặt Facebook Login:
   - Valid OAuth Redirect URIs: `https://tichsan.vn/api/auth/facebook/callback`.
5. Vào **App Settings** > **Basic**:
   - Sao chép `App ID` và `App Secret`.
6. Cấu hình vào `.env`:
   ```ini
   FACEBOOK_OAUTH_ENABLED=true
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   FACEBOOK_CALLBACK_URL=https://tichsan.vn/api/auth/facebook/callback
   ```

### 2.3. Email SMTP / Resend (Gửi Email Xác minh & Quên mật khẩu)
**Cách 1: Sử dụng Resend (Khuyên dùng)**
1. Truy cập [Resend.com](https://resend.com/) và tạo tài khoản.
2. Vào **API Keys** > bấm **Create API Key** (quyền Full Access).
3. Thêm và xác minh tên miền gửi (ví dụ: `tichsan.vn`) qua các bản ghi DNS (DKIM, SPF).
4. Cấu hình vào `.env`:
   ```ini
   MAIL_PROVIDER=smtp
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASSWORD=re_your_api_key_here
   SMTP_FROM_EMAIL=hotro@tichsan.vn
   SMTP_FROM_NAME=Tich San Support
   ```

### 2.4. PayOS Payment Gateway (Thanh toán VietQR)
> **Lưu ý Pháp lý**: Mặc định `PAYMENTS_ENABLED=false` và `LEGAL_COMPLIANCE_APPROVED=false`. Chỉ bật khi hoàn tất điều kiện pháp lý, thuế (Luật 149/2025/QH15) và hóa đơn điện tử (Nghị định 70/2025/NĐ-CP).

1. Đăng ký tài khoản doanh nghiệp hoặc hộ kinh doanh tại [PayOS](https://payos.vn/).
2. Tạo kênh thanh toán mới trong Dashboard PayOS.
3. Lấy 3 thông số định danh trong phần **Kênh thanh toán**:
   - `Client ID`
   - `Api Key`
   - `Checksum Key`
4. Cài đặt Webhook URL: `https://tichsan.vn/api/payment/webhook`.
5. Cấu hình vào `.env`:
   ```ini
   PAYMENTS_ENABLED=false               # Đổi thành true khi sẵn sàng
   PAYOS_ENABLED=false                  # Đổi thành true khi sẵn sàng
   LEGAL_COMPLIANCE_APPROVED=false      # Xác nhận tuân thủ pháp lý
   PAYOS_CLIENT_ID=your_payos_client_id
   PAYOS_API_KEY=your_payos_api_key
   PAYOS_CHECKSUM_KEY=your_payos_checksum_key
   PAYOS_WEBHOOK_URL=https://tichsan.vn/api/payment/webhook
   ```

### 2.5. Finnhub (Dữ liệu Định giá Thị trường Chứng khoán)
1. Đăng ký tài khoản miễn phí tại [Finnhub.io](https://finnhub.io/).
2. Sao chép API Key từ trang cá nhân.
3. Cấu hình vào `.env`:
   ```ini
   FINNHUB_API_KEY=your_finnhub_key_here
   FINNHUB_BASE_URL=https://finnhub.io/api/v1
   ```

### 2.6. Google Gemini AI (Trợ lý Phân tích Dòng tiền)
1. Truy cập [Google AI Studio](https://aistudio.google.com/).
2. Bấm **Get API key** và tạo key mới.
3. Cấu hình vào `.env`:
   ```ini
   AI_PROVIDER=gemini
   AI_API_KEY=AIzaSy...
   ```

---

## 3. Khởi động và Xác thực cấu hình
Sau khi điền đủ các biến môi trường:
```bash
# Chạy ở chế độ phát triển
npm run dev

# Kiểm tra sức khỏe hệ thống
curl http://localhost:5173/api/admin/system-health
```
Hệ thống sẽ tự động quét biến môi trường và báo cáo trạng thái `healthy` hoặc `not_configured` cho từng dịch vụ mà không làm gián đoạn ứng dụng.

