import { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  WifiOff,
  X
} from 'lucide-react';
import { useFinance } from '../../store';
import { subscribeNetworkToast, type NetworkToastPayload } from '../../lib/offline/networkStatus';

interface ActiveToastItem {
  id: string;
  source: 'store' | 'network';
  title?: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  actionLabel?: string;
  onAction?: () => void;
  latencyMs?: number;
  duration?: number;
}

export function GlobalNotificationToast() {
  const storeToast = useFinance(s => s.toast);
  const clearStoreToast = useFinance(s => s.clearToast);

  const [current, setCurrent] = useState<ActiveToastItem | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const dismissTimerRef = useRef<any>(null);

  // 1. Listen to Store Toast notifications
  useEffect(() => {
    if (storeToast) {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      setIsExiting(false);

      const sev = storeToast.severity || 'success';
      setCurrent({
        id: `store_${Date.now()}`,
        source: 'store',
        message: storeToast.message,
        severity: sev,
        actionLabel: storeToast.actionLabel,
        onAction: storeToast.onAction,
        duration: sev === 'error' ? 5500 : 3800
      });

      const timer = setTimeout(() => {
        handleClose();
      }, sev === 'error' ? 5500 : 3800);
      dismissTimerRef.current = timer;
    }
  }, [storeToast]);

  // 2. Listen to Network status toast events
  useEffect(() => {
    const unsubscribe = subscribeNetworkToast((payload: NetworkToastPayload) => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      setIsExiting(false);

      let sev: 'success' | 'error' | 'warning' | 'info' = 'info';
      if (payload.type === 'offline') sev = 'error';
      else if (payload.type === 'warning') sev = 'warning';
      else if (payload.type === 'online') sev = 'success';
      else if (payload.type === 'syncing') sev = 'info';

      const dur = payload.duration ?? 3500;
      setCurrent({
        id: payload.id || `net_${Date.now()}`,
        source: 'network',
        title: payload.title,
        message: payload.message,
        severity: sev,
        latencyMs: payload.latencyMs,
        duration: dur
      });

      dismissTimerRef.current = setTimeout(() => {
        handleClose();
      }, dur);
    });

    return () => {
      unsubscribe();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setCurrent(null);
      setIsExiting(false);
      clearStoreToast();
    }, 240);
  };

  if (!current) return null;

  const severityConfigs = {
    success: {
      accent: '#10B981',
      bgLight: '#ECFDF5',
      bgDark: 'rgba(16, 185, 129, 0.14)',
      borderLight: '#A7F3D0',
      borderDark: 'rgba(16, 185, 129, 0.35)',
      icon: <CheckCircle2 size={18} strokeWidth={2.4} color="#10B981" />
    },
    error: {
      accent: '#EF4444',
      bgLight: '#FEF2F2',
      bgDark: 'rgba(239, 68, 68, 0.14)',
      borderLight: '#FECACA',
      borderDark: 'rgba(239, 68, 68, 0.35)',
      icon: current.source === 'network' ? <WifiOff size={18} strokeWidth={2.4} color="#EF4444" /> : <AlertCircle size={18} strokeWidth={2.4} color="#EF4444" />
    },
    warning: {
      accent: '#F59E0B',
      bgLight: '#FFFBEB',
      bgDark: 'rgba(245, 158, 11, 0.14)',
      borderLight: '#FDE68A',
      borderDark: 'rgba(245, 158, 11, 0.35)',
      icon: <AlertTriangle size={18} strokeWidth={2.4} color="#F59E0B" />
    },
    info: {
      accent: '#3B82F6',
      bgLight: '#EFF6FF',
      bgDark: 'rgba(59, 130, 246, 0.14)',
      borderLight: '#BFDBFE',
      borderDark: 'rgba(59, 130, 246, 0.35)',
      icon: current.title?.includes('Đang đồng bộ') ? <RefreshCw size={17} className="spin-animate" strokeWidth={2.4} color="#3B82F6" /> : <Info size={18} strokeWidth={2.4} color="#3B82F6" />
    }
  };

  const themeConfig = severityConfigs[current.severity] || severityConfigs.info;

  return (
    <>
      <style>{`
        @keyframes toastSlideDownCenter {
          0% {
            opacity: 0;
            transform: translate3d(-50%, -24px, 0) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translate3d(-50%, 0, 0) scale(1);
          }
        }
        @keyframes toastSlideUpCenter {
          0% {
            opacity: 1;
            transform: translate3d(-50%, 0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(-50%, -20px, 0) scale(0.96);
          }
        }
      `}</style>

      <Box
        role="alert"
        aria-live="assertive"
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 20 },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          width: 'calc(100vw - 32px)',
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 480 },
          boxSizing: 'border-box',
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#161B22' : '#FFFFFF'),
          color: (theme) => (theme.palette.mode === 'dark' ? '#F0F6FC' : '#0F172A'),
          borderRadius: '10px',
          border: (theme) =>
            theme.palette.mode === 'dark'
              ? `1px solid ${themeConfig.borderDark}`
              : `1px solid ${themeConfig.borderLight}`,
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 14px 40px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)'
              : '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          animation: isExiting
            ? 'toastSlideUpCenter 0.22s cubic-bezier(0.4, 0, 1, 1) forwards'
            : 'toastSlideDownCenter 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          pointerEvents: 'auto',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: { xs: 1.5, sm: 2 },
            py: 1.25
          }}
        >
          {/* Status Icon Indicator */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              minWidth: 32,
              borderRadius: '7px',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? themeConfig.bgDark : themeConfig.bgLight,
              flexShrink: 0
            }}
          >
            {themeConfig.icon}
          </Box>

          {/* Message Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {current.title && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 750,
                    fontSize: '0.82rem',
                    lineHeight: 1.2,
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {current.title}
                </Typography>
                {current.latencyMs !== undefined && current.latencyMs > 0 && (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '0.68rem',
                      px: 0.8,
                      py: 0.1,
                      borderRadius: '4px',
                      bgcolor: 'action.hover',
                      color: 'text.secondary',
                      fontWeight: 700
                    }}
                  >
                    {current.latencyMs}ms
                  </Typography>
                )}
              </Box>
            )}

            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.78rem', sm: '0.82rem' },
                lineHeight: 1.4,
                color: (theme) => (theme.palette.mode === 'dark' ? '#E2E8F0' : '#334155'),
                fontWeight: 500,
                wordBreak: 'break-word'
              }}
            >
              {current.message}
            </Typography>
          </Box>

          {/* Action buttons (e.g. Hoàn tác + OK) */}
          {current.actionLabel && current.onAction ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  current.onAction?.();
                  handleClose();
                }}
                sx={{
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  color: themeConfig.accent,
                  borderColor: themeConfig.accent,
                  textTransform: 'none',
                  minWidth: 'auto',
                  py: '3px',
                  px: 1.25,
                  borderRadius: '6px',
                  lineHeight: 1.2,
                  '&:hover': {
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? themeConfig.bgDark : themeConfig.bgLight,
                    borderColor: themeConfig.accent
                  }
                }}
              >
                {current.actionLabel}
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleClose}
                sx={{
                  fontSize: '0.76rem',
                  fontWeight: 750,
                  bgcolor: themeConfig.accent,
                  color: '#FFFFFF',
                  textTransform: 'none',
                  minWidth: 'auto',
                  py: '3px',
                  px: 1.25,
                  borderRadius: '6px',
                  boxShadow: 'none',
                  lineHeight: 1.2,
                  '&:hover': {
                    bgcolor: themeConfig.accent,
                    filter: 'brightness(0.92)'
                  }
                }}
              >
                OK
              </Button>
            </Box>
          ) : null}

          {/* Close Button */}
          <IconButton
            size="small"
            onClick={handleClose}
            aria-label="Đóng thông báo"
            sx={{
              p: 0.6,
              color: 'text.secondary',
              opacity: 0.7,
              flexShrink: 0,
              '&:hover': { opacity: 1, bgcolor: 'action.hover' }
            }}
          >
            <X size={15} />
          </IconButton>
        </Box>
      </Box>
    </>
  );
}
