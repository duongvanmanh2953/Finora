# QUY TRÌNH KHỞI TẠO & PHỤC HỒI QUẢN TRỊ VIÊN (ADMIN BOOTSTRAP & RECOVERY) — TÍCH SẢN

Tài liệu này hướng dẫn Quản trị viên hệ thống cách sử dụng công cụ CLI trực tiếp trên máy chủ để cấp mới hoặc luân chuyển mật khẩu Admin cho nền tảng **Tích Sản**.

---

## 1. Triết Lý Vận Hành Quản Trị
- **Không có backdoor**: Hệ thống không lưu bất kỳ mật khẩu Admin nào dưới dạng văn bản thô (plaintext) hay file cấu hình.
- **Không có endpoint Web công khai**: Không thể đăng ký hay đặt lại mật khẩu Admin từ trình duyệt web.
- **Yêu cầu quyền truy cập Shell/SSH**: Chỉ người có quyền truy cập trực tiếp vào máy chủ hệ điều hành mới có thể thực thi lệnh.

---

## 2. Hướng Dẫn Thực Thi Lệnh `Tichsan2953@`

### Bước 1: SSH vào máy chủ Production
```bash
ssh user@your-server-ip
```

### Bước 2: Điều hướng vào thư mục dự án Tích Sản
```bash
cd /app/tich-san # Hoặc đường dẫn thư mục cài đặt dự án
```

### Bước 3: Chạy lệnh Bootstrap
Bạn có thể chạy trực tiếp lệnh:
```bash
./Tichsan2953@
```
*Hoặc thông qua script:*
```bash
bash scripts/admin-bootstrap.sh
```

*(Tùy chọn) Để lệnh có thể gọi từ bất kỳ đâu trên máy chủ:*
```bash
sudo ln -sf "$(pwd)/Tichsan2953@" /usr/local/bin/Tichsan2953@
```
Sau đó chỉ cần gõ `Tichsan2953@` từ terminal.

---

## 3. Cơ Chế Hoạt Động & Chu Kỳ 7 Ngày

### 3.1. Lần chạy đầu tiên (Initial Bootstrap)
- Hệ thống kiểm tra database, nếu chưa có tài khoản Admin sẽ tự động khởi tạo tài khoản Quản trị viên tối cao:
  - Email: Lấy từ `ADMIN_BOOTSTRAP_EMAIL` trong `.env` (mặc định: `admin@tichsan.vn`).
  - Mật khẩu: Sinh ngẫu nhiên độ dài 16 ký tự an toàn cao (ví dụ: `TS-k9F!2mQ8#pLz`).
  - Mã hóa: Lưu vào database bằng hàm băm `scrypt`.
  - In thông tin ra terminal **đúng một lần duy nhất**.
  - Đánh dấu cờ `mustChangePassword: true` (bắt buộc đổi mật khẩu sau khi đăng nhập).

### 3.2. Các lần chạy tiếp theo (Password Rotation)
- Hệ thống kiểm tra thời điểm reset gần nhất:
  - **Nếu CHƯA ĐỦ 7 NGÀY**:
    Lệnh lập tức dừng lại và in thông báo lỗi:
    ```text
    [LỖI TỪ CHỐI THỰC HIỆN]
    Chỉ được phép reset mật khẩu Admin tối đa 1 lần mỗi 7 ngày. Bạn cần đợi thêm X ngày nữa.
    ```
    *Cơ chế này ngăn ngừa kẻ xấu lạm dụng quyền shell để liên tục xóa mật khẩu của các Admin khác.*
  - **Nếu ĐÃ ĐỦ 7 NGÀY**:
    1. Sinh mật khẩu ngẫu nhiên mới.
    2. Cập nhật mã băm mới vào database.
    3. Thu hồi toàn bộ phiên đăng nhập Admin cũ trên mọi thiết bị (`revokeAllUserSessions`).
    4. Cập nhật lại mốc thời gian khóa 7 ngày tiếp theo.
    5. In thông tin ra màn hình.

---

## 4. Xử Lý Sau Khi Nhận Mật Khẩu
1. Mở trình duyệt và truy cập: `https://tichsan.vn/auth/login`.
2. Đăng nhập bằng email `admin@tichsan.vn` và mật khẩu vừa nhận.
3. Khi đăng nhập thành công với vai trò Admin, nút **Trang Admin** sẽ xuất hiện trên thanh điều hướng.
4. Truy cập giao diện Quản trị tại: `https://tichsan.vn/admin` để quản lý người dùng, gói cước và chi phí vận hành.

