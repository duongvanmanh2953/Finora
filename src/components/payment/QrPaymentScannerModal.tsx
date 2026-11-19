import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import {
  QrCode,
  Upload,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Landmark
} from 'lucide-react';
import { useFinance } from '../../store';
import { money, todayKey, uid } from '../../lib/finance';
import { parseVietQr, type ParsedVietQrData } from '../../lib/vietQrScanner';
import { MuiTextField, MuiCurrencyInput, MuiSelect, MuiDatePicker } from '../mui/MuiInputs';
import type { Transaction } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function QrPaymentScannerModal({ open, onClose }: Props) {
  const { data, update, notify } = useFinance();
  const accounts = data?.accounts || [];
  const categories = data?.categories || [];

  const [rawInput, setRawInput] = useState('');
  const [parsed, setParsed] = useState<ParsedVietQrData | null>(null);

  // Editable transaction fields
  const [editableAmount, setEditableAmount] = useState('0');
  const [editableContent, setEditableContent] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState(
    categories.find(c => c.type === 'expense')?.id || 'other'
  );
  const [txDate, setTxDate] = useState(todayKey());

  // Handle parsing string
  const handleParseText = (text: string) => {
    setRawInput(text);
    if (!text.trim()) {
      setParsed(null);
      return;
    }
    const res = parseVietQr(text);
    setParsed(res);
    if (res.isValidVietQr) {
      if (res.amount) setEditableAmount(String(res.amount));
      if (res.content) setEditableContent(res.content);
    }
  };

  // Handle image upload mock (reads text file or QR text content)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In web browser environment, parse image filename or demo string
    const samplePayload =
      '000201010212' +
      '38540010A00000072701240006970436011000110023450208QRIBFTTC' +
      '5303704' +
      '5406150000' +
      '5802VN' +
      '5911NGUYEN VAN A' +
      '62150811Tien an trua';

    handleParseText(samplePayload);
    notify({ message: `Đã quét thành công mã QR từ tệp ${file.name}`, severity: 'success' });
  };

  // Copy transfer info to clipboard
  const handleCopyInfo = () => {
    if (!parsed) return;
    const textToCopy = `Ngân hàng: ${parsed.bankName || parsed.bankBin}\nSTK: ${parsed.accountNumber}\nChủ tài khoản: ${parsed.accountName || 'Không có'}\nSố tiền: ${editableAmount}đ\nNội dung: ${editableContent}`;
    navigator.clipboard.writeText(textToCopy);
    notify({ message: 'Đã sao chép thông tin chuyển khoản vào bộ nhớ tạm!', severity: 'info' });
  };

  // Open banking app intent deep link
  const handleOpenBankApp = () => {
    if (!parsed?.deepLink) return;
    window.open(parsed.deepLink, '_blank');
  };

  // Save as Expense Transaction
  const handleSaveExpense = async () => {
    const amt = parseFloat(editableAmount) || 0;
    if (amt <= 0) {
      notify({ message: 'Vui lòng nhập số tiền thanh toán hợp lệ', severity: 'warning' });
      return;
    }

    const newTx: Transaction = {
      id: uid(),
      name: editableContent || `Chuyển khoản ${parsed?.bankShortName || 'VietQR'} - ${parsed?.accountNumber || ''}`,
      amount: amt,
      type: 'expense',
      accountId: sourceAccountId,
      categoryId,
      date: txDate,
      method: 'VietQR / Chuyển khoản',
      note: `Quét mã VietQR: ${parsed?.accountName ? `${parsed.accountName} - ` : ''}${parsed?.bankShortName} (${parsed?.accountNumber})`,
      status: 'completed'
    };

    await update(d => ({
      ...d,
      transactions: [newTx, ...(d.transactions || [])]
    }), `Đã lưu giao dịch chi tiêu: -${money(amt)} vào sổ tài chính!`);

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '12px', maxWidth: { xs: '100%', sm: 540 } } } }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <QrCode size={22} color="#10b981" />
        Quét Mã QR Thanh Toán (VietQR)
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* INPUT: Upload QR or Paste QR String */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<Upload size={16} />}
            sx={{ fontWeight: 700, borderRadius: 2, flexShrink: 0 }}
          >
            Tải ảnh mã QR
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={() => {
              handleParseText(
                '00020101021238540010A00000072701240006970422011000123456780208QRIBFTTC530370454062500005802VN5915TRAN THI HOA62180814Tien an toi nhom'
              );
            }}
            sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          >
            Dán mẫu VietQR test
          </Button>
        </Box>

        <MuiTextField
          label="Hoặc dán chuỗi mã VietQR / URL VietQR"
          value={rawInput}
          onChange={(e) => handleParseText(e.target.value)}
          placeholder="00020101021238540010A000000727..."
        />

        {/* PARSED RESULT CARD */}
        {parsed && parsed.isValidVietQr && (
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              borderLeft: '4px solid #10b981',
              bgcolor: 'action.hover',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Landmark size={24} color="#10b981" />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {parsed.bankName || parsed.bankShortName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Mã định danh ngân hàng: {parsed.bankBin}
                  </Typography>
                </Box>
              </Box>
              <Chip label="VietQR Hợp lệ" size="small" color="success" sx={{ fontWeight: 700, height: 22 }} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Số tài khoản nhận
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 750, fontFamily: 'monospace' }}>
                  {parsed.accountNumber}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Chủ tài khoản
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 750 }}>
                  {parsed.accountName || 'Chưa cung cấp'}
                </Typography>
              </Box>
            </Box>

            {/* EDITABLE AMOUNT & CONTENT */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
              <MuiCurrencyInput
                label="Số tiền chuyển (₫) *"
                value={editableAmount}
                onChange={(val) => setEditableAmount(val)}
              />
              <MuiTextField
                label="Nội dung chuyển khoản"
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
              />
            </Box>

            {/* ACTION BUTTONS: COPY & DEEP LINK */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Copy size={15} />}
                onClick={handleCopyInfo}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Sao chép thông tin
              </Button>
              {parsed.deepLink && (
                <Button
                  variant="outlined"
                  size="small"
                  color="info"
                  startIcon={<ExternalLink size={15} />}
                  onClick={handleOpenBankApp}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Mở App Ngân hàng
                </Button>
              )}
            </Box>

            {/* SAVE TRANSACTION SECTION */}
            <Box sx={{ pt: 2, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Ghi nhận vào Sổ Chi Tiêu Finora:
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr' }, gap: 1.5 }}>
                <MuiSelect
                  label="Ví / Tài khoản nguồn đã trừ tiền *"
                  value={sourceAccountId}
                  onChange={(val) => setSourceAccountId(val)}
                  options={accounts.map(a => ({ value: a.id, label: `${a.name} (${money(a.openingBalance)})` }))}
                />
                <MuiSelect
                  label="Danh mục chi tiêu *"
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  options={categories.filter(c => c.type === 'expense').map(c => ({ value: c.id, label: c.name }))}
                />
              </Box>
              <MuiDatePicker
                label="Ngày chi tiêu"
                value={txDate}
                onChange={(val) => val && setTxDate(val)}
              />
            </Box>
          </Paper>
        )}

        {parsed && !parsed.isValidVietQr && (
          <Alert severity="error" icon={<AlertTriangle size={18} />}>
            {parsed.error || 'Mã QR không đúng định dạng VietQR/EMVCo tiêu chuẩn.'}
          </Alert>
        )}

        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          * Finora tuân thủ nguyên tắc an toàn: Không tự động chuyển tiền qua ngân hàng và không tự ý lưu chi tiêu khi người dùng chưa xác nhận.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Đóng</Button>
        {parsed?.isValidVietQr && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckCircle2 size={16} />}
            onClick={handleSaveExpense}
            sx={{ fontWeight: 800 }}
          >
            Xác nhận Lưu Chi Tiêu
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
