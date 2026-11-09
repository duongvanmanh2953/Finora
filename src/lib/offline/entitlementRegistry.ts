import type { PlanTier } from '../../types';

export type FeatureKey =
  | 'ai_webmcp'
  | 'auto_recurring'
  | 'advanced_gauges'
  | 'market_evaluation'
  | 'unlimited_accounts'
  | 'unlimited_budgets'
  | 'csv_export'
  | 'priority_support';

export interface EntitlementRule {
  key: FeatureKey;
  name: string;
  description: string;
  minimumTier: PlanTier;
  allowInOfflineMode: boolean;
}

export const ENTITLEMENT_RULES: Record<FeatureKey, EntitlementRule> = {
  ai_webmcp: {
    key: 'ai_webmcp',
    name: 'Trợ lý AI WebMCP 2 chiều',
    description: 'Tương tác thông minh đọc báo cáo và tạo giao dịch tự động qua MCP',
    minimumTier: 'gold',
    allowInOfflineMode: false // Requires live AI connection
  },
  auto_recurring: {
    key: 'auto_recurring',
    name: 'Tự động hóa giao dịch định kỳ',
    description: 'Tự động ghi nhận định kỳ hàng tháng/tuần',
    minimumTier: 'pro',
    allowInOfflineMode: true
  },
  advanced_gauges: {
    key: 'advanced_gauges',
    name: 'Speedometer Gauges & Chỉ số Nâng cao',
    description: 'Đo lường sức khỏe tài chính và tỷ lệ tiết kiệm nâng cao',
    minimumTier: 'gold',
    allowInOfflineMode: true
  },
  market_evaluation: {
    key: 'market_evaluation',
    name: 'Định giá danh mục tự động (Vàng, CP)',
    description: 'Cập nhật giá thị trường trực tiếp',
    minimumTier: 'pro',
    allowInOfflineMode: false // Requires network
  },
  unlimited_accounts: {
    key: 'unlimited_accounts',
    name: 'Không giới hạn tài khoản & thẻ tín dụng',
    description: 'Gói Free giới hạn 2 tài khoản',
    minimumTier: 'pro',
    allowInOfflineMode: true
  },
  unlimited_budgets: {
    key: 'unlimited_budgets',
    name: 'Không giới hạn ngân sách & mục tiêu',
    description: 'Gói Free giới hạn 3 ngân sách',
    minimumTier: 'pro',
    allowInOfflineMode: true
  },
  csv_export: {
    key: 'csv_export',
    name: 'Xuất dữ liệu Excel/CSV',
    description: 'Sao lưu và trích xuất dữ liệu tài chính toàn diện',
    minimumTier: 'pro',
    allowInOfflineMode: true
  },
  priority_support: {
    key: 'priority_support',
    name: 'Hỗ trợ kỹ thuật ưu tiên',
    description: 'Hỗ trợ giải đáp thắc mắc chuyên biệt',
    minimumTier: 'gold',
    allowInOfflineMode: false
  }
};

/**
 * Check if a feature is entitled for given user tier and online status
 */
export function isEntitled(
  tier: PlanTier,
  feature: FeatureKey,
  isOnline = true
): { allowed: boolean; reason?: string } {
  const rule = ENTITLEMENT_RULES[feature];
  if (!rule) return { allowed: false, reason: 'Tính năng không tồn tại' };

  if (!isOnline && !rule.allowInOfflineMode) {
    return {
      allowed: false,
      reason: `${rule.name} yêu cầu kết nối mạng trực tuyến để xử lý dữ liệu.`
    };
  }

  const tierRank: Record<PlanTier, number> = {
    free: 0,
    pro: 1,
    gold: 2
  };

  const userRank = tierRank[tier] ?? 0;
  const requiredRank = tierRank[rule.minimumTier] ?? 0;

  if (userRank < requiredRank) {
    return {
      allowed: false,
      reason: `Tính năng ${rule.name} yêu cầu gói ${rule.minimumTier.toUpperCase()}. Dữ liệu của bạn luôn được bảo toàn trọn vẹn.`
    };
  }

  return { allowed: true };
}
