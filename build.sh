#!/usr/bin/env bash
set -e

# ==============================================================================
#                 FINORA / TÍCH SẢN — SCRIPT TỰ ĐỘNG BUILD & RUN DOCKER
# ==============================================================================

echo ""
echo "======================================================================"
echo "          FINORA / TÍCH SẢN — AUTO PULL, BUILD APK & RUN DOCKER       "
echo "======================================================================"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 1. KÉO CODE MỚI NHẤT TỪ GIT (XỬ LÝ AN TOÀN TRÁNH CONFLICT)
echo ">>> [1/5] Đang kiểm tra và kéo mã nguồn mới nhất từ Git..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  echo "    Branch hiện tại: $BRANCH_NAME"
  
  # Kiểm tra thay đổi uncommitted
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "    [Thông tin] Đang tạm cất (stash) thay đổi cục bộ trước khi kéo code mới..."
    git stash push -m "build-sh-auto-stash-$(date +%s)" || true
  fi

  git pull origin "$BRANCH_NAME" || {
    echo "    [Cảnh báo] git pull không thành công. Tiếp tục build với mã nguồn hiện tại."
  }
else
  echo "    [Thông tin] Không tìm thấy Git repository, tiếp tục build thư mục hiện tại."
fi

# 2. KIỂM TRA MÔI TRƯỜNG DOCKER
echo ""
echo ">>> [2/5] Kiểm tra môi trường Docker daemon..."
if ! command -v docker >/dev/null 2>&1; then
  echo "    [LỖI] Docker chưa được cài đặt trên máy chủ!"
  echo "    Vui lòng cài đặt Docker: https://docs.docker.com/engine/install/"
  exit 1
fi

# 3. BIÊN DỊCH VÀ CẬP NHẬT ANDROID APP (APK)
echo ""
echo ">>> [3/5] Kiểm tra và Biên dịch Android App (.APK)..."
mkdir -p public/downloads
if [ -f "./android/gradlew" ] && command -v java >/dev/null 2>&1; then
  echo "    Phát hiện Java & Android Gradle. Đang tiến hành build APK..."
  (
    npm run build
    npx cap sync android
    ./android/gradlew -p android assembleDebug
    if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
      cp android/app/build/outputs/apk/debug/app-debug.apk public/downloads/finora-latest.apk
      echo "    ✓ APK mới đã được biên dịch thành công và cập nhật vào public/downloads/finora-latest.apk"
    fi
  ) || {
    echo "    [Cảnh báo] Quá trình biên dịch APK gặp sự cố hoặc thiếu SDK. Sẽ sử dụng bản APK hiện có trong public/downloads/."
  }
else
  echo "    [Thông tin] Không tìm thấy môi trường Java cục bộ. Sử dụng APK đã có trong public/downloads/finora-latest.apk."
fi

# 4. DỪNG VÀ DỌN DẸP CONTAINER CŨ NẾU ĐANG CHẠY
echo ""
echo ">>> [4/5] Dừng container phiên bản cũ (nếu có)..."
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose down 2>/dev/null || true
elif docker compose version >/dev/null 2>&1; then
  docker compose down 2>/dev/null || true
else
  docker stop finora-app 2>/dev/null || true
  docker rm finora-app 2>/dev/null || true
fi

# 5. BUILD VÀ CHẠY DOCKER CONTAINER MỚI NHẤT
echo ""
echo ">>> [5/5] Tiến hành Build Docker Image và Khởi chạy Container..."
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose build --no-cache
  docker-compose up -d
elif docker compose version >/dev/null 2>&1; then
  docker compose build --no-cache
  docker compose up -d
else
  echo "    Đang build image finora-app (no-cache)..."
  docker build --no-cache -t finora-app .
  echo "    Đang chạy container finora-app trên cổng 8080..."
  docker run -d --name finora-app -p 8080:80 --restart unless-stopped finora-app
fi

echo ""
echo "======================================================================"
echo "               TRIỂN KHAI HOÀN TẤT THÀNH CÔNG!                        "
echo "======================================================================"
echo "  • Tên container  : finora-app"
echo "  • Cổng truy cập  : http://localhost:8080 (hoặc http://<IP-server>:8080)"
echo "  • Tải APK Android: http://localhost:8080/downloads/finora-latest.apk"
echo "  • Kiểm tra status: docker ps -f name=finora-app"
echo "  • Xem logs       : docker logs -f finora-app"
echo "======================================================================"
echo ""
