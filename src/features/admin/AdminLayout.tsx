import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Drawer,
  Avatar,
  Chip,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileSpreadsheet,
  Activity,
  ShieldCheck,
  Settings,
  Scale,
  Menu as MenuIcon,
  ArrowLeft
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface AdminNavGroup {
  title: string;
  items: {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: string;
    badgeStatus?: 'success' | 'warning' | 'danger' | 'info';
  }[];
}

const ADMIN_NAVIGATION: AdminNavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Overview', path: '/admin/dashboard', icon: <LayoutDashboard size={17} /> },
      { label: 'Analytics', path: '/admin/reports', icon: <FileSpreadsheet size={17} /> }
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Users', path: '/admin/users', icon: <Users size={17} />, badge: '5 users' },
      { label: 'Plans', path: '/admin/subscriptions', icon: <CreditCard size={17} /> }
    ]
  },
  {
    title: 'SERVICES & MONITORING',
    items: [
      { label: 'Integrations', path: '/admin/finance', icon: <CreditCard size={17} /> },
      { label: 'Health', path: '/admin/system', icon: <Activity size={17} />, badge: 'Healthy', badgeStatus: 'success' },
      { label: 'Audit Log', path: '/admin/audit-logs', icon: <ShieldCheck size={17} /> }
    ]
  },
  {
    title: 'CONTENT & SETTINGS',
    items: [
      { label: 'Legal & Policies', path: '/admin/legal', icon: <Scale size={17} /> },
      { label: 'Settings', path: '/admin/settings', icon: <Settings size={17} /> }
    ]
  }
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [mobileOpen, setMobileOpen] = useState(false);

  // Dynamic Page Title
  const activeNavItem = ADMIN_NAVIGATION.flatMap(g => g.items).find(i => location.pathname.startsWith(i.path));
  const currentTitle = activeNavItem?.label || 'Bảng điều khiển SaaS';

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: isDark ? '#0F151D' : '#111827', color: '#F8FAFC' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              bgcolor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <ShieldCheck size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              TÍCH SẢN ADMIN
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 11 }}>
              Platform Management Console
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusBadge label="Zero-Access Security" status="success" size="small" variant="dot" />
        </Box>
      </Box>

      {/* Nav List */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: 1.5 }}>
        {ADMIN_NAVIGATION.map(group => (
          <Box key={group.title} sx={{ mb: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                fontWeight: 750,
                fontSize: 10.5,
                color: '#64748B',
                letterSpacing: '0.06em',
                display: 'block',
                mb: 1
              }}
            >
              {group.title}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {group.items.map(item => {
                const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');
                return (
                  <Box
                    key={item.path}
                    component={NavLink}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: 1,
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      bgcolor: isActive ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                      borderLeft: isActive ? '3px solid #10B981' : '3px solid transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: isActive ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                        color: '#FFFFFF'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box sx={{ color: isActive ? '#10B981' : 'inherit' }}>
                        {item.icon}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: isActive ? 700 : 500, fontSize: 13 }}>
                        {item.label}
                      </Typography>
                    </Box>
                    {item.badge && (
                      <Chip
                        label={item.badge}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 10,
                          fontWeight: 700,
                          borderRadius: '4px',
                          bgcolor: item.badgeStatus === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                          color: item.badgeStatus === 'success' ? '#34D399' : '#CBD5E1'
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Return to Consumer Finora Button */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate('/')}
          sx={{
            color: '#E2E8F0',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            textTransform: 'none',
            fontSize: 12.5,
            fontWeight: 700,
            py: 0.8,
            '&:hover': {
              borderColor: '#10B981',
              bgcolor: 'rgba(16, 185, 129, 0.1)'
            }
          }}
        >
          Quay lại Finora App
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop Sidebar */}
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: 260,
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 1200
        }}
      >
        {sidebarContent}
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: 260, boxSizing: 'border-box' }
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Main Admin Workspace */}
      <Box sx={{ flex: 1, ml: { xs: 0, md: '260px' }, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Dedicated Admin Topbar */}
        <Box
          component="header"
          sx={{
            height: 60,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            px: { xs: 2, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1100
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: 'none' }, color: 'text.primary' }}
              aria-label="Mở menu quản trị"
            >
              <MenuIcon size={20} />
            </IconButton>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 17 } }}>
                {currentTitle}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                Finora SaaS Platform Administration · v2.5 Enterprise
              </Typography>
            </Box>
          </Box>

          {/* Right Topbar Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <StatusBadge label="Hệ thống ổn định" status="success" size="small" variant="dot" />

            <Tooltip title="Tài khoản Quản trị cấp cao">
              <Chip
                avatar={<Avatar sx={{ bgcolor: '#10B981', color: '#fff', width: 24, height: 24, fontSize: 11 }}>AD</Avatar>}
                label="Admin Superuser"
                size="small"
                variant="outlined"
                sx={{ borderRadius: '4px', fontWeight: 700 }}
              />
            </Tooltip>
          </Box>
        </Box>

        {/* Content Area */}
        <Box component="main" sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
