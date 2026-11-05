import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Chip,
  Button
} from '@mui/material';
import { Maximize2, Minimize2, RotateCw } from 'lucide-react';

interface FullscreenModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}

export function FullscreenModal({
  open,
  onClose,
  title,
  subtitle,
  badge = 'Toàn màn hình',
  children
}: FullscreenModalProps) {
  // Always default to normal fullscreen so charts and tables never collapse or turn black on load.
  // User can click "Xoay ngang 90°" button anytime to toggle landscape simulation.
  const [isLandscape90, setIsLandscape90] = useState(false);
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 600
  });

  useEffect(() => {
    const updateDimensions = () => {
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  // Reset rotation when modal closes
  useEffect(() => {
    if (!open) {
      setIsLandscape90(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      sx={{
        zIndex: 1300,
        '& .MuiDialog-paper': {
          bgcolor: 'background.default',
          backgroundImage: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: '100vw',
          height: '100vh',
          m: 0,
          p: 0
        }
      }}
    >
      <Box
        sx={
          isLandscape90
            ? {
                position: 'fixed',
                top: '50%',
                left: '50%',
                width: `${viewport.h}px`,
                height: `${viewport.w}px`,
                transform: 'translate(-50%, -50%) rotate(90deg)',
                transformOrigin: 'center center',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
                overflow: 'hidden',
                zIndex: 10
              }
            : {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                bgcolor: 'background.default'
              }
        }
      >
        <DialogTitle
          sx={{
            p: { xs: 1.5, sm: 2.25 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1, mr: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.92rem', sm: '1.15rem' },
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {title}
                </Typography>
                {badge && (
                  <Chip
                    label={badge}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      bgcolor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  />
                )}
                {isLandscape90 && (
                  <Chip
                    label="Chế độ ngang 90°"
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: { xs: 'none', sm: 'block' },
                    mt: 0.25,
                    fontSize: '0.78rem'
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {/* Rotate 90 degrees toggle button */}
            <Tooltip title={isLandscape90 ? 'Trở về chiều dọc bình thường' : 'Xoay ngang 90° để xem bảng/biểu đồ cực rộng'}>
              <Button
                variant={isLandscape90 ? 'contained' : 'outlined'}
                color={isLandscape90 ? 'primary' : 'inherit'}
                size="small"
                startIcon={<RotateCw size={14} />}
                onClick={() => setIsLandscape90(prev => !prev)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 750,
                  fontSize: '0.76rem',
                  py: 0.5,
                  px: { xs: 1, sm: 1.5 },
                  borderRadius: '6px'
                }}
              >
                {isLandscape90 ? 'Xoay dọc' : 'Xoay ngang 90°'}
              </Button>
            </Tooltip>

            <Tooltip title="Thu nhỏ / Đóng toàn màn hình (Esc)">
              <IconButton
                onClick={onClose}
                size="medium"
                sx={{
                  bgcolor: 'action.hover',
                  borderRadius: '8px',
                  p: 0.9,
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'action.selected'
                  }
                }}
                aria-label="Đóng toàn màn hình"
              >
                <Minimize2 size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            p: { xs: 1.25, sm: 2.5 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            bgcolor: 'background.default',
            width: '100%',
            height: '100%',
            minHeight: { xs: 350, sm: 480 }
          }}
        >
          {children}
        </DialogContent>
      </Box>
    </Dialog>
  );
}

interface FullscreenButtonProps {
  onClick: () => void;
  title?: string;
  size?: number;
}

export function FullscreenButton({
  onClick,
  title = 'Mở rộng toàn màn hình',
  size = 15
}: FullscreenButtonProps) {
  return (
    <Tooltip title={title}>
      <IconButton
        onClick={onClick}
        size="small"
        sx={{
          p: 0.6,
          color: 'text.secondary',
          borderRadius: '6px',
          transition: 'all 0.15s ease',
          '&:hover': {
            color: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
        aria-label={title}
      >
        <Maximize2 size={size} />
      </IconButton>
    </Tooltip>
  );
}
