import React from 'react';
import {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Film,
  CircleDollarSign,
  TrendingUp,
  Briefcase,
  Layers,
  ArrowRightLeft,
  Receipt,
  ShieldCheck,
  Sparkles,
  Plane,
  GraduationCap,
  Heart,
  Building2
} from 'lucide-react';
import { Box } from '@mui/material';

// ==========================================
// 1. BESPOKE VECTOR BRANDMARKS (SVGs)
// ==========================================

export const BankBrandVector: Record<string, (dim: number) => React.ReactNode> = {
  // Vietcombank: Deep emerald shield with golden lotus petal
  vcb: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="vcb-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#005A36" />
          <stop offset="1" stopColor="#00351F" />
        </linearGradient>
        <linearGradient id="vcb-gold" x1="14" y1="12" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9BD871" />
          <stop offset="0.5" stopColor="#68B936" />
          <stop offset="1" stopColor="#3B8E12" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#vcb-bg)" />
      <path
        d="M24 10C16.8 10 11 15.8 11 23C11 29.5 15.8 34.8 22.2 35.8C20.5 33.5 19.5 30.6 19.5 27.5C19.5 20.8 24 16.5 29.5 15C28 11.9 26.2 10 24 10Z"
        fill="url(#vcb-gold)"
      />
      <path
        d="M37 24C37 31.2 31.2 37 24 37C21.8 37 19.8 36.4 18 35.5C21.5 35 24.5 33 26.5 30C29.5 25.5 28.5 19.5 26 16C32.5 17.5 37 20.2 37 24Z"
        fill="#9BD871"
        fillOpacity="0.85"
      />
    </svg>
  ),

  // Techcombank: Red square with dual interlocking chevrons
  tcb: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="tcb-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E01A22" />
          <stop offset="1" stopColor="#B30F15" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#tcb-bg)" />
      <path
        d="M17 14L24 21L31 14H37L27 24L37 34H31L24 27L17 34H11L21 24L11 14H17Z"
        fill="#FFFFFF"
      />
      <rect x="22" y="22" width="4" height="4" fill="#E01A22" />
    </svg>
  ),

  // MBBank: Royal navy with dynamic red & blue starburst
  mb: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#002D72" />
      <path d="M12 24L20 14L28 24L20 34L12 24Z" fill="#E01A22" />
      <path d="M28 24L36 14L44 24L36 34L28 24Z" fill="#00A3E0" />
      <circle cx="28" cy="24" r="5" fill="#FFFFFF" />
    </svg>
  ),

  // VPBank: Emerald white with stylized lotus petals in green & red
  vpb: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#0A1E14" />
      <path d="M24 10C24 10 28 16 28 22C28 26 25 28 24 28C23 28 20 26 20 22C20 16 24 10 24 10Z" fill="#00B04F" />
      <path d="M24 28C24 28 30 29 34 26C38 23 38 18 38 18C38 18 35 23 29 24C26 24.5 24 28 24 28Z" fill="#00B04F" />
      <path d="M24 28C24 28 18 29 14 26C10 23 10 18 10 18C10 18 13 23 19 24C22 24.5 24 28 24 28Z" fill="#E01A22" />
    </svg>
  ),

  // ACB: Crisp Azure Blue with bold wave circle
  acb: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#00529C" />
      <circle cx="24" cy="24" r="14" stroke="#FFFFFF" strokeWidth="4" />
      <circle cx="24" cy="24" r="6" fill="#00A3E0" />
      <circle cx="31" cy="17" r="3" fill="#FFFFFF" />
    </svg>
  ),

  // VietinBank: Corporate blue with red sun-coin
  ctg: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#003B70" />
      <circle cx="24" cy="24" r="13" fill="#ED1C24" />
      <path d="M19 19H29V29H19Z" fill="#003B70" />
      <circle cx="24" cy="24" r="3" fill="#ED1C24" />
    </svg>
  ),

  // BIDV: Deep emerald with golden diamond star
  bidv: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#00693E" />
      <path d="M24 12L34 24L24 36L14 24L24 12Z" fill="#F8B133" />
      <path d="M24 18L29 24L24 30L19 24L24 18Z" fill="#00693E" />
    </svg>
  ),

  // TPBank: Purple with dynamic orange origami triangle
  tpb: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#582C83" />
      <path d="M24 12L36 32H12L24 12Z" fill="#F37021" />
      <path d="M24 18L32 32H24V18Z" fill="#FBBA15" />
    </svg>
  ),

  // Sacombank: Navy blue with gold dynamic compass curve
  stb: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#003A70" />
      <path d="M14 34C14 23 23 14 34 14V20C26.3 20 20 26.3 20 34H14Z" fill="#D4AF37" />
      <circle cx="30" cy="30" r="4" fill="#FFFFFF" />
    </svg>
  ),

  // MoMo: Glossy Magenta with double-M circle
  momo: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="momo-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D82D8B" />
          <stop offset="1" stopColor="#A50064" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#momo-bg)" />
      <circle cx="18" cy="24" r="7" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="30" cy="24" r="7" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="18" cy="24" r="2.5" fill="#FFFFFF" />
      <circle cx="30" cy="24" r="2.5" fill="#FFFFFF" />
    </svg>
  ),

  // ZaloPay: Blue with vibrant electric bolt
  zalopay: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#0068FF" />
      <path d="M26 11L15 26H23L21 37L33 22H25L26 11Z" fill="#00D26A" />
      <path d="M26 11L19 25H25L24 33L32 21H26L26 11Z" fill="#FFFFFF" />
    </svg>
  ),

  // VNPay: Dual red-blue QR shield
  vnpay: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <path d="M12 12H24V24H12V12Z" fill="#ED1C24" rx="3" />
      <path d="M24 24H36V36H24V24Z" fill="#005BAA" rx="3" />
      <circle cx="30" cy="18" r="4" fill="#005BAA" />
      <circle cx="18" cy="30" r="4" fill="#ED1C24" />
    </svg>
  )
};

