import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import {
  Check,
  Crown,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Zap
} from 'lucide-react';
import { useFinance } from '../../store';
import { PageHead } from '../../components/ui';
import {
  SYSTEM_PLANS,
  GOLD_COLOR_TOKENS,
  isTrialActive,
  getTrialDaysRemaining,
  isGoldUser
} from '../../lib/subscription';
import { PaymentCheckoutModal } from '../../components/subscription/PaymentCheckoutModal';
import { TierBadgeIcon } from '../../components/subscription/TierBadgeIcon';
import { money } from '../../lib/finance';

export default function PricingPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data, update } = useFinance();

  const user = data?.user;
  const trialActive = isTrialActive(user);
  const trialDaysRemaining = getTrialDaysRemaining(user);
  const daysRemaining = trialDaysRemaining;
  const isGold = data ? isGoldUser(data) : false;
  const isPro = user?.plan === 'pro';

  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [checkoutModal, setCheckoutModal] = useState<{
    open: boolean;
    planId: string;
    planName: string;
    amount: number;
  }>({
    open: false,
    planId: '',
    planName: '',
    amount: 0
  });

  const handleSelectPlan = async (planId: string, planName: string) => {
    if (!data) return;

    if (planId === 'plan-gold' && !isGold && !trialActive) {
      const now = new Date();
      const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await update(d => ({
        ...d,
        user: {
          ...d.user,
          plan: 'gold',
          subscription_status: 'trialing',
          trial_started_at: now.toISOString(),
          trial_ends_at: endsAt,
          current_plan_id: 'plan-gold'
        }
      }), 'Tích Sản gửi tặng bạn 01 tháng trải nghiệm VIP Gold miễn phí (0đ). Khám phá toàn bộ tính năng cao cấp!');
      return;
    }

    if (planId === 'plan-free') {
      await update(d => ({
        ...d,
        user: {
          ...d.user,
          plan: 'free',
          subscription_status: 'free',
          current_plan_id: 'plan-free'
        }
      }), 'Đã chuyển sang gói Miễn Phí (Free).');
      return;
    }

    // For paid plans, trigger checkout
    const targetPlan = SYSTEM_PLANS.find(p => p.id === planId);
    const price = targetPlan ? (billingCycle === 'annual' ? targetPlan.price : Math.round(targetPlan.price * 1.5 / 12)) : 999000;
    setCheckoutModal({
      open: true,
      planId,
      planName,
      amount: price
    });
  };

  const featureMatrix = [
    { name: 'Số lượng tài khoản & ví ngân hàng', free: '2 tài khoản', pro: 'Không giới hạn', gold: 'Không giới hạn' },
    { name: 'Ngân sách chi tiêu', free: '3 danh mục', pro: 'Không giới hạn', gold: 'Không giới hạn' },
    { name: 'Mục tiêu tài chính & Tiết kiệm', free: '1 mục tiêu', pro: 'Không giới hạn', gold: 'Không giới hạn' },
    { name: 'Quản lý Đầu tư & Cổ phiếu HOSE/HNX', free: 'Thủ công', pro: 'Đồng bộ giá thị trường', gold: 'Định giá realtime + Lãi thực tế' },
    { name: 'Vàng SJC/9999 & Tiết kiệm Bank', free: 'Cơ bản', pro: 'Tự tính lãi dự thu', gold: 'Tự tính lãi kép + Dự phóng tài sản' },
    { name: 'Smart Ledger: Vốn chưa thu hồi', free: 'Không hỗ trợ', pro: 'Theo dõi vốn cơ bản', gold: 'Smart Ledger 4 cấp độ rủi ro' },
    { name: 'Tốc kế Sức khỏe Tài chính (GSAP Gauges)', free: '1 chỉ số', pro: 'Đầy đủ 4 chỉ số', gold: 'Đầy đủ + Khuyến nghị Chuyên sâu' },
    { name: 'WebMCP AI Assistant 2 chiều', free: '5 lệnh/ngày', pro: 'Không giới hạn', gold: 'Không giới hạn + Lệnh phức tạp' },
    { name: 'Xuất báo cáo tài chính Excel / PDF', free: 'Không hỗ trợ', pro: 'Hỗ trợ', gold: 'Hỗ trợ + Báo cáo Thuế TNCN' },
    { name: 'Hỗ trợ kỹ thuật', free: 'Cộng đồng', pro: 'Ưu tiên 24/7', gold: 'Cố vấn tài chính chuyên biệt' }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, pb: 6 }}>
      {/* 1. Page Header */}
      <PageHead
        title="Danh Sách Gói Dịch Vụ & Bảng Giá"
        subtitle="Minh bạch, linh hoạt và không tự động trừ tiền. Trải nghiệm trọn vẹn sức mạnh quản lý tài sản Tích Sản."
      />

      {/* Active Subscription Status Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: '10px',
          border: '1px solid',
          borderColor: trialActive
            ? (isDark ? GOLD_COLOR_TOKENS.borderDark : GOLD_COLOR_TOKENS.borderLight)
            : isGold
            ? (isDark ? GOLD_COLOR_TOKENS.borderDark : GOLD_COLOR_TOKENS.borderLight)
            : isPro
            ? (isDark ? 'rgba(59, 130, 246, 0.4)' : '#BFDBFE')
            : 'divider',
          bgcolor: trialActive || isGold
            ? (isDark ? GOLD_COLOR_TOKENS.bgDark : GOLD_COLOR_TOKENS.bgLight)
            : isPro
            ? (isDark ? '#0F1E36' : '#EFF6FF')
            : (isDark ? '#161B22' : '#F8FAFC'),
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: trialActive || isGold ? 'rgba(197, 160, 89, 0.2)' : isPro ? 'rgba(37, 99, 235, 0.15)' : 'action.hover',
              color: trialActive || isGold ? GOLD_COLOR_TOKENS.main : isPro ? '#2563EB' : 'text.secondary'
            }}
          >
            {trialActive || isGold ? <Crown size={22} /> : isPro ? <Zap size={22} /> : <ShieldCheck size={22} />}
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Gói hiện tại của bạn: {trialActive ? 'Dùng thử VIP Gold' : isGold ? 'Tích Sản VIP Gold' : isPro ? 'Tích Sản Pro' : 'Gói Miễn Phí (Free)'}
              </Typography>
              {trialActive && (
                <Chip
                  size="small"
                  label={`Còn ${trialDaysRemaining} ngày`}
                  sx={{
                    height: 22,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    bgcolor: isDark ? 'rgba(197, 160, 89, 0.25)' : '#FEF3C7',
                    color: isDark ? GOLD_COLOR_TOKENS.badgeTextDark : GOLD_COLOR_TOKENS.badgeTextLight,
                    border: '1px solid',
                    borderColor: isDark ? GOLD_COLOR_TOKENS.borderDark : GOLD_COLOR_TOKENS.borderLight
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem' }}>
              {trialActive
                ? `Bạn đang được cấp toàn quyền trải nghiệm Gói Gold trong 30 ngày. Hết hạn ngày: ${user?.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString('vi-VN') : '—'}. Khi hết hạn, tài khoản tự động chuyển về Free an toàn.`
                : isGold || isPro
                ? `Thời hạn gói: ${user?.proExpiresAt ? new Date(user.proExpiresAt).toLocaleDateString('vi-VN') : 'Trọn đời'}. Toàn bộ tính năng đã được kích hoạt.`
                : 'Bạn đang sử dụng các tính năng cơ bản. Kích hoạt dùng thử 30 ngày để mở khóa đầy đủ tính năng.'}
            </Typography>
          </Box>
        </Box>

        {!isGold && !isPro && !trialActive && (
          <Button
            variant="contained"
            size="small"
            startIcon={<Sparkles size={16} />}
            onClick={() => handleSelectPlan('plan-trial', 'Dùng thử VIP Gold (30 Ngày)')}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: '8px',
              py: 1,
              px: 2.2,
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              bgcolor: GOLD_COLOR_TOKENS.main,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(197, 160, 89, 0.35)',
              '&:hover': { bgcolor: GOLD_COLOR_TOKENS.dark }
            }}
          >
            Nhận 30 Ngày Dùng Thử Gold
          </Button>
        )}
      </Paper>

      {/* 2. Billing Cycle Switcher */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' },
            maxWidth: { xs: '100%', sm: 480 },
            p: 0.5,
            borderRadius: '12px',
            bgcolor: isDark ? '#161B22' : '#F1F5F9',
            border: '1px solid',
            borderColor: 'divider',
            gap: 0.5
          }}
        >
          <Button
            size="small"
            fullWidth
            onClick={() => setBillingCycle('annual')}
            sx={{
              py: 0.8,
              px: { xs: 2, sm: 2.5 },
              fontSize: '0.82rem',
              fontWeight: billingCycle === 'annual' ? 800 : 500,
              color: billingCycle === 'annual' ? (isDark ? '#F8FAFC' : '#0F172A') : 'text.secondary',
              bgcolor: billingCycle === 'annual' ? (isDark ? '#2D3748' : '#FFFFFF') : 'transparent',
              borderRadius: '8px',
              boxShadow: billingCycle === 'annual' ? 1 : 0,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              justifyContent: 'center',
              '&:hover': { bgcolor: billingCycle === 'annual' ? (isDark ? '#374151' : '#FFFFFF') : 'action.hover' }
            }}
          >
            Thanh toán theo năm (Tiết kiệm 50%)
          </Button>
          <Button
            size="small"
            fullWidth
            onClick={() => setBillingCycle('monthly')}
            sx={{
              py: 0.8,
              px: { xs: 2, sm: 2.5 },
              fontSize: '0.82rem',
              fontWeight: billingCycle === 'monthly' ? 800 : 500,
              color: billingCycle === 'monthly' ? (isDark ? '#F8FAFC' : '#0F172A') : 'text.secondary',
              bgcolor: billingCycle === 'monthly' ? (isDark ? '#2D3748' : '#FFFFFF') : 'transparent',
              borderRadius: '8px',
              boxShadow: billingCycle === 'monthly' ? 1 : 0,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              justifyContent: 'center',
              '&:hover': { bgcolor: billingCycle === 'monthly' ? (isDark ? '#374151' : '#FFFFFF') : 'action.hover' }
            }}
          >
            Thanh toán theo tháng
          </Button>
        </Box>
      </Box>

      {/* 3. Pricing Cards Grid - 3 Distinct Tiers with Single VIP Gold Card */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2.5
        }}
      >
        {SYSTEM_PLANS.map(plan => {
          const isCurrent = (plan.id === 'plan-free' && !isPro && !isGold && !trialActive) ||
            (plan.tier === 'pro' && isPro && !trialActive) ||
            (plan.tier === 'gold' && isGold && !trialActive);

          const isGoldCard = plan.isGold;
          const isGoldTrialing = isGoldCard && trialActive;

          return (
            <Paper
              key={plan.id}
              elevation={0}
              sx={{
                p: { xs: 2.25, sm: 2.5 },
                borderRadius: '18px',
                border: '1px solid',
                borderColor: isGoldCard
                  ? (isDark ? GOLD_COLOR_TOKENS.borderDark : GOLD_COLOR_TOKENS.borderLight)
                  : isCurrent
                  ? 'primary.main'
                  : 'divider',
                bgcolor: isGoldCard
                  ? (isDark ? '#1C170E' : '#FFFDF7')
                  : (isDark ? '#161B22' : '#FFFFFF'),
                boxShadow: isGoldCard
                  ? (isDark ? '0 4px 20px rgba(197, 160, 89, 0.15)' : '0 4px 16px rgba(197, 160, 89, 0.1)')
                  : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 2
              }}
            >
              <Box>
                {/* Header Row: Title & Badge */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1, minHeight: 28 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <TierBadgeIcon
                      tier={plan.isGold ? 'gold' : plan.tier}
                      isTrial={isGoldTrialing}
                      size={36}
                      iconSize={19}
                      showTooltip={false}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 850, color: isGoldCard ? GOLD_COLOR_TOKENS.main : plan.tier === 'pro' ? '#8B5CF6' : 'text.primary', lineHeight: 1.3 }}>
                      {plan.name}
                    </Typography>
                  </Box>

                  {isGoldTrialing ? (
                    <Chip
                      size="small"
                      label={`Đang dùng thử (Còn ${daysRemaining} ngày)`}
                      sx={{
                        flexShrink: 0,
                        height: 22,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        bgcolor: 'rgba(197, 160, 89, 0.25)',
                        color: GOLD_COLOR_TOKENS.main,
                        border: `1px solid ${GOLD_COLOR_TOKENS.borderLight}`
                      }}
                    />
                  ) : plan.badge ? (
                    <Chip
                      size="small"
                      label={plan.badge}
                      sx={{
                        flexShrink: 0,
                        height: 22,
                        fontSize: '0.68rem',
                        fontWeight: 750,
                        bgcolor: isGoldCard
                          ? (isDark ? 'rgba(197, 160, 89, 0.25)' : '#FEF3C7')
                          : 'action.hover',
                        color: isGoldCard ? GOLD_COLOR_TOKENS.main : 'text.primary',
                        border: '1px solid',
                        borderColor: isGoldCard ? GOLD_COLOR_TOKENS.borderLight : 'divider'
                      }}
                    />
                  ) : null}
                </Box>

                {/* Price Display */}
                <Box sx={{ my: 1.5 }}>
                  {isGoldCard ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 900,
                            color: isDark ? GOLD_COLOR_TOKENS.light : GOLD_COLOR_TOKENS.dark,
                            letterSpacing: '-0.02em',
                            fontFeatureSettings: '"tnum"'
                          }}
                        >
                          30 ngày đầu: 0đ
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem', lineHeight: 1.35 }}>
                        Sau thời gian dùng thử: Giá gốc 99.000 ₫/tháng hoặc 999.000 ₫/năm (Không tự động trừ thẻ)
                      </Typography>

                      {/* Active Trial Progress Bar */}
                      {isGoldTrialing && (
                        <Box sx={{ mt: 1.25, p: 1.25, borderRadius: '12px', bgcolor: isDark ? 'rgba(197, 160, 89, 0.12)' : '#FEF9EE', border: '1px solid', borderColor: GOLD_COLOR_TOKENS.borderLight }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 700, color: GOLD_COLOR_TOKENS.main }}>
                              Tiến độ dùng thử VIP Gold
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 800, color: GOLD_COLOR_TOKENS.main }}>
                              Còn {daysRemaining} / 30 ngày
                            </Typography>
                          </Box>
                          <Box sx={{ width: '100%', height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                            <Box sx={{ width: `${Math.max(5, Math.min(100, ((30 - daysRemaining) / 30) * 100))}%`, height: '100%', bgcolor: GOLD_COLOR_TOKENS.main, borderRadius: 3 }} />
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.68rem', color: 'text.secondary' }}>
                            Hết hạn bạn sẽ về gói Free và không bao giờ bị mất dữ liệu.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 900,
                            color: 'text.primary',
                            letterSpacing: '-0.02em',
                            fontFeatureSettings: '"tnum"'
                          }}
                        >
                          {plan.price === 0 ? '0 ₫' : money(billingCycle === 'annual' ? plan.price : Math.round(plan.price * 1.5 / 12))}
                        </Typography>
                        {plan.originalPrice && (
                          <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.75rem' }}>
                            {money(plan.originalPrice)}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                        {plan.billingPeriod}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Features list */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  {plan.features.map((feat, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Check size={14} style={{ color: isGoldCard ? GOLD_COLOR_TOKENS.main : '#10B981', marginTop: 3, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.74rem', color: 'text.primary', lineHeight: 1.4 }}>
                        {feat}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Action Button */}
              <Button
                variant={isCurrent ? 'outlined' : 'contained'}
                fullWidth
                size="medium"
                disabled={isCurrent}
                onClick={() => handleSelectPlan(plan.id, plan.name)}
                sx={{
                  py: 1.3,
                  px: 2,
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  letterSpacing: 0.2,
                  textTransform: 'none',
                  minHeight: 46,
                  bgcolor: isCurrent
                    ? 'transparent'
                    : isGoldCard
                    ? GOLD_COLOR_TOKENS.main
                    : 'var(--brand-primary, #355E52)',
                  color: isCurrent
                    ? 'text.secondary'
                    : '#FFFFFF',
                  borderColor: isCurrent ? 'divider' : 'transparent',
                  boxShadow: isCurrent ? 'none' : isGoldCard ? '0 4px 16px rgba(197, 160, 89, 0.4)' : '0 4px 14px rgba(53, 94, 82, 0.3)',
                  '&:hover': {
                    bgcolor: isCurrent ? 'transparent' : isGoldCard ? GOLD_COLOR_TOKENS.dark : 'var(--brand-primary-hover, #2A4E44)',
                    boxShadow: isCurrent ? 'none' : isGoldCard ? '0 6px 20px rgba(197, 160, 89, 0.5)' : '0 6px 18px rgba(53, 94, 82, 0.4)'
                  }
                }}
              >
                {isCurrent
                  ? 'Gói hiện tại'
                  : isGoldTrialing
                  ? 'Nâng cấp VIP Gold ngay'
                  : isGoldCard
                  ? (isGold ? 'Gia hạn gói VIP Gold' : 'Dùng thử 30 ngày (0đ)')
                  : 'Chọn gói này'}
              </Button>
            </Paper>
          );
        })}
      </Box>

      {/* 4. Full Feature Comparison Matrix */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: '10px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? '#161B22' : '#FFFFFF'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
          Bảng So Sánh Quyền Lợi Chi Tiết
        </Typography>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: isDark ? '#1A222D' : '#F1F5F9' }}>
              <TableRow sx={{ borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.16)' : '#CBD5E1' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: isDark ? '#E2E8F0' : '#334155', py: 1.2 }}>TÍNH NĂNG & ĐẶC QUYỀN</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: isDark ? '#E2E8F0' : '#334155', py: 1.2 }}>MIỄN PHÍ (FREE)</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#2563EB', py: 1.2 }}>TÍCH SẢN PRO</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: GOLD_COLOR_TOKENS.main, py: 1.2 }}>TÍCH SẢN VIP GOLD</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {featureMatrix.map((row, idx) => (
                <TableRow key={idx} hover sx={{ '& td': { py: 1, px: 1.5, borderBottom: '1px solid var(--border-subtle)', fontSize: '0.78rem' } }}>
                  <TableCell sx={{ fontWeight: 650, color: 'text.primary' }}>{row.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{row.free}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: isDark ? '#93C5FD' : '#1D4ED8' }}>{row.pro}</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: isDark ? GOLD_COLOR_TOKENS.light : GOLD_COLOR_TOKENS.badgeTextLight }}>{row.gold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 5. Subscription FAQs */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Câu Hỏi Thường Gặp Về Gói Cước & Dùng Thử 30 Ngày
        </Typography>

        <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Chính sách dùng thử 30 ngày hoạt động thế nào?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.76rem', lineHeight: 1.6 }}>
              Tất cả tài khoản đăng ký mới tại Tích Sản đều được tự động cấp quyền trải nghiệm 30 ngày đầy đủ mọi đặc quyền của Gói Gold VIP. Chúng tôi không yêu cầu thông tin thẻ ngân hàng và tuyệt đối không tự ý trừ tiền tài khoản của bạn.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Điều gì xảy ra khi thời hạn 30 ngày dùng thử kết thúc?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.76rem', lineHeight: 1.6 }}>
              Khi hết 30 ngày trial, tài khoản của bạn sẽ tự động chuyển về Gói Miễn Phí (Free). Toàn bộ dữ liệu tài chính, sổ ghi chép, danh mục đầu tư đã tạo trước đó được bảo toàn vĩnh viễn và không bị xóa bỏ. Bạn có thể tiếp tục xem và quản lý dữ liệu theo chính sách gói Free.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Tại sao Tích Sản không có chức năng nạp tiền số dư vào ví app?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.76rem', lineHeight: 1.6 }}>
              Tích Sản là ứng dụng quản lý tài chính cá nhân và bảo mật dữ liệu, không phải ví trung gian thanh toán. Chúng tôi không giữ tiền của người dùng để đảm bảo an toàn pháp lý và tránh mọi rủi ro tài chính cho khách hàng.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Payment Checkout Modal with PayOS & Legal Compliance Advisory Gate */}
      <PaymentCheckoutModal
        open={checkoutModal.open}
        onClose={() => setCheckoutModal(prev => ({ ...prev, open: false }))}
        planId={checkoutModal.planId}
        planName={checkoutModal.planName}
        amount={checkoutModal.amount}
        userEmail={user?.email || 'user@tichsan.vn'}
      />
    </Box>
  );
}

