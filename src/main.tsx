import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { SplashScreen } from './components/ui/SplashScreen';
import { Layout } from './components/Layout';
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
import { mockFinanceService } from './services/financeService';
import { registerFinanceTools } from './lib/webmcp';
import { getFinoraTheme } from './theme/muiTheme';
import { fetchVietQRBanks } from './lib/bankService';
import './styles.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = mockFinanceService.getCurrentUser();
  if (!currentUser) {
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
  const { load, loading, error, theme } = useFinance();
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
    load();
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

  if (loading || showSplash) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <div className="app" style={{ padding: 40 }}>
        <div className="card pad">
          {error}
          <button className="btn" onClick={load}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="landing" element={<LandingPage />} />
            <Route path="auth/:mode" element={<Auth />} />
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
