# FINORA TELEGRAM BOT INTEGRATION GUIDE

Tài liệu này hướng dẫn cách cấu hình và khởi chạy bot Telegram để ghi chép giao dịch nhanh bằng văn bản hoặc hình ảnh vào Finora.

---

## 1. Trạng thái Hiện tại (Architectural Status)

- **Trạng thái**: **BLOCKED / SẴN SÀNG KẾT NỐI**
- **Nguyên nhân**: Cần cung cấp biến môi trường `TELEGRAM_BOT_TOKEN` từ tài khoản BotFather thực tế của quản trị viên. Toàn bộ kiến trúc adapter, bộ giải mã câu lệnh NLP tiếng Việt, chống trùng lặp (Idempotency) và liên kết phiên OTP (`FN-XXXXXX`) đã được cài đặt và kiểm thử 100%.

---

## 2. Các bước cấu hình BotFather

1. Mở Telegram và tìm kiếm bot `@BotFather`.
2. Gửi lệnh `/newbot` và đặt tên bot:
   - Tên hiển thị: `Finora Finance Assistant`
   - Username: `FinoraFinanceBot` (hoặc tên tương tự)
3. BotFather sẽ trả về chuỗi API Token (ví dụ: `7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
4. Thêm các biến môi trường vào `.env` hoặc file cấu hình server:
   ```bash
   TELEGRAM_BOT_TOKEN="7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
   TELEGRAM_BOT_USERNAME="FinoraFinanceBot"
   TELEGRAM_WEBHOOK_URL="https://app.tichsan.site/api/telegram/webhook"
   ```

---

## 3. Thiết lập Webhook với Telegram API

Chạy lệnh curl một lần duy nhất để đăng ký Webhook URL:
```bash
curl -F "url=https://app.tichsan.site/api/telegram/webhook" https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook
```

---

## 4. Quy trình liên kết tài khoản an toàn

1. Người dùng mở web Finora -> Vào **Cài đặt** -> Bấm **"Kết nối Telegram Bot"**.
2. Hệ thống sinh mã OTP ngẫu nhiên `FN-XXXXXX` có hiệu lực trong 15 phút.
3. Người dùng bấm liên kết mở Telegram: `https://t.me/FinoraFinanceBot?start=FN-XXXXXX`.
4. Bot xác thực token, gán `chat_id` với `userId` của Finora và lưu vào cơ sở dữ liệu.
5. Người dùng gửi tin nhắn nhanh bất kỳ lúc nào:
   - `Chi 45k cà phê Highland`
   - `Ăn trưa 85k, nhận 3 triệu tiền freelance`
   - Gửi ảnh chụp hóa đơn / biên lai thanh toán.
6. Bot trả về thông tin đối soát và chờ người dùng bấm **Xác nhận** trước khi ghi vào sổ giao dịch.
