import React, { useState } from 'react';
import { differenceInCalendarMonths, parseISO } from 'date-fns';
import { Plus, Pencil, Trash2, History, LayoutGrid, List } from 'lucide-react';
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
import { balance, dateLabel, goalSaved, money, uid, todayKey } from '../../lib/finance';
import { Confirm, PageHead, Progress } from '../../components/ui';
import { HelpButton } from '../../components/HelpButton';
import { ItemActionMenu } from '../../components/ItemActionMenu';
import { canAddGoal } from '../../lib/subscription';
import {
  MuiTextField,
  MuiSelect,
  MuiCurrencyInput,
  MuiDatePicker
} from '../../components/mui/MuiInputs';
import { FundLogoBadge } from '../../lib/brandBadges';
import type { SavingsGoal, Transaction } from '../../types';

export default function Savings() {
  const data = useFinance(s => s.data)!;
  const update = useFinance(s => s.update);
  const openPricing = useFinance(s => s.openPricing);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null);
  const [contribute, setContribute] = useState<SavingsGoal | null>(null);
  const [history, setHistory] = useState<SavingsGoal | null>(null);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState(data.accounts[0]?.id || '');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const blank = {
    name: '',
    target: '',
    startDate: todayKey(),
    dueDate: '',
    accountId: data.accounts.find(a => a.type === 'savings')?.id || data.accounts[0]?.id || '',
    icon: 'Target'
  };
  const [form, setForm] = useState(blank);

  const start = (g?: SavingsGoal) => {
    if (!g && !canAddGoal(data)) {
      openPricing('Gói Free hỗ trợ tối đa 1 mục tiêu tiết kiệm. Nâng cấp Pro để tạo không giới hạn!');
      return;
    }
    setEdit(g || null);
    setForm(
      g
        ? {
            name: g.name,
            target: String(g.target),
            startDate: g.startDate,
            dueDate: g.dueDate,
            accountId: g.accountId,
            icon: g.icon
          }
        : blank
    );
    setError('');
    setOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(form.target);
    if (!form.name.trim() || !Number.isInteger(n) || n <= 0 || form.dueDate <= form.startDate) {
      setError('Kiểm tra tên, số tiền mục tiêu và ngày hoàn thành');
      return;
    }

    update(d => ({
      ...d,
      goals: edit
        ? d.goals.map(g => (g.id === edit.id ? { ...g, ...form, target: n } : g))
        : [...d.goals, { ...form, id: uid(), target: n, contributions: [] }]
    }));
    setOpen(false);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribute) return;
    const n = Number(amount),
      a = data.accounts.find(x => x.id === source);
    if (!Number.isInteger(n) || n <= 0 || !a) {
      setError('Nhập số tiền hợp lệ');
      return;
    }
    if (source !== contribute.accountId && balance(a, data.transactions) < n) {
      setError('Số dư tài khoản nguồn không đủ');
      return;
    }

    const tx: Transaction = {
      id: uid(),
      name: `Dành cho mục tiêu: ${contribute.name}`,
      amount: n,
      type: 'transfer',
      accountId: source,
      toAccountId: contribute.accountId,
      date: todayKey(),
      method: 'Chuyển khoản',
      note: 'Đóng góp mục tiêu tiết kiệm',
      status: 'completed'
    };

    update(d => ({
      ...d,
      goals: d.goals.map(g =>
        g.id === contribute.id
          ? {
              ...g,
              contributions: [...g.contributions, { id: uid(), amount: n, date: tx.date, accountId: source }]
            }
          : g
      ),
      transactions: source === contribute.accountId ? d.transactions : [tx, ...d.transactions]
    }));

    setContribute(null);
    setAmount('');
    setError('');
  };

  return (
    <>
      <PageHead
        eyebrow="KẾ HOẠCH TƯƠNG LAI"
        title="Mục tiêu tiết kiệm"
        subtitle="Theo dõi tiến độ và số tiền cần dành mỗi tháng."
        actions={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpButton pageKey="savings" />
            <Button
              id="tour-savings-add-btn"
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
              Tạo mục tiêu
            </Button>
          </Box>
        }
      />

      <div className="grid-stats" style={{ marginBottom: 20 }}>
        <div className="card stat">
          <span className="stat-label">Đã dành cho mục tiêu</span>
          <div className="stat-value">{money(data.goals.reduce((n, g) => n + goalSaved(g), 0))}</div>
        </div>
        <div className="card stat">
          <span className="stat-label">Tổng số tiền mục tiêu</span>
          <div className="stat-value">{money(data.goals.reduce((n, g) => n + g.target, 0))}</div>
        </div>
        <div className="card stat">
          <span className="stat-label">Mục tiêu đang thực hiện</span>
          <div className="stat-value">{data.goals.filter(g => goalSaved(g) < g.target).length}</div>
        </div>
      </div>

      {/* View Mode Toggle Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Danh sách mục tiêu ({data.goals.length})
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
        /* BENTO GRID VIEW OF SAVINGS GOALS           */
        /* ========================================== */
        <Box id="tour-savings-list">
          <div className="tiles">
            {data.goals
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(g => {
                const saved = goalSaved(g),
                  remaining = Math.max(0, g.target - saved),
                  months = Math.max(1, differenceInCalendarMonths(parseISO(g.dueDate), new Date()));
                return (
                  <Card
                    variant="outlined"
                    className="card tile"
                    key={g.id}
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <FundLogoBadge name={g.name} kind={g.icon} size="medium" />
                      <Chip
                        label={saved >= g.target ? 'Hoàn thành' : dateLabel(g.dueDate)}
                        size="small"
                        color={saved >= g.target ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ height: 22, fontSize: 11, fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.25 }}>
                      {g.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                      Tài khoản: {data.accounts.find(a => a.id === g.accountId)?.name}
                    </Typography>

                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                      {money(saved)}{' '}
                      <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                        / {money(g.target)}
                      </Typography>
                    </Typography>

                    <Progress value={(saved / g.target) * 100} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontSize: 11, color: 'text.secondary' }}>
                      <span>Còn thiếu {money(remaining)}</span>
                      <span>{Math.round((saved / g.target) * 100)}%</span>
                    </Box>

                    <Typography variant="body2" sx={{ mt: 1.5, fontSize: 12 }}>
                      Cần dành khoảng <strong>{money(Math.ceil(remaining / months))}</strong> / tháng
                    </Typography>

                    {/* Action Buttons: 1 Nút chính có màu + Nút More */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 1.5, borderTop: '1px solid var(--border-subtle)' }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Plus size={14} />}
                        onClick={() => {
                          setContribute(g);
                          setSource(data.accounts.find(a => a.id !== g.accountId)?.id || g.accountId);
                          setError('');
                        }}
                        sx={{
                          fontWeight: 750,
                          fontSize: '0.78rem',
                          borderRadius: '4px',
                          bgcolor: '#10B981',
                          color: '#FFFFFF',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                          '&:hover': { bgcolor: '#059669' }
                        }}
                      >
                        Thêm tiền
                      </Button>

                      <ItemActionMenu
                        ariaLabel={`Tùy chọn mục tiêu ${g.name}`}
                        items={[
                          {
                            label: 'Lịch sử tích lũy',
                            icon: <History size={15} />,
                            onClick: () => setHistory(g)
                          },
                          {
                            label: 'Chỉnh sửa mục tiêu',
                            icon: <Pencil size={15} />,
                            onClick: () => start(g)
                          },
                          {
                            label: 'Xóa mục tiêu',
                            icon: <Trash2 size={15} />,
                            color: 'error' as const,
                            onClick: () => setDeleting(g)
                          }
                        ]}
                      />
                    </Box>
                  </Card>
                );
              })}
          </div>

          {/* Grid Pagination */}
          {data.goals.length > 0 && (
            <TablePagination
              component="div"
              count={data.goals.length}
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
        /* TABLE VIEW OF SAVINGS GOALS                */
        /* ========================================== */
        <Card sx={{ p: 0, overflow: 'hidden', borderRadius: '6px' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Mục tiêu tiết kiệm</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tài khoản giữ tiền</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Đã dành</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Mục tiêu</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Còn thiếu</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hạn chót</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Tiến độ tích lũy</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.goals
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(g => {
                    const saved = goalSaved(g),
                      remaining = Math.max(0, g.target - saved),
                      pct = (saved / g.target) * 100;
                    return (
                      <TableRow key={g.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <FundLogoBadge name={g.name} kind={g.icon} size="small" />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {g.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Bắt đầu: {g.startDate}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 600 }}>
                          {data.accounts.find(a => a.id === g.accountId)?.name || 'Mặc định'}
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 800, color: '#10B981' }}>
                          {money(saved)}
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {money(g.target)}
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 700, color: remaining === 0 ? '#10B981' : 'text.secondary' }}>
                          {money(remaining)}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={saved >= g.target ? 'Hoàn thành' : dateLabel(g.dueDate)}
                            size="small"
                            color={saved >= g.target ? 'success' : 'default'}
                            variant="outlined"
                            sx={{ height: 22, fontSize: 11, fontWeight: 700 }}
                          />
                        </TableCell>

                        <TableCell>
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, fontSize: '0.725rem' }}>
                              <span style={{ fontWeight: 700 }}>{Math.round(pct)}%</span>
                            </Box>
                            <Progress value={pct} />
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Plus size={13} />}
                              onClick={() => {
                                setContribute(g);
                                setSource(data.accounts.find(a => a.id !== g.accountId)?.id || g.accountId);
                                setError('');
                              }}
                              sx={{
                                fontWeight: 750,
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                bgcolor: '#10B981',
                                color: '#FFFFFF',
                                '&:hover': { bgcolor: '#059669' }
                              }}
                            >
                              Thêm tiền
                            </Button>

                            <ItemActionMenu
                              ariaLabel={`Tùy chọn mục tiêu ${g.name}`}
                              items={[
                                {
                                  label: 'Lịch sử tích lũy',
                                  icon: <History size={15} />,
                                  onClick: () => setHistory(g)
                                },
                                {
                                  label: 'Chỉnh sửa mục tiêu',
                                  icon: <Pencil size={15} />,
                                  onClick: () => start(g)
                                },
                                {
                                  label: 'Xóa mục tiêu',
                                  icon: <Trash2 size={15} />,
                                  color: 'error' as const,
                                  onClick: () => setDeleting(g)
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
            count={data.goals.length}
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

      {/* Add / Edit Goal Modal */}
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
          {edit ? 'Sửa mục tiêu tiết kiệm' : 'Tạo mục tiêu tiết kiệm mới'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <MuiTextField
            label="Tên mục tiêu"
            placeholder="VD: Mua laptop, Quỹ du lịch, Mua nhà"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
          <MuiCurrencyInput
            label="Số tiền mục tiêu (₫)"
            value={form.target}
            onChange={val => setForm({ ...form, target: val })}
            required
          />
          <MuiSelect
            label="Tài khoản tích lũy"
            value={form.accountId}
            onChange={val => setForm({ ...form, accountId: val })}
            options={data.accounts.map(a => ({
              value: a.id,
              label: a.name,
              subtitle: `Số dư: ${money(balance(a, data.transactions))}`
            }))}
          />
          <MuiSelect
            label="Biểu tượng"
            value={form.icon}
            onChange={val => setForm({ ...form, icon: val })}
            options={[
              { value: 'Target', label: 'Mục tiêu chung' },
              { value: 'Laptop', label: 'Đồ công nghệ (Laptop)' },
              { value: 'ShieldCheck', label: 'Quỹ an toàn / Dự phòng' },
              { value: 'Plane', label: 'Du lịch / Kỳ nghỉ' }
            ]}
          />
          <MuiDatePicker
            label="Ngày bắt đầu"
            value={form.startDate}
            onChange={val => setForm({ ...form, startDate: val })}
          />
          <MuiDatePicker
            label="Dự kiến hoàn thành"
            value={form.dueDate}
            onChange={val => setForm({ ...form, dueDate: val })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={save}>
            Lưu mục tiêu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contribute Funds Modal */}
      <Dialog
        open={!!contribute}
        onClose={() => setContribute(null)}
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
          Thêm tiền vào · {contribute?.name || ''}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <MuiSelect
            label="Trích từ tài khoản"
            value={source}
            onChange={val => setSource(val)}
            options={data.accounts.map(a => ({
              value: a.id,
              label: a.name,
              subtitle: `Khả dụng: ${money(balance(a, data.transactions))}`
            }))}
          />
          <MuiCurrencyInput
            label="Số tiền thêm (₫)"
            value={amount}
            onChange={val => setAmount(val)}
            required
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Nếu chọn tài khoản khác tài khoản tích lũy, hệ thống sẽ ghi nhận một chuyển khoản nội bộ. Khoản này không tính vào chi tiêu.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setContribute(null)}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={add}>
            Xác nhận thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contribution History Modal */}
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
          Lịch sử đóng góp · {history?.name || ''}
        </DialogTitle>
        <DialogContent dividers>
          <div className="mini-list">
            {history?.contributions.map(c => (
              <div className="mini-row" key={c.id}>
                <span>{dateLabel(c.date)}</span>
                <strong style={{ color: '#059669' }}>+{money(c.amount)}</strong>
              </div>
            ))}
            {history?.contributions.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                Chưa có lần đóng góp nào.
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
            update(d => ({
              ...d,
              goals: d.goals.filter(g => g.id !== deleting.id)
            }));
          }
        }}
        message={`Xóa mục tiêu “${deleting?.name || ''}”? Lịch sử giao dịch chuyển tiền trước đây vẫn sẽ được giữ lại.`}
      />
    </>
  );
}
