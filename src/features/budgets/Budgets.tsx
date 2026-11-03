import React, { useState } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid, List } from 'lucide-react';
import {
  Box,
  Button,
  IconButton,
  Card,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
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
import { budgetSpent, money, monthKey, uid } from '../../lib/finance';
import { Confirm, PageHead, Progress } from '../../components/ui';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BudgetCategoryBadge } from '../../components/BudgetCategoryIcons';
import { canAddBudget } from '../../lib/subscription';
import {
  MuiTextField,
  MuiSelect,
  MuiCurrencyInput,
  MuiMonthPicker
} from '../../components/mui/MuiInputs';
import type { Budget } from '../../types';

import { SixJarsView } from '../jars/SixJarsView';

export default function Budgets() {
  const data = useFinance(s => s.data)!;
  const update = useFinance(s => s.update);
  const openPricing = useFinance(s => s.openPricing);

  const [activeTab, setActiveTab] = useState<'categories' | 'jars'>('categories');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const current = monthKey(new Date());
  const [month, setMonth] = useState(current);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);
  const [form, setForm] = useState({ name: '', categoryId: '', limit: '', month: current });
  const [error, setError] = useState('');

  const budgets = data.budgets.filter(b => b.month === month);

  const start = (b?: Budget) => {
    if (!b && !canAddBudget(data)) {
      openPricing('Gói Free hỗ trợ tối đa 3 ngân sách. Nâng cấp Pro để thiết lập ngân sách không giới hạn!');
      return;
    }
    setEdit(b || null);
    setForm(
      b
        ? {
            name: b.name,
            categoryId: b.categoryId || '',
            limit: String(b.limit),
            month: b.month
          }
        : { name: '', categoryId: '', limit: '', month }
    );
    setError('');
    setOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = Number(form.limit);
    if (!form.name.trim() || !Number.isInteger(limit) || limit <= 0) {
      setError('Nhập tên và hạn mức hợp lệ');
      return;
    }

    update(d => ({
      ...d,
      budgets: edit
        ? d.budgets.map(b =>
            b.id === edit.id ? { ...b, ...form, categoryId: form.categoryId || undefined, limit } : b
          )
        : [
            ...d.budgets,
            {
              id: uid(),
              name: form.name.trim(),
              categoryId: form.categoryId || undefined,
              limit,
              month: form.month
            }
          ]
    }));
    setOpen(false);
  };

  const total = budgets.find(b => !b.categoryId);
  const spent = total ? budgetSpent(total, data.transactions) : 0;

  return (
    <>
      <PageHead
        eyebrow="KIỂM SOÁT CHI TIÊU"
        title="Ngân sách"
        subtitle="Theo dõi mức đã dùng từ các giao dịch chi tiêu thực tế."
        actions={
          activeTab === 'categories' ? (
            <>
              <MuiMonthPicker
                label="Chọn tháng"
                value={month}
                onChange={val => { setMonth(val); setPage(0); }}
              />
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
                Tạo ngân sách
              </Button>
            </>
          ) : undefined
        }
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => { setActiveTab(val); setPage(0); }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab value="categories" label="Ngân sách danh mục" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab value="jars" label="Phương pháp 6 chiếc hũ (6 Jars & ZBB)" sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>

        {activeTab === 'categories' && (
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
        )}
      </Box>

      {activeTab === 'jars' ? (
        <SixJarsView />
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid-stats" style={{ marginBottom: 20 }}>
            <div className="card stat">
              <span className="stat-label">Tổng hạn mức</span>
              <div className="stat-value">
                {money(
                  total?.limit ||
                    budgets.filter(b => b.categoryId).reduce((n, b) => n + b.limit, 0)
                )}
              </div>
              <div className="stat-meta">Tháng {month}</div>
            </div>
            <div className="card stat">
              <span className="stat-label">Đã chi</span>
              <div className="stat-value">
                {money(
                  spent ||
                    data.transactions
                      .filter(
                        t =>
                          t.type === 'expense' &&
                          t.status === 'completed' &&
                          t.date.startsWith(month)
                      )
                      .reduce((n, t) => n + t.amount, 0)
                )}
              </div>
              <div className="stat-meta">Giao dịch hoàn tất</div>
            </div>
            <div className="card stat">
              <span className="stat-label">Còn lại</span>
              <div className="stat-value">
                {money(Math.max(0, (total?.limit || 0) - spent))}
              </div>
              <div className="stat-meta">Theo ngân sách tổng</div>
            </div>
            <div className="card stat">
              <span className="stat-label">Cảnh báo</span>
              <div className="stat-value">
                {budgets.filter(b => budgetSpent(b, data.transactions) / b.limit >= 0.8).length}
              </div>
              <div className="stat-meta">Đạt từ 80% hạn mức</div>
            </div>
          </div>

          {viewMode === 'grid' ? (
            /* ========================================== */
            /* BENTO GRID VIEW OF BUDGETS                 */
            /* ========================================== */
            <Box>
              <div className="tiles">
                {budgets
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(b => {
                    const n = budgetSpent(b, data.transactions);
                    const pct = (n / b.limit) * 100;
                    return (
                      <Card
                        variant="outlined"
                        className="card tile"
                        key={b.id}
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
                          <BudgetCategoryBadge categoryKey={b.categoryId} size={36} />
                          <StatusBadge
                            label={pct >= 100 ? 'Vượt hạn mức' : pct >= 80 ? 'Sắp chạm trần' : 'Trong hạn mức'}
                            status={pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success'}
                            variant="soft"
                            size="small"
                          />
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.25 }}>
                          {b.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                          {b.categoryId
                            ? data.categories.find(c => c.id === b.categoryId)?.name
                            : 'Tất cả danh mục'}{' '}
                          · Tháng {b.month}
                        </Typography>

                        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                          {money(n)}{' '}
                          <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                            / {money(b.limit)}
                          </Typography>
                        </Typography>

                        <Progress
                          value={pct}
                          color={pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981'}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontSize: 11, color: 'text.secondary' }}>
                          <span>{Math.round(pct)}% đã dùng</span>
                          <span>Còn {money(Math.max(0, b.limit - n))}</span>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'center' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Pencil size={13} />}
                            onClick={() => start(b)}
                            sx={{
                              borderRadius: '4px',
                              fontWeight: 750,
                              fontSize: '0.75rem',
                              borderColor: 'rgba(21, 150, 107, 0.4)',
                              color: '#15966B',
                              bgcolor: 'rgba(21, 150, 107, 0.08)',
                              '&:hover': {
                                bgcolor: 'rgba(21, 150, 107, 0.18)',
                                borderColor: '#15966B'
                              }
                            }}
                          >
                            Sửa
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => setDeleting(b)}
                            aria-label="Xóa ngân sách"
                            sx={{
                              ml: 'auto',
                              borderRadius: '4px',
                              color: '#EF4444',
                              bgcolor: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' }
                            }}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </Box>
                      </Card>
                    );
                  })}
                {budgets.length === 0 && (
                  <Box sx={{ gridColumn: '1 / -1', p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    Chưa có ngân sách trong tháng này. Hãy tạo ngân sách để kiểm soát chi tiêu!
                  </Box>
                )}
              </div>

              {/* Grid Pagination */}
              {budgets.length > 0 && (
                <TablePagination
                  component="div"
                  count={budgets.length}
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
            /* TABLE VIEW OF BUDGETS                      */
            /* ========================================== */
            <Card sx={{ p: 0, overflow: 'hidden', borderRadius: '6px' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Ngân sách & Danh mục</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Hạn mức</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Đã chi</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Còn lại</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Tiến độ sử dụng</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgets
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map(b => {
                        const n = budgetSpent(b, data.transactions);
                        const pct = (n / b.limit) * 100;
                        const cat = data.categories.find(c => c.id === b.categoryId);
                        return (
                          <TableRow key={b.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <BudgetCategoryBadge categoryKey={b.categoryId} size={32} />
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    {b.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {cat?.name || 'Tất cả danh mục'} · Tháng {b.month}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell align="right" sx={{ fontWeight: 800 }}>
                              {money(b.limit)}
                            </TableCell>

                            <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {money(n)}
                            </TableCell>

                            <TableCell align="right" sx={{ fontWeight: 700, color: Math.max(0, b.limit - n) === 0 ? '#EF4444' : '#10B981' }}>
                              {money(Math.max(0, b.limit - n))}
                            </TableCell>

                            <TableCell>
                              <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, fontSize: '0.725rem' }}>
                                  <span style={{ fontWeight: 700 }}>{Math.round(pct)}%</span>
                                </Box>
                                <Progress
                                  value={pct}
                                  color={pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981'}
                                />
                              </Box>
                            </TableCell>

                            <TableCell>
                              <StatusBadge
                                label={pct >= 100 ? 'Vượt hạn mức' : pct >= 80 ? 'Sắp chạm trần' : 'Trong hạn mức'}
                                status={pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success'}
                                variant="soft"
                                size="small"
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Pencil size={13} />}
                                  onClick={() => start(b)}
                                  sx={{
                                    borderRadius: '4px',
                                    fontWeight: 750,
                                    fontSize: '0.75rem',
                                    borderColor: 'rgba(21, 150, 107, 0.4)',
                                    color: '#15966B',
                                    bgcolor: 'rgba(21, 150, 107, 0.08)',
                                    '&:hover': {
                                      bgcolor: 'rgba(21, 150, 107, 0.18)',
                                      borderColor: '#15966B'
                                    }
                                  }}
                                >
                                  Sửa
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={() => setDeleting(b)}
                                  aria-label="Xóa ngân sách"
                                  sx={{
                                    borderRadius: '4px',
                                    color: '#EF4444',
                                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' }
                                  }}
                                >
                                  <Trash2 size={14} />
                                </IconButton>
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
                count={budgets.length}
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
        </>
      )}

      {/* Add / Edit Budget Modal */}
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
          {edit ? 'Sửa ngân sách' : 'Tạo ngân sách mới'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <MuiTextField
            label="Tên ngân sách"
            placeholder="Ví dụ: Ăn uống, Di chuyển, Tổng chi tiêu"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
          <MuiSelect
            label="Danh mục áp dụng"
            value={form.categoryId}
            onChange={val => setForm({ ...form, categoryId: val })}
            options={[
              { value: '', label: 'Tất cả danh mục (Ngân sách tổng)' },
              ...data.categories
                .filter(c => c.type === 'expense' && !c.hidden)
                .map(c => ({ value: c.id, label: c.name }))
            ]}
          />
          <MuiMonthPicker
            label="Tháng áp dụng"
            value={form.month}
            onChange={val => setForm({ ...form, month: val })}
          />
          <MuiCurrencyInput
            label="Hạn mức ngân sách (₫)"
            value={form.limit}
            onChange={val => setForm({ ...form, limit: val })}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={save}>
            Lưu ngân sách
          </Button>
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
              budgets: d.budgets.filter(b => b.id !== deleting.id)
            }));
          }
        }}
        title="Xác nhận xóa ngân sách"
        message={`Xóa ngân sách “${deleting?.name || ''}”? Các giao dịch thực tế sẽ được giữ nguyên.`}
      />
    </>
  );
}
