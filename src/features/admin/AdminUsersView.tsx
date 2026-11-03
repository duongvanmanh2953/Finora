import { useState } from 'react';
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
  TextField,
  InputAdornment,
  Alert
} from '@mui/material';
import {
  Search,
  Lock,
  Unlock,
  KeyRound,
  EyeOff
} from 'lucide-react';
import { BaseCard } from '../../components/ui/CardVariants';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FinoraButton } from '../../components/ui/FinoraButton';

interface SaasUser {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  createdAt: string;
  lastActive: string;
  isSuspended: boolean;
}

const INITIAL_USERS: SaasUser[] = [
  { id: 'usr-1', email: 'minhanh@finora.vn', name: 'Minh Anh', plan: 'pro', createdAt: '2026-06-15', lastActive: '2026-11-03', isSuspended: false },
  { id: 'usr-2', email: 'tuan.nguyen@tech.io', name: 'Tuấn Nguyễn', plan: 'pro', createdAt: '2026-08-20', lastActive: '2026-11-02', isSuspended: false },
  { id: 'usr-3', email: 'thutrang.le@sales.vn', name: 'Lê Thu Trang', plan: 'pro', createdAt: '2026-09-01', lastActive: '2026-11-01', isSuspended: false },
  { id: 'usr-4', email: 'hoanglong.tran@gmail.com', name: 'Trần Hoàng Long', plan: 'free', createdAt: '2026-10-10', lastActive: '2026-11-03', isSuspended: false },
  { id: 'usr-5', email: 'spammer_bot99@temp.mail', name: 'Test User 99', plan: 'free', createdAt: '2026-11-01', lastActive: '2026-11-01', isSuspended: true }
];

export function AdminUsersView() {
  const [users, setUsers] = useState<SaasUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleSuspend = (id: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, isSuspended: !u.isSuspended } : u))
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Zero-Access Guarantee Note */}
      <Alert
        severity="success"
        icon={<EyeOff size={18} />}
        sx={{ borderRadius: '6px' }}
      >
        <strong>Cam kết Quyền riêng tư Bất khả xâm phạm:</strong> Quản trị viên chỉ có thể xem siêu dữ liệu tài khoản (Email, Gói cước, Ngày tạo) và khóa/mở quyền đăng nhập. Toàn bộ sổ thu chi, số dư ngân hàng và vị thế cổ phiếu của người dùng được mã hóa đầu cuối và không hiển thị tại đây.
      </Alert>

      <BaseCard>
        {/* Toolbar Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Quản lý Tài khoản & Phân quyền Người dùng ({users.length})
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Kiểm soát trạng thái hoạt động, hỗ trợ kích hoạt thuê bao và kiểm toán bảo mật
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ minWidth: 260 }}
          />
        </Box>

        {/* Users Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Họ và tên</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email đăng nhập</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Gói dịch vụ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ngày tham gia</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lần cuối online</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Thao tác bảo mật</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map(u => (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{u.id}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={u.plan === 'pro' ? 'Finora PRO' : 'Starter Free'}
                      status={u.plan === 'pro' ? 'success' : 'neutral'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{u.createdAt}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{u.lastActive}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={u.isSuspended ? 'Tạm khóa' : 'Hoạt động'}
                      status={u.isSuspended ? 'danger' : 'success'}
                      size="small"
                      variant="dot"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <FinoraButton
                        size="small"
                        variant={u.isSuspended ? 'success' : 'danger'}
                        startIcon={u.isSuspended ? <Unlock size={13} /> : <Lock size={13} />}
                        onClick={() => handleToggleSuspend(u.id)}
                      >
                        {u.isSuspended ? 'Kích hoạt lại' : 'Tạm khóa'}
                      </FinoraButton>
                      <FinoraButton
                        size="small"
                        variant="neutral"
                        startIcon={<KeyRound size={13} />}
                        onClick={() => alert(`Đã gửi email khôi phục mật khẩu bảo mật đến: ${u.email}`)}
                      >
                        Reset mật khẩu
                      </FinoraButton>
                    </Box>
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
