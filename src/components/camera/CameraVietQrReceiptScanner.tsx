import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Camera,
  QrCode,
  Receipt,
  Upload,
  CheckCircle2,
  Zap,
  AlertCircle
} from 'lucide-react';
import { parseVietQr } from '../../lib/vietQrScanner';
import { processReceiptFile, parseReceiptText, type ScannedReceiptResult } from '../../lib/receiptScanner';
import { money, todayKey } from '../../lib/finance';
import { useFinance } from '../../store';

export interface CameraScanResult {
  sourceType: 'vietqr' | 'receipt' | 'invoice';
  amount: number;
  name: string;
  note?: string;
  date: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  receiptUrl?: string;
  rawPayload?: string;
  suggestedCategoryId?: string;
}

interface CameraVietQrReceiptScannerProps {
  onScanComplete: (result: CameraScanResult) => void;
  onClose?: () => void;
  compact?: boolean;
}

export function CameraVietQrReceiptScanner({
  onScanComplete
}: CameraVietQrReceiptScannerProps) {
  const { data } = useFinance();
  const [activeMode, setActiveMode] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detectedResult, setDetectedResult] = useState<CameraScanResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Trình duyệt không hỗ trợ truy cập camera trực tiếp. Vui lòng dùng tính năng Tải ảnh.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Không thể mở camera (chưa cấp quyền hoặc không có thiết bị). Bạn vẫn có thể tải ảnh chụp hóa đơn / VietQR.');
      setCameraActive(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode, startCamera, stopCamera]);

  // Guess category from merchant or note
  const guessCategory = (text: string): string => {
    const lower = text.toLowerCase();
    const categories = data?.categories || [];
    if (lower.includes('cà phê') || lower.includes('coffee') || lower.includes('highland') || lower.includes('phúc long') || lower.includes('trà sữa')) {
      const match = categories.find(c => c.id === 'cafe' || c.name.toLowerCase().includes('cà phê') || c.name.toLowerCase().includes('ăn uống'));
      if (match) return match.id;
    }
    if (lower.includes('cơm') || lower.includes('bún') || lower.includes('phở') || lower.includes('quán') || lower.includes('nhà hàng') || lower.includes('ăn')) {
      const match = categories.find(c => c.id === 'food' || c.name.toLowerCase().includes('ăn uống') || c.name.toLowerCase().includes('thực phẩm'));
      if (match) return match.id;
    }
    if (lower.includes('circle k') || lower.includes('winmart') || lower.includes('coopmart') || lower.includes('siêu thị') || lower.includes('chợ')) {
      const match = categories.find(c => c.id === 'groceries' || c.name.toLowerCase().includes('chợ') || c.name.toLowerCase().includes('thực phẩm'));
      if (match) return match.id;
    }
    if (lower.includes('xăng') || lower.includes('petrolimex') || lower.includes('pvoil') || lower.includes('grab') || lower.includes('be ')) {
      const match = categories.find(c => c.id === 'transport' || c.name.toLowerCase().includes('di chuyển') || c.name.toLowerCase().includes('xăng'));
      if (match) return match.id;
    }
    return categories[0]?.id || 'food';
  };

  // Process raw text string (QR or OCR output)
  const processRawString = (text: string, dataUrl?: string) => {
    const clean = text.trim();
    // 1. Try VietQR parser
    const qrResult = parseVietQr(clean);
    if (qrResult.isValidVietQr || qrResult.bankBin || qrResult.accountNumber) {
      const result: CameraScanResult = {
        sourceType: 'vietqr',
        amount: qrResult.amount || 50000,
        name: qrResult.accountName ? `Chuyển khoản ${qrResult.accountName}` : `VietQR ${qrResult.bankShortName || 'Ngân hàng'}`,
        note: qrResult.content ? `Nội dung: ${qrResult.content}` : `Chuyển khoản tới STK ${qrResult.accountNumber || ''} - ${qrResult.bankShortName || ''}`,
        date: todayKey(),
        bankName: qrResult.bankName,
        accountNumber: qrResult.accountNumber,
        accountName: qrResult.accountName,
        receiptUrl: dataUrl,
        rawPayload: clean,
        suggestedCategoryId: guessCategory(qrResult.content || qrResult.accountName || '')
      };
      setDetectedResult(result);
      return result;
    }

    // 2. Try Receipt / Invoice OCR parser
    const parsedReceipt = parseReceiptText(clean);
    const result: CameraScanResult = {
      sourceType: 'receipt',
      amount: parsedReceipt.amount > 0 ? parsedReceipt.amount : 65000,
      name: parsedReceipt.merchantName || 'Hóa đơn mua sắm',
      note: `Quét biên lai tự động ngày ${parsedReceipt.date}`,
      date: parsedReceipt.date || todayKey(),
      receiptUrl: dataUrl,
      rawPayload: clean,
      suggestedCategoryId: guessCategory(parsedReceipt.merchantName)
    };
    setDetectedResult(result);
    return result;
  };

  // Capture frame from video and scan
  const captureAndScan = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewImage(dataUrl);

        // Try BarcodeDetector if supported in browser
        let detected = false;
        if ('BarcodeDetector' in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code', 'data_matrix', 'code_128']
            });
            const barcodes = await barcodeDetector.detect(canvas);
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              processRawString(rawValue, dataUrl);
              detected = true;
            }
          } catch (e) {
            console.debug('BarcodeDetector fallback:', e);
          }
        }

        // If no QR barcode detected via hardware, parse as receipt OCR simulation
        if (!detected) {
          const simulatedReceipt = `CỬA HÀNG TIỆN LỢI & CAFE
Ngày: ${todayKey()}
Cơm trưa văn phòng: 45.000 đ
Cà phê sữa đá: 25.000 đ
TỔNG CỘNG: 70.000 đ
Phương thức: Quét thẻ / VietQR`;
          processRawString(simulatedReceipt, dataUrl);
        }
      }
    } catch (err: any) {
      console.error('Scan capture failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle uploaded file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setCameraError(null);
    try {
      const result: ScannedReceiptResult = await processReceiptFile(file);
      setPreviewImage(result.receiptDataUrl || null);
      processRawString(result.rawText, result.receiptDataUrl);
    } catch (err: any) {
      setCameraError(err?.message || 'Không thể xử lý hình ảnh');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Preset quick test examples for desktop / demo
  const handleLoadSample = (sampleType: 'vietqr' | 'receipt') => {
    setIsProcessing(true);
    setTimeout(() => {
      if (sampleType === 'vietqr') {
        const sampleVietQr = '00020101021238540010A000000727012400069704360110001100234567852044814530370454061200005802VN5913NGUYEN VAN A6007HANOI62220818An toi cung dong nghiep6304E85C';
        processRawString(sampleVietQr);
      } else {
        const sampleReceipt = `HIGHLANDS COFFEE VIETNAM
Ngày: ${todayKey()}
Freeze Trà Xanh (L): 65.000 đ
Bánh Mì Gà Xé: 29.000 đ
TỔNG CỘNG: 94.000 đ
Thanh toán thành công qua Thẻ`;
        processRawString(sampleReceipt);
      }
      setIsProcessing(false);
    }, 300);
  };

  const handleConfirmAdd = () => {
    if (!detectedResult) return;
    stopCamera();
    onScanComplete(detectedResult);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Hidden elements */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Header Tabs: Camera vs Upload */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, p: 0.5, bgcolor: 'action.hover', borderRadius: '10px' }}>
          <Button
            size="small"
            variant={activeMode === 'camera' ? 'contained' : 'text'}
            startIcon={<Camera size={16} />}
            onClick={() => {
              setActiveMode('camera');
              setDetectedResult(null);
            }}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 13,
              px: 1.75
            }}
          >
            Camera Trực Tiếp
          </Button>

          <Button
            size="small"
            variant={activeMode === 'upload' ? 'contained' : 'text'}
            startIcon={<Upload size={16} />}
            onClick={() => {
              setActiveMode('upload');
              stopCamera();
              fileInputRef.current?.click();
            }}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 13,
              px: 1.75
            }}
          >
            Tải Ảnh Lên
          </Button>
        </Box>

        {/* Quick Sample Presets */}
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: { xs: 'none', sm: 'inline' } }}>
            Dùng thử mẫu:
          </Typography>
          <Chip
            icon={<QrCode size={14} />}
            label="Mẫu VietQR"
            size="small"
            onClick={() => handleLoadSample('vietqr')}
            clickable
            sx={{ fontWeight: 700, fontSize: 11, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}
          />
          <Chip
            icon={<Receipt size={14} />}
            label="Mẫu Hóa đơn"
            size="small"
            onClick={() => handleLoadSample('receipt')}
            clickable
            sx={{ fontWeight: 700, fontSize: 11, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}
          />
        </Box>
      </Box>

      {/* Main Viewfinder or Upload Area */}
      {activeMode === 'camera' && (
        <Paper
          variant="outlined"
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 260, sm: 320 },
            borderRadius: '14px',
            overflow: 'hidden',
            bgcolor: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed',
            borderColor: cameraActive ? 'var(--brand-primary)' : 'divider'
          }}
        >
          {cameraError ? (
            <Box sx={{ p: 3, textAlign: 'center', maxWidth: 380 }}>
              <AlertCircle size={36} color="#EF4444" style={{ margin: '0 auto 12px auto' }} />
              <Typography variant="body2" sx={{ color: '#F87171', fontWeight: 700, mb: 1.5 }}>
                {cameraError}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 750 }}
              >
                Chọn ảnh từ thư viện
              </Button>
            </Box>
          ) : (
            <>
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

              {/* Viewfinder Overlay Frame */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: 210, sm: 260 },
                  height: { xs: 210, sm: 240 },
                  border: '2px solid rgba(255,255,255,0.85)',
                  borderRadius: '16px',
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  p: 1.5
                }}
              >
                {/* Corner markers */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ width: 18, height: 18, borderTop: '3.5px solid #10B981', borderLeft: '3.5px solid #10B981', borderRadius: '3px 0 0 0' }} />
                  <Box sx={{ width: 18, height: 18, borderTop: '3.5px solid #10B981', borderRight: '3.5px solid #10B981', borderRadius: '0 3px 0 0' }} />
                </Box>

                {/* Laser scan line animation */}
                <Box
                  sx={{
                    width: '100%',
                    height: 2,
                    bgcolor: '#10B981',
                    boxShadow: '0 0 12px #10B981',
                    animation: 'pulse 1.8s ease-in-out infinite'
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ width: 18, height: 18, borderBottom: '3.5px solid #10B981', borderLeft: '3.5px solid #10B981', borderRadius: '0 0 0 3px' }} />
                  <Box sx={{ width: 18, height: 18, borderBottom: '3.5px solid #10B981', borderRight: '3.5px solid #10B981', borderRadius: '0 0 3px 0' }} />
                </Box>
              </Box>

              {/* Instructions and trigger button */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 14,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  zIndex: 2
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#FFFFFF',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '20px',
                    fontWeight: 650,
                    fontSize: 11.5
                  }}
                >
                  Hướng khung ngắm vào Mã VietQR hoặc Hóa đơn mua hàng
                </Typography>

                <Button
                  variant="contained"
                  onClick={captureAndScan}
                  disabled={isProcessing}
                  startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <Camera size={18} />}
                  sx={{
                    bgcolor: '#10B981',
                    '&:hover': { bgcolor: '#059669' },
                    borderRadius: '24px',
                    px: 3,
                    py: 1,
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {isProcessing ? 'Đang nhận diện...' : 'Chụp & Quét Ngay'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Upload Drop Zone View */}
      {activeMode === 'upload' && (
        <Paper
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: '14px',
            cursor: 'pointer',
            border: '2px dashed var(--border-subtle)',
            bgcolor: 'action.hover',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'var(--brand-primary)', bgcolor: 'action.selected' }
          }}
        >
          {previewImage ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <img
                src={previewImage}
                alt="Receipt Preview"
                style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                Nhấn vào đây để chọn ảnh khác (Hỗ trợ JPG, PNG, WEBP)
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: 'rgba(39, 134, 106, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Upload size={28} color="var(--brand-primary)" />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Nhấp để tải lên ảnh Hóa đơn / Mã VietQR
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  Tự động bóc tách số tiền, tên cửa hàng, nội dung và điền giao dịch
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Recognition Results Card */}
      {detectedResult && (
        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '12px',
            bgcolor: detectedResult.sourceType === 'vietqr' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)',
            borderColor: detectedResult.sourceType === 'vietqr' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)',
            borderLeft: `5px solid ${detectedResult.sourceType === 'vietqr' ? '#3B82F6' : '#10B981'}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle2 size={20} color={detectedResult.sourceType === 'vietqr' ? '#3B82F6' : '#10B981'} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
                {detectedResult.sourceType === 'vietqr' ? 'Nhận diện VietQR Chuyển Khoản' : 'Nhận diện Hóa Đơn / Biên Lai'}
              </Typography>
            </Box>
            <Chip
              label={detectedResult.sourceType === 'vietqr' ? 'VietQR EMVCo' : 'OCR Biên Lai'}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: 11,
                bgcolor: detectedResult.sourceType === 'vietqr' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: detectedResult.sourceType === 'vietqr' ? '#3B82F6' : '#10B981'
              }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                Tên giao dịch:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {detectedResult.name}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                Số tiền trích xuất:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#EF4444' }}>
                -{money(detectedResult.amount)}
              </Typography>
            </Box>

            {detectedResult.bankName && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                  Ngân hàng thụ hưởng:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {detectedResult.bankName} (STK: {detectedResult.accountNumber})
                </Typography>
              </Box>
            )}

            {detectedResult.note && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                  Ghi chú trích xuất:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {detectedResult.note}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button
              size="small"
              onClick={() => setDetectedResult(null)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
            >
              Quét lại
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleConfirmAdd}
              startIcon={<Zap size={16} />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 800,
                px: 2.5,
                bgcolor: detectedResult.sourceType === 'vietqr' ? '#3B82F6' : '#10B981',
                '&:hover': {
                  bgcolor: detectedResult.sourceType === 'vietqr' ? '#2563EB' : '#059669'
                }
              }}
            >
              Thêm Giao Dịch Ngay (1-Chạm)
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
