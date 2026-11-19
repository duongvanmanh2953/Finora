# HƯỚNG DẪN CẤU HÌNH SUBDOMAIN & CỔNG RIÊNG (FINORA / TÍCH SẢN)

Hệ thống được kiến trúc thành **4 Container độc lập**, hiển thị phân tách rõ ràng trong `docker ps`:

| Tên Container | Vai trò | Cổng Host | Cổng Nội bộ | Subdomain tương ứng |
| :--- | :--- | :--- | :--- | :--- |
| **`finora-app`** | Ứng dụng chính (Sổ thu chi, Báo cáo, Assets) | **`7000`** | `80` | `app.tichsan.site` |
| **`finora-landing`** | Landing Page & Trang tải Android APK | **`7001`** | `80` | `tichsan.site` & `www.tichsan.site` |
| **`finora-auth`** | Phân hệ Xác thực (Đăng nhập, Đăng ký VIP) | **`7002`** | `80` | `auth.tichsan.site` |
| **`finora-api`** | Backend API Server (Node/TypeScript) | **`7003`** | `7003` | `api.tichsan.site` |

> [!NOTE]
> Tất cả các container Web (`finora-app`, `finora-landing`, `finora-auth`) đều tự động Reverse Proxy các request `/api/*` về `http://finora-api:7003` trong mạng Docker nội bộ (`finora_default`). Bạn cũng có thể mở riêng subdomain `api.tichsan.site` trỏ trực tiếp đến `finora-api`.

---

## 1. Cấu hình Cloudflare Tunnel (Cloudflare Zero Trust)

Vào trang quản lý Cloudflare Zero Trust: **Networks** -> **Tunnels** -> chọn Tunnel của bạn -> **Public Hostnames** -> **Add a public hostname**:

### Lựa chọn 1: Trỏ qua mạng Docker Network (`finora_default`)
*(Khuyên dùng khi container `cloudflared` chạy cùng máy hoặc join chung network Docker)*

| Public Hostname | Service Type | URL Service (Container:Port) |
| :--- | :--- | :--- |
| **`app.tichsan.site`** | `HTTP` | **`finora-app:80`** |
| **`tichsan.site`** | `HTTP` | **`finora-landing:80`** |
| **`www.tichsan.site`** | `HTTP` | **`finora-landing:80`** |
| **`auth.tichsan.site`** | `HTTP` | **`finora-auth:80`** |
| **`api.tichsan.site`** | `HTTP` | **`finora-api:7003`** |

### Lựa chọn 2: Trỏ qua Localhost / Host Port
*(Hoạt động 100% trong mọi trường hợp)*

| Public Hostname | Service Type | URL Service (Host:Port) |
| :--- | :--- | :--- |
| **`app.tichsan.site`** | `HTTP` | **`localhost:7000`** (hoặc `127.0.0.1:7000`) |
| **`tichsan.site`** | `HTTP` | **`localhost:7001`** (hoặc `127.0.0.1:7001`) |
| **`www.tichsan.site`** | `HTTP` | **`localhost:7001`** (hoặc `127.0.0.1:7001`) |
| **`auth.tichsan.site`** | `HTTP` | **`localhost:7002`** (hoặc `127.0.0.1:7002`) |
| **`api.tichsan.site`** | `HTTP` | **`localhost:7003`** (hoặc `127.0.0.1:7003`) |

---

## 2. Kiểm tra trạng thái trong Docker

Chạy lệnh:
```bash
docker ps -f name=finora
```

Kết quả hiển thị phân tách rõ ràng:
```text
CONTAINER ID   IMAGE                  PORTS                                   NAMES
xxxxxxxxxxxx   finora-finora-app      7000/tcp, 0.0.0.0:7000->80/tcp         finora-app
yyyyyyyyyyyy   finora-finora-landing  7001/tcp, 0.0.0.0:7001->80/tcp         finora-landing
zzzzzzzzzzzz   finora-finora-auth     7002/tcp, 0.0.0.0:7002->80/tcp         finora-auth
wwwwwwwwwwww   finora-finora-api      0.0.0.0:7003->7003/tcp                  finora-api
```

### Kiểm tra trực tiếp các cổng cục bộ:
- App chính: `curl -I http://localhost:7000`
- Landing page: `curl -I http://localhost:7001`
- Auth login: `curl -I http://localhost:7002`
- Backend API Health: `curl http://localhost:7003/health`
- Tải file APK Android: `http://localhost:7001/downloads/finora-latest.apk`

---

## 3. Khởi chạy và Build

```bash
# Cách 1: Sử dụng build script tự động
sh build.sh web

# Cách 2: Sử dụng Docker Compose
docker compose up -d --build
```
