import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer
} from '@mui/material';
import {
  Briefcase,
  Plus,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
  HelpCircle
} from 'lucide-react';
import { useFinance } from '../../store';
import { money, todayKey, uid, formatVnDate } from '../../lib/finance';
import { PageHead, Confirm } from '../../components/ui';
import {
  calculateContractProgress,
  calculateIncomeOverview,
  markMilestoneReceived
} from '../../lib/incomeEngine';
import type { IncomeContract, IncomeMilestone, IncomeSourceType } from '../../types';
import { MuiTextField, MuiSelect, MuiCurrencyInput, MuiDatePicker } from '../../components/mui/MuiInputs';

const SOURCE_OPTIONS: { value: IncomeSourceType; label: string; color: string }[] = [
  { value: 'salary', label: 'Lương cố định', color: '#3b82f6' },
  { value: 'freelance', label: 'Freelance / Dự án', color: '#10b981' },
  { value: 'business', label: 'Kinh doanh / Bán hàng', color: '#f59e0b' },
  { value: 'investment', label: 'Đầu tư / Cổ tức', color: '#8b5cf6' },
  { value: 'commission', label: 'Hoa hồng / Thưởng', color: '#ec4899' },
  { value: 'other', label: 'Thu nhập khác', color: '#64748b' }
];

