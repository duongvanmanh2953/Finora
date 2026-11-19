import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { SplashScreen } from './components/ui/SplashScreen';
import { Layout } from './components/Layout';
import { GlobalNotificationToast } from './components/common/GlobalNotificationToast';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import Dashboard from './features/dashboard/Dashboard';
import Transactions from './features/transactions/Transactions';
import Accounts from './features/accounts/Accounts';
import Categories from './features/categories/Categories';
import Budgets from './features/budgets/Budgets';
import Savings from './features/savings/Savings';
import Debts from './features/debts/Debts';
import Reports from './features/reports/Reports';
import Recurring from './features/recurring/Recurring';
import Settings from './features/settings/Settings';
import Assets from './features/assets/Assets';
import Payroll from './features/payroll/Payroll';
import IncomeManagementView from './features/income/IncomeManagementView';
import LegalPublicView from './features/legal/LegalPublicView';
import PricingPage from './features/subscription/PricingPage';
import LandingPage from './features/landing/LandingPage';
import { AdminLegalView } from './features/admin/AdminLegalView';
import {
  AdminLayout,
  AdminDashboardView,
  AdminUsersView,
  AdminSubscriptionsView,
  AdminFinanceView,
  AdminReportsView,
  AdminSystemHealthView,
  AdminAuditLogsView,
  AdminSettingsView
} from './features/admin/Admin';
import Auth from './features/auth/Auth';
import { useFinance } from './store';
import { mockFinanceService, checkAndHandleFreshInstall } from './services/financeService';
import { registerFinanceTools } from './lib/webmcp';
import { getFinoraTheme } from './theme/muiTheme';
import { fetchVietQRBanks } from './lib/bankService';
import { getAppEnvironmentMode, navigateToApp } from './lib/domainRouting';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import './styles.css';

// Listen to Capacitor Deep Links on Native Mobile
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  CapApp.addListener('appUrlOpen', (event) => {
    try {
      const rawUrl = event.url;
      const normalized = rawUrl.replace(/^vn\.finora\.app:\/\//, 'https://finora.local/').replace(/^finora:\/\//, 'https://finora.local/');
      const parsed = new URL(normalized);
      const session = parsed.searchParams.get('session');
      const token = parsed.searchParams.get('token');
      if (session) {
        localStorage.setItem('finora:auth-user', decodeURIComponent(session));
        if (token) {
          localStorage.setItem('finora:auth-token', decodeURIComponent(token));
        }
        window.location.href = '/';
      }
    } catch (err) {
      console.warn('[Capacitor] Lỗi phân tích deep link:', err);
    }
  });
}

function RedirectToLanding() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('https://tichsan.site/');
    }
  }, []);
  return null;
}

function AuthRoute() {
  const [searchParams] = useSearchParams();
  const isForced = searchParams.get('logout') === 'true' || searchParams.get('force') === 'true' || searchParams.get('switch') === 'true';

  useEffect(() => {
    if (isForced) {
      void mockFinanceService.logoutUser().then(() => {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('logout');
          url.searchParams.delete('force');
          url.searchParams.delete('switch');
          window.history.replaceState({}, document.title, url.pathname + (url.search || '') + url.hash);
        }
      });
    }
  }, [isForced]);

  const currentUser = isForced ? null : mockFinanceService.getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isForced && currentUser && typeof window !== 'undefined') {
      navigateToApp('/', (path) => navigate(path, { replace: true }));
    }
  }, [currentUser, navigate, isForced]);

  if (currentUser && !isForced) {
    return null;
  }
  return <Auth />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = mockFinanceService.getCurrentUser();

  useEffect(() => {
    if (!currentUser && typeof window !== 'undefined') {
      const { hostname, port } = window.location;
      if (hostname === 'app.tichsan.site') {
        window.location.replace('https://auth.tichsan.site/login');
      } else if (port === '7000') {
        window.location.replace(`http://${hostname}:7002/login`);
      }
    }
  }, [currentUser]);

  if (!currentUser) {
    if (typeof window !== 'undefined') {
      const { hostname, port } = window.location;
      if (hostname === 'app.tichsan.site' || port === '7000') {
        return null;
      }
    }
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
}

