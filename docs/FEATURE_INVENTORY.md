# BẢN ĐỒ TÍNH NĂNG & TRẠNG THÁI (FEATURE INVENTORY) — TÍCH SẢN

Tài liệu này tổng hợp toàn bộ các phân hệ, trạng thái triển khai thực tế và cơ chế vận hành của nền tảng **Tích Sản**.

---

## 1. Danh mục Tính năng Cốt lõi

| Phân hệ | Tính năng | Trạng thái | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- |
| **0. Thương hiệu** | Tên thương hiệu Tích Sản | Hoàn thành | Đã đổi 100% trên giao diện, metadata, title, emails, landing page. |
| **1. Tổng quan Tài chính** | 7 Financial Overview Cards | Hoàn thành | Màu nền và viền phân biệt: Tài sản (Blue), Thu nhập (Emerald), Chi tiêu (Coral), Dòng tiền (Teal), Tiết kiệm (Purple), Ngân sách (Amber), Nợ (Rose). |
| **2. Tốc kế Tài chính** | Speedometer Gauges Cluster | Hoàn thành | GSAP count-up từ 0, kim xoay dưới nắp trục, 5 vùng màu sáng tương phản cao (Nguy cấp -> Xuất sắc). |
| **3. Nhận diện VIP Gold** | Gold Identity System | Hoàn thành | Dải màu Warm Amber / Champagne Gold riêng biệt cho hội viên VIP Gold. |
| **4. Gói cước & Trial** | Danh sách gói & Tặng 30 ngày | Hoàn thành | Tự động tặng 30 ngày VIP Gold khi đăng ký mới. Hết 30 ngày tự về Free, bảo toàn 100% dữ liệu. |
| **5. Xác thực (Auth)** | Đăng ký, Đăng nhập, Scrypt Hash | Hoàn thành | Băm mật khẩu bằng Scrypt timing-safe; Cookie HttpOnly. |
| **5.1. Phiên Đăng nhập** | Session 120 Ngày & Rotation | Hoàn thành | Access token 15 phút + Refresh token 120 ngày luân chuyển, băm SHA-256 trong DB, chống token reuse. |
| **6. Quản trị Server CLI** | Lệnh Bootstrap `Tichsan2953@` | Hoàn thành | Chạy qua SSH/Shell, sinh mật khẩu ngẫu nhiên mạnh, khóa chu kỳ reset 7 ngày, không lưu plaintext. |
| **6.1. Phân quyền Admin** | Bảo mật RBAC & Ẩn Menu | Hoàn thành | Không hiển thị nút Admin trên User UI/Demo; Route Admin kiểm tra xác thực quyền từ backend. |
| **7. Quản trị Doanh nghiệp** | Admin Portal | Hoàn thành | Quản lý người dùng, cấp gói thủ công, theo dõi chi phí bên thứ ba (VPS, Domain, Email, AI) & System Health. |
| **8. Thanh toán PayOS** | Cổng Pháp lý & Đối soát 2 chiều | Hoàn thành | Mặc định chặn thu tiền thật (`PAYMENTS_ENABLED=false`) hiển thị QR mẫu; Sẵn sàng SDK & Webhook khi bật cờ. |
| **9. Sổ Giao dịch** | CRUD Giao dịch & Phân trang | Hoàn thành | Ghi nhận thu/chi/chuyển khoản, hỗ trợ xuất CSV, lọc theo tài khoản/danh mục/ngày. |
| **10. Ngân sách & Hũ chi** | Quản lý Ngân sách & 6 Hũ | Hoàn thành | Cảnh báo vượt ngưỡng, thanh tiến độ trực quan, liên kết với từng danh mục chi tiêu. |
| **11. Tài sản & Đầu tư** | Smart Ledger & Vốn chưa thu hồi | Hoàn thành | Cổ phiếu HOSE/HNX, Vàng SJC, Sổ tiết kiệm ngân hàng, Bất động sản, tính lãi thực tế & dự thu. |
| **12. Trợ lý AI** | WebMCP Copilot & Action Plan | Hoàn thành | Đọc tóm tắt tài chính và tạo giao dịch 2 chiều qua giao thức Model Context Protocol. |

---

## 2. Ma trận Trạng thái Gói Dịch vụ (Plan Entitlements)

| Quyền lợi | Gói Miễn Phí (Free) | Gói Tích Sản Pro | Gói Tích Sản VIP Gold |
| :--- | :---: | :---: | :---: |
| **Số tài khoản ngân hàng & ví** | Tối đa 2 | Không giới hạn | Không giới hạn |
| **Danh mục ngân sách chi tiêu** | Tối đa 3 | Không giới hạn | Không giới hạn |
| **Giao dịch định kỳ tự động** | Bấm tay | Tự động ngầm | Tự động ngầm |
| **Định giá cổ phiếu & vàng realtime** | Không | Hỗ trợ | Hỗ trợ Realtime |
| **Smart Ledger (Vốn chưa thu hồi)** | Không | Cơ bản | Chuyên sâu 4 cấp độ |
| **Bộ đo Speedometer Gauges** | 1 gauge | 4 gauges | Đầy đủ + Khuyến nghị |
| **Trợ lý AI WebMCP** | 5 lượt/ngày | Không giới hạn | Không giới hạn + Action Plan |
| **Thời hạn dùng thử chào mừng** | — | — | **Tặng miễn phí 30 ngày** |

