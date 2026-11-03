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
  Typography
} from '@mui/material';
import {
  Calculator,
  Calendar,
  CheckCircle2,
  Coins,
  FileText,
  Plus,
  Receipt,
  ShieldCheck
} from 'lucide-react';
import { useFinance } from '../../store';
import { money, todayKey, uid } from '../../lib/finance';
import { PageHead } from '../../components/ui';
import { MuiCurrencyInput, MuiTextField } from '../../components/mui/MuiInputs';
import {
  calculatePayroll,
  calculateProgressivePit
} from '../../lib/payrollEngine';
import type { PayrollRecord } from '../../types';

export default function Payroll() {
  const { data, update } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [activeTab, setActiveTab] = useState<'records' | 'calculator'>('records');
  const [openNewSlipModal, setOpenNewSlipModal] = useState(false);

  // Form state for creating/editing payroll
  const [form, setForm] = useState({
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
    dependentCount: 1,
    targetAccountId: 'bank'
  });

  const payrolls = data?.payrolls || [];

  // Active or selected payroll record
  const currentRecord = useMemo(() => {
    return payrolls.find(p => p.month === selectedMonth) || payrolls[0] || null;
  }, [payrolls, selectedMonth]);

  // Live calculation based on form values for the calculator / slip builder
  const liveCalculated = useMemo(() => {
    return calculatePayroll({
      month: selectedMonth,
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
      dependentCount: Number(form.dependentCount) || 0,
      targetAccountId: form.targetAccountId
    });
  }, [form, selectedMonth]);

  const { bracketBreakdown } = useMemo(() => {
    return calculateProgressivePit(liveCalculated.assessableIncome);
  }, [liveCalculated.assessableIncome]);

  //  "Nhận lương vào tài khoản"
  const handleConfirmAndPay = async (record: PayrollRecord) => {
    const targetAcc = data?.accounts.find(a => a.id === (record.targetAccountId || 'bank')) || data?.accounts[0];
    if (!targetAcc) return;

    await update(d => {
      // 1. Update payroll status to 'paid'
      const updatedPayrolls = (d.payrolls || []).map(p =>
        p.id === record.id ? { ...p, status: 'paid' as const, actualPaidDate: todayKey() } : p
      );

      // 2. Automatically record an Income transaction
      const newTx = {
        id: uid(),
        name: `Lương tháng ${record.month}`,
        amount: record.netSalary,
        type: 'income' as const,
        categoryId: 'salary',
        accountId: targetAcc.id,
        date: todayKey(),
        method: 'Chuyển khoản',
        note: `Đã đối soát phiếu lương (Gross: ${money(record.grossIncome)}, Thuế: ${money(record.pitWithheld)}, BH: ${money(record.totalInsuranceEmployee)})`,
        status: 'completed' as const
      };

      return {
        ...d,
        payrolls: updatedPayrolls,
        transactions: [newTx, ...d.transactions]
      };
    }, `Đã ghi nhận nhận lương ${money(record.netSalary)} vào "${targetAcc.name}"!`);
  };

  const handleSavePayroll = async () => {
    await update(d => {
      const existing = (d.payrolls || []).filter(p => p.month !== selectedMonth);
      const newSlip: PayrollRecord = {
        ...liveCalculated,
        id: uid(),
        status: 'verified'
      };
      return {
        ...d,
        payrolls: [newSlip, ...existing]
      };
    }, `Đã lưu phiếu lương tháng ${selectedMonth}!`);
    setOpenNewSlipModal(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHead
        title="Quản lý Lương & Thuế Động"
        subtitle="Bảng lương linh hoạt chuẩn Bộ luật Lao động 2019, tự động tính bảo hiểm 10.5% có trần và thuế TNCN 7 bậc lũy tiến"
        actions={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant={activeTab === 'records' ? 'contained' : 'outlined'}
              startIcon={<FileText size={18} />}
              onClick={() => setActiveTab('records')}
              size="small"
            >
              Phiếu lương tháng
            </Button>
            <Button
              variant={activeTab === 'calculator' ? 'contained' : 'outlined'}
              startIcon={<Calculator size={18} />}
              onClick={() => setActiveTab('calculator')}
              size="small"
            >
              Tính nhanh Gross ⇄ Net
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={() => setOpenNewSlipModal(true)}
              size="small"
            >
              Lập phiếu lương mới
            </Button>
          </Box>
        }
      />

      {activeTab === 'records' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Month Selector Pills */}
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={16} /> Chọn kỳ lương:
            </Typography>
            {payrolls.map(p => (
              <Chip
                key={p.id}
                label={`Tháng ${p.month} (${p.status === 'paid' ? 'Đã nhận' : p.status === 'verified' ? 'Đã duyệt' : 'Bản nháp'})`}
                clickable
                color={selectedMonth === p.month ? 'primary' : 'default'}
                variant={selectedMonth === p.month ? 'filled' : 'outlined'}
                onClick={() => setSelectedMonth(p.month)}
                icon={p.status === 'paid' ? <CheckCircle2 size={14} /> : undefined}
              />
            ))}
          </Paper>

          {currentRecord ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
              {/* Summary KPIs */}
              <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', fontWeight: 700 }}>
                    Lương Thực Nhận (Net Take-Home)
                  </Typography>
                  <Chip
                    size="small"
                    label={currentRecord.status === 'paid' ? 'ĐÃ NHẬN TIỀN' : 'CHỜ THANH TOÁN'}
                    color={currentRecord.status === 'paid' ? 'success' : 'warning'}
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>

                <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', my: 1 }}>
                  {money(currentRecord.netSalary)}
                </Typography>

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Tổng Gross: <strong>{money(currentRecord.grossIncome)}</strong> · Thuế & Bảo hiểm trích trừ:{' '}
                  <strong style={{ color: '#ef4444' }}>
                    -{money(currentRecord.totalInsuranceEmployee + currentRecord.pitWithheld)}
                  </strong>
                </Typography>

                <Box sx={{ mt: 'auto', pt: 2 }}>
                  {currentRecord.status !== 'paid' ? (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<Coins size={18} />}
                      onClick={() => handleConfirmAndPay(currentRecord)}
                      sx={{ py: 1.2, fontWeight: 700 }}
                    >
                      Xác nhận & Nhận vào Tài khoản
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', fontWeight: 600, fontSize: '0.85rem' }}>
                      <CheckCircle2 size={16} /> Đã nhận lương ngày {currentRecord.actualPaidDate || 'gần đây'}
                    </Box>
                  )}
                </Box>
              </Card>

              {/* Deductions & Statutory breakdown */}
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
                    <Receipt size={20} /> Chi tiết Bảng Lương Tháng {currentRecord.month}
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Lương Hợp đồng</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{money(currentRecord.contractSalary)}</Typography>
                      {currentRecord.isProbation && (
                        <Chip size="small" label={`Thử việc ${(currentRecord.probationRate * 100).toFixed(0)}%`} color="warning" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Ngày công (Thực tế / Chuẩn)</Typography>
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
                  </Box>
                </Card>
              </Box>
            </Box>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1">Chưa có bản ghi lương nào. Nhấn "Lập phiếu lương mới" để bắt đầu.</Typography>
            </Paper>
          )}
        </Box>
      )}

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

              <Box sx={{ display: 'flex', gap: 2 }}>
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

              <Box sx={{ display: 'flex', gap: 2 }}>
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

              <Box sx={{ display: 'flex', gap: 2 }}>
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

              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                * Mức lương đóng bảo hiểm được tự động áp trần 46.800.000 ₫ (BHXH & BHYT) và 99.200.000 ₫ (BHTN) theo quy định hiện hành.
              </Typography>
            </Paper>
          </Box>
        </Card>
      )}

      {/* Dialog for creating a new month slip */}
      <Dialog open={openNewSlipModal} onClose={() => setOpenNewSlipModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Lập Phiếu Lương Tháng Mới</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <MuiTextField
            label="Kỳ lương (YYYY-MM)"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            fullWidth
          />
          <MuiCurrencyInput
            label="Mức lương hợp đồng (₫)"
            value={form.contractSalary}
            onChange={v => setForm({ ...form, contractSalary: Number(v) || 0 })}
          />
          <MuiCurrencyInput
            label="Tiền thưởng / Hoa hồng (₫)"
            value={form.performanceBonus}
            onChange={v => setForm({ ...form, performanceBonus: Number(v) || 0 })}
          />
          <MuiTextField
            label="Số người phụ thuộc"
            type="number"
            value={form.dependentCount}
            onChange={e => setForm({ ...form, dependentCount: Number(e.target.value) })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenNewSlipModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSavePayroll}>Lưu Phiếu Lương</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