// ==========================================
// 2. FINANCIAL FUND & ACCOUNT TYPE BADGES
// ==========================================

export const FundBrandVector: Record<string, (dim: number) => React.ReactNode> = {
  // Main Checking Account (Tài khoản chính thanh toán)
  main_account: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="main-acc-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#15803D" />
          <stop offset="1" stopColor="#0B4620" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#main-acc-bg)" />
      {/* Landmark pillars & crown */}
      <path d="M12 20H36V22H12V20Z" fill="#FDE047" />
      <path d="M24 12L12 19H36L24 12Z" fill="#FEF08A" />
      <rect x="15" y="23" width="3.5" height="11" rx="1" fill="#FFFFFF" />
      <rect x="22.25" y="23" width="3.5" height="11" rx="1" fill="#FFFFFF" />
      <rect x="29.5" y="23" width="3.5" height="11" rx="1" fill="#FFFFFF" />
      <rect x="10" y="34" width="28" height="3" rx="1.5" fill="#FDE047" />
    </svg>
  ),

  // Savings / Emergency Vault (Quỹ tiết kiệm & Dự phòng)
  savings: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sav-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D97706" />
          <stop offset="1" stopColor="#78350F" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#sav-bg)" />
      {/* Heavy 3D Vault Door */}
      <rect x="11" y="11" width="26" height="26" rx="6" fill="#FDE68A" />
      <circle cx="24" cy="24" r="8" fill="#B45309" />
      <circle cx="24" cy="24" r="5" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="24" cy="24" r="2.5" fill="#FDE68A" />
      <rect x="14" y="22.5" width="4" height="3" rx="1" fill="#78350F" />
    </svg>
  ),

  // Investment Fund / Securities (Quỹ đầu tư sinh lời)
  investment: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="inv-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F766E" />
          <stop offset="1" stopColor="#042F2E" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#inv-bg)" />
      {/* Dynamic growth bars & momentum arrow */}
      <rect x="12" y="28" width="5" height="8" rx="1.5" fill="#5EEAD4" />
      <rect x="20" y="22" width="5" height="14" rx="1.5" fill="#2DD4BF" />
      <rect x="28" y="16" width="5" height="20" rx="1.5" fill="#14B8A6" />
      <path d="M14 22L23 15L29 19L36 12" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 12H36V18" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // Credit Card / BNPL (Thẻ tín dụng / Trả góp)
  credit_card: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="card-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#090D16" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#card-bg)" stroke="#334155" strokeWidth="1" />
      <rect x="9" y="14" width="30" height="20" rx="4" fill="#334155" />
      <rect x="9" y="18" width="30" height="4" fill="#0F172A" />
      <rect x="13" y="25" width="6" height="5" rx="1.5" fill="#FBBF24" />
      <circle cx="31" cy="27" r="3" fill="#EF4444" fillOpacity="0.85" />
      <circle cx="34" cy="27" r="3" fill="#F59E0B" fillOpacity="0.85" />
    </svg>
  ),

  // Physical Cash Wallet (Ví tiền mặt)
  cash: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="cash-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16A34A" />
          <stop offset="1" stopColor="#14532D" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#cash-bg)" />
      <rect x="10" y="15" width="28" height="18" rx="3" fill="#DCFCE7" />
      <circle cx="24" cy="24" r="5" stroke="#16A34A" strokeWidth="2.5" />
      <circle cx="14" cy="24" r="1.5" fill="#16A34A" />
      <circle cx="34" cy="24" r="1.5" fill="#16A34A" />
    </svg>
  ),

  // Family Shared Fund (Quỹ chi tiêu chung gia đình)
  shared: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="shared-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#312E81" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#shared-bg)" />
      <circle cx="20" cy="19" r="4.5" fill="#C7D2FE" />
      <circle cx="29" cy="21" r="3.5" fill="#A5B4FC" />
      <path d="M12 33C12 28.5 15.5 26 20 26C24.5 26 28 28.5 28 33" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 32C28 29 30 27.5 33 27.5C36 27.5 38 29 38 32" stroke="#C7D2FE" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  // Financial Freedom / FIRE (Quỹ tự do tài chính)
  freedom: (dim: number) => (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="free-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#free-bg)" />
      {/* Golden Crown of Independence */}
      <path d="M13 32L15 18L21 24L24 14L27 24L33 18L35 32H13Z" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="15" cy="17" r="1.5" fill="#FFFFFF" />
      <circle cx="24" cy="13" r="2" fill="#FFFFFF" />
      <circle cx="33" cy="17" r="1.5" fill="#FFFFFF" />
      <rect x="13" y="32" width="22" height="3" rx="1" fill="#FFFFFF" />
    </svg>
  )
};

