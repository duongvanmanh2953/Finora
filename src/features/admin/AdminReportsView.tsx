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
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Download,
  Users,
  Eye,
  Sparkles,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { BaseCard, MetricCard } from '../../components/ui/CardVariants';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FinoraButton } from '../../components/ui/FinoraButton';
import { GOLD_COLOR_TOKENS } from '../../lib/subscription';

// Data for Daily Traffic, Visits & Pageviews
const TRAFFIC_DAILY_DATA = [
  { date: '12/11', visits: 1820, pageviews: 6420, activeUsers: 480, aiQueries: 140 },
  { date: '13/11', visits: 2150, pageviews: 7890, activeUsers: 590, aiQueries: 210 },
  { date: '14/11', visits: 2480, pageviews: 8940, activeUsers: 680, aiQueries: 290 },
  { date: '15/11', visits: 2950, pageviews: 10420, activeUsers: 820, aiQueries: 380 },
  { date: '16/11', visits: 3420, pageviews: 12150, activeUsers: 940, aiQueries: 460 },
  { date: '17/11', visits: 3890, pageviews: 13800, activeUsers: 1080, aiQueries: 530 },
  { date: '18/11', visits: 4250, pageviews: 15400, activeUsers: 1250, aiQueries: 620 }
];

// Data for Cumulative Users & New Signups
const USER_GROWTH_DATA = [
  { period: 'T05', newUsers: 180, totalUsers: 180, trialGold: 90, paidPro: 30 },
  { period: 'T06', newUsers: 220, totalUsers: 400, trialGold: 190, paidPro: 85 },
  { period: 'T07', newUsers: 310, totalUsers: 710, trialGold: 310, paidPro: 170 },
  { period: 'T08', newUsers: 420, totalUsers: 1130, trialGold: 480, paidPro: 290 },
  { period: 'T09', newUsers: 530, totalUsers: 1660, trialGold: 690, paidPro: 450 },
  { period: 'T10', newUsers: 680, totalUsers: 2340, trialGold: 950, paidPro: 680 },
  { period: 'T11', newUsers: 850, totalUsers: 3190, trialGold: 1280, paidPro: 960 }
];

// Conversion Funnel Data
const FUNNEL_DATA = [
  { step: '1. Khách truy cập Landing Page', count: 28500, pct: 100, drop: '0%' },
  { step: '2. Đăng ký tài khoản (Sign-up)', count: 9650, pct: 33.9, drop: '-66.1%' },
  { step: '3. Kích hoạt Dùng Thử VIP Gold 30D', count: 7240, pct: 25.4, drop: '-25.0%' },
  { step: '4. Ghi chép >= 5 giao dịch (Active)', count: 4890, pct: 17.2, drop: '-32.5%' },
  { step: '5. Mua gói bản quyền Pro / Gold', count: 1650, pct: 5.8, drop: '-66.3%' }
];

// Cohort Retention Data
const RETENTION_COHORT = [
  { cohort: 'Tháng 08/2026', signups: 420, w1: '89%', w2: '76%', w4: '64%', w8: '55%', w12: '51%' },
  { cohort: 'Tháng 09/2026', signups: 530, w1: '91%', w2: '79%', w4: '68%', w8: '58%', w12: '53%' },
  { cohort: 'Tháng 10/2026', signups: 680, w1: '93%', w2: '82%', w4: '71%', w8: '62%', w12: '—' },
  { cohort: 'Tháng 11/2026', signups: 850, w1: '94%', w2: '84%', w4: '—', w8: '—', w12: '—' }
];

