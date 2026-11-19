#!/usr/bin/env bash

# Tự động chuyển sang bash nếu người dùng chạy bằng "sh build.sh"
if [ -z "$BASH_VERSION" ]; then
  exec bash "$0" "$@"
fi

set -e

# ==============================================================================
#                 FINORA / TÍCH SẢN — SCRIPT BUILD & TRIỂN KHAI
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Màu sắc hiển thị
C_RESET='\033[0m'
C_BOLD='\033[1m'
C_GREEN='\033[32m'
C_BLUE='\033[34m'
C_CYAN='\033[36m'
C_YELLOW='\033[33m'
C_RED='\033[31m'

print_header() {
  echo -e "${C_CYAN}======================================================================${C_RESET}"
  echo -e "${C_BOLD}${C_GREEN}              FINORA / TÍCH SẢN — BUILD TOOLKIT                       ${C_RESET}"
  echo -e "${C_CYAN}======================================================================${C_RESET}"
  echo ""
}

print_help() {
  echo "Cách sử dụng:"
  echo "  ./build.sh [chế_độ] [tùy_chọn]"
  echo "  sh build.sh [chế_độ] [tùy_chọn]"
  echo ""
  echo "Các chế độ [chế_độ]:"
  echo "  app, android, apk      : Chỉ build ứng dụng Android (.APK)"
  echo "  web, docker            : Chỉ build & chạy bản Web trên Docker"
  echo "  all, both              : Build cả Android App (.APK) và Web Docker"
  echo "  dist, frontend         : Chỉ biên dịch mã nguồn Web ra thư mục dist/"
  echo "  (không truyền tham số) : Hiển thị menu tương tác để lựa chọn"
  echo ""
  echo "Tùy chọn [tùy_chọn]:"
  echo "  --pull                 : Tự động kéo mã nguồn mới nhất từ Git trước khi build"
  echo "  --no-pull              : Bỏ qua bước git pull (mặc định nếu không chỉ định)"
  echo "  -h, --help             : Hiển thị hướng dẫn này"
  echo ""
  echo "Ví dụ:"
  echo "  sh build.sh app        # Build ngay file APK cho điện thoại Android"
  echo "  sh build.sh web        # Build và khởi chạy Docker container Web"
  echo "  sh build.sh all        # Build cả APK và Docker"
  echo "  sh build.sh            # Mở menu tương tác chọn 1, 2, 3 hoặc 4"
  echo ""
}

# 1. PHÁT HIỆN PACKAGE MANAGER (Ưu tiên pnpm -> npm)
detect_package_manager() {
  if command -v pnpm >/dev/null 2>&1; then
    PKG_MGR="pnpm"
    RUN_CMD="pnpm"
    EXEC_CMD="pnpm exec"
  elif command -v npm >/dev/null 2>&1; then
    PKG_MGR="npm"
    RUN_CMD="npm run"
    EXEC_CMD="npx"
  else
    echo -e "${C_RED}[LỖI] Không tìm thấy pnpm hoặc npm trên máy! Vui lòng cài đặt Node.js & pnpm/npm.${C_RESET}"
    exit 1
  fi
}

# 2. CẤU HÌNH MÔI TRƯỜNG ANDROID SDK & JAVA
setup_android_env() {
  # Đọc từ android/local.properties nếu có
  if [ -f "android/local.properties" ]; then
    LOCAL_SDK=$(grep -E '^\s*sdk\.dir' android/local.properties | cut -d'=' -f2 | tr -d ' \r\n')
    if [ -n "$LOCAL_SDK" ] && [ -d "$LOCAL_SDK" ]; then
      export ANDROID_HOME="$LOCAL_SDK"
      export ANDROID_SDK_ROOT="$LOCAL_SDK"
    fi
  fi

  # Fallback kiểm tra các đường dẫn phổ biến nếu chưa có ANDROID_HOME
  if [ -z "$ANDROID_HOME" ]; then
    if [ -d "$HOME/Android/Sdk" ]; then
      export ANDROID_HOME="$HOME/Android/Sdk"
      export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
    elif [ -d "/usr/lib/android-sdk" ]; then
      export ANDROID_HOME="/usr/lib/android-sdk"
      export ANDROID_SDK_ROOT="/usr/lib/android-sdk"
    fi
  fi

  if [ -n "$ANDROID_HOME" ]; then
    export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/tools"
  fi
}

# 3. KÉO CODE TỪ GIT (NẾU ĐƯỢC BẬT)
do_git_pull() {
  echo -e "${C_BLUE}>>> [Git] Đang kiểm tra mã nguồn...${C_RESET}"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo "    Branch hiện tại: $BRANCH_NAME"
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
      echo -e "${C_YELLOW}    [Thông tin] Tạm cất (stash) thay đổi cục bộ trước khi kéo code mới...${C_RESET}"
      git stash push -m "build-sh-auto-stash-$(date +%s)" || true
    fi
    git pull origin "$BRANCH_NAME" || {
      echo -e "${C_YELLOW}    [Cảnh báo] git pull không thành công. Tiếp tục build với mã nguồn hiện tại.${C_RESET}"
    }
  else
    echo "    [Thông tin] Không tìm thấy Git repository, tiếp tục build thư mục hiện tại."
  fi
}

