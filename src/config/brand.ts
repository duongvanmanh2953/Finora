/**
 * TÍCH SẢN — Single Source of Truth for Brand Identity & Metadata
 */
export const BRAND = {
  name: 'Tích Sản',
  legalName: 'Tích Sản Platform',
  shortName: 'Tích Sản',
  appName: 'Tích Sản',
  tagline: 'Quản lý tài chính & Tích lũy tài sản cá nhân thông minh',
  description: 'Tích Sản – Nền tảng quản lý tài chính, phân bổ dòng tiền và tích lũy tài sản cá nhân bảo mật, minh bạch và bền vững.',
  domain: 'tichsan.vn',
  supportEmail: 'hotro@tichsan.vn',
  complianceEmail: 'phaply@tichsan.vn',
  copyright: `© ${new Date().getFullYear()} Tích Sản Platform. Bản quyền được bảo hộ.`,
  version: '2.0.0',

  // Gold Identity Tokens
  gold: {
    badgeBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.18) 100%)',
    badgeBorder: 'rgba(217, 119, 6, 0.35)',
    text: '#B45309',
    accent: '#D97706',
    hover: '#B45309',
    glow: '0 0 16px rgba(245, 158, 11, 0.25)'
  },

  // Advisory notices
  legalAdvisory:
    'Tính năng thanh toán trực tuyến hiện chưa được mở. Tích Sản đang hoàn thiện các điều kiện pháp lý, thuế và hóa đơn liên quan trước khi triển khai. Bạn chưa phát sinh khoản thanh toán nào.',

  welcomeGiftMessage:
    'Tích Sản gửi tặng bạn 01 tháng trải nghiệm VIP Gold miễn phí. Khám phá toàn bộ tính năng cao cấp và nâng cao khả năng quản lý tài chính của bạn.'
} as const;

