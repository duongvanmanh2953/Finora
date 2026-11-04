import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography
} from '@mui/material';
import {
  RefreshCw,
  Plus
} from 'lucide-react';

import { useFinance } from '../../store';
import { money, todayKey } from '../../lib/finance';
import { PageHead, Confirm } from '../../components/ui';
import { HelpButton } from '../../components/HelpButton';
import { marketApiClient } from '../../services/marketApiClient';
import { QuickInvestmentBar } from '../../components/investment/QuickInvestmentBar';
import { UnifiedPortfolioDashboard } from '../../components/investment/UnifiedPortfolioDashboard';
import { DataSourceSettingsModal } from '../../components/investment/DataSourceSettingsModal';
import { AddInvestmentModal } from '../../components/investment/AddInvestmentModal';
import { NetWorthControlHeader } from '../../components/smartLedger/NetWorthControlHeader';
import { QuickInvestmentNoteForm } from '../../components/smartLedger/QuickInvestmentNoteForm';
import { UnrecoveredAssetsTable, getHiddenAssetIds } from '../../components/smartLedger/UnrecoveredAssetsTable';
import { AssetProjectionSection } from '../../components/smartLedger/AssetProjectionSection';
import {
  calculateComprehensiveNetWorth,
  getSampleWealthInvestmentNotes
} from '../../lib/investmentProjectionEngine';
import { VIETNAMESE_ASSET_CATALOG } from '../../lib/investmentEngine';
import type { InvestmentAsset } from '../../types';

