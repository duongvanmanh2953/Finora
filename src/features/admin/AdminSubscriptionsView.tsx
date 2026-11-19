import { useState, useMemo, useEffect } from 'react';
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
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import {
  Check,
  Plus,
  Crown,
  Search,
  MoreVertical,
  CreditCard,
  Mail,
  Edit3,
  Sparkles,
  Save,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { BaseCard } from '../../components/ui/CardVariants';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FinoraButton } from '../../components/ui/FinoraButton';
import { money } from '../../lib/finance';
import { GOLD_COLOR_TOKENS } from '../../lib/subscription';
import { formatVnDate } from '../../lib/dateUtils';

export interface PlanDefinition {
  id: string;
  name: string;
  code: 'FREE' | 'VIP_GOLD' | 'PRO';
  price: number;
  originalPrice?: number;
  period: string;
  billingCycle: 'monthly' | 'annual';
  activeSubscribers: number;
  features: string[];
  status: 'active' | 'archived';
  badge?: string;
  isGold?: boolean;
  isTrial?: boolean;
}

export interface SubscriptionRecord {
  id: string;
  email: string;
  plan: string;
  start: string;
  renewal: string;
  gateway: string;
  status: 'active' | 'trialing' | 'expired' | 'neutral';
  isGold?: boolean;
}

export interface ServicePermissionItem {
  id: string;
  name: string;
  description: string;
  category: string;
}

const FINORA_SERVICES: ServicePermissionItem[] = [
  {
    id: 'accounts_unlimited',
    name: 'Quản lý tài khoản ngân hàng & ví (Không giới hạn)',
    description: 'Starter Free chỉ tối đa 2 tài khoản; Gói nâng cao mở không giới hạn',
    category: 'Tài khoản'
  },
  {
    id: 'budgets_advanced',
    name: 'Ngân sách chi tiêu đa danh mục & Cảnh báo bội chi',
    description: 'Thiết lập hạn mức chi tiêu cho từng hạng mục kèm cảnh báo theo thời gian thực',
    category: 'Ngân sách'
  },
  {
    id: 'transactions_basic',
    name: 'Ghi chép & Phân loại giao dịch thông minh',
    description: 'Tự động gắn thẻ thu chi, nhận diện hóa đơn và quét mã QR',
    category: 'Giao dịch'
  },
  {
    id: 'ai_webmcp_assistant',
    name: 'Trợ lý AI Phân tích tài chính & Giao thức WebMCP',
    description: 'Hỗ trợ bởi Google Gemini, truy vấn dòng tiền bằng câu lệnh tự nhiên',
    category: 'Trí tuệ nhân tạo'
  },
  {
    id: 'smart_ledger',
    name: 'Smart Ledger: Phân tách vốn đầu tư & Lãi lỗ thực nhận',
    description: 'Bóc tách dòng tiền chi tiêu tiêu dùng với dòng tiền rót vào tài sản sinh lời',
    category: 'Đầu tư'
  },
  {
    id: 'speedometer_gauges',
    name: 'Speedometer Gauges: 4 cấp độ an toàn tài chính',
    description: 'Cụm đồng hồ công tơ mét đo lường đệm dự phòng khẩn cấp & áp lực nợ',
    category: 'Chỉ số sức khỏe'
  },
  {
    id: 'recurring_automation',
    name: 'Tự động hóa giao dịch định kỳ (Auto-recurring)',
    description: 'Tự động ghi nhận tiền lương, tiền trọ, lãi vay và các gói thuê bao định kỳ',
    category: 'Tự động hóa'
  },
  {
    id: 'stock_gold_realtime',
    name: 'Tự động cập nhật tỷ giá Vàng SJC, Cổ phiếu & Lãi kép',
    description: 'Tích hợp dữ liệu thị trường tài chính trực tiếp và tính toán lãi lũy kế',
    category: 'Thị trường'
  },
  {
    id: 'export_reports',
    name: 'Xuất báo cáo tài chính chuyên sâu (Excel / PDF / CSV)',
    description: 'Kết xuất file báo cáo dòng tiền, bảng cân đối tài sản và lịch sử thuế',
    category: 'Báo cáo'
  },
  {
    id: 'offline_cloud_sync',
    name: 'Đồng bộ đám mây đa thiết bị Offline-first & Khôi phục tự động',
    description: 'Hoạt động mượt mà khi mất mạng và đồng bộ mã hóa khi kết nối lại',
    category: 'Hạ tầng'
  },
  {
    id: 'vip_priority_support',
    name: 'Ưu tiên hỗ trợ kỹ thuật 24/7 & Cố vấn tài chính chuyên biệt',
    description: 'Kênh hỗ trợ hotline riêng và giải đáp chuyên sâu bài toán tích sản',
    category: 'Dịch vụ'
  }
];

