import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Typography,
  Slide,
  useMediaQuery,
  useTheme
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { X } from 'lucide-react';

const SlideTransition = React.forwardRef(function SlideTransition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * MobileBottomSheet: Adaptive bottom sheet for mobile (<600px) and centered compact modal on desktop (>=600px).
 * Compact Premium Fintech UI design with drag handle indicator, sticky header & sticky footer.
 */
export function MobileBottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'sm'
}: MobileBottomSheetProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      slots={{
        transition: isMobile ? SlideTransition : undefined
      }}
      slotProps={{
        paper: {
          sx: {
            m: isMobile ? 0 : 2,
            position: isMobile ? 'fixed' : 'relative',
            bottom: isMobile ? 0 : 'auto',
            left: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : 'auto',
            width: isMobile ? '100%' : undefined,
            maxWidth: isMobile ? '100%' : undefined,
            borderTopLeftRadius: isMobile ? 24 : 22,
            borderTopRightRadius: isMobile ? 24 : 22,
            borderBottomLeftRadius: isMobile ? 0 : 22,
            borderBottomRightRadius: isMobile ? 0 : 22,
            maxHeight: isMobile ? '88vh' : '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: isDark ? '#141A23' : '#FFFFFF',
            backgroundImage: 'none',
            boxShadow: isMobile
              ? '0 -8px 32px rgba(0, 0, 0, 0.28)'
              : '0 20px 48px rgba(0, 0, 0, 0.24)',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)'
          }
        },
        backdrop: {
          sx: {
            backdropFilter: 'blur(4px)',
            bgcolor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.45)'
          }
        }
      }}
    >
      {/* Mobile Drag Handle */}
      {isMobile && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pt: 1.25,
            pb: 0.5,
            flexShrink: 0
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: 9999,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.18)'
            }}
          />
        </Box>
      )}

      {/* Header */}
      <DialogTitle
        sx={{
          py: isMobile ? 1.25 : 1.75,
          px: isMobile ? 2 : 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          flexShrink: 0
        }}
      >
        <Box sx={{ minWidth: 0, pr: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: isMobile ? '1.05rem' : '1.15rem',
              fontWeight: 800,
              lineHeight: 1.3,
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontSize: '0.78rem',
                color: 'text.secondary',
                mt: 0.25,
                lineHeight: 1.25
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Đóng"
          sx={{
            color: 'text.secondary',
            minWidth: 36,
            minHeight: 36,
            p: 0.75,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
            '&:hover': {
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
            }
          }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>

      {/* Scrollable Content */}
      <DialogContent
        sx={{
          p: isMobile ? '14px 16px' : '20px',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
            borderRadius: 9999
          }
        }}
      >
        {children}
      </DialogContent>

      {/* Sticky Actions Footer */}
      {actions && (
        <DialogActions
          sx={{
            py: isMobile ? 1.5 : 1.75,
            px: isMobile ? 2 : 2.5,
            borderTop: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            bgcolor: isDark ? '#141A23' : '#FFFFFF',
            flexShrink: 0,
            gap: 1
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
