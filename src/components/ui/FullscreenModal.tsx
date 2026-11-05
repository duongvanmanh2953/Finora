import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Chip
} from '@mui/material';
import { Maximize2, Minimize2 } from 'lucide-react';

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
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: 'background.default',
          backgroundImage: 'none',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
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
            </Box>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: { xs: 'none', sm: 'block' },
                  mt: 0.25
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Tooltip title="Thu nhỏ / Đóng toàn màn hình (Esc)">
            <IconButton
              onClick={onClose}
              size="medium"
              sx={{
                bgcolor: 'action.hover',
                borderRadius: '8px',
                p: 1
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
          p: { xs: 1.5, sm: 3 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          bgcolor: 'background.default'
        }}
      >
        {children}
      </DialogContent>
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