const DEFAULT_PLANS: PlanDefinition[] = [
  {
    id: 'plan-starter',
    code: 'FREE',
    name: 'Starter Miễn Phí',
    price: 0,
    period: 'Vĩnh viễn',
    billingCycle: 'monthly',
    activeSubscribers: 1230,
    features: ['Quản lý 2 tài khoản', '3 ngân sách chi tiêu', 'Ghi chép giao dịch cơ bản', 'Lưu trữ local-first an toàn'],
    status: 'active'
  },
  {
    id: 'plan-trial',
    code: 'VIP_GOLD',
    name: 'Dùng Thử VIP Gold',
    price: 0,
    originalPrice: 149000,
    period: '30 ngày trải nghiệm',
    billingCycle: 'monthly',
    badge: 'ƯU ĐÃI CHÀO MỪNG',
    activeSubscribers: 485,
    features: ['Toàn bộ đặc quyền gói Gold VIP', 'Định giá danh mục tự động', 'WebMCP AI Assistant', 'Tự động cấp khi đăng ký'],
    status: 'active',
    isGold: true,
    isTrial: true
  },
  {
    id: 'plan-pro-year',
    code: 'PRO',
    name: 'Finora Pro (Năm)',
    price: 499000,
    originalPrice: 840000,
    period: 'Hàng năm',
    billingCycle: 'annual',
    badge: 'TIẾT KIỆM 40%',
    activeSubscribers: 260,
    features: ['Không giới hạn tài khoản', 'Giao dịch định kỳ tự động', 'Xuất báo cáo PDF & Excel', 'Hỗ trợ ưu tiên'],
    status: 'active'
  },
  {
    id: 'plan-gold-year',
    code: 'VIP_GOLD',
    name: 'Finora Gold VIP (Năm)',
    price: 999000,
    originalPrice: 1800000,
    period: 'Hàng năm',
    billingCycle: 'annual',
    badge: 'KHUYÊN DÙNG — TOÀN DIỆN',
    activeSubscribers: 142,
    features: ['Toàn bộ quyền lợi Pro', 'Smart Ledger theo dõi vốn đầu tư', 'Speedometer Gauges nâng cao', 'Huy hiệu Champagne Gold độc quyền'],
    status: 'active',
    isGold: true
  }
];

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  'plan-starter': ['accounts_basic', 'budgets_advanced', 'transactions_basic'],
  'plan-trial': FINORA_SERVICES.map(s => s.id),
  'plan-pro-year': [
    'accounts_unlimited',
    'budgets_advanced',
    'transactions_basic',
    'recurring_automation',
    'stock_gold_realtime',
    'export_reports',
    'offline_cloud_sync',
    'vip_priority_support'
  ],
  'plan-gold-year': FINORA_SERVICES.map(s => s.id)
};

const INITIAL_SUBSCRIPTIONS: SubscriptionRecord[] = [
  { id: 'sub-01', email: 'dang.khoa@gold.vn', plan: 'Finora Gold VIP (Năm)', start: '2026-10-01', renewal: '2027-10-01', gateway: 'payOS VietQR', status: 'active', isGold: true },
  { id: 'sub-02', email: 'nguyen.minh@newuser.io', plan: 'Dùng Thử VIP Gold', start: '2026-11-01', renewal: '2026-12-01', gateway: 'Tự động cấp', status: 'trialing', isGold: true },
  { id: 'sub-03', email: 'minhanh@finora.vn', plan: 'Finora Pro (Năm)', start: '2026-10-15', renewal: '2027-10-15', gateway: 'payOS VietQR', status: 'active', isGold: false },
  { id: 'sub-04', email: 'tuan.nguyen@tech.io', plan: 'Finora Pro (Năm)', start: '2026-10-22', renewal: '2027-10-22', gateway: 'payOS VietQR', status: 'active', isGold: false },
  { id: 'sub-05', email: 'thutrang.le@sales.vn', plan: 'Finora Gold VIP', start: '2026-09-01', renewal: '2026-10-01', gateway: 'Hết hạn', status: 'expired', isGold: false },
  { id: 'sub-06', email: 'hoanglong.tran@gmail.com', plan: 'Starter Miễn Phí', start: '2026-10-10', renewal: 'Vĩnh viễn', gateway: 'N/A', status: 'neutral', isGold: false }
];

