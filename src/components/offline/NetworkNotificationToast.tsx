import { useEffect, useState, useRef } from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { subscribeNetworkToast, type NetworkToastPayload } from '../../lib/offline/networkStatus';

export function NetworkNotificationToast() {
  const [toast, setToast] = useState<NetworkToastPayload | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = subscribeNetworkToast((payload) => {
      // Clear any pending dismissal
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setIsExiting(false);
      setToast(payload);

      const duration = payload.duration ?? 3000;
      timerRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setToast(null);
      setIsExiting(false);
    }, 280);
  };

  if (!toast) return null;

  const isOffline = toast.type === 'offline';
  const isSyncing = toast.type === 'syncing';
  const isWarning = toast.type === 'warning';

  const themeConfig = (() => {
    if (isOffline) {
      return {
        accent: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.4)',
        glow: '0 8px 24px rgba(239, 68, 68, 0.25)',
        icon: <WifiOff size={18} strokeWidth={2.4} />
      };
    }
    if (isSyncing) {
      return {
        accent: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.12)',
        border: 'rgba(59, 130, 246, 0.4)',
        glow: '0 8px 24px rgba(59, 130, 246, 0.25)',
        icon: <RefreshCw size={18} className="spin-animate" strokeWidth={2.4} />
      };
    }
    if (isWarning) {
      return {
        accent: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.4)',
        glow: '0 8px 24px rgba(245, 158, 11, 0.25)',
        icon: <AlertTriangle size={18} strokeWidth={2.4} />
      };
    }
    return {
      accent: '#10B981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.4)',
      glow: '0 8px 24px rgba(16, 185, 129, 0.25)',
      icon: <CheckCircle2 size={18} strokeWidth={2.4} />
    };
  })();

  const durationSec = ((toast.duration ?? 3000) / 1000).toFixed(1);

  return (
    <>
      <style>{`
        @keyframes slideDownFromTop {
          0% {
            opacity: 0;
            transform: translate3d(-50%, -48px, 0) scale(0.95);
          }
          60% {
            transform: translate3d(-50%, 4px, 0) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translate3d(-50%, 0, 0) scale(1);
          }
        }
        @keyframes slideUpToTop {
          0% {
            opacity: 1;
            transform: translate3d(-50%, 0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(-50%, -48px, 0) scale(0.95);
          }
        }
        @keyframes progressCountdown {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>

      <Box
        role="alert"
        aria-live="assertive"
        sx={{
          position: 'fixed',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          width: { xs: 'calc(100vw - 32px)', sm: 'auto' },
          minWidth: { sm: 380 },
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 520 },
          borderRadius: '16px',
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.94)' : 'rgba(255, 255, 255, 0.97)'),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1.5px solid ${themeConfig.border}`,
          boxShadow: `0 14px 38px -6px rgba(0, 0, 0, 0.35), ${themeConfig.glow}`,
          overflow: 'hidden',
          animation: isExiting ? 'slideUpToTop 0.28s ease-in forwards' : 'slideDownFromTop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          pointerEvents: 'auto',
          transition: 'box-shadow 0.2s ease'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: '12px 16px',
            position: 'relative'
          }}
        >
          {/* Glowing Status Icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              minWidth: 36,
              borderRadius: '12px',
              bgcolor: themeConfig.bg,
              color: themeConfig.accent,
              boxShadow: `0 0 12px ${themeConfig.border}`
            }}
          >
            {themeConfig.icon}
          </Box>

          {/* Text Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  fontSize: 13.5,
                  letterSpacing: '-0.01em',
                  color: (theme) => (theme.palette.mode === 'dark' ? '#F9FAFB' : '#111827'),
                  lineHeight: 1.25
                }}
              >
                {toast.title}
              </Typography>

              {toast.latencyMs !== undefined && toast.latencyMs > 0 && (
                <Chip
                  size="small"
                  label={`${toast.latencyMs}ms`}
                  sx={{
                    height: 19,
                    fontSize: 10.5,
                    fontWeight: 800,
                    bgcolor: themeConfig.bg,
                    color: themeConfig.accent,
                    border: `1px solid ${themeConfig.border}`,
                    borderRadius: '6px'
                  }}
                />
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                fontSize: 12,
                color: (theme) => (theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563'),
                mt: 0.25,
                lineHeight: 1.35
              }}
            >
              {toast.message}
            </Typography>
          </Box>

          {/* Close button */}
          <IconButton
            size="small"
            onClick={handleClose}
            aria-label="Đóng thông báo mạng"
            sx={{
              width: 26,
              height: 26,
              minWidth: 26,
              color: 'text.secondary',
              opacity: 0.7,
              '&:hover': { opacity: 1, bgcolor: 'action.hover' }
            }}
          >
            <X size={15} />
          </IconButton>
        </Box>

        {/* 3s Animated Countdown Progress Bar */}
        <Box
          sx={{
            height: 3,
            width: '100%',
            bgcolor: 'action.hover',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              height: '100%',
              bgcolor: themeConfig.accent,
              animation: `progressCountdown ${durationSec}s linear forwards`
            }}
          />
        </Box>
      </Box>
    </>
  );
}
