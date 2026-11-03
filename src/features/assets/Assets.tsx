import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Autocomplete
} from '@mui/material';
import {
  Plus,
  RefreshCw,
  Trash2,
  ArrowRightLeft
} from 'lucide-react';

import { useFinance } from '../../store';
import {
  calculateInvestmentSummary,
  MARKET_PRICES
} from '../../lib/riskAndInsightEngine';
import { money, todayKey, uid } from '../../lib/finance';
import { PageHead, Confirm } from '../../components/ui';
import { MuiTextField, MuiCurrencyInput, MuiSelect } from '../../components/mui/MuiInputs';
import { AssetLogoBadge } from '../../lib/brandBadges';
import { isProUser } from '../../lib/subscription';
import {
  VIETNAMESE_ASSET_CATALOG,
  calculateWeightedAverageBuy,
  calculateSellOrder,
  calculateSLTPMetrics,
  type AssetCatalogItem
} from '../../lib/investmentEngine';
import type {
  AssetClass,
  InvestmentAsset,
  InvestmentTransaction,
  InvestmentTxType
} from '../../types';

export default function Assets() {
  const { data, update, notify, openPricing } = useFinance();
  const [openModal, setOpenModal] = useState(false);
  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [selectedAssetForOrder, setSelectedAssetForOrder] = useState<InvestmentAsset | null>(null);
  const [deleting, setDeleting] = useState<InvestmentAsset | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'positions' | 'transactions'>('positions');

  // Form for adding new position / asset
  const [form, setForm] = useState({
    symbol: 'FPT',
    name: 'Công ty Cổ phần FPT',
    assetClass: 'stock' as AssetClass,
    quantity: '100',
    totalCostBasis: '12000000',
    currentUnitPrice: '138000',
    annualYieldRate: '',
    targetTakeProfit: '160000',
    targetStopLoss: '122000',
    notes: 'Đầu tư dài hạn công nghệ'
  });

  // Form for Ledger Transaction Order (BUY, SELL, DIVIDEND...)
  const [orderForm, setOrderForm] = useState({
    type: 'BUY' as InvestmentTxType,
    quantity: '50',
    unitPrice: '138000',
    fee: '15000',
    note: ''
  });

  if (!data) return null;

  const isPro = isProUser(data);
  const investments = data.investments || [];
  const investmentTransactions = data.investmentTransactions || [];
  const summary = calculateInvestmentSummary(investments);

  //  Market Price Refresh
  const handleRefreshMarketPrices = async () => {
    setRefreshing(true);
    await update(d => {
      const updated = (d.investments || []).map(inv => {
        const symbolKey = inv.symbol.toUpperCase();
        const catalogMatch = VIETNAMESE_ASSET_CATALOG.find(c => c.symbol.toUpperCase() === symbolKey);
        const marketPrice = catalogMatch?.referencePrice || MARKET_PRICES[symbolKey] || inv.currentUnitPrice;
        return {
          ...inv,
          currentUnitPrice: marketPrice,
          freshness: catalogMatch?.freshness || inv.freshness || 'realtime',
          updatedAt: todayKey()
        };
      });
      return { ...d, investments: updated };
    }, 'Đã cập nhật bảng giá thị trường mới nhất ()!');
    setRefreshing(false);
  };

  const handleSelectCatalogItem = (item: AssetCatalogItem | null) => {
    if (!item) return;
    setForm(prev => ({
      ...prev,
      symbol: item.symbol,
      name: item.name,
      assetClass: item.assetClass,
      currentUnitPrice: String(item.referencePrice),
      totalCostBasis: String(Number(prev.quantity || 100) * item.referencePrice)
    }));
  };

  const handleSaveAsset = async () => {
    if (!form.symbol.trim() || Number(form.quantity) <= 0 || Number(form.totalCostBasis) <= 0) {
      notify('Vui lòng điền đầy đủ mã, số lượng và tổng vốn');
      return;
    }

    if (!isPro && investments.length >= 2) {
      setOpenModal(false);
      openPricing('Gói Free hỗ trợ theo dõi tối đa 2 mã đầu tư. Nâng cấp Pro để quản lý danh mục không giới hạn!');
      return;
    }

    const unitPrice =
      Number(form.currentUnitPrice) > 0
        ? Number(form.currentUnitPrice)
        : Math.round(Number(form.totalCostBasis) / Number(form.quantity));

    const sltp = calculateSLTPMetrics(
      Math.round(Number(form.totalCostBasis) / Number(form.quantity)),
      unitPrice,
      form.targetTakeProfit ? Number(form.targetTakeProfit) : undefined,
      form.targetStopLoss ? Number(form.targetStopLoss) : undefined
    );

    const newAsset: InvestmentAsset = {
      id: uid(),
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim() || form.symbol.trim().toUpperCase(),
      assetClass: form.assetClass,
      quantity: Number(form.quantity),
      totalCostBasis: Number(form.totalCostBasis),
      currentUnitPrice: unitPrice,
      annualYieldRate: form.annualYieldRate ? Number(form.annualYieldRate) : undefined,
      targetTakeProfit: form.targetTakeProfit ? Number(form.targetTakeProfit) : undefined,
      targetStopLoss: form.targetStopLoss ? Number(form.targetStopLoss) : undefined,
      riskRewardRatio: sltp.riskRewardRatio,
      freshness: 'realtime',
      notes: form.notes,
      updatedAt: todayKey()
    };

    // Also create initial BUY ledger transaction
    const initialTx: InvestmentTransaction = {
      id: uid(),
      assetId: newAsset.id,
      symbol: newAsset.symbol,
      type: 'BUY',
      date: todayKey(),
      quantity: newAsset.quantity,
      unitPrice: Math.round(newAsset.totalCostBasis / newAsset.quantity),
      totalAmount: newAsset.totalCostBasis,
      fee: 0,
      tax: 0,
      note: 'Vị thế khởi tạo ban đầu'
    };

    await update(d => ({
      ...d,
      investments: [...(d.investments || []), newAsset],
      investmentTransactions: [initialTx, ...(d.investmentTransactions || [])]
    }), `Đã thêm tài sản đầu tư "${newAsset.symbol}"!`);

    setOpenModal(false);
  };

  const handleOpenOrder = (asset: InvestmentAsset) => {
    setSelectedAssetForOrder(asset);
    setOrderForm({
      type: 'BUY',
      quantity: '100',
      unitPrice: String(asset.currentUnitPrice),
      fee: '15000',
      note: ''
    });
    setOpenOrderModal(true);
  };

  const handleExecuteOrder = async () => {
    if (!selectedAssetForOrder) return;
    const qty = Number(orderForm.quantity);
    const price = Number(orderForm.unitPrice);
    const fee = Number(orderForm.fee) || 0;

    if (qty <= 0 || price <= 0) {
      notify('Số lượng và giá phải lớn hơn 0');
      return;
    }

    await update(d => {
      let updatedInvestments = [...(d.investments || [])];
      let newTx: InvestmentTransaction;

      const idx = updatedInvestments.findIndex(inv => inv.id === selectedAssetForOrder.id);
      if (idx === -1) return d;

      const current = updatedInvestments[idx];

      if (orderForm.type === 'BUY' || orderForm.type === 'DEPOSIT_FUND') {
        const { newQuantity, newTotalCostBasis } = calculateWeightedAverageBuy(
          current.quantity,
          current.totalCostBasis,
          qty,
          price,
          fee
        );
        updatedInvestments[idx] = {
          ...current,
          quantity: newQuantity,
          totalCostBasis: newTotalCostBasis,
          currentUnitPrice: price,
          updatedAt: todayKey()
        };

        newTx = {
          id: uid(),
          assetId: current.id,
          symbol: current.symbol,
          type: orderForm.type,
          date: todayKey(),
          quantity: qty,
          unitPrice: price,
          totalAmount: Math.round(qty * price + fee),
          fee,
          tax: 0,
          note: orderForm.note || 'Lệnh mua thêm'
        };
      } else if (orderForm.type === 'SELL' || orderForm.type === 'REDEEM_FUND') {
        if (qty > current.quantity) {
          throw new Error('Số lượng bán vượt quá số lượng đang nắm giữ');
        }
        const sellResult = calculateSellOrder(
          current.quantity,
          current.totalCostBasis,
          qty,
          price,
          fee
        );

        if (sellResult.remainingQty === 0) {
          // Sold out
          updatedInvestments = updatedInvestments.filter(inv => inv.id !== current.id);
        } else {
          updatedInvestments[idx] = {
            ...current,
            quantity: sellResult.remainingQty,
            totalCostBasis: sellResult.remainingCostBasis,
            currentUnitPrice: price,
            updatedAt: todayKey()
          };
        }

        newTx = {
          id: uid(),
          assetId: current.id,
          symbol: current.symbol,
          type: orderForm.type,
          date: todayKey(),
          quantity: qty,
          unitPrice: price,
          totalAmount: sellResult.grossAmount,
          fee,
          tax: sellResult.taxAmount,
          realizedPnL: sellResult.realizedPnL,
          note: orderForm.note || `Lệnh bán chốt lời/lỗ: ${money(sellResult.realizedPnL)}`
        };
      } else {
        // Dividend cash
        newTx = {
          id: uid(),
          assetId: current.id,
          symbol: current.symbol,
          type: orderForm.type,
          date: todayKey(),
          quantity: qty,
          unitPrice: price,
          totalAmount: Math.round(qty * price),
          fee: 0,
          tax: Math.round(qty * price * 0.05),
          note: orderForm.note || 'Nhận cổ tức tiền mặt'
        };
      }

      return {
        ...d,
        investments: updatedInvestments,
        investmentTransactions: [newTx, ...(d.investmentTransactions || [])]
      };
    }, `Đã ghi nhận giao dịch ${orderForm.type} cho ${selectedAssetForOrder.symbol}!`);

    setOpenOrderModal(false);
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHead
        title="Danh mục Đầu tư Đa Tài sản"
        subtitle="Sổ cái kế toán vị thế, giá vốn bình quân gia quyền, quản lý kế hoạch Cắt lỗ (SL) & Chốt lời (TP) và định giá thị trường"
        actions={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={16} className={refreshing ? 'spin' : ''} />}
              onClick={handleRefreshMarketPrices}
              size="small"
            >
              Cập nhật giá thị trường ()
            </Button>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setOpenModal(true)}
              size="small"
            >
              Thêm vị thế đầu tư
            </Button>
          </Box>
        }
      />

      {/* Top Portfolio Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
            Tổng Vốn Đầu Tư (Cost Basis)
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
            {money(summary.totalCostBasis)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
            Giá Trị Thị Trường Hiện Tại
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
            {money(summary.totalCurrentValue)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
            Lãi / Lỗ Chưa Chốt (Unrealized P/L)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: summary.totalPnL >= 0 ? '#10b981' : '#ef4444'
              }}
            >
              {summary.totalPnL >= 0 ? '+' : ''}{money(summary.totalPnL)}
            </Typography>
            <Chip
              size="small"
              label={`${summary.totalPnLPercent >= 0 ? '+' : ''}${summary.totalPnLPercent.toFixed(1)}%`}
              sx={{
                bgcolor: summary.totalPnL >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: summary.totalPnL >= 0 ? '#10b981' : '#ef4444',
                fontWeight: 700
              }}
            />
          </Box>
        </Paper>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
            Số Mã Đang Nắm Giữ
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
            {investments.length} tài sản
          </Typography>
        </Paper>
      </Box>

      {/* Tabs: Positions vs Transactions */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab value="positions" label={`Vị thế danh mục (${investments.length})`} />
          <Tab value="transactions" label={`Sổ cái giao dịch (${investmentTransactions.length})`} />
        </Tabs>
      </Box>

      {activeTab === 'positions' && (
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tài sản & Mã</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phân loại</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Số lượng</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Giá vốn BQ</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Giá thị trường</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Lãi / Lỗ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Kế hoạch SL / TP</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {investments.map(inv => {
                  const currentValue = Math.round(inv.quantity * inv.currentUnitPrice);
                  const pnl = currentValue - inv.totalCostBasis;
                  const pnlPercent = inv.totalCostBasis > 0 ? (pnl / inv.totalCostBasis) * 100 : 0;
                  const avgCost = inv.quantity > 0 ? Math.round(inv.totalCostBasis / inv.quantity) : 0;

                  const sltp = calculateSLTPMetrics(
                    avgCost,
                    inv.currentUnitPrice,
                    inv.targetTakeProfit,
                    inv.targetStopLoss
                  );

                  return (
                    <TableRow key={inv.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <AssetLogoBadge symbol={inv.symbol} name={inv.name} size="medium" />
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {inv.symbol}
                              </Typography>
                              {inv.freshness && (
                                <Chip
                                  size="small"
                                  label={inv.freshness === 'realtime' ? 'Realtime' : inv.freshness === 'nav_published' ? 'NAV' : 'EOD'}
                                  sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {inv.name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            inv.assetClass === 'stock'
                              ? 'Cổ phiếu'
                              : inv.assetClass === 'fund'
                              ? 'Quỹ mở'
                              : inv.assetClass === 'etf'
                              ? 'Quỹ ETF'
                              : inv.assetClass === 'gold'
                              ? 'Vàng'
                              : inv.assetClass === 'savings'
                              ? 'Tiết kiệm'
                              : inv.assetClass === 'crypto'
                              ? 'Crypto'
                              : 'Tài sản'
                          }
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {new Intl.NumberFormat('vi-VN').format(inv.quantity)}
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {money(avgCost)}
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {money(inv.currentUnitPrice)}
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: pnl >= 0 ? '#10b981' : '#ef4444'
                          }}
                        >
                          {pnl >= 0 ? '+' : ''}{money(pnl)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: pnl >= 0 ? '#10b981' : '#ef4444'
                          }}
                        >
                          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {inv.targetTakeProfit || inv.targetStopLoss ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              size="small"
                              label={sltp.statusLabel}
                              sx={{
                                bgcolor: `${sltp.statusColor}20`,
                                color: sltp.statusColor,
                                fontWeight: 700,
                                fontSize: '0.7rem'
                              }}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                              TP: {inv.targetTakeProfit ? money(inv.targetTakeProfit) : '—'} · SL: {inv.targetStopLoss ? money(inv.targetStopLoss) : '—'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Chưa đặt SL/TP</Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ArrowRightLeft size={14} />}
                            onClick={() => handleOpenOrder(inv)}
                            sx={{ fontSize: '0.75rem', py: 0.4 }}
                          >
                            Giao dịch
                          </Button>
                          <IconButton size="small" color="error" onClick={() => setDeleting(inv)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Ngày</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Loại lệnh</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mã tài sản</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Số lượng</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Đơn giá khớp</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Tổng tiền</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Thuế & Phí</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ghi chú / Lãi lỗ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {investmentTransactions.length > 0 ? (
                  investmentTransactions.map(tx => (
                    <TableRow key={tx.id} hover>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{tx.date}</TableCell>
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
                      <TableCell sx={{ fontSize: '0.85rem' }}>
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
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                      Chưa có giao dịch kế toán đầu tư nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Modal: Add New Investment Position with Catalog Picker */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Thêm Vị Thế Đầu Tư Mới</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Autocomplete
            options={VIETNAMESE_ASSET_CATALOG}
            getOptionLabel={opt => `${opt.symbol} - ${opt.name} (${opt.exchangeOrManager})`}
            onChange={(_, val) => handleSelectCatalogItem(val)}
            renderInput={params => (
              <TextField {...params} label="Tìm kiếm tài sản trong danh mục chuẩn hóa (HOSE, HNX, Quỹ mở, Vàng)" />
            )}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <MuiTextField
              label="Mã tài sản (Symbol)"
              value={form.symbol}
              onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
              fullWidth
            />
            <MuiSelect
              label="Loại tài sản"
              value={form.assetClass}
              onChange={v => setForm({ ...form, assetClass: v as AssetClass })}
              options={[
                { value: 'stock', label: 'Cổ phiếu niêm yết' },
                { value: 'fund', label: 'Chứng chỉ quỹ mở' },
                { value: 'etf', label: 'Quỹ ETF' },
                { value: 'bond', label: 'Trái phiếu' },
                { value: 'gold', label: 'Vàng SJC / 9999' },
                { value: 'savings', label: 'Tiền gửi tiết kiệm' },
                { value: 'crypto', label: 'Tiền mã hóa (Crypto)' },
                { value: 'custom', label: 'Tài sản khác' }
              ]}
            />
          </Box>

          <MuiTextField
            label="Tên đầy đủ tài sản"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <MuiTextField
              label="Số lượng"
              type="number"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              fullWidth
            />
            <MuiCurrencyInput
              label="Tổng vốn đầu tư ban đầu (₫)"
              value={Number(form.totalCostBasis)}
              onChange={v => setForm({ ...form, totalCostBasis: String(v) })}
            />
          </Box>

          <MuiCurrencyInput
            label="Giá thị trường hiện tại (₫)"
            value={Number(form.currentUnitPrice)}
            onChange={v => setForm({ ...form, currentUnitPrice: String(v) })}
          />

          {/* SL/TP Planning Section */}
          <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
              Thiết lập Kế hoạch Cắt lỗ (SL) & Chốt lời (TP)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <MuiCurrencyInput
                label="Mục tiêu Chốt lời - TP (₫)"
                value={Number(form.targetTakeProfit) || 0}
                onChange={v => setForm({ ...form, targetTakeProfit: String(v) })}
              />
              <MuiCurrencyInput
                label="Ngưỡng Cắt lỗ - SL (₫)"
                value={Number(form.targetStopLoss) || 0}
                onChange={v => setForm({ ...form, targetStopLoss: String(v) })}
              />
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveAsset}>Thêm vào Danh mục</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Execute Ledger Order (Buy, Sell, Redeem...) */}
      <Dialog open={openOrderModal} onClose={() => setOpenOrderModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Giao Dịch Sổ Cái: {selectedAssetForOrder?.symbol}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <MuiSelect
            label="Loại giao dịch"
            value={orderForm.type}
            onChange={v => setOrderForm({ ...orderForm, type: v as InvestmentTxType })}
            options={[
              { value: 'BUY', label: 'BUY (Mua thêm tài sản)' },
              { value: 'SELL', label: 'SELL (Bán chốt lời / cắt lỗ)' },
              { value: 'DEPOSIT_FUND', label: 'DEPOSIT_FUND (Nộp tiền mua quỹ)' },
              { value: 'REDEEM_FUND', label: 'REDEEM_FUND (Bán / Mua lại CCQ)' },
              { value: 'DIVIDEND_CASH', label: 'DIVIDEND_CASH (Cổ tức tiền mặt)' }
            ]}
          />

          <MuiTextField
            label="Số lượng"
            type="number"
            value={orderForm.quantity}
            onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })}
            fullWidth
          />

          <MuiCurrencyInput
            label="Đơn giá khớp (₫)"
            value={Number(orderForm.unitPrice)}
            onChange={v => setOrderForm({ ...orderForm, unitPrice: String(v) })}
          />

          <MuiCurrencyInput
            label="Phí giao dịch (₫)"
            value={Number(orderForm.fee)}
            onChange={v => setOrderForm({ ...orderForm, fee: String(v) })}
          />

          <MuiTextField
            label="Ghi chú giao dịch"
            value={orderForm.note}
            onChange={e => setOrderForm({ ...orderForm, note: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenOrderModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleExecuteOrder}>Xác nhận Lệnh</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Confirm
        open={Boolean(deleting)}
        title="Xóa tài sản đầu tư?"
        message={`Bạn có chắc muốn xóa mã ${deleting?.symbol}? Toàn bộ lịch sử vị thế sẽ bị xóa.`}
        onConfirm={handleDeleteAsset}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
