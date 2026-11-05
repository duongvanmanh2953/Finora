#!/usr/bin/env node
import { db } from '../db/database';
import { generateSecurePassword } from '../auth/security';

function runBootstrap() {
  console.log('\n======================================================================');
  console.log('              TÍCH SẢN — SERVER ADMIN BOOTSTRAP TOOL                  ');
  console.log('======================================================================');

  // Verify server-side execution environment
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@tichsan.vn';

  try {
    const newPassword = generateSecurePassword(16);
    const result = db.rotateAdminPassword(newPassword, adminEmail);

    console.log('[THÀNH CÔNG] Thông tin tài khoản Quản trị Tích Sản:');
    console.log('----------------------------------------------------------------------');
    console.log(`  • Email Quản trị  : ${result.admin.email}`);
    console.log(`  • Mật khẩu mới    : ${newPassword}`);
    console.log(`  • Phân quyền      : Quản trị viên Tối cao (ROOT ADMIN)`);
    console.log(`  • Yêu cầu bắt buộc: Bắt buộc đổi mật khẩu sau khi đăng nhập lần đầu`);
    console.log(`  • Chu kỳ bảo vệ   : Khóa reset trong ${result.cooldownDays} ngày tiếp theo`);
    console.log('----------------------------------------------------------------------');
    console.log('LƯU Ý BẢO MẬT:');
    console.log('  1. Mật khẩu này CHỈ hiển thị đúng MỘT LẦN DUY NHẤT trên terminal này.');
    console.log('  2. Hệ thống KHÔNG lưu trữ mật khẩu dạng plaintext trong bất kỳ file nào.');
    console.log('  3. Vui lòng sao chép và lưu trữ an toàn trong Password Manager.');
    console.log('======================================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n[LỖI TỪ CHỐI THỰC HIỆN]');
    console.error(`  ${err.message}`);
    console.error('----------------------------------------------------------------------');
    console.error('Lệnh bị chặn nhằm đảm bảo tính toàn vẹn và chống tấn công brute-force.');
    console.error('======================================================================\n');
    process.exit(1);
  }
}

runBootstrap();

