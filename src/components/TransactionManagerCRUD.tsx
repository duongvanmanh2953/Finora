import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Snackbar,
  Alert,
  Typography
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';

import { useFinance } from '../store';
import { money, todayKey, uid } from '../lib/finance';
import { BudgetCategoryBadge } from './BudgetCategoryIcons';
import { AssetLogoBadge } from '../lib/brandBadges';
import { MuiCurrencyInput, MuiSelect, MuiTextField } from './mui/MuiInputs';
import { Confirm } from './ui';
import { StatusBadge } from './ui/StatusBadge';
import { FullscreenModal, FullscreenButton } from './ui/FullscreenModal';
import type { Transaction, TxType } from '../types';

export function TransactionManagerCRUD() {
  const { data, update, notify, undo } = useFinance();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [fullscreenTableOpen, setFullscreenTableOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [undoToastOpen, setUndoToastOpen] = useState(false);

  // Form State for Add / Edit
  const [form, setForm] = useState({
    name: '',
    amount: 50000,
    type: 'expense' as TxType,
    categoryId: 'food',
    accountId: 'bank',
    date: todayKey(),
    note: ''
  });

  const transactions = data?.transactions || [];
  const categories = data?.categories || [];
  const accounts = data?.accounts || [];

  // Filtered transactions list
  const filteredList = useMemo(() => {
    return transactions.filter(tx => {
      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'invest') {
          if (tx.categoryId !== 'invest' && tx.categoryId !== 'investment') return false;
        } else if (tx.type !== filterType) {
          return false;
        }
      }

      // Category filter
      if (filterCategory !== 'all' && tx.categoryId !== filterCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tx.name.toLowerCase().includes(q);
        const matchesNote = (tx.note || '').toLowerCase().includes(q);
        const matchesAmount = String(tx.amount).includes(q);
        if (!matchesName && !matchesNote && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filterType, filterCategory, searchQuery]);

  const handleOpenAdd = () => {
    setForm({
      name: '',
      amount: 50000,
      type: 'expense',
      categoryId: categories[0]?.id || 'food',
      accountId: accounts[0]?.id || 'bank',
      date: todayKey(),
      note: ''
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setForm({
      name: tx.name,
      amount: tx.amount,
      type: tx.type,
      categoryId: tx.categoryId || 'other',
      accountId: tx.accountId,
      date: tx.date,
      note: tx.note || ''
    });
  };

  const handleSaveAdd = async () => {
    if (!form.name.trim() || form.amount <= 0) {
      notify('Vui lòng nhập tên giao dịch và số tiền hợp lệ (> 0đ)');
      return;
    }

    const newTx: Transaction = {
      id: uid(),
      name: form.name.trim(),
      amount: form.amount,
      type: form.type,
      categoryId: form.categoryId,
      accountId: form.accountId,
      date: form.date,
      method: form.type === 'income' ? 'Chuyển khoản' : 'Tiền mặt',
      note: form.note.trim(),
      status: 'completed'
    };

    await update(d => ({
      ...d,
      transactions: [newTx, ...d.transactions]
    }), `Đã thêm giao dịch "${newTx.name}" (${money(newTx.amount)})`);

    setAddModalOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editingTx || !form.name.trim() || form.amount <= 0) return;

    await update(d => ({
      ...d,
      transactions: d.transactions.map(t =>
        t.id === editingTx.id
          ? {
              ...t,
              name: form.name.trim(),
              amount: form.amount,
              type: form.type,
              categoryId: form.categoryId,
              accountId: form.accountId,
              date: form.date,
              note: form.note.trim()
            }
          : t
      )
    }), `Đã cập nhật giao dịch "${form.name}"!`);

    setEditingTx(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTx) return;
    const removedTx = deletingTx;

    await update(d => ({
      ...d,
      transactions: d.transactions.filter(t => t.id !== removedTx.id)
    }), `Đã xóa giao dịch "${removedTx.name}"`);

    setDeletingTx(null);
    setUndoToastOpen(true);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '6px', // Strictly 6px outer container
        border: '1px solid',
        borderColor: 'divider',
        p: 2.5
      }}
    >
      {/* 0. Section Header with Breathing Room & Responsive Actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
          mb: 2.5
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 16 } }}>
            Lịch sử & Quản lý Giao dịch
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
            Toàn quyền đối soát, thêm mới, sửa sai và quản lý dữ liệu chi tiêu
          </Typography>
        </Box>

        {/* Action Controls: Fullscreen + Add Transaction */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          <FullscreenButton
            onClick={() => setFullscreenTableOpen(true)}
            title="Xem toàn màn hình (Xoay ngang 90°)"
            size={17}
          />
          <Button
            variant="contained"
            startIcon={<AddRounded sx={{ color: '#fff' }} />}
            onClick={handleOpenAdd}
            sx={{
              flex: { xs: 1, sm: 'none' },
              bgcolor: '#10B981',
              '&:hover': { bgcolor: '#059669' },
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.82rem',
              py: 0.8,
              px: 2,
              borderRadius: '6px',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
              textTransform: 'none',
              minHeight: 38
            }}
          >
            Thêm giao dịch
          </Button>
        </Box>
      </Box>

      {/* 1. Filter & Search Toolbar */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2.5
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1, minWidth: 280, alignItems: 'center' }}>
          <TextField
            size="small"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, ghi chú, mã CK, số tiền..."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ minWidth: 240, flex: { xs: '1 1 100%', sm: 'none' }, '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
          />

          {/* Type Filter Buttons: Horizontal scrollable on mobile */}
          <Box
            sx={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              flexWrap: 'nowrap',
              WebkitOverflowScrolling: 'touch',
              py: 0.5,
              maxWidth: '100%',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'expense', label: 'Chi tiêu' },
              { id: 'income', label: 'Thu nhập' },
              { id: 'invest', label: 'Đầu tư' }
            ].map(tab => (
              <Chip
                key={tab.id}
                label={tab.label}
                clickable
                color={filterType === tab.id ? 'primary' : 'default'}
                variant={filterType === tab.id ? 'filled' : 'outlined'}
                onClick={() => setFilterType(tab.id)}
                sx={{
                  borderRadius: '4px', // Strictly 4px
                  px: 1,
                  py: 0.5,
                  fontWeight: 700,
                  flexShrink: 0
                }}
              />
            ))}
          </Box>

          {/* Category Filter */}
          <Box sx={{ minWidth: 160, flex: { xs: '1 1 100%', sm: 'none' } }}>
            <MuiSelect
              label="Danh mục"
              value={filterCategory}
              onChange={v => setFilterCategory(v)}
              options={[
                { value: 'all', label: 'Tất cả danh mục' },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </Box>
        </Box>
      </Box>

      {/* 2. Transaction Data Container: Responsive Desktop Table & Mobile Card List */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: '6px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
          display: { xs: 'none', md: 'block' }
        }}
      >
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 110 }}>Ngày</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 180 }}>Danh mục</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mô tả & Ghi chú</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 120 }}>Trạng thái</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, width: 150 }}>Số tiền (₫)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, width: 110 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredList.length > 0 ? (
              filteredList.slice(0, 30).map(tx => {
                const isIncome = tx.type === 'income';
                const isInvest = tx.categoryId === 'invest' || tx.categoryId === 'investment';
                const assetSymbol = isInvest && tx.name.split(' ')[1];

                return (
                  <TableRow key={tx.id} hover>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {tx.date}
                    </TableCell>

                    <TableCell>
                      <BudgetCategoryBadge categoryKey={tx.categoryId} showLabel size={26} />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {assetSymbol && (
                          <AssetLogoBadge symbol={assetSymbol} name={assetSymbol} size="small" />
                        )}
                        <Box>
                          <Box sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary' }}>
                            {tx.name}
                          </Box>
                          {tx.note && (
                            <Box sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                              {tx.note}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <StatusBadge
                        label={tx.status === 'completed' ? 'Hoàn tất' : 'Chờ xử lý'}
                        status={tx.status === 'completed' ? 'success' : 'warning'}
                        variant="soft"
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Box
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          color: isIncome ? '#10B981' : isInvest ? '#2563EB' : '#EF4444'
                        }}
                      >
                        {isIncome ? '+' : '-'}{money(tx.amount)}
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Chỉnh sửa giao dịch">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(tx)}
                            sx={{ borderRadius: '4px', p: 0.6 }}
                          >
                            <EditRounded sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa giao dịch">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeletingTx(tx)}
                            sx={{ borderRadius: '4px', p: 0.6 }}
                          >
                            <DeleteOutlineRounded sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  Không tìm thấy giao dịch nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List View (Ultra-Optimized for Handheld & Touch UX) */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.25 }}>
        {filteredList.length > 0 ? (
          filteredList.slice(0, 30).map(tx => {
            const isIncome = tx.type === 'income';
            const isInvest = tx.categoryId === 'invest' || tx.categoryId === 'investment';
            const assetSymbol = isInvest && tx.name.split(' ')[1];

            return (
              <Paper
                key={`mobile-${tx.id}`}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: '6px',
                  bgcolor: 'background.paper',
                  borderColor: 'var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  transition: 'border-color 0.15s ease',
                  '&:active': { bgcolor: 'action.hover' }
                }}
              >
                {/* Top Row: Category Avatar + Name & Amount */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
                    <BudgetCategoryBadge categoryKey={tx.categoryId} showLabel={false} size={30} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {assetSymbol && (
                          <AssetLogoBadge symbol={assetSymbol} name={assetSymbol} size="small" />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            color: 'text.primary',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {tx.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                        {tx.date}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Amount */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 850,
                      fontSize: '0.95rem',
                      fontFeatureSettings: '"tnum"',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                      color: isIncome ? '#10B981' : isInvest ? '#2563EB' : '#EF4444'
                    }}
                  >
                    {isIncome ? '+' : '-'}{money(tx.amount)}
                  </Typography>
                </Box>

                {/* Optional Note */}
                {tx.note && (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: '4px',
                      bgcolor: 'action.hover',
                      fontSize: '0.74rem',
                      color: 'text.secondary',
                      fontStyle: 'italic'
                    }}
                  >
                    {tx.note}
                  </Box>
                )}

                {/* Bottom Row: Status Badge + Action Buttons */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pt: 0.75,
                    borderTop: '1px dashed var(--border-subtle)'
                  }}
                >
                  <StatusBadge
                    label={tx.status === 'completed' ? 'Hoàn tất' : 'Chờ xử lý'}
                    status={tx.status === 'completed' ? 'success' : 'warning'}
                    variant="soft"
                    size="small"
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenEdit(tx)}
                      startIcon={<EditRounded sx={{ fontSize: 14 }} />}
                      sx={{
                        minHeight: 28,
                        py: 0.2,
                        px: 1,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: '4px',
                        color: 'text.secondary',
                        borderColor: 'var(--border-subtle)'
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => setDeletingTx(tx)}
                      startIcon={<DeleteOutlineRounded sx={{ fontSize: 14 }} />}
                      sx={{
                        minHeight: 28,
                        py: 0.2,
                        px: 1,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: '4px'
                      }}
                    >
                      Xóa
                    </Button>
                  </Box>
                </Box>
              </Paper>
            );
          })
        ) : (
          <Paper
            variant="outlined"
            sx={{ p: 4, textAlign: 'center', color: 'text.secondary', borderRadius: '6px' }}
          >
            Không tìm thấy giao dịch nào phù hợp với bộ lọc.
          </Paper>
        )}
      </Box>

      {/* 3. Dialog Thêm Mới (Manual Add) */}
      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '6px' } } }} // Strictly 6px outer
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Thêm Giao Dịch Mới</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <MuiTextField
            label="Tên giao dịch / Chi tiết"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            fullWidth
          />
          <MuiCurrencyInput
            label="Số tiền (₫)"
            value={form.amount}
            onChange={val => setForm({ ...form, amount: Number(val) || 0 })}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <MuiSelect
              label="Loại giao dịch"
              value={form.type}
              onChange={v => setForm({ ...form, type: v as TxType })}
              options={[
                { value: 'expense', label: 'Chi tiêu' },
                { value: 'income', label: 'Thu nhập' },
                { value: 'transfer', label: 'Chuyển khoản' }
              ]}
            />
            <MuiSelect
              label="Danh mục"
              value={form.categoryId}
              onChange={v => setForm({ ...form, categoryId: v })}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <MuiSelect
              label="Tài khoản thanh toán"
              value={form.accountId}
              onChange={v => setForm({ ...form, accountId: v })}
              options={accounts.map(a => ({ value: a.id, label: a.name }))}
            />
            <MuiTextField
              label="Ngày thực hiện"
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              fullWidth
            />
          </Box>
          <MuiTextField
            label="Ghi chú thêm"
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddModalOpen(false)} sx={{ borderRadius: '4px' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveAdd} sx={{ borderRadius: '4px' }}>
            Lưu Giao Dịch
          </Button>
        </DialogActions>
      </Dialog>

      {/* 4. Dialog Sửa Giao Dịch (Edit Modal) */}
      <Dialog
        open={Boolean(editingTx)}
        onClose={() => setEditingTx(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '6px' } } }} // Strictly 6px outer
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Chỉnh Sửa Giao Dịch</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <MuiTextField
            label="Tên giao dịch"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            fullWidth
          />
          <MuiCurrencyInput
            label="Số tiền (₫)"
            value={form.amount}
            onChange={val => setForm({ ...form, amount: Number(val) || 0 })}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <MuiSelect
              label="Loại"
              value={form.type}
              onChange={v => setForm({ ...form, type: v as TxType })}
              options={[
                { value: 'expense', label: 'Chi tiêu' },
                { value: 'income', label: 'Thu nhập' },
                { value: 'transfer', label: 'Chuyển khoản' }
              ]}
            />
            <MuiSelect
              label="Danh mục"
              value={form.categoryId}
              onChange={v => setForm({ ...form, categoryId: v })}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
          </Box>
          <MuiTextField
            label="Ngày"
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            fullWidth
          />
          <MuiTextField
            label="Ghi chú"
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingTx(null)} sx={{ borderRadius: '4px' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveEdit} sx={{ borderRadius: '4px' }}>
            Cập Nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* 5. Delete Confirmation Modal */}
      <Confirm
        open={Boolean(deletingTx)}
        title="Xóa giao dịch này?"
        message={`Bạn có chắc muốn xóa "${deletingTx?.name}" (${money(deletingTx?.amount || 0)})? Thao tác có thể hoàn tác ngay sau khi xóa.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTx(null)}
      />

      {/* 6. Undo Snackbar Toast */}
      <Snackbar
        open={undoToastOpen}
        autoHideDuration={6000}
        onClose={() => setUndoToastOpen(false)}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              undo();
              setUndoToastOpen(false);
            }}
            sx={{ fontWeight: 800, textDecoration: 'underline' }}
          >
            HOÀN TÁC
          </Button>
        }
      >
        <Alert severity="info" onClose={() => setUndoToastOpen(false)} sx={{ borderRadius: '4px' }}>
          Đã xóa giao dịch thành công.
        </Alert>
      </Snackbar>

      {/* 7. Fullscreen Modal for Table */}
      <FullscreenModal
        open={fullscreenTableOpen}
        onClose={() => setFullscreenTableOpen(false)}
        title="Sổ Giao Dịch Chi Tiết (Toàn Màn Hình)"
        subtitle="Xem và quản lý toàn bộ các giao dịch tài chính với đầy đủ cột dữ liệu và đối soát"
      >
        <TableContainer sx={{ width: '100%', overflowX: 'auto', flex: 1 }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 120 }}>Ngày</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 180 }}>Danh mục</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Mô tả & Ghi chú</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 120 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, width: 150 }}>Số tiền (₫)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, width: 110 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredList.map(tx => {
                const isIncome = tx.type === 'income';
                return (
                  <TableRow key={tx.id} hover>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{tx.date}</TableCell>
                    <TableCell><BudgetCategoryBadge categoryKey={tx.categoryId} showLabel size={32} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{tx.name}</Typography>
                      {tx.note && <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{tx.note}</Typography>}
                    </TableCell>
                    <TableCell><StatusBadge label={tx.status === 'completed' ? 'Hoàn tất' : 'Chờ xử lý'} status={tx.status === 'completed' ? 'success' : 'warning'} variant="soft" size="small" /></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 800, color: isIncome ? 'success.main' : 'text.primary' }}>
                        {isIncome ? '+' : '-'}{money(tx.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenEdit(tx)} title="Sửa"><EditRounded fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setDeletingTx(tx)} title="Xóa" sx={{ color: 'error.main' }}><DeleteOutlineRounded fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </FullscreenModal>
    </Card>
  );
}
