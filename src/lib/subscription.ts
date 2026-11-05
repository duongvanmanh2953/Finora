import type { FinanceData, User, PlanTier } from '../types';
import { todayKey } from './finance';

export const PRO_LIMITS = {
  free: {
    accounts: 2,
    budgets: 3,
    goals: 1,
    quickTemplates: 3,
    nlpPerDay: 5,
    allowAllReports: false,
    allowAutoRecurring: false,
    allowCsvExport: false,
    allowWebMCP: false
  },
  pro: {
    accounts: Infinity,
    budgets: Infinity,
    goals: Infinity,
    quickTemplates: Infinity,
    nlpPerDay: Infinity,
    allowAllReports: true,
    allowAutoRecurring: true,
    allowCsvExport: true,
    allowWebMCP: true
  },
  gold: {
    accounts: Infinity,
    budgets: Infinity,
    goals: Infinity,
    quickTemplates: Infinity,
    nlpPerDay: Infinity,
    allowAllReports: true,
    allowAutoRecurring: true,
    allowCsvExport: true,
    allowWebMCP: true,
    vipPriority: true,
    customPortfolioValuation: true
  }
} as const;

/**
 * Distinct Champagne Gold Tokens (Separate from normal warning amber / status colors)
 */
export const GOLD_COLOR_TOKENS = {
  main: '#C5A059',
  light: '#DFBA73',
  dark: '#9E7D3B',
  bgLight: '#FFFDF5',
  bgDark: '#231B0F',
  borderLight: '#E8D5A3',
  borderDark: '#5E4B28',
  badgeTextLight: '#7A5C1E',
  badgeTextDark: '#FDE68A',
  gradient: 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)',
  goldMetallic: '#C5A059',
  goldLight: '#DFBA73',
  goldBorder: '#E8D5A3',
  goldGlow: 'rgba(197, 160, 89, 0.25)'
};

export interface PlanDefinition {
  id: string;
  tier: PlanTier;
  name: string;
  price: number;
  originalPrice?: number;
  billingPeriod: string;
  badge?: string;
  popular?: boolean;
  isGold?: boolean;
  features: string[];
  limitations?: string[];
}

export const SYSTEM_PLANS: PlanDefinition[] = [
  {
    id: 'plan-free',
    tier: 'free',
    name: 'Gói Miễn Phí (Free)',
    price: 0,
    billingPeriod: 'Trọn đời',
    badge: 'Cơ bản',
    features: [
      'Quản lý tối đa 2 tài khoản/ví',
      'Thiết lập tối đa 3 ngân sách chi tiêu',
      '1 mục tiêu tài chính',
      'Ghi chép giao dịch thủ công',
      'Báo cáo dòng tiền tháng hiện tại'
    ],
    limitations: [
      'Không hỗ trợ định giá chứng khoán/vàng tự động',
      'Không hỗ trợ xuất file Excel/CSV',
      'Không hỗ trợ tự động chạy định kỳ'
    ]
  },
  {
    id: 'plan-trial',
    tier: 'gold',
    name: 'Dùng Thử VIP Gold (30 Ngày)',
    price: 0,
    originalPrice: 149000,
    billingPeriod: '30 ngày trải nghiệm',
    badge: 'Khuyến nghị cho bạn mới',
    isGold: true,
    popular: true,
    features: [
      'Tự động cấp ngay khi đăng ký thành công',
      'Mở khóa toàn bộ đặc quyền Gói Gold',
      'Định giá danh mục đầu tư VN (HOSE, Vàng, Tiết kiệm)',
      'WebMCP AI Assistant tương tác 2 chiều',
      'Không yêu cầu thẻ thanh toán, không tự động gia hạn trừ tiền'
    ]
  },
  {
    id: 'plan-pro-annual',
    tier: 'pro',
    name: 'Tích Sản Pro (Năm)',
    price: 599000,
    originalPrice: 1188000,
    billingPeriod: '49.900 ₫/tháng (599.000 ₫/năm)',
    badge: 'Tiết kiệm 50%',
    features: [
      'Không giới hạn số lượng tài khoản & thẻ tín dụng',
      'Không giới hạn ngân sách & mục tiêu tiết kiệm',
      'Định giá danh mục đầu tư thị trường',
      'Tự động hóa giao dịch định kỳ (Auto-recurring)',
      'Xuất báo cáo tài chính PDF & Excel/CSV',
      'Hỗ trợ kỹ thuật ưu tiên'
    ]
  },
  {
    id: 'plan-gold-annual',
    tier: 'gold',
    name: 'Tích Sản VIP Gold (Năm)',
    price: 999000,
    originalPrice: 1788000,
    billingPeriod: '83.250 ₫/tháng (999.000 ₫/năm)',
    badge: 'Đặc quyền Tinh hoa',
    isGold: true,
    features: [
      'Toàn bộ đặc quyền Tích Sản Pro',
      'Hệ thống AI Context WebMCP độc quyền phân tích dòng tiền',
      'Smart Ledger theo dõi vốn đầu tư chưa thu hồi',
      'Speedometer Gauges đo lường sức khỏe tài chính nâng cao',
      'Huy hiệu thành viên Champagne Gold độc quyền',
      'Ưu tiên kết nối trực tiếp với chuyên gia tài chính Tích Sản'
    ]
  }
];

