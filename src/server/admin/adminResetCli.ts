#!/usr/bin/env node
import readline from 'readline';
import { db } from '../db/database';
import { generateSecurePassword } from '../auth/security';

const REQUIRED_SECURITY_KEY = 'Tichsan@2953';
const DEFAULT_ADMIN_EMAIL = 'admin@tichsan.ai';

function askHiddenQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    // If not in interactive TTY (e.g. piped or CI)
    if (!process.stdin.isTTY) {
      rl.question(query, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    // Interactive masked terminal input
    process.stdout.write(query);
    let input = '';
    const onData = (char: Buffer) => {
      const str = char.toString('utf8');
      switch (str) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.removeListener('data', onData);
          if (process.stdin.isTTY) process.stdin.setRawMode(false);
          rl.close();
          process.stdout.write('\n');
          resolve(input.trim());
          break;
        case '\u0003': // Ctrl+C
          process.stdin.removeListener('data', onData);
          if (process.stdin.isTTY) process.stdin.setRawMode(false);
          rl.close();
          console.log('\n[ĐÃ HỦY] Thao tác bị hủy bởi người dùng.');
          process.exit(130);
          break;
        case '\u0008': // Backspace
        case '\x7f':
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          input += str;
          process.stdout.write('*');
          break;
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

async function runAdminReset() {
  console.log('\n======================================================================');
  console.log('       TÍCH SẢN / FINORA — CÔNG CỤ RESET MẬT KHẨU QUẢN TRỊ VIÊN       ');
  console.log('======================================================================');

  const args = process.argv.slice(2);
  let providedKey = '';

  // 1. Check if key provided via CLI argument: e.g. yarn admin:reset Tichsan@2953 or --key=Tichsan@2953
  for (const arg of args) {
    if (arg.startsWith('--key=')) {
      providedKey = arg.replace('--key=', '').trim();
    } else if (!arg.startsWith('-') && !providedKey) {
      providedKey = arg.trim();
    }
  }

  // 2. Check if key provided via environment variable
  if (!providedKey && process.env.ADMIN_SECURITY_KEY) {
    providedKey = process.env.ADMIN_SECURITY_KEY.trim();
  }

  // 3. If still not provided, ask interactively
  if (!providedKey) {
    providedKey = await askHiddenQuestion('🔑 Nhập mã xác nhận bảo mật quyền Quản trị (Master Key): ');
  }

  // Verify Master Key
  if (providedKey !== REQUIRED_SECURITY_KEY) {
    console.error('\n❌ [LỖI XÁC THỰC] Mã bảo mật không chính xác!');
    console.error(`   Yêu cầu nhập đúng mã bảo mật được ủy quyền.`);
    console.error('======================================================================\n');
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;

  try {
    // Generate high-entropy secure new password
    const newPassword = generateSecurePassword(16);

    // Rotate password with forced authorization (bypass cooldown since master key is verified)
    const result = db.rotateAdminPassword(newPassword, adminEmail, true);

    console.log('\n✅ [THÀNH CÔNG] Đã cấp mới mật khẩu Quản trị viên Tối cao!');
    console.log('----------------------------------------------------------------------');
    console.log(`  • Email Quản trị  : ${result.admin.email}`);
    console.log(`  • Mật khẩu mới    : ${newPassword}`);
    console.log(`  • Trạng thái mã hóa: Đã băm an toàn (scrypt memory-hard hash) trong database`);
    console.log(`  • Phiên đăng nhập : ĐÃ THU HỒI & ĐĂNG XUẤT TOÀN BỘ THIẾT BỊ CŨ`);
    console.log(`  • Vai trò         : Quản trị viên Tối cao (ROOT ADMIN)`);
    console.log('----------------------------------------------------------------------');
    console.log('LƯU Ý BẢO MẬT:');
    console.log('  1. Mật khẩu mới CHỈ hiển thị đúng một lần duy nhất tại terminal này.');
    console.log('  2. Hệ thống KHÔNG lưu trữ mật khẩu ở dạng văn bản thô (plaintext).');
    console.log('  3. Vui lòng sao chép và lưu mật khẩu vào phần mềm quản lý mật khẩu của bạn.');
    console.log('======================================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ [LỖI THỰC THI]');
    console.error(`   ${err.message}`);
    console.error('======================================================================\n');
    process.exit(1);
  }
}

runAdminReset();

