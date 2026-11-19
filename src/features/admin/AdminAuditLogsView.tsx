import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Lock,
  Search,
  MoreVertical,
  Copy,
  Terminal,
  RotateCcw
} from 'lucide-react';
import { BaseCard } from '../../components/ui/CardVariants';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatVnDateTime } from '../../lib/dateUtils';

interface AuditLog {
  id: string;
  admin: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'BLOCKED';
  ip: string;
  time: string;
}

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud-891', admin: 'superadmin@finora.vn', action: 'VIEW_SAAS_MRR_ANALYTICS', resource: '/api/admin/metrics', status: 'SUCCESS', ip: '113.161.42.18', time: '2026-11-13T10:00:00.000Z' },
  { id: 'aud-892', admin: 'finance@finora.vn', action: 'EXPORT_MISA_INVOICES_VAT', resource: '/api/admin/invoices/export', status: 'SUCCESS', ip: '14.162.88.9', time: '2026-11-13T09:15:00.000Z' },
  { id: 'aud-893', admin: 'support@finora.vn', action: 'SUSPEND_BOT_USER', resource: '/api/admin/users/usr-5', status: 'SUCCESS', ip: '118.69.12.55', time: '2026-11-13T08:30:00.000Z' },
  { id: 'aud-894', admin: 'unknown_probe@proxy.net', action: 'UNAUTHORIZED_QUERY_USER_TRANSACTIONS', resource: '/api/users/usr-1/transactions', status: 'BLOCKED', ip: '45.133.1.20', time: '2026-11-13T05:00:00.000Z' },
  { id: 'aud-895', admin: 'superadmin@finora.vn', action: 'TRIGGER_DATABASE_BACKUP', resource: '/api/admin/backup/create', status: 'SUCCESS', ip: '113.161.42.18', time: '2026-11-12T14:00:00.000Z' }
];

export function AdminAuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>(DEFAULT_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SUCCESS' | 'BLOCKED'>('all');

  // Phân trang
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Menu action
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeLog, setActiveLog] = useState<AuditLog | null>(null);

  // Toast
  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/audit-logs')
      .then(res => res.json())
      .then(json => {
        if (active && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setLogs(json.data);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        l.admin?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.resource?.toLowerCase().includes(q) ||
        l.ip?.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || l.status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);

  const handleCopyLogDetail = (log: AuditLog) => {
    setMenuAnchorEl(null);
    try {
      navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      setSnackMessage('Đã sao chép chi tiết log vào clipboard');
    } catch {}
  };

  const handleCopyIp = (log: AuditLog) => {
    setMenuAnchorEl(null);
    try {
      navigator.clipboard.writeText(log.ip);
      setSnackMessage(`Đã sao chép IP: ${log.ip}`);
    } catch {}
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Alert
        severity="info"
        icon={<Lock size={18} />}
        sx={{ borderRadius: '6px' }}
      >
        <strong>Nhật ký Bất biến (Tamper-Proof Audit Trail):</strong> Mọi thao tác của quản trị viên và các nỗ lực truy cập API đều được ghi nhận vĩnh viễn kèm hàm băm SHA-256. Bất kỳ yêu cầu nào cố gắng đọc dữ liệu tài chính riêng tư của khách hàng đều bị chặn ngay tại lớp Gateway (`BLOCKED`).
      </Alert>

      <BaseCard>
        {/* Header Toolbar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Nhật Ký Kiểm Toán An Ninh & Tuân Thủ Zero-Access ({filteredLogs.length}/{logs.length})
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Lưu vết quyền truy cập theo tiêu chuẩn bảo mật ngân hàng và ISO/IEC 27001
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Tìm theo user, action, IP..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ minWidth: 220 }}
            />

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="audit-status-label">Kết quả</InputLabel>
              <Select
                labelId="audit-status-label"
                label="Kết quả"
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value as any);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Tất cả kết quả</MenuItem>
                <MenuItem value="SUCCESS">Cho phép (SUCCESS)</MenuItem>
                <MenuItem value="BLOCKED">Đã chặn (BLOCKED)</MenuItem>
              </Select>
            </FormControl>

            {(searchQuery || statusFilter !== 'all') && (
              <Tooltip title="Đặt lại bộ lọc">
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPage(0);
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  <RotateCcw size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Audit Log Table with Virtual Scroll Container */}
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: '6px', maxHeight: 560, overflowY: 'auto' }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Mã sự kiện</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Tài khoản Admin / User</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Hành động thực thi</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Tài nguyên truy vấn</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Địa chỉ IP</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Thời gian</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Kết quả bảo mật</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Không có nhật ký kiểm toán phù hợp với bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map(log => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 11.5 }}>{log.id}</TableCell>
                    <TableCell sx={{ fontWeight: 650 }}>{log.admin}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11.5 }}>{log.action}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{log.resource}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{log.ip}</TableCell>
                    {/* Hiển thị ngày giờ chuẩn dd-mm-yyyy */}
                    <TableCell sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {log.time.includes('T') ? formatVnDateTime(log.time) : log.time}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={log.status === 'SUCCESS' ? 'Cho phép' : 'ĐÃ CHẶN (Bảo vệ)'}
                        status={log.status === 'SUCCESS' ? 'success' : 'danger'}
                        size="small"
                        variant={log.status === 'BLOCKED' ? 'filled' : 'soft'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Thao tác">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMenuAnchorEl(e.currentTarget);
                            setActiveLog(log);
                          }}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                        >
                          <MoreVertical size={16} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Phân trang */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số bản ghi mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} trên tổng số ${count}`}
          sx={{ borderTop: '1px solid var(--border-subtle)', mt: 1 }}
        />

        {/* Action Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={() => {
            setMenuAnchorEl(null);
            setActiveLog(null);
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {activeLog && (
            <MenuItem onClick={() => handleCopyLogDetail(activeLog)}>
              <ListItemIcon sx={{ minWidth: 28 }}><Copy size={15} /></ListItemIcon>
              <ListItemText primary="Sao chép chi tiết sự kiện (JSON)" />
            </MenuItem>
          )}
          {activeLog && (
            <MenuItem onClick={() => handleCopyIp(activeLog)}>
              <ListItemIcon sx={{ minWidth: 28 }}><Terminal size={15} /></ListItemIcon>
              <ListItemText primary={`Sao chép địa chỉ IP (${activeLog.ip})`} />
            </MenuItem>
          )}
        </Menu>

        {/* Toast thông báo */}
        <Snackbar
          open={Boolean(snackMessage)}
          autoHideDuration={2500}
          onClose={() => setSnackMessage(null)}
          message={snackMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </BaseCard>
    </Box>
  );
}
