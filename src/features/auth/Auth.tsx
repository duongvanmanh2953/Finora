import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import {
  ArrowRight,
  ArrowLeft,
  Globe,
  Crown,
  Sparkles,
  Lock,
  Database,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  LogIn,
  UserPlus,
  Smartphone
} from 'lucide-react';
import {
  Box,
  Button,
  Alert,
  Typography,
  Chip,
  Paper,
  Divider,
  Checkbox,
  CircularProgress,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { MuiTextField } from '../../components/mui/MuiInputs';
import { useFinance } from '../../store';
import { checkEmailAvailability } from '../../services/financeService';
import { GOLD_COLOR_TOKENS } from '../../lib/subscription';
import { getLandingUrl, navigateToApp } from '../../lib/domainRouting';
import { signInWithGoogle, signInWithFacebook, isFirebaseConfigured } from '../../lib/firebase';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" style={{ flexShrink: 0 }}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const emailSchema = z.string().email('Email không đúng định dạng');

export default function Auth() {
  const { mode = 'login' } = useParams<{ mode?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register, login, oauthLogin, startGuest, notify } = useFinance();

  const fromApp = searchParams.get('source') === 'android_app' || searchParams.get('from_app') === '1';
  const migrateGuest = searchParams.get('migrate_guest') === '1' || searchParams.get('sync') === '1';
  const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Field-level validation errors (rendered directly in the form)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    terms?: string;
  }>({});

  // Email registered check state
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Check email registered on blur or debounce when in register mode
  const checkEmailOnServer = useCallback(async (targetEmail: string) => {
    const trimmed = targetEmail.trim().toLowerCase();
    const parse = emailSchema.safeParse(trimmed);
    if (!parse.success) {
      setEmailAlreadyRegistered(false);
      return;
    }
    setCheckingEmail(true);
    try {
      const result = await checkEmailAvailability(trimmed);
      setEmailAlreadyRegistered(result.exists);
    } catch {
      setEmailAlreadyRegistered(false);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  useEffect(() => {
    // Reset errors when switching modes
    setEmailAlreadyRegistered(false);
    setFieldErrors({});
    setError('');
    setMessage('');
  }, [mode]);

  const titles: Record<string, string> = {
    login: 'Đăng nhập vào Tích Sản',
    register: 'Mở tài khoản Tích Sản mới',
    forgot: 'Khôi phục quyền truy cập',
    reset: 'Thiết lập mật khẩu mới'
  };

  const label = titles[mode] || titles.login;

  const handleStartGuestSession = async () => {
    if (submitting) return;
    setSubmitting(true);
    setFieldErrors({});
    setError('');
    try {
      await startGuest();
      notify({
        message: 'Đã bắt đầu phiên dùng ngoại tuyến (Offline-First). Dữ liệu được lưu an toàn trên máy bạn.',
        severity: 'success'
      });
      handleAuthSuccessRedirect();
    } catch (err: any) {
      setError('Không thể khởi động phiên dùng thử: ' + (err?.message || 'Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWebOAuthFallback = async () => {
    try {
      setSocialLoading('google');
      const returnScheme = 'Tich.San_2953';
      const webAuthUrl = `https://auth.tichsan.site/login?source=android_app&social=google&scheme=${returnScheme}`;
      await Browser.open({ url: webAuthUrl, windowName: '_system' });
    } catch (err: any) {
      setError('Không thể mở trình duyệt: ' + err?.message);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    if (submitting || socialLoading) return;
    setFieldErrors({});
    setError('');
    setMessage('');

    // Với Facebook trên Android Native (khi chưa cấu hình native Facebook SDK), mở qua browser
    if (isNativeAndroid && provider === 'facebook') {
      setSocialLoading(provider);
      try {
        const returnScheme = 'vn.finora.app';
        const webAuthUrl = `https://auth.tichsan.site/login?source=android_app&social=${provider}&scheme=${returnScheme}`;
        await Browser.open({ url: webAuthUrl, windowName: '_system' });
      } catch (err: any) {
        setError('Không thể mở trình duyệt ngoài: ' + (err?.message || 'Vui lòng thử lại.'));
      } finally {
        setSocialLoading(null);
      }
      return;
    }

    // Trên Web cần cấu hình Firebase API key
    if (!Capacitor.isNativePlatform() && !isFirebaseConfigured()) {
      setError('Chưa cấu hình Firebase API key trong file .env. Vui lòng thêm VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID vào file .env rồi thử lại.');
      return;
    }

    setSocialLoading(provider);
    try {
      const socialUser = provider === 'google' ? await signInWithGoogle() : await signInWithFacebook();
      await oauthLogin(socialUser.displayName, socialUser.email, provider);
      notify({
        message: `Đăng nhập ${provider === 'google' ? 'Google' : 'Facebook'} thành công! Xin chào ${socialUser.displayName || 'bạn'}.`,
        severity: 'success'
      });
      handleAuthSuccessRedirect();
    } catch (err: any) {
      console.error(`Social auth ${provider} error:`, err);
      const errMsg = err?.message || `Đã xảy ra lỗi khi xác thực bằng ${provider === 'google' ? 'Google' : 'Facebook'}. Vui lòng thử lại.`;
      setError(errMsg);
      // Inline error message - do NOT show annoying popup notification toast!
    } finally {
      setSocialLoading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const newFieldErrors: typeof fieldErrors = {};

    const trimmedEmail = email.trim().toLowerCase();
    const emailCheck = emailSchema.safeParse(trimmedEmail);
    if (!trimmedEmail) {
      newFieldErrors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!emailCheck.success) {
      newFieldErrors.email = 'Email không đúng định dạng (ví dụ: tenban@domain.com).';
    }

    if ((mode === 'login' || mode === 'register' || mode === 'reset') && password.length < 6) {
      newFieldErrors.password = 'Mật khẩu cần tối thiểu 6 ký tự.';
    }

    if (mode === 'register') {
      if (name.trim().length < 2) {
        newFieldErrors.name = 'Vui lòng nhập họ và tên của bạn.';
      }
      if (!agreedToTerms) {
        newFieldErrors.terms = 'Vui lòng tích chọn đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu.';
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setFieldErrors({});

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
        await register(name.trim(), trimmedEmail, password);
        notify({
          message: 'Tích Sản gửi tặng bạn 01 tháng trải nghiệm VIP Gold miễn phí. Khám phá toàn bộ tính năng cao cấp!',
          severity: 'success'
        });
      } else {
        await login(trimmedEmail, password);
        notify({
          message: 'Đăng nhập vào Tích Sản thành công!',
          severity: 'success'
        });
      }
      handleAuthSuccessRedirect();
    } catch (err: any) {
      const errMsg = err?.message || 'Đã xảy ra lỗi trong quá trình xác thực. Vui lòng kiểm tra lại thông tin.';
      const lower = errMsg.toLowerCase();
      if (lower.includes('mật khẩu') || lower.includes('password')) {
        setFieldErrors({ password: errMsg });
        setError('');
      } else if (lower.includes('email') || lower.includes('chưa được đăng ký') || lower.includes('đã tồn tại')) {
        setFieldErrors({ email: errMsg });
        setError('');
      } else {
        setError(errMsg);
      }
      // Inline validate error in form directly - do NOT show annoying popup notification toast!
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthSuccessRedirect = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('logout');
      url.searchParams.delete('force');
      url.searchParams.delete('switch');
      window.history.replaceState({}, document.title, url.pathname + (url.search || '') + url.hash);

      if (fromApp) {
        const rawUser = localStorage.getItem('finora:auth-user');
        const token = localStorage.getItem('finora:auth-token');
        const schemeParam = searchParams.get('scheme') || 'vn.finora.app';
        if (rawUser) {
          const appDeepLink = `${schemeParam}://auth?session=${encodeURIComponent(rawUser)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
          window.location.href = appDeepLink;
          return;
        }
      }
    }
    navigateToApp('/', (path) => navigate(path, { replace: true }));
  };

  return (
    <Box
      sx={{
        minHeight: { xs: '100dvh', md: '100vh' },
        display: { xs: 'flex', md: 'grid' },
        flexDirection: { xs: 'column', md: 'initial' },
        gridTemplateColumns: { md: '1.15fr 1fr' },
        bgcolor: 'background.default',
        color: 'text.primary'
      }}
    >
      {/* =========================================================================
          LEFT COLUMN: BRAND HERO & 30-DAY TRIAL (Desktop Only, lg/md)
          ========================================================================= */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          background: 'linear-gradient(150deg, #09261E 0%, #0F3B30 45%, #184E40 100%)',
          color: '#FFFFFF',
          p: { sm: 5, lg: 8 },
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Glow */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <a
              href={getLandingUrl()}
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
                  borderRadius: 6,
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
            </a>

            <Chip
              icon={<Crown size={14} color={GOLD_COLOR_TOKENS.goldMetallic} />}
              label="VIP Gold Trial 30 Ngày"
              sx={{
                bgcolor: 'rgba(197, 160, 89, 0.18)',
                color: GOLD_COLOR_TOKENS.goldLight,
                border: `1px solid ${GOLD_COLOR_TOKENS.goldBorder}`,
                fontWeight: 750,
                fontSize: 11.5,
                borderRadius: '6px',
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
              py: 0.6,
              borderRadius: '6px',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FBBF24',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              mb: 2
            }}
          >
            <Sparkles size={13} color="#FBBF24" />
            Nền tảng Quản lý Tài sản Cá nhân Toàn diện
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontSize: { sm: '2.2rem', lg: '2.7rem' },
              fontWeight: 900,
              letterSpacing: -1,
              lineHeight: 1.2,
              mb: 2,
              color: '#FFFFFF'
            }}
          >
            Kiến tạo tự do tài chính từ những kỷ luật nhỏ nhất.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 14,
              lineHeight: 1.6,
              mb: 3
            }}
          >
            Theo dõi dòng tiền minh bạch, phân bổ vốn đầu tư khoa học và kiểm soát sức khỏe tài chính bằng hệ thống Speedometer Gauges chuẩn mực quốc tế.
          </Typography>

          {/* 30-Day VIP Gold Highlight Box */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '6px',
              bgcolor: 'rgba(197, 160, 89, 0.12)',
              border: `1px solid ${GOLD_COLOR_TOKENS.goldBorder}`,
              backdropFilter: 'blur(12px)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
              <Crown size={18} color={GOLD_COLOR_TOKENS.goldMetallic} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: GOLD_COLOR_TOKENS.goldLight, fontSize: 13 }}>
                Đặc quyền Dùng thử VIP Gold 30 Ngày
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gap: 0.8 }}>
              {[
                'Tự động cấp toàn quyền gói Gold ngay khi đăng ký',
                'Không cần thẻ tín dụng, không yêu cầu nạp tiền',
                'Hết 30 ngày chuyển về gói Free an toàn, giữ nguyên mọi dữ liệu'
              ].map((text, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle2 size={14} color="#34D399" />
                  <Typography variant="caption" sx={{ color: '#E2E8F0', fontSize: 12, fontWeight: 550 }}>
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
            pt: 2.5,
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2.5,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock size={14} color="#A7F3D0" />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
              Mã hóa Local-First & Zero-Knowledge
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Database size={14} color="#A7F3D0" />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
              Dữ liệu thuộc quyền sở hữu của bạn
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* =========================================================================
          RIGHT COLUMN: MODERN MOBILE & DESKTOP AUTH INTERFACE
          (Anti-slop redesign: Full vertical flow on mobile, zero awkward dead gaps)
          ========================================================================= */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: { xs: 'space-between', md: 'center' },
          minHeight: { xs: '100dvh', md: '100vh' },
          bgcolor: 'background.paper',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {/* Mobile Top App Bar (Pinned seamlessly at top on mobile) */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 'max(14px, env(safe-area-inset-top))',
            pb: 1.5,
            px: 2.5,
            borderBottom: '1px solid var(--border-subtle)',
            bgcolor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <a
            href={getLandingUrl()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          >
            <img
              src="/logo.png?v=20261105"
              alt="Tích Sản"
              style={{ width: 32, height: 32, borderRadius: 7, objectFit: 'contain' }}
            />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: 15, lineHeight: 1.1 }}>
                Tích Sản <span style={{ color: '#10B981', fontSize: '0.85em', fontWeight: 700 }}>· Finora</span>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10, display: 'block' }}>
                Quản lý Tài chính Thông minh
              </Typography>
            </Box>
          </a>

          <Chip
            icon={<Crown size={12} color="#C5A059" />}
            label="VIP Gold 30 Ngày"
            size="small"
            sx={{
              bgcolor: 'rgba(197, 160, 89, 0.12)',
              color: GOLD_COLOR_TOKENS.goldLight,
              fontWeight: 800,
              fontSize: '0.68rem',
              height: 22,
              borderRadius: '6px',
              border: '1px solid rgba(197, 160, 89, 0.3)'
            }}
          />
        </Box>

        {/* Main Content Area: Compact, Fluid, Balanced */}
        <Box
          sx={{
            width: '100%',
            maxWidth: 440,
            mx: 'auto',
            px: { xs: 2.5, sm: 4 },
            py: { xs: 2.5, sm: 4, md: 5 },
            flex: { xs: '1 0 auto', md: 'initial' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {/* Mobile Fast Tab Switcher (Segmented Control between Login and Register) */}
          {(mode === 'login' || mode === 'register') && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                p: 0.5,
                borderRadius: '10px',
                bgcolor: 'action.hover',
                border: '1px solid var(--border-subtle)',
                mb: 2.5
              }}
            >
              <Button
                size="small"
                onClick={() => navigate('/auth/login')}
                startIcon={<LogIn size={15} />}
                sx={{
                  py: 0.8,
                  fontSize: 13,
                  fontWeight: mode === 'login' ? 800 : 600,
                  borderRadius: '7px',
                  bgcolor: mode === 'login' ? 'background.paper' : 'transparent',
                  color: mode === 'login' ? 'primary.main' : 'text.secondary',
                  boxShadow: mode === 'login' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  textTransform: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Đăng nhập
              </Button>
              <Button
                size="small"
                onClick={() => navigate('/auth/register')}
                startIcon={<UserPlus size={15} />}
                sx={{
                  py: 0.8,
                  fontSize: 13,
                  fontWeight: mode === 'register' ? 800 : 600,
                  borderRadius: '7px',
                  bgcolor: mode === 'register' ? 'background.paper' : 'transparent',
                  color: mode === 'register' ? 'primary.main' : 'text.secondary',
                  boxShadow: mode === 'register' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  textTransform: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Mở tài khoản
              </Button>
            </Box>
          )}

          {/* Heading */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: 'primary.main',
                  letterSpacing: 1.1,
                  textTransform: 'uppercase',
                  fontSize: 10.5
                }}
              >
                {mode === 'register' ? 'BẮT ĐẦU VỚI TÍCH SẢN' : 'XÁC THỰC BẢO MẬT'}
              </Typography>
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 850, letterSpacing: -0.6, mb: 0.6, fontSize: { xs: 21, sm: 24 } }}>
              {mode === 'login'
                ? 'Chào mừng trở lại'
                : mode === 'register'
                  ? 'Mở tài khoản Tích Sản'
                  : label}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.45, fontSize: { xs: 12.5, sm: 13 } }}>
              {mode === 'register'
                ? 'Tự động cấp 30 ngày VIP Gold trải nghiệm đầy đủ tính năng cao cấp.'
                : mode === 'forgot'
                  ? 'Nhập email đã đăng ký để nhận mã khôi phục quyền truy cập.'
                  : mode === 'reset'
                    ? 'Nhập mật khẩu an toàn mới cho tài khoản của bạn.'
                    : 'Đăng nhập để theo dõi dòng tiền và quản lý tài sản.'}
            </Typography>
          </Box>

          {/* Reassurance banners */}
          {migrateGuest && (
            <Alert
              severity="success"
              icon={<Sparkles size={18} color="#10B981" />}
              sx={{ mb: 2, fontSize: 12.5, borderRadius: '8px' }}
            >
              <b>Bảo lưu dữ liệu dùng thử</b>: Dữ liệu bạn vừa ghi chép ở phiên Khách sẽ được giữ nguyên và tự động đồng bộ ngay vào tài khoản mới sau khi đăng ký hoặc đăng nhập!
            </Alert>
          )}

          {fromApp && (
            <Alert
              severity="info"
              icon={<Smartphone size={18} color="#3B82F6" />}
              sx={{ mb: 2, fontSize: 12.5, borderRadius: '8px' }}
            >
              Đang đăng nhập cho <b>Ứng dụng Android Finora</b>. Sau khi xác thực, hệ thống sẽ tự động mở lại ứng dụng cho bạn.
            </Alert>
          )}

          {/* Social Sign-in Buttons */}
          {(mode === 'login' || mode === 'register') && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 1.2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleSocialAuth('google')}
                  disabled={submitting || socialLoading !== null}
                  startIcon={socialLoading === 'google' ? <CircularProgress size={16} color="inherit" /> : <GoogleIcon />}
                  sx={{
                    height: 42,
                    borderRadius: '8px',
                    borderColor: 'var(--border-subtle)',
                    color: 'text.primary',
                    bgcolor: 'background.paper',
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'var(--text-muted)'
                    }
                  }}
                >
                  {socialLoading === 'google' ? 'Đang kết nối...' : 'Google'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleSocialAuth('facebook')}
                  disabled={submitting || socialLoading !== null}
                  startIcon={socialLoading === 'facebook' ? <CircularProgress size={16} color="inherit" /> : <FacebookIcon />}
                  sx={{
                    height: 42,
                    borderRadius: '8px',
                    borderColor: 'var(--border-subtle)',
                    color: 'text.primary',
                    bgcolor: 'background.paper',
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: '#1877F2'
                    }
                  }}
                >
                  {socialLoading === 'facebook' ? 'Đang kết nối...' : 'Facebook'}
                </Button>
              </Box>

              {isNativeAndroid && (
                <Box
                  sx={{
                    mb: 1.5,
                    p: 1.1,
                    borderRadius: '7px',
                    bgcolor: 'action.hover',
                    border: '1px dashed var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.35 }}>
                    Google hỗ trợ đăng nhập 1 chạm an toàn qua Google Play Services ngay trong App.
                  </Typography>
                </Box>
              )}

              <Divider sx={{ fontSize: 10.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Hoặc với email
              </Divider>
            </Box>
          )}

          {/* Form */}
          <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {mode === 'register' && (
              <MuiTextField
                label="Họ và tên"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                  if (error) setError('');
                }}
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name}
                placeholder="Ví dụ: Nguyễn Văn Thịnh"
                required
                fullWidth
              />
            )}

            <Box>
              <MuiTextField
                label="Địa chỉ Email"
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                  if (emailAlreadyRegistered) setEmailAlreadyRegistered(false);
                  if (error) setError('');
                }}
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email && !fieldErrors.email.includes('chưa được đăng ký') ? fieldErrors.email : undefined}
                onBlur={() => {
                  if (mode === 'register' && email.trim()) {
                    void checkEmailOnServer(email);
                  }
                }}
                placeholder="tenban@domain.com"
                required
                fullWidth
                autoComplete="email"
              />

              {/* Login mode: Quick link to Register when email not found */}
              {mode === 'login' && fieldErrors.email && fieldErrors.email.includes('chưa được đăng ký') && (
                <Box
                  sx={{
                    mt: 0.8,
                    p: 1.25,
                    borderRadius: '8px',
                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    flexWrap: 'wrap'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 650, fontSize: 11.5 }}>
                      {fieldErrors.email}
                    </Typography>
                  </Box>
                  <Button
                    type="button"
                    size="small"
                    variant="text"
                    endIcon={<ArrowRight size={13} />}
                    onClick={() => navigate('/auth/register')}
                    sx={{
                      p: 0,
                      minWidth: 'auto',
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: 'primary.main',
                      textDecoration: 'underline'
                    }}
                  >
                    Mở tài khoản ngay
                  </Button>
                </Box>
              )}

              {/* Real-time email check notice in Register mode */}
              {mode === 'register' && emailAlreadyRegistered && (
                <Box
                  sx={{
                    mt: 0.8,
                    p: 1.25,
                    borderRadius: '8px',
                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    flexWrap: 'wrap'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 650, fontSize: 11.5 }}>
                      Email này đã được đăng ký.
                    </Typography>
                  </Box>
                  <Button
                    type="button"
                    size="small"
                    variant="text"
                    endIcon={<ArrowRight size={13} />}
                    onClick={() => navigate('/auth/login')}
                    sx={{
                      p: 0,
                      minWidth: 'auto',
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: 'primary.main',
                      textDecoration: 'underline'
                    }}
                  >
                    Đăng nhập ngay
                  </Button>
                </Box>
              )}
            </Box>

            {mode !== 'forgot' && (
              <Box>
                <MuiTextField
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                    if (error) setError('');
                  }}
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  fullWidth
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            type="button"
                            size="small"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            sx={{ color: 'text.secondary' }}
                          >
                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />

                {mode === 'login' && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                    <Link
                      to="/auth/forgot"
                      style={{
                        fontSize: 12,
                        color: 'var(--brand-primary, #10B981)',
                        textDecoration: 'none',
                        fontWeight: 650
                      }}
                    >
                      Quên mật khẩu?
                    </Link>
                  </Box>
                )}
              </Box>
            )}

            {mode === 'register' && (
              <Box sx={{ my: 0.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Checkbox
                    size="small"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (fieldErrors.terms) setFieldErrors(prev => ({ ...prev, terms: undefined }));
                      if (error) setError('');
                    }}
                    sx={{
                      p: 0.5,
                      color: fieldErrors.terms ? 'error.main' : 'var(--brand-primary, #355E52)',
                      '&.Mui-checked': { color: 'var(--brand-primary, #355E52)' }
                    }}
                  />
                  <Typography variant="body2" sx={{ fontSize: 12, lineHeight: 1.45, color: 'text.secondary' }}>
                    Tôi đồng ý với{' '}
                    <Link
                      to="/legal"
                      target="_blank"
                      style={{ color: 'var(--brand-primary, #355E52)', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      Điều khoản dịch vụ
                    </Link>{' '}
                    và{' '}
                    <Link
                      to="/legal"
                      target="_blank"
                      style={{ color: 'var(--brand-primary, #355E52)', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      Chính sách bảo vệ dữ liệu cá nhân
                    </Link>{' '}
                    (Luật 91/2025/QH15 & NĐ 356/2025/NĐ-CP).
                  </Typography>
                </Box>
                {fieldErrors.terms && (
                  <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 650, display: 'block', mt: 0.5, pl: 0.5 }}>
                    {fieldErrors.terms}
                  </Typography>
                )}
              </Box>
            )}

            {/* Inline validation and error message positioned directly above the submit button */}
            {error && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
                <Alert
                  severity="error"
                  onClose={() => setError('')}
                  sx={{
                    fontSize: 12.5,
                    py: 0.75,
                    borderRadius: '8px',
                    wordBreak: 'break-word',
                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.28)',
                    color: '#DC2626',
                    fontWeight: 600,
                    '& .MuiAlert-message': { wordBreak: 'break-word', overflowWrap: 'anywhere' }
                  }}
                >
                  {error}
                </Alert>
                {isNativeAndroid && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      type="button"
                      size="small"
                      variant="outlined"
                      startIcon={<Globe size={13} />}
                      onClick={handleWebOAuthFallback}
                      disabled={socialLoading !== null}
                      sx={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: '6px',
                        py: 0.6,
                        px: 1.5
                      }}
                    >
                      Thử đăng nhập qua Trình duyệt Web
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {message && (
              <Alert
                severity="info"
                onClose={() => setMessage('')}
                sx={{
                  fontSize: 12.5,
                  py: 0.75,
                  mt: 0.5,
                  borderRadius: '8px',
                  wordBreak: 'break-word',
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  '& .MuiAlert-message': { wordBreak: 'break-word', overflowWrap: 'anywhere' }
                }}
              >
                {message}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting || checkingEmail}
              endIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />}
              sx={{
                height: 46,
                fontSize: 13.5,
                fontWeight: 800,
                borderRadius: '8px',
                mt: 0.5,
                boxShadow: '0 4px 14px rgba(49, 92, 80, 0.25)',
                touchAction: 'manipulation'
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

          {/* Guest Mode Entry (Use without Account) */}
          {(mode === 'login' || mode === 'register') && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Divider sx={{ my: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
                  HOẶC SỬ DỤNG TRỰC TIẾP
                </Typography>
              </Divider>

              <Button
                variant="outlined"
                onClick={handleStartGuestSession}
                disabled={submitting}
                startIcon={<Sparkles size={16} color="#10B981" />}
                sx={{
                  height: 44,
                  borderRadius: '8px',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  color: '#10B981',
                  fontSize: 13,
                  fontWeight: 750,
                  textTransform: 'none',
                  bgcolor: 'rgba(16, 185, 129, 0.05)',
                  '&:hover': {
                    borderColor: '#10B981',
                    bgcolor: 'rgba(16, 185, 129, 0.12)'
                  }
                }}
              >
                Dùng ngay không cần tài khoản (Lưu trữ trên máy)
              </Button>
            </Box>
          )}

          {/* Navigation link for Forgot / Reset modes */}
          {mode !== 'login' && mode !== 'register' && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link to="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--brand-primary, #10B981)', textDecoration: 'none', fontWeight: 750, fontSize: 13 }}>
                <ArrowLeft size={14} />
                <span>Quay lại màn hình đăng nhập</span>
              </Link>
            </Box>
          )}
        </Box>

        {/* Mobile & Desktop Bottom Trust & Security Signals (Cleanly anchored at the bottom) */}
        <Box
          sx={{
            py: { xs: 1.5, sm: 2 },
            pb: { xs: 'max(16px, env(safe-area-inset-bottom))', sm: 2.5 },
            px: 2.5,
            borderTop: '1px solid var(--border-subtle)',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: { xs: 1.5, sm: 2 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ShieldCheck size={13} color="#10B981" />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600 }}>
              Offline-First an toàn
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>•</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Lock size={12} color="#10B981" />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600 }}>
              Mã hóa Local-First
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>•</Typography>
          <Link to="/legal" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
            Pháp lý
          </Link>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>•</Typography>
          <a href={getLandingUrl()} style={{ fontSize: 11, color: 'var(--brand-primary, #10B981)', textDecoration: 'none', fontWeight: 700 }}>
            Trang chủ
          </a>
        </Box>
      </Box>
    </Box>
  );
}
