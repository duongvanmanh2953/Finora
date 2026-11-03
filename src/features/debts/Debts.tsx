import React, { useState } from 'react';
import { Plus, Pencil, Trash2, History, Bell, Send, Copy, AlertTriangle, CheckCircle2, LayoutGrid, List } from 'lucide-react';
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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';

import { useFinance } from '../../store';
import { balance, dateLabel, debtRemaining, money, uid, todayKey } from '../../lib/finance';
import { Confirm, PageHead, Progress } from '../../components/ui';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ItemActionMenu } from '../../components/ItemActionMenu';
import { DebtLogoBadge } from '../../lib/brandBadges';
import {
  MuiTextField,
  MuiSelect,
  MuiCurrencyInput,
  MuiDatePicker
} from '../../components/mui/MuiInputs';
import type { Debt, DebtPayment, Transaction } from '../../types';

export default function Debts() {
  const data = useFinance(s => s.data)!;
  const update = useFinance(s => s.update);
  const notify = useFinance(s => s.notify);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Debt | null>(null);
  const [deleting, setDeleting] = useState<Debt | null>(null);
  const [pay, setPay] = useState<Debt | null>(null);
  const [history, setHistory] = useState<Debt | null>(null);
  const [reminderDebt, setReminderDebt] = useState<Debt | null>(null);
  const [copiedReminder, setCopiedReminder] = useState(false);
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(data.accounts[0]?.id || '');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const blank = {
    name: '',
    kind: 'owed' as Debt['kind'],
    principal: '',
    startDate: todayKey(),
    dueDate: '',
    interestRate: '0'
  };
  const [form, setForm] = useState(blank);

  const start = (d?: Debt) => {
    setEdit(d || null);
    setForm(
      d
        ? {
            name: d.name,
            kind: d.kind,
            principal: String(d.principal),
            startDate: d.startDate,
            dueDate: d.dueDate,
            interestRate: String(d.interestRate || 0)
          }
        : blank
    );
    setError('');
    setOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = Number(form.principal),
      interestRate = Number(form.interestRate);
    if (!form.name.trim() || !Number.isInteger(principal) || principal <= 0 || form.dueDate < form.startDate || interestRate < 0) {
      setError('Kiểm tra tên, số tiền và ngày hạn trả');
      return;
    }
    update(x => ({
      ...x,
      debts: edit
        ? x.debts.map(d => (d.id === edit.id ? { ...d, ...form, principal, interestRate } : d))
        : [...x.debts, { id: uid(), ...form, principal, interestRate, payments: [] }]
    }));
    setOpen(false);
  };

  const record = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pay) return;
    const n = Number(amount),
      a = data.accounts.find(x => x.id === account);
    if (!Number.isInteger(n) || n <= 0 || n > debtRemaining(pay) || !a) {
      setError('Số tiền phải hợp lệ và không vượt quá số dư nợ');
      return;
    }
    if (pay.kind === 'owed' && balance(a, data.transactions) < n) {
      setError('Số dư tài khoản không đủ');
      return;
    }

    const date = todayKey();
    const transaction: Transaction = {
      id: uid(),
      name: pay.kind === 'owed' ? `Trả nợ · ${pay.name}` : `Thu hồi nợ · ${pay.name}`,
      amount: n,
      type: 'transfer',
      accountId: pay.kind === 'owed' ? account : 'external-debt',
      toAccountId: pay.kind === 'lent' ? account : undefined,
      date,
      method: 'Chuyển khoản',
      note: 'Thanh toán khoản nợ; không tính thu chi',
      status: 'completed'
    };

    update(x => ({
      ...x,
      debts: x.debts.map(d =>
        d.id === pay.id
          ? { ...d, payments: [...d.payments, { id: uid(), amount: n, date, note: 'Thanh toán' }] }
          : d
      ),
      transactions: [transaction, ...x.transactions]
    }));

    setPay(null);
    setAmount('');
    setError('');
  };

  const owed = data.debts
    .filter(d => d.kind === 'owed')
    .reduce((n, d) => n + debtRemaining(d), 0);
  const lent = data.debts
    .filter(d => d.kind === 'lent')
    .reduce((n, d) => n + debtRemaining(d), 0);

  const dueDebts = data.debts.filter(
    d =>
      debtRemaining(d) > 0 &&
      d.dueDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );

  return (
    <>
      <PageHead
        eyebrow="SỔ NỢ & CHO VAY"
        title="Quản lý Vay & Nợ"
        subtitle="Ghi nhớ ai đang nợ bạn, bạn đang nợ ai, kèm lịch nhắc nhở đến hạn tự động."
        actions={
          <Button
            variant="contained"
            startIcon={<Plus size={15} />}
            onClick={() => start()}
            sx={{
              bgcolor: '#15966B',
              '&:hover': { bgcolor: '#0D7A55' },
              fontWeight: 800,
              borderRadius: '4px',
              boxShadow: '0 2px 6px rgba(21, 150, 107, 0.25)'
            }}
          >
            Thêm khoản nợ
          </Button>
        }
      />

      {/* Due Date Radar Banner */}
      {dueDebts.length > 0 && (
        <Card
          variant="outlined"
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: '6px',
            bgcolor: 'action.hover',
            border: '1.5px solid #d97706'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Bell size={18} color="#d97706" />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#d97706' }}>
              Lịch nhắc nợ đến hạn ({dueDebts.length} khoản cần lưu ý)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {dueDebts.map(d => {
              const rem = debtRemaining(d);
              const isOverdue = d.dueDate < todayKey();
              return (
                <Chip
                  key={d.id}
                  icon={isOverdue ? <AlertTriangle size={12} color="#dc2626" /> : <Bell size={12} color="#d97706" />}
                  label={`${d.kind === 'owed' ? 'Cần trả' : 'Cần thu'} ${d.name}: ${money(rem)} (${isOverdue ? 'Quá hạn' : `Hạn ${dateLabel(d.dueDate)}`})`}
                  size="small"
                  onClick={() => (d.kind === 'lent' ? setReminderDebt(d) : setPay(d))}
                  sx={{
                    fontWeight: 700,
                    cursor: 'pointer',
                    bgcolor: isOverdue ? '#fef0ef' : '#fff3e1',
                    color: isOverdue ? '#dc2626' : '#d97706'
                  }}
                />
              );
            })}
          </Box>
        </Card>
      )}

      <div className="grid-stats" style={{ marginBottom: 20 }}>
        <div className="card stat">
          <span className="stat-label">Cần trả (Tôi nợ)</span>
          <div className="stat-value negative">{money(owed)}</div>
        </div>
        <div className="card stat">
          <span className="stat-label">Cần thu (Người khác nợ tôi)</span>
          <div className="stat-value positive">{money(lent)}</div>
        </div>
        <div className="card stat">
          <span className="stat-label">Sắp hoặc đã đến hạn</span>
          <div className="stat-value">
            {
              data.debts.filter(
                d =>
                  debtRemaining(d) > 0 &&
                  d.dueDate <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
              ).length
            }
          </div>
        </div>
      </div>

      {/* View Mode Toggle Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Danh sách sổ nợ ({data.debts.length})
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: { xs: 'none', sm: 'inline-block' } }}>
            Chế độ xem:
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
            sx={{
              bgcolor: 'action.hover',
              p: 0.3,
              borderRadius: '4px',
              '& .MuiToggleButton-root': {
                borderRadius: '4px',
                border: 'none',
                px: 1.25,
                py: 0.5,
                fontWeight: 750,
                fontSize: '0.78rem',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#FFFFFF'
                }
              }
            }}
          >
            <ToggleButton value="grid" aria-label="Xem ô lưới">
              <LayoutGrid size={14} style={{ marginRight: 6 }} /> Ô lưới
            </ToggleButton>
            <ToggleButton value="table" aria-label="Xem danh sách">
              <List size={14} style={{ marginRight: 6 }} /> Danh sách
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {viewMode === 'grid' ? (
        /* ========================================== */
        /* BENTO GRID VIEW OF DEBTS                   */
        /* ========================================== */
        <Box>
          <div className="tiles">
            {data.debts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(d => {
                const remaining = debtRemaining(d);
                const overdue = d.dueDate < todayKey() && remaining > 0;
                return (
                  <Card
                    variant="outlined"
                    className="card tile"
                    key={d.id}
                    sx={{
                      borderRadius: '6px',
                      p: 2.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <DebtLogoBadge debtName={d.name} lenderName={d.name} size="large" />
                      <StatusBadge
                        label={
                          remaining === 0
                            ? 'Đã tất toán'
                            : overdue
                            ? 'Quá hạn'
                            : d.kind === 'owed'
                            ? 'Phải trả'
                            : 'Cần thu'
                        }
                        status={remaining === 0 ? 'success' : overdue ? 'danger' : 'warning'}
                        variant="soft"
                        size="small"
                      />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.25 }}>
                      {d.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                      Bắt đầu {dateLabel(d.startDate)} · Hạn {dateLabel(d.dueDate)}
                    </Typography>

                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                      {money(remaining)}
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                      Còn lại từ {money(d.principal)}
                      {d.interestRate ? ` · Lãi suất tham khảo ${d.interestRate}%` : ''}
                    </Typography>

                    <Progress
                      value={((d.principal - remaining) / d.principal) * 100}
                      color={d.kind === 'owed' ? '#f59e0b' : '#10b981'}
                    />

                    {/* Action Buttons: 1 Nút chính có màu + Nút More */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid var(--border-subtle)' }}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={remaining === 0}
                        startIcon={<Plus size={14} />}
                        onClick={() => {
                          setPay(d);
                          setError('');
                        }}
                        sx={{
                          borderRadius: '4px',
                          fontWeight: 750,
                          fontSize: '0.78rem',
                          bgcolor: d.kind === 'owed' ? '#F59E0B' : '#10B981',
                          color: '#FFFFFF',
                          boxShadow: d.kind === 'owed' ? '0 2px 6px rgba(245, 158, 11, 0.25)' : '0 2px 6px rgba(16, 185, 129, 0.25)',
                          '&:hover': {
                            bgcolor: d.kind === 'owed' ? '#D97706' : '#059669'
                          }
                        }}
                      >
                        {d.kind === 'owed' ? 'Ghi trả nợ' : 'Ghi thu hồi'}
                      </Button>

                      <ItemActionMenu
                        ariaLabel={`Tùy chọn khoản nợ ${d.name}`}
                        items={[
                          ...(d.kind === 'lent' && remaining > 0 ? [{
                            label: 'Soạn tin nhắc nợ lịch sự',
                            icon: <Send size={15} />,
                            onClick: () => {
                              setReminderDebt(d);
                              setCopiedReminder(false);
                            }
                          }] : []),
                          {
                            label: 'Lịch sử thanh toán',
                            icon: <History size={15} />,
                            onClick: () => setHistory(d)
                          },
                          {
                            label: 'Chỉnh sửa khoản nợ',
                            icon: <Pencil size={15} />,
                            onClick: () => start(d)
                          },
                          {
                            label: 'Xóa khoản nợ',
                            icon: <Trash2 size={15} />,
                            color: 'error' as const,
                            onClick: () => setDeleting(d)
                          }
                        ]}
                      />
                    </Box>
                  </Card>
                );
              })}
          </div>

          {/* Grid Pagination */}
          {data.debts.length > 0 && (
            <TablePagination
              component="div"
              count={data.debts.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[6, 12, 24]}
              labelRowsPerPage="Số thẻ / trang:"
              sx={{
                mt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                borderRadius: '4px'
              }}
            />
          )}
        </Box>
      ) : (
        /* ========================================== */
        /* TABLE VIEW OF DEBTS                        */
        /* ========================================== */
        <Card sx={{ p: 0, overflow: 'hidden', borderRadius: '6px' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Khoản nợ & Đối tác</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phân loại</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Số tiền gốc</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Còn lại</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Tiến độ thanh toán</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hạn chót</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.debts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(d => {
                    const remaining = debtRemaining(d);
                    const overdue = d.dueDate < todayKey() && remaining > 0;
                    const pct = ((d.principal - remaining) / d.principal) * 100;
                    return (
                      <TableRow key={d.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <DebtLogoBadge debtName={d.name} lenderName={d.name} size="small" />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {d.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Bắt đầu: {d.startDate}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={d.kind === 'owed' ? 'Tôi nợ' : 'Cho vay'}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: 11,
                              fontWeight: 750,
                              borderRadius: '4px',
                              bgcolor: d.kind === 'owed' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: d.kind === 'owed' ? '#F59E0B' : '#10B981'
                            }}
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {money(d.principal)}
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 800, color: d.kind === 'owed' ? '#F59E0B' : '#10B981' }}>
                          {money(remaining)}
                        </TableCell>

                        <TableCell>
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, fontSize: '0.725rem' }}>
                              <span style={{ fontWeight: 700 }}>{Math.round(pct)}%</span>
                            </Box>
                            <Progress
                              value={pct}
                              color={d.kind === 'owed' ? '#f59e0b' : '#10b981'}
                            />
                          </Box>
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.825rem' }}>
                          {dateLabel(d.dueDate)}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            label={
                              remaining === 0
                                ? 'Đã tất toán'
                                : overdue
                                ? 'Quá hạn'
                                : d.kind === 'owed'
                                ? 'Phải trả'
                                : 'Cần thu'
                            }
                            status={remaining === 0 ? 'success' : overdue ? 'danger' : 'warning'}
                            variant="soft"
                            size="small"
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={remaining === 0}
                              startIcon={<Plus size={13} />}
                              onClick={() => {
                                setPay(d);
                                setError('');
                              }}
                              sx={{
                                borderRadius: '4px',
                                fontWeight: 750,
                                fontSize: '0.75rem',
                                bgcolor: d.kind === 'owed' ? '#F59E0B' : '#10B981',
                                color: '#FFFFFF',
                                '&:hover': {
                                  bgcolor: d.kind === 'owed' ? '#D97706' : '#059669'
                                }
                              }}
                            >
                              {d.kind === 'owed' ? 'Trả' : 'Thu'}
                            </Button>

                            <ItemActionMenu
                              ariaLabel={`Tùy chọn khoản nợ ${d.name}`}
                              items={[
                                ...(d.kind === 'lent' && remaining > 0 ? [{
                                  label: 'Soạn tin nhắc nợ lịch sự',
                                  icon: <Send size={15} />,
                                  onClick: () => {
                                    setReminderDebt(d);
                                    setCopiedReminder(false);
                                  }
                                }] : []),
                                {
                                  label: 'Lịch sử thanh toán',
                                  icon: <History size={15} />,
                                  onClick: () => setHistory(d)
                                },
                                {
                                  label: 'Chỉnh sửa khoản nợ',
                                  icon: <Pencil size={15} />,
                                  onClick: () => start(d)
                                },
                                {
                                  label: 'Xóa khoản nợ',
                                  icon: <Trash2 size={15} />,
                                  color: 'error' as const,
                                  onClick: () => setDeleting(d)
                                }
                              ]}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={data.debts.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[6, 12, 24]}
            labelRowsPerPage="Số hàng / trang:"
          />
        </Card>
      )}

      {/* Add / Edit Debt Modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              m: { xs: 1.5, sm: 2 },
              width: { xs: 'calc(100% - 24px)', sm: 'auto' },
              borderRadius: '6px',
              maxHeight: 'calc(100% - 32px)'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {edit ? 'Sửa khoản nợ' : 'Thêm khoản nợ mới'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <MuiTextField
            label="Tên người hoặc khoản nợ"
            placeholder="VD: Vay mua xe, Bạn Nam mượn, Trả góp điện thoại"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
          <MuiSelect
            label="Loại nợ"
            value={form.kind}
            onChange={val => setForm({ ...form, kind: val as Debt['kind'] })}
            options={[
              { value: 'owed', label: 'Tôi cần trả (Đi vay / Mua trả góp)' },
              { value: 'lent', label: 'Người khác nợ tôi (Cho vay)' }
            ]}
          />
          <MuiCurrencyInput
            label="Số tiền gốc (₫)"
            value={form.principal}
            onChange={val => setForm({ ...form, principal: val })}
            required
          />
          <MuiDatePicker
            label="Ngày bắt đầu"
            value={form.startDate}
            onChange={val => setForm({ ...form, startDate: val })}
          />
          <MuiDatePicker
            label="Hạn thanh toán"
            value={form.dueDate}
            onChange={val => setForm({ ...form, dueDate: val })}
          />
          <MuiTextField
            label="Lãi suất tham khảo (%/năm)"
            type="number"
            value={form.interestRate}
            onChange={e => setForm({ ...form, interestRate: e.target.value })}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Ứng dụng chỉ lưu thông tin lãi suất để bạn theo dõi, chưa tự động tính lãi kép phát sinh.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={save}>
            Lưu khoản nợ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment / Recovery Modal */}
      <Dialog
        open={!!pay}
        onClose={() => setPay(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              m: { xs: 1.5, sm: 2 },
              width: { xs: 'calc(100% - 24px)', sm: 'auto' },
              borderRadius: '6px',
              maxHeight: 'calc(100% - 32px)'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {pay?.kind === 'owed' ? 'Ghi trả nợ' : 'Ghi thu hồi nợ'} · {pay?.name || ''}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <MuiSelect
            label={pay?.kind === 'owed' ? 'Trích từ tài khoản' : 'Nhận vào tài khoản'}
            value={account}
            onChange={val => setAccount(val)}
            options={data.accounts.map(a => ({
              value: a.id,
              label: a.name,
              subtitle: `Số dư: ${money(balance(a, data.transactions))}`
            }))}
          />
          <MuiCurrencyInput
            label="Số tiền thanh toán (₫)"
            value={amount}
            onChange={val => setAmount(val)}
            required
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Khoản này chỉ điều chỉnh số dư tài khoản và dư nợ, không tính vào thu nhập hoặc chi tiêu tiêu dùng.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPay(null)}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={record}>
            Ghi nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment History Modal */}
      <Dialog
        open={!!history}
        onClose={() => setHistory(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              m: { xs: 1.5, sm: 2 },
              width: { xs: 'calc(100% - 24px)', sm: 'auto' },
              borderRadius: '6px',
              maxHeight: 'calc(100% - 32px)'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Lịch sử thanh toán · {history?.name || ''}
        </DialogTitle>
        <DialogContent dividers>
          <div className="mini-list">
            {history?.payments.map((p: DebtPayment) => (
              <div className="mini-row" key={p.id}>
                <span>{dateLabel(p.date)}</span>
                <strong style={{ color: '#059669' }}>{money(p.amount)}</strong>
              </div>
            ))}
            {history?.payments.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                Chưa có lịch sử thanh toán nào.
              </Typography>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistory(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Confirm
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            update(x => ({
              ...x,
              debts: x.debts.filter(d => d.id !== deleting.id)
            }));
          }
        }}
        message={`Xóa theo dõi khoản “${deleting?.name || ''}”? Lịch sử các giao dịch thanh toán đã ghi trước đây sẽ được giữ lại.`}
      />

      {/* Debt Reminder Message Modal */}
      <Dialog
        open={!!reminderDebt}
        onClose={() => setReminderDebt(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Send size={18} color="#059669" />
          <span>Tin nhắn nhắc nợ lịch sự · {reminderDebt?.name || ''}</span>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
          {reminderDebt && (() => {
            const rem = debtRemaining(reminderDebt);
            const defaultAcc = data.accounts.find(a => a.id === data.user.defaultAccountId) || data.accounts[0];
            const msg = `Chào ${reminderDebt.name}, Finora gửi lời nhắn giúp bạn khoản tiền ${money(rem)} mượn ngày ${dateLabel(reminderDebt.startDate)} đã đến hạn thanh toán (${dateLabel(reminderDebt.dueDate)}). Khi nào tiện nhờ bạn chuyển khoản giúp mình qua tài khoản [${defaultAcc?.name || 'Ngân hàng'}] nhé. Cảm ơn bạn nhiều!`;

            return (
              <>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Tin nhắn được định dạng lịch sự, ngắn gọn và tế nhị để bạn gửi qua Zalo, Messenger hoặc SMS:
                </Typography>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: '6px',
                    bgcolor: 'action.hover',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    lineHeight: 1.6
                  }}
                >
                  {msg}
                </Box>

                <Button
                  variant={copiedReminder ? 'contained' : 'outlined'}
                  color={copiedReminder ? 'success' : 'primary'}
                  startIcon={copiedReminder ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  onClick={() => {
                    navigator.clipboard.writeText(msg);
                    setCopiedReminder(true);
                    notify?.('Đã sao chép tin nhắn nhắc nợ vào bộ nhớ tạm!');
                  }}
                >
                  {copiedReminder ? 'Đã sao chép vào bộ nhớ tạm' : 'Sao chép tin nhắn'}
                </Button>
              </>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReminderDebt(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