export default function IncomeManagementView() {
  const { data, update, notify } = useFinance();
  const contracts: IncomeContract[] = data?.incomeContracts || [];
  const accounts = data?.accounts || [];

  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'canceled'>('all');

  // Modal: Create or Edit Contract
  const [openContractModal, setOpenContractModal] = useState(false);
  const [editingContract, setEditingContract] = useState<IncomeContract | null>(null);

  // Contract Form State
  const [contractTitle, setContractTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [sourceType, setSourceType] = useState<IncomeSourceType>('freelance');
  const [totalValue, setTotalValue] = useState('10000000');
  const [startDate, setStartDate] = useState(todayKey());
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [milestones, setMilestones] = useState<{ id: string; name: string; amount: number; expectedDate: string }[]>([
    { id: uid(), name: 'Đợt 1 - Tạm ứng 30%', amount: 3000000, expectedDate: todayKey() },
    { id: uid(), name: 'Đợt 2 - Bàn giao 50%', amount: 5000000, expectedDate: todayKey() },
    { id: uid(), name: 'Đợt 3 - Nghiệm thu 20%', amount: 2000000, expectedDate: todayKey() }
  ]);

  // Modal: Receive Milestone Payment
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [activeContractForReceive, setActiveContractForReceive] = useState<IncomeContract | null>(null);
  const [activeMilestoneForReceive, setActiveMilestoneForReceive] = useState<IncomeMilestone | null>(null);
  const [targetAccountId, setTargetAccountId] = useState(accounts[0]?.id || '');
  const [receiveDate, setReceiveDate] = useState(todayKey());
  const [receiveNote, setReceiveNote] = useState('');

  // Delete Confirm
  const [deletingContract, setDeletingContract] = useState<IncomeContract | null>(null);

  // Global calculations via incomeEngine
  const overview = useMemo(() => {
    return calculateIncomeOverview(contracts);
  }, [contracts]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      if (selectedSourceFilter !== 'all' && c.sourceType !== selectedSourceFilter) return false;
      if (selectedStatusFilter !== 'all' && c.status !== selectedStatusFilter) return false;
      return true;
    });
  }, [contracts, selectedSourceFilter, selectedStatusFilter]);

  // Reset & Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingContract(null);
    setContractTitle('');
    setClientName('');
    setSourceType('freelance');
    setTotalValue('10000000');
    setStartDate(todayKey());
    setExpectedEndDate('');
    setNotes('');
    setMilestones([
      { id: uid(), name: 'Đợt 1 - Cọc 30%', amount: 3000000, expectedDate: todayKey() },
      { id: uid(), name: 'Đợt 2 - Bàn giao 50%', amount: 5000000, expectedDate: todayKey() },
      { id: uid(), name: 'Đợt 3 - Nghiệm thu 20%', amount: 2000000, expectedDate: todayKey() }
    ]);
    setOpenContractModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: IncomeContract) => {
    setEditingContract(c);
    setContractTitle(c.title);
    setClientName(c.clientName || '');
    setSourceType(c.sourceType);
    setTotalValue(String(c.totalContractValue));
    setStartDate(c.startDate);
    setExpectedEndDate(c.expectedEndDate || '');
    setNotes(c.notes || '');
    setMilestones(
      c.milestones.map(m => ({
        id: m.id,
        name: m.name,
        amount: m.amount,
        expectedDate: m.expectedDate || todayKey()
      }))
    );
    setOpenContractModal(true);
  };

  // Preset milestone distribution
  const handlePresetMilestones = (preset: 'single' | 'two_stage' | 'three_stage') => {
    const total = parseFloat(totalValue) || 0;
    if (total <= 0) return;

    if (preset === 'single') {
      setMilestones([
        { id: uid(), name: 'Thanh toán trọn gói (100%)', amount: total, expectedDate: todayKey() }
      ]);
    } else if (preset === 'two_stage') {
      const half = Math.round(total / 2);
      setMilestones([
        { id: uid(), name: 'Đợt 1 - Tạm ứng (50%)', amount: half, expectedDate: todayKey() },
        { id: uid(), name: 'Đợt 2 - Nghiệm thu (50%)', amount: total - half, expectedDate: todayKey() }
      ]);
    } else if (preset === 'three_stage') {
      const m1 = Math.round(total * 0.3);
      const m2 = Math.round(total * 0.5);
      const m3 = total - m1 - m2;
      setMilestones([
        { id: uid(), name: 'Đợt 1 - Cọc hợp đồng (30%)', amount: m1, expectedDate: todayKey() },
        { id: uid(), name: 'Đợt 2 - Bàn giao đợt 1 (50%)', amount: m2, expectedDate: todayKey() },
        { id: uid(), name: 'Đợt 3 - Quyết toán (20%)', amount: m3, expectedDate: todayKey() }
      ]);
    }
  };

  // Add a new milestone row
  const handleAddMilestoneRow = () => {
    setMilestones(prev => [
      ...prev,
      { id: uid(), name: `Đợt ${prev.length + 1}`, amount: 0, expectedDate: todayKey() }
    ]);
  };

  // Save Contract
  const handleSaveContract = async () => {
    if (!contractTitle.trim()) {
      notify({ message: 'Vui lòng nhập tên công việc hoặc hợp đồng', severity: 'warning' });
      return;
    }

    const val = parseFloat(totalValue) || 0;
    if (val <= 0) {
      notify({ message: 'Giá trị hợp đồng phải lớn hơn 0', severity: 'warning' });
      return;
    }

    const builtMilestones: IncomeMilestone[] = milestones.map(m => {
      // Keep existing received status if editing
      const existing = editingContract?.milestones.find(oldM => oldM.id === m.id);
      return {
        id: m.id,
        name: m.name.trim() || 'Đợt thanh toán',
        amount: m.amount,
        expectedDate: m.expectedDate,
        status: existing?.status || 'pending',
        receivedDate: existing?.receivedDate,
        transactionId: existing?.transactionId,
        accountId: existing?.accountId
      };
    });

    const totalReceived = builtMilestones
      .filter(m => m.status === 'received')
      .reduce((sum, m) => sum + m.amount, 0);

    const isFullyDone = totalReceived >= val && val > 0;

    if (editingContract) {
      const updated: IncomeContract = {
        ...editingContract,
        title: contractTitle.trim(),
        clientName: clientName.trim() || undefined,
        sourceType,
        totalContractValue: val,
        startDate,
        expectedEndDate: expectedEndDate || undefined,
        status: isFullyDone ? 'completed' : editingContract.status,
        milestones: builtMilestones,
        notes: notes.trim() || undefined,
        updatedAt: todayKey()
      };

      await update(d => ({
        ...d,
        incomeContracts: (d.incomeContracts || []).map(c => c.id === updated.id ? updated : c)
      }), 'Đã cập nhật hợp đồng thu nhập thành công');
    } else {
      const newContract: IncomeContract = {
        id: `ic-${uid()}`,
        title: contractTitle.trim(),
        clientName: clientName.trim() || undefined,
        sourceType,
        totalContractValue: val,
        startDate,
        expectedEndDate: expectedEndDate || undefined,
        status: isFullyDone ? 'completed' : 'in_progress',
        milestones: builtMilestones,
        notes: notes.trim() || undefined,
        createdAt: todayKey(),
        updatedAt: todayKey()
      };

      await update(d => ({
        ...d,
        incomeContracts: [newContract, ...(d.incomeContracts || [])]
      }), 'Đã tạo hợp đồng thu nhập mới thành công');
    }

    setOpenContractModal(false);
  };

  // Open Receive Payment Dialog
  const handleOpenReceiveModal = (contract: IncomeContract, milestone: IncomeMilestone) => {
    setActiveContractForReceive(contract);
    setActiveMilestoneForReceive(milestone);
    setTargetAccountId(accounts[0]?.id || '');
    setReceiveDate(todayKey());
    setReceiveNote(`Thanh toán ${milestone.name} - ${contract.title}`);
    setReceiveModalOpen(true);
  };

  // Confirm Receiving Payment
  const handleConfirmReceivePayment = async () => {
    if (!activeContractForReceive || !activeMilestoneForReceive) return;
    if (!targetAccountId) {
      notify({ message: 'Vui lòng chọn tài khoản / ví nhận tiền', severity: 'warning' });
      return;
    }

    try {
      const { updatedContract, newTransaction } = markMilestoneReceived(
        activeContractForReceive,
        activeMilestoneForReceive.id,
        targetAccountId,
        receiveDate
      );

      if (receiveNote) {
        newTransaction.note = receiveNote;
      }

      await update(d => ({
        ...d,
        incomeContracts: (d.incomeContracts || []).map(c => c.id === updatedContract.id ? updatedContract : c),
        transactions: [newTransaction, ...(d.transactions || [])]
      }), `Đã ghi nhận tiền về: +${money(activeMilestoneForReceive.amount)} vào ví!`);

      setReceiveModalOpen(false);
    } catch (err: any) {
      notify({ message: err?.message || 'Lỗi khi ghi nhận đợt thanh toán', severity: 'error' });
    }
  };

  // Delete Contract
  const handleConfirmDelete = async () => {
    if (!deletingContract) return;
    await update(d => ({
      ...d,
      incomeContracts: (d.incomeContracts || []).filter(c => c.id !== deletingContract.id)
    }), 'Đã xóa hợp đồng');
    setDeletingContract(null);
  };

  // Calculate sum of current draft milestones
  const draftMilestonesSum = useMemo(() => {
    return milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [milestones]);

  const targetDraftTotal = parseFloat(totalValue) || 0;
  const isMilestonesBalanced = Math.abs(draftMilestonesSum - targetDraftTotal) < 1;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* PAGE HEADER */}
      <PageHead
        eyebrow="NGUỒN THU & DỰ ÁN"
        title="Quản lý Thu nhập Đa Nguồn"
        subtitle="Theo dõi thu nhập Freelance, Lương, Kinh doanh & chia đợt thanh toán. Tuyệt đối không nhầm doanh thu dự kiến với tiền thực nhận."
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleOpenCreateModal}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Tạo Nguồn Thu / Hợp Đồng Mới
          </Button>
        }
      />

      {/* 4 OVERVIEW STATS CARDS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3
        }}
      >
        {/* 1. Expected Revenue */}
        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              DOANH THU DỰ KIẾN (HỢP ĐỒNG)
            </Typography>
            <Tooltip title="Tổng giá trị các hợp đồng đang tiến hành. Chưa tính vào số dư tiền mặt thực tế.">
              <HelpCircle size={15} color="#94a3b8" />
            </Tooltip>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 1, color: '#3b82f6' }}>
            {money(overview.totalExpectedRevenue)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
            Từ {overview.activeContractsCount} hợp đồng / dự án
          </Typography>
        </Card>

        {/* 2. Actually Received */}
        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderLeft: '4px solid #10b981' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
              TIỀN THỰC TẾ ĐÃ NHẬN VÀO VÍ
            </Typography>
            <CheckCircle2 size={16} color="#10b981" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 1, color: '#10b981' }}>
            {money(overview.totalActuallyReceived)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
            Đã cộng vào số dư tài khoản
          </Typography>
        </Card>

        {/* 3. Pending Receivables */}
        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderLeft: '4px solid #f59e0b' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>
              CÒN PHẢI THU (CHƯA VỀ TÀI KHOẢN)
            </Typography>
            <Clock size={16} color="#f59e0b" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 1, color: '#f59e0b' }}>
            {money(overview.totalPendingReceivables)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
            Các đợt đang chờ giải ngân
          </Typography>
        </Card>

        {/* 4. Collection Progress */}
        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            TỶ LỆ THU TIỀN THỰC TẾ
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>
              {overview.totalExpectedRevenue > 0
                ? Math.round((overview.totalActuallyReceived / overview.totalExpectedRevenue) * 100)
                : 0}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              tiến độ thanh toán
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={
              overview.totalExpectedRevenue > 0
                ? Math.min(100, Math.round((overview.totalActuallyReceived / overview.totalExpectedRevenue) * 100))
                : 0
            }
            sx={{
              mt: 1.5,
              height: 6,
              borderRadius: 3,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { bgcolor: '#10b981' }
            }}
          />
        </Card>
      </Box>

      {/* FILTER CONTROLS */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}
      >
        {/* Source Pills */}
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: { xs: 1, sm: 0 } }}>
          <Chip
            label="Tất cả nguồn"
            clickable
            color={selectedSourceFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setSelectedSourceFilter('all')}
            sx={{ fontWeight: 700 }}
          />
          {SOURCE_OPTIONS.map(opt => (
            <Chip
              key={opt.value}
              label={opt.label}
              clickable
              color={selectedSourceFilter === opt.value ? 'primary' : 'default'}
              onClick={() => setSelectedSourceFilter(opt.value)}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>

        {/* Status Filter */}
        <Box sx={{ minWidth: 160 }}>
          <MuiSelect
            label="Trạng thái"
            value={selectedStatusFilter}
            onChange={(val) => setSelectedStatusFilter(val as any)}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'in_progress', label: 'Đang thực hiện' },
              { value: 'completed', label: 'Đã hoàn tất' },
              { value: 'canceled', label: 'Đã hủy' }
            ]}
          />
        </Box>
      </Box>

      {/* CONTRACTS LIST */}
      {filteredContracts.length === 0 ? (
        <Card variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Briefcase size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Chưa có hợp đồng hoặc nguồn thu nào
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 460, mx: 'auto', mb: 3 }}>
            Tạo hợp đồng Freelance, công việc bán lẻ hoặc nguồn thu dự án để theo dõi số tiền đã nhận và các đợt chờ thanh toán.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleOpenCreateModal}
            sx={{ fontWeight: 700 }}
          >
            Tạo hợp đồng đầu tiên
          </Button>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {filteredContracts.map(c => {
            const progress = calculateContractProgress(c);
            const sourceMeta = SOURCE_OPTIONS.find(s => s.value === c.sourceType) || SOURCE_OPTIONS[1];

            return (
              <Card
                key={c.id}
                variant="outlined"
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                }}
              >
                {/* CONTRACT TOP HEADER */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1.5,
                    mb: 2
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {c.title}
                      </Typography>
                      <Chip
                        label={sourceMeta.label}
                        size="small"
                        sx={{
                          bgcolor: `${sourceMeta.color}15`,
                          color: sourceMeta.color,
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}
                      />
                      <Chip
                        label={c.status === 'completed' ? 'Hoàn tất' : c.status === 'canceled' ? 'Đã hủy' : 'Đang thực hiện'}
                        size="small"
                        color={c.status === 'completed' ? 'success' : c.status === 'canceled' ? 'default' : 'info'}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
                    </Box>
                    {c.clientName && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Đối tác / Khách hàng: <strong>{c.clientName}</strong>
                      </Typography>
                    )}
                  </Box>

                  {/* ACTION BUTTONS */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => handleOpenEditModal(c)}>
                      <Pencil size={17} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeletingContract(c)}>
                      <Trash2 size={17} />
                    </IconButton>
                  </Box>
                </Box>

                {/* PROGRESS METRICS */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    mb: 2.5,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 2
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Tổng giá trị hợp đồng
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {money(progress.totalValue)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                      Đã nhận ({progress.progressPercent}%)
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#10b981' }}>
                      {money(progress.receivedAmount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                      Còn phải thu
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                      {money(progress.receivableAmount)}
                    </Typography>
                  </Box>
                </Box>

                {/* MILESTONES TABLE */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Các đợt thanh toán ({progress.completedMilestonesCount}/{progress.totalMilestonesCount} đợt đã thanh toán)
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Đợt thanh toán</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Số tiền</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Thời gian dự kiến / Thực nhận</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {c.milestones.map(m => {
                        const isReceived = m.status === 'received';
                        return (
                          <TableRow key={m.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{m.name}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: isReceived ? '#10b981' : 'inherit' }}>
                              {money(m.amount)}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '0.825rem' }}>
                                {isReceived
                                  ? `Đã nhận ngày: ${formatVnDate(m.receivedDate || todayKey())}`
                                  : `Dự kiến: ${m.expectedDate ? formatVnDate(m.expectedDate) : 'Chưa định'}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={isReceived ? 'Đã nhận tiền' : 'Chờ thanh toán'}
                                size="small"
                                color={isReceived ? 'success' : 'warning'}
                                variant={isReceived ? 'filled' : 'outlined'}
                                sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {!isReceived ? (
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handleOpenReceiveModal(c, m)}
                                  startIcon={<CheckCircle2 size={14} />}
                                  sx={{ textTransform: 'none', fontWeight: 700, py: 0.5, px: 1.5, fontSize: '0.75rem' }}
                                >
                                  Ghi nhận tiền về
                                </Button>
                              ) : (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Đã vào ví
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            );
          })}
        </Box>
      )}

      {/* MODAL: CREATE / EDIT CONTRACT */}
      <Dialog
        open={openContractModal}
        onClose={() => setOpenContractModal(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '12px', maxWidth: { xs: '100%', sm: 560 } } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {editingContract ? 'Chỉnh sửa Hợp đồng / Nguồn thu' : 'Tạo Hợp đồng / Nguồn thu Mới'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Basic Info */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
            <MuiTextField
              label="Tên hợp đồng / Công việc *"
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
              placeholder="VD: Thiết kế App Tài chính Finora v2"
            />
            <MuiSelect
              label="Nguồn thu nhập *"
              value={sourceType}
              onChange={(val) => setSourceType(val as IncomeSourceType)}
              options={SOURCE_OPTIONS}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <MuiTextField
              label="Đối tác / Khách hàng / Công ty"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="VD: Công ty TNHH Sáng Tạo"
            />
            <MuiCurrencyInput
              label="Tổng giá trị hợp đồng (₫) *"
              value={totalValue}
              onChange={(val) => setTotalValue(val)}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <MuiDatePicker
              label="Ngày bắt đầu"
              value={startDate}
              onChange={(val) => val && setStartDate(val)}
            />
            <MuiDatePicker
              label="Ngày dự kiến hoàn thành"
              value={expectedEndDate}
              onChange={(val) => setExpectedEndDate(val)}
            />
          </Box>

          {/* MILESTONE BUILDER */}
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid var(--border-subtle)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Thiết lập các đợt thanh toán (Milestones)
              </Typography>
              {/* Presets */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => handlePresetMilestones('single')} sx={{ fontSize: '0.75rem', py: 0.25 }}>
                  1 Đợt (100%)
                </Button>
                <Button size="small" variant="outlined" onClick={() => handlePresetMilestones('two_stage')} sx={{ fontSize: '0.75rem', py: 0.25 }}>
                  2 Đợt (50-50)
                </Button>
                <Button size="small" variant="outlined" onClick={() => handlePresetMilestones('three_stage')} sx={{ fontSize: '0.75rem', py: 0.25 }}>
                  3 Đợt (30-50-20)
                </Button>
              </Box>
            </Box>

            {/* Milestones dynamic list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {milestones.map((m, idx) => (
                <Box
                  key={m.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '2fr 1.5fr 1.5fr auto' },
                    gap: 1.5,
                    alignItems: 'center'
                  }}
                >
                  <MuiTextField
                    label={`Tên đợt ${idx + 1}`}
                    value={m.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMilestones(prev => prev.map(item => item.id === m.id ? { ...item, name: val } : item));
                    }}
                  />
                  <MuiCurrencyInput
                    label="Số tiền đợt"
                    value={String(m.amount)}
                    onChange={(val) => {
                      const num = parseFloat(val) || 0;
                      setMilestones(prev => prev.map(item => item.id === m.id ? { ...item, amount: num } : item));
                    }}
                  />
                  <MuiDatePicker
                    label="Hạn thanh toán"
                    value={m.expectedDate}
                    onChange={(val) => {
                      setMilestones(prev => prev.map(item => item.id === m.id ? { ...item, expectedDate: val } : item));
                    }}
                  />
                  <IconButton
                    color="error"
                    disabled={milestones.length <= 1}
                    onClick={() => setMilestones(prev => prev.filter(item => item.id !== m.id))}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Button size="small" startIcon={<Plus size={16} />} onClick={handleAddMilestoneRow}>
                Thêm đợt thanh toán
              </Button>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: isMilestonesBalanced ? '#10b981' : '#f59e0b'
                }}
              >
                Tổng các đợt: {money(draftMilestonesSum)} / {money(targetDraftTotal)}
                {!isMilestonesBalanced && ` (Chênh lệch: ${money(Math.abs(draftMilestonesSum - targetDraftTotal))})`}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenContractModal(false)}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleSaveContract} sx={{ fontWeight: 700 }}>
            {editingContract ? 'Lưu thay đổi' : 'Tạo hợp đồng'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: RECEIVE MILESTONE PAYMENT */}
      <Dialog
        open={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '8px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Ghi nhận Tiền về Tài khoản
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Hợp đồng: <strong>{activeContractForReceive?.title}</strong>
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981', mt: 0.5 }}>
              +{money(activeMilestoneForReceive?.amount || 0)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Đợt thanh toán: {activeMilestoneForReceive?.name}
            </Typography>
          </Paper>

          <MuiSelect
            label="Chọn Tài khoản / Ví nhận tiền *"
            value={targetAccountId}
            onChange={(val) => setTargetAccountId(val)}
            options={accounts.map(a => ({ value: a.id, label: `${a.name} (${money(a.openingBalance)})` }))}
          />

          <MuiDatePicker
            label="Ngày tiền về thực tế *"
            value={receiveDate}
            onChange={(val) => val && setReceiveDate(val)}
          />

          <MuiTextField
            label="Ghi chú giao dịch"
            value={receiveNote}
            onChange={(e) => setReceiveNote(e.target.value)}
          />

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            * Thao tác này sẽ tự động tạo một giao dịch Thu nhập (Income) tương ứng trong Sổ giao dịch và cộng tiền vào tài khoản bạn chọn.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReceiveModalOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmReceivePayment}
            startIcon={<CheckCircle2 size={16} />}
            sx={{ fontWeight: 700 }}
          >
            Xác nhận Nhận tiền
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      {deletingContract && (
        <Confirm
          open={!!deletingContract}
          title="Xóa hợp đồng / nguồn thu"
          message={`Bạn có chắc chắn muốn xóa hợp đồng "${deletingContract.title}"? Dữ liệu các đợt chưa nhận sẽ bị hủy.`}
          onClose={() => setDeletingContract(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Box>
  );
}
