/**
 * Finora Monetization & Subscription Entitlements Engine
 * Granular feature gating, tier limits, trial grace period, and upgrade requirements
 */

import type { User, PlanTier } from '../types';
import { isTrialActive } from './subscription';

export type PremiumFeature =
  | 'multi_currency'
  | 'vietqr_scanner'
  | 'tax_engine'
  | 'family_wallet'
  | 'import_wizard'
  | 'csv_export'
  | 'advanced_reports'
  | 'auto_recurring'
  | 'unlimited_accounts'
  | 'unlimited_nlp';

export interface TierEntitlement {
  tier: PlanTier;
  name: string;
  maxAccounts: number;
  maxBudgets: number;
  maxGoals: number;
  dailyNlpLimit: number;
  allowedFeatures: Set<PremiumFeature>;
}

export const TIER_ENTITLEMENTS: Record<PlanTier, TierEntitlement> = {
  free: {
    tier: 'free',
    name: 'Gói Miễn Phí',
    maxAccounts: 2,
    maxBudgets: 3,
    maxGoals: 1,
    dailyNlpLimit: 5,
    allowedFeatures: new Set(['import_wizard', 'vietqr_scanner']) // basic scanners allowed
  },
  pro: {
    tier: 'pro',
    name: 'Tích Sản Pro',
    maxAccounts: Infinity,
    maxBudgets: Infinity,
    maxGoals: Infinity,
    dailyNlpLimit: Infinity,
    allowedFeatures: new Set([
      'multi_currency',
      'vietqr_scanner',
      'import_wizard',
      'csv_export',
      'advanced_reports',
      'auto_recurring',
      'unlimited_accounts',
      'unlimited_nlp'
    ])
  },
  gold: {
    tier: 'gold',
    name: 'Tích Sản VIP Gold',
    maxAccounts: Infinity,
    maxBudgets: Infinity,
    maxGoals: Infinity,
    dailyNlpLimit: Infinity,
    allowedFeatures: new Set([
      'multi_currency',
      'vietqr_scanner',
      'tax_engine',
      'family_wallet',
      'import_wizard',
      'csv_export',
      'advanced_reports',
      'auto_recurring',
      'unlimited_accounts',
      'unlimited_nlp'
    ])
  }
};

/**
 * Determines effective tier of a user, taking active trials into account
 */
export function getEffectiveTier(user?: User | null): PlanTier {
  if (!user) return 'free';

  // If user has an active 30-day VIP Gold trial, treat them as 'gold'
  if (isTrialActive(user)) {
    return 'gold';
  }

  // If subscription status is expired or canceled, fallback to free
  if (user.subscription_status === 'expired' || user.subscription_status === 'canceled') {
    return 'free';
  }

  return user.plan || 'free';
}

/**
 * Checks whether user has access to a specific premium feature
 */
export function hasFeatureAccess(
  user: User | null | undefined,
  feature: PremiumFeature,
  context?: { currentAccountCount?: number }
): {
  allowed: boolean;
  effectiveTier: PlanTier;
  reason?: string;
  requiredPlan?: PlanTier;
} {
  const effectiveTier = getEffectiveTier(user);
  const entitlement = TIER_ENTITLEMENTS[effectiveTier];

  if (feature === 'unlimited_accounts') {
    const currentCount = context?.currentAccountCount || 0;
    if (currentCount >= entitlement.maxAccounts) {
      return {
        allowed: false,
        effectiveTier,
        requiredPlan: 'pro',
        reason: `Gói ${entitlement.name} chỉ cho phép tối đa ${entitlement.maxAccounts} tài khoản/ví. Vui lòng nâng cấp Pro để thêm không giới hạn.`
      };
    }
    return { allowed: true, effectiveTier };
  }

  if (entitlement.allowedFeatures.has(feature)) {
    return { allowed: true, effectiveTier };
  }

  // Feature is locked
  let requiredPlan: PlanTier = 'pro';
  if (feature === 'family_wallet' || feature === 'tax_engine') {
    requiredPlan = 'gold';
  }

  const featureNames: Record<PremiumFeature, string> = {
    multi_currency: 'Quy đổi Đa Tiền Tệ',
    vietqr_scanner: 'Quét & Nhận diện VietQR',
    tax_engine: 'Bảng Kế Hoạch & Quyết Toán Thuế TNCN',
    family_wallet: 'Ví Chung Gia Đình & Duo Finance',
    import_wizard: 'Nhập Dữ Liệu Tự Động',
    csv_export: 'Xuất Báo Cáo Excel / CSV',
    advanced_reports: 'Báo Cáo Phân Tích Chuyên Sâu',
    auto_recurring: 'Tự Động Hóa Giao Dịch Định Kỳ',
    unlimited_accounts: 'Thêm Tài Khoản Không Giới Hạn',
    unlimited_nlp: 'Nhập Giao Dịch Bằng Ngôn Ngữ Tự Nhiên Không Giới Hạn'
  };

  return {
    allowed: false,
    effectiveTier,
    requiredPlan,
    reason: `Tính năng "${featureNames[feature]}" yêu cầu gói ${requiredPlan === 'gold' ? 'VIP Gold' : 'Pro'}.`
  };
}

/**
 * Validates trial expiration and returns action instructions
 */
export function checkTrialStatus(user: User): {
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  bannerMessage?: string;
} {
  const hasTrialHistory = (user.subscription_status === 'trialing' || user.subscription_status === 'expired') && !!user.trial_ends_at;
  if (!hasTrialHistory) {
    return {
      isTrial: false,
      isExpired: false,
      daysRemaining: 0
    };
  }

  const now = Date.now();
  const endsAt = new Date(user.trial_ends_at!).getTime();
  const diffMs = endsAt - now;
  const isExpired = diffMs <= 0 || user.subscription_status === 'expired';
  const daysRemaining = isExpired ? 0 : Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (isExpired) {
    return {
      isTrial: true,
      isExpired: true,
      daysRemaining: 0,
      bannerMessage: 'Thời gian dùng thử VIP Gold 30 ngày đã kết thúc. Tài khoản đã tự động chuyển về gói Miễn phí mà không bị mất dữ liệu.'
    };
  }

  return {
    isTrial: true,
    isExpired: false,
    daysRemaining,
    bannerMessage: `Bạn đang trải nghiệm dùng thử VIP Gold (Còn ${daysRemaining} ngày).`
  };
}
