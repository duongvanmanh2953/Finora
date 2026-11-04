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
  Plus,
  Crown
} from 'lucide-react';
import { BaseCard } from '../../components/ui/CardVariants';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FinoraButton } from '../../components/ui/FinoraButton';
import { money } from '../../lib/finance';
import { GOLD_COLOR_TOKENS } from '../../lib/subscription';

interface PlanDefinition {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  activeSubscribers: number;
  features: string[];
  status: 'active' | 'archived';
  isGold?: boolean;
  isTrial?: boolean;
}

const PLANS: PlanDefinition[] = [
  {
    id: 'plan-starter',
    name: 'Starter Miễn Phí',
    price: 0,
    period: 'Vĩnh viễn',
    activeSubscribers: 1230,
    features: ['Quản lý 2 tài khoản', '3 ngân sách chi tiêu', 'Ghi chép giao dịch cơ bản', 'Lưu trữ local-first'],
    status: 'active'
  },
  {
    id: 'plan-trial',
    name: 'Dùng Thử VIP Gold',
    price: 0,
    originalPrice: 149000,
    period: '30 ngày trải nghiệm',
    activeSubscribers: 485,
    features: ['Toàn bộ đặc quyền gói Gold VIP', 'Định giá danh mục tự động', 'WebMCP AI Assistant', 'Tự động cấp khi đăng ký'],
    status: 'active',
    isGold: true,
    isTrial: true
  },
  {
    id: 'plan-pro-year',
    name: 'Finora Pro (Năm)',
    price: 599000,
    period: 'Hàng năm',
    activeSubscribers: 260,
    features: ['Không giới hạn tài khoản', 'Giao dịch định kỳ tự động', 'Xuất báo cáo PDF & Excel', 'Hỗ trợ ưu tiên'],
    status: 'active'
  },
  {
    id: 'plan-gold-year',
    name: 'Finora Gold VIP (Năm)',
    price: 999000,
    period: 'Hàng năm',
    activeSubscribers: 142,
    features: ['Toàn bộ quyền lợi Pro', 'Smart Ledger theo dõi vốn đầu tư', 'Speedometer Gauges nâng cao', 'Huy hiệu Champagne Gold độc quyền'],
    status: 'active',
    isGold: true
  }
];

export function AdminSubscriptionsView() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. Plans Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        {PLANS.map(p => (
          <BaseCard
            key={p.id}
            sx={{
              border: p.isGold ? `1.5px solid ${GOLD_COLOR_TOKENS.goldBorder}` : undefined,
              bgcolor: p.isGold ? 'rgba(197, 160, 89, 0.04)' : undefined
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {p.isGold && <Crown size={15} color={GOLD_COLOR_TOKENS.goldMetallic} />}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : 'inherit' }}>
                  {p.name}
                </Typography>
              </Box>
              <StatusBadge label="Đang cung cấp" status="success" size="small" variant="dot" />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 900, color: p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : 'primary.main', mb: 0.5 }}>
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
                <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12 }}>
                  <Check size={13} style={{ color: p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : '#10B981' }} />
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
              Theo dõi chu kỳ thanh toán, thời hạn dùng thử 30 ngày VIP Gold và đối soát thuê bao
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
                <TableCell sx={{ fontWeight: 700 }}>Ngày gia hạn / Hết hạn</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cổng thanh toán</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { email: 'dang.khoa@gold.vn', plan: 'VIP Gold (Năm)', start: '2026-10-01', renewal: '2027-10-01', gateway: 'payOS VietQR', status: 'active', isGold: true },
                { email: 'nguyen.minh@newuser.io', plan: 'Dùng Thử VIP Gold', start: '2026-11-01', renewal: '2026-12-01 (Còn 27 ngày)', gateway: 'Tự động cấp', status: 'trialing', isGold: true },
                { email: 'minhanh@finora.vn', plan: 'Finora Pro Năm', start: '2026-10-15', renewal: '2027-10-15', gateway: 'payOS VietQR', status: 'active', isGold: false },
                { email: 'tuan.nguyen@tech.io', plan: 'Finora Pro Năm', start: '2026-10-22', renewal: '2027-10-22', gateway: 'payOS VietQR', status: 'active', isGold: false },
                { email: 'thutrang.le@sales.vn', plan: 'VIP Gold Hết hạn', start: '2026-09-01', renewal: 'Đã về Free (2026-10-01)', gateway: 'Hết hạn', status: 'expired', isGold: false },
                { email: 'hoanglong.tran@gmail.com', plan: 'Starter Free', start: '2026-10-10', renewal: 'Vĩnh viễn', gateway: 'N/A', status: 'neutral', isGold: false }
              ].map((sub, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 650 }}>{sub.email}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {sub.isGold && <Crown size={12} color={GOLD_COLOR_TOKENS.goldMetallic} />}
                      <span style={{ fontWeight: sub.isGold ? 700 : 500, color: sub.isGold ? GOLD_COLOR_TOKENS.goldMetallic : 'inherit' }}>
                        {sub.plan}
                      </span>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{sub.start}</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{sub.renewal}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{sub.gateway}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={
                        sub.status === 'active'
                          ? 'Đang hoạt động'
                          : sub.status === 'trialing'
                            ? 'Dùng thử Gold'
                            : sub.status === 'expired'
                              ? 'Đã hết hạn'
                              : 'Miễn phí'
                      }
                      status={
                        sub.status === 'active'
                          ? 'success'
                          : sub.status === 'trialing'
                            ? 'warning'
                            : sub.status === 'expired'
                              ? 'danger'
                              : 'neutral'
                      }
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