// ==========================================
// 3. MAIN COMPONENT: BankLogoBadge
// ==========================================

export function BankLogoBadge({
  accountName = '',
  accountType = 'bank',
  size = 'large'
}: {
  accountName?: string;
  accountType?: string;
  size?: 'small' | 'medium' | 'large';
}) {
  const lower = accountName.toLowerCase();
  const dim = size === 'large' ? 48 : size === 'medium' ? 36 : 24;

  // 1. Check for Top Vietnamese Banks & Wallets
  if (lower.includes('vcb') || lower.includes('vietcombank')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.vcb(dim)}</Box>;
  }
  if (lower.includes('tcb') || lower.includes('techcombank') || lower.includes('techcom')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.tcb(dim)}</Box>;
  }
  if (lower.includes('mb') || lower.includes('mbbank') || lower.includes('quân đội')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.mb(dim)}</Box>;
  }
  if (lower.includes('vpb') || lower.includes('vpbank') || lower.includes('việt nam thịnh vượng')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.vpb(dim)}</Box>;
  }
  if (lower.includes('acb') || lower.includes('á châu')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.acb(dim)}</Box>;
  }
  if (lower.includes('vietin') || lower.includes('ctg') || lower.includes('vietinbank')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.ctg(dim)}</Box>;
  }
  if (lower.includes('bidv') || lower.includes('đầu tư và phát triển')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.bidv(dim)}</Box>;
  }
  if (lower.includes('tpb') || lower.includes('tpbank') || lower.includes('tiên phong')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.tpb(dim)}</Box>;
  }
  if (lower.includes('sacombank') || lower.includes('stb') || lower.includes('sài gòn thương tín')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.stb(dim)}</Box>;
  }
  if (lower.includes('momo')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.momo(dim)}</Box>;
  }
  if (lower.includes('zalo') || lower.includes('zalopay')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.zalopay(dim)}</Box>;
  }
  if (lower.includes('vnpay')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{BankBrandVector.vnpay(dim)}</Box>;
  }

  // 2. Check for Account / Fund Types
  if (accountType === 'credit_card' || lower.includes('credit') || lower.includes('tín dụng') || lower.includes('thẻ')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{FundBrandVector.credit_card(dim)}</Box>;
  }
  if (accountType === 'cash' || lower.includes('tiền mặt') || lower.includes('ví')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{FundBrandVector.cash(dim)}</Box>;
  }
  if (accountType === 'investment' || lower.includes('đầu tư') || lower.includes('chứng khoán') || lower.includes('cổ phiếu')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{FundBrandVector.investment(dim)}</Box>;
  }
  if (accountType === 'savings' || lower.includes('tiết kiệm') || lower.includes('tích lũy') || lower.includes('heo đất')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{FundBrandVector.savings(dim)}</Box>;
  }
  if (lower.includes('chung') || lower.includes('gia đình') || lower.includes('shared')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{FundBrandVector.shared(dim)}</Box>;
  }
  if (lower.includes('tự do') || lower.includes('freedom') || lower.includes('fire')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{FundBrandVector.freedom(dim)}</Box>;
  }

  // Default Main Account
  return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{FundBrandVector.main_account(dim)}</Box>;
}

