import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Paper,
  Tab,
  Tabs,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  CreditCard,
  Receipt,
  FileText,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Server
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { money } from '../../lib/finance';
import { PageHead } from '../../components/ui';
import { useFinance } from '../../store';

// Mock SaaS Admin Data
interface SaasUser {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  createdAt: string;
  lastActive: string;
  isSuspended: boolean;
}

interface SaasPayment {
  id: string;
  orderCode: string;
  customerEmail: string;
  amount: number;
  gateway: 'payOS' | 'MoMo' | 'VietQR';
  status: 'PAID' | 'PENDING' | 'EXPIRED';
  createdAt: string;
  hmacVerified: boolean;
}

interface SaasInvoice {
  id: string;
  invoiceNo: string;
  templateCode: string;
  customerName: string;
  taxCode?: string;
  amount: number;
  vatAmount: number;
  status: 'ISSUED' | 'DRAFT';
  issueDate: string;
}

interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'BLOCKED';
  timestamp: string;
  ip: string;
}

const INITIAL_USERS: SaasUser[] = [
  { id: 'usr-1', email: 'minhanh@finora.vn', name: 'Minh Anh', plan: 'pro', createdAt: '2026-06-15', lastActive: '2026-11-03', isSuspended: false },
  { id: 'usr-2', email: 'tuan.nguyen@tech.io', name: 'Tuấn Nguyễn', plan: 'pro', createdAt: '2026-08-20', lastActive: '2026-11-02', isSuspended: false },
  { id: 'usr-3', email: 'thutrang.le@sales.vn', name: 'Lê Thu Trang', plan: 'pro', createdAt: '2026-09-01', lastActive: '2026-11-01', isSuspended: false },
  { id: 'usr-4', email: 'hoanglong.tran@gmail.com', name: 'Trần Hoàng Long', plan: 'free', createdAt: '2026-10-10', lastActive: '2026-11-03', isSuspended: false },
  { id: 'usr-5', email: 'spammer_bot99@temp.mail', name: 'Test User 99', plan: 'free', createdAt: '2026-11-01', lastActive: '2026-11-01', isSuspended: true }
];

const INITIAL_PAYMENTS: SaasPayment[] = [
  { id: 'pay-1', orderCode: 'ORD-98214', customerEmail: 'minhanh@finora.vn', amount: 599000, gateway: 'payOS', status: 'PAID', createdAt: '2026-10-15 14:22', hmacVerified: true },
  { id: 'pay-2', orderCode: 'ORD-98215', customerEmail: 'tuan.nguyen@tech.io', amount: 599000, gateway: 'VietQR', status: 'PAID', createdAt: '2026-10-22 09:15', hmacVerified: true },
  { id: 'pay-3', orderCode: 'ORD-98216', customerEmail: 'thutrang.le@sales.vn', amount: 599000, gateway: 'payOS', status: 'PAID', createdAt: '2026-11-01 19:40', hmacVerified: true },
  { id: 'pay-4', orderCode: 'ORD-98217', customerEmail: 'hoanglong.tran@gmail.com', amount: 599000, gateway: 'payOS', status: 'PENDING', createdAt: '2026-11-03 08:30', hmacVerified: false }
];

const INITIAL_INVOICES: SaasInvoice[] = [
  { id: 'inv-101', invoiceNo: 'HD26E00001', templateCode: '1/001', customerName: 'Minh Anh', taxCode: '0109988221', amount: 544545, vatAmount: 54455, status: 'ISSUED', issueDate: '2026-10-15' },
  { id: 'inv-102', invoiceNo: 'HD26E00002', templateCode: '1/001', customerName: 'Tuấn Nguyễn', taxCode: '0315892110', amount: 544545, vatAmount: 54455, status: 'ISSUED', issueDate: '2026-10-22' },
  { id: 'inv-103', invoiceNo: 'HD26E00003', templateCode: '1/001', customerName: 'Lê Thu Trang', taxCode: '0318991204', amount: 544545, vatAmount: 54455, status: 'ISSUED', issueDate: '2026-11-01' }
];

const INITIAL_LOGS: AuditLogEntry[] = [
  { id: 'log-1', adminEmail: 'admin@finora.vn', action: 'USER_SUSPEND', resource: 'spammer_bot99@temp.mail', status: 'SUCCESS', timestamp: '2026-11-02 10:14', ip: '118.69.182.4' },
  { id: 'log-2', adminEmail: 'admin@finora.vn', action: 'INVOICE_ISSUE', resource: 'HD26E00003', status: 'SUCCESS', timestamp: '2026-11-01 19:45', ip: '118.69.182.4' },
  { id: 'log-3', adminEmail: 'admin@finora.vn', action: 'VIEW_USER_TRANSACTION', resource: 'usr-1', status: 'BLOCKED', timestamp: '2026-10-28 16:20', ip: '118.69.182.4' },
  { id: 'log-4', adminEmail: 'admin@finora.vn', action: 'PRICE_PLAN_UPDATE', resource: 'Plan:Pro (599.000₫)', status: 'SUCCESS', timestamp: '2026-10-01 08:00', ip: '118.69.182.4' }
];

