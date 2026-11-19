import { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { ShieldCheck, Cookie, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'finora:cookies_terms_accepted_v1';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    try {
      // 1. Kiểm tra nếu thiết bị này đã từng chấp thuận cookies/điều khoản
      const consent = localStorage.getItem(STORAGE_KEY);
      if (consent) {
        return;
      }

      // 2. Nếu thiết bị đã có tài khoản người dùng (đã đăng nhập hoặc đã đăng ký trước đó)
      const existingUser = localStorage.getItem('finora:auth-user');
      if (existingUser) {
        // Tự động ghi nhớ chấp thuận cho tài khoản hiện tại trên thiết bị này
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ status: 'all', timestamp: new Date().toISOString(), auto: true })
        );
        return;
      }

      // 3. Nếu chưa từng thấy và là thiết bị mới hoàn toàn: hiện sau 800ms
      const timer = setTimeout(() => {
        setVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    } catch {
      // Fallback nếu localStorage bị chặn
    }
  }, []);

  const handleAccept = (type: 'all' | 'essential' = 'all') => {
    setClosing(true);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          status: type,
          timestamp: new Date().toISOString()
        })
      );
    } catch {
      // Ignore
    }
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 280);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes cookieBannerSlideUp {
          from {
            opacity: 0;
            transform: translate3d(0, 36px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes cookieBannerSlideDown {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
          to {
            opacity: 0;
            transform: translate3d(0, 36px, 0);
          }
        }
      `}</style>

      <Box
        role="region"
        aria-label="Thông báo chấp thuận cookie và điều khoản sử dụng"
        sx={{
          position: 'fixed',
          bottom: { xs: 12, sm: 20 },
          left: { xs: 12, sm: 'auto' },
          right: { xs: 12, sm: 24 },
          maxWidth: { xs: 'calc(100vw - 24px)', sm: 540 },
          width: '100%',
          zIndex: 9999,
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(22, 27, 34, 0.95)' : 'rgba(255, 255, 255, 0.97)'),
          color: 'text.primary',
          borderRadius: '12px',
          border: (theme) =>
            theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.14)'
              : '1px solid rgba(49, 92, 80, 0.2)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 16px 40px -6px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
              : '0 16px 36px -6px rgba(15, 23, 42, 0.16), 0 2px 8px rgba(15, 23, 42, 0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          p: { xs: 2, sm: 2.25 },
          animation: closing
            ? 'cookieBannerSlideDown 0.26s cubic-bezier(0.4, 0, 1, 1) forwards'
            : 'cookieBannerSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          boxSizing: 'border-box'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {/* Icon Badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              minWidth: 38,
              borderRadius: '9px',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              flexShrink: 0
            }}
          >
            <Cookie size={20} />
          </Box>

          {/* Text Content */}
          <Box sx={{ flex: 1, minWidth: 0, pr: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.2 }}>
                Chấp thuận Điều khoản & Cookies
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleAccept('essential')}
                aria-label="Đóng thông báo"
                sx={{
                  color: 'text.secondary',
                  p: 0.5,
                  m: -0.5,
                  '&:hover': { color: 'text.primary' }
                }}
              >
                <X size={16} />
              </IconButton>
            </Box>

            <Typography
              variant="body2"
              sx={{
                fontSize: 12,
                lineHeight: 1.5,
                color: 'text.secondary',
                mb: 1.75
              }}
            >
              Finora (Tích Sản) sử dụng cookie cục bộ và bộ nhớ an toàn (Local-First) để duy trì phiên làm việc, mã hóa dữ liệu tài chính và đảm bảo tuân thủ Luật Bảo vệ dữ liệu cá nhân (91/2025/QH15). Bằng việc tiếp tục truy cập, bạn đồng ý với{' '}
              <Link
                to="/legal"
                target="_blank"
                style={{
                  color: 'var(--brand-primary, #10B981)',
                  fontWeight: 700,
                  textDecoration: 'underline'
                }}
              >
                Điều khoản dịch vụ
              </Link>{' '}
              và{' '}
              <Link
                to="/legal"
                target="_blank"
                style={{
                  color: 'var(--brand-primary, #10B981)',
                  fontWeight: 700,
                  textDecoration: 'underline'
                }}
              >
                Chính sách bảo mật
              </Link>.
            </Typography>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleAccept('all')}
                startIcon={<ShieldCheck size={14} />}
                sx={{
                  py: 0.65,
                  px: 1.75,
                  fontSize: 12,
                  fontWeight: 750,
                  borderRadius: '7px',
                  textTransform: 'none',
                  bgcolor: 'var(--brand-primary, #10B981)',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: 'var(--brand-primary-hover, #059669)',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }
                }}
              >
                Chấp nhận tất cả
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => handleAccept('essential')}
                sx={{
                  py: 0.65,
                  px: 1.5,
                  fontSize: 12,
                  fontWeight: 650,
                  borderRadius: '7px',
                  textTransform: 'none',
                  borderColor: 'var(--border-subtle)',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'text.primary',
                    color: 'text.primary',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                Chỉ cookie cần thiết
              </Button>

              <Button
                component={Link}
                to="/legal"
                target="_blank"
                size="small"
                endIcon={<ExternalLink size={12} />}
                sx={{
                  py: 0.65,
                  px: 1,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'none',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                Chi tiết
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
