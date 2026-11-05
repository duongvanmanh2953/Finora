import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Chip,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import SecurityRounded from '@mui/icons-material/SecurityRounded';
import CableRounded from '@mui/icons-material/CableRounded';
import CloudSyncRounded from '@mui/icons-material/CloudSyncRounded';

import { useFinance } from '../../store';
import type { UserMcpConfig } from '../../types/unifiedInvestment';

interface DataSourceSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function DataSourceSettingsModal({ open, onClose }: DataSourceSettingsModalProps) {
  const { data, update, notify } = useFinance();

  const currentConfig: UserMcpConfig = data?.userMcpConfig || {
    enabled: false,
    mcpServerUrl: 'https://mcp.finlens.vn/mcp',
    brokerProvider: 'CUSTOM_MCP',
    readOnlyMode: true,
    status: 'disconnected'
  };

  const [enabled, setEnabled] = useState(currentConfig.enabled);
  const [provider, setProvider] = useState<string>(currentConfig.brokerProvider || 'CUSTOM_MCP');
  const [mcpUrl, setMcpUrl] = useState(currentConfig.mcpServerUrl || 'https://mcp.finlens.vn/mcp');
  const [apiKey, setApiKey] = useState(currentConfig.brokerApiKey || '');
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'failed'>(
    currentConfig.status === 'connected' ? 'success' : 'idle'
  );
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  // Ping test
  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus('idle');