// ==========================================
// 4. FUND & GOAL LOGO BADGE (Các Quỹ & Mục tiêu)
// ==========================================

export function FundLogoBadge({
  name = '',
  kind,
  size = 'large'
}: {
  name?: string;
  kind?: string;
  size?: 'small' | 'medium' | 'large';
}) {
  const text = `${name} ${kind || ''}`.toLowerCase();
  const dim = size === 'large' ? 48 : size === 'medium' ? 36 : 24;

  if (text.includes('khẩn cấp') || text.includes('dự phòng') || text.includes('shield') || text.includes('an toàn')) {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
          color: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
          flexShrink: 0
        }}
      >
        <ShieldCheck size={dim * 0.52} />
      </Box>
    );
  }

  if (text.includes('nhà') || text.includes('xe') || text.includes('laptop') || text.includes('macbook') || text.includes('mua sắm')) {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
          color: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
          flexShrink: 0
        }}
      >
        <Building2 size={dim * 0.52} />
      </Box>
    );
  }

  if (text.includes('du lịch') || text.includes('nghỉ dưỡng') || text.includes('plane') || text.includes('bay')) {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
          color: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
          flexShrink: 0
        }}
      >
        <Plane size={dim * 0.52} />
      </Box>
    );
  }

  if (text.includes('giáo dục') || text.includes('học') || text.includes('sách') || text.includes('educ')) {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0891B2 0%, #155E75 100%)',
          color: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(8, 145, 178, 0.3)',
          flexShrink: 0
        }}
      >
        <GraduationCap size={dim * 0.52} />
      </Box>
    );
  }

  if (text.includes('hưởng thụ') || text.includes('thưởng') || text.includes('play') || text.includes('giải trí')) {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
          color: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(244, 63, 94, 0.3)',
          flexShrink: 0
        }}
      >
        <Sparkles size={dim * 0.52} />
      </Box>
    );
  }

  if (text.includes('thiện nguyện') || text.includes('cho đi') || text.includes('give') || text.includes('từ thiện')) {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #EC4899 0%, #9D174D 100%)',
          color: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
          flexShrink: 0
        }}
      >
        <Heart size={dim * 0.52} />
      </Box>
    );
  }

  if (text.includes('tự do') || text.includes('hưu trí') || text.includes('ffa') || text.includes('fire')) {
    return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{FundBrandVector.freedom(dim)}</Box>;
  }

  // Default Savings Piggy
  return <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>{FundBrandVector.savings(dim)}</Box>;
}

// ==========================================
// 5. DEBT & ASSET LOGO BADGES
// ==========================================

export function DebtLogoBadge({
  debtName = '',
  lenderName = '',
  size = 'large'
}: {
  debtName?: string;
  lenderName?: string;
  size?: 'small' | 'medium' | 'large';
}) {
  const text = `${debtName} ${lenderName}`.toLowerCase();
  const dim = size === 'large' ? 48 : size === 'medium' ? 36 : 24;

  if (text.includes('vcb') || text.includes('vietcombank')) return <>{BankBrandVector.vcb(dim)}</>;
  if (text.includes('tcb') || text.includes('techcom')) return <>{BankBrandVector.tcb(dim)}</>;
  if (text.includes('mb') || text.includes('mbbank')) return <>{BankBrandVector.mb(dim)}</>;
  if (text.includes('vpb') || text.includes('vpbank')) return <>{BankBrandVector.vpb(dim)}</>;
  if (text.includes('fe credit') || text.includes('fecredit')) {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#00A859',
          color: '#FFFFFF',
          fontWeight: 900,
          fontSize: dim * 0.28,
          flexShrink: 0
        }}
      >
        FE
      </Box>
    );
  }
  if (text.includes('home credit') || text.includes('homecredit')) {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#EE2E24',
          color: '#FFFFFF',
          fontWeight: 900,
          fontSize: dim * 0.24,
          flexShrink: 0
        }}
      >
        HOME
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        width: dim,
        height: dim,
        borderRadius: 3,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(214, 91, 88, 0.12)',
        color: 'var(--accent-expense)',
        flexShrink: 0
      }}
    >
      <Receipt size={dim * 0.5} />
    </Box>
  );
}

