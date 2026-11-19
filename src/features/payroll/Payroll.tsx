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
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Calculator,
  Calendar,
  CheckCircle2,
  Coins,
  FileText,
  Plus,
  Receipt,
  ShieldCheck,
  History,
  Edit2,
  Trash2,
  Eye
} from 'lucide-react';
import { useFinance } from '../../store';
import { money, todayKey, uid, formatVnDate, formatVnMonth } from '../../lib/finance';
import { PageHead, Confirm } from '../../components/ui';
import { HelpButton } from '../../components/HelpButton';
import { FullscreenModal, FullscreenButton } from '../../components/ui/FullscreenModal';
import { MuiCurrencyInput, MuiTextField, MuiDatePicker, MuiMonthPicker, MuiSelect } from '../../components/mui/MuiInputs';
import { HorizontalScrollBox } from '../../components/common/HorizontalScrollBox';
import { calculatePayroll, calculateProgressivePit } from '../../lib/payrollEngine';
import type { PayrollRecord } from '../../types';

export default function Payroll() {
  const { data, update, notify } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [activeTab, setActiveTab] = useState<'records' | 'history' | 'calculator'>('records');
  const [fullscreenSlipOpen, setFullscreenSlipOpen] = useState(false);

  // Modal: Create or Edit Payroll Slip
  const [openSlipModal, setOpenSlipModal] = useState(false);
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);

  // Modal: Confirm receiving salary into account
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [recordToPay, setRecordToPay] = useState<PayrollRecord | null>(null);
  const [payDate, setPayDate] = useState(todayKey());
  const [payAccountId, setPayAccountId] = useState('bank');
  const [payNote, setPayNote] = useState('');

  // Delete slip confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PayrollRecord | null>(null);

  // Form state for creating/editing payroll
  const [form, setForm] = useState({
    month: '2026-11',
    contractSalary: 32000000,
    isProbation: false,
    probationRate: 0.85,
    baseSalaryForInsurance: 32000000,
    standardWorkDays: 22,
    actualWorkDays: 22,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    overtimeWeekdayHours: 6,
    overtimeWeekendHours: 0,
    overtimeHolidayHours: 0,
    taxableAllowances: 1500000,
    nonTaxableAllowances: 730000,
    performanceBonus: 3500000,
    salesCommission: 0,
    otherDeductions: 0,
    dependentCount: 1,
    targetAccountId: 'bank',
    actualPaidDate: todayKey(),
    isCustomNet: false,
    customNetSalary: 0,
    note: ''
  });

  const payrolls = data?.payrolls || [];
  const accounts = data?.accounts || [];

  const accountOptions = useMemo(() => {
    return accounts.map(a => ({
      value: a.id,
      label: a.name,
      subtitle: `${money(a.openingBalance || 0)} · ${a.type === 'bank' ? 'Ngân hàng' : a.type === 'ewallet' ? 'Ví điện tử' : a.type === 'cash' ? 'Tiền mặt' : 'Tài khoản'}`
    }));
  }, [accounts]);

  // Active or selected payroll record
  const currentRecord = useMemo(() => {
    return payrolls.find(p => p.month === selectedMonth) || payrolls[0] || null;
  }, [payrolls, selectedMonth]);

  // Live calculation based on form values for the calculator / slip builder
  const liveCalculated = useMemo(() => {
    return calculatePayroll({
      month: form.month,
      contractSalary: Number(form.contractSalary) || 0,
      isProbation: form.isProbation,
      probationRate: Number(form.probationRate) || 0.85,
      baseSalaryForInsurance: Number(form.baseSalaryForInsurance) || Number(form.contractSalary) || 0,
      standardWorkDays: Number(form.standardWorkDays) || 22,
      actualWorkDays: Number(form.actualWorkDays) || 22,
      paidLeaveDays: Number(form.paidLeaveDays) || 0,
      unpaidLeaveDays: Number(form.unpaidLeaveDays) || 0,
      overtimeWeekdayHours: Number(form.overtimeWeekdayHours) || 0,
      overtimeWeekendHours: Number(form.overtimeWeekendHours) || 0,
      overtimeHolidayHours: Number(form.overtimeHolidayHours) || 0,
      taxableAllowances: Number(form.taxableAllowances) || 0,
      nonTaxableAllowances: Number(form.nonTaxableAllowances) || 0,
      performanceBonus: Number(form.performanceBonus) || 0,
      salesCommission: Number(form.salesCommission) || 0,
      otherDeductions: Number(form.otherDeductions) || 0,
      dependentCount: Number(form.dependentCount) || 0,
      targetAccountId: form.targetAccountId,
      isCustomNet: form.isCustomNet,
      customNetSalary: Number(form.customNetSalary) || 0,
      note: form.note
    });
  }, [form]);

  const { bracketBreakdown } = useMemo(() => {
    return calculateProgressivePit(liveCalculated.assessableIncome);
  }, [liveCalculated.assessableIncome]);

  // Open "Nhận lương" modal
  const handleOpenPayModal = (record: PayrollRecord) => {
    setRecordToPay(record);
    setPayDate(todayKey());
    setPayAccountId(record.targetAccountId || accounts[0]?.id || 'bank');
    setPayNote(`Lương tháng ${formatVnMonth(record.month)} (Net: ${money(record.netSalary)})`);
    setPayModalOpen(true);
  };

  // Confirm and record salary into account
  const handleExecutePayment = async () => {
    if (!recordToPay) return;
    const targetAcc = accounts.find(a => a.id === payAccountId) || accounts[0];
    if (!targetAcc) {
      notify('Vui lòng chọn tài khoản nhận tiền');
      return;
    }

    await update(d => {
      // 1. Update payroll status to 'paid'
      const updatedPayrolls = (d.payrolls || []).map(p =>
        p.id === recordToPay.id
          ? {
              ...p,
              status: 'paid' as const,
              actualPaidDate: payDate,
              targetAccountId: targetAcc.id
            }
          : p
      );

      // 2. Automatically record an Income transaction with the chosen date and account
      const newTx = {
        id: uid(),
        name: payNote || `Lương tháng ${formatVnMonth(recordToPay.month)}`,
        amount: recordToPay.netSalary,
        type: 'income' as const,
        categoryId: 'salary',
        accountId: targetAcc.id,
        date: payDate,
        method: targetAcc.type === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
        note: `Phiếu lương tháng ${formatVnMonth(recordToPay.month)} (Gross: ${money(recordToPay.grossIncome)}, Thuế: ${money(recordToPay.pitWithheld)}, BH: ${money(recordToPay.totalInsuranceEmployee)})`,
        status: 'completed' as const
      };

      return {
        ...d,
        payrolls: updatedPayrolls,
        transactions: [newTx, ...d.transactions]
      };
    }, `Đã ghi nhận nhận lương ${money(recordToPay.netSalary)} vào "${targetAcc.name}" ngày ${formatVnDate(payDate)}!`);

    setPayModalOpen(false);
    setRecordToPay(null);
  };

  // Open modal for Creating new Slip
  const handleOpenCreateModal = () => {
    setEditingSlipId(null);
    setForm({
      month: selectedMonth,
      contractSalary: 30000000,
      isProbation: false,
      probationRate: 0.85,
      baseSalaryForInsurance: 30000000,
      standardWorkDays: 22,
      actualWorkDays: 22,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      overtimeWeekdayHours: 0,
      overtimeWeekendHours: 0,
      overtimeHolidayHours: 0,
      taxableAllowances: 1500000,
      nonTaxableAllowances: 730000,
      performanceBonus: 0,
      salesCommission: 0,
      otherDeductions: 0,
      dependentCount: 0,
      targetAccountId: accounts[0]?.id || 'bank',
      actualPaidDate: todayKey(),
      isCustomNet: false,
      customNetSalary: 0,
      note: ''
    });
    setOpenSlipModal(true);
  };

  // Open modal for Editing existing Slip
  const handleOpenEditModal = (record: PayrollRecord) => {
    setEditingSlipId(record.id);
    setForm({
      month: record.month,
      contractSalary: record.contractSalary,
      isProbation: Boolean(record.isProbation),
      probationRate: record.probationRate || 0.85,
      baseSalaryForInsurance: record.baseSalaryForInsurance || record.contractSalary,
      standardWorkDays: record.standardWorkDays || 22,
      actualWorkDays: record.actualWorkDays || 22,
      paidLeaveDays: record.paidLeaveDays || 0,
      unpaidLeaveDays: record.unpaidLeaveDays || 0,
      overtimeWeekdayHours: record.overtimeWeekdayHours || 0,
      overtimeWeekendHours: record.overtimeWeekendHours || 0,
      overtimeHolidayHours: record.overtimeHolidayHours || 0,
      taxableAllowances: record.taxableAllowances || 0,
      nonTaxableAllowances: record.nonTaxableAllowances || 0,
      performanceBonus: record.performanceBonus || 0,
      salesCommission: record.salesCommission || 0,
      otherDeductions: record.otherDeductions || 0,
      dependentCount: record.dependentCount || 0,
      targetAccountId: record.targetAccountId || accounts[0]?.id || 'bank',
      actualPaidDate: record.actualPaidDate || todayKey(),
      isCustomNet: Boolean(record.isCustomNet),
      customNetSalary: record.netSalary,
      note: record.note || ''
    });
    setOpenSlipModal(true);
  };

  // Save or update payroll slip
  const handleSaveSlip = async () => {
    const slipMonth = form.month.slice(0, 7);
    if (!slipMonth) {
      notify('Vui lòng chọn kỳ lương (Tháng/Năm)');
      return;
    }

    await update(d => {
      const existing = (d.payrolls || []).filter(p =>
        editingSlipId ? p.id !== editingSlipId : p.month !== slipMonth
      );

      const savedRecord: PayrollRecord = {
        ...liveCalculated,
        id: editingSlipId || uid(),
        month: slipMonth,
        status: editingSlipId ? (currentRecord?.status || 'verified') : 'verified',
        isCustomNet: form.isCustomNet,
        otherDeductions: Number(form.otherDeductions) || 0,
        note: form.note,
        targetAccountId: form.targetAccountId,
        actualPaidDate: form.actualPaidDate
      };

      const nextPayrolls = [savedRecord, ...existing].sort((a, b) => b.month.localeCompare(a.month));
      return {
        ...d,
        payrolls: nextPayrolls
      };
    }, `Đã lưu phiếu lương tháng ${formatVnMonth(slipMonth)}!`);

    setSelectedMonth(slipMonth);
    setOpenSlipModal(false);
  };

  // Delete slip
  const handleDeleteSlip = async () => {
    if (!recordToDelete) return;
    await update(d => ({
      ...d,
      payrolls: (d.payrolls || []).filter(p => p.id !== recordToDelete.id)
    }), `Đã xóa phiếu lương tháng ${formatVnMonth(recordToDelete.month)}!`);
    setDeleteConfirmOpen(false);
    setRecordToDelete(null);
  };

  // Switch to auto-calculated net for current record
  const handleResetToAutoNet = async (record: PayrollRecord) => {
    const recalculated = calculatePayroll({
      ...record,
      isCustomNet: false,
      customNetSalary: undefined
    });
    await update(d => ({
      ...d,
      payrolls: (d.payrolls || []).map(p => (p.id === record.id ? recalculated : p))
    }), `Đã chuyển sang tính lương thực nhận tự động theo quy định!`);
  };

  // Summary statistics for history
  const historyStats = useMemo(() => {
    const paidList = payrolls.filter(p => p.status === 'paid');
    const totalPaid = paidList.reduce((sum, p) => sum + p.netSalary, 0);
    const avgNet = paidList.length > 0 ? Math.round(totalPaid / paidList.length) : 0;
    return {
      totalSlips: payrolls.length,
      paidCount: paidList.length,
      totalPaid,
      avgNet
    };
  }, [payrolls]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHead
        title="Quản lý Lương & Thuế Động"
        subtitle="Bảng lương linh hoạt chuẩn Bộ luật Lao động 2019, hỗ trợ lương Gross/Net, nhập tay thực nhận và lưu trữ lịch sử nhận lương"
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <HelpButton pageKey="payroll" />
            <FullscreenButton onClick={() => setFullscreenSlipOpen(true)} title="Xem toàn màn hình phiếu lương" />
            <Button
              variant={activeTab === 'records' ? 'contained' : 'outlined'}
              startIcon={<FileText size={16} />}
              onClick={() => setActiveTab('records')}
              size="small"
              sx={{ minHeight: 32, fontSize: { xs: 12, sm: 13 }, px: { xs: 1, sm: 1.5 } }}
            >
              Phiếu lương
            </Button>
            <Button
              variant={activeTab === 'history' ? 'contained' : 'outlined'}
              startIcon={<History size={16} />}
              onClick={() => setActiveTab('history')}
              size="small"
              sx={{ minHeight: 32, fontSize: { xs: 12, sm: 13 }, px: { xs: 1, sm: 1.5 } }}
            >
              Lịch sử nhận lương
            </Button>
            <Button
              variant={activeTab === 'calculator' ? 'contained' : 'outlined'}
              startIcon={<Calculator size={16} />}
              onClick={() => setActiveTab('calculator')}
              size="small"
              sx={{ minHeight: 32, fontSize: { xs: 12, sm: 13 }, px: { xs: 1, sm: 1.5 } }}
            >
              Gross ⇄ Net
            </Button>
            <Button
              id="tour-payroll-inputs"
              variant="contained"
              color="primary"
              startIcon={<Plus size={16} />}
              onClick={handleOpenCreateModal}
              size="small"
              sx={{ minHeight: 32, fontSize: { xs: 12, sm: 13 }, px: { xs: 1.25, sm: 1.5 }, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
            >
              Lập phiếu mới
            </Button>
          </Box>
        }
      />

      {/* ===================== TAB 1: PHIẾU LƯƠNG THÁNG HIỆN TẠI ===================== */}
      {activeTab === 'records' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Month Selector Bar with MUI MonthPicker */}
          <Paper
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
              minWidth: 0,
              flexWrap: { xs: 'wrap', sm: 'nowrap' }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Calendar size={16} /> Chọn kỳ lương:
            </Typography>

            <HorizontalScrollBox gap="8px" buttonSize={24} scrollStep={180} sx={{ flex: 1, minWidth: 0 }}>
              {payrolls.map(p => (
                <Chip
                  key={p.id}
                  label={`Tháng ${formatVnMonth(p.month)} (${p.status === 'paid' ? 'Đã nhận' : 'Chờ nhận'})`}
                  clickable
                  color={selectedMonth === p.month ? 'primary' : 'default'}
                  variant={selectedMonth === p.month ? 'filled' : 'outlined'}
                  onClick={() => setSelectedMonth(p.month)}
                  icon={p.status === 'paid' ? <CheckCircle2 size={14} /> : undefined}
                  sx={{ flexShrink: 0, fontWeight: selectedMonth === p.month ? 700 : 500 }}
                />
              ))}
            </HorizontalScrollBox>

            <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 170 }, mt: { xs: 1, sm: 0 } }}>
              <MuiMonthPicker
                label="Chọn tháng"
                value={selectedMonth}
                onChange={val => {
                  if (val) setSelectedMonth(val);
                }}
              />
            </Box>
          </Paper>

          {currentRecord ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
              {/* Summary KPI: Lương Thực Nhận (Net) */}
              <Card id="tour-payroll-net" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', fontWeight: 700, display: 'block' }}>
                      Lương Thực Nhận (Net Take-Home)
                    </Typography>
                    {currentRecord.isCustomNet && (
                      <Chip
                        size="small"
                        label="Nhập tay"
                        color="secondary"
                        variant="outlined"
                        sx={{ mt: 0.5, height: 20, fontSize: 10, fontWeight: 700 }}
                      />
                    )}
                  </Box>
                  <Chip
                    size="small"
                    label={currentRecord.status === 'paid' ? 'ĐÃ NHẬN TIỀN' : 'CHỜ THANH TOÁN'}
                    color={currentRecord.status === 'paid' ? 'success' : 'warning'}
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>

                <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', my: 1, fontSize: { xs: '1.65rem', sm: '2.2rem', md: '2.8rem' }, lineHeight: 1.2 }}>
                  {money(currentRecord.netSalary)}
                </Typography>

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Tổng Gross: <strong>{money(currentRecord.grossIncome)}</strong> · Trích nộp:{' '}
                  <strong style={{ color: '#ef4444' }}>
                    -{money(currentRecord.totalInsuranceEmployee + currentRecord.pitWithheld + (currentRecord.otherDeductions || 0))}
                  </strong>
                </Typography>

                {currentRecord.isCustomNet && (
                  <Button
                    size="small"
                    variant="text"
                    color="primary"
                    onClick={() => handleResetToAutoNet(currentRecord)}
                    sx={{ alignSelf: 'flex-start', textTransform: 'none', fontSize: 12, p: 0 }}
                  >
                    ↺ Tính lại tự động theo Gross
                  </Button>
                )}

                <Box id="tour-payroll-sync-btn" sx={{ mt: 'auto', pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {currentRecord.status !== 'paid' ? (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<Coins size={18} />}
                      onClick={() => handleOpenPayModal(currentRecord)}
                      sx={{ py: 1.2, fontWeight: 700 }}
                    >
                      Xác nhận & Nhận vào Tài khoản
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', fontWeight: 600, fontSize: '0.85rem' }}>
                      <CheckCircle2 size={16} /> Đã nhận lương ngày {formatVnDate(currentRecord.actualPaidDate)}
                      {currentRecord.targetAccountId && (
                        <span>({accounts.find(a => a.id === currentRecord.targetAccountId)?.name || 'Tài khoản'})</span>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<Edit2 size={14} />}
                      onClick={() => handleOpenEditModal(currentRecord)}
                    >
                      Chỉnh sửa
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setRecordToDelete(currentRecord);
                        setDeleteConfirmOpen(true);
                      }}
                      sx={{ border: '1px solid', borderColor: 'error.light', borderRadius: 1 }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </Box>
              </Card>

              {/* Deductions & Statutory Breakdown */}
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShieldCheck size={20} color="#10b981" />
                  Cơ cấu Trích nộp Bảo hiểm & Biểu thuế TNCN 7 bậc
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Bảo hiểm NLĐ đóng (10.5%)
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ef4444' }}>
                        -{money(currentRecord.totalInsuranceEmployee)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• BHXH (8%):</span>
                        <span>{money(currentRecord.socialInsuranceEmployee)}</span>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• BHYT (1.5%):</span>
                        <span>{money(currentRecord.healthInsuranceEmployee)}</span>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• BHTN (1%):</span>
                        <span>{money(currentRecord.unemploymentInsuranceEmployee)}</span>
                      </Box>
                    </Box>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Thuế TNCN khấu trừ (PIT)
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ef4444' }}>
                        -{money(currentRecord.pitWithheld)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• Giảm trừ bản thân:</span>
                        <span>11,000,000 ₫</span>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• Giảm trừ người phụ thuộc:</span>
                        <span>{money(currentRecord.dependentDeductionTotal)} ({currentRecord.dependentCount} người)</span>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• Thu nhập tính thuế:</span>
                        <span>{money(currentRecord.assessableIncome)}</span>
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                {/* Progressive Brackets Visual Indicator */}
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Phân bổ bậc thuế thu nhập hiện tại
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    {bracketBreakdown.length > 0 ? (
                      bracketBreakdown.map(b => (
                        <Chip
                          key={b.bracket}
                          size="small"
                          variant="outlined"
                          label={`Bậc ${b.bracket} (${b.rate * 100}%): ${money(b.tax)}`}
                          sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        Không phát sinh thuế TNCN (Thu nhập tính thuế ≤ 0đ sau khi giảm trừ).
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Card>

              {/* Detailed Breakdown Card */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Receipt size={20} /> Chi tiết Bảng Lương Tháng {formatVnMonth(currentRecord.month)}
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' }, gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Lương Hợp đồng</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{money(currentRecord.contractSalary)}</Typography>
                      {currentRecord.isProbation && (
                        <Chip size="small" label={`Thử việc ${(currentRecord.probationRate * 100).toFixed(0)}%`} color="warning" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Ngày công (Thực / Chuẩn)</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {currentRecord.actualWorkDays} / {currentRecord.standardWorkDays} ngày
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Làm thêm giờ (OT)</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        +{money(currentRecord.overtimePayTotal)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'success.main', display: 'block' }}>
                        Miễn thuế: {money(currentRecord.overtimeTaxExemptPay)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Phụ cấp & Thưởng</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        +{money(currentRecord.taxableAllowances + currentRecord.nonTaxableAllowances + currentRecord.performanceBonus)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Khấu trừ khác / Phạt</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentRecord.otherDeductions ? '#ef4444' : 'text.primary' }}>
                        {currentRecord.otherDeductions ? `-${money(currentRecord.otherDeductions)}` : '0 ₫'}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Box>
            </Box>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1">Chưa có bản ghi lương nào. Nhấn "Lập phiếu mới" để bắt đầu.</Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* ===================== TAB 2: LỊCH SỬ NHẬN LƯƠNG ===================== */}
      {activeTab === 'history' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Summary KPIs */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>TỔNG LƯƠNG ĐÃ NHẬN</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                {money(historyStats.totalPaid)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Từ {historyStats.paidCount} kỳ lương đã thanh toán
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>TRUNG BÌNH THỰC NHẬN / THÁNG</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                {money(historyStats.avgNet)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Lương thực tế chuyển vào tài khoản
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>TỔNG SỐ KỲ LƯƠNG ĐÃ LƯU</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                {historyStats.totalSlips} kỳ
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Bao gồm cả các kỳ chờ nhận
              </Typography>
            </Paper>
          </Box>

          {/* History Records Table */}
          <Card sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <History size={18} /> Danh sách Lịch sử Nhận Lương các Kỳ
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={handleOpenCreateModal}
              >
                Lập phiếu mới
              </Button>
            </Box>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>KỲ LƯƠNG</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>NGÀY NHẬN TIỀN</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>LƯƠNG GROSS</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>TRÍCH TRỪ (BH & THUẾ)</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>THỰC NHẬN (NET)</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>TÀI KHOẢN NHẬN</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>TRẠNG THÁI</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>THAO TÁC</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payrolls.length > 0 ? (
                  payrolls.map(p => {
                    const targetAcc = accounts.find(a => a.id === p.targetAccountId);
                    const totalDeductions = p.totalInsuranceEmployee + p.pitWithheld + (p.otherDeductions || 0);

                    return (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Tháng {formatVnMonth(p.month)}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                          {p.actualPaidDate ? formatVnDate(p.actualPaidDate) : '—'}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13 }}>
                          {money(p.grossIncome)}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, color: '#ef4444' }}>
                          -{money(totalDeductions)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'primary.main', fontSize: 14 }}>
                          {money(p.netSalary)}
                          {p.isCustomNet && (
                            <Chip size="small" label="Nhập tay" color="secondary" variant="outlined" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13 }}>
                          {targetAcc?.name || 'Ngân hàng'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={p.status === 'paid' ? 'Đã nhận' : 'Chờ nhận'}
                            color={p.status === 'paid' ? 'success' : 'warning'}
                            variant="filled"
                            sx={{ fontWeight: 700, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}>
                            {p.status !== 'paid' && (
                              <Tooltip title="Xác nhận nhận tiền vào tài khoản">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleOpenPayModal(p)}
                                >
                                  <Coins size={16} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Xem phiếu lương tháng này">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedMonth(p.month);
                                  setActiveTab('records');
                                }}
                              >
                                <Eye size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa phiếu">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditModal(p)}
                              >
                                <Edit2 size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setRecordToDelete(p);
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Chưa có lịch sử nhận lương nào. Hãy lập phiếu lương mới hoặc nhập nhanh qua Chat.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </Box>
      )}

      {/* ===================== TAB 3: GROSS ⇄ NET CALCULATOR ===================== */}
      {activeTab === 'calculator' && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calculator size={20} /> Công cụ Tính Lương & Thuế Động (Gross ⇄ Net)
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Mô phỏng lương tháng, OT, phụ cấp, người phụ thuộc và xem ngay tiền thực nhận cùng biểu thuế chi tiết
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Input Controls */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <MuiCurrencyInput
                label="Lương Gross Hợp đồng (₫)"
                value={form.contractSalary}
                onChange={v => setForm({ ...form, contractSalary: Number(v) || 0 })}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <MuiTextField
                  label="Ngày công chuẩn"
                  type="number"
                  value={form.standardWorkDays}
                  onChange={e => setForm({ ...form, standardWorkDays: Number(e.target.value) })}
                  fullWidth
                />
                <MuiTextField
                  label="Ngày công thực tế"
                  type="number"
                  value={form.actualWorkDays}
                  onChange={e => setForm({ ...form, actualWorkDays: Number(e.target.value) })}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <MuiTextField
                  label="Giờ OT Ngày thường (150%)"
                  type="number"
                  value={form.overtimeWeekdayHours}
                  onChange={e => setForm({ ...form, overtimeWeekdayHours: Number(e.target.value) })}
                  fullWidth
                />
                <MuiTextField
                  label="Giờ OT Cuối tuần (200%)"
                  type="number"
                  value={form.overtimeWeekendHours}
                  onChange={e => setForm({ ...form, overtimeWeekendHours: Number(e.target.value) })}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <MuiCurrencyInput
                  label="Thưởng KPI / Doanh số"
                  value={form.performanceBonus}
                  onChange={v => setForm({ ...form, performanceBonus: Number(v) || 0 })}
                />
                <MuiTextField
                  label="Số người phụ thuộc (MST)"
                  type="number"
                  value={form.dependentCount}
                  onChange={e => setForm({ ...form, dependentCount: Number(e.target.value) })}
                  fullWidth
                />
              </Box>

              {/* Toggle manual Net override in calculator */}
              <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isCustomNet}
                      onChange={e => setForm({ ...form, isCustomNet: e.target.checked })}
                    />
                  }
                  label="Cho phép nhập tay Lương Thực Nhận (Net)"
                />
                {form.isCustomNet && (
                  <Box sx={{ mt: 1.5 }}>
                    <MuiCurrencyInput
                      label="Lương Thực Nhận Nhập Tay (₫)"
                      value={form.customNetSalary || liveCalculated.netSalary}
                      onChange={v => setForm({ ...form, customNetSalary: Number(v) || 0 })}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            {/* Live Result View */}
            <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Kết Quả Tính Toán
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">1. Tổng Gross thu nhập:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{money(liveCalculated.grossIncome)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ef4444' }}>
                <Typography variant="body2">• Trừ bảo hiểm (10.5%):</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>-{money(liveCalculated.totalInsuranceEmployee)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ef4444' }}>
                <Typography variant="body2">• Trừ thuế TNCN (7 bậc):</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>-{money(liveCalculated.pitWithheld)}</Typography>
              </Box>

              <Box sx={{ pt: 2, borderTop: '2px dashed', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Lương Thực Nhận (NET):</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {money(liveCalculated.netSalary)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveSlip}
                sx={{ mt: 2 }}
              >
                Lưu vào Phiếu Lương Tháng {formatVnMonth(form.month)}
              </Button>

              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                * Mức lương đóng bảo hiểm được tự động áp trần 46.800.000 ₫ (BHXH & BHYT) và 99.200.000 ₫ (BHTN) theo quy định hiện hành.
              </Typography>
            </Paper>
          </Box>
        </Card>
      )}

      {/* ===================== MODAL: LẬP / CHỈNH SỬA PHIẾU LƯƠNG ===================== */}
      <Dialog open={openSlipModal} onClose={() => setOpenSlipModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingSlipId ? `Chỉnh Sửa Phiếu Lương Tháng ${formatVnMonth(form.month)}` : 'Lập Phiếu Lương Mới'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <MuiMonthPicker
              label="Kỳ lương (Tháng/Năm)"
              value={form.month}
              onChange={val => val && setForm({ ...form, month: val })}
              fullWidth
            />
            <MuiSelect
              label="Tài khoản nhận tiền"
              value={form.targetAccountId}
              onChange={val => setForm({ ...form, targetAccountId: val })}
              options={accountOptions}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <MuiCurrencyInput
              label="Lương Hợp đồng Gross (₫)"
              value={form.contractSalary}
              onChange={v => setForm({ ...form, contractSalary: Number(v) || 0 })}
            />
            <MuiDatePicker
              label="Ngày nhận lương"
              value={form.actualPaidDate}
              onChange={val => setForm({ ...form, actualPaidDate: val })}
            />
          </Box>

          {/* Toggle manual Net input */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: form.isCustomNet ? 'primary.50' : 'background.paper', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Lương Thực Nhận (Net Take-Home)
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {form.isCustomNet
                    ? 'Đang bật chế độ nhập tay số tiền thực tế nhận được'
                    : 'Đang tự động tính từ Gross trừ Bảo hiểm (10.5%) và Thuế TNCN'}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isCustomNet}
                    onChange={e => {
                      const checked = e.target.checked;
                      setForm({
                        ...form,
                        isCustomNet: checked,
                        customNetSalary: checked ? (form.customNetSalary || liveCalculated.netSalary) : 0
                      });
                    }}
                  />
                }
                label="Nhập tay"
              />
            </Box>

            {form.isCustomNet && (
              <Box sx={{ mt: 2 }}>
                <MuiCurrencyInput
                  label="Số tiền Lương Thực Nhận Nhập Tay (₫)"
                  value={form.customNetSalary || liveCalculated.netSalary}
                  onChange={v => setForm({ ...form, customNetSalary: Number(v) || 0 })}
                />
              </Box>
            )}
          </Paper>

          {/* Additional details: allowances, bonus, deductions */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
            Các khoản Phụ cấp, Thưởng & Khấu trừ
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <MuiCurrencyInput
              label="Phụ cấp chịu thuế (Ăn uống vượt trần, điện thoại...)"
              value={form.taxableAllowances}
              onChange={v => setForm({ ...form, taxableAllowances: Number(v) || 0 })}
            />
            <MuiCurrencyInput
              label="Phụ cấp miễn thuế (Ăn trưa ≤730k, trang phục...)"
              value={form.nonTaxableAllowances}
              onChange={v => setForm({ ...form, nonTaxableAllowances: Number(v) || 0 })}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <MuiCurrencyInput
              label="Thưởng KPI / Hoa hồng (₫)"
              value={form.performanceBonus}
              onChange={v => setForm({ ...form, performanceBonus: Number(v) || 0 })}
            />
            <MuiCurrencyInput
              label="Khấu trừ khác (Tạm ứng, phạt, quỹ...) (₫)"
              value={form.otherDeductions}
              onChange={v => setForm({ ...form, otherDeductions: Number(v) || 0 })}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <MuiTextField
              label="Số người phụ thuộc (giảm trừ 4.4tr/người)"
              type="number"
              value={form.dependentCount}
              onChange={e => setForm({ ...form, dependentCount: Number(e.target.value) })}
              fullWidth
            />
            <MuiTextField
              label="Ghi chú phiếu lương"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              fullWidth
            />
          </Box>

          {/* Preview banner */}
          <Alert severity="info" icon={<Receipt size={18} />}>
            Tổng Gross: <strong>{money(liveCalculated.grossIncome)}</strong> · Bảo hiểm:{' '}
            <strong>-{money(liveCalculated.totalInsuranceEmployee)}</strong> · Thuế:{' '}
            <strong>-{money(liveCalculated.pitWithheld)}</strong> · <strong>Thực nhận Net: {money(liveCalculated.netSalary)}</strong>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenSlipModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveSlip}>
            {editingSlipId ? 'Lưu Thay Đổi' : 'Tạo Phiếu Lương'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== MODAL: XÁC NHẬN NHẬN TIỀN VÀO TÀI KHOẢN ===================== */}
      <Dialog open={payModalOpen} onClose={() => setPayModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Coins size={20} color="#10b981" /> Xác Nhận Nhận Lương Vào Tài Khoản
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {recordToPay && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>KỲ LƯƠNG</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Tháng {formatVnMonth(recordToPay.month)}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>SỐ TIỀN THỰC NHẬN (NET)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                {money(recordToPay.netSalary)}
              </Typography>
            </Paper>
          )}

          <MuiDatePicker
            label="Ngày nhận tiền"
            value={payDate}
            onChange={val => val && setPayDate(val)}
          />

          <MuiSelect
            label="Tài khoản nhận tiền"
            value={payAccountId}
            onChange={val => setPayAccountId(val)}
            options={accountOptions}
          />

          <MuiTextField
            label="Ghi chú giao dịch"
            value={payNote}
            onChange={e => setPayNote(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPayModalOpen(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleExecutePayment}>
            Xác Nhận & Ghi Vào Sổ
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== CONFIRM: XÓA PHIẾU LƯƠNG ===================== */}
      <Confirm
        open={deleteConfirmOpen}
        title="Xóa Phiếu Lương"
        message={`Bạn có chắc chắn muốn xóa phiếu lương tháng ${recordToDelete ? formatVnMonth(recordToDelete.month) : ''}? Thao tác này không thể hoàn tác.`}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteSlip}
      />

      {/* ===================== FULLSCREEN MODAL VIEWER ===================== */}
      <FullscreenModal
        open={fullscreenSlipOpen}
        onClose={() => setFullscreenSlipOpen(false)}
        title={currentRecord ? `Phiếu Lương Tháng ${formatVnMonth(currentRecord.month)} (Chi Tiết)` : 'Bảng Lương'}
        subtitle="Chi tiết các khoản thu nhập gross, trích nộp bảo hiểm bắt buộc và biểu thuế TNCN 7 bậc"
      >
        {currentRecord && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'background.paper', borderRadius: '8px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Lương Thực Nhận (NET Take-Home)</Typography>
                  {currentRecord.isCustomNet && (
                    <Chip size="small" label="Nhập tay" color="secondary" variant="outlined" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
                  )}
                </Box>
                <Chip
                  size="small"
                  label={currentRecord.status === 'paid' ? 'ĐÃ NHẬN TIỀN' : 'CHỜ THANH TOÁN'}
                  color={currentRecord.status === 'paid' ? 'success' : 'warning'}
                />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>
                {money(currentRecord.netSalary)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Tổng Gross: <strong>{money(currentRecord.grossIncome)}</strong> · Tổng trích trừ:{' '}
                <strong style={{ color: '#ef4444' }}>
                  -{money(currentRecord.totalInsuranceEmployee + currentRecord.pitWithheld + (currentRecord.otherDeductions || 0))}
                </strong>
                {currentRecord.actualPaidDate && (
                  <span> · Ngày nhận: <strong>{formatVnDate(currentRecord.actualPaidDate)}</strong></span>
                )}
              </Typography>
            </Paper>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Bảo Hiểm Bắt Buộc (10.5%)</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• BHXH (8%):</span><strong>{money(currentRecord.socialInsuranceEmployee)}</strong>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• BHYT (1.5%):</span><strong>{money(currentRecord.healthInsuranceEmployee)}</strong>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• BHTN (1%):</span><strong>{money(currentRecord.unemploymentInsuranceEmployee)}</strong>
                  </Box>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Thuế Thu Nhập Cá Nhân (PIT)</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• Giảm trừ bản thân:</span><strong>11.000.000 ₫</strong>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• Giảm trừ người phụ thuộc:</span><strong>{money(currentRecord.dependentDeductionTotal)}</strong>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• Thuế TNCN khấu trừ:</span><strong style={{ color: '#ef4444' }}>-{money(currentRecord.pitWithheld)}</strong>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}
      </FullscreenModal>
    </Box>
  );
}