export default function Assets() {
  const { data, update } = useFinance();
  const [openDataSourceModal, setOpenDataSourceModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'positions' | 'transactions'>('overview');
  const [txPage, setTxPage] = useState(0);
  const [txRowsPerPage, setTxRowsPerPage] = useState(10);
  const [deleting, setDeleting] = useState<InvestmentAsset | null>(null);

  if (!data) return null;

  const notes = useMemo(() => {
    const rawNotes = (data.smartInvestmentNotes && data.smartInvestmentNotes.length > 0)
      ? data.smartInvestmentNotes
      : getSampleWealthInvestmentNotes();
    const hiddenSet = new Set(getHiddenAssetIds());
    return rawNotes.map(n => ({
      ...n,
      include_in_net_worth: hiddenSet.has(n.id) ? false : (n.include_in_net_worth !== false)
    }));
  }, [data.smartInvestmentNotes]);

  const hideRiskyAssets = Boolean(data.hideRiskyAssetsGlobal);

  // Tính toán Tổng tài sản, Tài sản ròng & Cơ cấu rủi ro chuẩn Fintech
  const totalCashBalance = useMemo(() => {
    return (data.accounts || [])
      .filter(a => a.type === 'cash' || a.type === 'bank' || a.type === 'ewallet')
      .reduce((sum, a) => sum + (a.openingBalance || 0), 0);
  }, [data.accounts]);

  const totalLiabilities = useMemo(() => {
    return (data.debts || [])
      .filter(d => d.kind === 'owed')
      .reduce((sum, d) => sum + (d.principal || 0), 0);
  }, [data.debts]);

  const netWorthSummary = useMemo(() => {
    return calculateComprehensiveNetWorth(
      totalCashBalance,
      notes,
      totalLiabilities,
      hideRiskyAssets
    );
  }, [totalCashBalance, notes, totalLiabilities, hideRiskyAssets]);

  const investments = data.investments || [];
  const investmentTransactions = data.investmentTransactions || [];

  // Toggle Safe Mode
  const handleToggleSafeMode = async (hide: boolean) => {
    await update(d => ({
      ...d,
      hideRiskyAssetsGlobal: hide
    }), hide ? 'Đã kích hoạt Chế độ Thận trọng (Safe Mode)' : 'Đã chuyển về Chế độ Đầy đủ');
  };

  // Refresh Market Prices
  const handleRefreshMarketPrices = async () => {
    setRefreshing(true);
    try {
      const refreshedInvestments = await Promise.all(
        investments.map(async inv => {
          const symbolKey = inv.symbol.toUpperCase();
          const quote = await marketApiClient.getQuote(symbolKey);
          if (quote && quote.currentPrice > 0) {
            return {
              ...inv,
              currentUnitPrice: quote.currentPrice,
              freshness: (quote.dataStatus as any) || 'realtime',
              updatedAt: todayKey()
            };
          }
          const catalogMatch = VIETNAMESE_ASSET_CATALOG.find(c => c.symbol.toUpperCase() === symbolKey);
          return {
            ...inv,
            currentUnitPrice: catalogMatch?.referencePrice || inv.currentUnitPrice,
            freshness: catalogMatch?.freshness || inv.freshness || 'reference',
            updatedAt: todayKey()
          };
        })
      );

      await update(d => ({
        ...d,
        investments: refreshedInvestments
      }), 'Đã đồng bộ giá thị trường Finnhub & Sổ bộ thành công!');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!deleting) return;
    await update(d => ({
      ...d,
      investments: (d.investments || []).filter(inv => inv.id !== deleting.id)
    }), `Đã xóa tài sản ${deleting.symbol}`);
    setDeleting(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 1. Page Header */}
      <PageHead
        title="Quản Lý Tài Sản & Vốn Đầu Tư"
        subtitle="Hệ thống Personal Wealth Management: Phân biệt Tiền thực có, Vốn chưa thu hồi, Cơ cấu 4 cấp độ rủi ro & Dự phóng tài chính"
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <HelpButton pageKey="assets" />
            <Button
              variant="outlined"
              onClick={() => setOpenDataSourceModal(true)}
              size="small"
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 650 }}
            >
              Nguồn Finnhub / MCP
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={16} className={refreshing ? 'spin' : ''} />}
              onClick={handleRefreshMarketPrices}
              size="small"
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 650 }}
            >
              Đồng bộ giá thị trường
            </Button>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setOpenAddModal(true)}
              size="small"
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 750,
                bgcolor: 'var(--brand-primary, #355E52)',
                '&:hover': { bgcolor: 'var(--brand-primary-hover, #2A4E44)' }
              }}
            >
              Thêm mục đầu tư
            </Button>
          </Box>
        }
      />

      {/* 2. Master Net Worth Control Header & Dual Mode Bento */}
      <NetWorthControlHeader
        summary={netWorthSummary}
        hideRiskyAssets={hideRiskyAssets}
        onToggleHideRiskyAssets={handleToggleSafeMode}
      />

      {/* 3. Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => { setActiveTab(v); setTxPage(0); }}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              py: 0.5,
              px: 2,
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'none'
            }
          }}
        >
          <Tab value="overview" label="Tổng quan & Dự phóng tương lai" />
          <Tab value="ledger" label={`Sổ theo dõi Vốn & Thu hồi (${notes.length})`} />
          <Tab value="positions" label={`Vị thế danh mục (${investments.length})`} />
          <Tab value="transactions" label={`Sổ cái giao dịch (${investmentTransactions.length})`} />
        </Tabs>
      </Box>

      {/* TAB 1: TỔNG QUAN & DỰ PHÓNG TÀI SẢN */}
      {activeTab === 'overview' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={15} />}
              onClick={() => setOpenAddModal(true)}
              sx={{
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: 'var(--brand-primary, #355E52)',
                '&:hover': { bgcolor: 'var(--brand-primary-hover, #2A4E44)' }
              }}
            >
              Thêm mục đầu tư mới
            </Button>
          </Box>
          <AssetProjectionSection
            currentNetWorth={netWorthSummary.headlineNetWorth}
            initialMonthlySavings={5000000}
            initialExpectedRate={8.5}
          />
        </Box>
      )}

      {/* TAB 2: SỔ THEO DÕI VỐN & THU HỒI */}
      {activeTab === 'ledger' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <UnrecoveredAssetsTable notes={notes} onOpenAddModal={() => setOpenAddModal(true)} />
          <QuickInvestmentNoteForm />
        </Box>
      )}

      {/* TAB 3: VỊ THẾ DANH MỤC ĐẦU TƯ CHỨNG KHOÁN / VÀNG */}
      {activeTab === 'positions' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Danh mục vị thế nắm giữ
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={15} />}
              onClick={() => setOpenAddModal(true)}
              sx={{
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: 'var(--brand-primary, #355E52)',
                '&:hover': { bgcolor: 'var(--brand-primary-hover, #2A4E44)' }
              }}
            >
              Thêm mục đầu tư
            </Button>
          </Box>
          <QuickInvestmentBar onSuccess={handleRefreshMarketPrices} />
          <UnifiedPortfolioDashboard
            onOpenSettings={() => setOpenDataSourceModal(true)}
            onOpenAddModal={() => setOpenAddModal(true)}
            onOpenOrderModal={() => setOpenAddModal(true)}
          />
        </Box>
      )}

      {/* TAB 4: SỔ CÁI GIAO DỊCH KẾ TOÁN */}
      {activeTab === 'transactions' && (
        <Card sx={{ p: 0, overflow: 'hidden', borderRadius: '6px', border: '1px solid', borderColor: 'divider' }}>
          <TableContainer sx={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow sx={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <TableCell sx={{ fontWeight: 500, fontSize: '9px', color: 'text.secondary', py: 1, px: 1.25 }}>NGÀY</TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '9px', color: 'text.secondary', py: 1, px: 1.25 }}>LOẠI LỆNH</TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '9px', color: 'text.secondary', py: 1, px: 1.25 }}>MÃ TÀI SẢN</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, fontSize: '9px', color: 'text.secondary', py: 1, px: 1.25 }}>SỐ LƯỢNG</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, fontSize: '9px', color: 'text.secondary', py: 1, px: 1.25 }}>ĐƠN GIÁ</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, fontSize: '9px', color: 'text.secondary', py: 1, px: 1.25 }}>TỔNG TIỀN</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, fontSize: '9px', color: 'text.secondary', py: 1, px: 1.25 }}>THUẾ & PHÍ</TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '9px', color: 'text.secondary', py: 1, px: 1.25 }}>GHI CHÚ / LÃI LỖ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {investmentTransactions.length > 0 ? (
                  investmentTransactions
                    .slice(txPage * txRowsPerPage, txPage * txRowsPerPage + txRowsPerPage)
                    .map(tx => (
                      <TableRow key={tx.id} hover sx={{ '& td': { py: 0.85, px: 1.25 } }}>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.74rem', fontFeatureSettings: '"tnum"' }}>{tx.date}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={tx.type}
                            color={tx.type.includes('BUY') || tx.type.includes('DEPOSIT') ? 'primary' : tx.type.includes('SELL') ? 'warning' : 'success'}
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.66rem', height: 18, borderRadius: '4px' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.76rem' }}>{tx.symbol}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem', fontFeatureSettings: '"tnum"' }}>{new Intl.NumberFormat('vi-VN').format(tx.quantity)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem', fontFeatureSettings: '"tnum"' }}>{money(tx.unitPrice)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 750, fontSize: '0.75rem', fontFeatureSettings: '"tnum"' }}>{money(tx.totalAmount)}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.74rem', fontFeatureSettings: '"tnum"' }}>
                          {money((tx.fee || 0) + (tx.tax || 0))}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.74rem' }}>
                          {tx.realizedPnL !== undefined && (
                            <span style={{ fontWeight: 750, color: tx.realizedPnL >= 0 ? '#10b981' : '#ef4444' }}>
                              [{tx.realizedPnL >= 0 ? '+' : ''}{money(tx.realizedPnL)}] ·{' '}
                            </span>
                          )}
                          {tx.note || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      Chưa có giao dịch kế toán đầu tư nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={investmentTransactions.length}
            page={txPage}
            onPageChange={(_, p) => setTxPage(p)}
            rowsPerPage={txRowsPerPage}
            onRowsPerPageChange={e => {
              setTxRowsPerPage(parseInt(e.target.value, 10));
              setTxPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20]}
            labelRowsPerPage="Số hàng / trang:"
          />
        </Card>
      )}

      {/* Delete Confirmation */}
      <Confirm
        open={Boolean(deleting)}
        title="Xóa tài sản đầu tư?"
        message={`Bạn có chắc muốn xóa mã ${deleting?.symbol}? Toàn bộ lịch sử vị thế sẽ bị xóa.`}
        onConfirm={handleDeleteAsset}
        onClose={() => setDeleting(null)}
      />

      {/* Market Data & Finnhub Config Modal */}
      <DataSourceSettingsModal
        open={openDataSourceModal}
        onClose={() => setOpenDataSourceModal(false)}
      />

      {/* Add Investment Modal */}
      <AddInvestmentModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSuccess={handleRefreshMarketPrices}
      />
    </Box>
  );
}
