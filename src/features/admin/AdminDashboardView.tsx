import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert
} from '@mui/material';
import {
  DollarSign,
  TrendingUp,
  Users,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sliders,
  Sparkles,
  Eye
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { MetricCard, BaseCard } from '../../components/ui/CardVariants';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FinoraButton } from '../../components/ui/FinoraButton';
import { money } from '../../lib/finance';
import { GOLD_COLOR_TOKENS } from '../../lib/subscription';

const REVENUE_TIMELINE = [
  { month: 'T05', mrr: 12500000, users: 180 },
  { month: 'T06', mrr: 18200000, users: 290 },
  { month: 'T07', mrr: 24500000, users: 420 },
  { month: 'T08', mrr: 38900000, users: 650 },
  { month: 'T09', mrr: 56200000, users: 940 },
  { month: 'T10', mrr: 78500000, users: 1280 },
  { month: 'T11', mrr: 104200000, users: 1650 }
];

export function AdminDashboardView() {
  const navigate = useNavigate();
  const [timelinePeriod, setTimelinePeriod] = useState<'6m' | '1y'>('6m');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Zero-Access Privacy Guarantee Banner */}
      <Alert
        severity="info"
        icon={<ShieldCheck size={20} />}
        sx={{
          borderRadius: '6px',
          bgcolor: 'rgba(2, 132, 199, 0.08)',
          borderColor: 'rgba(2, 132, 199, 0.3)',
          color: 'text.primary',
          border: '1px solid'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Kiến trúc Zero-Access Privacy được kích hoạt
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 12.5, mt: 0.25 }}>
          Admin Console chỉ quản lý siêu dữ liệu thuê bao SaaS, doanh thu nền tảng và sức khỏe máy chủ. Quyền truy cập vào dữ liệu tài chính cá nhân (số dư, giao dịch, tài sản cá nhân) của khách hàng được mã hóa một chiều và <strong>tuyệt đối bị chặn</strong> tại tầng phân quyền.
        </Typography>
      </Alert>

      {/* Quick Navigation Action Hub */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'action.hover',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'background.paper', transform: 'translateY(-1px)' }
          }}
          onClick={() => navigate('/admin/reports')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '6px', bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284C7' }}>
              <Eye size={20} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Biểu Đồ & Lượt Người Dùng
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                74.620 pageviews · 1.250 DAU
              </Typography>
            </Box>
          </Box>
          <ArrowRight size={16} color="#64748B" />
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'action.hover',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: GOLD_COLOR_TOKENS.goldMetallic, bgcolor: 'background.paper', transform: 'translateY(-1px)' }
          }}
          onClick={() => navigate('/admin/subscriptions')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '6px', bgcolor: 'rgba(197, 160, 89, 0.15)', color: GOLD_COLOR_TOKENS.goldMetallic }}>
              <Sliders size={20} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Sửa Gói Giá & Tích Phân Quyền
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Ma trận 11 dịch vụ theo gói giá
              </Typography>
            </Box>
          </Box>
          <ArrowRight size={16} color="#64748B" />
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'action.hover',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: '#10B981', bgcolor: 'background.paper', transform: 'translateY(-1px)' }
          }}
          onClick={() => navigate('/admin/finance')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '6px', bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <Sparkles size={20} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Khuyến Nghị AI & Chi Phí Thông Minh
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Margin 99.3% · Tiết kiệm token
              </Typography>
            </Box>
          </Box>
          <ArrowRight size={16} color="#64748B" />
        </Paper>
      </Box>

      {/* 1. Executive SaaS KPI Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5
        }}
      >
        <MetricCard
          title="MRR (Doanh thu hàng tháng)"
          value="104.200.000 ₫"
          trend={32.8}
          trendPeriod="so với tháng trước"
          icon={<DollarSign size={18} />}
          module="income"
          statusLabel="Tăng trưởng cao"
          status="success"
        />

        <MetricCard
          title="ARR (Quy mô năm hóa)"
          value="1.250.400.000 ₫"
          trend={45.2}
          trendPeriod="chỉ tiêu năm đạt 83%"
          icon={<TrendingUp size={18} />}
          module="investments"
          statusLabel="Vượt kỳ vọng"
          status="success"
        />

        <MetricCard
          title="Tổng Người Dùng SaaS"
          value="1.650 người"
          trend={28.5}
          trendPeriod="485 đang dùng thử VIP Gold"
          icon={<Users size={18} />}
          module="accounts"
          statusLabel="Active 94%"
          status="info"
        />

        <MetricCard
          title="Tỷ lệ Churn Rate (Rời bỏ)"
          value="1.4%"
          trend={-0.6}
          trendPeriod="tiêu chuẩn ngành < 3%"
          icon={<Activity size={18} />}
          module="savings"
          statusLabel="Cực kỳ an toàn"
          status="success"
        />
      </Box>

      {/* 2. Revenue Chart & Conversion Bento */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.8fr 1fr' }, gap: 2.5 }}>
        {/* Revenue Growth Chart */}
        <BaseCard>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Xu hướng Tăng trưởng MRR & Lũy Kế Người Dùng
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Dữ liệu đối soát tự động từ cổng thanh toán VietQR / payOS
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <FinoraButton
                size="small"
                variant={timelinePeriod === '6m' ? 'primary' : 'neutral'}
                onClick={() => setTimelinePeriod('6m')}
              >
                6 Tháng
              </FinoraButton>
              <FinoraButton
                size="small"
                variant={timelinePeriod === '1y' ? 'primary' : 'neutral'}
                onClick={() => setTimelinePeriod('1y')}
              >
                12 Tháng
              </FinoraButton>
            </Box>
          </Box>

          <Box sx={{ width: '100%', height: 260, minHeight: 260, minWidth: 0, overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_TIMELINE} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminMrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="var(--text-secondary)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `${(val / 1000000).toFixed(0)}Tr`}
                  width={45}
                />
                <RechartsTooltip
                  formatter={(val: any) => [money(Number(val)), 'MRR']}
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '4px',
                    fontSize: 12,
                    fontWeight: 700
                  }}
                />
                <Area type="monotone" dataKey="mrr" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#adminMrrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </BaseCard>

        {/* Subscription Plan Mix */}
        <BaseCard>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Cơ Cấu Thuê Bao & Phân Tầng
            </Typography>
            <FinoraButton size="small" variant="neutral" onClick={() => navigate('/admin/subscriptions')}>
              Quản lý
            </FinoraButton>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Tỷ lệ chuyển đổi từ Dùng thử sang Gold VIP & Pro
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { plan: 'Finora Gold VIP (Năm)', users: 142, mrr: '77.870.000 ₫', pct: 54, color: GOLD_COLOR_TOKENS.goldMetallic },
              { plan: 'Finora Pro (Năm)', users: 260, mrr: '26.330.000 ₫', pct: 28, color: '#0284C7' },
              { plan: 'Dùng Thử VIP Gold 30D', users: 485, mrr: '0 ₫ (Trial)', pct: 12, color: '#F59E0B' },
              { plan: 'Bản Miễn Phí (Starter Free)', users: 763, mrr: '0 ₫', pct: 6, color: '#64748B' }
            ].map(p => (
              <Box key={p.plan}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                    {p.plan}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: p.color }}>
                    {p.mrr} ({p.pct}%)
                  </Typography>
                </Box>
                <Box sx={{ height: 6, borderRadius: '4px', bgcolor: 'action.hover', overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', width: `${p.pct}%`, bgcolor: p.color, borderRadius: '4px' }} />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, mt: 0.25, display: 'block' }}>
                  {p.users} tài khoản
                </Typography>
              </Box>
            ))}
          </Box>
        </BaseCard>
      </Box>

      {/* 3. Recent Real-time Platform Operations */}
      <BaseCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Giao Dịch Thanh Toán Doanh Nghiệp Gần Đây (payOS / VietQR)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Xác thực tức thời qua Webhook có chữ ký mật mã HMAC-SHA256
            </Typography>
          </Box>

          <StatusBadge label="Cổng VietQR Live" status="success" variant="soft" />
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 800 }}>Mã đơn</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Số tiền</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Cổng thanh toán</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Chữ ký số (HMAC)</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { code: 'ORD-98214', email: 'minhanh@finora.vn', amount: 999000, gateway: 'payOS', status: 'completed' },
                { code: 'ORD-98215', email: 'tuan.nguyen@tech.io', amount: 499000, gateway: 'VietQR', status: 'completed' },
                { code: 'ORD-98216', email: 'dang.khoa@gold.vn', amount: 999000, gateway: 'payOS', status: 'completed' },
                { code: 'ORD-98217', email: 'hoanglong.tran@gmail.com', amount: 499000, gateway: 'payOS', status: 'pending' }
              ].map(tx => (
                <TableRow key={tx.code} hover>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{tx.code}</TableCell>
                  <TableCell>{tx.email}</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>{money(tx.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge label={tx.gateway} status="info" size="small" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge label="Verified" status="success" size="small" variant="dot" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge label={tx.status === 'completed' ? 'Thành công' : 'Chờ quét QR'} status={tx.status} size="small" />
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
