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
  TablePagination
} from '@mui/material';
import {
  RefreshCw
} from 'lucide-react';

import { useFinance } from '../../store';
import { money, todayKey } from '../../lib/finance';
import { PageHead, Confirm } from '../../components/ui';
import { HelpButton } from '../../components/HelpButton';
import { marketApiClient } from '../../services/marketApiClient';
import { QuickInvestmentBar } from '../../components/investment/QuickInvestmentBar';
import { UnifiedPortfolioDashboard } from '../../components/investment/UnifiedPortfolioDashboard';
import { DataSourceSettingsModal } from '../../components/investment/DataSourceSettingsModal';
import { NetWorthControlHeader } from '../../components/smartLedger/NetWorthControlHeader';
import { QuickInvestmentNoteForm } from '../../components/smartLedger/QuickInvestmentNoteForm';
import { UnrecoveredAssetsTable } from '../../components/smartLedger/UnrecoveredAssetsTable';
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
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'positions' | 'transactions'>('overview');
  const [txPage, setTxPage] = useState(0);
  const [txRowsPerPage, setTxRowsPerPage] = useState(10);
  const [deleting, setDeleting] = useState<InvestmentAsset | null>(null);

  if (!data) return null;

  const notes = useMemo(() => {
    if (data.smartInvestmentNotes && data.smartInvestmentNotes.length > 0) {
      return data.smartInvestmentNotes;
    }
    return getSampleWealthInvestmentNotes();
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
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
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
          <QuickInvestmentNoteForm />
          <UnrecoveredAssetsTable notes={notes} />
        </Box>
      )}

      {/* TAB 3: VỊ THẾ DANH MỤC ĐẦU TƯ CHỨNG KHOÁN / VÀNG */}
      {activeTab === 'positions' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <QuickInvestmentBar onSuccess={handleRefreshMarketPrices} />
          <UnifiedPortfolioDashboard
            onOpenSettings={() => setOpenDataSourceModal(true)}
            onOpenAddModal={() => setActiveTab('ledger')}
            onOpenOrderModal={() => {}}
          />
        </Box>
      )}

      {/* TAB 4: SỔ CÁI GIAO DỊCH KẾ TOÁN */}
      {activeTab === 'transactions' && (
        <Card sx={{ p: 0, overflow: 'hidden', borderRadius: '6px', border: '1px solid', borderColor: 'divider' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Ngày</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Loại lệnh</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Mã tài sản</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Số lượng</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Đơn giá</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Tổng tiền</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Thuế & Phí</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Ghi chú / Lãi lỗ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {investmentTransactions.length > 0 ? (
                  investmentTransactions
                    .slice(txPage * txRowsPerPage, txPage * txRowsPerPage + txRowsPerPage)
                    .map(tx => (
                      <TableRow key={tx.id} hover>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>{tx.date}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={tx.type}
                            color={tx.type.includes('BUY') || tx.type.includes('DEPOSIT') ? 'primary' : tx.type.includes('SELL') ? 'warning' : 'success'}
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>{tx.symbol}</TableCell>
                        <TableCell align="right">{new Intl.NumberFormat('vi-VN').format(tx.quantity)}</TableCell>
                        <TableCell align="right">{money(tx.unitPrice)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{money(tx.totalAmount)}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          {money((tx.fee || 0) + (tx.tax || 0))}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem' }}>
                          {tx.realizedPnL !== undefined && (
                            <span style={{ fontWeight: 700, color: tx.realizedPnL >= 0 ? '#10b981' : '#ef4444' }}>
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
    </Box>
  );
}
