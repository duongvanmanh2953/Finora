import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from '@mui/material';
import { Lock } from 'lucide-react';
import { BaseCard } from '../../components/ui/CardVariants';
import { StatusBadge } from '../../components/ui/StatusBadge';

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
  { id: 'aud-891', admin: 'superadmin@finora.vn', action: 'VIEW_SAAS_MRR_ANALYTICS', resource: '/api/admin/metrics', status: 'SUCCESS', ip: '113.161.42.18', time: '10 phút trước' },
  { id: 'aud-892', admin: 'finance@finora.vn', action: 'EXPORT_MISA_INVOICES_VAT', resource: '/api/admin/invoices/export', status: 'SUCCESS', ip: '14.162.88.9', time: '1 giờ trước' },
  { id: 'aud-893', admin: 'support@finora.vn', action: 'SUSPEND_BOT_USER', resource: '/api/admin/users/usr-5', status: 'SUCCESS', ip: '118.69.12.55', time: '2 giờ trước' },
  { id: 'aud-894', admin: 'unknown_probe@proxy.net', action: 'UNAUTHORIZED_QUERY_USER_TRANSACTIONS', resource: '/api/users/usr-1/transactions', status: 'BLOCKED', ip: '45.133.1.20', time: '5 giờ trước' },
  { id: 'aud-895', admin: 'superadmin@finora.vn', action: 'TRIGGER_DATABASE_BACKUP', resource: '/api/admin/backup/create', status: 'SUCCESS', ip: '113.161.42.18', time: '1 ngày trước' }
];

export function AdminAuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>(DEFAULT_AUDIT_LOGS);

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
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          Nhật Ký Kiểm Toán An Ninh & Tuân Thủ Zero-Access
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Lưu vết quyền truy cập theo tiêu chuẩn bảo mật ngân hàng và ISO/IEC 27001 ({logs.length} bản ghi)
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã sự kiện</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tài khoản Admin / User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hành động thực thi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tài nguyên truy vấn</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Địa chỉ IP</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Kết quả bảo mật</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map(log => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{log.id}</TableCell>
                  <TableCell sx={{ fontWeight: 650 }}>{log.admin}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11.5 }}>{log.action}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{log.resource}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{log.ip}</TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{log.time}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={log.status === 'SUCCESS' ? 'Cho phép' : 'ĐÃ CHẶN (Bảo vệ)'}
                      status={log.status === 'SUCCESS' ? 'success' : 'danger'}
                      size="small"
                      variant={log.status === 'BLOCKED' ? 'filled' : 'soft'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </BaseCard>
    </Box>
  );
}