export function AssetLogoBadge({
  symbol = '',
  assetClass = '',
  size = 'large'
}: {
  symbol?: string;
  assetClass?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
}) {
  const sym = symbol.toUpperCase().trim();
  const dim = size === 'large' ? 48 : size === 'medium' ? 36 : 24;

  if (assetClass === 'gold' || sym.includes('GOLD') || sym.includes('SJC') || sym.includes('VÀNG')) {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          color: '#FFFFFF',
          fontWeight: 900,
          fontSize: dim * 0.28,
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
          flexShrink: 0
        }}
      >
        SJC
      </Box>
    );
  }

  if (sym === 'BTC') {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#F7931A',
          color: '#FFFFFF',
          fontWeight: 900,
          fontSize: dim * 0.38,
          flexShrink: 0
        }}
      >
        ₿
      </Box>
    );
  }
  if (sym === 'ETH') {
    return (
      <Box
        component="span"
        sx={{
          width: dim,
          height: dim,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#627EEA',
          color: '#FFFFFF',
          fontWeight: 900,
          fontSize: dim * 0.38,
          flexShrink: 0
        }}
      >
        Ξ
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        width: dim,
        height: dim,
        borderRadius: 3,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
        color: '#5EEAD4',
        fontWeight: 800,
        fontSize: dim * 0.28,
        flexShrink: 0
      }}
    >
      {sym.slice(0, 3) || 'CP'}
    </Box>
  );
}

// ==========================================
// 6. CATEGORY BADGES
// ==========================================

export function CategoryAvatarBadge({
  categoryId = '',
  categoryName = '',
  txType = 'expense'
}: {
  categoryId?: string;
  categoryName?: string;
  txType?: string;
}) {
  if (txType === 'transfer') {
    return (
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(78, 123, 197, 0.12)',
          color: '#4E7BC5',
          flexShrink: 0
        }}
        title="Chuyển khoản nội bộ"
      >
        <ArrowRightLeft size={16} />
      </Box>
    );
  }

  const id = categoryId.toLowerCase();
  const name = categoryName.toLowerCase();

  let icon = <Layers size={16} />;
  let bg = 'rgba(100, 116, 139, 0.12)';
  let color = '#475569';

  if (id.includes('food') || name.includes('ăn') || name.includes('uống') || name.includes('cafe')) {
    icon = <Utensils size={16} />;
    bg = 'rgba(249, 115, 22, 0.12)';
    color = '#ea580c';
  } else if (id.includes('transport') || name.includes('xe') || name.includes('xăng') || name.includes('grab')) {
    icon = <Car size={16} />;
    bg = 'rgba(14, 165, 233, 0.12)';
    color = '#0284c7';
  } else if (id.includes('house') || name.includes('nhà') || name.includes('điện') || name.includes('nước')) {
    icon = <Home size={16} />;
    bg = 'rgba(15, 118, 110, 0.12)';
    color = '#0f766e';
  } else if (id.includes('shopping') || name.includes('mua sắm') || name.includes('quần áo')) {
    icon = <ShoppingBag size={16} />;
    bg = 'rgba(236, 72, 153, 0.12)';
    color = '#db2777';
  } else if (id.includes('entertainment') || name.includes('giải trí') || name.includes('phim') || name.includes('game')) {
    icon = <Film size={16} />;
    bg = 'rgba(245, 158, 11, 0.12)';
    color = '#b45309';
  } else if (id.includes('salary') || name.includes('lương') || name.includes('thưởng') || name.includes('thu nhập')) {
    icon = <CircleDollarSign size={16} />;
    bg = 'rgba(21, 150, 107, 0.14)';
    color = '#15966B';
  } else if (id.includes('invest') || name.includes('đầu tư') || name.includes('cổ phiếu') || name.includes('vàng')) {
    icon = <TrendingUp size={16} />;
    bg = 'rgba(13, 148, 136, 0.12)';
    color = '#0f766e';
  } else if (id.includes('business') || name.includes('kinh doanh') || name.includes('bán lẻ')) {
    icon = <Briefcase size={16} />;
    bg = 'rgba(37, 99, 235, 0.12)';
    color = '#1d4ed8';
  }

  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: bg,
        color: color,
        flexShrink: 0
      }}
      title={categoryName || 'Danh mục'}
    >
      {icon}
    </Box>
  );
}
