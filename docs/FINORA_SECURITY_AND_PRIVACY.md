# FINORA — SECURITY, PRIVACY & COMPLIANCE SPECIFICATION
## Zero-Trust Architecture, Role-Based Access Control & Immutable Audit Logging

- **Document ID:** `docs/FINORA_SECURITY_AND_PRIVACY.md`
- **Revision:** 2.0.0
- **Compliance Standards:** OWASP Top 10, Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân (PDPD)

---

## 1. NGUYÊN TẮC BẢO MẬT & BẢO VỆ DỮ LIỆU CÁ NHÂN (PDPD COMPLIANCE)

Tuân thủ nghiêm ngặt **Nghị định 13/2023/NĐ-CP** của Chính phủ Việt Nam về bảo vệ dữ liệu cá nhân, Finora áp dụng mô hình **Zero-Trust**:
1. **Dữ liệu tài chính là Dữ liệu Cá nhân Nhạy cảm:** Thông tin về tiền lương, tài khoản ngân hàng, tài sản ròng, và các khoản nợ được xếp vào cấp độ bảo vệ cao nhất.
2. **Nguyên tắc Phân tách Dữ liệu Đa tầng (Data Isolation):**
   - Mọi bản ghi trong cơ sở dữ liệu của người dùng đều gắn với một `userId` duy nhất.
   - Các truy vấn cơ sở dữ liệu bắt buộc phải được lọc qua ràng buộc `WHERE user_id = :current_user_id`.
   - Cơ chế Row-Level Security (RLS) của cơ sở dữ liệu ngăn chặn việc một phiên đăng nhập của người dùng A truy cập được bản ghi của người dùng B kể cả khi có lỗ hổng IDOR (Insecure Direct Object Reference) ở tầng ứng dụng.
3. **Mã hóa Toàn diện:**
   - Dữ liệu truyền tải trên mạng (Data in Transit): Bắt buộc giao thức TLS 1.3 với chuẩn mã hóa HTTPS/WSS.
   - Dữ liệu lưu trữ (Data at Rest): Mã hóa AES-256 cho toàn bộ khối lưu trữ cơ sở dữ liệu và các tệp tài liệu trong Hộp đen tài chính (Financial Vault).
   - Khóa API và Token kết nối công ty chứng khoán: Mã hóa đối xứng AES-256-GCM với khóa chủ được lưu trữ an toàn trong Key Management Service (KMS), không bao giờ hiển thị nguyên bản dạng plaintext.

---

## 2. MA TRẬN PHÂN QUYỀN VAI TRÒ QUẢN TRỊ (RBAC MATRIX)

Hệ thống thiết lập 6 vai trò quản trị rõ ràng với nguyên tắc cấp quyền tối thiểu (Principle of Least Privilege):

| Quyền hạn / Tài nguyên | Super Admin | Finance Admin | Support Admin | Operations Admin | Business Analyst | Read-only Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Quản trị Tài khoản Admin** | Toàn quyền | Không | Không | Không | Không | Không |
| **Xem Doanh thu SaaS (MRR, ARR)** | Xem & Xuất | Toàn quyền | Không | Không | Chỉ xem | Chỉ xem |
| **Quản lý Gói cước & Giá** | Toàn quyền | Tạo & Sửa | Không | Không | Chỉ xem | Chỉ xem |
| **Quản lý Hóa đơn MISA & Thuế** | Toàn quyền | Toàn quyền | Không | Không | Không | Chỉ xem |
| **Khóa / Mở khóa User vi phạm** | Có | Không | Có (Cần duyệt) | Không | Không | Không |
| **Xem Nhật ký Hệ thống (Logs)** | Toàn quyền | Không | Xem lỗi user | Toàn quyền | Không | Chỉ xem |
| **Quản lý Cấu hình API Đối tác** | Toàn quyền | Không | Không | Toàn quyền | Không | Không |
| **XEM DỮ LIỆU TÀI CHÍNH USER** | **CẤM** | **CẤM** | **CẤM** | **CẤM** | **CẤM** | **CẤM** |

---

## 3. XÁC THỰC QUẢN TRỊ VIÊN & PHIÊN LÀM VIỆC AN TOÀN

1. **Xác thực Đa yếu tố Bắt buộc (Mandatory 2FA):**
   - 100% tài khoản truy cập vào phân hệ `/admin/*` bắt buộc phải cài đặt 2FA qua ứng dụng Google Authenticator / Microsoft Authenticator (chuẩn TOTP RFC 6238).
   - Đăng nhập chỉ thành công khi nhập đúng Mật khẩu mạnh (tối thiểu 12 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt) kèm mã 6 số TOTP.
2. **Thời gian Sống của Phiên làm việc (Session Lifetime):**
   - Phiên làm việc của Admin có thời gian sống ngắn: Tự động khóa sau **15 phút không hoạt động (Inactivity Timeout)**.
   - Thời gian tồn tại tối đa của Refresh Token: **8 giờ**, sau đó bắt buộc phải xác thực lại danh tính.
3. **Phòng chống Tấn công Tự động (Rate Limiting & Brute-Force Protection):**
   - Giới hạn tối đa 5 lần thử đăng nhập sai liên tiếp trên một địa chỉ IP trong 15 phút. Vượt quá sẽ khóa tạm thời IP đó trong 30 phút.

---

## 4. NHẬT KÝ KIỂM TOÁN BẤT BIẾN (IMMUTABLE AUDIT LOGS)

Mọi thao tác quản trị đều được ghi lại vào bảng kiểm toán chuyên dụng (`audit_logs`) với các thuộc tính:
- `id`: Định danh duy nhất (UUIDv4).
- `adminId`: Mã Quản trị viên thực hiện hành động.
- `adminEmail`: Email của Quản trị viên.
- `action`: Tên hành vi (VD: `USER_SUSPEND`, `PLAN_PRICE_UPDATE`, `INVOICE_ISSUE`, `PROVIDER_STATUS_TOGGLE`).
- `resourceType`: Loại tài nguyên tác động (`User`, `SubscriptionPlan`, `BusinessInvoice`, `ProviderConfig`).
- `resourceId`: Mã định danh đối tượng bị tác động.
- `ipAddress`: Địa chỉ IP thực hiện (IPv4/IPv6).
- `userAgent`: Thông tin trình duyệt/thiết bị.
- `previousState`: Trạng thái dữ liệu trước khi thay đổi (JSON).
- `newState`: Trạng thái dữ liệu sau khi thay đổi (JSON).
- `timestamp`: Dấu thời gian chuẩn ISO 8601 theo múi giờ UTC.

### Quy tắc Toàn vẹn Nhật ký:
Bảng `audit_logs` chỉ hỗ trợ thao tác `INSERT`, **TUYỆT ĐỐI NGHIÊM CẤM lệnh `UPDATE` hoặc `DELETE`** trên bảng này kể cả đối với Super Admin. Nhật ký được đồng bộ định kỳ sang kho lưu trữ độc lập để phục vụ kiểm toán an ninh.

