import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  IconButton,
  Alert
} from '@mui/material';
import {
  LogOut,
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  RefreshCw,
  X,
  ShieldAlert
} from 'lucide-react';
import { useFinance } from '../../store';

interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirmLogout: () => Promise<void>;
}

export function LogoutConfirmDialog({ open, onClose, onConfirmLogout }: LogoutConfirmDialogProps) {
  const { pendingCount, networkState, syncNow, notify } = useFinance();
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isOffline = networkState === 'OFFLINE';

  const handleSyncNow = async () => {
    if (isOffline) {
      notify({
        message: 'Thiết bị đang không có kết nối Internet. Vui lòng bật Wi-Fi/4G để đồng bộ.',
        severity: 'warning'
      });
      return;
    }

    setSyncing(true);
    setSyncSuccess(false);
    try {
      await syncNow();
      setSyncSuccess(true);
    } catch (err: any) {
      notify({
        message: err?.message || 'Không thể đồng bộ dữ liệu lúc này. Vui lòng thử lại.',
        severity: 'error'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExecuteLogout = async () => {
    setLoggingOut(true);
    try {
      // Best-effort auto-sync if online and still has pending items
      if (!isOffline && pendingCount > 0) {
        try {
          await syncNow();
        } catch {
          // Continue logout even if sync fails
        }
      }
      await onConfirmLogout();
    } finally {
      setLoggingOut(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loggingOut ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: 'divider',
            p: 1,
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.35)'
          }
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, pt: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              bgcolor: pendingCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.12)',
              color: pendingCount > 0 ? '#F59E0B' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {pendingCount > 0 ? <ShieldAlert size={22} /> : <LogOut size={22} />}
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 750, lineHeight: 1.2 }}>
              Xác nhận đăng xuất
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
              Đồng bộ dữ liệu trước khi thoát
            </Typography>
          </Box>
        </Box>
        {!loggingOut && (
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <X size={18} />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ py: 1.5 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
          Khi đăng xuất, toàn bộ dữ liệu phiên làm việc và bộ nhớ đệm cục bộ trên thiết bị này sẽ được xóa sạch để bảo đảm an toàn.
        </Typography>

        {/* Sync Status Warning Block */}
        {pendingCount > 0 ? (
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              bgcolor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              mb: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2, mb: 1.2 }}>
              <AlertTriangle size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#D97706' }}>
                  Có {pendingCount} thay đổi chưa được đồng bộ!
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3, lineHeight: 1.4 }}>
                  Nếu bạn đăng xuất lúc này, các thay đổi chưa đồng bộ lên máy chủ sẽ bị xóa khỏi thiết bị này và không thể khôi phục.
                </Typography>
              </Box>
            </Box>

            {isOffline ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: '#EF4444', fontSize: 12 }}>
                <CloudOff size={14} />
                <span>Thiết bị đang mất mạng. Hãy kết nối Internet để đồng bộ trước.</span>
              </Box>
            ) : (
              <Button
                variant="outlined"
                size="small"
                fullWidth
                disabled={syncing}
                onClick={handleSyncNow}
                startIcon={syncing ? <CircularProgress size={14} color="inherit" /> : <RefreshCw size={14} />}
                sx={{
                  mt: 0.8,
                  borderColor: '#D97706',
                  color: '#D97706',
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: 13,
                  py: 0.8,
                  '&:hover': {
                    bgcolor: 'rgba(245, 158, 11, 0.1)',
                    borderColor: '#B45309'
                  }
                }}
              >
                {syncing ? 'Đang đồng bộ dữ liệu lên đám mây...' : 'Đồng bộ ngay lên đám mây'}
              </Button>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              p: 1.8,
              borderRadius: '12px',
              bgcolor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              mb: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.2
            }}
          >
            <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#059669' }}>
                Dữ liệu đã được đồng bộ đầy đủ
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3, lineHeight: 1.4 }}>
                Toàn bộ sổ tài chính của bạn đã được sao lưu an toàn trên máy chủ đám mây. Bạn có thể yên tâm đăng xuất.
              </Typography>
            </Box>
          </Box>
        )}

        {syncSuccess && (
          <Alert severity="success" sx={{ py: 0.5, fontSize: 13, borderRadius: '8px' }}>
            Đã đồng bộ toàn bộ dữ liệu thành công!
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          disabled={loggingOut}
          onClick={onClose}
          sx={{
            flex: 1,
            borderRadius: '10px',
            textTransform: 'none',
            color: 'text.primary',
            borderColor: 'divider',
            fontWeight: 600,
            py: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          Hủy bỏ
        </Button>

        <Button
          variant="contained"
          color="error"
          disabled={loggingOut}
          onClick={handleExecuteLogout}
          startIcon={loggingOut ? <CircularProgress size={16} color="inherit" /> : <LogOut size={16} />}
          sx={{
            flex: 1.4,
            borderRadius: '10px',
            textTransform: 'none',
            bgcolor: '#DC2626',
            color: '#FFFFFF',
            fontWeight: 700,
            py: 1,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#B91C1C',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }
          }}
        >
          {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất & Xóa dữ liệu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
