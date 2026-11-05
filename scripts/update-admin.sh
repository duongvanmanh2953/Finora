#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=========================================================="
echo "          TÍCH SẢN / FINORA — CẬP NHẬT TÀI KHOẢN ADMIN    "
echo "=========================================================="

npx tsx src/server/admin/adminResetCli.ts "$@"

