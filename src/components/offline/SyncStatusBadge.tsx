import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Tooltip,
  Badge,
  Popover,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Signal,
  Activity,
  Cloud,
  Database,
  Zap,
  ShieldCheck,
  X,
  UserPlus
} from 'lucide-react';
import { useFinance } from '../../store';
import { stashGuestMigrationData } from '../../services/financeService';
import { navigateToAuth } from '../../lib/domainRouting';
import {
  getConnectionDetails,
  networkManager,
  type NetworkCheckResult
} from '../../lib/offline/networkStatus';

export function SyncStatusBadge() {
  const navigate = useNavigate();
  const { data, networkState, pendingCount, syncNow } = useFinance();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [checkingNetwork, setCheckingNetwork] = useState(false);
  const [liveLatency, setLiveLatency] = useState<number>(networkManager.getLastLatency());
  const [serverReachable, setServerReachable] = useState<boolean>(networkManager.isServerReachable());

  // Listen to network check completions to update modal state
  useEffect(() => {
    const handleCheckResult = (event: Event) => {
      const custom = event as CustomEvent<NetworkCheckResult>;
      if (custom.detail) {
        setLiveLatency(custom.detail.latencyMs);
        setServerReachable(custom.detail.serverReachable);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('finora:network-check-completed', handleCheckResult);
      return () => window.removeEventListener('finora:network-check-completed', handleCheckResult);
    }
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    // Refresh connection info when opened
    setLiveLatency(networkManager.getLastLatency());
    setServerReachable(networkManager.isServerReachable());
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isGuest = Boolean(data?.user?.isGuest);

  const handleManualSync = async () => {
    if (isGuest && data) {
      stashGuestMigrationData(data);
      const dataStr = JSON.stringify(data);
      const params: Record<string, string> = {
        migrate_guest: '1',
        sync: '1'
      };
      if (dataStr.length < 3000) {
        params.guest_payload = encodeURIComponent(dataStr);
      }
      handleClose();
      navigateToAuth('register', (path) => navigate(path), params);
      return;
    }

    setSyncing(true);
    try {
      await syncNow();
    } finally {
      setSyncing(false);
    }
  };

  const handleCheckConnection = async () => {
    setCheckingNetwork(true);
    try {
      const result = await networkManager.checkRealConnection({ userInitiated: true });
      setLiveLatency(result.latencyMs);
      setServerReachable(result.serverReachable);
    } finally {
      setCheckingNetwork(false);
    }
  };

  const open = Boolean(anchorEl);

  const isOffline =
    networkState === 'OFFLINE' || (typeof navigator !== 'undefined' && !navigator.onLine);
  const isSyncing = networkState === 'SYNCING' || syncing;
  const isConflict = networkState === 'SYNC_CONFLICT';
  const isFailed = networkState === 'SYNC_FAILED';

  const getStatusConfig = () => {
    if (isGuest) {
      return {
        icon: <HardDrive size={20} strokeWidth={2.4} />,
        headerIcon: <HardDrive size={26} strokeWidth={2.2} />,
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
        glow: '0 0 20px rgba(16, 185, 129, 0.25)',
        title: 'Phiên dùng thử Ngoại tuyến',
        badgeText: 'Chế độ Khách',
        desc: 'Bạn đang ghi chép mà chưa tạo tài khoản. Mọi dữ liệu lưu an toàn trên máy này. Bấm nút đồng bộ để tạo tài khoản và chuyển toàn bộ dữ liệu lên đám mây!'
      };
    }
    if (isOffline) {
      return {
        icon: <WifiOff size={20} strokeWidth={2.4} />,
        headerIcon: <WifiOff size={26} strokeWidth={2.2} />,
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
        glow: '0 0 20px rgba(239, 68, 68, 0.25)',
        title: 'Ngoại tuyến (Mất mạng)',
        badgeText: 'Chế độ Offline',
        desc: 'Không có kết nối Internet. Mọi thao tác thêm, sửa, xóa giao dịch của bạn vẫn được lưu giữ trọn vẹn và an toàn 100% trong bộ nhớ IndexedDB của máy.'
      };
    }
    if (isSyncing) {
      return {
        icon: <RefreshCw size={20} className="spin-animate" strokeWidth={2.4} />,
        headerIcon: <RefreshCw size={26} className="spin-animate" strokeWidth={2.2} />,
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.12)',
        borderColor: 'rgba(59, 130, 246, 0.35)',
        glow: '0 0 20px rgba(59, 130, 246, 0.25)',
        title: 'Đang đồng bộ dữ liệu...',
        badgeText: 'Syncing',
        desc: 'Hệ thống đang đồng bộ các thay đổi thu chi mới nhất lên máy chủ đám mây Finora.'
      };
    }
    if (isConflict) {
      return {
        icon: <AlertTriangle size={20} strokeWidth={2.4} />,
        headerIcon: <AlertTriangle size={26} strokeWidth={2.2} />,
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        glow: '0 0 20px rgba(245, 158, 11, 0.25)',
        title: 'Xung đột dữ liệu',
        badgeText: 'Cần chú ý',
        desc: 'Phát hiện có thay đổi cùng lúc từ thiết bị khác. Hệ thống đang giữ bản ghi mới nhất an toàn.'
      };
    }
    if (isFailed) {
      return {
        icon: <AlertTriangle size={20} strokeWidth={2.4} />,
        headerIcon: <AlertTriangle size={26} strokeWidth={2.2} />,
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
        glow: '0 0 20px rgba(239, 68, 68, 0.25)',
        title: 'Máy chủ tạm gián đoạn',
        badgeText: 'Chậm phản hồi',
        desc: 'Thiết bị của bạn có Internet nhưng kết nối máy chủ Finora đang chập chờn. Dữ liệu vẫn được bảo vệ tại máy.'
      };
    }

    const conn = getConnectionDetails();
    return {
      icon: conn.type === 'cellular' ? <Signal size={20} strokeWidth={2.4} /> : <Wifi size={20} strokeWidth={2.4} />,
      headerIcon: conn.type === 'cellular' ? <Signal size={26} strokeWidth={2.2} /> : <Wifi size={26} strokeWidth={2.2} />,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      glow: '0 0 20px rgba(16, 185, 129, 0.25)',
      title: 'Đã kết nối Internet',
      badgeText: 'Trực tuyến',
      desc: 'Đường truyền ổn định. Dữ liệu tài chính được sao lưu liên tục giữa thiết bị và máy chủ bảo mật.'
    };
  };

  const status = getStatusConfig();
  const connDetails = getConnectionDetails();

  return (
    <>
      <Tooltip title={`Mạng: ${status.title}${pendingCount > 0 ? ` (${pendingCount} thao tác chờ đồng bộ)` : ''}`}>
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            width: 38,
            height: 38,
            minWidth: 38,
            minHeight: 38,
            borderRadius: '12px',
            bgcolor: status.bgColor,
            border: `1.5px solid ${status.borderColor}`,
            color: status.color,
            transition: 'all 0.25s ease',
            '&:hover': {
              bgcolor: status.bgColor,
              transform: 'scale(1.05)',
              boxShadow: status.glow
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
                fontSize: 9.5,
                height: 16,
                minWidth: 16,
                padding: '0 4px',
                fontWeight: 800,
                top: -4,
                right: -4,
                boxShadow: '0 0 0 2px var(--bg-surface, #1E293B)'
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
          backdrop: {
            invisible: false,
            sx: {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(6, 11, 20, 0.72)' : 'rgba(15, 23, 42, 0.58)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }
          },
          paper: {
            sx: {
              p: { xs: 2.5, sm: 3 },
              width: { xs: 'calc(100vw - 32px)', sm: 440 },
              maxWidth: 440,
              borderRadius: '24px',
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.96)' : 'rgba(255, 255, 255, 0.98)'),
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: (theme) =>
                theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 24px 56px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              overflow: 'hidden'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Header Bar */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '16px',
                  bgcolor: status.bgColor,
                  color: status.color,
                  border: `1.5px solid ${status.borderColor}`,
                  boxShadow: status.glow
                }}
              >
                {status.headerIcon}
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 16.5, lineHeight: 1.25 }}>
                    {status.title}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
                  Trạng thái mạng & Đồng bộ dữ liệu
                </Typography>
              </Box>
            </Box>

            <IconButton
              size="small"
              onClick={handleClose}
              sx={{
                color: 'text.secondary',
                borderRadius: '10px',
                p: 0.75,
                '&:hover': { bgcolor: 'action.hover' }
              }}
              aria-label="Đóng popup"
            >
              <X size={18} />
            </IconButton>
          </Box>

          {/* Status Explanation Card */}
          <Box
            sx={{
              p: 2,
              borderRadius: '16px',
              bgcolor: status.bgColor,
              border: `1px solid ${status.borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13, color: status.color }}>
                {status.badgeText}
              </Typography>
              <Chip
                size="small"
                icon={<HardDrive size={12} />}
                label="Offline-First Engine"
                sx={{
                  height: 22,
                  fontSize: 10.5,
                  fontWeight: 700,
                  bgcolor: 'background.paper',
                  border: `1px solid ${status.borderColor}`
                }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{
                fontSize: 12.5,
                color: (theme) => (theme.palette.mode === 'dark' ? '#D1D5DB' : '#374151'),
                lineHeight: 1.5
              }}
            >
              {status.desc}
            </Typography>
          </Box>

          {/* Diagnostic Metrics Matrix (2x2 Grid) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1.5
            }}
          >
            {/* Metric 1: Ping / Latency */}
            <Box
              sx={{
                p: 1.75,
                borderRadius: '16px',
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <Zap size={15} color="#10B981" />
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11.5 }}>
                  Độ trễ (Ping)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 0.25 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 850,
                    fontSize: 16,
                    color: isOffline ? 'text.secondary' : liveLatency < 80 ? '#10B981' : '#F59E0B'
                  }}
                >
                  {isOffline ? '---' : `${liveLatency} ms`}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>
                  {isOffline ? 'Mất mạng' : liveLatency < 60 ? 'Cực nhanh' : 'Bình thường'}
                </Typography>
              </Box>
            </Box>

            {/* Metric 2: Connection Type */}
            <Box
              sx={{
                p: 1.75,
                borderRadius: '16px',
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <Activity size={15} color="#3B82F6" />
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11.5 }}>
                  Kiểu mạng
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 0.25 }}>
                <Typography variant="body1" sx={{ fontWeight: 850, fontSize: 15, textTransform: 'capitalize' }}>
                  {connDetails.type === 'cellular' ? '4G Di động' : connDetails.type === 'wifi' ? 'Wi-Fi' : connDetails.type === 'ethernet' ? 'Mạng LAN' : 'Internet'}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>
                  {isOffline ? 'Offline' : 'Hoạt động'}
                </Typography>
              </Box>
            </Box>

            {/* Metric 3: Finora Cloud Server */}
            <Box
              sx={{
                p: 1.75,
                borderRadius: '16px',
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <Cloud size={15} color="#8B5CF6" />
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11.5 }}>
                  Máy chủ Finora
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 0.25 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 850,
                    fontSize: 14.5,
                    color: serverReachable ? '#10B981' : isOffline ? 'text.secondary' : '#F59E0B'
                  }}
                >
                  {serverReachable ? 'Sẵn sàng' : isOffline ? 'Ngoại tuyến' : 'Tạm gián đoạn'}
                </Typography>
              </Box>
            </Box>

            {/* Metric 4: Safe Local Cache (IndexedDB) */}
            <Box
              sx={{
                p: 1.75,
                borderRadius: '16px',
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <Database size={15} color="#EC4899" />
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11.5 }}>
                  Bộ nhớ máy
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 0.25 }}>
                <Typography variant="body1" sx={{ fontWeight: 850, fontSize: 14.5, color: '#10B981' }}>
                  IndexedDB
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>
                  An toàn
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Sync Outbox Queue Banner */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: '16px',
              bgcolor: pendingCount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.08)',
              border: '1px solid',
              borderColor: pendingCount > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              {pendingCount > 0 ? (
                <AlertTriangle size={18} color="#F59E0B" />
              ) : (
                <ShieldCheck size={18} color="#10B981" />
              )}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13 }}>
                  {pendingCount > 0 ? `${pendingCount} thao tác đang đợi đồng bộ` : 'Dữ liệu đã đồng bộ hoàn toàn'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
                  {pendingCount > 0
                    ? 'Sẽ tự động gửi lên máy chủ ngay khi có kết nối mạng'
                    : 'Không có thay đổi tồn đọng trong hàng đợi Outbox'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 0.25 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="medium"
              disabled={checkingNetwork}
              onClick={handleCheckConnection}
              startIcon={checkingNetwork ? <CircularProgress size={16} color="inherit" /> : <RefreshCw size={16} />}
              sx={{
                flex: 1,
                fontWeight: 750,
                fontSize: 13,
                borderRadius: '14px',
                py: 1.2,
                borderWidth: '1.5px',
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderWidth: '1.5px'
                }
              }}
            >
              {checkingNetwork ? 'Đang đo mạng...' : 'Kiểm tra mạng'}
            </Button>

            <Button
              variant="contained"
              size="medium"
              disabled={isSyncing || (!isGuest && isOffline)}
              onClick={handleManualSync}
              startIcon={
                isSyncing ? (
                  <CircularProgress size={16} color="inherit" />
                ) : isGuest ? (
                  <UserPlus size={16} />
                ) : (
                  <Cloud size={16} />
                )
              }
              sx={{
                flex: 1.15,
                fontWeight: 800,
                fontSize: 13,
                borderRadius: '14px',
                py: 1.2,
                textTransform: 'none',
                boxShadow: isGuest
                  ? '0 8px 20px rgba(16, 185, 129, 0.25)'
                  : '0 8px 20px rgba(59, 130, 246, 0.25)',
                bgcolor: isGuest ? '#10B981' : undefined,
                '&:hover': {
                  bgcolor: isGuest ? '#059669' : undefined
                }
              }}
            >
              {isSyncing ? 'Đang gửi...' : isGuest ? 'Đăng ký đồng bộ' : 'Đồng bộ ngay'}
            </Button>
          </Box>

          {/* Reassurance Footer */}
          <Typography
            variant="caption"
            sx={{
              textAlign: 'center',
              fontSize: 11.5,
              color: 'text.secondary',
              lineHeight: 1.4,
              mt: -0.5
            }}
          >
            <b>Offline-First</b>: Bạn có thể thêm giao dịch bình thường khi mất mạng. Finora tự động đồng bộ khi có kết nối trở lại.
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
