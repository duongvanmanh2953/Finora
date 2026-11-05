#!/usr/bin/env bash
set -e

# ==============================================================================
#                 FINORA / TÍCH SẢN — SCRIPT TỰ ĐỘNG BUILD & RUN DOCKER
# ==============================================================================

echo ""
echo "======================================================================"
echo "          FINORA / TÍCH SẢN — AUTO PULL & RUN DOCKER DEPLOYMENT       "
echo "======================================================================"
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# 1. KÉO CODE MỚI NHẤT TỪ GIT
echo ">>> [1/4] Đang kiểm tra và kéo mã nguồn mới nhất từ Git..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  echo "    Branch hiện tại: $BRANCH_NAME"
  git pull origin "$BRANCH_NAME" || {
    echo "    [Cảnh báo] git pull không thành công hoặc không có remote upstream. Tiếp tục build với mã nguồn hiện tại."
  }
else
  echo "    [Thông tin] Không tìm thấy Git repository, tiếp tục build thư mục hiện tại."
fi

# 2. KIỂM TRA MÔI TRƯỜNG DOCKER
echo ""
echo ">>> [2/4] Kiểm tra môi trường Docker daemon..."
if ! command -v docker >/dev/null 2>&1; then
  echo "    [LỖI] Docker chưa được cài đặt trên máy chủ!"
  echo "    Vui lòng cài đặt Docker: https://docs.docker.com/engine/install/"
  exit 1
fi

# 3. DỪNG VÀ DỌN DẸP CONTAINER CŨ NẾU ĐANG CHẠY
echo ""
echo ">>> [3/4] Dừng container phiên bản cũ (nếu có)..."
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose down 2>/dev/null || true
elif docker compose version >/dev/null 2>&1; then
  docker compose down 2>/dev/null || true
else
  docker stop finora-app 2>/dev/null || true
  docker rm finora-app 2>/dev/null || true
fi

# 4. BUILD VÀ CHẠY DOCKER CONTAINER MỚI NHẤT
echo ""
echo ">>> [4/4] Tiến hành Build Docker Image và Khởi chạy Container..."
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose up -d --build
elif docker compose version >/dev/null 2>&1; then
  docker compose up -d --build
else
  echo "    Đang build image finora-app..."
  docker build -t finora-app .
  echo "    Đang chạy container finora-app trên cổng 8080..."
  docker run -d --name finora-app -p 8080:80 --restart unless-stopped finora-app
fi

echo ""
echo "======================================================================"
echo "               TRIỂN KHAI DOCKER HOÀN TẤT THÀNH CÔNG!                 "
echo "======================================================================"
echo "  • Tên container  : finora-app"
echo "  • Cổng truy cập  : http://localhost:8080 (hoặc http://<IP-server>:8080)"
echo "  • Kiểm tra status: docker ps -f name=finora-app"
echo "  • Xem logs       : docker logs -f finora-app"
echo "======================================================================"
echo ""