const REVENUE_DATA = [
  { month: 'T06', mrr: 12000000, payingUsers: 20 },
  { month: 'T07', mrr: 21000000, payingUsers: 35 },
  { month: 'T08', mrr: 35000000, payingUsers: 58 },
  { month: 'T09', mrr: 52000000, payingUsers: 86 },
  { month: 'T10', mrr: 74000000, payingUsers: 123 },
  { month: 'T11', mrr: 92000000, payingUsers: 154 }
];

export default function Admin() {
  const { notify } = useFinance();
  const [tab, setTab] = useState<'dashboard' | 'users' | 'payments' | 'invoices' | 'system' | 'logs'>('dashboard');
  const [users, setUsers] = useState<SaasUser[]>(INITIAL_USERS);
  const [payments, setPayments] = useState<SaasPayment[]>(INITIAL_PAYMENTS);
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_LOGS);

  // Toggle user suspension
  const handleToggleSuspend = (user: SaasUser) => {
    const updated = users.map(u => (u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u));
    setUsers(updated);
    const action = !user.isSuspended ? 'USER_SUSPEND' : 'USER_UNSUSPEND';
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      adminEmail: 'admin@finora.vn',
      action,
      resource: user.email,
      status: 'SUCCESS',
      timestamp: 'Vừa xong',
      ip: '118.69.182.4'
    };
    setLogs([newLog, ...logs]);
    notify(`Đã ${!user.isSuspended ? 'khóa' : 'mở khóa'} tài khoản ${user.email}`);
  };

  // Simulate payment verification
  const handleVerifyPayment = (payment: SaasPayment) => {
    const updated = payments.map(p =>
      p.id === payment.id ? { ...p, status: 'PAID' as const, hmacVerified: true } : p
    );
    setPayments(updated);
    notify(`Đã xác thực chữ ký HMAC SHA-256 và kích hoạt gói cho ${payment.customerEmail}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHead
        title="Finora SaaS Administration Console"
        subtitle="Nền tảng Quản trị Doanh nghiệp Finora SaaS: Doanh thu MRR/ARR, Thuê bao Pro, Thanh toán payOS, Hóa đơn điện tử MISA & Giám sát Hệ thống"
      />

      {/* Zero-Access Privacy Guarantee Banner */}
      <Alert
        severity="info"
        icon={<ShieldCheck size={24} />}
        sx={{
          bgcolor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          borderWidth: 1,
          borderStyle: 'solid',
          color: 'text.primary',
          '& .MuiAlert-icon': { color: '#10b981' }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Ranh giới Bảo mật & Quyền Riêng tư Tuyệt đối (Zero-Access Privacy Guarantee)
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Admin quản lý người dùng với tư cách <strong>khách hàng dịch vụ SaaS</strong>, tuyệt đối <strong>KHÔNG CÓ QUYỀN</strong> xem số dư tài khoản ngân hàng, giao dịch chi tiêu riêng tư, danh mục đầu tư hay phiếu lương của người dùng. Hệ thống được bảo vệ ở tầng Row-Level Security & API Authorization.
        </Typography>
      </Alert>

      {/* Admin Navigation Tabs */}
      <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab value="dashboard" icon={<TrendingUp size={16} />} iconPosition="start" label="Chỉ số SaaS (MRR/ARR)" />
          <Tab value="users" icon={<Users size={16} />} iconPosition="start" label={`Người dùng (${users.length})`} />
          <Tab value="payments" icon={<CreditCard size={16} />} iconPosition="start" label={`Thanh toán payOS (${payments.length})`} />
          <Tab value="invoices" icon={<Receipt size={16} />} iconPosition="start" label="Hóa đơn MISA" />
          <Tab value="system" icon={<Server size={16} />} iconPosition="start" label="Hạ tầng & Đối tác" />
          <Tab value="logs" icon={<FileText size={16} />} iconPosition="start" label="Nhật ký Audit Logs" />
        </Tabs>
      </Paper>

      {/* TAB 1: EXECUTIVE SAAS DASHBOARD */}
      {tab === 'dashboard' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                MRR (Doanh thu Tháng)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
                92.000.000 ₫
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                +24.3% so với tháng trước
              </Typography>
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                ARR (Doanh thu Năm)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                1.104.000.000 ₫
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Quy đổi từ 154 thuê bao Pro
              </Typography>
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                ARPU (Doanh thu / User)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                599.000 ₫
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Gói năm phổ biến nhất
              </Typography>
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Tỷ lệ Rời Bỏ (Churn Rate)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#10b981' }}>
                1.2%
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                Thấp hơn tiêu chuẩn ngành (3.5%)
              </Typography>
            </Paper>
          </Box>

          {/* Revenue Chart */}
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Xu hướng Tăng trưởng MRR & Khách hàng Trả phí (6 Tháng gần nhất)
            </Typography>
            <Box sx={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={v => `${v / 1000000}M`} />
                  <RechartsTooltip formatter={(val: any) => [money(Number(val)), 'MRR']} />
                  <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMrr)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>
      )}

      {/* TAB 2: SAAS USERS MANAGEMENT */}
      {tab === 'users' && (
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Khách hàng (SaaS Metadata)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Gói dịch vụ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ngày tham gia</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hoạt động gần nhất</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trạng thái tài khoản</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{u.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{u.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={u.plan.toUpperCase()}
                        color={u.plan === 'pro' ? 'primary' : 'default'}
                        variant={u.plan === 'pro' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{u.createdAt}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{u.lastActive}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={u.isSuspended ? 'Bị khóa' : 'Hoạt động'}
                        color={u.isSuspended ? 'error' : 'success'}
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        color={u.isSuspended ? 'success' : 'error'}
                        startIcon={u.isSuspended ? <Unlock size={14} /> : <Lock size={14} />}
                        onClick={() => handleToggleSuspend(u)}
                        sx={{ fontSize: '0.75rem', py: 0.4 }}
                      >
                        {u.isSuspended ? 'Mở khóa' : 'Khóa tài khoản'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 3: PAYMENTS & PAYOS GATEWAY */}
      {tab === 'payments' && (
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Lịch sử Giao dịch Cổng thanh toán (payOS VietQR & MoMo)
            </Typography>
            <Chip size="small" label="Idempotency Protection Active" color="success" variant="outlined" />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Mã đơn hàng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Khách hàng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cổng thanh toán</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Số tiền</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Chữ ký HMAC SHA-256</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Xử lý</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{p.orderCode}</TableCell>
                    <TableCell>{p.customerEmail}</TableCell>
                    <TableCell>
                      <Chip size="small" label={p.gateway} variant="outlined" />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{money(p.amount)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{p.createdAt}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={p.hmacVerified ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                        label={p.hmacVerified ? 'Verified Valid' : 'Unverified'}
                        color={p.hmacVerified ? 'success' : 'warning'}
                        sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {p.status === 'PAID' ? (
                        <Chip size="small" label="ĐÃ HOÀN TẤT" color="success" variant="outlined" />
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleVerifyPayment(p)}
                          sx={{ fontSize: '0.75rem', py: 0.4 }}
                        >
                          Xác thực Webhook
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 4: MISA MEINVOICE */}
      {tab === 'invoices' && (
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Quản lý Hóa đơn Điện tử GTGT (Kết nối MISA meInvoice)
            </Typography>
            <Button size="small" variant="outlined" startIcon={<Receipt size={14} />}>
              Đồng bộ dữ liệu MISA
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Số hóa đơn</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mẫu số / Ký hiệu</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Người mua</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mã số thuế</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Tiền trước thuế</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>VAT (10%)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ngày phát hành</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {INITIAL_INVOICES.map(inv => (
                  <TableRow key={inv.id} hover>
                    <TableCell sx={{ fontWeight: 800 }}>{inv.invoiceNo}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{inv.templateCode}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{inv.customerName}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{inv.taxCode || 'Cá nhân'}</TableCell>
                    <TableCell align="right">{money(inv.amount)}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>{money(inv.vatAmount)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{inv.issueDate}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label="ĐÃ KÝ SỐ ĐIỆN TỬ" color="success" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 5: SYSTEM HEALTH & PARTNERS */}
      {tab === 'system' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Server size={18} color="#10b981" /> Trạng thái Hạ tầng Máy chủ
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>API Uptime (30 ngày):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981' }}>99.98%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Độ trễ trung bình (p95):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>86 ms</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Cache Hit Rate (Market Data):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981' }}>94.2%</Typography>
              </Box>
            </Box>
          </Card>

          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Trạng thái Kết nối Nhà Cung Cấp Dữ Liệu Đối Tác
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Nhà cung cấp</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Loại kết nối</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Độ trễ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { name: 'DNSE OpenAPI', type: 'WebSocket / REST', latency: '42ms', status: 'ONLINE' },
                    { name: 'SSI FastConnect', type: 'SignalR Streaming', latency: '38ms', status: 'ONLINE' },
                    { name: 'Fmarket NAV Service', type: 'Daily NAV EOD', latency: '120ms', status: 'ONLINE' },
                    { name: 'payOS VietQR Gateway', type: 'Webhook HMAC SHA-256', latency: '110ms', status: 'ONLINE' },
                    { name: 'MISA meInvoice API', type: 'RESTful OAuth2', latency: '185ms', status: 'ONLINE' }
                  ].map((row, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{row.type}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.latency}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.status} color="success" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* TAB 6: IMMUTABLE AUDIT LOGS */}
      {tab === 'logs' && (
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Nhật ký Kiểm toán Bất biến (Immutable Audit Logs)
            </Typography>
            <Chip size="small" label="Chỉ ghi (Append-Only) · OWASP Compliance" color="info" variant="outlined" />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Quản trị viên</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hành vi (Action)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tài nguyên tác động</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Địa chỉ IP</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Kết quả</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{log.timestamp}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{log.adminEmail}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{log.action}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{log.resource}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{log.ip}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={log.status}
                        color={log.status === 'SUCCESS' ? 'success' : 'error'}
                        variant={log.status === 'SUCCESS' ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
