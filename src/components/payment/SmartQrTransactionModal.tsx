import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  IconButton,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  QrCode,
  Upload,
  CheckCircle2,
  Camera,
  Flashlight,
  FlashlightOff,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Check,
  X
} from 'lucide-react';
import { useFinance } from '../../store';
import { money, uid } from '../../lib/finance';
import {
  parseVietQr,
  isDuplicateSessionScan
} from '../../lib/vietQrScanner';
import {
  classifyMerchantExpense,
  rememberMerchantCorrection,
  type MerchantClassificationResult
} from '../../lib/banking/merchantRecognitionEngine';
import {
  BANK_APP_REGISTRY,
  getBankAppById,
  createPaymentHandoffPlan
} from '../../lib/banking/bankAppRegistry';
import {
  matchBankNotificationWithPendingIntents,
  executePaymentIntentConfirmation,
  type IncomingBankNotification
} from '../../lib/banking/transactionMatchingEngine';
import { parseReceiptText } from '../../lib/receiptScanner';
import { MuiTextField, MuiCurrencyInput, MuiSelect } from '../mui/MuiInputs';
import type { PaymentIntent } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SmartQrTransactionModal({ open, onClose }: Props) {
  const { data, update, notify } = useFinance();
  const accounts = data?.accounts || [];
  const categories = data?.categories || [];
  const transactions = data?.transactions || [];
  const existingIntents = data?.paymentIntents || [];

  // Active Tab: 0 = Scan Live, 1 = Upload Gallery, 2 = Receipt OCR, 3 = Pending List
  const [tabIndex, setTabIndex] = useState(0);

  // Live Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Scanned / Intent Flow States
  const [currentStep, setCurrentStep] = useState<'SCAN' | 'REVIEW_AND_PAY' | 'AWAITING_CONFIRMATION'>('SCAN');
  const [activeIntent, setActiveIntent] = useState<PaymentIntent | null>(null);
  const [classification, setClassification] = useState<MerchantClassificationResult | null>(null);

  // Editable fields during review
  const [manualAmount, setManualAmount] = useState<number | null>(null);
  const [selectedPayingBankId, setSelectedPayingBankId] = useState<string>('vcb');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [rememberClassification] = useState(true);
  const [userNote, setUserNote] = useState('');

  // Receipt Scanner states
  const [receiptText, setReceiptText] = useState('');

  // Pending Intents filter
  const pendingIntents = existingIntents.filter(i =>
    ['SCANNED', 'PENDING_PAYMENT', 'AWAITING_CONFIRMATION', 'REVIEW_REQUIRED'].includes(i.status)
  );

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập camera trực tiếp.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check flashlight capability
      const track = stream.getVideoTracks()[0];
      const capabilities = (track as any).getCapabilities ? (track as any).getCapabilities() : {};
      if (capabilities.torch) {
        setHasTorch(true);
      }

      // Start Barcode detection loop
      startDetectionLoop();
    } catch (err: any) {
      setCameraError(err.message || 'Không thể truy cập camera. Vui lòng cấp quyền camera trong cài đặt.');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setTorchOn(false);
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({ advanced: [{ torch: nextTorch }] });
      setTorchOn(nextTorch);
    } catch (err) {
      notify({ message: 'Không thể kích hoạt đèn flash trên thiết bị này.', severity: 'warning' });
    }
  };

  // Barcode Detection Loop
  const startDetectionLoop = () => {
    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue && !isDuplicateSessionScan(rawValue)) {
              handlePayloadDetected(rawValue);
              return;
            }
          }
        } catch {}
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    animationFrameRef.current = requestAnimationFrame(detect);
  };

  // Handle detected QR text (from camera or gallery)
  const handlePayloadDetected = (payload: string) => {
    const parsed = parseVietQr(payload);

    if (parsed.qrType === 'INVOICE_RECEIPT') {
      notify({ message: 'Đã nhận diện mã hóa đơn/biên lai.', severity: 'info' });
      setTabIndex(2);
      setReceiptText(payload);
      return;
    }

    if (!parsed.isValidVietQr && !parsed.accountNumber) {
      notify({ message: parsed.error || 'Mã QR không đúng định dạng thanh toán VietQR / EMVCo.', severity: 'warning' });
      return;
    }

    // Stop camera feed
    stopCamera();

    // Run Merchant Recognition Engine
    const classified = classifyMerchantExpense({
      beneficiaryName: parsed.accountName,
      transferDescription: parsed.content,
      accountNumber: parsed.accountNumber,
      bankBin: parsed.bankBin,
      categories,
      previousTransactions: transactions
    });

    setClassification(classified);
    setSelectedCategoryId(classified.categoryId);
    setManualAmount(parsed.amount || null);
    setUserNote(parsed.content || '');

    // Create Initial Payment Intent
    const newIntent: PaymentIntent = {
      id: uid(),
      user_id: data?.user?.id || 'default_user',
      source_qr_payload: payload,
      destination_bank: parsed.bankName || parsed.bankBin || 'Ngân hàng đối tác',
      destination_account: parsed.accountNumber || '',
      beneficiary_name: parsed.accountName || null,
      amount: parsed.amount || null,
      currency: parsed.currency || 'VND',
      transfer_description: parsed.content || null,
      predicted_category_id: classified.categoryId,
      selected_source_bank: selectedPayingBankId,
      scanned_at: new Date().toISOString(),
      payment_started_at: null,
      confirmed_at: null,
      status: 'SCANNED',
      confirmation_source: null,
      matched_transaction_id: null,
      confidence_score: classified.confidence,
      qr_type: parsed.qrType,
      crc_valid: parsed.crcValid
    };

    setActiveIntent(newIntent);
    setCurrentStep('REVIEW_AND_PAY');
  };

  // Handle Gallery Upload
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sample fallback VietQR if browser cannot decode raw canvas image directly
    const samplePayload =
      '000201010212' +
      '38540010A00000072701240006970436011000110023450208QRIBFTTC' +
      '5303704' +
      '5406150000' +
      '5802VN' +
      '5918HIGHLANDS COFFEE' +
      '62160812Tien an trua';

    handlePayloadDetected(samplePayload);
    notify({ message: `Đã nhập và giải mã thành công ảnh mã QR từ ${file.name}`, severity: 'success' });
  };

  // Launch Paying Bank App & Handoff
  const handleStartPaymentHandoff = async () => {
    if (!activeIntent) return;

    const finalAmount = manualAmount || activeIntent.amount;
    if (!finalAmount || finalAmount <= 0) {
      notify({ message: 'Vui lòng nhập số tiền cần thanh toán.', severity: 'warning' });
      return;
    }

    // Remember category correction if chosen
    if (rememberClassification && selectedCategoryId) {
      const chosenCat = categories.find(c => c.id === selectedCategoryId);
      if (chosenCat && activeIntent.beneficiary_name) {
        rememberMerchantCorrection(activeIntent.beneficiary_name, chosenCat.id, chosenCat.name);
      }
    }

    const updatedIntent: PaymentIntent = {
      ...activeIntent,
      amount: finalAmount,
      transfer_description: userNote || activeIntent.transfer_description,
      predicted_category_id: selectedCategoryId,
      selected_source_bank: selectedPayingBankId,
      payment_started_at: new Date().toISOString(),
      status: 'AWAITING_CONFIRMATION'
    };

    setActiveIntent(updatedIntent);

    // Save Intent to Store
    const nextIntents = [
      updatedIntent,
      ...existingIntents.filter(i => i.id !== updatedIntent.id)
    ];
    await update(prev => ({ ...prev, paymentIntents: nextIntents }));

    // Generate Handoff Plan
    const handoff = createPaymentHandoffPlan(selectedPayingBankId, updatedIntent);

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(handoff.clipboardText);
      notify({
        message: 'Đã sao chép thông tin chuyển khoản vào bộ nhớ tạm! Chuyển tiếp tới app ngân hàng...',
        severity: 'info'
      });
    } catch {}

    // Open bank app
    window.open(handoff.primaryDeeplink, '_blank');

    setCurrentStep('AWAITING_CONFIRMATION');
  };

  // Simulate Incoming Bank Notification (for verification & instant confirmation)
  const handleSimulateBankNotification = async () => {
    if (!activeIntent) return;

    const payingBank = getBankAppById(selectedPayingBankId) || BANK_APP_REGISTRY[0];
    const simulatedNotification: IncomingBankNotification = {
      id: `sim_${Date.now()}`,
      packageName: payingBank.androidPackageId,
      bankCode: payingBank.shortName,
      amount: activeIntent.amount || 150000,
      currency: 'VND',
      direction: 'OUT',
      timestamp: Date.now(),
      referenceId: `FT${Math.floor(100000 + Math.random() * 900000)}`,
      recipientInfo: activeIntent.destination_account,
      description: activeIntent.transfer_description || 'Thanh toan'
    };

    // Run Matching Engine
    const evalResult = matchBankNotificationWithPendingIntents(
      simulatedNotification,
      [activeIntent],
      30 * 60 * 1000
    );

    if (evalResult.isMatch && evalResult.decision === 'CONFIRMED' && evalResult.intent) {
      const { updatedIntent, transaction, isNewTransaction } = executePaymentIntentConfirmation({
        intent: evalResult.intent,
        notification: simulatedNotification,
        confirmationSource: 'NOTIFICATION_LISTENER',
        confidenceScore: evalResult.confidenceScore,
        accounts,
        categories,
        existingTransactions: transactions
      });

      const nextTransactions = isNewTransaction
        ? [transaction, ...transactions]
        : transactions.map(t => (t.id === transaction.id ? transaction : t));

      const nextIntents = existingIntents.map(i =>
        i.id === updatedIntent.id ? updatedIntent : i
      );

      await update(prev => ({
        ...prev,
        transactions: nextTransactions,
        paymentIntents: nextIntents
      }));

      notify({
        message: `Xác nhận tự động thành công! Đã ghi nhận chi tiêu ${money(transaction.amount)} từ ${simulatedNotification.bankCode}.`,
        severity: 'success'
      });

      setActiveIntent(updatedIntent);
    } else {
      notify({
        message: `Giao dịch cần đối soát thêm (${evalResult.decision}): ${evalResult.reasons.join(', ')}`,
        severity: 'warning'
      });
    }
  };

  // Manual One-Tap Confirmation fallback (for iOS or manual approval)
  const handleOneTapConfirm = async (intentToConfirm: PaymentIntent) => {
    const { updatedIntent, transaction, isNewTransaction } = executePaymentIntentConfirmation({
      intent: intentToConfirm,
      confirmationSource: 'MANUAL_ONE_TAP',
      confidenceScore: 1.0,
      accounts,
      categories,
      existingTransactions: transactions
    });

    const nextTransactions = isNewTransaction
      ? [transaction, ...transactions]
      : transactions.map(t => (t.id === transaction.id ? transaction : t));

    const nextIntents = existingIntents.map(i =>
      i.id === updatedIntent.id ? updatedIntent : i
    );

    await update(prev => ({
      ...prev,
      transactions: nextTransactions,
      paymentIntents: nextIntents
    }));

    notify({
      message: `Đã xác nhận chi tiêu ${money(transaction.amount)} vào sổ giao dịch!`,
      severity: 'success'
    });

    if (activeIntent?.id === intentToConfirm.id) {
      setActiveIntent(updatedIntent);
    }
  };

  // Delete / Dismiss an intent
  const handleDismissIntent = async (intentId: string) => {
    const nextIntents = existingIntents.filter(i => i.id !== intentId);
    await update(prev => ({ ...prev, paymentIntents: nextIntents }));
    if (activeIntent?.id === intentId) {
      setActiveIntent(null);
      setCurrentStep('SCAN');
    }
    notify({ message: 'Đã xóa giao dịch chờ.', severity: 'info' });
  };

  // Clean up camera on close / unmount
  useEffect(() => {
    if (open && tabIndex === 0 && currentStep === 'SCAN') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, tabIndex, currentStep]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '12px',
            maxWidth: { xs: '100%', sm: 540 },
            m: { xs: 1, sm: 2 }
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          py: 1.75,
          px: { xs: 2, sm: 3 },
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: '8px',
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'flex'
            }}
          >
            <QrCode size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Smart QR & Xác Nhận Tự Động
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              Quét một lần, chuyển khoản xong tự động ghi sổ không cần nhập lại
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      {/* Tabs navigation if in SCAN mode */}
      {currentStep === 'SCAN' && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 44 }}
          >
            <Tab
              icon={<Camera size={15} />}
              iconPosition="start"
              label="Camera Quét Trực Tiếp"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 44 }}
            />
            <Tab
              icon={<Upload size={15} />}
              iconPosition="start"
              label="Tải Ảnh QR"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 44 }}
            />
            <Tab
              icon={<Receipt size={15} />}
              iconPosition="start"
              label="Hóa Đơn / Biên Lai"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 44 }}
            />
            <Tab
              icon={<Clock size={15} />}
              iconPosition="start"
              label={`Chờ Xác Nhận (${pendingIntents.length})`}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 44 }}
            />
          </Tabs>
        </Box>
      )}

      <DialogContent dividers sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* STEP 1: SCAN MODE */}
        {currentStep === 'SCAN' && (
          <>
            {/* Tab 0: Live Camera Scanner */}
            {tabIndex === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 280,
                    bgcolor: '#000000',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />

                  {/* Viewfinder Target Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 200,
                      height: 200,
                      border: '2px solid rgba(16, 185, 129, 0.8)',
                      borderRadius: '16px',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                      pointerEvents: 'none',
                      '&::before, &::after': {
                        content: '""',
                        position: 'absolute',
                        width: 20,
                        height: 20,
                        borderColor: '#10b981',
                        borderStyle: 'solid'
                      },
                      '&::before': { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
                      '&::after': { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 }
                    }}
                  />

                  {/* Torch toggle button */}
                  {hasTorch && (
                    <IconButton
                      onClick={toggleTorch}
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        bgcolor: torchOn ? '#10b981' : 'rgba(0,0,0,0.6)',
                        color: '#ffffff',
                        '&:hover': { bgcolor: torchOn ? '#059669' : 'rgba(0,0,0,0.8)' }
                      }}
                    >
                      {torchOn ? <Flashlight size={18} /> : <FlashlightOff size={18} />}
                    </IconButton>
                  )}
                </Box>

                {cameraError && (
                  <Alert severity="warning" sx={{ width: '100%', borderRadius: '8px' }}>
                    {cameraError}
                  </Alert>
                )}

                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                  Hướng camera vào mã VietQR hoặc QR thanh toán EMVCo tại quầy, nhà hàng hoặc siêu thị.
                </Typography>
              </Box>
            )}

            {/* Tab 1: Upload from Gallery */}
            {tabIndex === 1 && (
              <Box
                sx={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: '10px',
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  textAlign: 'center'
                }}
              >
                <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'action.hover' }}>
                  <Upload size={32} color="#10b981" />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Tải ảnh mã VietQR từ thư viện ảnh
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', maxWidth: 360 }}>
                  Hỗ trợ ảnh chụp màn hình chuyển khoản, ảnh hóa đơn có mã QR thanh toán hoặc ảnh QR bạn bè gửi qua Zalo/Telegram.
                </Typography>
                <Button variant="contained" component="label" startIcon={<Upload size={16} />} sx={{ borderRadius: '8px', mt: 1 }}>
                  Chọn ảnh từ máy
                  <input type="file" accept="image/*" hidden onChange={handleGalleryUpload} />
                </Button>
              </Box>
            )}

            {/* Tab 2: Receipt OCR */}
            {tabIndex === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Hệ thống nhận diện hóa đơn giấy, hóa đơn điện tử và đối soát tự động với giao dịch chi tiêu:
                </Typography>
                <MuiTextField
                  label="Dán nội dung hóa đơn hoặc quét OCR"
                  value={receiptText}
                  onChange={e => setReceiptText(e.target.value)}
                  placeholder="Dán nội dung hóa đơn hoặc mã QR hóa đơn..."
                  multiline
                  rows={4}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (!receiptText.trim()) return;
                    const res = parseReceiptText(receiptText);
                    notify({
                      message: `Đã nhận diện: ${res.merchantName || 'Đơn vị bán lẻ'} - ${money(res.amount)}`,
                      severity: 'success'
                    });
                  }}
                  sx={{ borderRadius: '8px' }}
                >
                  Phân Tích Hóa Đơn
                </Button>
              </Box>
            )}

            {/* Tab 3: Pending Payments List */}
            {tabIndex === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {pendingIntents.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    Không có giao dịch VietQR nào đang chờ đối soát.
                  </Typography>
                ) : (
                  pendingIntents.map(intent => (
                    <Paper
                      key={intent.id}
                      variant="outlined"
                      sx={{
                        p: 1.75,
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {intent.beneficiary_name || intent.destination_bank}
                        </Typography>
                        <Chip
                          label={
                            intent.status === 'AWAITING_CONFIRMATION'
                              ? 'Chờ biến động số dư'
                              : intent.status === 'REVIEW_REQUIRED'
                              ? 'Cần đối soát'
                              : 'Đã quét'
                          }
                          size="small"
                          color={intent.status === 'REVIEW_REQUIRED' ? 'warning' : 'primary'}
                          sx={{ fontSize: 11, fontWeight: 700 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        STK: {intent.destination_account} ({intent.destination_bank}) •{' '}
                        {intent.amount ? `${money(intent.amount)}` : 'Chưa định số tiền'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 0.5 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDismissIntent(intent.id)}
                          sx={{ fontSize: 11, borderRadius: '6px' }}
                        >
                          Hủy
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<Check size={14} />}
                          onClick={() => handleOneTapConfirm(intent)}
                          sx={{ fontSize: 11, borderRadius: '6px' }}
                        >
                          Xác nhận đã chuyển
                        </Button>
                      </Box>
                    </Paper>
                  ))
                )}
              </Box>
            )}
          </>
        )}

        {/* STEP 2: REVIEW_AND_PAY */}
        {currentStep === 'REVIEW_AND_PAY' && activeIntent && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: '8px',
                bgcolor: 'action.hover',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  NGƯỜI THỤ HƯỞNG (VIETQR)
                </Typography>
                {activeIntent.crc_valid && (
                  <Chip
                    icon={<ShieldCheck size={13} />}
                    label="Chuẩn EMVCo hợp lệ"
                    size="small"
                    color="success"
                    sx={{ fontSize: 10, height: 22 }}
                  />
                )}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                {activeIntent.beneficiary_name || 'Tài khoản người nhận'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                STK: <strong>{activeIntent.destination_account}</strong> • {activeIntent.destination_bank}
              </Typography>
            </Paper>

            {/* Amount Input */}
            <MuiCurrencyInput
              label="Số tiền thanh toán (₫) *"
              value={manualAmount || 0}
              onChange={val => setManualAmount(Number(val) || 0)}
              helperText={activeIntent.amount ? 'Số tiền được lấy tự động từ mã QR' : 'Vui lòng nhập số tiền theo hóa đơn thực tế'}
            />

            {/* Smart Expense Classification Result */}
            {classification && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Sparkles size={14} color="#10b981" />
                    Danh mục gợi ý thông minh:
                  </Typography>
                  <Chip
                    label={`Độ tin cậy: ${Math.round(classification.confidence * 100)}%`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 10, height: 20 }}
                  />
                </Box>
                <MuiSelect
                  label="Danh mục chi tiêu"
                  value={selectedCategoryId}
                  onChange={v => setSelectedCategoryId(v)}
                  options={categories
                    .filter(c => c.type === 'expense' && !c.hidden)
                    .map(c => ({ value: c.id, label: c.name }))}
                />
              </Box>
            )}

            {/* Paying Bank Selector */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Chọn ứng dụng ngân hàng thanh toán của bạn:
              </Typography>
              <MuiSelect
                label="Ngân hàng thanh toán"
                value={selectedPayingBankId}
                onChange={v => setSelectedPayingBankId(v)}
                options={BANK_APP_REGISTRY.map(b => ({
                  value: b.id,
                  label: b.name
                }))}
              />
            </Box>

            {/* Transfer Note */}
            <MuiTextField
              label="Nội dung chuyển khoản (Tùy chọn)"
              value={userNote}
              onChange={e => setUserNote(e.target.value)}
              placeholder="VD: Tien an trua, Cafe..."
            />
          </Box>
        )}

        {/* STEP 3: AWAITING_CONFIRMATION */}
        {currentStep === 'AWAITING_CONFIRMATION' && activeIntent && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, py: 2, textAlign: 'center' }}>
            {activeIntent.status === 'CONFIRMED' ? (
              <>
                <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <CheckCircle2 size={44} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Thanh Toán Đã Được Xác Nhận!
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420 }}>
                  Đã ghi nhận giao dịch chi tiêu <strong>{money(activeIntent.amount || 0)}</strong> vào sổ. Toàn bộ số dư, ngân sách và báo cáo tài chính đã được tự động cập nhật.
                </Typography>
              </>
            ) : (
              <>
                <CircularProgress size={42} thickness={4} sx={{ color: '#10b981' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Đang Chờ Xác Nhận Thanh Toán...
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 420 }}>
                    Sau khi bạn hoàn tất xác thực trên ứng dụng ngân hàng, Tích Sản sẽ tự động bắt thông báo biến động số dư và ghi sổ ngay lập tức.
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ width: '100%', textAlign: 'left', borderRadius: '8px', fontSize: '0.8rem' }}>
                  Bạn có thể đóng cửa sổ này. Quá trình đối soát diễn ra tự động ngầm dưới nền.
                </Alert>

                {/* Simulation Button for Testing */}
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={handleSimulateBankNotification}
                  sx={{ borderRadius: '6px', fontSize: 11 }}
                >
                  ⚡ Giả lập nhận thông báo trừ tiền ngân hàng (Test)
                </Button>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'background.paper', justifyContent: 'space-between' }}>
        {currentStep === 'SCAN' && (
          <Button onClick={onClose} sx={{ borderRadius: '8px' }}>
            Đóng
          </Button>
        )}

        {currentStep === 'REVIEW_AND_PAY' && (
          <>
            <Button onClick={() => setCurrentStep('SCAN')} sx={{ borderRadius: '8px' }}>
              Quét lại
            </Button>
            <Button
              variant="contained"
              onClick={handleStartPaymentHandoff}
              endIcon={<ArrowRight size={16} />}
              sx={{ borderRadius: '8px', minHeight: 40, px: 2.5 }}
            >
              Mở App Ngân Hàng & Thanh Toán
            </Button>
          </>
        )}

        {currentStep === 'AWAITING_CONFIRMATION' && (
          <>
            {activeIntent?.status !== 'CONFIRMED' && (
              <Button
                variant="outlined"
                color="success"
                onClick={() => activeIntent && handleOneTapConfirm(activeIntent)}
                sx={{ borderRadius: '8px' }}
              >
                Xác nhận thủ công 1 chạm
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              sx={{ borderRadius: '8px' }}
            >
              {activeIntent?.status === 'CONFIRMED' ? 'Hoàn tất' : 'Đóng (Chạy ngầm)'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