export function AdminReportsView() {
  const [reportCategory, setReportCategory] = useState<'users' | 'funnel' | 'financial' | 'accounting' | 'infra'>('users');
  const [period, setPeriod] = useState('2026-11');
  const [trafficMetric, setTrafficMetric] = useState<'pageviews' | 'activeUsers' | 'aiQueries'>('pageviews');

  const handleExportCsv = (name: string) => {
    let csvHeader = '';
    let csvRows = '';

    if (name === 'users') {
      csvHeader = 'Ngày,Lượt truy cập (Visits),Lượt xem trang (Pageviews),Người dùng tích cực (Active Users),Truy vấn AI\n';
      csvRows = TRAFFIC_DAILY_DATA.map(d => `"${d.date}",${d.visits},${d.pageviews},${d.activeUsers},${d.aiQueries}`).join('\n');
    } else if (name === 'funnel') {
      csvHeader = 'Giai đoạn phễu,Số lượng,Tỷ lệ chuyển đổi (%),Tỷ lệ suy giảm\n';
      csvRows = FUNNEL_DATA.map(f => `"${f.step}",${f.count},${f.pct}%,${f.drop}`).join('\n');
    } else {
      csvHeader = 'Kỳ,Người dùng mới,Lũy kế,Dùng thử Gold,Bản quyền Pro\n';
      csvRows = USER_GROWTH_DATA.map(u => `"${u.period}",${u.newUsers},${u.totalUsers},${u.trialGold},${u.paidPro}`).join('\n');
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvHeader + csvRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Finora_Admin_Analytics_${name}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Report Header & Filter Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Trung Tâm Báo Cáo Phân Tích & Biểu Đồ Lượt Người Dùng
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Giám sát thời gian thực số lượng người dùng, lượt xem trang (traffic), phễu chuyển đổi và mức độ gắn bó
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select value={period} label="Khoảng thời gian" onChange={e => setPeriod(e.target.value)}>
              <MenuItem value="2026-7d">7 Ngày gần nhất</MenuItem>
              <MenuItem value="2026-11">Tháng 11 / 2026</MenuItem>
              <MenuItem value="2026-10">Tháng 10 / 2026</MenuItem>
              <MenuItem value="2026-Q4">Quý IV / 2026</MenuItem>
              <MenuItem value="2026-YEAR">Cả năm 2026</MenuItem>
            </Select>
          </FormControl>

          <FinoraButton
            variant="primary"
            size="small"
            startIcon={<Download size={14} />}
            onClick={() => handleExportCsv(reportCategory)}
          >
            Xuất file CSV / Excel
          </FinoraButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={reportCategory}
          onChange={(_, v) => setReportCategory(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTabs-scroller': { overflowX: 'auto !important' },
            '& .MuiTab-root': { whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 750 }
          }}
        >
          <Tab value="users" label="1. Lượt Người Dùng & Lưu Lượng Traffic" />
          <Tab value="funnel" label="2. Phễu Chuyển Đổi & Tỷ Lệ Giữ Chân (Cohort)" />
          <Tab value="financial" label="3. Báo Cáo Doanh Thu MRR & Đối Soát" />
          <Tab value="accounting" label="4. Hóa Đơn MISA & Thuế VAT" />
          <Tab value="infra" label="5. Sức Khỏe Máy Chủ & Uptime 99.98%" />
        </Tabs>
      </Box>

      {/* 1. Users & Traffic Analytics Tab */}
      {reportCategory === 'users' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Traffic Overview Metrics */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
            <MetricCard
              title="Tổng Lượt Truy Cập (Visits)"
              value="20.960 lượt"
              trend={28.4}
              trendPeriod="so với tuần trước"
              icon={<Eye size={18} />}
              module="accounts"
              statusLabel="Tăng mạnh"
              status="success"
            />

            <MetricCard
              title="Tổng Lượt Xem Trang (Pageviews)"
              value="74.620 lượt"
              trend={35.1}
              trendPeriod="trung bình 3.56 trang/phiên"
              icon={<Layers size={18} />}
              module="investments"
              statusLabel="Gắn kết cao"
              status="success"
            />

            <MetricCard
              title="Người Dùng Hoạt Động (DAU Peak)"
              value="1.250 user/ngày"
              trend={22.0}
              trendPeriod="tỷ lệ DAU/MAU đạt 41.2%"
              icon={<Users size={18} />}
              module="income"
              statusLabel="Rất tích cực"
              status="success"
            />

            <MetricCard
              title="Lượt Gọi Trợ Lý AI Assistant"
              value="2.630 lượt/tuần"
              trend={48.6}
              trendPeriod="giao thức WebMCP Gemini"
              icon={<Sparkles size={18} color="#0284C7" />}
              module="budgets"
              statusLabel="Bùng nổ"
              status="info"
            />
          </Box>

          {/* Interactive Daily Traffic & Activity Chart */}
          <BaseCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Biểu Đồ Lưu Lượng Truy Cập & Lượt Xem Trang Hàng Ngày
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Theo dõi số lượng phiên truy cập, lượt mở app và tần suất sử dụng trợ lý AI
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <FinoraButton
                  size="small"
                  variant={trafficMetric === 'pageviews' ? 'primary' : 'neutral'}
                  onClick={() => setTrafficMetric('pageviews')}
                >
                  Pageviews
                </FinoraButton>
                <FinoraButton
                  size="small"
                  variant={trafficMetric === 'activeUsers' ? 'primary' : 'neutral'}
                  onClick={() => setTrafficMetric('activeUsers')}
                >
                  Active Users
                </FinoraButton>
                <FinoraButton
                  size="small"
                  variant={trafficMetric === 'aiQueries' ? 'primary' : 'neutral'}
                  onClick={() => setTrafficMetric('aiQueries')}
                >
                  Lượt Gọi AI
                </FinoraButton>
              </Box>
            </Box>

            <Box sx={{ width: '100%', height: 320, minHeight: 320, minWidth: 0, overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TRAFFIC_DAILY_DATA} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={45} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    name="Lượt Truy Cập (Visits)"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#trafficGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey={trafficMetric}
                    name={
                      trafficMetric === 'pageviews'
                        ? 'Lượt Xem Trang (Pageviews)'
                        : trafficMetric === 'activeUsers'
                          ? 'Người Dùng Tích Cực (DAU)'
                          : 'Lượt Gọi Trợ Lý AI'
                    }
                    stroke="#0284C7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#metricGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </BaseCard>

          {/* User Growth & Cumulative Signups Chart */}
          <BaseCard>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Xu Hướng Tăng Trưởng Người Dùng Mới & Lũy Kế Thuê Bao
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Phân bổ người dùng theo gói Dùng Thử VIP Gold 30D và Khách hàng trả phí Pro qua từng tháng
              </Typography>
            </Box>

            <Box sx={{ width: '100%', height: 300, minHeight: 300, minWidth: 0, overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={USER_GROWTH_DATA} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="period" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={45} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="newUsers" name="Người Dùng Mới / Tháng" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="trialGold" name="Dùng Thử VIP Gold 30D" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paidPro" name="Bản Quyền Trả Phí Pro/Gold" fill="#0284C7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </BaseCard>
        </Box>
      )}

      {/* 2. Funnel & Cohort Retention Tab */}
      {reportCategory === 'funnel' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Conversion Funnel Card */}
          <BaseCard>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
              Phễu Chuyển Đổi Người Dùng SaaS (User Conversion Funnel)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
              Đo lường tỷ lệ rớt qua từng bước từ Khách vãng lai đến Thuê bao trả phí chính thức
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {FUNNEL_DATA.map((step, idx) => (
                <Box
                  key={step.step}
                  sx={{
                    p: 2,
                    borderRadius: '6px',
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {step.step}
                      </Typography>
                      {idx > 0 && (
                        <Chip
                          label={`Tỷ lệ rớt: ${step.drop}`}
                          size="small"
                          sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}
                        />
                      )}
                    </Box>

                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {step.count.toLocaleString()} người ({step.pct}%)
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={step.pct}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: idx === 4 ? GOLD_COLOR_TOKENS.goldMetallic : idx === 3 ? '#10B981' : '#0284C7',
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          </BaseCard>

          {/* Cohort Retention Table Card */}
          <BaseCard>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
              Tỷ Lệ Giữ Chân Người Dùng Theo Nhóm Thời Gian (Cohort Retention Rate)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
              Tỷ lệ phần trăm người dùng tiếp tục quay lại mở app và ghi chép tài chính sau 1, 2, 4, 8 và 12 tuần
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 800 }}>Nhóm Đăng Ký (Cohort)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Quy mô ban đầu</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>Tuần 1</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>Tuần 2</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>Tuần 4</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>Tuần 8</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>Tuần 12</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {RETENTION_COHORT.map(c => (
                    <TableRow key={c.cohort} hover>
                      <TableCell sx={{ fontWeight: 750 }}>{c.cohort}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{c.signups} người</TableCell>
                      <TableCell align="center" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', fontWeight: 800, color: '#10B981' }}>{c.w1}</TableCell>
                      <TableCell align="center" sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', fontWeight: 800, color: '#10B981' }}>{c.w2}</TableCell>
                      <TableCell align="center" sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', fontWeight: 700 }}>{c.w4}</TableCell>
                      <TableCell align="center" sx={{ bgcolor: 'rgba(16, 185, 129, 0.05)', fontWeight: 700 }}>{c.w8}</TableCell>
                      <TableCell align="center">{c.w12}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </BaseCard>
        </Box>
      )}

      {/* 3. Financial Tab */}
      {reportCategory === 'financial' && (
        <BaseCard>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Đối Soát Doanh Thu & Cổng Thanh Toán payOS VietQR
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Chi tiết dòng tiền thực nhận từ các ngân hàng qua quét mã VietQR tự động
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 800 }}>Khoản mục doanh thu</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Số tiền</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Tỷ trọng</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Tình trạng đối soát</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Thuê bao Finora Gold VIP (Năm)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>77.870.000 ₫</TableCell>
                  <TableCell>74.7%</TableCell>
                  <TableCell><StatusBadge label="Đã khớp 100%" status="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Thuê bao Finora Pro (Năm)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>26.330.000 ₫</TableCell>
                  <TableCell>25.3%</TableCell>
                  <TableCell><StatusBadge label="Đã khớp 100%" status="success" size="small" /></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 800 }}>TỔNG DOANH THU THỰC NHẬN</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main', fontSize: 15 }}>104.200.000 ₫</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>100%</TableCell>
                  <TableCell><StatusBadge label="Đã chốt sổ" status="success" size="small" variant="dot" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      )}

      {/* 4. Accounting Tab */}
      {reportCategory === 'accounting' && (
        <BaseCard>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Kê Khai Thuế Giá Trị Gia Tăng (VAT) & Khấu Trừ Đầu Vào
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Phục vụ lập tờ khai thuế mẫu 01/GTGT gửi Cơ quan Thuế Quý IV / 2026
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 800 }}>Chỉ tiêu thuế</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Doanh số (Chưa thuế)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Thuế GTGT (10%)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Ghi chú kế toán</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Dịch vụ bán ra chịu thuế 10% (SaaS Software)</TableCell>
                  <TableCell align="right">94.727.273 ₫</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main' }}>9.472.727 ₫</TableCell>
                  <TableCell>Thuế đầu ra (Output VAT)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Hàng hóa, dịch vụ mua vào (Máy chủ, API)</TableCell>
                  <TableCell align="right">3.500.000 ₫</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'success.main' }}>350.000 ₫</TableCell>
                  <TableCell>Thuế đầu vào được khấu trừ</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 800 }}>THUẾ GTGT CÒN PHẢI NỘP NGÂN SÁCH</TableCell>
                  <TableCell align="right">—</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main', fontSize: 15 }}>9.122.727 ₫</TableCell>
                  <TableCell><StatusBadge label="Sẵn sàng nộp thuế" status="info" size="small" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      )}

      {/* 5. Infrastructure Health Tab */}
      {reportCategory === 'infra' && (
        <BaseCard>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Hiệu Năng Kỹ Thuật & Độ Sẵn Sàng Hệ Thống (Uptime 99.98%)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Theo dõi tải máy chủ, độ trễ API và tần suất sao lưu dữ liệu tự động
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '4px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Độ trễ trung bình API</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>42ms</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '4px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Tỷ lệ lỗi HTTP 5xx</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>0.01%</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '4px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Bản sao lưu gần nhất</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>30 phút trước</Typography>
            </Box>
          </Box>
        </BaseCard>
      )}
    </Box>
  );
}
