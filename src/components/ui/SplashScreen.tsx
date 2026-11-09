import { useState, useEffect } from 'react';
import { Box, Typography, Chip, LinearProgress } from '@mui/material';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { networkManager } from '../../lib/offline/networkStatus';

export interface SplashScreenProps {
  onFinish?: () => void;
  minimumDurationMs?: number;
}

export function SplashScreen({
  onFinish,
  minimumDurationMs = 1200
}: SplashScreenProps) {
  const [progress, setProgress] = useState(15);
  const [fading, setFading] = useState(false);
  const [isOffline, setIsOffline] = useState(networkManager.getState() === 'OFFLINE');

  useEffect(() => {
    const unsub = networkManager.subscribe(state => {
      setIsOffline(state === 'OFFLINE');
    });

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 200);

    const timer = setTimeout(() => {
      setProgress(100);
      setFading(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 400); // Wait for fade-out transition
    }, minimumDurationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      unsub();
    };
  }, [minimumDurationMs, onFinish]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: { xs: 8, sm: 10 },
        px: 3,
        bgcolor: '#0B1A14',
        backgroundImage: 'radial-gradient(circle at 50% 35%, rgba(53, 94, 82, 0.45) 0%, rgba(11, 26, 20, 0.98) 75%)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: fading ? 'none' : 'auto',
        userSelect: 'none'
      }}
    >
      <Box sx={{ height: 24 }} />

      {/* Main Brand Core */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'splashPulse 2.5s ease-in-out infinite'
        }}
      >
        {/* Logo Squircle with Ambient Aura */}
        <Box
          sx={{
            position: 'relative',
            width: { xs: 96, sm: 112 },
            height: { xs: 96, sm: 112 },
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: -8,
              borderRadius: '28px',
              bgcolor: 'rgba(53, 94, 82, 0.35)',
              filter: 'blur(16px)',
              zIndex: 0
            }}
          />
          <Box
            component="img"
            src="/logo.png?v=20261109"
            alt="Logo Tích Sản"
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              borderRadius: { xs: '24px', sm: '28px' },
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
              objectFit: 'contain'
            }}
          />
        </Box>

        {/* Brand Name */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            letterSpacing: '0.06em',
            color: '#FFFFFF',
            fontSize: { xs: '1.75rem', sm: '2.1rem' },
            textTransform: 'uppercase',
            lineHeight: 1.2,
            textShadow: '0 2px 12px rgba(0,0,0,0.4)'
          }}
        >
          Tích Sản
        </Typography>

        {/* Slogan */}
        <Typography
          variant="subtitle2"
          sx={{
            mt: 0.75,
            fontWeight: 500,
            fontSize: { xs: '0.88rem', sm: '0.98rem' },
            color: 'rgba(255, 255, 255, 0.75)',
            letterSpacing: '0.02em'
          }}
        >
          Tích lũy bền vững · Thịnh vượng tương lai
        </Typography>

        {/* Offline Badge if device is offline */}
        {isOffline && (
          <Chip
            icon={<WifiOff size={13} style={{ color: '#FCD34D' }} />}
            label="Chế độ Ngoại tuyến (IndexedDB)"
            size="small"
            sx={{
              mt: 2,
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 700,
              bgcolor: 'rgba(252, 211, 77, 0.15)',
              color: '#FCD34D',
              border: '1px solid rgba(252, 211, 77, 0.35)'
            }}
          />
        )}
      </Box>

      {/* Bottom Footer & Progress Line */}
      <Box sx={{ width: '100%', maxWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            width: '100%',
            height: 3,
            borderRadius: 9999,
            bgcolor: 'rgba(255, 255, 255, 0.12)',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#10B981',
              borderRadius: 9999,
              transition: 'transform 0.2s ease'
            }
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ShieldCheck size={12} color="rgba(255, 255, 255, 0.5)" />
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.72rem',
              color: 'rgba(255, 255, 255, 0.45)',
              letterSpacing: '0.03em',
              fontWeight: 600
            }}
          >
            Bảo mật & Mã hóa dữ liệu cục bộ
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

