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
  Cloud,
  Banknote,
  Server,
  Star,
  LogOut
} from 'lucide-react';
import {
  Button,
  Chip,
  Snackbar,
  Alert,
  Tooltip,
  Box,
  IconButton,
  InputBase,
  Typography,
  Menu as MuiMenu,
  MenuItem,
  Avatar,
  Divider
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
import { TierBadgeIcon } from './subscription/TierBadgeIcon';
import { AiAssistantDrawer } from './AiAssistantDrawer';
import { CloudSyncModal } from './CloudSyncModal';
import { SyncStatusBadge } from './offline/SyncStatusBadge';

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
    closePricing,
    logout
  } = useFinance();
  const loc = useLocation();
  const navigate = useNavigate();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await logout();
    navigate('/auth/login');
  };

  const title = nav.find(n => n[0] === loc.pathname)?.[1] || 'Tích Sản';
  const isPro = data ? isProUser(data) : false;
  const isGold = data ? isGoldUser(data) : false;
  const trialActive = data ? isTrialActive(data.user) : false;
  const daysRemaining = data ? getTrialDaysRemaining(data.user) : 0;

  // Lock body and html root scroll when mobile sidebar drawer is open to prevent background bleed
  useEffect(() => {
    if (open) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
      };
    }
  }, [open]);

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
              paddingRight: 6,
              minWidth: 0
            }}
          >
            <Icon size={17} style={{ flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '13px',
                fontWeight: 600
              }}
              title={item.label}
            >
              {item.label}
            </span>

            {/* Action items: Crown Indicator & Favorite Star */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexShrink: 0, ml: 'auto' }}>
              {isLocked && (
                <Tooltip title="Tính năng VIP Gold - Nhấp để xem gói cước" arrow placement="right">
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
                      justifyContent: 'center',
                      width: 17,
                      height: 17,
                      minWidth: 17,
                      borderRadius: '50%',
                      bgcolor: 'rgba(217, 154, 54, 0.15)',
                      border: '1px solid rgba(217, 154, 54, 0.4)',
                      color: '#DFBA73',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        transform: 'scale(1.15)',
                        bgcolor: 'rgba(217, 154, 54, 0.3)',
                        borderColor: '#DFBA73'
                      }
                    }}
                    aria-label="Tính năng VIP Gold"
                  >
                    <Crown size={9.5} color="#DFBA73" style={{ filter: 'drop-shadow(0 0 2px rgba(223, 186, 115, 0.5))' }} />
                  </Box>
                </Tooltip>
              )}

              {/* Star Favorite Button: Only visible by default if pinned (isFav), on desktop hover otherwise; hidden on mobile when unpinned to avoid crowding */}
              <IconButton
                size="small"
                onClick={(e) => toggleFavorite(e, item.url)}
                title={isFav ? 'Bỏ ghim khỏi yêu thích (về danh mục gốc)' : 'Ghim vào mục yêu thích'}
                className="navlink-star-action"
                sx={{
                  p: 0.2,
                  width: 20,
                  height: 20,
                  minWidth: 20,
                  color: isFav ? '#F59E0B' : 'text.secondary',
                  display: isFav ? 'inline-flex' : { xs: 'none', md: 'inline-flex' },
                  opacity: isFav ? 1 : 0,
                  transition: 'opacity 0.15s ease, transform 0.15s ease, color 0.15s ease',
                  '.navlink:hover &': {
                    opacity: isFav ? 1 : 0.65
                  },
                  '&:hover': {
                    opacity: '1 !important',
                    color: '#F59E0B',
                    transform: 'scale(1.15)'
                  }
                }}
                aria-label={isFav ? 'Bỏ ghim yêu thích' : 'Ghim tính năng yêu thích'}
              >
                <Star size={11} fill={isFav ? '#F59E0B' : 'currentColor'} stroke="none" strokeWidth={0} />
              </IconButton>
            </Box>
          </NavLink>
        </Box>
      </Box>
    );
  };

  return (
    <div className={theme}>
      <div className="app">
        <div className={`mobile-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

        {/* Sidebar: Fixed Header, Scrollable Navigation, Fixed Footer */}
        <aside className={`sidebar ${open ? 'open' : ''}`}>
          {/* 1. Fixed Header (Brand & Pro Upgrade Button) */}
          <div className="sidebar-header">
            <div className="brand" style={{ alignItems: 'center' }}>
              <span className="brandmark" style={{ marginTop: 2 }}>
                <img src="/logo.png?v=20261105" alt="Logo Tích Sản" className="brandmark-img" />
              </span>
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span style={{ fontWeight: 850, letterSpacing: '-0.02em', fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    Tích Sản
                  </span>
                  {isPro && (
                    <Chip
                      label="VIP GOLD"
                      size="small"
                      sx={{
                        height: 17,
                        fontSize: 9,
                        fontWeight: 800,
                        bgcolor: 'rgba(217, 119, 6, 0.15)',
                        color: '#B45309',
                        border: '1px solid rgba(217, 119, 6, 0.35)'
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '10.5px',
                    color: 'text.secondary',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    lineHeight: 1.3,
                    mt: 0.25,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Kiến tạo tự do tài chính
                </Typography>
              </Box>
              <button
                className="iconbtn mobile-toggle"
                style={{ marginLeft: 'auto', marginTop: 2 }}
                onClick={() => setOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={16} />
              </button>
            </div>

            {!isPro && (
              <Box sx={{ mt: 0.75 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<Crown size={14} color="#D97706" />}
                  onClick={() => openPricing('Mở khóa gói cước VIP Gold')}
                  sx={{
                    color: 'text.primary',
                    borderColor: 'rgba(217, 119, 6, 0.4)',
                    fontSize: 12,
                    fontWeight: 700,
                    py: 0.7,
                    borderRadius: '6px',
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
          </div>

          {/* 2. Scrollable Middle Navigation */}
          <nav className="sidebar-nav" aria-label="Điều hướng chính">
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

            {data?.user?.role === 'admin' && (
              <>
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
              </>
            )}
          </nav>

          {/* 3. Fixed Footer (Cloud Sync, Pro Toggle, Profile) */}
          <div className="sidebar-footer">
            {/* Tiện ích mở rộng trên Mobile (0đ check-in) */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
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
                  minHeight: 38,
                  fontSize: 12,
                  fontWeight: 650,
                  borderColor: 'var(--border-subtle)',
                  color: 'text.secondary',
                  justifyContent: 'flex-start',
                  px: 1.5,
                  borderRadius: '6px'
                }}
              >
                Hôm nay 0đ (Giữ chuỗi)
              </Button>
            </Box>

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
                minHeight: 36,
                fontSize: 12,
                fontWeight: 650,
                borderColor: 'var(--border-subtle)',
                color: 'text.secondary',
                justifyContent: 'flex-start',
                px: 1.5,
                borderRadius: '6px'
              }}
            >
              Đồng bộ dữ liệu Cloud
            </Button>

            <Box
              onClick={handleTogglePro}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.25,
                py: 0.6,
                borderRadius: 1.5,
                cursor: 'pointer',
                border: isPro ? '1px solid rgba(223, 186, 115, 0.4)' : '1px solid var(--border-subtle)',
                bgcolor: isPro ? 'rgba(223, 186, 115, 0.08)' : 'var(--bg-subtle)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: isPro ? 'rgba(223, 186, 115, 0.7)' : 'text.secondary',
                  bgcolor: isPro ? 'rgba(223, 186, 115, 0.14)' : 'action.hover'
                }
              }}
              title="Nhấn để bật/tắt nhanh chế độ Finora PRO"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Crown size={14} color={isPro ? '#DFBA73' : 'var(--text-muted)'} />
                <span style={{ fontSize: 12, fontWeight: 700, color: isPro ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  Chế độ PRO
                </span>
              </Box>
              <Chip
                label={isPro ? 'ĐANG BẬT' : 'TẮT'}
                size="small"
                sx={{
                  height: 19,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  bgcolor: isPro ? '#DFBA73' : 'action.disabledBackground',
                  color: isPro ? '#1E1B13' : 'text.disabled',
                  border: 'none',
                  cursor: 'pointer'
                }}
              />
            </Box>

            <Box
              className="profile"
              onClick={() => {
                navigate('/settings');
                setOpen(false);
              }}
              sx={{
                cursor: 'pointer',
                p: 1,
                borderRadius: '8px',
                border: '1px solid',
                borderColor: trialActive || isGold
                  ? 'rgba(223, 186, 115, 0.4)'
                  : isPro
                  ? 'rgba(139, 92, 246, 0.4)'
                  : 'var(--border-subtle)',
                bgcolor: trialActive || isGold
                  ? 'rgba(223, 186, 115, 0.08)'
                  : isPro
                  ? 'rgba(139, 92, 246, 0.08)'
                  : 'var(--bg-subtle)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                '&:hover': {
                  borderColor: trialActive || isGold ? '#DFBA73' : isPro ? '#8B5CF6' : 'text.secondary'
                }
              }}
              title="Nhấn để quản lý tài khoản & gói dịch vụ"
            >
              <TierBadgeIcon
                tier={trialActive || isGold ? 'gold' : isPro ? 'pro' : 'free'}
                isTrial={trialActive}
                size={34}
                iconSize={17}
                showTooltip={false}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ fontSize: 12.5, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span>{data?.user.name}</span>
                </Box>
                <Box
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: trialActive || isGold
                      ? '#DFBA73'
                      : isPro
                      ? '#A78BFA'
                      : 'var(--text-muted)'
                  }}
                >
                  {trialActive
                    ? `VIP Gold Trial (${daysRemaining} ngày)`
                    : isGold
                    ? 'VIP Gold Hoàng Gia'
                    : isPro
                    ? 'Wealth Pro Tím'
                    : 'Cơ Bản (Free)'}
                </Box>
              </Box>

              <Tooltip title="Đăng xuất tài khoản">
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    void handleLogout();
                  }}
                  sx={{
                    color: 'text.secondary',
                    p: 0.7,
                    borderRadius: '8px',
                    '&:hover': {
                      color: '#EF4444',
                      bgcolor: 'rgba(239, 68, 68, 0.1)'
                    }
                  }}
                  aria-label="Đăng xuất"
                >
                  <LogOut size={16} />
                </IconButton>
              </Tooltip>
            </Box>
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

              {/* Logo Tích Sản trên Mobile & Tablet */}
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  gap: 1,
                  flexShrink: 0
                }}
              >
                <img
                  src="/logo.png?v=20261105"
                  alt="Logo Tích Sản"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </Box>

              <Box sx={{ minWidth: 0, overflow: 'hidden', display: { xs: 'none', sm: 'block' } }}>
                <Box
                  component="div"
                  className="crumb"
                >
                  Tích Sản / Sổ tài chính
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
              </Box>
            </div>

            <div className="topactions" style={{ display: 'flex', alignItems: 'center' }}>
              {/* Offline-First Sync Status Indicator */}
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
                <SyncStatusBadge />
              </Box>

              {/* Daily Streak Badge */}
              <Tooltip title={isCheckedInToday ? `Chuỗi ghi chép: ${streak} ngày liên tiếp!` : 'Chưa ghi chép hôm nay'}>
                <Chip
                  icon={<Flame size={14} style={{ color: '#D65B58' }} />}
                  label={`${streak}${streak > 1 ? ' ngày' : ''}`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: 11.5,
                    bgcolor: 'rgba(214, 91, 88, 0.08)',
                    color: '#D65B58',
                    border: '1px solid rgba(214, 91, 88, 0.25)',
                    height: 36,
                    borderRadius: '10px',
                    cursor: 'default',
                    px: { xs: 0.5, sm: 1 }
                  }}
                />
              </Tooltip>

              {/* 0đ Check-in Button */}
              <Button
                variant="outlined"
                size="small"
                onClick={handleZeroSpendCheckIn}
                startIcon={<CheckCircle size={14} />}
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  fontSize: 12,
                  fontWeight: 650,
                  height: 36,
                  borderRadius: '10px',
                  borderColor: 'var(--border-subtle)',
                  color: 'text.secondary',
                  px: 1.5,
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main'
                  }
                }}
              >
                Hôm nay 0đ
              </Button>

              {/* VIP Gold / Trial Badge (Desktop/Tablet) */}
              {trialActive ? (
                <Tooltip title={`Đang trải nghiệm VIP Gold 30 ngày (Còn ${daysRemaining} ngày). Bấm để xem bảng giá & quyền lợi.`}>
                  <Chip
                    icon={<Crown size={14} color={GOLD_COLOR_TOKENS.goldMetallic} />}
                    label={`VIP Gold: ${daysRemaining}d`}
                    size="small"
                    onClick={() => navigate('/pricing')}
                    clickable
                    sx={{
                      display: { xs: 'none', sm: 'inline-flex' },
                      bgcolor: 'rgba(197, 160, 89, 0.15)',
                      color: GOLD_COLOR_TOKENS.goldMetallic,
                      border: `1px solid ${GOLD_COLOR_TOKENS.goldBorder}`,
                      fontWeight: 800,
                      fontSize: 11.5,
                      height: 36,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      px: 0.8
                    }}
                  />
                </Tooltip>
              ) : isGold ? (
                <Tooltip title="Thành viên VIP Gold cao cấp. Bấm để xem gói cước.">
                  <Chip
                    icon={<Crown size={14} color={GOLD_COLOR_TOKENS.goldMetallic} />}
                    label="VIP GOLD"
                    size="small"
                    onClick={() => navigate('/pricing')}
                    clickable
                    sx={{
                      display: { xs: 'none', sm: 'inline-flex' },
                      bgcolor: 'rgba(197, 160, 89, 0.15)',
                      color: GOLD_COLOR_TOKENS.goldMetallic,
                      border: `1px solid ${GOLD_COLOR_TOKENS.goldBorder}`,
                      fontWeight: 800,
                      fontSize: 11.5,
                      height: 36,
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  />
                </Tooltip>
              ) : null}

              {/* Quick Pro Mode Switch */}
              <Tooltip title={isPro ? 'Finora PRO: Đang BẬT (Bấm để chuyển về Free)' : 'Bản Free (Bấm để bật thử Finora Pro)'}>
                <IconButton
                  size="small"
                  onClick={handleTogglePro}
                  sx={{
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    minHeight: 36,
                    borderRadius: '10px',
                    position: 'relative',
                    bgcolor: isPro ? 'rgba(223, 186, 115, 0.15)' : 'var(--bg-subtle)',
                    border: '1px solid',
                    borderColor: isPro ? 'rgba(223, 186, 115, 0.6)' : 'var(--border-subtle)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: isPro ? '#DFBA73' : 'text.secondary',
                      bgcolor: isPro ? 'rgba(223, 186, 115, 0.25)' : 'action.hover'
                    }
                  }}
                  aria-label="Chuyển chế độ Pro"
                >
                  <Crown
                    size={17}
                    color={isPro ? '#DFBA73' : 'var(--text-muted)'}
                    style={{
                      filter: isPro ? 'drop-shadow(0 0 4px rgba(223, 186, 115, 0.6))' : 'none'
                    }}
                  />
                  {isPro && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#DFBA73'
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>

              {/* AI Copilot (WebMCP Drawer) */}
              <Tooltip title="Mở Trợ lý AI Tích Sản (WebMCP Copilot)">
                <IconButton
                  size="small"
                  onClick={() => setAiDrawerOpen(true)}
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    color: 'primary.main',
                    bgcolor: 'var(--brand-primary-tint)',
                    border: '1px solid var(--border-subtle)',
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    minHeight: 36,
                    borderRadius: '10px'
                  }}
                  aria-label="Trợ lý AI"
                >
                  <Bot size={18} />
                </IconButton>
              </Tooltip>

              {/* Admin Console (For Admins) */}
              {data?.user?.role === 'admin' && (
                <Tooltip title="Mở Bảng điều khiển Quản trị">
                  <IconButton
                    size="small"
                    onClick={() => navigate('/admin')}
                    sx={{
                      color: '#10B981',
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '10px',
                      width: 36,
                      height: 36,
                      minWidth: 36,
                      minHeight: 36
                    }}
                    aria-label="Quản trị"
                  >
                    <Server size={17} />
                  </IconButton>
                </Tooltip>
              )}

              {/* Fast search pill */}
              <Box
                component="form"
                onSubmit={e => {
                  e.preventDefault();
                  navigate('/transactions?search=' + encodeURIComponent(query));
                }}
                sx={{
                  display: { xs: 'none', lg: 'flex' },
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  height: 36,
                  borderRadius: '10px',
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <InputBase
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Tìm giao dịch..."
                  sx={{
                    fontSize: 12,
                    width: 120,
                    color: 'inherit',
                    fontFamily: 'inherit'
                  }}
                />
              </Box>

              {/* Cloud Sync Icon */}
              <Tooltip title="Đồng bộ Cloud theo yêu cầu">
                <IconButton
                  size="small"
                  onClick={() => setCloudSyncOpen(true)}
                  sx={{
                    display: { xs: 'none', md: 'inline-flex' },
                    color: 'text.primary',
                    border: '1px solid var(--border-subtle)',
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    minHeight: 36,
                    borderRadius: '10px'
                  }}
                  aria-label="Đồng bộ Cloud"
                >
                  <Cloud size={17} />
                </IconButton>
              </Tooltip>

              {/* Theme toggle */}
              <IconButton
                size="small"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                sx={{
                  color: 'text.primary',
                  border: '1px solid var(--border-subtle)',
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  minHeight: 36,
                  borderRadius: '10px'
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
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    minHeight: 36,
                    borderRadius: '10px'
                  }}
                  aria-label="Thông báo"
                >
                  <Bell size={17} />
                </IconButton>
                {notis && (
                  <div className="card pad" style={{ position: 'absolute', right: 0, top: 44, width: 280, zIndex: 40, boxShadow: '0 12px 36px rgba(0,0,0,0.15)' }}>
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
                      sx={{ mt: 1, borderRadius: '8px' }}
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
              <Tooltip title="Thêm giao dịch mới">
                <IconButton
                  size="small"
                  onClick={() => navigate('/transactions?add=1')}
                  sx={{
                    display: { xs: 'inline-flex', sm: 'none' },
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    minHeight: 36,
                    borderRadius: '10px',
                    bgcolor: '#10B981',
                    color: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: '#059669',
                      transform: 'scale(1.05)'
                    }
                  }}
                  aria-label="Thêm giao dịch mới nhanh"
                >
                  <Plus size={18} strokeWidth={2.8} color="#FFFFFF" />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<Plus size={15} />}
                onClick={() => navigate('/transactions?add=1')}
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  height: 36,
                  px: 1.8,
                  borderRadius: '10px',
                  fontWeight: 750,
                  fontSize: '0.82rem',
                  textTransform: 'none'
                }}
              >
                Giao dịch
              </Button>

              {/* User Profile & Logout Menu */}
              <Box sx={{ position: 'relative' }}>
                <Tooltip title={`Tài khoản: ${data?.user.name || 'Người dùng'} (Menu & Đăng xuất)`}>
                  <IconButton
                    size="small"
                    onClick={e => setUserMenuAnchor(e.currentTarget)}
                    sx={{
                      width: 36,
                      height: 36,
                      minWidth: 36,
                      minHeight: 36,
                      borderRadius: '10px',
                      p: 0,
                      border: '1.5px solid',
                      borderColor: trialActive || isGold ? GOLD_COLOR_TOKENS.goldBorder : 'var(--border-subtle)',
                      bgcolor: trialActive || isGold ? 'rgba(197, 160, 89, 0.15)' : 'var(--bg-subtle)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: trialActive || isGold ? GOLD_COLOR_TOKENS.goldLight : 'primary.main'
                      }
                    }}
                    aria-label="Menu tài khoản cá nhân"
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: 12,
                        fontWeight: 800,
                        bgcolor: trialActive || isGold ? GOLD_COLOR_TOKENS.goldMetallic : '#10B981',
                        color: trialActive || isGold ? '#09261E' : '#FFFFFF'
                      }}
                    >
                      {data?.user.name ? data.user.name.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <MuiMenu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={() => setUserMenuAnchor(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1.2,
                        minWidth: 240,
                        borderRadius: '14px',
                        boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
                        p: 1,
                        border: '1px solid var(--border-subtle)',
                        bgcolor: 'background.paper'
                      }
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 1.5, py: 1.2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                      {data?.user.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.8, fontSize: '0.75rem' }}>
                      {data?.user.email}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<Crown size={12} color={trialActive || isGold ? '#B45309' : '#059669'} />}
                      label={
                        trialActive
                          ? `VIP Gold Trial (${daysRemaining} ngày)`
                          : isGold
                          ? 'VIP Gold Hoàng Gia'
                          : isPro
                          ? 'Wealth Pro'
                          : 'Gói Free Cơ Bản'
                      }
                      sx={{
                        fontWeight: 750,
                        fontSize: '0.72rem',
                        height: 22,
                        bgcolor: trialActive || isGold ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                        color: trialActive || isGold ? '#D97706' : '#059669',
                        border: '1px solid',
                        borderColor: trialActive || isGold ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 0.8 }} />

                  <MenuItem
                    onClick={() => {
                      setUserMenuAnchor(null);
                      navigate('/pricing');
                    }}
                    sx={{ borderRadius: '8px', fontSize: 13, py: 1, gap: 1.2, fontWeight: 650 }}
                  >
                    <Crown size={16} color={GOLD_COLOR_TOKENS.goldMetallic} />
                    Bảng giá & Gói cước
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      setUserMenuAnchor(null);
                      navigate('/settings');
                    }}
                    sx={{ borderRadius: '8px', fontSize: 13, py: 1, gap: 1.2, fontWeight: 650 }}
                  >
                    <Settings size={16} />
                    Cài đặt hệ thống
                  </MenuItem>

                  <Divider sx={{ my: 0.8 }} />

                  <MenuItem
                    onClick={() => void handleLogout()}
                    sx={{
                      borderRadius: '8px',
                      fontSize: 13,
                      py: 1,
                      gap: 1.2,
                      fontWeight: 750,
                      color: '#EF4444',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' }
                    }}
                  >
                    <LogOut size={16} />
                    Đăng xuất tài khoản
                  </MenuItem>
                </MuiMenu>
              </Box>
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

          {/* Dedicated Floating AI Chatbot Button (Mobile) - Fixed above bottom bar on right */}
          <Tooltip title="Mở Trợ lý AI Tích Sản (WebMCP)">
            <Box
              onClick={() => setAiDrawerOpen(true)}
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
                right: 14,
                width: 38,
                height: 38,
                borderRadius: '50%',
                bgcolor: '#10B981',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                zIndex: 95,
                transition: 'all 0.15s ease',
                '&:active': {
                  transform: 'scale(0.92)'
                }
              }}
              aria-label="Mở Trợ lý AI Tích Sản"
            >
              <Bot size={19} color="#FFFFFF" />
            </Box>
          </Tooltip>
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
