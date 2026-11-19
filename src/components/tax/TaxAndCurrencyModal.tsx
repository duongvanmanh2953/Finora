import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Receipt, Coins, Calculator, TrendingUp } from 'lucide-react';
import {
  calculateMonthlySalaryPit,
  calculateFreelanceWithholding
} from '../../lib/taxEngine';
import {
  SupportedCurrency,
  DEFAULT_EXCHANGE_RATES,
  convertCurrency,
  formatCurrencyAmount,
  CURRENCY_METADATA
} from '../../lib/currencyEngine';
import { money } from '../../lib/finance';
import { FINORA_TOKENS } from '../../theme/designTokens';

interface TaxAndCurrencyModalProps {
  open: boolean;
  onClose: () => void;
}

export const TaxAndCurrencyModal: React.FC<TaxAndCurrencyModalProps> = ({ open, onClose }) => {
  const primaryColor = FINORA_TOKENS.brand.primary;
  const [tabIndex, setTabIndex] = useState(0);

  // Tax States
  const [grossSalary, setGrossSalary] = useState(25000000);
  const [dependents, setDependents] = useState(0);
  const [insurance, setInsurance] = useState(2625000); // 10.5% standard
  const [freelanceAmount, setFreelanceAmount] = useState(5000000);

  // Currency States
  const [convertAmount, setConvertAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState<SupportedCurrency>('USD');
  const [toCurrency, setToCurrency] = useState<SupportedCurrency>('VND');

  const monthlyPit = calculateMonthlySalaryPit(grossSalary, {
    dependentCount: dependents,
    monthlyInsurance: insurance
  });

  const freelancePit = calculateFreelanceWithholding(freelanceAmount);

  const convertedResult = convertCurrency(convertAmount, fromCurrency, toCurrency);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '12px', maxWidth: { xs: '100%', sm: 580 } } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: 'rgba(53, 94, 82, 0.1)',
              color: primaryColor,
              display: 'flex'
            }}
          >
            {tabIndex === 0 ? <Receipt size={22} /> : <Coins size={22} />}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Công Cụ Tài Chính Nâng Cao
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Thuế TNCN Việt Nam (PIT) & Quy Đổi Đa Tiền Tệ
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
          <Tab
            icon={<Receipt size={16} />}
            iconPosition="start"
            label="Thuế TNCN (PIT Tracker)"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            icon={<Coins size={16} />}
            iconPosition="start"
            label="Quy Đổi Đa Tiền Tệ"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ py: 2.5 }}>
        {tabIndex === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Salary PIT Calculator */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calculator size={18} color={primaryColor} />
                Tính Thuế TNCN Hàng Tháng (Hợp đồng lao động)
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                <TextField
                  label="Lương Gross (₫)"
                  type="number"
                  size="small"
                  value={grossSalary}
                  onChange={e => setGrossSalary(Number(e.target.value) || 0)}
                  fullWidth
                />
                <TextField
                  label="Người phụ thuộc (4.4M/người)"
                  type="number"
                  size="small"
                  value={dependents}
                  onChange={e => setDependents(Math.max(0, Number(e.target.value) || 0))}
                  fullWidth
                />
                <TextField
                  label="Bảo hiểm SHUI (10.5%)"
                  type="number"
                  size="small"
                  value={insurance}
                  onChange={e => setInsurance(Number(e.target.value) || 0)}
                  fullWidth
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                  gap: 1.5,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 2
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tổng giảm trừ gia cảnh
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {money(monthlyPit.totalDeduction)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Thu nhập tính thuế
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {money(monthlyPit.taxableIncome)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Thuế TNCN tạm nộp/tháng
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: 'error.main' }}>
                    {money(monthlyPit.taxDue)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Freelance Withholding */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp size={18} color="#f59e0b" />
                Khấu Trừ Thuế Vãng Lai / Freelance (10%)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  label="Số tiền nhận thù lao (₫)"
                  type="number"
                  size="small"
                  value={freelanceAmount}
                  onChange={e => setFreelanceAmount(Number(e.target.value) || 0)}
                  sx={{ width: 220 }}
                />
                <Box>
                  <Typography variant="body2">
                    Thuế khấu trừ (10%):{' '}
                    <strong style={{ color: '#ef4444' }}>{money(freelancePit.withheldTax)}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Thực nhận: <strong>{money(freelancePit.netPayout)}</strong>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {tabIndex === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                Quy Đổi Nhanh Theo Tỷ Giá Tham Chiếu
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
                <TextField
                  label="Số tiền"
                  type="number"
                  size="small"
                  value={convertAmount}
                  onChange={e => setConvertAmount(Number(e.target.value) || 0)}
                  sx={{ width: 140 }}
                />

                <TextField
                  select
                  slotProps={{ select: { native: true } }}
                  label="Từ tiền tệ"
                  size="small"
                  value={fromCurrency}
                  onChange={e => setFromCurrency(e.target.value as SupportedCurrency)}
                  sx={{ width: 140 }}
                >
                  {Object.keys(CURRENCY_METADATA).map(cur => (
                    <option key={cur} value={cur}>
                      {CURRENCY_METADATA[cur as SupportedCurrency].flag} {cur}
                    </option>
                  ))}
                </TextField>

                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  =
                </Typography>

                <TextField
                  select
                  slotProps={{ select: { native: true } }}
                  label="Sang tiền tệ"
                  size="small"
                  value={toCurrency}
                  onChange={e => setToCurrency(e.target.value as SupportedCurrency)}
                  sx={{ width: 140 }}
                >
                  {Object.keys(CURRENCY_METADATA).map(cur => (
                    <option key={cur} value={cur}>
                      {CURRENCY_METADATA[cur as SupportedCurrency].flag} {cur}
                    </option>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Kết quả quy đổi
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {formatCurrencyAmount(convertedResult, toCurrency)}
                </Typography>
              </Box>
            </Paper>

            {/* Exchange Rate Reference Table */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Bảng Tỷ Giá Chuẩn Tham Chiếu (sang VND)
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Tiền tệ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tên ngoại tệ</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Tỷ giá (1 ngoại tệ = VND)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Object.keys(DEFAULT_EXCHANGE_RATES) as SupportedCurrency[])
                    .filter(c => c !== 'VND')
                    .map(cur => (
                      <TableRow key={cur}>
                        <TableCell>
                          <strong>{CURRENCY_METADATA[cur].flag} {cur}</strong>
                        </TableCell>
                        <TableCell>{CURRENCY_METADATA[cur].name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {DEFAULT_EXCHANGE_RATES[cur].toLocaleString('vi-VN')} ₫
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};
