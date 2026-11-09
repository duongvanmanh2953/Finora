import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
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
  DialogActions
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [gaugeDemoScore, setGaugeDemoScore] = useState<number>(85);
  const [activeFilterTab, setActiveFilterTab] = useState<string>('all');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [installGuideOpen, setInstallGuideOpen] = useState<boolean>(false);
  const [downloadPlatform, setDownloadPlatform] = useState<'android' | 'ios'>('android');
  const [guideModalPlatform, setGuideModalPlatform] = useState<'android' | 'ios'>('android');

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
          bgcolor: 'rgba(3, 7, 6, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          px: { xs: 2, sm: 3, md: 6 },
          py: 1.5
        }}
      >
        <Box sx={{ maxWidth: 1240, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/landing" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Box
              component="img"
              src="/logo.png?v=20261105"
              alt="Finora"
              sx={{
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                objectFit: 'contain'
              }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.5, color: '#FFFFFF', lineHeight: 1.1, fontSize: { xs: 16, sm: 18 } }}>
                Finora <span style={{ color: '#34D399', fontWeight: 700, fontSize: '0.85em' }}>· Tích Sản</span>
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '10px', fontWeight: 600, display: { xs: 'none', sm: 'block' }, letterSpacing: '0.02em' }}>
                Quản lý dòng tiền & Tích lũy tài sản
              </Typography>
            </Box>
          </Link>

          {/* Desktop Nav Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3, fontSize: 13.5, fontWeight: 650 }}>
            <a href="#quick-solutions" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.2s' }}>
              Giải pháp nhanh
            </a>
            <a href="#overview" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.2s' }}>
              7 Thẻ Dòng tiền
            </a>
            <a href="#gauges" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.2s' }}>
              Đồng hồ Bán nguyệt
            </a>
            <a href="#app-download" style={{ color: '#34D399', textDecoration: 'none', fontWeight: 750, transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <AndroidSvgIcon size={16} color="#34D399" />
              <AppleSvgIcon size={16} color="#E2E8F0" />
              <span>Tải App Android & iOS</span>
            </a>
            <a href="#pricing" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.2s' }}>
              Bảng giá & Trial
            </a>
          </Box>

          {/* Actions: Desktop & Mobile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            {/* Download App Pill for Desktop & Tablet */}
            <Button
              component="a"
              href="#app-download"
              variant="outlined"
              size="small"
              startIcon={<AndroidSvgIcon size={15} color="#34D399" />}
              endIcon={<AppleSvgIcon size={14} color="#E2E8F0" />}
              sx={{
                borderColor: 'rgba(52, 211, 153, 0.45)',
                color: '#34D399',
                fontSize: 12,
                fontWeight: 750,
                borderRadius: '8px',
                px: 1.5,
                bgcolor: 'rgba(16, 185, 129, 0.08)',
                display: { xs: 'none', sm: 'inline-flex' },
                '&:hover': { borderColor: '#34D399', bgcolor: 'rgba(52, 211, 153, 0.16)' }
              }}
            >
              Tải App
            </Button>

            {/* Login button */}
            <Button
              variant="text"
              onClick={() => navigate('/auth/login')}
              sx={{ color: '#FFFFFF', fontSize: { xs: 12.5, sm: 13 }, fontWeight: 700, px: { xs: 1, sm: 1.5 } }}
            >
              Đăng nhập
            </Button>

            {/* Trial Gold Button */}
            <Button
              variant="contained"
              onClick={() => navigate('/auth/register')}
              startIcon={<Crown size={14} color="#09261E" />}
              sx={{
                bgcolor: GOLD_COLOR_TOKENS.goldMetallic,
                color: '#09261E',
                fontSize: { xs: 12, sm: 13 },
                fontWeight: 850,
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 0.9 },
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(197, 160, 89, 0.35)',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: GOLD_COLOR_TOKENS.goldLight }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Thử VIP Gold 30 Ngày</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Thử Gold</Box>
            </Button>

            {/* Hamburger Button for Mobile */}
            <IconButton
              onClick={() => setMobileDrawerOpen(true)}
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                color: '#FFFFFF',
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                p: 0.8,
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
              width: '82%',
              maxWidth: 320,
              bgcolor: '#091310',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }
          }
        }}
      >
        <Box>
          {/* Drawer Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2.5, mb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <img src="/logo.png?v=20261105" alt="Finora" style={{ width: 30, height: 30, borderRadius: 6 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#FFFFFF' }}>
                Finora · Tích Sản
              </Typography>
            </Box>
            <IconButton onClick={() => setMobileDrawerOpen(false)} sx={{ color: '#94A3B8', p: 0.5 }}>
              <X size={20} />
            </IconButton>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Button
            component="a"
            href="/downloads/finora-latest.apk"
            download="Finora-TichSan.apk"
            fullWidth
            variant="contained"
            startIcon={<AndroidSvgIcon size={18} color="#FFFFFF" />}
            sx={{
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              py: 1.25,
              borderRadius: 2
            }}
          >
            Tải APK Android (13 MB)
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setMobileDrawerOpen(false);
              setGuideModalPlatform('ios');
              setInstallGuideOpen(true);
            }}
            startIcon={<AppleSvgIcon size={18} color="#FFFFFF" />}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              fontWeight: 750,
              py: 1.1,
              borderRadius: 2,
              '&:hover': {
                borderColor: '#FFFFFF',
                bgcolor: 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            Cài đặt cho iOS (iPhone)
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              navigate('/auth/register');
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
              navigate('/auth/login');
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

        {/* CTA Buttons (Mobile Stack / Desktop Row) */}
        <Box
          className="hero-anim"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 1.5, sm: 2 },
            mb: { xs: 5, md: 7 },
            width: '100%',
            maxWidth: { xs: 380, sm: 'none' },
            mx: 'auto'
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/auth/register')}
            endIcon={<ArrowRight size={18} />}
            sx={{
              backgroundColor: GOLD_COLOR_TOKENS.goldMetallic,
              color: '#09261E',
              fontWeight: 850,
              fontSize: { xs: 14.5, sm: 15 },
              px: { xs: 3, sm: 3.8 },
              py: { xs: 1.5, sm: 1.45 },
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2.5,
              boxShadow: '0 10px 30px rgba(197, 160, 89, 0.4)',
              '&:hover': { backgroundColor: GOLD_COLOR_TOKENS.goldLight }
            }}
          >
            Nhận 30 Ngày VIP Gold Miễn Phí
          </Button>

          {/* Android APK Download Button */}
          <Button
            component="a"
            href="/downloads/finora-latest.apk"
            download="Finora-TichSan.apk"
            variant="contained"
            size="large"
            startIcon={<AndroidSvgIcon size={22} color="#34D399" />}
            sx={{
              background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: { xs: 14, sm: 15 },
              px: { xs: 2.2, sm: 2.8 },
              py: { xs: 1.25, sm: 1.25 },
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2.5,
              boxShadow: '0 10px 25px rgba(5, 150, 105, 0.35)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'left',
              '&:hover': {
                background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                boxShadow: '0 12px 30px rgba(16, 185, 129, 0.45)'
              }
            }}
          >
            <Box sx={{ ml: 0.5 }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Bản Android (.APK)
              </Typography>
              <Typography sx={{ fontSize: { xs: 13.5, sm: 14.5 }, fontWeight: 850, lineHeight: 1.2 }}>
                Tải File APK (13 MB)
              </Typography>
            </Box>
          </Button>

          {/* iOS Web App / PWA Button */}
          <Button
            component="a"
            href="#app-download"
            onClick={() => {
              setDownloadPlatform('ios');
            }}
            variant="contained"
            size="large"
            startIcon={<AppleSvgIcon size={22} color="#FFFFFF" />}
            sx={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: { xs: 14, sm: 15 },
              px: { xs: 2.2, sm: 2.8 },
              py: { xs: 1.25, sm: 1.25 },
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2.5,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'left',
              '&:hover': {
                background: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
                borderColor: 'rgba(255, 255, 255, 0.35)'
              }
            }}
          >
            <Box sx={{ ml: 0.5 }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Dành Cho iPhone / iPad
              </Typography>
              <Typography sx={{ fontSize: { xs: 13.5, sm: 14.5 }, fontWeight: 850, lineHeight: 1.2 }}>
                Cài Đặt Trên iOS
              </Typography>
            </Box>
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/')}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: { xs: 14, sm: 15 },
              px: { xs: 3, sm: 3.2 },
              py: { xs: 1.4, sm: 1.45 },
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2.5,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' }
            }}
          >
            Khám phá Demo
          </Button>
        </Box>

        {/* Small Guide & QR Jump */}
        <Box className="hero-anim" sx={{ mb: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <a
            href="#app-download"
            style={{
              color: '#34D399',
              fontSize: 12.5,
              fontWeight: 750,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(16, 185, 129, 0.08)',
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid rgba(52, 211, 153, 0.25)'
            }}
          >
            <QrCode size={14} /> Quét mã QR & Hướng dẫn cài đặt Android & iOS 30s →
          </a>
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
          py: 10,
          bgcolor: 'rgba(10, 17, 14, 0.75)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
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
      <Box id="overview" className="reveal-section" sx={{ py: 11, position: 'relative', zIndex: 1 }}>
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
          py: 12,
          bgcolor: 'rgba(10, 17, 14, 0.75)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 6, alignItems: 'center' }}>
            <Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 50, bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', mb: 2 }}>
                <Activity size={14} />
                <Typography variant="caption" sx={{ fontWeight: 800 }}>CHUẨN MỰC CHẨN ĐOÁN SỨC KHỎE TÀI CHÍNH</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 850, letterSpacing: -1, mb: 2 }}>
                Speedometer Gauges — Kim Khóa Trục & Sáng Vùng Chỉ Định
              </Typography>
              <Typography variant="body1" sx={{ color: '#94A3B8', lineHeight: 1.8, mb: 3 }}>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#F1F5F9' }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Interactive Gauge Slider demo */}
              <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                p: { xs: 3, sm: 5 },
                borderRadius: 4,
                bgcolor: '#091310',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1 }}>
                Chỉ Số Sức Khỏe Toàn Diện (Tích Sản Health)
              </Typography>
              <SemiCircleGauge score={gaugeDemoScore} size={310} title="Sức Khỏe Tài Chính" />
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* 6. AI COPILOT SECTION (WEBMCP INTEGRATION) */}
      <Box id="copilot" className="reveal-section" sx={{ py: 12, position: 'relative', zIndex: 1 }}>
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
      <Box id="reviews" className="reveal-section" sx={{ py: 12, position: 'relative', zIndex: 1 }}>
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

      {/* 6.5 DEDICATED APP DOWNLOAD SHOWCASE SECTION */}
      <Box
        id="app-download"
        className="reveal-section"
        sx={{
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(3, 7, 6, 0.95) 0%, rgba(6, 26, 18, 0.7) 50%, rgba(3, 7, 6, 0.95) 100%)',
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
            width: { xs: 320, md: 700 },
            height: { xs: 320, md: 500 },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none'
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
              <Chip
                icon={<Smartphone size={16} color="#34D399" />}
                label="ỨNG DỤNG DI ĐỘNG CHÍNH THỨC · v1.0.0"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  px: 1.5,
                  py: 2.2,
                  borderRadius: '999px'
                }}
              />
            </Box>

            {/* Platform Toggle Pills */}
            <Box sx={{ display: 'inline-flex', p: 0.6, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
              <Button
                size="small"
                onClick={() => setDownloadPlatform('android')}
                startIcon={<AndroidSvgIcon size={18} color={downloadPlatform === 'android' ? '#FFFFFF' : '#34D399'} />}
                sx={{
                  borderRadius: '12px',
                  px: { xs: 2, sm: 2.5 },
                  py: 0.8,
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  bgcolor: downloadPlatform === 'android' ? '#059669' : 'transparent',
                  color: downloadPlatform === 'android' ? '#FFFFFF' : '#94A3B8',
                  boxShadow: downloadPlatform === 'android' ? '0 4px 15px rgba(5, 150, 105, 0.4)' : 'none',
                  '&:hover': { bgcolor: downloadPlatform === 'android' ? '#047857' : 'rgba(255,255,255,0.06)' }
                }}
              >
                Bản Android (.APK)
              </Button>
              <Button
                size="small"
                onClick={() => setDownloadPlatform('ios')}
                startIcon={<AppleSvgIcon size={18} color={downloadPlatform === 'ios' ? '#FFFFFF' : '#CBD5E1'} />}
                sx={{
                  borderRadius: '12px',
                  px: { xs: 2, sm: 2.5 },
                  py: 0.8,
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  bgcolor: downloadPlatform === 'ios' ? '#334155' : 'transparent',
                  color: downloadPlatform === 'ios' ? '#FFFFFF' : '#94A3B8',
                  boxShadow: downloadPlatform === 'ios' ? '0 4px 15px rgba(51, 65, 85, 0.4)' : 'none',
                  '&:hover': { bgcolor: downloadPlatform === 'ios' ? '#1E293B' : 'rgba(255,255,255,0.06)' }
                }}
              >
                Bản iOS (iPhone / iPad)
              </Button>
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.85rem', sm: '2.5rem', md: '3.2rem' },
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#FFFFFF',
                mb: 2,
                letterSpacing: '-0.02em'
              }}
            >
              Trải Nghiệm Finora Mượt Mà{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #F59E0B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Ngay Trên Smartphone
              </Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#94A3B8',
                maxWidth: 720,
                mx: 'auto',
                fontSize: { xs: '0.95rem', md: '1.1rem' },
                lineHeight: 1.6
              }}
            >
              Mở app trong chớp mắt, quản lý tài chính chuẩn mực mọi lúc mọi nơi kể cả khi không có kết nối internet. Không quảng cáo, 100% dữ liệu bảo mật trên máy bạn.
            </Typography>
          </Box>

          {/* Main 2-column Showcase */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' },
              gap: { xs: 4, md: 5 },
              alignItems: 'stretch'
            }}
          >
            {/* Left Card: App Profile & Highlights */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4, md: 5 },
                borderRadius: '24px',
                background: 'rgba(12, 20, 16, 0.85)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                {/* App Brand Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2.5,
                    pb: 3,
                    mb: 3.5,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <Box
                    component="img"
                    src="/logo.png"
                    alt="Finora Logo"
                    sx={{
                      width: { xs: 68, sm: 76 },
                      height: { xs: 68, sm: 76 },
                      borderRadius: '20px',
                      p: 1.2,
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0.4) 100%)',
                      border: '1.5px solid rgba(52, 211, 153, 0.4)',
                      boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
                      objectFit: 'contain'
                    }}
                  />
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', fontSize: { xs: '1.4rem', sm: '1.75rem' } }}>
                        Finora - Tích Sản
                      </Typography>
                      <Chip
                        size="small"
                        label="v1.0.0 Stable"
                        sx={{
                          bgcolor: 'rgba(52, 211, 153, 0.15)',
                          color: '#34D399',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          border: '1px solid rgba(52, 211, 153, 0.3)'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {downloadPlatform === 'android' ? (
                        <>
                          <span>Dung lượng: <strong>~24 MB</strong></span>
                          <span>•</span>
                          <span>Yêu cầu: <strong>Android 7.0+</strong></span>
                          <span>•</span>
                          <span style={{ color: '#34D399', fontWeight: 600 }}>Miễn phí 100%</span>
                        </>
                      ) : (
                        <>
                          <span>Chuẩn: <strong>PWA Web App</strong></span>
                          <span>•</span>
                          <span>Yêu cầu: <strong>iOS 15+ (Safari)</strong></span>
                          <span>•</span>
                          <span style={{ color: '#38BDF8', fontWeight: 600 }}>Zero Cài Đặt · Không Tốn Bộ Nhớ</span>
                        </>
                      )}
                    </Typography>
                  </Box>
                </Box>

                {/* Key App Features */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 4 }}>
                  {[
                    {
                      icon: Zap,
                      title: 'Khởi động 0.2s',
                      desc: downloadPlatform === 'android' ? 'Không cần load trình duyệt, mở là ghi nhận thu chi ngay.' : 'Khởi chạy toàn màn hình từ Home Screen như ứng dụng Native.',
                      color: '#F59E0B'
                    },
                    {
                      icon: ShieldCheck,
                      title: 'Bảo Mật Local-First',
                      desc: 'Dữ liệu được lưu trữ trực tiếp trên thiết bị của bạn, bảo mật tuyệt đối.',
                      color: '#10B981'
                    },
                    {
                      icon: Activity,
                      title: 'Đồng Hồ Sức Khỏe',
                      desc: 'Theo dõi 6 chỉ số dòng tiền trực quan qua bán nguyệt tương tác.',
                      color: '#38BDF8'
                    },
                    {
                      icon: EyeOff,
                      title: 'Zero-Telemetry',
                      desc: 'Không gắn mã theo dõi quảng cáo, tôn trọng quyền riêng tư 100%.',
                      color: '#A78BFA'
                    }
                  ].map((feat, idx) => {
                    const FeatIcon = feat.icon;
                    return (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          borderRadius: '16px',
                          bgcolor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(16, 185, 129, 0.3)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '8px',
                              bgcolor: `${feat.color}20`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: feat.color
                            }}
                          >
                            <FeatIcon size={18} />
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                            {feat.title}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8', lineHeight: 1.5, display: 'block' }}>
                          {feat.desc}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  pt: 2,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {downloadPlatform === 'android' ? (
                  <>
                    <Button
                      component="a"
                      href="/downloads/finora-latest.apk"
                      download="Finora-TichSan.apk"
                      variant="contained"
                      startIcon={<DownloadCloud size={20} />}
                      sx={{
                        flex: 1.3,
                        py: 1.8,
                        px: 3,
                        borderRadius: '14px',
                        fontWeight: 800,
                        fontSize: '1rem',
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                        color: '#FFFFFF',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                          boxShadow: '0 12px 30px rgba(16, 185, 129, 0.55)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.25s ease'
                      }}
                    >
                      TẢI FINORA CHO ANDROID (.APK)
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => {
                        setGuideModalPlatform('android');
                        setInstallGuideOpen(true);
                      }}
                      startIcon={<HelpCircle size={18} />}
                      sx={{
                        flex: 1,
                        py: 1.8,
                        px: 2.5,
                        borderRadius: '14px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        color: '#E2E8F0',
                        '&:hover': {
                          borderColor: '#34D399',
                          bgcolor: 'rgba(52, 211, 153, 0.08)'
                        }
                      }}
                    >
                      Cách Cài Đặt APK
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      component={Link}
                      to="/auth/register"
                      variant="contained"
                      startIcon={<ExternalLink size={20} />}
                      sx={{
                        flex: 1.3,
                        py: 1.8,
                        px: 3,
                        borderRadius: '14px',
                        fontWeight: 800,
                        fontSize: '1rem',
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #334155 0%, #0F172A 100%)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #475569 0%, #1E293B 100%)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.25s ease'
                      }}
                    >
                      MỞ APP TRÊN SAFARI (iOS)
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => {
                        setGuideModalPlatform('ios');
                        setInstallGuideOpen(true);
                      }}
                      startIcon={<HelpCircle size={18} />}
                      sx={{
                        flex: 1,
                        py: 1.8,
                        px: 2.5,
                        borderRadius: '14px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        color: '#E2E8F0',
                        '&:hover': {
                          borderColor: '#38BDF8',
                          bgcolor: 'rgba(56, 189, 248, 0.08)'
                        }
                      }}
                    >
                      4 Bước Ghim Màn Hình iOS
                    </Button>
                  </>
                )}
              </Box>
            </Paper>

            {/* Right Card: QR Scan & 3-Step Quick Guide */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: '24px',
                background: 'rgba(12, 20, 16, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                justifyContent: 'center'
              }}
            >
              {/* QR Code Container */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '20px',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                  mb: 3,
                  position: 'relative'
                }}
              >
                <Box
                  component="img"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    typeof window !== 'undefined'
                      ? window.location.origin + '/downloads/finora-latest.apk'
                      : 'https://finora.app/downloads/finora-latest.apk'
                  )}&color=064e3b&margin=6`}
                  alt="QR Code Tải Finora APK"
                  onError={(e: any) => {
                    // Fallback to static direct link notice if offline or API blocked
                    e.currentTarget.style.display = 'none';
                  }}
                  sx={{
                    width: { xs: 170, sm: 190 },
                    height: { xs: 170, sm: 190 },
                    display: 'block'
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <QrCode size={18} color="#34D399" />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.1rem' }}>
                  Quét Mã Để Tải Ngay
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3.5, maxWidth: 280, fontSize: '0.85rem' }}>
                Bật Camera điện thoại Android và hướng vào mã QR để bắt đầu tải file APK tự động.
              </Typography>

              {/* 3 Quick Step Pills */}
              <Box sx={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Quy trình cài đặt 3 bước:
                </Typography>
                {[
                  { step: '1', title: 'Tải file APK', desc: 'Nhấn nút Tải hoặc quét mã QR phía trên' },
                  { step: '2', title: 'Xác nhận cài đặt', desc: 'Chọn "Vẫn tải xuống" & "Cho phép cài đặt từ nguồn này"' },
                  { step: '3', title: 'Mở app & Quản lý', desc: 'Đăng nhập hoặc tạo sổ tài chính bắt đầu tích sản' }
                ].map((s, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.2,
                      px: 2,
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: 'rgba(16, 185, 129, 0.2)',
                        color: '#34D399',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {s.step}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.2 }}>
                        {s.title}
                      </Typography>
                      <Typography variant="caption" noWrap sx={{ color: '#94A3B8', fontSize: '0.72rem', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>
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
          py: 12,
          bgcolor: 'rgba(10, 17, 14, 0.75)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
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
                  onClick={() => navigate('/auth/register')}
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
                  onClick={() => navigate('/auth/register')}
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
                  onClick={() => navigate('/pricing')}
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
      <Box id="security" className="reveal-section" sx={{ py: 10, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.15)', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2.5 }}>
            <Lock size={28} color="#34D399" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 850, mb: 2 }}>
            Triết lý Bảo mật Local-First & Zero-Knowledge
          </Typography>
          <Typography variant="body1" sx={{ color: '#94A3B8', lineHeight: 1.8, mb: 4 }}>
            Tích Sản không bao giờ lưu trữ mật khẩu ngân hàng, mã OTP hay thông tin thẻ tín dụng của bạn. Toàn bộ sổ ghi chép, tài sản và danh mục được lưu trữ trực tiếp trên thiết bị của bạn với chuẩn mã hóa cao nhất. Ngay cả đội ngũ quản trị viên Tích Sản cũng không thể truy cập vào sổ sách của bạn.
          </Typography>
        </Container>
      </Box>

      {/* 9. FAQ ACCORDION */}
      <Box className="reveal-section" sx={{ py: 10, bgcolor: 'rgba(10, 17, 14, 0.75)', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }}>
        <Container maxWidth="md">
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
      <Box sx={{ py: 10, bgcolor: '#020504', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>
            Sẵn sàng làm chủ dòng tiền hôm nay?
          </Typography>
          <Typography variant="body1" sx={{ color: '#94A3B8', mb: 4 }}>
            Đăng ký chỉ mất 30 giây. Bắt đầu ngay với 30 ngày VIP Gold hoàn toàn miễn phí.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/auth/register')}
            startIcon={<Crown size={18} color="#09261E" />}
            sx={{
              bgcolor: GOLD_COLOR_TOKENS.goldMetallic,
              color: '#09261E',
              fontWeight: 850,
              fontSize: 15,
              px: 4,
              py: 1.5,
              borderRadius: 2.5,
              '&:hover': { bgcolor: GOLD_COLOR_TOKENS.goldLight }
            }}
          >
            Đăng Ký & Trải Nghiệm VIP Gold Ngay
          </Button>

          <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              © {new Date().getFullYear()} Tích Sản Platform. Bản quyền thuộc về Tích Sản Team.
            </Typography>
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
              Tải Ngay APK (24 MB)
            </Button>
          ) : (
            <Button
              component={Link}
              to="/auth/register"
              variant="contained"
              startIcon={<ExternalLink size={18} />}
              onClick={() => setInstallGuideOpen(false)}
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
