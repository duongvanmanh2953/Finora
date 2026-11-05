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
  Smartphone
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
  Container
} from '@mui/material';
import { SemiCircleGauge } from '../../components/gauges/SemiCircleGauge';
import { GOLD_COLOR_TOKENS } from '../../lib/subscription';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
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
      {/* ATMOSPHERIC GRADIENTS & DEEP OBSIDIAN PLANES */}
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
            radial-gradient(ellipse 90% 60% at 50% -10%, rgba(124, 58, 237, 0.18) 0%, rgba(3, 7, 6, 0) 70%),
            radial-gradient(circle 700px at 85% 30%, rgba(16, 185, 129, 0.08) 0%, rgba(3, 7, 6, 0) 65%),
            radial-gradient(circle 800px at 15% 75%, rgba(124, 58, 237, 0.1) 0%, rgba(3, 7, 6, 0) 70%)
          `
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
          bgcolor: 'rgba(3, 7, 6, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          px: { xs: 2.5, md: 6 },
          py: 1.8
        }}
      >
        <Box sx={{ maxWidth: 1240, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/landing" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Tích Sản" style={{ width: 34, height: 34, borderRadius: 8, boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#FFFFFF' }}>
              Tích Sản
            </Typography>
          </Link>

          {/* Desktop Nav Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3.5, fontSize: 13.5, fontWeight: 600 }}>
            <a href="#quick-solutions" style={{ color: '#E2E8F0', textDecoration: 'none' }}>
              Giải pháp nhanh
            </a>
            <a href="#overview" style={{ color: '#E2E8F0', textDecoration: 'none' }}>
              7 Thẻ Dòng tiền
            </a>
            <a href="#gauges" style={{ color: '#E2E8F0', textDecoration: 'none' }}>
              Đồng hồ Bán nguyệt
            </a>
            <a href="#copilot" style={{ color: '#E2E8F0', textDecoration: 'none' }}>
              AI WebMCP
            </a>
            <a href="#pricing" style={{ color: '#E2E8F0', textDecoration: 'none' }}>
              Bảng giá & Trial
            </a>
          </Box>

          {/* Auth Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="text"
              onClick={() => navigate('/auth/login')}
              sx={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}
            >
              Đăng nhập
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/auth/register')}
              startIcon={<Crown size={15} color="#09261E" />}
              sx={{
                bgcolor: GOLD_COLOR_TOKENS.goldMetallic,
                color: '#09261E',
                fontSize: 13,
                fontWeight: 850,
                px: 2,
                py: 0.9,
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(197, 160, 89, 0.35)',
                '&:hover': { bgcolor: GOLD_COLOR_TOKENS.goldLight }
              }}
            >
              Thử VIP Gold 30 Ngày
            </Button>
          </Box>
        </Box>
      </Box>

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
            fontSize: { xs: '2.5rem', sm: '3.6rem', md: '4.75rem' },
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1.1,
            maxWidth: 980,
            mx: 'auto',
            mb: 3
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
            fontSize: { xs: 16, sm: 19 },
            color: '#94A3B8',
            maxWidth: 720,
            mx: 'auto',
            lineHeight: 1.7,
            mb: 5
          }}
        >
          Hệ thống tài chính cá nhân toàn diện: Đồng hồ Bán nguyệt GSAP chuẩn xác, bóc tách vốn đầu tư Tím trần và Trợ lý AI WebMCP 1-chạm — minh bạch, tự động và bảo mật local-first.
        </Typography>

        {/* CTA Buttons */}
        <Box className="hero-anim" sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 8 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/auth/register')}
            endIcon={<ArrowRight size={18} />}
            sx={{
              backgroundColor: GOLD_COLOR_TOKENS.goldMetallic,
              color: '#09261E',
              fontWeight: 850,
              fontSize: 15,
              px: 3.8,
              py: 1.45,
              borderRadius: 2.5,
              boxShadow: '0 10px 30px rgba(197, 160, 89, 0.4)',
              '&:hover': { backgroundColor: GOLD_COLOR_TOKENS.goldLight }
            }}
          >
            Nhận 30 Ngày VIP Gold Miễn Phí
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/')}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 15,
              px: 3.5,
              py: 1.45,
              borderRadius: 2.5,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' }
            }}
          >
            Khám phá Bản Demo Trực tiếp
          </Button>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.2, mt: 3, flexWrap: 'wrap' }}>
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
                    fontSize: 12.5,
                    fontWeight: 750,
                    borderRadius: 50,
                    px: 2,
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
                  p: 4,
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Starter Miễn Phí
                </Typography>
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
                  p: 4,
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Crown size={20} color={GOLD_COLOR_TOKENS.goldMetallic} />
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
                  p: 4,
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Tích Sản VIP Gold (Năm)
                </Typography>
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
            <Box sx={{ display: 'flex', gap: 3, fontSize: 13 }}>
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
    </Box>
  );
}
