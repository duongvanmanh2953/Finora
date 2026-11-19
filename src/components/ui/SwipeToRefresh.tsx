import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { RefreshCw, ArrowDown, CheckCircle } from 'lucide-react';

interface SwipeToRefreshProps {
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  pullDownThreshold?: number;
  maxPullDistance?: number;
  children: React.ReactNode;
}

export function SwipeToRefresh({
  onRefresh,
  disabled = false,
  pullDownThreshold = 68,
  maxPullDistance = 110,
  children
}: SwipeToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const startY = useRef<number>(0);
  const startX = useRef<number>(0);
  const isEligible = useRef<boolean>(false);
  const hasVibrated = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAtPageTop = useCallback(() => {
    if (typeof window === 'undefined') return true;
    const windowScrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    return windowScrollTop <= 2;
  }, []);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(14);
      } catch {
        // Safe ignore
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;

    if (isAtPageTop()) {
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      isEligible.current = true;
      hasVibrated.current = false;
    } else {
      isEligible.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isEligible.current || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startY.current;
    const diffX = currentX - startX.current;

    // If gesture is more horizontal than vertical (e.g. scrolling tab or chart), cancel pull
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isEligible.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    // Only activate when pulling downwards from the very top
    if (diffY > 0 && isAtPageTop()) {
      setIsPulling(true);
      // Damped rubber-band physics curve
      const dampedDistance = Math.min(Math.pow(diffY, 0.83) * 1.6, maxPullDistance);
      setPullDistance(dampedDistance);

      if (dampedDistance >= pullDownThreshold && !hasVibrated.current) {
        hasVibrated.current = true;
        triggerHaptic();
      } else if (dampedDistance < pullDownThreshold) {
        hasVibrated.current = false;
      }

      // Prevent native viewport elastic jump when actively pulling our custom widget
      if (e.cancelable && diffY > 8) {
        e.preventDefault();
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isEligible.current || disabled || isRefreshing) {
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    isEligible.current = false;
    setIsPulling(false);

    if (pullDistance >= pullDownThreshold) {
      setIsRefreshing(true);
      setPullDistance(52); // Keep docked at 52px during refresh

      try {
        await Promise.resolve(onRefresh());
        setIsSuccess(true);
        triggerHaptic();
        // Show success state briefly
        await new Promise(res => setTimeout(res, 600));
      } catch (err) {
        console.error('Error during SwipeToRefresh:', err);
      } finally {
        setIsSuccess(false);
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Rebound back to 0
      setPullDistance(0);
    }
  };

  const handleTouchCancel = () => {
    isEligible.current = false;
    setIsPulling(false);
    if (!isRefreshing) {
      setPullDistance(0);
    }
  };

  // Prevent scroll leaks when refreshing
  useEffect(() => {
    if (!isPulling && !isRefreshing && pullDistance !== 0) {
      const timer = setTimeout(() => setPullDistance(0), 200);
      return () => clearTimeout(timer);
    }
  }, [isPulling, isRefreshing, pullDistance]);

  const isThresholdMet = pullDistance >= pullDownThreshold;
  const progressRatio = Math.min(pullDistance / pullDownThreshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%'
      }}
    >
      {/* Floating Refresh Indicator Pill */}
      {showIndicator && (
        <Box
          sx={{
            position: 'fixed',
            top: {
              xs: 'calc(56px + 10px + env(safe-area-inset-top, 0px))',
              md: 'calc(var(--topbar-h, 60px) + 12px)'
            },
            left: '50%',
            transform: `translateX(-50%) translateY(${Math.min(pullDistance * 0.4, 20)}px) scale(${0.85 + progressRatio * 0.15})`,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 1.1,
            px: 2,
            py: 0.9,
            borderRadius: '9999px',
            bgcolor: 'var(--bg-surface, #1E293B)',
            color: 'var(--text-primary, #FFFFFF)',
            border: '1.5px solid',
            borderColor: isSuccess
              ? '#10B981'
              : isThresholdMet || isRefreshing
              ? 'rgba(16, 185, 129, 0.6)'
              : 'var(--border-subtle, rgba(255, 255, 255, 0.15))',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
            backdropFilter: 'blur(12px)',
            transition: isPulling ? 'none' : 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          {isSuccess ? (
            <CheckCircle size={16} color="#10B981" />
          ) : isRefreshing ? (
            <RefreshCw size={16} color="#10B981" className="spin-animate" />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotate(${isThresholdMet ? 180 : progressRatio * 180}deg)`,
                transition: isPulling ? 'transform 0.08s ease' : 'transform 0.2s ease',
                color: isThresholdMet ? '#10B981' : 'var(--text-secondary, #94A3B8)'
              }}
            >
              <ArrowDown size={16} />
            </Box>
          )}

          <Typography
            variant="caption"
            sx={{
              fontWeight: 750,
              fontSize: '12px',
              letterSpacing: '-0.01em',
              color: isSuccess
                ? '#10B981'
                : isThresholdMet || isRefreshing
                ? 'var(--text-primary, #FFFFFF)'
                : 'var(--text-secondary, #94A3B8)',
              whiteSpace: 'nowrap'
            }}
          >
            {isSuccess
              ? 'Đã làm mới dữ liệu!'
              : isRefreshing
              ? 'Đang làm mới dữ liệu...'
              : isThresholdMet
              ? 'Thả tay để làm mới'
              : 'Kéo xuống để làm mới'}
          </Typography>
        </Box>
      )}

      {/* Main Content wrapper with subtle elastic translateY feedback */}
      <div
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance * 0.45}px)` : 'translateY(0px)',
          transition: isPulling ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: isPulling ? 'transform' : 'auto'
        }}
      >
        {children}
      </div>
    </div>
  );
}