export function AdminSubscriptionsView() {
  const [plans, setPlans] = useState<PlanDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('finora:admin_plans');
      return saved ? JSON.parse(saved) : DEFAULT_PLANS;
    } catch {
      return DEFAULT_PLANS;
    }
  });

  const [permissions, setPermissions] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('finora:admin_plan_permissions');
      return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
    } catch {
      return DEFAULT_PERMISSIONS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeSub, setActiveSub] = useState<SubscriptionRecord | null>(null);

  // Edit Plan Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanDefinition | null>(null);
  const [featuresText, setFeaturesText] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch plans from backend API if available
  useEffect(() => {
    fetch('/api/admin/plans')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Merge API plans with current UI activeSubscribers
          setPlans(prev =>
            prev.map(p => {
              const matched = json.data.find((apiP: any) => apiP.id === p.id);
              if (matched) {
                return {
                  ...p,
                  name: matched.name || p.name,
                  price: matched.price ?? p.price,
                  originalPrice: matched.originalPrice ?? p.originalPrice,
                  period: matched.billingPeriod || p.period,
                  badge: matched.badge ?? p.badge,
                  features: Array.isArray(matched.features) ? matched.features : p.features
                };
              }
              return p;
            })
          );
        }
      })
      .catch(() => {});

    fetch('/api/admin/plan-permissions')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data && typeof json.data === 'object') {
          setPermissions(prev => ({ ...prev, ...json.data }));
        }
      })
      .catch(() => {});
  }, []);

  const filteredSubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return INITIAL_SUBSCRIPTIONS;
    return INITIAL_SUBSCRIPTIONS.filter(
      s =>
        s.email.toLowerCase().includes(q) ||
        s.plan.toLowerCase().includes(q) ||
        s.gateway.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const paginatedSubs = useMemo(() => {
    return filteredSubs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredSubs, page, rowsPerPage]);

  const handleOpenEditPlan = (plan: PlanDefinition) => {
    setEditingPlan({ ...plan });
    setFeaturesText(plan.features.join('\n'));
    setEditDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    const updatedFeatures = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const updated: PlanDefinition = {
      ...editingPlan,
      features: updatedFeatures
    };

    const nextPlans = plans.map(p => (p.id === updated.id ? updated : p));
    setPlans(nextPlans);
    try {
      localStorage.setItem('finora:admin_plans', JSON.stringify(nextPlans));
      await fetch(`/api/admin/plans/${updated.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updated.name,
          price: updated.price,
          originalPrice: updated.originalPrice,
          billingPeriod: updated.period,
          billingCycle: updated.billingCycle,
          badge: updated.badge,
          features: updated.features,
          isActive: updated.status === 'active'
        })
      });
    } catch {}

    setEditDialogOpen(false);
    setToastMessage(`Đã cập nhật thành công gói giá "${updated.name}"!`);
  };

  // Toggle permission checkbox
  const handleTogglePermission = (planId: string, serviceId: string) => {
    setPermissions(prev => {
      const currentList = prev[planId] || [];
      const hasPermission = currentList.includes(serviceId);
      const nextList = hasPermission
        ? currentList.filter(id => id !== serviceId)
        : [...currentList, serviceId];

      const nextPermissions = { ...prev, [planId]: nextList };
      try {
        localStorage.setItem('finora:admin_plan_permissions', JSON.stringify(nextPermissions));
      } catch {}
      return nextPermissions;
    });
  };

  const handleSavePermissionsMatrix = async () => {
    try {
      localStorage.setItem('finora:admin_plan_permissions', JSON.stringify(permissions));
      await fetch('/api/admin/plan-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions)
      });
    } catch {}
    setToastMessage('Đã lưu thành công Ma trận Phân quyền Dịch vụ theo Gói giá!');
  };

  const handleResetPermissionsDefault = () => {
    setPermissions(DEFAULT_PERMISSIONS);
    try {
      localStorage.setItem('finora:admin_plan_permissions', JSON.stringify(DEFAULT_PERMISSIONS));
    } catch {}
    setToastMessage('Đã khôi phục ma trận phân quyền về mặc định!');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Strategic Pricing & Retention AI Recommendation Alert */}
      <Alert
        severity="info"
        icon={<Sparkles size={20} color="#0284C7" />}
        sx={{
          borderRadius: '6px',
          bgcolor: 'rgba(2, 132, 199, 0.08)',
          borderColor: 'rgba(2, 132, 199, 0.3)',
          border: '1px solid',
          color: 'text.primary'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Khuyến nghị Tối ưu Định giá & Tỷ lệ Chuyển đổi từ Finora AI
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 12.5, mt: 0.25 }}>
          Tỷ lệ chuyển đổi từ kỳ <strong>Dùng Thử VIP Gold 30 Ngày</strong> sang gói Năm hiện đạt mức ấn tượng <strong>34.2%</strong>. Khuyến nghị giữ mức giá ưu đãi <strong>999.000 ₫/năm</strong> (tương đương 83.250 ₫/tháng) và kích hoạt huy hiệu <em>"KHUYÊN DÙNG — TOÀN DIỆN NHẤT"</em> để tối ưu LTV khách hàng.
        </Typography>
      </Alert>

      {/* 1. Plans Cards with Direct Edit Action */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Quản Lý Gói Giá & Ưu Đãi SaaS ({plans.length} gói cước)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Thiết lập giá niêm yết, chu kỳ tính phí và các quyền lợi đặc thù của từng phân tầng người dùng
            </Typography>
          </Box>

          <FinoraButton
            variant="secondary"
            size="small"
            startIcon={<Plus size={15} />}
            onClick={() => {
              const newPlan: PlanDefinition = {
                id: `plan-custom-${Date.now()}`,
                code: 'PRO',
                name: 'Gói Ưu Đãi Mới',
                price: 299000,
                period: '6 tháng',
                billingCycle: 'monthly',
                activeSubscribers: 0,
                features: ['Tính năng chuyên biệt', 'Hỗ trợ nâng cao'],
                status: 'active'
              };
              handleOpenEditPlan(newPlan);
            }}
          >
            Thêm gói giá mới
          </FinoraButton>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
          {plans.map(p => (
            <BaseCard
              key={p.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: p.isGold ? `1.5px solid ${GOLD_COLOR_TOKENS.goldBorder}` : undefined,
                bgcolor: p.isGold ? 'rgba(197, 160, 89, 0.04)' : undefined,
                position: 'relative'
              }}
            >
              <Box>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {p.isGold && <Crown size={15} color={GOLD_COLOR_TOKENS.goldMetallic} />}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : 'inherit',
                        fontSize: 14.5
                      }}
                    >
                      {p.name}
                    </Typography>
                  </Box>
                  <Tooltip title="Chỉnh sửa chi tiết gói giá này">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditPlan(p)}
                      sx={{
                        color: 'text.secondary',
                        bgcolor: 'action.hover',
                        borderRadius: '4px',
                        '&:hover': { color: 'primary.main', bgcolor: 'primary.light' }
                      }}
                    >
                      <Edit3 size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Badge if exists */}
                {p.badge && (
                  <Chip
                    label={p.badge}
                    size="small"
                    sx={{
                      height: 19,
                      fontSize: 10,
                      fontWeight: 800,
                      borderRadius: '3px',
                      mb: 1,
                      bgcolor: p.isGold ? 'rgba(197, 160, 89, 0.18)' : 'rgba(16, 185, 129, 0.15)',
                      color: p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : '#10B981',
                      border: '1px solid',
                      borderColor: p.isGold ? GOLD_COLOR_TOKENS.goldBorder : 'rgba(16, 185, 129, 0.3)'
                    }}
                  />
                )}

                {/* Price Display */}
                <Box sx={{ mb: 1 }}>
                  {p.originalPrice && p.originalPrice > p.price && (
                    <Typography
                      variant="caption"
                      sx={{
                        textDecoration: 'line-through',
                        color: 'text.secondary',
                        display: 'block',
                        fontSize: 12
                      }}
                    >
                      {money(p.originalPrice)}
                    </Typography>
                  )}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : 'primary.main'
                    }}
                  >
                    {p.price === 0 ? '0 ₫' : money(p.price)}
                    <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
                      /{p.period}
                    </Typography>
                  </Typography>
                </Box>

                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                  <strong>{p.activeSubscribers}</strong> thuê bao đang sử dụng
                </Typography>

                {/* Feature bullets */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, borderTop: '1px solid var(--border-subtle)', pt: 1.5 }}>
                  {p.features.map(f => (
                    <Box key={f} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, fontSize: 12 }}>
                      <Check
                        size={13}
                        style={{
                          color: p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : '#10B981',
                          flexShrink: 0,
                          marginTop: 3
                        }}
                      />
                      <span>{f}</span>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed var(--border-subtle)' }}>
                <FinoraButton
                  fullWidth
                  variant="secondary"
                  size="small"
                  startIcon={<Edit3 size={13} />}
                  onClick={() => handleOpenEditPlan(p)}
                >
                  Sửa giá & đặc quyền
                </FinoraButton>
              </Box>
            </BaseCard>
          ))}
        </Box>
      </Box>

      {/* 2. Interactive Service Permission Matrix by Pricing Plan */}
      <BaseCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sliders size={18} color="#10B981" />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Ma Trận Tích Chọn Phân Quyền Các Dịch Vụ Theo Gói Giá
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Tích chọn hoặc bỏ chọn để bật/tắt quyền truy cập từng dịch vụ cho từng cấp độ gói. Hệ thống sẽ lập tức cập nhật kiểm soát truy cập (Access Control) người dùng.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FinoraButton
              variant="secondary"
              size="small"
              startIcon={<RotateCcw size={14} />}
              onClick={handleResetPermissionsDefault}
            >
              Đặt lại mặc định
            </FinoraButton>

            <FinoraButton
              variant="primary"
              size="small"
              startIcon={<Save size={14} />}
              onClick={handleSavePermissionsMatrix}
            >
              Lưu cấu hình phân quyền
            </FinoraButton>
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 800, minWidth: 260 }}>Tính năng / Phân hệ Dịch vụ</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 110 }}>Phân loại</TableCell>
                {plans.map(p => (
                  <TableCell
                    key={p.id}
                    align="center"
                    sx={{
                      fontWeight: 800,
                      minWidth: 140,
                      color: p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : 'inherit',
                      bgcolor: p.isGold ? 'rgba(197, 160, 89, 0.05)' : undefined
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      {p.isGold && <Crown size={12} color={GOLD_COLOR_TOKENS.goldMetallic} />}
                      <span>{p.name}</span>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 10.5 }}>
                      {p.price === 0 ? '0 ₫' : money(p.price)}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {FINORA_SERVICES.map((srv, idx) => (
                <TableRow
                  key={srv.id}
                  hover
                  sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : 'action.hover' }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                      {srv.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 11 }}>
                      {srv.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={srv.category}
                      size="small"
                      sx={{ height: 20, fontSize: 10, borderRadius: '3px' }}
                    />
                  </TableCell>
                  {plans.map(p => {
                    const isGranted = (permissions[p.id] || []).includes(srv.id);
                    return (
                      <TableCell
                        key={p.id}
                        align="center"
                        sx={{
                          bgcolor: p.isGold ? 'rgba(197, 160, 89, 0.03)' : undefined,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleTogglePermission(p.id, srv.id)}
                      >
                        <Checkbox
                          checked={isGranted}
                          onChange={() => handleTogglePermission(p.id, srv.id)}
                          size="small"
                          sx={{
                            color: p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : 'primary.main',
                            '&.Mui-checked': {
                              color: p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : '#10B981'
                            }
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            fontSize: 10.5,
                            fontWeight: isGranted ? 700 : 500,
                            color: isGranted ? (p.isGold ? GOLD_COLOR_TOKENS.goldMetallic : 'success.main') : 'text.disabled'
                          }}
                        >
                          {isGranted ? 'Được dùng' : 'Khóa'}
                        </Typography>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </BaseCard>

      {/* 3. Subscriptions Lifecycle Monitor */}
      <BaseCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Nhật Ký Thuê Bao & Chu Kỳ Gia Hạn ({filteredSubs.length})
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Theo dõi chu kỳ thanh toán, đối soát PayOS VietQR và kỳ dùng thử 30 ngày VIP Gold
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Tìm theo email, gói..."
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
              sx={{ minWidth: 200 }}
            />
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px', maxHeight: 540, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Gói dịch vụ</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Ngày bắt đầu</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Ngày gia hạn / Hết hạn</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Cổng thanh toán</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSubs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Không tìm thấy dữ liệu thuê bao phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSubs.map(sub => (
                  <TableRow key={sub.id} hover>
                    <TableCell sx={{ fontWeight: 650 }}>{sub.email}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {sub.isGold && <Crown size={12} color={GOLD_COLOR_TOKENS.goldMetallic} />}
                        <span
                          style={{
                            fontWeight: sub.isGold ? 700 : 500,
                            color: sub.isGold ? GOLD_COLOR_TOKENS.goldMetallic : 'inherit'
                          }}
                        >
                          {sub.plan}
                        </span>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{formatVnDate(sub.start)}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>
                      {sub.renewal === 'Vĩnh viễn' ? 'Vĩnh viễn' : formatVnDate(sub.renewal)}
                    </TableCell>
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
                    <TableCell align="right">
                      <Tooltip title="Thao tác nhanh">
                        <IconButton
                          size="small"
                          onClick={e => {
                            setMenuAnchorEl(e.currentTarget);
                            setActiveSub(sub);
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

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSubs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Bản ghi mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} trên tổng số ${count}`}
          sx={{ borderTop: '1px solid var(--border-subtle)', mt: 1 }}
        />

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={() => {
            setMenuAnchorEl(null);
            setActiveSub(null);
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {activeSub && (
            <MenuItem
              onClick={() => {
                setMenuAnchorEl(null);
                setToastMessage(`Đã gửi liên kết gia hạn đến: ${activeSub.email}`);
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}><Mail size={15} /></ListItemIcon>
              <ListItemText primary="Gửi email nhắc gia hạn" />
            </MenuItem>
          )}
          {activeSub && (
            <MenuItem
              onClick={() => {
                setMenuAnchorEl(null);
                setToastMessage(`Đã tạo biên lai đối soát cho đơn ${activeSub.id}`);
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}><CreditCard size={15} /></ListItemIcon>
              <ListItemText primary="Xem biên lai PayOS" />
            </MenuItem>
          )}
        </Menu>
      </BaseCard>

      {/* Edit Pricing Plan Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '8px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit3 size={18} color="#10B981" />
            <span>Chỉnh Sửa Gói Giá & Ưu Đãi</span>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
          {editingPlan && (
            <>
              <TextField
                label="Tên Gói Dịch Vụ"
                fullWidth
                size="small"
                value={editingPlan.name}
                onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Giá Bán (VNĐ)"
                  type="number"
                  fullWidth
                  size="small"
                  value={editingPlan.price}
                  onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">₫</InputAdornment>
                    }
                  }}
                />

                <TextField
                  label="Giá Gốc / Gạch Chân (VNĐ)"
                  type="number"
                  fullWidth
                  size="small"
                  value={editingPlan.originalPrice || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">₫</InputAdornment>
                    }
                  }}
                  helperText="Để trống nếu không áp dụng giảm giá"
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Chu kỳ hiển thị (VD: Hàng năm, Vĩnh viễn)"
                  fullWidth
                  size="small"
                  value={editingPlan.period}
                  onChange={e => setEditingPlan({ ...editingPlan, period: e.target.value })}
                />

                <TextField
                  label="Huy hiệu nổi bật (Badge)"
                  fullWidth
                  size="small"
                  value={editingPlan.badge || ''}
                  placeholder="VD: KHUYÊN DÙNG, BÁN CHẠY"
                  onChange={e => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                />
              </Box>

              <TextField
                label="Danh sách quyền lợi chính (Mỗi dòng một tính năng)"
                multiline
                rows={4}
                fullWidth
                size="small"
                value={featuresText}
                onChange={e => setFeaturesText(e.target.value)}
                helperText="Mỗi gạch đầu dòng là một dòng riêng biệt hiển thị trên thẻ giá."
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={editingPlan.status === 'active'}
                    onChange={e => setEditingPlan({ ...editingPlan, status: e.target.checked ? 'active' : 'archived' })}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Đang mở bán công khai cho người dùng</Typography>}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <FinoraButton variant="secondary" size="small" onClick={() => setEditDialogOpen(false)}>
            Hủy bỏ
          </FinoraButton>
          <FinoraButton variant="primary" size="small" startIcon={<Save size={15} />} onClick={handleSavePlan}>
            Lưu thay đổi gói giá
          </FinoraButton>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
