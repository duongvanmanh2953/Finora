# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG (DEPLOYMENT GUIDE) — TÍCH SẢN

Tài liệu này cung cấp hướng dẫn đóng gói Docker, cấu hình Nginx reverse proxy, quản lý tiến trình và quy trình triển khai Production cho **Tích Sản**.

---

## 1. Yêu cầu Hệ thống Tối thiểu
- **Hệ điều hành**: Ubuntu 22.04 LTS / 24.04 LTS, Debian 12, hoặc Alpine Linux.
- **CPU / RAM**: Tối thiểu 1 vCPU, 2GB RAM (khuyến nghị 2 vCPU, 4GB RAM khi chạy Docker build).
- **Phần mềm**: Docker 24+, Docker Compose v2, Node.js v20.18+ (nếu chạy trực tiếp).

---

## 2. Triển khai bằng Docker Compose (Khuyên dùng)

### Bước 1: Clone mã nguồn và cấu hình biến môi trường
```bash
git clone <repo-url> /opt/tich-san
cd /opt/tich-san

# Tạo file cấu hình từ template production
cp .env.production.example .env
nano .env # Nhập các API keys và mật khẩu bí mật
```

### Bước 2: Build Image và Khởi chạy Container
```bash
docker compose build --no-cache
docker compose up -d
```

### Bước 3: Kiểm tra Trạng thái Container
```bash
docker compose ps
docker compose logs -f finora
```

### Bước 4: Khởi tạo tài khoản Admin đầu tiên
Sau khi container khởi chạy, vào shell container để lấy mật khẩu Admin:
```bash
docker compose exec finora ./Tichsan2953@
```

---

## 3. Triển khai Trực tiếp trên VPS (Native Node.js + Nginx)

### Bước 1: Cài đặt Dependencies và Build Frontend
```bash
pnpm install --frozen-lockfile
pnpm build
```

### Bước 2: Quản lý Tiến trình với PM2
```bash
npm install -g pm2
pm2 start "npx vite preview --host 0.0.0.0 --port 3000" --name "tich-san-app"
pm2 save
pm2 startup
```

### Bước 3: Cấu hình Nginx Reverse Proxy
Tạo file `/etc/nginx/sites-available/tichsan.vn`:
```nginx
server {
    listen 80;
    server_name tichsan.vn www.tichsan.vn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Kích hoạt SSL với Certbot:
```bash
sudo certbot --nginx -d tichsan.vn -d www.tichsan.vn
```

---

## 4. Sao lưu & Phục hồi Dữ liệu (Backup & Rollback)

### 4.1. Sao lưu tự động
Dữ liệu người dùng, phiên đăng nhập và đơn hàng được lưu tại `.data/finora_db.json`. Tạo cron-job sao lưu hàng ngày:
```bash
# Thêm vào crontab: 0 3 * * * (chạy lúc 3h sáng mỗi ngày)
0 3 * * * tar -czf /backup/tichsan_db_$(date +\%F).tar.gz /opt/tich-san/.data/
```

### 4.2. Quy trình Rollback khi có sự cố
1. Dừng container hoặc tiến trình PM2:
   ```bash
   docker compose down
   ```
2. Phục hồi tệp dữ liệu gần nhất:
   ```bash
   tar -xzf /backup/tichsan_db_YYYY-MM-DD.tar.gz -C /
   ```
3. Khởi động lại ứng dụng:
   ```bash
   docker compose up -d
   ```

