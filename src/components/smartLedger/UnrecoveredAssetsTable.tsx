import { useState } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme
} from '@mui/material';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import ArrowCircleDownRounded from '@mui/icons-material/ArrowCircleDownRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import AddCircleRounded from '@mui/icons-material/AddCircleRounded';

import { useFinance } from '../../store';
import { money, todayKey, uid } from '../../lib/finance';
import { ASSET_CATEGORY_METADATA } from '../../lib/investmentProjectionEngine';
import type { InvestmentNote } from '../../types/smartLedger';

export const HIDDEN_ASSETS_KEY = 'finora:hidden_unrecovered_assets';

export const getHiddenAssetIds = (): string[] => {
  try {
    const raw = localStorage.getItem(HIDDEN_ASSETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveHiddenAssetIds = (ids: string[]) => {
  try {
    localStorage.setItem(HIDDEN_ASSETS_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage write error
  }
};

interface UnrecoveredAssetsTableProps {
  notes: InvestmentNote[];
  onOpenAddModal?: () => void;
}

export function UnrecoveredAssetsTable({ notes, onOpenAddModal }: UnrecoveredAssetsTableProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data, update, notify } = useFinance();

  const [activeTab, setActiveTab] = useState<'ALL' | 'SAFE' | 'RISKY' | 'RECOVERED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  // Recovery Modal State
  const [recoveringNote, setRecoveringNote] = useState<InvestmentNote | null>(null);
  const [recoveryAmountStr, setRecoveryAmountStr] = useState('');
  const [recoveryNote, setRecoveryNote] = useState('');
  const [targetAccountId, setTargetAccountId] = useState(data?.user?.defaultAccountId || (data?.accounts?.[0]?.id ?? 'cash'));

  // Toggle include_in_net_worth and sync with localStorage
  const handleToggleIncludeInNetWorth = async (note: InvestmentNote) => {
    const isCurrentlyIncluded = note.include_in_net_worth !== false;
    const nextVal = !isCurrentlyIncluded;

    // Cập nhật danh sách ẩn trong localStorage
    const currentHidden = new Set(getHiddenAssetIds());
    if (nextVal) {
      currentHidden.delete(note.id);
    } else {
      currentHidden.add(note.id);
    }
    saveHiddenAssetIds(Array.from(currentHidden));

    await update(d => {
      const currentNotes = d.smartInvestmentNotes || [];
      return {
        ...d,
        smartInvestmentNotes: currentNotes.map(n =>
          n.id === note.id ? { ...n, include_in_net_worth: nextVal } : n
        )
      };
    }, nextVal ? `Đã đưa "${note.title}" vào Tổng tài sản` : `Đã tạm ẩn "${note.title}" khỏi Tổng tài sản`);
  };

  // Mark Risk of Loss
  const handleToggleRiskOfLoss = async (note: InvestmentNote) => {
    const nextStatus = note.status === 'AT_RISK_LOSS' ? 'UNRECOVERED' : 'AT_RISK_LOSS';
    await update(d => {
      const currentNotes = d.smartInvestmentNotes || [];
      return {
        ...d,
        smartInvestmentNotes: currentNotes.map(n =>
          n.id === note.id ? { ...n, status: nextStatus } : n
        )
      };
    }, nextStatus === 'AT_RISK_LOSS' ? `Đã đánh dấu "${note.title}" có nguy cơ mất vốn` : `Đã gỡ cảnh báo cho "${note.title}"`);
  };

  // Open Recovery Modal
  const handleOpenRecoveryModal = (note: InvestmentNote) => {
    const totalContributed = (note.initialCapital || 0) + (note.additionalCapitalContributed || 0);
    const unrecovered = Math.max(0, totalContributed - (note.recoveredAmount || 0));
    setRecoveringNote(note);
    setRecoveryAmountStr(unrecovered > 0 ? String(unrecovered) : String(note.currentEstimatedValue || 0));
    setRecoveryNote(`Thu hồi vốn từ ${note.title}`);
  };

  // Execute Capital Recovery
  const handleExecuteRecovery = async () => {
    if (!recoveringNote) return;
    const amount = parseFloat(recoveryAmountStr.replace(/[^0-9]/g, '')) || 0;
    if (amount <= 0) {
      notify('Vui lòng nhập số tiền thu hồi hợp lệ');
      return;
    }

    const today = todayKey();
    const totalContributed = (recoveringNote.initialCapital || 0) + (recoveringNote.additionalCapitalContributed || 0);
    const prevRecovered = recoveringNote.recoveredAmount || 0;
    const newTotalRecovered = prevRecovered + amount;
    const isFullyRecovered = newTotalRecovered >= totalContributed;

    await update(d => {
      const currentNotes = d.smartInvestmentNotes || [];
      
      // 1. Cập nhật Note
      const updatedNotes = currentNotes.map(n => {
        if (n.id !== recoveringNote.id) return n;
        const newRecoveries = [
          ...(n.recoveries || []),
          {
            id: uid(),
            date: today,
            amount,
            targetAccountId,
            note: recoveryNote
          }
        ];
        return {
          ...n,
          recoveredAmount: newTotalRecovered,
          status: isFullyRecovered ? ('RECOVERED' as const) : ('PARTIALLY_RECOVERED' as const),
          currentEstimatedValue: Math.max(0, (n.currentEstimatedValue || totalContributed) - amount),
          recoveries: newRecoveries,
          updatedAt: today
        };
      });

      // 2. Chuyển tiền về ví tiền mặt được chọn (tạo income transaction)
      const incomeTx = {
        id: uid(),
        name: `Thu hồi vốn: ${recoveringNote.title}`,
        amount,
        type: 'income' as const,
        categoryId: 'other_income',
        accountId: targetAccountId,
        date: today,
        method: 'Thu hồi vốn đầu tư',
        note: `[Thu hồi tài sản] ${recoveryNote}`,
        status: 'completed' as const
      };

      return {
        ...d,
        smartInvestmentNotes: updatedNotes,
        transactions: [incomeTx, ...d.transactions]
      };
    }, `Đã thu hồi ${money(amount)} từ "${recoveringNote.title}" về ví tiền mặt thành công!`);

    setRecoveringNote(null);
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    await update(d => ({
      ...d,
      smartInvestmentNotes: (d.smartInvestmentNotes || []).filter(n => n.id !== noteId)
    }), 'Đã xóa khoản đầu tư khỏi sổ!');
  };

  // Filter notes
  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.symbol && n.symbol.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.quickNote && n.quickNote.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'ALL') return true;
    if (activeTab === 'RECOVERED') return n.status === 'RECOVERED';
    if (activeTab === 'SAFE') return (n.risk_level === 'SAFE' || n.risk_level === 'LOW') && n.status !== 'RECOVERED';
    if (activeTab === 'RISKY') return (n.risk_level === 'MEDIUM' || n.risk_level === 'HIGH') && n.status !== 'RECOVERED';
    return true;
  });

  return (
    <Card sx={{ p: 0, overflow: 'hidden', borderRadius: '6px', border: '1px solid', borderColor: 'divider' }}>
      {/* 1. Header Toolbar */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 1.5,
          borderBottom: '1px solid var(--border-subtle)',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setPage(0); }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 36,
              '& .MuiTab-root': {
                minHeight: 36,
                py: 0,
                px: { xs: 1.25, sm: 1.75 },
                fontWeight: 650,
                fontSize: '0.80rem',
                textTransform: 'none',
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 750
                }
              }
            }}
          >
            <Tab value="ALL" label={`Tất cả (${notes.length})`} />
            <Tab value="SAFE" label="An toàn" />
            <Tab value="RISKY" label="Rủi ro" />
            <Tab value="RECOVERED" label="Đã thu hồi" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <TextField
            size="small"
            placeholder="Tìm kiếm tài sản, mã..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
            sx={{ flex: { xs: 1, sm: 'none' }, width: { sm: 200 } }}
            slotProps={{
              input: {
                startAdornment: <SearchRounded sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />,
                sx: { borderRadius: '6px', fontSize: '0.80rem', height: 34 }
              }
            }}
          />
          {onOpenAddModal && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddCircleRounded sx={{ fontSize: 16 }} />}
              onClick={onOpenAddModal}
              sx={{
                height: 34,
                px: 1.5,
                fontWeight: 650,
                fontSize: '0.80rem',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                borderRadius: '6px',
                bgcolor: 'var(--brand-primary, #355E52)',
                '&:hover': { bgcolor: 'var(--brand-primary-hover, #2A4E44)' }
              }}
            >
              Thêm mục đầu tư
            </Button>
          )}
        </Box>
      </Box>

      {/* 2. Table */}
      <TableContainer sx={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: isDark ? '#1A222D' : '#F1F5F9' }}>
            <TableRow sx={{ borderBottom: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#CBD5E1' }}>
              <TableCell sx={{ width: 40, py: 1, px: 1 }} align="center" />
              <TableCell sx={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em', color: isDark ? '#E2E8F0' : '#334155', py: 1.1, px: 1.25 }}>TÀI SẢN</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em', color: isDark ? '#E2E8F0' : '#334155', py: 1.1, px: 1.25 }}>LOẠI</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em', color: isDark ? '#E2E8F0' : '#334155', py: 1.1, px: 1.25 }}>RỦI RO</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em', color: isDark ? '#E2E8F0' : '#334155', py: 1.1, px: 1.25 }}>VỐN GỐC</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em', color: isDark ? '#E2E8F0' : '#334155', py: 1.1, px: 1.25 }}>ĐÃ THU HỒI</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em', color: isDark ? '#FBBF24' : '#D97706', py: 1.1, px: 1.25 }}>CHƯA THU HỒI</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em', color: isDark ? '#E2E8F0' : '#334155', py: 1.1, px: 1.25 }}>GIÁ TRỊ</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em', color: isDark ? '#E2E8F0' : '#334155', py: 1.1, px: 1.25 }}>LÃI / LỖ</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em', color: isDark ? '#E2E8F0' : '#334155', py: 1.1, px: 1.25 }}>THAO TÁC</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredNotes.length > 0 ? (
              filteredNotes
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(note => {
                  const totalContributed = (note.initialCapital || 0) + (note.additionalCapitalContributed || 0);
                  const recovered = note.recoveredAmount || 0;
                  const unrecovered = Math.max(0, totalContributed - recovered);
                  const currentValue = note.currentEstimatedValue ?? unrecovered;
                  const pnl = currentValue - unrecovered;
                  const isIncluded = note.include_in_net_worth !== false;
                  const catMeta = ASSET_CATEGORY_METADATA[note.category] || { label: note.category };

                  return (
                    <TableRow key={note.id} hover sx={{ opacity: isIncluded ? 1 : 0.82, '& td': { py: 1, px: 1.25, borderBottom: '1px solid var(--border-subtle)' } }}>
                      {/* Toggle Net Worth Eye */}
                      <TableCell align="center">
                        <Tooltip title={isIncluded ? 'Đang tính vào Tổng tài sản (Bấm để tạm ẩn)' : 'Đang tạm ẩn (Bấm để tính vào Tổng tài sản)'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleIncludeInNetWorth(note)}
                            sx={{ color: isIncluded ? (isDark ? '#34D399' : '#059669') : 'text.disabled', p: 0.5 }}
                          >
                            {isIncluded ? <VisibilityRounded sx={{ fontSize: 16 }} /> : <VisibilityOffRounded sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                      {/* Title & Notes */}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.80rem', color: isIncluded ? 'text.primary' : 'text.secondary' }}>
                              {note.title}
                            </Typography>
                            {!isIncluded && (
                              <Chip
                                label="Đã ẩn"
                                size="small"
                                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', color: 'text.secondary' }}
                              />
                            )}
                            {note.status === 'AT_RISK_LOSS' && (
                              <Chip
                                label="Nguy cơ mất vốn"
                                size="small"
                                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 750, bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', color: isDark ? '#F87171' : '#B91C1C' }}
                              />
                            )}
                            {note.status === 'RECOVERED' && (
                              <Chip
                                label="Đã thu hồi đủ"
                                size="small"
                                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 750, bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7', color: isDark ? '#34D399' : '#15803D' }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.70rem' }}>
                            {note.quickNote || '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Category */}
                      <TableCell sx={{ fontSize: '0.76rem', fontWeight: 600, color: 'text.primary' }}>
                        {catMeta.label}
                      </TableCell>

                      {/* Risk Level */}
                      <TableCell>
                        <Chip
                          size="small"
                          label={note.risk_level === 'SAFE' ? 'An toàn' : note.risk_level === 'LOW' ? 'Thấp' : note.risk_level === 'MEDIUM' ? 'Trung bình' : 'Cao'}
                          sx={{
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.66rem',
                            height: 18,
                            bgcolor:
                              note.risk_level === 'SAFE'
                                ? (isDark ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7')
                                : note.risk_level === 'LOW'
                                ? (isDark ? 'rgba(59, 130, 246, 0.16)' : '#DBEAFE')
                                : note.risk_level === 'MEDIUM'
                                ? (isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7')
                                : (isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2'),
                            color:
                              note.risk_level === 'SAFE'
                                ? (isDark ? '#34D399' : '#15803D')
                                : note.risk_level === 'LOW'
                                ? (isDark ? '#60A5FA' : '#1D4ED8')
                                : note.risk_level === 'MEDIUM'
                                ? (isDark ? '#FBBF24' : '#B45309')
                                : (isDark ? '#F87171' : '#B91C1C')
                          }}
                        />
                      </TableCell>

                      {/* Initial Capital */}
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.78rem', color: isIncluded ? 'text.primary' : 'text.disabled', fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {isIncluded ? money(totalContributed) : '****'}
                      </TableCell>

                      {/* Recovered */}
                      <TableCell align="right" sx={{ color: isIncluded ? (isDark ? '#34D399' : '#15803D') : 'text.disabled', fontWeight: 600, fontSize: '0.78rem', fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {isIncluded ? (recovered > 0 ? money(recovered) : '—') : '****'}
                      </TableCell>

                      {/* Unrecovered */}
                      <TableCell align="right" sx={{ fontWeight: 700, color: isIncluded ? (isDark ? '#FBBF24' : '#D97706') : 'text.disabled', fontSize: '0.78rem', fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {isIncluded ? money(unrecovered) : '****'}
                      </TableCell>

                      {/* Current Value */}
                      <TableCell align="right" sx={{ fontWeight: 600, color: isIncluded ? 'text.primary' : 'text.disabled', fontSize: '0.78rem', fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {isIncluded ? money(currentValue) : '****'}
                      </TableCell>

                      {/* PnL */}
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem', color: isIncluded ? (pnl >= 0 ? (isDark ? '#34D399' : '#15803D') : (isDark ? '#F87171' : '#DC2626')) : 'text.disabled', fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {isIncluded ? `${pnl >= 0 ? '+' : ''}${money(pnl)}` : '****'}
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                          <Tooltip title="Thu hồi vốn về ví tiền mặt">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<ArrowCircleDownRounded sx={{ fontSize: 13 }} />}
                              onClick={() => handleOpenRecoveryModal(note)}
                              sx={{
                                py: 0.25,
                                px: 0.75,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                borderRadius: '4px',
                                textTransform: 'none',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Thu hồi
                            </Button>
                          </Tooltip>

                          <Tooltip title={note.status === 'AT_RISK_LOSS' ? 'Gỡ cảnh báo rủi ro' : 'Đánh dấu có nguy cơ mất vốn'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleRiskOfLoss(note)}
                              sx={{ color: note.status === 'AT_RISK_LOSS' ? '#EF4444' : 'text.disabled', p: 0.4 }}
                            >
                              <WarningAmberRounded sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Xóa khoản đầu tư">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteNote(note.id)}
                              sx={{ color: 'text.disabled', '&:hover': { color: '#EF4444' }, p: 0.4 }}
                            >
                              <DeleteOutlineRounded sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  Chưa có khoản đầu tư nào trong danh mục này.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 3. Pagination */}
      <TablePagination
        component="div"
        count={filteredNotes.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 8, 15, 25]}
        labelRowsPerPage="Số hàng/trang:"
      />

      {/* 4. MODAL THU HỒI VỐN VỀ VÍ TIỀN MẶT */}
      <Dialog open={Boolean(recoveringNote)} onClose={() => setRecoveringNote(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', pb: 1 }}>
          Thu Hồi Vốn Về Ví Tiền Mặt
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Khoản đầu tư: <strong>{recoveringNote?.title}</strong>
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Số tiền thu hồi đợt này (VND)"
            value={recoveryAmountStr ? Number(recoveryAmountStr.replace(/[^0-9]/g, '')).toLocaleString('vi-VN') : ''}
            onChange={e => setRecoveryAmountStr(e.target.value)}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                sx: { borderRadius: '4px', fontWeight: 750 }
              }
            }}
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Ví tiền mặt / Ngân hàng nhận tiền</InputLabel>
            <Select
              value={targetAccountId}
              label="Ví tiền mặt / Ngân hàng nhận tiền"
              onChange={e => setTargetAccountId(e.target.value)}
              sx={{ borderRadius: '4px' }}
            >
              {(data?.accounts || []).map(acc => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name} ({money(acc.openingBalance)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Ghi chú thu hồi"
            value={recoveryNote}
            onChange={e => setRecoveryNote(e.target.value)}
            placeholder="Ví dụ: Rút vốn một phần, tất toán cuối kỳ..."
            slotProps={{ input: { sx: { borderRadius: '4px' } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRecoveringNote(null)} sx={{ fontWeight: 650 }}>Hủy</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExecuteRecovery}
            sx={{ fontWeight: 800, borderRadius: '4px', bgcolor: '#176B52', '&:hover': { bgcolor: '#12563F' } }}
          >
            Xác nhận Thu hồi về ví
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
