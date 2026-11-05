import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import {
  ArrowRight,
  Crown,
  Sparkles,
  Lock,
  Database,
  CheckCircle2
} from 'lucide-react';
import {
  Box,
  Button,
  Alert,
  Typography,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import { MuiTextField } from '../../components/mui/MuiInputs';
import { useFinance } from '../../store';
import { GOLD_COLOR_TOKENS } from '../../lib/subscription';

const emailSchema = z.string().email('Email không đúng định dạng');

export default function Auth() {
  const { mode = 'login' } = useParams<{ mode?: string }>();
  const navigate = useNavigate();
  const { register, login, notify } = useFinance();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const titles: Record<string, string> = {
    login: 'Đăng nhập vào Tích Sản',
    register: 'Mở tài khoản Tích Sản mới',
    forgot: 'Khôi phục quyền truy cập',
    reset: 'Thiết lập mật khẩu mới'
  };

  const label = titles[mode] || titles.login;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if ((mode === 'login' || mode === 'register' || mode === 'reset') && password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    if (mode === 'register' && name.trim().length < 2) {
      setError('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    if (mode === 'forgot') {
      setMessage('Liên kết đặt lại mật khẩu đã được mô phỏng. Bạn có thể tiến hành đặt lại mật khẩu mới.');
      return;
    }

    if (mode === 'reset') {
      setMessage('Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập.');
      setTimeout(() => navigate('/auth/login'), 1500);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        await register(name, email);
        notify({
          message: 'Tích Sản gửi tặng bạn 01 tháng trải nghiệm VIP Gold miễn phí. Khám phá toàn bộ tính năng cao cấp và nâng cao khả năng quản lý tài chính của bạn.',
          severity: 'success'
        });
      } else {
        await login(email);
        notify({
          message: 'Đăng nhập vào Tích Sản thành công!',
          severity: 'success'
        });
      }
      navigate('/');
    } catch {
      setError('Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' },
        bgcolor: 'background.default',
        color: 'text.primary'
      }}
    >
      {/* LEFT COLUMN: BRAND HERO & 30-DAY TRIAL VALUE PROP */}
      <Box
        sx={{
          background: 'linear-gradient(150deg, #09261E 0%, #0F3B30 45%, #184E40 100%)',
          color: '#FFFFFF',
          p: { xs: 4, sm: 6, lg: 8 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Ambient Glow */}
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            left: -120,
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(197, 160, 89, 0.22) 0%, rgba(9, 38, 30, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Top Brand & Trial Pill */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Link
              to="/landing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                color: '#FFFFFF'
              }}
            >
              <img
                src="/logo.png?v=20261105"
                alt="Tích Sản"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                  objectFit: 'contain'
                }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#FFFFFF', lineHeight: 1.1 }}>
                  Tích Sản
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '10px', fontWeight: 600, display: 'block', letterSpacing: '0.02em' }}>
                  Kiến tạo tự do tài chính
                </Typography>
              </Box>
            </Link>

            <Chip
              icon={<Crown size={14} color={GOLD_COLOR_TOKENS.goldMetallic} />}
              label="VIP Gold Trial 30 Ngày"
              sx={{
                bgcolor: 'rgba(197, 160, 89, 0.18)',
                color: GOLD_COLOR_TOKENS.goldLight,
                border: `1px solid ${GOLD_COLOR_TOKENS.goldBorder}`,
                fontWeight: 750,
                fontSize: 11.5,
                backdropFilter: 'blur(8px)'
              }}
            />
          </Box>
        </Box>

        {/* Middle Hero Statement */}
        <Box sx={{ my: 'auto', py: 4, position: 'relative', zIndex: 1, maxWidth: 520 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: 50,
              bgcolor: 'rgba(255,255,255,0.08)',
              color: '#A7F3D0',
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              mb: 2.5
            }}
          >
            <Sparkles size={13} color="#FBBF24" />
            Nền tảng Quản lý Tài sản Cá nhân Toàn diện
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '1.9rem', sm: '2.5rem', lg: '2.9rem' },
              fontWeight: 900,
              letterSpacing: -1.2,
              lineHeight: 1.15,
              mb: 2.5,
              color: '#FFFFFF'
            }}
          >
            Kiến tạo tự do tài chính từ những kỷ luật nhỏ nhất.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 15,
              lineHeight: 1.7,
              mb: 4
            }}
          >
            Theo dõi dòng tiền minh bạch, phân bổ vốn đầu tư khoa học và kiểm soát sức khỏe tài chính bằng hệ thống Speedometer Gauges chuẩn mực quốc tế.
          </Typography>

          {/* 30-Day VIP Gold Highlight Box */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: 'rgba(197, 160, 89, 0.12)',
              border: `1px solid ${GOLD_COLOR_TOKENS.goldBorder}`,
              backdropFilter: 'blur(12px)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Crown size={20} color={GOLD_COLOR_TOKENS.goldMetallic} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: GOLD_COLOR_TOKENS.goldLight }}>
                Đặc quyền Dùng thử VIP Gold 30 Ngày
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gap: 1 }}>
              {[
                'Tự động cấp toàn quyền gói Gold ngay khi đăng ký',
                'Không cần thẻ tín dụng, không yêu cầu nạp tiền',
                'Hết 30 ngày chuyển về gói Free an toàn, giữ nguyên mọi dữ liệu'
              ].map((text, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <CheckCircle2 size={15} color="#34D399" />
                  <Typography variant="caption" sx={{ color: '#E2E8F0', fontSize: 12.5, fontWeight: 550 }}>
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Bottom Trust & Security Signals */}
        <Box
          sx={{
            pt: 3,
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock size={15} color="#A7F3D0" />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5 }}>
              Mã hóa Local-First & Zero-Knowledge
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Database size={15} color="#A7F3D0" />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5 }}>
              Dữ liệu thuộc quyền sở hữu của bạn
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* RIGHT COLUMN: INTERACTIVE AUTH FORM */}
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          p: { xs: 3, sm: 6 },
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Header Title */}
          <Box sx={{ mb: 3.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: 'primary.main',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                display: 'block',
                mb: 0.5
              }}
            >
              HỆ THỐNG XÁC THỰC FINORA
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.8, mb: 1 }}>
              {label}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              {mode === 'register'
                ? 'Nhận ngay 30 ngày trải nghiệm gói VIP Gold cao cấp không giới hạn.'
                : mode === 'forgot'
                  ? 'Nhập email đã đăng ký để nhận mã khôi phục quyền truy cập.'
                  : mode === 'reset'
                    ? 'Nhập mật khẩu an toàn mới cho tài khoản của bạn.'
                    : 'Đăng nhập để đồng bộ dòng tiền và quản lý tài sản thông minh.'}
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
            {mode === 'register' && (
              <MuiTextField
                label="Họ và tên"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn Thịnh"
                required
                fullWidth
              />
            )}

            <MuiTextField
              label="Địa chỉ Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tenban@domain.com"
              required
              fullWidth
            />

            {mode !== 'forgot' && (
              <MuiTextField
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                required
                fullWidth
              />
            )}

            {error && (
              <Alert severity="error" sx={{ fontSize: 13, py: 0.5 }}>
                {error}
              </Alert>
            )}

            {message && (
              <Alert severity="info" sx={{ fontSize: 13, py: 0.5 }}>
                {message}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              endIcon={<ArrowRight size={16} />}
              sx={{
                height: 46,
                fontSize: 13.5,
                fontWeight: 750,
                mt: 1,
                boxShadow: '0 4px 14px rgba(49, 92, 80, 0.25)'
              }}
            >
              {submitting
                ? 'Đang xử lý...'
                : mode === 'forgot'
                  ? 'Gửi yêu cầu khôi phục'
                  : mode === 'register'
                    ? 'Đăng ký & Kích hoạt VIP Gold (30 ngày)'
                    : mode === 'reset'
                      ? 'Lưu mật khẩu mới'
                      : 'Đăng nhập vào Tích Sản'}
            </Button>
          </Box>

          {/* Actions & Navigation Links */}
          <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              {mode === 'login' ? (
                <>
                  <Link to="/auth/forgot" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
                    Quên mật khẩu?
                  </Link>
                  <Link to="/auth/register" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 700 }}>
                    Chưa có tài khoản? Đăng ký ngay
                  </Link>
                </>
              ) : (
                <Link to="/auth/login" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 700 }}>
                  ← Quay lại màn hình đăng nhập
                </Link>
              )}
            </Box>

            <Divider sx={{ my: 0.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to="/landing" style={{ fontSize: 12.5, color: 'var(--text-muted)', textDecoration: 'none' }}>
                Tìm hiểu thêm tại Landing Page
              </Link>
              <Link to="/" style={{ fontSize: 12.5, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
                Truy cập Dashboard Demo →
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