export function Loading() {
  return (
    <div className="app" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <div
        className="sidebar"
        style={{
          width: 'var(--sidebar-w)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div className="skeleton" style={{ height: 36, width: '70%', borderRadius: 4, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 28, width: '100%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 28, width: '85%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 28, width: '90%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 28, width: '80%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 28, width: '75%', borderRadius: 4 }} />
      </div>

      <div className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          className="topbar"
          style={{
            height: 'var(--topbar-h)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px'
          }}
        >
          <div className="skeleton" style={{ height: 24, width: 180, borderRadius: 4 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skeleton" style={{ height: 32, width: 32, borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 32, width: 120, borderRadius: 4 }} />
          </div>
        </div>

        <main className="content" style={{ padding: '24px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div className="skeleton" style={{ height: 16, width: 90, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 30, width: 220, borderRadius: 4 }} />
            </div>
            <div className="skeleton" style={{ height: 36, width: 140, borderRadius: 4 }} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}
          >
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '20px'
                }}
              >
                <div className="skeleton" style={{ height: 14, width: '50%', borderRadius: 4, marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 28, width: '75%', borderRadius: 4 }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '20px' }}>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '20px'
              }}
            >
              <div className="skeleton" style={{ height: 20, width: 160, borderRadius: 4, marginBottom: 20 }} />
              <div className="skeleton" style={{ height: 240, width: '100%', borderRadius: 4 }} />
            </div>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '20px'
              }}
            >
              <div className="skeleton" style={{ height: 20, width: 140, borderRadius: 4, marginBottom: 20 }} />
              <div className="skeleton" style={{ height: 240, width: '100%', borderRadius: 4 }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { load, theme } = useFinance();
  const [initialReady, setInitialReady] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('finora:splash_shown');
      if (!alreadyShown) {
        sessionStorage.setItem('finora:splash_shown', 'true');
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    void checkAndHandleFreshInstall()
      .then(() => load())
      .finally(() => {
        setInitialReady(true);
      });
  }, [load]);

  useEffect(() => {
    void fetchVietQRBanks();
    return registerFinanceTools();
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const muiTheme = useMemo(() => getFinoraTheme(theme), [theme]);

  if (!initialReady || showSplash) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </ThemeProvider>
    );
  }

  const envMode = getAppEnvironmentMode();

  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <BrowserRouter>
          <GlobalNotificationToast />
          <CookieConsentBanner />

          {/* 1. CHẾ ĐỘ PHÂN HỆ LANDING (tichsan.site HOẶC CỔNG 5175 / 7001) */}
          {envMode === 'landing' && (
            <Routes>
              <Route index element={<LandingPage />} />
              <Route path="landing" element={<LandingPage />} />
              <Route path="login" element={<AuthRoute />} />
              <Route path="register" element={<AuthRoute />} />
              <Route path="forgot" element={<AuthRoute />} />
              <Route path="reset" element={<AuthRoute />} />
              <Route path="auth" element={<AuthRoute />} />
              <Route path="auth/:mode" element={<AuthRoute />} />
              <Route path="legal" element={<LegalPublicView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}

          {/* 2. CHẾ ĐỘ PHÂN HỆ AUTH (auth.tichsan.site HOẶC CỔNG 5174 / 7002) */}
          {envMode === 'auth' && (
            <Routes>
              <Route index element={<AuthRoute />} />
              <Route path="login" element={<AuthRoute />} />
              <Route path="register" element={<AuthRoute />} />
              <Route path="forgot" element={<AuthRoute />} />
              <Route path="reset" element={<AuthRoute />} />
              <Route path="auth" element={<AuthRoute />} />
              <Route path="auth/:mode" element={<AuthRoute />} />
              <Route path="legal" element={<LegalPublicView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}

          {/* 3. CHẾ ĐỘ PHÂN HỆ APP (app.tichsan.site) HOẶC UNIFIED LOCALHOST */}
          {envMode !== 'landing' && envMode !== 'auth' && (
            <Routes>
              {/* Nếu ở chế độ App riêng, chuyển hướng /landing sang domain landing chính */}
              <Route
                path="landing"
                element={
                  envMode === 'app' ? (
                    <RedirectToLanding />
                  ) : (
                    <LandingPage />
                  )
                }
              />
              <Route path="login" element={<AuthRoute />} />
              <Route path="register" element={<AuthRoute />} />
              <Route path="forgot" element={<AuthRoute />} />
              <Route path="reset" element={<AuthRoute />} />
              <Route path="auth" element={<AuthRoute />} />
              <Route path="auth/:mode" element={<AuthRoute />} />
              <Route path="legal" element={<LegalPublicView />} />

              {/* SEPARATE INDEPENDENT ADMIN CONSOLE ENVIRONMENT */}
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardView />} />
                <Route path="dashboard" element={<AdminDashboardView />} />
                <Route path="users" element={<AdminUsersView />} />
                <Route path="subscriptions" element={<AdminSubscriptionsView />} />
                <Route path="finance" element={<AdminFinanceView />} />
                <Route path="revenue" element={<AdminFinanceView />} />
                <Route path="reports" element={<AdminReportsView />} />
                <Route path="system" element={<AdminSystemHealthView />} />
                <Route path="audit-logs" element={<AdminAuditLogsView />} />
                <Route path="legal" element={<AdminLegalView />} />
                <Route path="settings" element={<AdminSettingsView />} />
              </Route>

              {/* CONSUMER PERSONAL FINANCE APPLICATION SHELL (PROTECTED) */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="assets" element={<Assets />} />
                <Route path="payroll" element={<Payroll />} />
                <Route path="income" element={<IncomeManagementView />} />
                <Route path="categories" element={<Categories />} />
                <Route path="budgets" element={<Budgets />} />
                <Route path="savings" element={<Savings />} />
                <Route path="debts" element={<Debts />} />
                <Route path="reports" element={<Reports />} />
                <Route path="recurring" element={<Recurring />} />
                <Route path="pricing" element={<PricingPage />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          )}
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
