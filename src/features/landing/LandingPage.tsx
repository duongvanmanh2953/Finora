import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockFinanceService } from '../../services/financeService';
import { navigateToAuth, navigateToApp } from '../../lib/domainRouting';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  LayoutDashboard,
  ShieldCheck,
  Crown,
  Sparkles,
  Lock,
  Bot,
  Zap,
  CheckCircle2,
  ChevronDown,
  Activity,
  EyeOff,
  Check,
  TrendingUp,
  PieChart,
  BellRing,
  Smartphone,
  Quote,
  Star,
  Users,
  Menu,
  X,
  DownloadCloud,
  QrCode,
  HelpCircle,
  Share,
  ExternalLink
} from 'lucide-react';
import {
  Box,
  Button,
  Typography,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  Drawer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery
} from '@mui/material';
import { SemiCircleGauge } from '../../components/gauges/SemiCircleGauge';
import { GOLD_COLOR_TOKENS } from '../../lib/subscription';
import { TierBadgeIcon } from '../../components/subscription/TierBadgeIcon';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Crisp Vector SVG Components for Android and Apple iOS
export function AndroidSvgIcon({ size = 20, color = 'currentColor', className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
    </svg>
  );
}

export function AppleSvgIcon({ size = 20, color = 'currentColor', className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// 7 Financial Overview Cards showcase with "Tím Trần" for Assets
const DEMO_CARDS = [
  {
    title: 'Tổng Tài Sản Thực Tế',
    value: '542.800.000 ₫',
    sub: '+14.8% (Tím trần danh mục)',
    color: '#7C3AED', // Tím trần
    bg: '#FAF5FF',
    border: '#DDD6FE',
    badge: '4 Tài khoản & Ví'
  },
  {
    title: 'Tổng Thu Nhập Tháng',
    value: '45.000.000 ₫',
    sub: 'Trung bình 1.500.000 ₫/ngày',
    color: '#047857',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    badge: 'Hoàn thành 100%'
  },
  {
    title: 'Tổng Chi Tiêu Đã Chi',
    value: '18.250.000 ₫',
    sub: 'Chiếm 40.5% tổng thu',
    color: '#B91C1C',
    bg: '#FEF2F2',
    border: '#FECACA',
    badge: '36 Giao dịch'
  },
  {
    title: 'Dòng Tiền Thuần (Net)',
    value: '+26.750.000 ₫',
    sub: 'Thặng dư ngân sách an toàn',
    color: '#0F766E',
    bg: '#F0FDFA',
    border: '#99F6E4',
    badge: 'Dương +59.5%'
  },
  {
    title: 'Tích Lũy Tiết Kiệm',
    value: '15.000.000 ₫',
    sub: 'Đạt 75% mục tiêu mua nhà',
    color: '#4F46E5',
    bg: '#F5F3FF',
    border: '#C7D2FE',
    badge: 'Tỷ lệ 33.3%'
  },
  {
    title: 'Ngân Sách Kiểm Soát',
    value: '67.8%',
    sub: 'Còn lại 8.750.000 ₫ hạn mức',
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    badge: '0/8 Hạng mục vượt'
  },
  {
    title: 'Nghĩa Vụ Nợ & Thẻ Tín Dụng',
    value: '3.200.000 ₫',
    sub: 'Kỳ thanh toán kế tiếp: 15/11',
    color: '#C2410C',
    bg: '#FFF7ED',
    border: '#FFEDD5',
    badge: 'Tỷ lệ nợ 0.59%'
  }
];

// Solutions matrix designed specifically for quick scanning
const LAZY_USER_SOLUTIONS = [
  {
    problem: 'Lười nhập từng cốc cafe, bát phở mỗi ngày',
    solution: 'WebMCP AI & Quét tin nhắn VietQR tự động ghi sổ trong 1 giây',
    tag: 'TỰ ĐỘNG 100%',
    icon: Smartphone,
    color: '#7C3AED' // Tím trần
  },
  {
    problem: 'Không biết tiền lương tháng này bốc hơi đi đâu',
    solution: 'Ngân sách 6 Hũ tự động chia tỷ lệ ngay khi có lương về tài khoản',
    tag: 'KIỂM SOÁT DÒNG TIỀN',
    icon: PieChart,
    color: '#059669'
  },
  {
    problem: 'Đầu tư cổ phiếu, vàng, tiết kiệm lung tung không rõ lời hay lỗ',
    solution: 'Smart Ledger đồng bộ giá HOSE & SJC, tự bóc tách vốn gốc và lãi thực tế',
    tag: 'ĐỊNH GIÁ REALTIME',
    icon: TrendingUp,
    color: '#7C3AED' // Tím trần
  },
  {
    problem: 'Sợ quên ngày trả nợ thẻ tín dụng bị phạt lãi cao',
    solution: 'Tự động nhắc hạn trước 3 ngày, gợi ý số tiền thanh toán an toàn',
    tag: 'KHÔNG LO PHẠT LÃI',
    icon: BellRing,
    color: '#EA580C'
  },
  {
    problem: 'Không biết sức khỏe tài chính của mình đang ở mức nào',
    solution: 'Đồng hồ Speedometer đo 6 chỉ số chuẩn quốc tế, chỉ ra điểm yếu cần khắc phục',
    tag: 'CHẨN ĐOÁN CHUẨN',
    icon: Activity,
    color: '#06B6D4'
  },
  {
    problem: 'Sợ dùng thử bị tự động trừ tiền thẻ tín dụng',
    solution: 'VIP Gold 30 Ngày không cần nhập thẻ, hết hạn tự chuyển về gói Free an toàn',
    tag: '0Đ RỦI RO',
    icon: ShieldCheck,
    color: GOLD_COLOR_TOKENS.goldMetallic
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const currentUser = mockFinanceService.getCurrentUser();
  const isMobile = useMediaQuery('(max-width:600px)');
  const rootRef = useRef<HTMLDivElement>(null);
  const [gaugeDemoScore, setGaugeDemoScore] = useState<number>(85);
  const [activeFilterTab, setActiveFilterTab] = useState<string>('all');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [installGuideOpen, setInstallGuideOpen] = useState<boolean>(false);
  const [guideModalPlatform, setGuideModalPlatform] = useState<'android' | 'ios'>('android');

  // Auto detect user OS on load (Android / iOS)
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPad|iPhone|iPod/.test(ua)) {
        setGuideModalPlatform('ios');
      } else if (/Android/.test(ua)) {
        setGuideModalPlatform('android');
      }
    }
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Hero Elements Staggered Fade Up
      gsap.from('.hero-anim', {
        y: 40,
        opacity: 0,
        duration: 0.85,
        stagger: 0.15,
        ease: 'power3.out'
      });

      // Section Titles Reveal with ScrollTrigger
      gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((sec: any) => {
        gsap.from(sec, {
          scrollTrigger: {
            trigger: sec,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          y: 35,
          opacity: 0,
          duration: 0.75,
          ease: 'power2.out'
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const filteredSolutions = activeFilterTab === 'all'
    ? LAZY_USER_SOLUTIONS
    : activeFilterTab === 'auto'
      ? [LAZY_USER_SOLUTIONS[0], LAZY_USER_SOLUTIONS[1]]
      : activeFilterTab === 'invest'
        ? [LAZY_USER_SOLUTIONS[2], LAZY_USER_SOLUTIONS[4]]
        : [LAZY_USER_SOLUTIONS[3], LAZY_USER_SOLUTIONS[5]];

  return (
    <Box
      ref={rootRef}
      sx={{
        bgcolor: '#030706',
        color: '#F8FAFC',
        minHeight: '100vh',
        overflowX: 'hidden',
        maxWidth: '100vw',
        width: '100%',
        position: 'relative'
      }}
    >
      {/* ATMOSPHERIC MULTI-LAYER OBSIDIAN GRADIENTS, REACT BITS DOT MATRIX & GLOW MESH */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: `
            radial-gradient(ellipse 90% 55% at 50% -8%, rgba(139, 92, 246, 0.28) 0%, rgba(3, 7, 6, 0) 70%),
            radial-gradient(circle 850px at 90% 25%, rgba(16, 185, 129, 0.12) 0%, rgba(3, 7, 6, 0) 65%),
            radial-gradient(circle 900px at 10% 65%, rgba(124, 58, 237, 0.16) 0%, rgba(3, 7, 6, 0) 70%),
            radial-gradient(circle 600px at 50% 90%, rgba(223, 186, 115, 0.08) 0%, rgba(3, 7, 6, 0) 60%)
          `
        }}
      />
      {/* Dynamic React Bits Subtle Dot Grid Matrix with Vignette Radial Mask */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.14) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 85% 75% at 50% 30%, black 35%, transparent 88%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 50% 30%, black 35%, transparent 88%)'
        }}
      />

      {/* 1. TOP NAVBAR */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          bgcolor: 'rgba(3, 7, 6, 0.92)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          px: { xs: 1.5, sm: 3, md: 5 },
          py: { xs: 1, sm: 1.5 }
        }}
      >
        <Box sx={{ maxWidth: 1240, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          {/* Logo & Brand Name */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <Box
              component="img"
              src="/logo.png?v=20261105"
              alt="Finora"
              sx={{
                width: { xs: 30, sm: 36 },
                height: { xs: 30, sm: 36 },
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                objectFit: 'contain'
              }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.4, color: '#FFFFFF', lineHeight: 1.1, fontSize: { xs: 15, sm: 18 } }}>
                Finora <span style={{ color: '#34D399', fontWeight: 700, fontSize: '0.85em' }}>· Tích Sản</span>
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '10px', fontWeight: 600, display: { xs: 'none', sm: 'block' }, letterSpacing: '0.02em' }}>
                Quản lý dòng tiền & Tích lũy tài sản
              </Typography>
            </Box>
          </Link>

          {/* Desktop Nav Links - Cleaned & Balanced */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 600 }}>
            <a href="#quick-solutions" style={{ color: '#E2E8F0', textDecoration: 'none', transition: 'color 0.2s' }}>
              Giải pháp
            </a>
            <a href="#overview" style={{ color: '#E2E8F0', textDecoration: 'none', transition: 'color 0.2s' }}>
              Dòng tiền
            </a>
            <a href="#gauges" style={{ color: '#E2E8F0', textDecoration: 'none', transition: 'color 0.2s' }}>
              Sức khỏe tài chính
            </a>
            <a href="#pricing" style={{ color: '#E2E8F0', textDecoration: 'none', transition: 'color 0.2s' }}>
              Bảng giá
            </a>
          </Box>

          {/* Actions: Desktop & Mobile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 }, flexShrink: 0 }}>
            {/* Single Clean Download App Button on Desktop */}
            <Button
              component="a"
              href="#app-download"
              variant="outlined"
              size="small"
              startIcon={<Smartphone size={14} color="#34D399" />}
              sx={{
                borderColor: 'rgba(52, 211, 153, 0.4)',
                color: '#34D399',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: '6px',
                px: 1.4,
                height: 34,
                bgcolor: 'rgba(16, 185, 129, 0.08)',
                display: { xs: 'none', md: 'inline-flex' },
                textTransform: 'none',
                '&:hover': { borderColor: '#34D399', bgcolor: 'rgba(52, 211, 153, 0.16)' }
              }}
            >
              Tải ứng dụng
            </Button>

            {/* Login or Enter App button */}
            {currentUser ? (
              <Button
                variant="contained"
                onClick={() => navigateToApp('/', navigate)}
                startIcon={<LayoutDashboard size={14} />}
                sx={{
                  bgcolor: '#10B981',
                  color: '#FFFFFF',
                  fontSize: { xs: 12, sm: 13 },
                  fontWeight: 800,
                  px: { xs: 1.5, sm: 2 },
                  height: 34,
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                Vào App
              </Button>
            ) : (
              <Button
                variant="text"
                onClick={() => navigateToAuth('login', navigate)}
                sx={{
                  color: '#FFFFFF',
                  fontSize: { xs: 12, sm: 13 },
                  fontWeight: 700,
                  px: { xs: 1.2, sm: 1.8 },
                  height: 34,
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                }}
              >
                Đăng nhập
              </Button>
            )}

            {/* Trial Gold Button (Desktop/Tablet) */}
            <Button
              variant="contained"
              onClick={() => navigateToAuth('register', navigate)}
              startIcon={<Crown size={14} color="#09261E" />}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                bgcolor: GOLD_COLOR_TOKENS.goldMetallic,
                color: '#09261E',
                fontSize: { xs: 12, sm: 12.5 },
                fontWeight: 800,
                px: { xs: 1.5, sm: 2 },
                height: 34,
                borderRadius: '6px',
                boxShadow: '0 4px 14px rgba(197, 160, 89, 0.35)',
                whiteSpace: 'nowrap',
                textTransform: 'none',
                '&:hover': { bgcolor: GOLD_COLOR_TOKENS.goldLight }
              }}
            >
              Trải nghiệm VIP Gold
            </Button>

            {/* Hamburger Button for Mobile & Tablet */}
            <IconButton
              onClick={() => setMobileDrawerOpen(true)}
              sx={{
                display: { xs: 'inline-flex', lg: 'none' },
                color: '#FFFFFF',
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                width: 36,
                height: 36,
                borderRadius: '8px',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)' }
              }}
              aria-label="Mở menu di động"
            >
              <Menu size={20} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* MOBILE DRAWER NAVIGATION */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: '85%',
              maxWidth: 320,
              bgcolor: '#091310',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }
          }
        }}
      >
        <Box>
          {/* Drawer Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, mb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <img src="/logo.png?v=20261105" alt="Finora" style={{ width: 30, height: 30, borderRadius: 6 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#FFFFFF', fontSize: 16 }}>
                Finora · Tích Sản
              </Typography>
            </Box>
            <IconButton onClick={() => setMobileDrawerOpen(false)} sx={{ color: '#94A3B8', p: 0.5 }}>
              <X size={20} />
            </IconButton>
          </Box>

          {/* Quick Action Buttons in Drawer */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2.5 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                setMobileDrawerOpen(false);
                navigateToAuth('register', navigate);
              }}
              startIcon={<Crown size={15} color="#09261E" />}
              sx={{
                bgcolor: GOLD_COLOR_TOKENS.goldMetallic,
                color: '#09261E',
                fontWeight: 850,
                py: 1,
                fontSize: 13,
                borderRadius: '10px',
                '&:hover': { bgcolor: GOLD_COLOR_TOKENS.goldLight }
              }}
            >
              Đăng ký VIP Gold 30 Ngày (0đ)
            </Button>

            {currentUser ? (
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigateToApp('/', navigate);
                }}
                startIcon={<LayoutDashboard size={16} />}
                sx={{
                  bgcolor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  py: 1.1,
                  fontSize: 14,
                  borderRadius: '10px',
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                Vào ứng dụng ngay
              </Button>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigateToAuth('login', navigate);
                }}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  py: 0.9,
                  fontSize: 13,
                  borderRadius: '10px',
                  '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.08)' }
                }}
              >
                Đăng nhập tài khoản
              </Button>
            )}
          </Box>

          {/* Drawer Links */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
            {[
              { href: '#quick-solutions', label: 'Giải pháp nhanh', icon: Zap },
              { href: '#overview', label: '7 Thẻ Dòng tiền', icon: PieChart },
              { href: '#gauges', label: 'Đồng hồ Bán nguyệt', icon: Activity },
              { href: '#app-download', label: 'Tải App Android & iOS', icon: Smartphone, highlight: true },
              { href: '#pricing', label: 'Bảng giá & Trial 30 Ngày', icon: Crown }
            ].map((item, idx) => {
              const IconCmp = item.icon;
              return (
                <a
                  key={idx}
                  href={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    textDecoration: 'none',
                    color: item.highlight ? '#34D399' : '#E2E8F0',
                    fontWeight: item.highlight ? 800 : 650,
                    fontSize: 15,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: item.highlight ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                  }}
                >
                  <IconCmp size={18} color={item.highlight ? '#34D399' : '#94A3B8'} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </Box>
        </Box>

        {/* Drawer Bottom Actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Button
            component="a"
            href="/downloads/finora-latest.apk"
            download="Finora-TichSan.apk"
            fullWidth
            variant="outlined"
            startIcon={<AndroidSvgIcon size={18} color="#34D399" />}
            sx={{
              borderColor: 'rgba(52, 211, 153, 0.35)',
              bgcolor: 'rgba(16, 185, 129, 0.08)',
              color: '#FFFFFF',
              fontWeight: 750,
              py: 1.2,
              borderRadius: '10px',
              textTransform: 'none',
              justifyContent: 'center',
              '&:hover': {
                borderColor: '#34D399',
                bgcolor: 'rgba(16, 185, 129, 0.16)'
              }
            }}
          >
            Tải APK Android (12 MB)
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setMobileDrawerOpen(false);
              setGuideModalPlatform('ios');
              setInstallGuideOpen(true);
            }}
            startIcon={<AppleSvgIcon size={18} color="#E2E8F0" />}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              color: '#FFFFFF',
              fontWeight: 750,
              py: 1.2,
              borderRadius: '10px',
              textTransform: 'none',
              justifyContent: 'center',
              '&:hover': {
                borderColor: '#FFFFFF',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Cài đặt cho iOS (iPhone)
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              navigateToAuth('register', navigate);
              setMobileDrawerOpen(false);
            }}
            startIcon={<Crown size={16} color="#09261E" />}
            sx={{
              bgcolor: GOLD_COLOR_TOKENS.goldMetallic,
              color: '#09261E',
              fontWeight: 850,
              py: 1.25,
              borderRadius: 2
            }}
          >
            Đăng ký VIP Gold 30 Ngày
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              navigateToAuth('login', navigate);
              setMobileDrawerOpen(false);
            }}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontWeight: 700,
              py: 1,
              borderRadius: 2
            }}
          >
            Đăng nhập
          </Button>
        </Box>
      </Drawer>

      {/* 2. HERO SECTION */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 13 }, pb: { xs: 8, md: 10 }, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Trial Badge */}
        <Box
          className="hero-anim"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.2,
            px: 2,
            py: 0.75,
            borderRadius: 50,
            bgcolor: 'rgba(197, 160, 89, 0.12)',
            border: `1px solid ${GOLD_COLOR_TOKENS.goldBorder}`,
            backdropFilter: 'blur(10px)',
            mb: 3.5
          }}
        >
          <Crown size={16} color={GOLD_COLOR_TOKENS.goldMetallic} />
          <Typography variant="caption" sx={{ color: GOLD_COLOR_TOKENS.goldLight, fontWeight: 800, fontSize: 12.5, letterSpacing: 0.4 }}>
            TẶNG 30 NGÀY DÙNG THỬ VIP GOLD — KHÔNG CẦN THẺ TÍN DỤNG
          </Typography>
        </Box>

        {/* Hero Title */}
        <Typography
          className="hero-anim"
          variant="h1"
          sx={{
            fontSize: { xs: '2.1rem', sm: '3.2rem', md: '4.5rem' },
            fontWeight: 900,
            letterSpacing: { xs: '-0.02em', md: '-0.03em' },
            lineHeight: { xs: 1.2, md: 1.15 },
            maxWidth: 980,
            mx: 'auto',
            mb: 2.5
          }}
        >
          Làm chủ dòng tiền cá nhân. <br />
          <span style={{
            background: 'linear-gradient(135deg, #FFFFFF 20%, #A78BFA 60%, #34D399 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Kiến tạo tài sản vững bền.
          </span>
        </Typography>

        {/* Hero Subtitle */}
        <Typography
          className="hero-anim"
          variant="body1"
          sx={{
            fontSize: { xs: 14.5, sm: 17.5 },
            color: '#94A3B8',
            maxWidth: 720,
            mx: 'auto',
            lineHeight: { xs: 1.6, md: 1.7 },
            mb: { xs: 4, md: 5 },
            px: { xs: 1, sm: 0 }
          }}
        >
          Hệ thống tài chính cá nhân toàn diện: Đồng hồ Bán nguyệt GSAP chuẩn xác, bóc tách vốn đầu tư Tím trần và Trợ lý AI WebMCP 1-chạm — minh bạch, tự động và bảo mật local-first.
        </Typography>

        {/* CTA Buttons (Mobile Responsive Clean Layout) */}
        <Box
          className="hero-anim"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 1.25, sm: 1.75 },
            mb: { xs: 3.5, md: 5 },
            width: '100%',
            maxWidth: { xs: 440, md: 'none' },
            mx: 'auto'
          }}
        >
          {/* Main Gold CTA */}
          <Button
            variant="contained"
            size="large"
            onClick={() => navigateToAuth('register', navigate)}
            endIcon={<ArrowRight size={18} />}
            sx={{
              backgroundColor: GOLD_COLOR_TOKENS.goldMetallic,
              color: '#09261E',
              fontWeight: 850,
              fontSize: { xs: 14.5, sm: 15 },
              px: { xs: 3, sm: 3.5 },
              py: { xs: 1.4, sm: 1.45 },
              width: { xs: '100%', md: 'auto' },
              borderRadius: 2.5,
              boxShadow: '0 10px 30px rgba(197, 160, 89, 0.4)',
              '&:hover': { backgroundColor: GOLD_COLOR_TOKENS.goldLight }
            }}
          >
            Nhận 30 Ngày VIP Gold Miễn Phí
          </Button>

          {/* Secondary Buttons Row on Mobile */}
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1.25, sm: 1.75 },
              width: { xs: '100%', md: 'auto' }
            }}
          >
            {/* Direct Login Button */}
            <Button
              variant="outlined"
              size="large"
              type="button"
              onClick={() => navigate('/auth/login')}
              sx={{
                flex: { xs: 1, md: 'initial' },
                borderColor: 'rgba(52, 211, 153, 0.35)',
                color: '#34D399',
                fontWeight: 750,
                fontSize: { xs: 13.5, sm: 14.5 },
                px: { xs: 2, sm: 2.8 },
                py: { xs: 1.35, sm: 1.45 },
                borderRadius: 2.5,
                bgcolor: 'rgba(16, 185, 129, 0.06)',
                touchAction: 'manipulation',
                '&:hover': { borderColor: '#34D399', bgcolor: 'rgba(16, 185, 129, 0.14)' }
              }}
            >
              Đăng nhập ngay
            </Button>

            {/* Jump to App Download Button */}
            <Button
              component="a"
              href="#app-download"
              variant="outlined"
              size="large"
              startIcon={<Smartphone size={16} color="#94A3B8" />}
              sx={{
                flex: { xs: 1, md: 'initial' },
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#E2E8F0',
                fontWeight: 750,
                fontSize: { xs: 13.5, sm: 14.5 },
                px: { xs: 2, sm: 2.8 },
                py: { xs: 1.35, sm: 1.45 },
                borderRadius: 2.5,
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255, 255, 255, 0.08)' }
              }}
            >
              Tải App Mobile
            </Button>
          </Box>
        </Box>

        {/* Small Trust Badge */}
        <Box className="hero-anim" sx={{ mb: { xs: 4, md: 6 }, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              px: { xs: 1.8, sm: 2.5 },
              py: 0.7,
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <ShieldCheck size={14} color="#34D399" />
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: { xs: '11px', sm: '12px' }, fontWeight: 650 }}>
              Chạy Ngoại Tuyến 100% · Không Lưu Tài Khoản Ngân Hàng · Không Quảng Cáo
            </Typography>
          </Box>
        </Box>

        {/* Trust Badges */}
        <Box className="hero-anim" sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2.5, sm: 5 }, flexWrap: 'wrap', color: '#94A3B8', fontSize: 13 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldCheck size={16} color="#34D399" />
            <span>Mã hóa Zero-Knowledge</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EyeOff size={16} color="#34D399" />
            <span>Không lưu dữ liệu ngân hàng</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Zap size={16} color="#A78BFA" />
            <span>Kích hoạt 30 giây</span>
          </Box>
        </Box>
      </Container>

      {/* 3. DÀNH CHO USER LƯỜI ĐỌC: GIẢI PHÁP NHANH (PAIN POINTS & SOLUTIONS MATRIX) */}
      <Box
        id="quick-solutions"
        className="reveal-section"
        sx={{
          py: { xs: 6, md: 10 },
          bgcolor: 'rgba(10, 17, 14, 0.75)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip
              icon={<Zap size={14} color="#A78BFA" />}
              label="DÀNH CHO BẠN BẬN RỘN & LƯỜI ĐỌC DÀI"
              sx={{
                bgcolor: 'rgba(124, 58, 237, 0.15)',
                color: '#C4B5FD',
                border: '1px solid rgba(124, 58, 237, 0.35)',
                fontWeight: 800,
                fontSize: 11,
                mb: 1.5
              }}
            />
            <Typography variant="h3" sx={{ fontWeight: 850, letterSpacing: -1, mb: 1.5 }}>
              Bạn Cần Gì? — Tích Sản Đã Lo Hết Tự Động
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 680, mx: 'auto' }}>
              Không cần học kiến thức kế toán phức tạp. Chọn đúng nhu cầu của bạn và xem cách Tích Sản giải quyết triệt để chỉ trong 1 chạm.
            </Typography>

            {/* Quick Filter Buttons for Fast Reading */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 0.8, sm: 1.2 }, mt: 3, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'Tất cả 6 giải pháp' },
                { id: 'auto', label: 'Tự động hóa ghi chép' },
                { id: 'invest', label: 'Đầu tư & Sức khỏe tài sản' },
                { id: 'debt', label: 'Thẻ tín dụng & Không rủi ro' }
              ].map(tab => (
                <Button
                  key={tab.id}
                  size="small"
                  variant={activeFilterTab === tab.id ? 'contained' : 'outlined'}
                  onClick={() => setActiveFilterTab(tab.id)}
                  sx={{
                    fontSize: { xs: 11, sm: 12.5 },
                    fontWeight: 750,
                    borderRadius: 50,
                    px: { xs: 1.5, sm: 2 },
                    py: 0.6,
                    bgcolor: activeFilterTab === tab.id ? '#7C3AED' : 'rgba(255,255,255,0.04)',
                    color: activeFilterTab === tab.id ? '#FFFFFF' : '#CBD5E1',
                    borderColor: activeFilterTab === tab.id ? '#7C3AED' : 'rgba(255,255,255,0.12)',
                    '&:hover': {
                      bgcolor: activeFilterTab === tab.id ? '#6D28D9' : 'rgba(255,255,255,0.08)'
                    }
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Solutions Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2.5
            }}
          >
            {filteredSolutions.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'rgba(15, 23, 20, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    backdropFilter: 'blur(16px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: item.color,
                      boxShadow: `0 16px 40px ${item.color}25`
                    }
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: `${item.color}1F`, border: `1px solid ${item.color}40`, display: 'grid', placeItems: 'center', color: item.color }}>
                        <Icon size={20} />
                      </Box>
                      <Chip
                        label={item.tag}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: 10,
                          fontWeight: 850,
                          bgcolor: `${item.color}1A`,
                          color: item.color,
                          border: `1px solid ${item.color}40`
                        }}
                      />
                    </Box>

                    {/* Problem */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 800, fontSize: 11, display: 'block', mb: 0.5 }}>
                        VẤN ĐỀ CỦA BẠN:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#F1F5F9', fontSize: 14, lineHeight: 1.5 }}>
                        "{item.problem}"
                      </Typography>
                    </Box>
                  </Box>

                  {/* Solution */}
                  <Box sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 800, fontSize: 11, display: 'block', mb: 0.5 }}>
                      FINORA GIẢI QUYẾT:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.6, fontWeight: 550 }}>
                      {item.solution}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* 4. SHOWCASE: 7 FINANCIAL OVERVIEW CARDS (WITH TÍM TRẦN ACCENTS) */}
      <Box id="overview" className="reveal-section" sx={{ py: { xs: 7, md: 11 }, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" sx={{ color: '#A78BFA', fontWeight: 800, letterSpacing: 1.5 }}>
              TRỰC QUAN HÓA TOÀN BỘ DÒNG TIỀN
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 850, letterSpacing: -1, mt: 0.5, mb: 1.5 }}>
              7 Thẻ Tài Chính Độc Lập — Nhận diện trong 3 Giây
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 640, mx: 'auto' }}>
              Mỗi chỉ số đại diện cho một trụ cột tài chính với màu sắc riêng biệt, nổi bật nhất là vị thế Tài sản Tím trần chuẩn thị trường.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2.5
            }}
          >
            {DEMO_CARDS.map((c, i) => (
              <Paper
                key={i}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: c.bg,
                  border: `1.5px solid ${c.border}`,
                  color: '#0F172A',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 28px rgba(0,0,0,0.15)' }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: c.color, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    {c.title}
                  </Typography>
                  <Chip
                    label={c.badge}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 10,
                      fontWeight: 800,
                      bgcolor: 'rgba(255,255,255,0.85)',
                      color: c.color,
                      border: `1px solid ${c.border}`
                    }}
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: -0.5, mb: 0.5 }}>
                  {c.value}
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block' }}>
                  {c.sub}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* 5. SPEEDOMETER GAUGES: FINANCIAL HEALTH (GSAP INTERACTIVE DEMO & ACTIVE ILLUMINATION) */}
      <Box
        id="gauges"
        className="reveal-section"
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: 'rgba(10, 17, 14, 0.75)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 }, alignItems: 'center' }}>
            <Box sx={{ maxWidth: '100%', minWidth: 0 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 50, bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', mb: 2 }}>
                <Activity size={14} />
                <Typography variant="caption" sx={{ fontWeight: 800 }}>CHUẨN MỰC CHẨN ĐOÁN SỨC KHỎE TÀI CHÍNH</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 850, letterSpacing: -1, fontSize: { xs: '1.6rem', sm: '2.2rem', md: '2.5rem' }, mb: 2 }}>
                Speedometer Gauges — Kim Khóa Trục & Sáng Vùng Chỉ Định
              </Typography>
              <Typography variant="body1" sx={{ color: '#94A3B8', lineHeight: 1.8, fontSize: { xs: '0.9rem', sm: '1rem' }, mb: 3 }}>
                Kim chỉ được khóa trục toán học chính xác 100% tại tâm xoay SVG. Đặc biệt: <strong>kim trỏ đến phân vùng nào thì màu phân vùng đó sẽ rực sáng và tỏa vầng hào quang</strong>, các vùng còn lại tự động dịu xuống để tạo độ tương phản vượt trội.
              </Typography>

              <Box sx={{ display: 'grid', gap: 1.5, mb: 4 }}>
                {[
                  { label: 'Kim và trục đồng tâm tuyệt đối (Zero Deviation)', desc: 'Cố định trực tiếp qua SVG rotate(deg, cx, cy), không lệch góc trên mọi trình duyệt' },
                  { label: 'Active Zone Glow (Chiếu sáng phân vùng trỏ đến)', desc: 'Tự động kích hoạt hiệu ứng feGaussianBlur và tăng độ sáng cho vùng kim đang chỉ' },
                  { label: '5 phân vùng trạng thái sắc nét quốc tế', desc: 'Nguy cấp (#EF4444) -> Yếu -> Trung bình -> Khá (#10B981) -> Xuất sắc (#06B6D4)' }
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1.5 }}>
                    <CheckCircle2 size={18} color="#06B6D4" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#F1F5F9', fontSize: '0.9rem' }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Interactive Gauge Slider demo */}
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#E2E8F0', fontWeight: 800 }}>
                    Thử kéo điểm số để kiểm tra kim & độ sáng phân vùng:
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: '#06B6D4', fontWeight: 900 }}>
                    {gaugeDemoScore} / 100
                  </Typography>
                </Box>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={gaugeDemoScore}
                  onChange={e => setGaugeDemoScore(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#06B6D4' }}
                />
              </Box>
            </Box>

            {/* Gauge Display Box */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 4 },
                borderRadius: 4,
                bgcolor: '#091310',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1, textAlign: 'center', fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                Chỉ Số Sức Khỏe Toàn Diện (Tích Sản Health)
              </Typography>
              <SemiCircleGauge score={gaugeDemoScore} size={isMobile ? 240 : 310} title="Sức Khỏe Tài Chính" />
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* 6. AI COPILOT SECTION (WEBMCP INTEGRATION) */}
      <Box id="copilot" className="reveal-section" sx={{ py: { xs: 7, md: 12 }, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 50, bgcolor: 'rgba(197, 160, 89, 0.15)', color: GOLD_COLOR_TOKENS.goldLight, mb: 2 }}>
              <Bot size={15} color={GOLD_COLOR_TOKENS.goldMetallic} />
              <Typography variant="caption" sx={{ fontWeight: 800 }}>TRỢ LÝ TÀI CHÍNH WEBMCP CHUẨN MỰC</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 850, letterSpacing: -1, mb: 1.5 }}>
              Hỏi đáp Dòng tiền bằng Ngôn ngữ Tự nhiên
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 640, mx: 'auto' }}>
              Giao thức Model Context Protocol cho phép AI đọc số dư hiện tại và ghi chép giao dịch ngay lập tức khi bạn trò chuyện.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {[
              {
                prompt: 'Tháng này tôi còn bao nhiêu ngân sách cho Ăn uống ngoài?',
                answer: 'Bạn đã chi 4.250.000 ₫ / 6.000.000 ₫ ngân sách Ăn uống (70.8%). Bạn còn 1.750.000 ₫ cho 12 ngày tới (khoảng 145.000 ₫/ngày).'
              },
              {
                prompt: 'Tạo nhanh giao dịch: Vừa uống cà phê 45k tại Highlands',
                answer: 'Đã tự động tạo giao dịch chi tiêu 45.000 ₫ vào danh mục Ăn uống, trừ vào Ví tiền mặt. Số dư đã cập nhật tức thì!'
              },
              {
                prompt: 'Tốc độ tích lũy của tôi có kịp mua nhà trong 3 năm tới không?',
                answer: 'Với tỷ lệ tiết kiệm 33.3% hiện tại (~15 triệu/tháng), sau 3 năm bạn sẽ tích lũy được ~620 triệu (gồm lãi suất kỳ vọng 6.5%/năm).'
              }
            ].map((ex, idx) => (
              <Box key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    bgcolor: 'rgba(15, 23, 20, 0.85)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: 50, bgcolor: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: '#A7F3D0' }}>
                      Bạn
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 650, color: '#FFFFFF', lineHeight: 1.6 }}>
                      "{ex.prompt}"
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: 50, bgcolor: 'rgba(197, 160, 89, 0.2)', display: 'grid', placeItems: 'center' }}>
                      <Bot size={15} color={GOLD_COLOR_TOKENS.goldMetallic} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#CBD5E1', lineHeight: 1.7, fontSize: 13 }}>
                      {ex.answer}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* 6.5. REAL CUSTOMER INTERVIEWS & CASE STUDIES (VOICE OF USERS) */}
      <Box id="reviews" className="reveal-section" sx={{ py: { xs: 7, md: 12 }, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 50, bgcolor: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA', mb: 2 }}>
              <Users size={15} />
              <Typography variant="caption" sx={{ fontWeight: 800 }}>PHỎNG VẤN & TRẢI NGHIỆM THỰC TẾ</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 850, letterSpacing: -1, mb: 1.5 }}>
              Khách hàng Nói gì về Finora?
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 640, mx: 'auto' }}>
              Chúng tôi đã phỏng vấn trực tiếp các cá nhân và chủ doanh nghiệp nhỏ để tháo gỡ từng nút thắt tài chính gây đau đầu nhất.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {[
              {
                name: 'Hoàng Minh Tuấn',
                role: 'Senior Tech Lead, 32 tuổi (Hà Nội)',
                problem: 'Lương cao nhưng cuối tháng không thấy tiền dư',
                solution: 'Quy tắc 6 Hũ tự động chia tỷ lệ & Speedometer đo tỷ lệ tiết kiệm',
                result: 'Tăng tỷ lệ tiết kiệm từ 12% lên 38%, mua được gói bảo hiểm nhân thọ cho cả gia đình',
                quote: 'Trước đây mỗi lần nhận thưởng quý là tôi tiêu bạt mạng vì không có phân vùng tiền rõ ràng. Finora giúp tôi bóc tách rạch ròi giữa quỹ tiêu xài và quỹ dự phòng khẩn cấp.'
              },
              {
                name: 'Lê Thùy Dương',
                role: 'Chủ Studio Thời Trang & Nhà đầu tư F0 (TP.HCM)',
                problem: 'Đầu tư cổ phiếu, vàng, bất động sản lung tung không biết lãi thật hay lỗ',
                solution: 'Smart Ledger bóc tách vốn chưa thu hồi và danh mục rủi ro cao',
                result: 'Quản lý minh bạch 1.2 tỷ vốn đầu tư, cắt lỗ kịp thời 2 mã cổ phiếu kém thanh khoản',
                quote: 'Tính năng phân tách Vốn chưa thu hồi và Tài sản rủi ro là thứ tôi chưa từng thấy ở app nào khác. Nó giúp tôi nhìn thẳng vào sự thật thay vì tự an ủi bằng số dư ảo!'
              },
              {
                name: 'Nguyễn Văn Đạt',
                role: 'Freelance Designer & Sáng lập Agency (Đà Nẵng)',
                problem: 'Sợ các app bắt nhập thẻ tín dụng rồi âm thầm tự gia hạn trừ tiền',
                solution: 'VIP Gold 30 Ngày 0đ rủi ro, Local-First không cần nhập thẻ',
                result: 'Yên tâm sử dụng toàn bộ tính năng cao cấp suốt 6 tháng nay',
                quote: 'Tôi ghét nhất các app fintech bắt nhập số CVV thẻ tín dụng. Ở Finora, gói VIP Gold 30 ngày hoàn toàn không hỏi thẻ, dữ liệu lưu trên máy cá nhân an toàn 100%.'
              }
            ].map((interview, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: 3,
                  bgcolor: 'rgba(15, 23, 20, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 2.5,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    borderColor: 'rgba(139, 92, 246, 0.4)',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                    transform: 'translateY(-3px)'
                  }
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, color: '#FBBF24' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#FBBF24" />
                      ))}
                    </Box>
                    <Quote size={20} color="rgba(255,255,255,0.2)" />
                  </Box>

                  <Typography variant="body2" sx={{ color: '#E2E8F0', fontStyle: 'italic', lineHeight: 1.7, mb: 3 }}>
                    "{interview.quote}"
                  </Typography>

                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', mb: 2.5, display: 'grid', gap: 1 }}>
                    <Box sx={{ fontSize: 11.5 }}>
                      <strong style={{ color: '#EF4444' }}>Vấn đề đã tháo gỡ:</strong>{' '}
                      <span style={{ color: '#CBD5E1' }}>{interview.problem}</span>
                    </Box>
                    <Box sx={{ fontSize: 11.5 }}>
                      <strong style={{ color: '#10B981' }}>Kết quả đạt được:</strong>{' '}
                      <span style={{ color: '#CBD5E1' }}>{interview.result}</span>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                    {interview.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    {interview.role}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* 6.5 DEDICATED APP DOWNLOAD SHOWCASE SECTION (MOBILE-OPTIMIZED & STREAMLINED) */}
      <Box
        id="app-download"
        className="reveal-section"
        sx={{
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(3, 7, 6, 0.98) 0%, rgba(6, 26, 18, 0.75) 50%, rgba(3, 7, 6, 0.98) 100%)',
          borderTop: '1px solid rgba(16, 185, 129, 0.15)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.15)'
        }}
      >
        {/* Glow ambient background effects */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: { xs: '90%', md: 650 },
            height: { xs: 250, md: 450 },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 3.5, md: 6 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              <Chip
                icon={<Smartphone size={15} color="#34D399" />}
                label="ỨNG DỤNG DI ĐỘNG FINORA · v1.0.1"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontWeight: 750,
                  fontSize: { xs: '11px', sm: '12px' },
                  letterSpacing: 0.5,
                  px: 1,
                  py: 1.8,
                  borderRadius: '999px'
                }}
              />
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.65rem', sm: '2.4rem', md: '3rem' },
                fontWeight: 900,
                lineHeight: 1.2,
                color: '#FFFFFF',
                mb: 1.5,
                letterSpacing: '-0.02em'
              }}
            >
              Tải Finora Về{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #F59E0B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Điện Thoại
              </Box>
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#94A3B8',
                maxWidth: 600,
                mx: 'auto',
                fontSize: { xs: '0.88rem', sm: '1rem' },
                lineHeight: 1.5,
                mb: 2.5
              }}
            >
              Ghi chép nhanh không độ trễ, lưu trữ bảo mật 100% trên thiết bị. Hoạt động trơn tru kể cả khi không có mạng.
            </Typography>

            </Box>

          {/* Main Download Showcase Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.35fr 0.95fr' },
              gap: { xs: 3, md: 4 },
              alignItems: 'stretch'
            }}
          >
            {/* Primary Action Card */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5, md: 4 },
                borderRadius: { xs: '20px', md: '24px' },
                background: 'rgba(12, 20, 16, 0.9)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
            >
              <Box>
                {/* App Brand Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1.8, sm: 2.5 },
                    pb: 2.5,
                    mb: 2.5,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <Box
                    component="img"
                    src="/logo.png"
                    alt="Finora Logo"
                    sx={{
                      width: { xs: 54, sm: 64 },
                      height: { xs: 54, sm: 64 },
                      borderRadius: '16px',
                      p: 0.8,
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0.4) 100%)',
                      border: '1.5px solid rgba(52, 211, 153, 0.4)',
                      boxShadow: '0 6px 18px rgba(5, 150, 105, 0.35)',
                      objectFit: 'contain',
                      flexShrink: 0
                    }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#FFFFFF', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
                        Finora - Tích Sản
                      </Typography>
                      <Chip
                        size="small"
                        label="v1.0.1 Mới Nhất"
                        sx={{
                          bgcolor: 'rgba(52, 211, 153, 0.15)',
                          color: '#34D399',
                          fontWeight: 750,
                          fontSize: '0.72rem',
                          height: 22,
                          border: '1px solid rgba(52, 211, 153, 0.3)'
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
                      <span>Dung lượng: <strong style={{ color: '#34D399' }}>12 MB</strong></span>
                      <span>•</span>
                      <span>Hỗ trợ: <strong>Android 7.0+ & iOS 15+</strong></span>
                      <span>•</span>
                      <span style={{ color: '#F59E0B', fontWeight: 700 }}>Miễn phí 100%</span>
                    </Typography>
                  </Box>
                </Box>

                {/* 2 Equal Basic Download Buttons */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 1.75,
                    mb: 2.5
                  }}
                >
                  {/* Button 1: Android APK */}
                  <Button
                    component="a"
                    href="/downloads/finora-latest.apk"
                    download="Finora-TichSan.apk"
                    variant="outlined"
                    startIcon={<AndroidSvgIcon size={22} color="#34D399" />}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      py: 1.5,
                      px: 2,
                      borderRadius: '12px',
                      borderColor: 'rgba(52, 211, 153, 0.35)',
                      bgcolor: 'rgba(16, 185, 129, 0.08)',
                      color: '#FFFFFF',
                      textTransform: 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#34D399',
                        bgcolor: 'rgba(16, 185, 129, 0.16)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.25, color: '#FFFFFF' }}>
                        Tải cho Android
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8', mt: 0.2 }}>
                        Bản APK • <strong style={{ color: '#34D399' }}>12 MB</strong>
                      </Typography>
                    </Box>
                    <DownloadCloud size={20} color="#34D399" style={{ flexShrink: 0 }} />
                  </Button>

                  {/* Button 2: iOS iPhone/iPad */}
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setGuideModalPlatform('ios');
                      setInstallGuideOpen(true);
                    }}
                    startIcon={<AppleSvgIcon size={22} color="#E2E8F0" />}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      py: 1.5,
                      px: 2,
                      borderRadius: '12px',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: '#FFFFFF',
                      textTransform: 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#FFFFFF',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.25, color: '#FFFFFF' }}>
                        Cài đặt cho iOS
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8', mt: 0.2 }}>
                        PWA Safari • <strong style={{ color: '#38BDF8' }}>0 MB (Web)</strong>
                      </Typography>
                    </Box>
                    <ExternalLink size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
                  </Button>
                </Box>

                {/* Safety Badges List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, px: 0.5, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                      File APK chính thức 12 MB, ký số sạch, không quảng cáo hay mã theo dõi.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                      Khởi chạy ngoại tuyến 100% với SQLite/IndexedDB an toàn trên điện thoại.
                    </Typography>
                  </Box>
                </Box>

                {/* Quick Guides Links (Android & iOS) */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, px: 0.5 }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setGuideModalPlatform('android');
                      setInstallGuideOpen(true);
                    }}
                    startIcon={<HelpCircle size={14} color="#34D399" />}
                    endIcon={<ArrowRight size={13} />}
                    sx={{
                      color: '#34D399',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      p: 0,
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                    }}
                  >
                    Hướng dẫn cài đặt file APK trên Android (30s)
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setGuideModalPlatform('ios');
                      setInstallGuideOpen(true);
                    }}
                    startIcon={<HelpCircle size={14} color="#38BDF8" />}
                    endIcon={<ArrowRight size={13} />}
                    sx={{
                      color: '#38BDF8',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      p: 0,
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                    }}
                  >
                    Hướng dẫn ghim ra MH chính iPhone (iOS)
                  </Button>
                </Box>

                {/* 4 Feature Highlights Grid (2x2 Compact) */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr' }, gap: 1.5, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  {[
                    { icon: Zap, label: 'Khởi động 0.2s', desc: 'Mở app ghi chép ngay', color: '#F59E0B' },
                    { icon: ShieldCheck, label: 'Bảo mật Offline', desc: 'Dữ liệu lưu trên máy', color: '#10B981' },
                    { icon: Activity, label: 'Đồng Hồ GSAP', desc: 'Đo 6 chỉ số dòng tiền', color: '#38BDF8' },
                    { icon: EyeOff, label: 'Zero-Telemetry', desc: '100% không quảng cáo', color: '#A78BFA' }
                  ].map((feat, idx) => {
                    const FeatIcon = feat.icon;
                    return (
                      <Box
                        key={idx}
                        sx={{
                          p: 1.25,
                          borderRadius: '12px',
                          bgcolor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '6px',
                            bgcolor: `${feat.color}15`,
                            color: feat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <FeatIcon size={15} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#FFFFFF', fontSize: '0.78rem', lineHeight: 1.2 }}>
                            {feat.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {feat.desc}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Paper>

            {/* Right Card: QR Code (DESKTOP ONLY, HIDDEN ON MOBILE) */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: '24px',
                background: 'rgba(12, 20, 16, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                display: { xs: 'none', lg: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                justifyContent: 'center'
              }}
            >
              {/* QR Code Container */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                  mb: 2.5,
                  position: 'relative'
                }}
              >
                <Box
                  component="img"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    typeof window !== 'undefined'
                      ? window.location.origin + '/downloads/finora-latest.apk'
                      : 'https://finora.app/downloads/finora-latest.apk'
                  )}&color=064e3b&margin=4`}
                  alt="QR Code Tải Finora APK"
                  onError={(e: any) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  sx={{
                    width: 160,
                    height: 160,
                    display: 'block'
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                <QrCode size={18} color="#34D399" />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem' }}>
                  Quét Mã Tải Trên Điện Thoại
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2.5, maxWidth: 260, fontSize: '0.82rem', lineHeight: 1.4 }}>
                Dùng camera điện thoại Android để quét mã QR và tải nhanh file APK về máy.
              </Typography>

              {/* 3 Quick Steps for Desktop Scan */}
              <Box sx={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { step: '1', title: 'Quét mã QR', desc: 'Mở camera điện thoại quét mã' },
                  { step: '2', title: 'Tải file APK (12 MB)', desc: 'Chọn "Vẫn tải xuống"' },
                  { step: '3', title: 'Cài đặt và sử dụng', desc: 'Mở app và bắt đầu quản lý' }
                ].map((s, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2,
                      p: 0.8,
                      px: 1.5,
                      borderRadius: '10px',
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: 'rgba(16, 185, 129, 0.2)',
                        color: '#34D399',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {s.step}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.2 }}>
                        {s.title}
                      </Typography>
                      <Typography variant="caption" noWrap sx={{ color: '#94A3B8', fontSize: '0.7rem', display: 'block' }}>
                        {s.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* 7. PRICING & 30-DAY TRIAL SECTION */}
      <Box
        id="pricing"
        className="reveal-section"
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: 'rgba(10, 17, 14, 0.75)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: GOLD_COLOR_TOKENS.goldLight, fontWeight: 800, letterSpacing: 1.5 }}>
              GÓI CƯỚC MINH BẠCH & CÔNG BẰNG
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 850, letterSpacing: -1, mb: 1.5 }}>
              Khởi đầu Miễn phí, Nâng tầm với VIP Gold
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 640, mx: 'auto' }}>
              Mọi tài khoản đăng ký mới đều được tặng trọn vẹn 30 ngày trải nghiệm gói VIP Gold cao cấp nhất.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3.5, alignItems: 'stretch' }}>
            {/* Free Plan */}
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 4 },
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <TierBadgeIcon tier="free" size={34} iconSize={18} showTooltip={false} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Starter Miễn Phí
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#94A3B8', mb: 2.5 }}>
                  Cho nhu cầu ghi chép thu chi cá nhân cơ bản
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
                  0 ₫ <span style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8' }}>/vĩnh viễn</span>
                </Typography>

                <Box sx={{ display: 'grid', gap: 1.5, mb: 4, flex: 1 }}>
                  {['Quản lý 2 tài khoản/ví', '3 ngân sách chi tiêu', '1 mục tiêu tài chính', 'Ghi chép giao dịch thủ công', 'Lưu trữ cục bộ trên máy'].map((f, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, fontSize: 13, color: '#CBD5E1' }}>
                      <Check size={16} color="#34D399" />
                      <span>{f}</span>
                    </Box>
                  ))}
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigateToAuth('register', navigate)}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#FFFFFF', fontWeight: 700 }}
                >
                  Tạo tài khoản Free
                </Button>
              </Paper>
            </Box>

            {/* 30-Day VIP Gold Trial (Featured) */}
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 4 },
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: 'rgba(197, 160, 89, 0.12)',
                  border: `2px solid ${GOLD_COLOR_TOKENS.goldBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 16px 40px rgba(197, 160, 89, 0.15)'
                }}
              >
                <Chip
                  icon={<Sparkles size={13} color="#FFFFFF" />}
                  label="KHUYẾN NGHỊ TRẢI NGHIỆM"
                  sx={{
                    position: 'absolute',
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: GOLD_COLOR_TOKENS.goldMetallic,
                    color: '#09261E',
                    fontWeight: 850,
                    fontSize: 10.5
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <TierBadgeIcon tier="gold" isTrial={true} size={34} iconSize={18} showTooltip={false} />
                  <Typography variant="h6" sx={{ fontWeight: 900, color: GOLD_COLOR_TOKENS.goldLight }}>
                    VIP Gold 30 Ngày
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#E2E8F0', mb: 2.5 }}>
                  Tự động cấp toàn quyền ngay khi đăng ký
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', mb: 3 }}>
                  0 ₫ <span style={{ fontSize: 13, fontWeight: 500, color: GOLD_COLOR_TOKENS.goldLight }}>/30 ngày dùng thử</span>
                </Typography>

                <Box sx={{ display: 'grid', gap: 1.5, mb: 4, flex: 1 }}>
                  {[
                    'Toàn bộ đặc quyền gói Gold VIP cao cấp',
                    'Định giá danh mục đầu tư VN (HOSE, Vàng, Tiết kiệm)',
                    'Trợ lý WebMCP AI Assistant tương tác 2 chiều',
                    'Không cần thẻ tín dụng, không tự trừ tiền',
                    'Hết 30 ngày về Free an toàn, giữ nguyên dữ liệu'
                  ].map((f, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, fontSize: 13, color: '#FFFFFF', fontWeight: 600 }}>
                      <CheckCircle2 size={16} color={GOLD_COLOR_TOKENS.goldLight} />
                      <span>{f}</span>
                    </Box>
                  ))}
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigateToAuth('register', navigate)}
                  sx={{
                    bgcolor: GOLD_COLOR_TOKENS.goldMetallic,
                    color: '#09261E',
                    fontWeight: 850,
                    py: 1.2,
                    '&:hover': { bgcolor: GOLD_COLOR_TOKENS.goldLight }
                  }}
                >
                  Đăng ký Nhận 30 Ngày VIP Gold
                </Button>
              </Paper>
            </Box>

            {/* Gold Annual Plan */}
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 4 },
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <TierBadgeIcon tier="gold" size={34} iconSize={18} showTooltip={false} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Tích Sản VIP Gold (Năm)
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#94A3B8', mb: 2.5 }}>
                  Dành cho nhà đầu tư cá nhân & gia đình
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
                  999.000 ₫ <span style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8' }}>/năm (83k/tháng)</span>
                </Typography>

                <Box sx={{ display: 'grid', gap: 1.5, mb: 4, flex: 1 }}>
                  {[
                    'Không giới hạn tài khoản & danh mục',
                    'Theo dõi vốn đầu tư chưa thu hồi & rủi ro',
                    'Speedometer Gauges phân tích chuyên sâu',
                    'Xuất báo cáo tài chính PDF & Excel/CSV',
                    'Hỗ trợ ưu tiên 24/7 từ chuyên viên Tích Sản'
                  ].map((f, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, fontSize: 13, color: '#CBD5E1' }}>
                      <Check size={16} color="#34D399" />
                      <span>{f}</span>
                    </Box>
                  ))}
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigateToApp('/pricing', navigate)}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#FFFFFF', fontWeight: 700 }}
                >
                  Xem chi tiết bảng giá
                </Button>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 8. SECURITY & ZERO-ACCESS GUARANTEE */}
      <Box id="security" className="reveal-section" sx={{ py: { xs: 6, md: 10 }, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.15)', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2.5 }}>
            <Lock size={28} color="#34D399" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 850, fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.1rem' }, mb: 2 }}>
            Triết lý Bảo mật Local-First & Zero-Knowledge
          </Typography>
          <Typography variant="body1" sx={{ color: '#94A3B8', lineHeight: 1.8, fontSize: { xs: '0.88rem', sm: '1rem' }, mb: 4 }}>
            Tích Sản không bao giờ lưu trữ mật khẩu ngân hàng, mã OTP hay thông tin thẻ tín dụng của bạn. Toàn bộ sổ ghi chép, tài sản và danh mục được lưu trữ trực tiếp trên thiết bị của bạn với chuẩn mã hóa cao nhất. Ngay cả đội ngũ quản trị viên Tích Sản cũng không thể truy cập vào sổ sách của bạn.
          </Typography>
        </Container>
      </Box>

      {/* 9. FAQ ACCORDION */}
      <Box className="reveal-section" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'rgba(10, 17, 14, 0.75)', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" sx={{ fontWeight: 850, textAlign: 'center', mb: 6 }}>
            Câu hỏi Thường gặp
          </Typography>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {[
              {
                q: 'Gói dùng thử VIP Gold 30 ngày có yêu cầu thẻ tín dụng không?',
                a: 'Tuyệt đối không! Tích Sản không yêu cầu bạn nhập bất kỳ thông tin thanh toán nào. Khi bạn đăng ký tài khoản, hệ thống sẽ tự động kích hoạt 30 ngày trải nghiệm gói VIP Gold.'
              },
              {
                q: 'Hết 30 ngày dùng thử thì tài khoản của tôi sẽ như thế nào?',
                a: 'Sau 30 ngày, tài khoản sẽ tự động chuyển về gói Miễn Phí (Free). Toàn bộ dữ liệu bạn đã ghi chép, tài khoản, danh mục và lịch sử sẽ được bảo toàn nguyên vẹn 100%. Không có bất kỳ khoản phí ngầm nào phát sinh.'
              },
              {
                q: 'Tích Sản có chức năng nạp tiền hay giữ tiền của người dùng không?',
                a: 'Không. Tích Sản là công cụ quản lý tài sản và dòng tiền cá nhân, không phải là ví điện tử hay ngân hàng trung gian. Chúng tôi không bao giờ yêu cầu bạn nạp tiền vào hệ thống.'
              },
              {
                q: 'Làm thế nào để xuất dữ liệu khi tôi muốn sao lưu?',
                a: 'Bạn có thể xuất toàn bộ dữ liệu ra định dạng JSON, CSV hoặc Excel bất cứ lúc nào trong mục Cài đặt hệ thống chỉ với một cú nhấp chuột.'
              }
            ].map((item, idx) => (
              <Accordion
                key={idx}
                elevation={0}
                sx={{
                  bgcolor: '#0E1715',
                  color: '#FFFFFF',
                  borderRadius: '10px !important',
                  border: '1px solid rgba(255,255,255,0.08)',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary expandIcon={<ChevronDown color="#FFFFFF" size={18} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>
                    {item.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 2.5 }}>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.7 }}>
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>

      {/* 10. FOOTER & FINAL CTA */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#020504', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, mb: 2 }}>
            Sẵn sàng làm chủ dòng tiền hôm nay?
          </Typography>
          <Typography variant="body1" sx={{ color: '#94A3B8', fontSize: { xs: '0.9rem', sm: '1rem' }, mb: 4 }}>
            Đăng ký chỉ mất 30 giây. Bắt đầu ngay với 30 ngày VIP Gold hoàn toàn miễn phí.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigateToAuth('register', navigate)}
            startIcon={<Crown size={18} color="#09261E" />}
            sx={{
              bgcolor: GOLD_COLOR_TOKENS.goldMetallic,
              color: '#09261E',
              fontWeight: 850,
              fontSize: { xs: 14, sm: 15 },
              px: { xs: 3, sm: 4 },
              py: 1.5,
              borderRadius: 2.5,
              maxWidth: '100%',
              '&:hover': { bgcolor: GOLD_COLOR_TOKENS.goldLight }
            }}
          >
            Đăng Ký & Trải Nghiệm VIP Gold Ngay
          </Button>

          <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 2.5, textAlign: 'left' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ maxWidth: 460 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F8FAFC', mb: 0.5 }}>
                  TÍCH SẢN — Nền Tảng Quản Lý Tài Chính & Tích Lũy Cá Nhân
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1.6 }}>
                  Ứng dụng tài chính thông minh theo chuẩn kiến trúc Zero-Knowledge và bảo vệ dữ liệu cá nhân theo Luật 91/2025/QH15, Nghị định 356/2025/NĐ-CP và Luật Trí tuệ nhân tạo 134/2025/QH15.
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                  Liên hệ & Tiếp nhận hỗ trợ DPO: <span style={{ color: '#34D399' }}>hotro@tichsan.site</span>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, fontSize: 13, alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href="/downloads/finora-latest.apk"
                  download="Finora.apk"
                  style={{
                    color: '#34D399',
                    textDecoration: 'none',
                    fontWeight: 750,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Smartphone size={14} /> Tải App Android (APK)
                </a>
                <Link to="/legal" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Chính sách bảo mật & Pháp lý
                </Link>
                <Link to="/pricing" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Bảng giá chi tiết
                </Link>
              </Box>
            </Box>

            <Box sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                © {new Date().getFullYear()} Tích Sản Platform. Toàn bộ quyền được bảo lưu.
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569' }}>
                Phiên bản v2.0-Legal-Compliant
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* APK INSTALLATION GUIDE DIALOG */}
      <Dialog
        open={installGuideOpen}
        onClose={() => setInstallGuideOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#091511',
              color: '#F8FAFC',
              borderRadius: '24px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              p: { xs: 1, sm: 2 }
            }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  bgcolor: guideModalPlatform === 'android' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: guideModalPlatform === 'android' ? '#34D399' : '#FFFFFF'
                }}
              >
                {guideModalPlatform === 'android' ? <AndroidSvgIcon size={22} color="#34D399" /> : <AppleSvgIcon size={22} color="#FFFFFF" />}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                {guideModalPlatform === 'android' ? 'Hướng Dẫn Cài Đặt Finora APK' : 'Hướng Dẫn Ghim Finora Trên iPhone (iOS)'}
              </Typography>
            </Box>
            <IconButton onClick={() => setInstallGuideOpen(false)} sx={{ color: '#94A3B8' }}>
              <X size={20} />
            </IconButton>
          </Box>

          {/* Platform Switcher Inside Dialog */}
          <Box sx={{ display: 'flex', gap: 1, bgcolor: 'rgba(255,255,255,0.05)', p: 0.5, borderRadius: '12px' }}>
            <Button
              fullWidth
              size="small"
              onClick={() => setGuideModalPlatform('android')}
              startIcon={<AndroidSvgIcon size={16} color={guideModalPlatform === 'android' ? '#FFFFFF' : '#34D399'} />}
              sx={{
                borderRadius: '8px',
                py: 0.7,
                fontWeight: 750,
                fontSize: '0.8rem',
                textTransform: 'none',
                bgcolor: guideModalPlatform === 'android' ? '#059669' : 'transparent',
                color: guideModalPlatform === 'android' ? '#FFFFFF' : '#94A3B8'
              }}
            >
              Android (APK)
            </Button>
            <Button
              fullWidth
              size="small"
              onClick={() => setGuideModalPlatform('ios')}
              startIcon={<AppleSvgIcon size={16} color={guideModalPlatform === 'ios' ? '#FFFFFF' : '#CBD5E1'} />}
              sx={{
                borderRadius: '8px',
                py: 0.7,
                fontWeight: 750,
                fontSize: '0.8rem',
                textTransform: 'none',
                bgcolor: guideModalPlatform === 'ios' ? '#334155' : 'transparent',
                color: guideModalPlatform === 'ios' ? '#FFFFFF' : '#94A3B8'
              }}
            >
              Apple iOS (Safari)
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {guideModalPlatform === 'android' ? (
            <>
              {/* Android Note Box */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: '14px',
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  gap: 1.5
                }}
              >
                <ShieldCheck size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <Typography variant="body2" sx={{ color: '#FCD34D', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <strong>Lưu ý bảo mật:</strong> Do Finora được phân phối trực tiếp dưới dạng file APK nội bộ sạch, Android sẽ hiển thị cảnh báo tiêu chuẩn đối với nguồn ngoài Google Play. Ứng dụng an toàn 100% và không chứa mã độc.
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {[
                  {
                    num: '1',
                    title: 'Tải file Finora-TichSan.apk',
                    desc: 'Nhấn nút "Tải APK" trên trang web hoặc quét mã QR bằng camera. Trình duyệt sẽ lưu file vào thư mục Tải về (Downloads).'
                  },
                  {
                    num: '2',
                    title: 'Xác nhận tải file ("Vẫn tải xuống")',
                    desc: 'Nếu trình duyệt Chrome hiển thị thông báo "Tệp có thể gây hại", hãy chọn "Vẫn tải xuống" (Download anyway) để tiếp tục.'
                  },
                  {
                    num: '3',
                    title: 'Cho phép cài đặt từ nguồn này',
                    desc: 'Khi mở file, nếu điện thoại yêu cầu quyền cài đặt ứng dụng không rõ nguồn gốc, hãy nhấn "Cài đặt" (Settings) và gạt bật "Cho phép từ nguồn này".'
                  },
                  {
                    num: '4',
                    title: 'Nhấn Cài Đặt & Trải nghiệm',
                    desc: 'Hệ điều hành sẽ tiến hành cài đặt trong vài giây. Biểu tượng Finora sẽ xuất hiện ngay trên màn hình chính!'
                  }
                ].map((step, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: 'rgba(16, 185, 129, 0.25)',
                        color: '#34D399',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}
                    >
                      {step.num}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem', mb: 0.3 }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                        {step.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <>
              {/* iOS PWA Note Box */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: '14px',
                  bgcolor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  gap: 1.5
                }}
              >
                <AppleSvgIcon size={20} color="#38BDF8" className="flex-shrink-0 mt-0.5" />
                <Typography variant="body2" sx={{ color: '#BAE6FD', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <strong>Chuẩn Apple PWA:</strong> Trên iOS (iPhone/iPad), Apple hỗ trợ cài đặt trực tiếp từ trình duyệt Safari vào Màn hình chính mà không cần qua App Store, chạy mượt toàn màn hình và tự động đồng bộ.
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {[
                  {
                    num: '1',
                    title: 'Mở bằng trình duyệt Safari',
                    desc: 'Hãy chắc chắn rằng bạn đang mở Finora bằng trình duyệt Safari mặc định trên iPhone/iPad.'
                  },
                  {
                    num: '2',
                    title: 'Nhấn nút Chia sẻ (Share)',
                    desc: (
                      <span>
                        Nhấn vào biểu tượng Chia sẻ <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#38BDF8' }} /> (hình vuông có mũi tên chỉ lên) ở thanh công cụ dưới cùng Safari.
                      </span>
                    )
                  },
                  {
                    num: '3',
                    title: 'Chọn "Thêm vào MH chính" (Add to Home Screen)',
                    desc: 'Cuộn xuống menu các tùy chọn và bấm vào "Thêm vào MH chính" (biểu tượng hình vuông có dấu cộng).'
                  },
                  {
                    num: '4',
                    title: 'Nhấn "Thêm" (Add) ở góc phải trên',
                    desc: 'Biểu tượng Finora sẽ xuất hiện ngay trên Màn hình chính. Nhấn vào để mở ứng dụng toàn màn hình không có thanh địa chỉ Safari!'
                  }
                ].map((step, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: 'rgba(56, 189, 248, 0.2)',
                        color: '#38BDF8',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}
                    >
                      {step.num}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem', mb: 0.3 }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                        {step.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)', gap: 1 }}>
          <Button
            variant="text"
            onClick={() => setInstallGuideOpen(false)}
            sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'none' }}
          >
            Đóng
          </Button>
          {guideModalPlatform === 'android' ? (
            <Button
              component="a"
              href="/downloads/finora-latest.apk"
              download="Finora-TichSan.apk"
              variant="contained"
              startIcon={<DownloadCloud size={18} />}
              onClick={() => setInstallGuideOpen(false)}
              sx={{
                bgcolor: '#10B981',
                color: '#FFFFFF',
                fontWeight: 800,
                textTransform: 'none',
                px: 3,
                borderRadius: '12px',
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              Tải Bản APK (12 MB)
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<ExternalLink size={18} />}
              onClick={() => {
                setInstallGuideOpen(false);
                navigateToAuth('register', navigate);
              }}
              sx={{
                bgcolor: '#0284C7',
                color: '#FFFFFF',
                fontWeight: 800,
                textTransform: 'none',
                px: 3,
                borderRadius: '12px',
                '&:hover': { bgcolor: '#0369A1' }
              }}
            >
              Mở Ứng Dụng Ngay
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