# 4. BIÊN DỊCH BẢN WEB FRONTEND RA THƯ MỤC DIST/
build_web_dist() {
  echo ""
  echo -e "${C_BLUE}>>> Đang biên dịch Web Frontend (Vite build)...${C_RESET}"
  detect_package_manager
  $RUN_CMD build
  echo -e "${C_GREEN}✓ Web frontend đã được build thành công vào thư mục dist/${C_RESET}"
}

# 5. BIÊN DỊCH ANDROID APP (APK)
build_android_apk() {
  echo ""
  echo -e "${C_BLUE}>>> Đang tiến hành build ứng dụng Android (.APK)...${C_RESET}"
  detect_package_manager
  setup_android_env

  # Kiểm tra Java
  if ! command -v java >/dev/null 2>&1; then
    echo -e "${C_RED}[LỖI] Không tìm thấy Java Runtime (java / javac).${C_RESET}"
    echo "Vui lòng cài đặt OpenJDK (ví dụ: sudo apt install openjdk-17-jdk) để biên dịch Android App."
    exit 1
  fi

  if [ ! -f "./android/gradlew" ]; then
    echo -e "${C_RED}[LỖI] Không tìm thấy thư mục android hoặc file ./android/gradlew.${C_RESET}"
    exit 1
  fi

  mkdir -p public/downloads

  echo "    [1/3] Biên dịch Web assets..."
  $RUN_CMD build

  # Loại bỏ file .apk trong dist và android assets để tránh nhúng đệ quy làm phình to dung lượng
  rm -f dist/downloads/*.apk
  rm -f android/app/src/main/assets/public/downloads/*.apk

  echo "    [2/3] Đồng bộ Capacitor Android assets..."
  $EXEC_CMD cap sync android

  # Dọn dẹp lại sau khi sync để đảm bảo APK không chứa file APK nào bên trong assets
  rm -f android/app/src/main/assets/public/downloads/*.apk

  echo "    [3/3] Chạy Gradle assembleDebug để đóng gói APK..."
  chmod +x ./android/gradlew
  ./android/gradlew -p android assembleDebug

  APK_SOURCE="android/app/build/outputs/apk/debug/app-debug.apk"
  APK_TARGET="public/downloads/finora-latest.apk"

  if [ -f "$APK_SOURCE" ]; then
    cp -f "$APK_SOURCE" "$APK_TARGET"
    mkdir -p dist/downloads
    cp -f "$APK_SOURCE" "dist/downloads/finora-latest.apk"

    # Nếu container finora-app hoặc finora-landing đang chạy, đồng bộ ngay file APK mới vào container
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^finora-app$"; then
      docker cp "$APK_TARGET" finora-app:/usr/share/nginx/html/downloads/finora-latest.apk 2>/dev/null || true
    fi
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^finora-landing$"; then
      docker cp "$APK_TARGET" finora-landing:/usr/share/nginx/html/downloads/finora-latest.apk 2>/dev/null || true
    fi

    APK_SIZE=$(ls -lh "$APK_TARGET" | awk '{print $5}')
    echo ""
    echo -e "${C_GREEN}======================================================================${C_RESET}"
    echo -e "${C_GREEN}✓ BUILD ANDROID APK THÀNH CÔNG!${C_RESET}"
    echo -e "${C_GREEN}======================================================================${C_RESET}"
    echo -e "  • File APK hoàn tất : ${C_BOLD}$APK_TARGET${C_RESET}"
    echo -e "  • Dung lượng        : ${C_BOLD}$APK_SIZE${C_RESET}"
    echo -e "  • File gốc Gradle   : $APK_SOURCE"
    echo -e "  • Lệnh cài nhanh ADB: ${C_CYAN}adb install -r $APK_TARGET${C_RESET}"
    echo -e "${C_GREEN}======================================================================${C_RESET}"
  else
    echo -e "${C_RED}[LỖI] Không tìm thấy file APK đầu ra tại $APK_SOURCE!${C_RESET}"
    exit 1
  fi
}

# 6. BIÊN DỊCH VÀ KHỞI CHẠY WEB DOCKER
build_and_run_docker() {
  echo ""
  echo -e "${C_BLUE}>>> Kiểm tra môi trường Docker daemon...${C_RESET}"
  if ! command -v docker >/dev/null 2>&1; then
    echo -e "${C_RED}[LỖI] Docker chưa được cài đặt trên hệ thống!${C_RESET}"
    echo "Vui lòng cài đặt Docker: https://docs.docker.com/engine/install/"
    exit 1
  fi

  echo -e "${C_BLUE}>>> Dừng container phiên bản cũ (nếu có)...${C_RESET}"
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose down 2>/dev/null || true
  elif docker compose version >/dev/null 2>&1; then
    docker compose down 2>/dev/null || true
  else
    docker stop finora-app 2>/dev/null || true
    docker rm finora-app 2>/dev/null || true
  fi

  echo -e "${C_BLUE}>>> Tiến hành Build Docker Image và Khởi chạy Container Web...${C_RESET}"
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose build --no-cache
    docker-compose up -d
  elif docker compose version >/dev/null 2>&1; then
    docker compose build --no-cache
    docker compose up -d
  else
    echo "    Đang build image finora-app (no-cache)..."
    docker build --no-cache -t finora-app .
    echo "    Đang chạy container finora-app trên 3 cổng riêng biệt: 7000 (App), 7001 (Landing), 7002 (Auth)..."
    docker run -d --name finora-app -p 7000:7000 -p 7001:7001 -p 7002:7002 --restart unless-stopped finora-app
  fi

  echo ""
  echo -e "${C_GREEN}======================================================================${C_RESET}"
  echo -e "${C_GREEN}    TRIỂN KHAI CÁC DỊCH VỤ DOCKER HOÀN TẤT (4 CONTAINER RIÊNG BIỆT)!   ${C_RESET}"
  echo -e "${C_GREEN}======================================================================${C_RESET}"
  echo "  1. finora-app     : http://localhost:7000 (Internal 80) -> app.tichsan.site"
  echo "  2. finora-landing : http://localhost:7001 (Internal 80) -> tichsan.site & www"
  echo "  3. finora-auth    : http://localhost:7002 (Internal 80) -> auth.tichsan.site"
  echo "  4. finora-api     : http://localhost:7003 (Backend API) -> api.tichsan.site"
  if [ -f "public/downloads/finora-latest.apk" ]; then
    echo "  • Tải APK Android : http://localhost:7001/downloads/finora-latest.apk"
  fi
  echo "  • Kiểm tra danh sách: docker ps -f name=finora-"
  echo "  • Xem logs API      : docker logs -f finora-api"
  echo "  • Xem logs Web App  : docker logs -f finora-app"
  echo -e "${C_GREEN}======================================================================${C_RESET}"
}

# --- XỬ LÝ THAM SỐ ĐẦU VÀO ---
DO_PULL=false
TARGET_MODE=""

for arg in "$@"; do
  case "$arg" in
    app|android|apk)
      TARGET_MODE="app"
      ;;
    web|docker)
      TARGET_MODE="web"
      ;;
    all|both)
      TARGET_MODE="all"
      ;;
    dist|frontend)
      TARGET_MODE="dist"
      ;;
    --pull)
      DO_PULL=true
      ;;
    --no-pull)
      DO_PULL=false
      ;;
    -h|--help)
      print_header
      print_help
      exit 0
      ;;
    *)
      echo -e "${C_RED}[LỖI] Tham số không hợp lệ: $arg${C_RESET}"
      print_help
      exit 1
      ;;
  esac
done

print_header

# Nếu không truyền chế độ nào và đang chạy ở terminal tương tác -> Hiển thị menu
if [ -z "$TARGET_MODE" ]; then
  if [ -t 0 ]; then
    echo -e "${C_BOLD}Vui lòng chọn mục tiêu muốn build:${C_RESET}"
    echo "  [1] Build Android App (.APK)"
    echo "  [2] Build & Khởi chạy Web (Docker Container)"
    echo "  [3] Build cả hai (Android App + Web Docker) [Mặc định]"
    echo "  [4] Chỉ build Web Frontend tĩnh (pnpm build -> dist/)"
    echo "  [0] Thoát"
    echo ""
    read -r -p "Nhập lựa chọn của bạn [1-4] (Mặc định: 3): " USER_CHOICE
    USER_CHOICE="${USER_CHOICE:-3}"

    case "$USER_CHOICE" in
      1) TARGET_MODE="app" ;;
      2) TARGET_MODE="web" ;;
      3) TARGET_MODE="all" ;;
      4) TARGET_MODE="dist" ;;
      0) echo "Đã hủy bỏ."; exit 0 ;;
      *) echo -e "${C_RED}Lựa chọn không hợp lệ.${C_RESET}"; exit 1 ;;
    esac
  else
    # Môi trường non-interactive (CI/CD hoặc script gọi) mặc định build cả hai
    TARGET_MODE="all"
  fi
fi

# Thực hiện pull nếu được yêu cầu
if [ "$DO_PULL" = true ]; then
  do_git_pull
fi

# Thực thi theo chế độ đã chọn
case "$TARGET_MODE" in
  app)
    echo -e "${C_CYAN}>>> Chế độ: CHỈ BUILD ANDROID APP (.APK)${C_RESET}"
    build_android_apk
    ;;
  web)
    echo -e "${C_CYAN}>>> Chế độ: CHỈ BUILD & CHẠY WEB DOCKER${C_RESET}"
    build_and_run_docker
    ;;
  all)
    echo -e "${C_CYAN}>>> Chế độ: BUILD TẤT CẢ (ANDROID APP + WEB DOCKER)${C_RESET}"
    build_android_apk
    build_and_run_docker
    ;;
  dist)
    echo -e "${C_CYAN}>>> Chế độ: CHỈ BUILD BẢN WEB TĨNH (DIST)${C_RESET}"
    build_web_dist
    ;;
esac

echo ""