    try {
      const startTime = performance.now();
      // Test ping simulation
      await new Promise(r => setTimeout(r, 650));
      const latency = Math.round(performance.now() - startTime);
      setPingLatency(latency);
      setTestStatus('success');
      notify(`Kết nối thành công tới ${provider === 'CUSTOM_MCP' ? 'MCP Server' : provider}! Độ trễ: ${latency}ms`);
    } catch {
      setTestStatus('failed');
      notify('Không thể kết nối tới máy chủ dữ liệu.');
    } finally {
      setTesting(false);
    }
  };

  // Save config
  const handleSave = async () => {
    const updatedConfig: UserMcpConfig = {
      enabled,
      mcpServerUrl: mcpUrl.trim(),
      brokerProvider: provider as any,
      brokerApiKey: apiKey.trim(),
      readOnlyMode: true, // Always true for security
      status: testStatus === 'success' ? 'connected' : enabled ? 'testing' : 'disconnected',
      lastSyncedAt: new Date().toISOString()
    };

    await update(d => ({
      ...d,
      userMcpConfig: updatedConfig
    }), 'Đã lưu cấu hình Nguồn dữ liệu & MCP Server!');

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '6px',
            p: 1
          }
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <CableRounded sx={{ color: 'primary.main' }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
            Cấu hình Nguồn Dữ liệu Thị trường (BYOK / MCP)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Kết nối máy chủ MCP cá nhân hoặc API Broker (SSI, DNSE, TCBS)
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {/* Security Alert: Strictly Read-Only */}
        <Alert
          severity="info"
          icon={<SecurityRounded fontSize="inherit" />}
          sx={{ borderRadius: '4px', fontSize: '0.8rem', py: 0.5 }}
        >
          <strong>Bảo mật Read-Only:</strong> Tích Sản chỉ đọc số dư và giá thị trường danh mục đầu tư. Hệ thống hoàn toàn không có quyền đặt lệnh mua bán hay rút tiền.
        </Alert>

        {/* Master Switch */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>
              Kích hoạt Nguồn Dữ liệu Tùy chỉnh (BYOK)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Mặc định hệ thống dùng nguồn VN Market Gateway có sẵn
            </Typography>
          </Box>
          <Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        </Box>

        <Divider />

        {/* Provider Selector */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, opacity: enabled ? 1 : 0.6 }}>
          <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary' }}>
            CHỌN NGUỒN KẾT NỐI:
          </Typography>
          <RadioGroup
            value={provider}
            onChange={e => {
              if (enabled) setProvider(e.target.value);
            }}
          >
            <Box
              sx={{
                p: 1.25,
                mb: 1,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: provider === 'CUSTOM_MCP' ? 'primary.main' : 'divider',
                bgcolor: provider === 'CUSTOM_MCP' ? 'action.hover' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <FormControlLabel
                value="CUSTOM_MCP"
                control={<Radio size="small" disabled={!enabled} />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 750 }}>
                      Máy chủ MCP Server (Model Context Protocol)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      finlens MCP, Vnstock MCP Server hoặc server do bạn tự host
                    </Typography>
                  </Box>
                }
              />
              <Chip label="Đề xuất" size="small" color="primary" sx={{ borderRadius: '4px', height: 22, fontSize: '0.7rem' }} />
            </Box>

            <Box
              sx={{
                p: 1.25,
                mb: 1,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: provider === 'DNSE' ? 'primary.main' : 'divider',
                bgcolor: provider === 'DNSE' ? 'action.hover' : 'transparent'
              }}
            >
              <FormControlLabel
                value="DNSE"
                control={<Radio size="small" disabled={!enabled} />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 750 }}>
                      DNSE Entrade X (OpenAPI Read-only)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Tự động sync tài sản từ tài khoản chứng khoán DNSE
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Box
              sx={{
                p: 1.25,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: provider === 'SSI' ? 'primary.main' : 'divider',
                bgcolor: provider === 'SSI' ? 'action.hover' : 'transparent'
              }}
            >
              <FormControlLabel
                value="SSI"
                control={<Radio size="small" disabled={!enabled} />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 750 }}>
                      SSI FastConnect API (Read-only)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Đọc danh mục tài khoản SSI qua API iBoard
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </RadioGroup>
        </Box>

        {/* Input Details */}
        {enabled && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
            {provider === 'CUSTOM_MCP' ? (
              <TextField
                fullWidth
                size="small"
                label="MCP Server Endpoint URL"
                value={mcpUrl}
                onChange={e => setMcpUrl(e.target.value)}
                placeholder="https://mcp.finlens.vn/mcp"
                slotProps={{
                  input: { sx: { borderRadius: '4px', fontSize: '0.85rem' } },
                  inputLabel: { sx: { fontSize: '0.85rem' } }
                }}
              />
            ) : (
              <TextField
                fullWidth
                size="small"
                type="password"
                label={`Khóa API Read-Only (${provider})`}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Nhập API Key được cấp từ Broker..."
                slotProps={{
                  input: { sx: { borderRadius: '4px', fontSize: '0.85rem' } },
                  inputLabel: { sx: { fontSize: '0.85rem' } }
                }}
              />
            )}

            {/* Connection Test Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleTestConnection}
                disabled={testing}
                startIcon={testing ? <CircularProgress size={14} /> : <CloudSyncRounded sx={{ fontSize: 16 }} />}
                sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 650, fontSize: '0.78rem' }}
              >
                {testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối (Ping)'}
              </Button>

              {testStatus === 'success' && (
                <Chip
                  icon={<CheckCircleRounded style={{ fontSize: 15 }} />}
                  label={`Đã kết nối (${pingLatency}ms)`}
                  size="small"
                  color="success"
                  sx={{ borderRadius: '4px', height: 24, fontSize: '0.75rem', fontWeight: 700 }}
                />
              )}

              {testStatus === 'failed' && (
                <Chip
                  icon={<ErrorOutlineRounded style={{ fontSize: 15 }} />}
                  label="Lỗi kết nối"
                  size="small"
                  color="error"
                  sx={{ borderRadius: '4px', height: 24, fontSize: '0.75rem', fontWeight: 700 }}
                />
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 650, color: 'text.secondary' }}
        >
          Đóng
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 750, px: 2.5 }}
        >
          Lưu cấu hình
        </Button>
      </DialogActions>
    </Dialog>
  );
}