// Compatibility for legacy PLAN_OPTIONS
export interface PlanOption {
  id: 'month' | 'year' | 'lifetime';
  name: string;
  price: number;
  originalPrice?: number;
  billing: string;
  badge?: string;
  popular?: boolean;
}

export const PLAN_OPTIONS: PlanOption[] = [
  {
    id: 'month',
    name: 'Gói Pro Tháng',
    price: 99000,
    billing: '99.000 ₫ / tháng',
    badge: 'Linh hoạt'
  },
  {
    id: 'year',
    name: 'Gói Pro Năm',
    price: 599000,
    originalPrice: 1188000,
    billing: '49.900 ₫ / tháng (599.000 ₫/năm)',
    badge: 'Tiết kiệm 50%',
    popular: true
  },
  {
    id: 'lifetime',
    name: 'Gói Gold Trọn Đời',
    price: 1499000,
    billing: 'Thanh toán một lần duy nhất',
    badge: 'VIP Gold Lifetime'
  }
];

/**
 * Check if user is on active 30-day trial
 */
export function isTrialActive(user?: User | null): boolean {
  if (!user || user.subscription_status !== 'trialing') return false;
  if (!user.trial_ends_at) return false;
  const endsAt = new Date(user.trial_ends_at).getTime();
  return endsAt > Date.now();
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(user?: User | null): number {
  if (!user || !user.trial_ends_at) return 0;
  const endsAt = new Date(user.trial_ends_at).getTime();
  const diff = endsAt - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if user is Pro or Gold or active trial
 */
export function isProUser(data: FinanceData): boolean {
  if (isTrialActive(data.user)) return true;
  return data.user.plan === 'pro' || data.user.plan === 'gold';
}

/**
 * Check if user has Gold tier
 */
export function isGoldUser(data: FinanceData): boolean {
  if (isTrialActive(data.user) && data.user.plan === 'gold') return true;
  return data.user.plan === 'gold';
}

export function canAddAccount(data: FinanceData): boolean {
  if (isProUser(data)) return true;
  return data.accounts.length < PRO_LIMITS.free.accounts;
}

export function canAddBudget(data: FinanceData): boolean {
  if (isProUser(data)) return true;
  return data.budgets.length < PRO_LIMITS.free.budgets;
}

export function canAddGoal(data: FinanceData): boolean {
  if (isProUser(data)) return true;
  return data.goals.length < PRO_LIMITS.free.goals;
}

export function canAddQuickTemplate(data: FinanceData): boolean {
  if (isProUser(data)) return true;
  return (data.quickTemplates?.length || 0) < PRO_LIMITS.free.quickTemplates;
}

export function checkNlpUsage(data: FinanceData): { allowed: boolean; remaining: number } {
  if (isProUser(data)) return { allowed: true, remaining: Infinity };

  const today = todayKey();
  const usage = data.user.nlpUsageToday;
  const count = usage && usage.date === today ? usage.count : 0;
  const limit = PRO_LIMITS.free.nlpPerDay;
  const remaining = Math.max(0, limit - count);

  return {
    allowed: count < limit,
    remaining
  };
}

export function canUsePeriodInReport(data: FinanceData, period: string): boolean {
  if (isProUser(data)) return true;
  return period === 'month';
}

export function canAutoExecuteRecurring(data: FinanceData): boolean {
  return isProUser(data);
}
