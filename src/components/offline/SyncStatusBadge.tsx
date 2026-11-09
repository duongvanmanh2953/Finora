import { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Badge,
  Popover,
  Typography,
  Button,
  CircularProgress,
  Chip
} from '@mui/material';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, HardDrive } from 'lucide-react';
import { useFinance } from '../../store';

export function SyncStatusBadge() {
  const { networkState, pendingCount, syncNow } = useFinance();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await syncNow();
    } finally {
      setSyncing(false);
    }
  };

  const open = Boolean(anchorEl);

  const isOffline = networkState === 'OFFLINE';
  const isSyncing = networkState === 'SYNCING' || syncing;
  const isConflict = networkState === 'SYNC_CONFLICT';
  const isFailed = networkState === 'SYNC_FAILED';

  const getStatusConfig = () => {
    if (isOffline) {
      return {
        icon: <WifiOff size={16} />,
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
        label: 'Ngoại tuyến (Offline)',
        desc: 'Đang hoạt động trên dữ liệu lưu cục bộ IndexedDB. Mọi thao tác đều được bảo toàn.'
      };
    }
    if (isSyncing) {
      return {
        icon: <RefreshCw size={16} className="spin-animate" />,
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.12)',
        borderColor: 'rgba(59, 130, 246, 0.35)',
        label: 'Đang đồng bộ...',
        desc: 'Đang đẩy các thay đổi chưa lưu lên máy chủ Tích Sản.'
      };
    }
    if (isConflict) {
      return {
        icon: <AlertTriangle size={16} />,
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        label: 'Xung đột dữ liệu',
        desc: 'Có thay đổi trên thiết bị khác cùng lúc. Hệ thống giữ bản ghi an toàn.'
      };
    }
    if (isFailed) {
      return {
        icon: <AlertTriangle size={16} />,
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
        label: 'Đồng bộ gián đoạn',
        desc: 'Kết nối mạng chập chờn. Sẽ tự động thử lại khi mạng ổn định.'
      };
    }
    return {
      icon: <Wifi size={16} />,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      label: 'Đã kết nối (Online)',
      desc: 'Dữ liệu được đồng bộ liên tục với máy chủ và lưu an toàn trong IndexedDB.'
    };
  };

  const status = getStatusConfig();

  return (
    <>
      <Tooltip title={`Trạng thái: ${status.label}${pendingCount > 0 ? ` (${pendingCount} thay đổi chờ đồng bộ)` : ''}`}>
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            width: 34,
            height: 34,
            minWidth: 34,
            minHeight: 34,
            borderRadius: '11px',
            bgcolor: status.bgColor,
            border: `1px solid ${status.borderColor}`,
            color: status.color,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: status.bgColor,
              filter: 'brightness(0.95)'
            }
          }}
          aria-label="Trạng thái kết nối và đồng bộ"
        >
          <Badge
            badgeContent={pendingCount > 0 ? pendingCount : 0}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: 9,
                height: 15,
                minWidth: 15,
                padding: '0 3px',
                fontWeight: 800,
                top: -3,
                right: -3
              }
            }}
          >
            {status.icon}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              width: 290,
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  bgcolor: status.bgColor,
                  color: status.color
                }}
              >
                {status.icon}
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13.5 }}>
                {status.label}
              </Typography>
            </Box>

            <Chip
              size="small"
              icon={<HardDrive size={11} />}
              label="IndexedDB"
              sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
            />
          </Box>

          <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.45 }}>
            {status.desc}
          </Typography>

          <Box
            sx={{
              p: 1.25,
              borderRadius: '12px',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 650, color: 'text.secondary' }}>
              Hàng đợi thay đổi:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: pendingCount > 0 ? 'warning.main' : 'success.main' }}>
              {pendingCount > 0 ? `${pendingCount} thao tác chờ` : 'Đã đồng bộ hết'}
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="small"
            fullWidth
            disabled={isSyncing || isOffline}
            onClick={handleManualSync}
            startIcon={isSyncing ? <CircularProgress size={14} color="inherit" /> : <RefreshCw size={14} />}
            sx={{
              fontWeight: 750,
              fontSize: 12.5,
              borderRadius: '11px',
              minHeight: 36
            }}
          >
            {isSyncing ? 'Đang đồng bộ...' : isOffline ? 'Đang Offline (Chờ kết nối)' : 'Đồng bộ ngay'}
          </Button>
        </Box>
      </Popover>
    </>
  );
}
