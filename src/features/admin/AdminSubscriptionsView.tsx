import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Check,
  Plus
} from 'lucide-react';
import { BaseCard } from '../../components/ui/CardVariants';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FinoraButton } from '../../components/ui/FinoraButton';
import { money } from '../../lib/finance';

interface PlanDefinition {
  id: string;
  name: string;
  price: number;
  period: string;
  activeSubscribers: number;
  features: string[];
  status: 'active' | 'archived';
}

const PLANS: PlanDefinition[] = [
  {
    id: 'plan-starter',
    name: 'Starter Miễn Phí',
    price: 0,
    period: 'Vĩnh viễn',
    activeSubscribers: 1230,
    features: ['Quản lý 3 tài khoản', 'Ghi chép giao dịch thủ công', 'Báo cáo cơ bản'],
    status: 'active'
  },
  {
    id: 'plan-pro-month',
    name: 'Finora Pro Tháng',
    price: 99000,
    period: 'Hàng tháng',
    activeSubscribers: 160,
    features: ['Không giới hạn tài khoản', 'Quét SMS ngân hàng AI', 'Định giá danh mục tự động', 'Hỗ trợ ưu tiên'],
    status: 'active'
  },
  {
    id: 'plan-pro-year',
    name: 'Finora Pro Năm (Tiết kiệm 50%)',
    price: 599000,
    period: 'Hàng năm',
    activeSubscribers: 260,
    features: ['Toàn bộ quyền lợi Pro', 'Tặng 6 tháng sử dụng', 'Xuất báo cáo thuế & VAT', 'WebMCP AI Assistant'],
    status: 'active'
  }
];

export function AdminSubscriptionsView() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. Plans Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {PLANS.map(p => (
          <BaseCard key={p.id}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {p.name}
              </Typography>
              <StatusBadge label="Đang cung cấp" status="success" size="small" variant="dot" />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5 }}>
              {p.price === 0 ? '0 ₫' : money(p.price)}
              <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
                /{p.period}
              </Typography>
            </Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
              <strong>{p.activeSubscribers}</strong> thuê bao đang hoạt động
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, borderTop: '1px solid var(--border-subtle)', pt: 1.5 }}>
              {p.features.map(f => (
                <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12.5 }}>
                  <Check size={14} style={{ color: '#10B981' }} />
                  <span>{f}</span>
                </Box>
              ))}
            </Box>
          </BaseCard>
        ))}
      </Box>

      {/* 2. Subscriptions Lifecycle Monitor */}
      <BaseCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Nhật ký Thuê bao & Gia hạn gần nhất
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Theo dõi chu kỳ thanh toán, nhắc gia hạn tự động và đối soát payOS
            </Typography>
          </Box>

          <FinoraButton variant="primary" size="small" startIcon={<Plus size={15} />}>
            Thêm gói ưu đãi
          </FinoraButton>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Gói dịch vụ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ngày bắt đầu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ngày gia hạn</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cổng thanh toán</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { email: 'minhanh@finora.vn', plan: 'Finora Pro Năm', start: '2026-10-15', renewal: '2027-10-15', gateway: 'payOS VietQR', status: 'active' },
                { email: 'tuan.nguyen@tech.io', plan: 'Finora Pro Năm', start: '2026-10-22', renewal: '2027-10-22', gateway: 'payOS VietQR', status: 'active' },
                { email: 'thutrang.le@sales.vn', plan: 'Finora Pro Tháng', start: '2026-10-01', renewal: '2026-11-01', gateway: 'payOS VietQR', status: 'pending' },
                { email: 'hoanglong.tran@gmail.com', plan: 'Starter Free', start: '2026-10-10', renewal: 'Vĩnh viễn', gateway: 'N/A', status: 'neutral' }
              ].map((sub, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 650 }}>{sub.email}</TableCell>
                  <TableCell>{sub.plan}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{sub.start}</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{sub.renewal}</TableCell>
                  <TableCell>{sub.gateway}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={sub.status === 'active' ? 'Đang hoạt động' : sub.status === 'pending' ? 'Chờ gia hạn' : 'Miễn phí'}
                      status={sub.status === 'active' ? 'success' : sub.status === 'pending' ? 'warning' : 'neutral'}
                      size="small"
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
