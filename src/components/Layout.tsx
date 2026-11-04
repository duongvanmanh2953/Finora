import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CircleDollarSign,
  ChartNoAxesCombined,
  Target,
  HandCoins,
  CalendarClock,
  Settings,
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  Plus,
  ChartPie,
  Search,
  Crown,
  Flame,
  CheckCircle,
  TrendingUp,
  Bot,
  HardDrive,
  Cloud,
  Banknote,
  Server,
  FileSpreadsheet,
  Star,
  Lock
} from 'lucide-react';
import {
  Button,
  Chip,
  Snackbar,
  Alert,
  Tooltip,
  Box,
  IconButton,
  InputBase
} from '@mui/material';
import { useFinance } from '../store';
import {
  isProUser,
  isGoldUser,
  isTrialActive,
  getTrialDaysRemaining,
  GOLD_COLOR_TOKENS
} from '../lib/subscription';
import { updateStreak, autoExecuteRecurring } from '../lib/habit';
import { todayKey, uid } from '../lib/finance';
import { PricingDialog } from './PricingDialog';
import { AiAssistantDrawer } from './AiAssistantDrawer';
import { CloudSyncModal } from './CloudSyncModal';

export interface NavItemConfig {
  url: string;
  label: string;
  icon: any;
  isPro?: boolean;
  subItems?: { url: string; label: string }[];
}

const navOverview: NavItemConfig[] = [
  { url: '/', label: 'Tổng quan', icon: LayoutDashboard }
];

const navFinance: NavItemConfig[] = [
  { url: '/transactions', label: 'Giao dịch', icon: ArrowLeftRight },
  { url: '/accounts', label: 'Tài khoản & Ví', icon: Wallet },
  { url: '/budgets', label: 'Ngân sách', icon: ChartPie },
  { url: '/categories', label: 'Danh mục thu chi', icon: CircleDollarSign },
  { url: '/payroll', label: 'Lương & Thuế', icon: Banknote, isPro: true }
];

const navWealth: NavItemConfig[] = [
  { url: '/assets', label: 'Tài sản & Đầu tư', icon: TrendingUp, isPro: true },
  { url: '/savings', label: 'Mục tiêu tiết kiệm', icon: Target },
  { url: '/debts', label: 'Quản lý nợ & Cho vay', icon: HandCoins }
];

const navSystem: NavItemConfig[] = [
  { url: '/reports', label: 'Báo cáo & Phân tích', icon: ChartNoAxesCombined, isPro: true },
  { url: '/recurring', label: 'Giao dịch định kỳ', icon: CalendarClock, isPro: true },
  { url: '/pricing', label: 'Bảng giá & Gói cước', icon: Crown },
  { url: '/settings', label: 'Cài đặt hệ thống', icon: Settings }
];

const allNavItems: NavItemConfig[] = [
  ...navOverview,
  ...navFinance,
  ...navWealth,
  ...navSystem
];

const nav = allNavItems.map(n => [n.url, n.label, n.icon] as const);

export function Layout() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notis, setNotis] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [cloudSyncOpen, setCloudSyncOpen] = useState(false);
  const {
    data,
    theme,
    setTheme,
    toast,
    clearToast,
    update,
    notify,
    pricingOpen,
    pricingFeature,
    openPricing,
    closePricing
  } = useFinance();
  const loc = useLocation();
  const navigate = useNavigate();

  const title = nav.find(n => n[0] === loc.pathname)?.[1] || 'Finora';
  const isPro = data ? isProUser(data) : false;
  const isGold = data ? isGoldUser(data) : false;
  const trialActive = data ? isTrialActive(data.user) : false;
  const daysRemaining = data ? getTrialDaysRemaining(data.user) : 0;

  // Favorite / Pinned Menu Items in Sidebar
  const DEFAULT_FAVORITES = ['/', '/transactions', '/budgets', '/reports'];
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('finora_favorite_menus');
      return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });

  // Sync favorites when updated from Settings or other components
  useEffect(() => {
    const handleFavSync = () => {
      try {
        const saved = localStorage.getItem('finora_favorite_menus');
        if (saved) setFavorites(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('finora-favorites-updated', handleFavSync);
    window.addEventListener('storage', handleFavSync);
    return () => {
      window.removeEventListener('finora-favorites-updated', handleFavSync);
      window.removeEventListener('storage', handleFavSync);
    };
  }, []);

  const toggleFavorite = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url];
      localStorage.setItem('finora_favorite_menus', JSON.stringify(next));
      window.dispatchEvent(new Event('finora-favorites-updated'));
      return next;
    });
  };

  const favoriteNavItems = allNavItems.filter(item => favorites.includes(item.url));
  const unpinnedOverview = navOverview.filter(item => !favorites.includes(item.url));
  const unpinnedFinance = navFinance.filter(item => !favorites.includes(item.url));
  const unpinnedWealth = navWealth.filter(item => !favorites.includes(item.url));
  const unpinnedSystem = navSystem.filter(item => !favorites.includes(item.url));

  const handleTogglePro = async () => {
    const nextPlan = isPro ? 'free' : 'pro';
    await update(d => ({
      ...d,
      user: {
        ...d.user,
        plan: nextPlan,
        proExpiresAt: nextPlan === 'pro' ? '2099-12-31' : undefined
      }
    }));
    notify(nextPlan === 'pro' ? 'Đã kích hoạt Finora Pro (Demo Mode)!' : 'Đã chuyển về gói Free');
  };

  // Auto-Execute Recurring Transactions on Startup
  useEffect(() => {
    if (!data) return;
    const { updatedRecurring, newTransactions, executedCount } = autoExecuteRecurring(data);
    if (executedCount > 0) {
      void update(d => ({
        ...d,
        transactions: [...newTransactions, ...d.transactions],
        recurring: updatedRecurring
      }));
      notify(`Đã tự động ghi nhận ${executedCount} giao dịch định kỳ đến hạn hôm nay!`);
    }
  }, [data?.recurring?.length]);

  // Handle 0đ check-in to preserve streak
  const handleZeroSpendCheckIn = async () => {
    if (!data) return;
    const today = todayKey();
    if (data.user.lastCheckInDate === today) {
      notify('Hôm nay bạn đã duy trì chuỗi ghi chép rồi!');
      return;
    }

    const streakResult = updateStreak(data.user, today);
    const checkInTx = {
      id: uid(),
      name: 'Check-in 0đ (Không tiêu gì)',
      amount: 0,
      type: 'expense' as const,
      categoryId: 'food',
      accountId: data.user.defaultAccountId || data.accounts[0]?.id || 'wallet',
      date: today,
      method: 'Check-in 0đ',
      note: 'Giữ chuỗi ngày không phát sinh chi tiêu',
      status: 'completed' as const
    };

    await update(d => ({
      ...d,
      transactions: [checkInTx, ...d.transactions],
      user: {
        ...d.user,
        streakCount: streakResult.streakCount,
        lastCheckInDate: streakResult.lastCheckInDate
      }
    }));

    notify(`Chúc mừng! Bạn đã giữ chuỗi ngày thành công: ${streakResult.streakCount} ngày liên tiếp.`);
  };

  const streak = data?.user.streakCount || 1;
  const isCheckedInToday = data?.user.lastCheckInDate === todayKey();

  const renderNavItem = (item: NavItemConfig, isPinnedSection = false) => {
    const Icon = item.icon;
    const isLocked = item.isPro && !isPro;
    const isFav = favorites.includes(item.url);

    return (
      <Box key={`${isPinnedSection ? 'fav-' : ''}${item.url}`} sx={{ mb: 0.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <NavLink
            to={item.url}
            end={item.url === '/'}
            className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}
            onClick={(e) => {
              if (isLocked) {
                e.preventDefault();
                openPricing(item.label);
                return;
              }
              setOpen(false);
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              paddingRight: 6
            }}
          >
            <Icon size={18} />
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.label}
            </span>

            {/* Lock Icon for Advanced/PRO features */}
            {isLocked && (
              <Tooltip title="Tính năng nâng cao (Gói Pro) - Bấm để xem gói cước">
                <Box
                  component="span"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openPricing(item.label);
                  }}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 0.6,
                    py: 0.2,
                    borderRadius: '4px',
                    bgcolor: 'rgba(217, 154, 54, 0.15)',
                    color: '#D99A36',
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer',
                    mr: 0.5
                  }}
                >
                  <Lock size={11} />
                  <span>PRO</span>
                </Box>
              </Tooltip>
            )}

            {/* Star Favorite Button */}
            <IconButton
              size="small"
              onClick={(e) => toggleFavorite(e, item.url)}
              title={isFav ? 'Bỏ ghim khỏi yêu thích (về mục gốc)' : 'Ghim vào mục yêu thích'}
              sx={{
                p: 0.35,
                color: isFav ? '#F59E0B' : 'text.secondary',
                opacity: isFav ? 1 : 0.35,
                transition: 'all 0.15s ease',
                '&:hover': { opacity: 1, color: '#F59E0B' }
              }}
              aria-label={isFav ? 'Bỏ ghim yêu thích' : 'Ghim tính năng yêu thích'}
            >
              <Star size={13} fill={isFav ? '#F59E0B' : 'currentColor'} stroke="none" strokeWidth={0} />
            </IconButton>
          </NavLink>
        </Box>
      </Box>
    );
  };

  return (
    <div className={theme}>
      <div className="app">
        <div className={`mobile-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

        {/* Sidebar */}
        <aside className={`sidebar ${open ? 'open' : ''}`}>
          <div className="brand">
            <span className="brandmark">
              <img src="/logo.png" alt="Logo Finora" className="brandmark-img" />
            </span>
            <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: 18, color: 'var(--text-primary)' }}>Finora</span>
            {isPro && (
              <Chip
                label="PRO"
                size="small"
                sx={{
                  ml: 0.5,
                  height: 18,
                  fontSize: 9.5,
                  fontWeight: 800,
                  bgcolor: 'rgba(217, 154, 54, 0.15)',
                  color: '#D99A36',
                  border: '1px solid rgba(217, 154, 54, 0.3)'
                }}
              />
            )}
            <button
              className="iconbtn mobile-toggle"
              style={{ marginLeft: 'auto' }}
              onClick={() => setOpen(false)}
              aria-label="Đóng menu"
            >
              <X size={16} />
            </button>
          </div>

          {!isPro && (
            <Box sx={{ px: 1, mb: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Crown size={14} color="#D99A36" />}
                onClick={() => openPricing('Mở khóa gói cước Finora Pro')}
                sx={{
                  color: 'text.primary',
                  borderColor: 'rgba(217, 154, 54, 0.4)',
                  fontSize: 12,
                  fontWeight: 700,
                  py: 0.7,
                  '&:hover': {
                    borderColor: '#D99A36',
                    bgcolor: 'rgba(217, 154, 54, 0.05)'
                  }
                }}
              >
                Nâng cấp Pro
              </Button>
            </Box>
          )}

          <nav aria-label="Điều hướng chính">
            {/* 0. MỤC YÊU THÍCH (PINNED FAVORITES) */}
            {favoriteNavItems.length > 0 && (
              <Box sx={{ mb: 1.5, pb: 1, borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="navlabel" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F59E0B', paddingBottom: 4 }}>
                  <Star size={12} fill="#F59E0B" stroke="none" strokeWidth={0} />
                  <span>MỤC YÊU THÍCH</span>
                </div>
                {favoriteNavItems.map(item => renderNavItem(item, true))}
              </Box>
            )}

            {/* 1. TỔNG QUAN (Chỉ hiện nếu chưa ghim vào Yêu thích) */}
            {unpinnedOverview.length > 0 && (
              <>
                <div className="navlabel">TỔNG QUAN</div>
                {unpinnedOverview.map(item => renderNavItem(item))}
              </>
            )}

            {/* 2. TÀI CHÍNH (Chỉ hiện nếu chưa ghim vào Yêu thích) */}
            {unpinnedFinance.length > 0 && (
              <>
                <div className="navlabel">TÀI CHÍNH</div>
                {unpinnedFinance.map(item => renderNavItem(item))}
              </>
            )}

            {/* 3. TÀI SẢN & ĐẦU TƯ (Chỉ hiện nếu chưa ghim vào Yêu thích) */}
            {unpinnedWealth.length > 0 && (
              <>
                <div className="navlabel">TÀI SẢN & ĐẦU TƯ</div>
                {unpinnedWealth.map(item => renderNavItem(item))}
              </>
            )}

            {/* 4. HỆ THỐNG (Chỉ hiện nếu chưa ghim vào Yêu thích) */}
            {unpinnedSystem.length > 0 && (
              <>
                <div className="navlabel">HỆ THỐNG</div>
                {unpinnedSystem.map(item => renderNavItem(item))}
              </>
            )}

            <div className="navlabel">QUẢN TRỊ NỀN TẢNG</div>
            <NavLink
              to="/admin"
              className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Server size={18} />
              <span>Admin Console</span>
              <span
                style={{
                  marginLeft: 'auto',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: 10,
                  fontWeight: 800
                }}
              >
                ADMIN
              </span>
            </NavLink>
          </nav>

          <div className="sidebottom">
            {/* Tiện ích mở rộng trên Mobile (0đ check-in, Cloud Sync, Đổi chế độ Pro) */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2, pt: 1, borderTop: '1px solid var(--border-subtle)' }}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => {
                  handleZeroSpendCheckIn();
                  setOpen(false);
                }}
                startIcon={<CheckCircle size={15} />}
                sx={{
                  minHeight: 44,
                  fontSize: 12.5,
                  fontWeight: 650,
                  borderColor: 'var(--border-subtle)',
                  color: 'text.secondary',
                  justifyContent: 'flex-start',
                  px: 1.5
                }}
              >
                Hôm nay 0đ (Giữ chuỗi)
              </Button>

              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => {
                  setCloudSyncOpen(true);
                  setOpen(false);
                }}
                startIcon={<Cloud size={15} />}
                sx={{
                  minHeight: 44,
                  fontSize: 12.5,
                  fontWeight: 650,
                  borderColor: 'var(--border-subtle)',
                  color: 'text.secondary',
                  justifyContent: 'flex-start',
                  px: 1.5
                }}
              >
                Đồng bộ dữ liệu Cloud
              </Button>

              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => {
                  handleTogglePro();
                }}
                startIcon={<Crown size={15} color="#D99A36" />}
                sx={{
                  minHeight: 44,
                  fontSize: 12.5,
                  fontWeight: 650,
                  borderColor: 'rgba(217, 154, 54, 0.4)',
                  color: 'text.primary',
                  justifyContent: 'flex-start',
                  px: 1.5
                }}
              >
                Chế độ: {isPro ? 'Finora PRO (Bật)' : 'Bản FREE (Nhấn để thử Pro)'}
              </Button>
            </Box>

            <NavLink
              to="/legal"
              className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <FileSpreadsheet size={18} />
              <span>Chính sách & Pháp lý</span>
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Settings size={18} />
              <span>Cài đặt</span>
            </NavLink>
            <div className="profile">
              <div className="avatar">
                {isPro ? <Crown size={14} /> : 'FA'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {data?.user.name}
                  {isPro && <Crown size={12} color="#D99A36" />}
                </div>
                <div style={{ fontSize: 10.5, color: trialActive || isGold ? GOLD_COLOR_TOKENS.goldMetallic : 'var(--text-muted)', fontWeight: trialActive || isGold ? 700 : 400 }}>
                  {trialActive
                    ? `VIP Gold Trial (${daysRemaining} ngày)`
                    : isGold
                      ? 'Gói VIP Gold Cao Cấp'
                      : isPro
                        ? 'Gói Pro Cao Cấp'
                        : 'Gói Cơ Bản (Free)'}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="main">
          <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <button
                className="iconbtn mobile-toggle"
                aria-label="Mở menu"
                onClick={() => setOpen(true)}
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <Menu size={20} />
              </button>

              {/* Logo Finora trên Mobile & Tablet */}
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  gap: 1,
                  flexShrink: 0
                }}
              >
                <img
                  src="/logo.png"
                  alt="Logo Finora"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </Box>

              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <Box
                  component="div"
                  className="crumb"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  Finora / Sổ tài chính
                </Box>
                <h1 style={{
                  fontSize: 'inherit',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  margin: 0
                }}>
                  {title}
                </h1>
              </div>
            </div>

            <div className="topactions">
              {/* Daily Streak Badge - Thu gọn trên mobile */}
              <Tooltip title={isCheckedInToday ? `Chuỗi ghi chép: ${streak} ngày liên tiếp!` : 'Chưa ghi chép hôm nay'}>
                <Chip
                  icon={<Flame size={13} style={{ color: '#D65B58' }} />}
                  label={`${streak}`}
                  size="small"
                  sx={{
                    display: { xs: 'inline-flex', sm: 'none' },
                    fontWeight: 750,
                    fontSize: 11,
                    bgcolor: 'rgba(214, 91, 88, 0.08)',
                    color: '#D65B58',
                    border: '1px solid rgba(214, 91, 88, 0.25)',
                    height: 28,
                    cursor: 'default',
                    px: 0.25
                  }}
                />
              </Tooltip>

              <Tooltip title={isCheckedInToday ? 'Hôm nay bạn đã ghi chép!' : 'Chưa ghi chép hôm nay'}>
                <Chip
                  icon={<Flame size={14} style={{ color: '#D65B58' }} />}
                  label={`${streak} ngày`}
                  size="small"
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    fontWeight: 650,
                    fontSize: 11.5,
                    bgcolor: 'rgba(214, 91, 88, 0.08)',
                    color: '#D65B58',
                    border: '1px solid rgba(214, 91, 88, 0.25)',
                    height: 28,
                    cursor: 'default'
                  }}
                />
              </Tooltip>

              {/* 0đ Check-in Button */}
              <Button
                variant="outlined"
                size="small"
                onClick={handleZeroSpendCheckIn}
                startIcon={<CheckCircle size={13} />}
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  fontSize: 11.5,
                  fontWeight: 650,
                  height: 28,
                  borderColor: 'var(--border-subtle)',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main'
                  }
                }}
              >
                Hôm nay 0đ
              </Button>

              {/* VIP Gold / Trial Badge */}
              {trialActive ? (
                <Tooltip title={`Đang trải nghiệm VIP Gold 30 ngày (Còn ${daysRemaining} ngày). Bấm để xem bảng giá & quyền lợi.`}>
                  <Chip
                    icon={<Crown size={13} color={GOLD_COLOR_TOKENS.goldMetallic} />}
                    label={`VIP Gold Trial: ${daysRemaining} ngày`}
                    size="small"
                    onClick={() => navigate('/pricing')}
                    clickable
                    sx={{
                      bgcolor: 'rgba(197, 160, 89, 0.15)',
                      color: GOLD_COLOR_TOKENS.goldMetallic,
                      border: `1px solid ${GOLD_COLOR_TOKENS.goldBorder}`,
                      fontWeight: 800,
                      fontSize: 11.5,
                      height: 28,
                      cursor: 'pointer'
                    }}
                  />
                </Tooltip>
              ) : isGold ? (
                <Tooltip title="Thành viên VIP Gold cao cấp. Bấm để xem gói cước.">
                  <Chip
                    icon={<Crown size={13} color={GOLD_COLOR_TOKENS.goldMetallic} />}
                    label="VIP GOLD"
                    size="small"
                    onClick={() => navigate('/pricing')}
                    clickable
                    sx={{
                      bgcolor: 'rgba(197, 160, 89, 0.15)',
                      color: GOLD_COLOR_TOKENS.goldMetallic,
                      border: `1px solid ${GOLD_COLOR_TOKENS.goldBorder}`,
                      fontWeight: 800,
                      fontSize: 11.5,
                      height: 28,
                      cursor: 'pointer'
                    }}
                  />
                </Tooltip>
              ) : null}

              {/* Quick Pro Mode Switch */}
              <Tooltip title="Chuyển nhanh Free <-> Pro để kiểm thử tính năng (Demo)">
                <Chip
                  label={isPro ? 'PRO' : 'FREE'}
                  size="small"
                  onClick={handleTogglePro}
                  color={isPro ? 'warning' : 'default'}
                  clickable
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    fontWeight: 800,
                    fontSize: 11,
                    height: 28,
                    bgcolor: isPro ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-subtle)',
                    color: isPro ? '#f59e0b' : 'var(--text-muted)',
                    border: '1px solid',
                    borderColor: isPro ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'
                  }}
                />
              </Tooltip>

              {/* AI Copilot (WebMCP Drawer) */}
              <Tooltip title="Mở Trợ lý AI Finora (WebMCP Copilot)">
                <IconButton
                  size="small"
                  onClick={() => setAiDrawerOpen(true)}
                  sx={{
                    color: 'primary.main',
                    bgcolor: 'var(--brand-primary-tint)',
                    border: '1px solid var(--border-subtle)',
                    width: { xs: 40, sm: 34 },
                    height: { xs: 40, sm: 34 },
                    minWidth: { xs: 40, sm: 34 },
                    minHeight: { xs: 40, sm: 34 },
                    p: 0.75
                  }}
                  aria-label="Trợ lý AI"
                >
                  <Bot size={17} />
                </IconButton>
              </Tooltip>

              {/* Admin SaaS Console */}
              <Tooltip title="Mở Bảng điều khiển Quản trị Doanh nghiệp (Finora SaaS Admin)">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/admin')}
                  startIcon={<Server size={14} color="#10B981" />}
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    fontSize: 12,
                    fontWeight: 700,
                    height: 28,
                    borderRadius: '4px',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    color: '#10B981',
                    bgcolor: 'rgba(16, 185, 129, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(16, 185, 129, 0.16)',
                      borderColor: '#10B981'
                    }
                  }}
                >
                  Trang Admin
                </Button>
              </Tooltip>

              <Tooltip title="Mở Trang Quản trị SaaS">
                <IconButton
                  size="small"
                  onClick={() => navigate('/admin')}
                  sx={{
                    display: { xs: 'inline-flex', sm: 'none' },
                    color: '#10B981',
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '4px',
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    minHeight: 34,
                    p: 0.75
                  }}
                  aria-label="Quản trị SaaS"
                >
                  <Server size={16} />
                </IconButton>
              </Tooltip>

              {/* Fast search pill */}
              <Box
                component="form"
                onSubmit={e => {
                  e.preventDefault();
                  navigate('/transactions?search=' + encodeURIComponent(query));
                }}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.4,
                  borderRadius: 1.5,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Search size={13} style={{ color: 'var(--text-muted)' }} />
                <InputBase
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Tìm giao dịch..."
                  sx={{
                    fontSize: 12,
                    width: 130,
                    color: 'inherit',
                    fontFamily: 'inherit'
                  }}
                />
              </Box>

              {/* Offline-First & Cloud Sync Indicator */}
              <Tooltip title="Lưu trữ an toàn trên thiết bị (Offline). Nhấn để đồng bộ Cloud.">
                <Chip
                  icon={<HardDrive size={13} style={{ color: 'var(--text-secondary)' }} />}
                  label="Offline Ready"
                  size="small"
                  onClick={() => setCloudSyncOpen(true)}
                  sx={{
                    display: { xs: 'none', md: 'inline-flex' },
                    height: 28,
                    fontSize: 11,
                    fontWeight: 750,
                    bgcolor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                />
              </Tooltip>

              <Tooltip title="Đồng bộ Cloud theo yêu cầu">
                <IconButton
                  size="small"
                  onClick={() => setCloudSyncOpen(true)}
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    color: 'text.primary',
                    border: '1px solid var(--border-subtle)',
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    minHeight: 34,
                    p: 0.75
                  }}
                  aria-label="Đồng bộ Cloud"
                >
                  <Cloud size={16} />
                </IconButton>
              </Tooltip>

              {/* Theme toggle */}
              <IconButton
                size="small"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                sx={{
                  color: 'text.primary',
                  border: '1px solid var(--border-subtle)',
                  width: { xs: 40, sm: 34 },
                  height: { xs: 40, sm: 34 },
                  minWidth: { xs: 40, sm: 34 },
                  minHeight: { xs: 40, sm: 34 },
                  p: 0.75
                }}
                aria-label="Đổi giao diện"
              >
                {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
              </IconButton>

              {/* Notifications */}
              <Box sx={{ position: 'relative', display: { xs: 'none', sm: 'block' } }}>
                <IconButton
                  size="small"
                  onClick={() => setNotis(!notis)}
                  sx={{
                    color: 'text.primary',
                    border: '1px solid var(--border-subtle)',
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    minHeight: 34,
                    p: 0.75
                  }}
                  aria-label="Thông báo"
                >
                  <Bell size={16} />
                </IconButton>
                {notis && (
                  <div className="card pad" style={{ position: 'absolute', right: 0, top: 43, width: 280, zIndex: 40, boxShadow: '0 12px 36px rgba(0,0,0,0.15)' }}>
                    <div className="section-head">
                      <h3>Thông báo</h3>
                    </div>
                    {data?.notifications.map(n => (
                      <div className="mini-row" key={n.id} style={{ padding: '8px 0', fontSize: 12 }}>
                        <span>{n.title}</span>
                        {!n.read && <span className="dot" style={{ background: '#10b981' }} />}
                      </div>
                    ))}
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                      onClick={() => {
                        update(d => ({
                          ...d,
                          notifications: d.notifications.map(n => ({ ...n, read: true }))
                        }));
                        setNotis(false);
                      }}
                    >
                      Đánh dấu đã đọc
                    </Button>
                  </div>
                )}
              </Box>

              {/* Add transaction quick button */}
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<Plus size={14} />}
                onClick={() => navigate('/transactions?add=1')}
                sx={{ display: { xs: 'none', sm: 'inline-flex' }, height: 32, px: 1.5 }}
              >
                Giao dịch
              </Button>
            </div>
          </header>

          <main className="content">
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation Bar with prominent Center Add Button */}
          <nav className="mobile-bottom-bar" aria-label="Điều hướng nhanh điện thoại">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `mobile-bottom-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} />
              <span>Tổng quan</span>
            </NavLink>
            <NavLink
              to="/transactions"
              className={({ isActive }) => `mobile-bottom-item ${isActive ? 'active' : ''}`}
            >
              <ArrowLeftRight size={20} />
              <span>Giao dịch</span>
            </NavLink>
            <NavLink
              to="/transactions?add=1"
              className="mobile-bottom-add-btn"
              aria-label="Thêm giao dịch mới nhanh"
            >
              <Plus size={22} />
            </NavLink>
            <NavLink
              to="/accounts"
              className={({ isActive }) => `mobile-bottom-item ${isActive ? 'active' : ''}`}
            >
              <Wallet size={20} />
              <span>Tài khoản</span>
            </NavLink>
            <button
              type="button"
              className="mobile-bottom-item"
              onClick={() => setOpen(true)}
              aria-label="Mở menu tất cả tính năng"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Menu size={20} />
              <span>Menu</span>
            </button>
          </nav>
        </div>

        {/* Global Snackbar with Undo */}
        <Snackbar
          open={!!toast}
          autoHideDuration={5000}
          onClose={clearToast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {toast ? (
            <Alert
              onClose={clearToast}
              severity={toast.severity || 'success'}
              variant="filled"
              action={
                toast.actionLabel && toast.onAction ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      toast.onAction?.();
                      clearToast();
                    }}
                    sx={{ fontWeight: 800, textDecoration: 'underline' }}
                  >
                    {toast.actionLabel}
                  </Button>
                ) : undefined
              }
              sx={{ width: '100%', borderRadius: '4px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
            >
              {toast.message}
            </Alert>
          ) : undefined}
        </Snackbar>

        {/* Paywall / Pricing Dialog */}
        <PricingDialog
          open={pricingOpen}
          onClose={closePricing}
          initialFeatureHighlight={pricingFeature}
        />

        {/* AI Assistant Drawer */}
        <AiAssistantDrawer
          open={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
        />

        {/* Offline & Cloud Sync Modal */}
        <CloudSyncModal
          open={cloudSyncOpen}
          onClose={() => setCloudSyncOpen(false)}
        />
      </div>
    </div>
  );
}
