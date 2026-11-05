import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { X, ShieldAlert, QrCode, ExternalLink } from 'lucide-react';
import { money } from '../../lib/finance';
import { BRAND } from '../../config/brand';

interface PaymentCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  amount: number;
  userEmail: string;
}

export function PaymentCheckoutModal({
  open,
  onClose,
  planId,
  planName,
  amount,
  userEmail
}: PaymentCheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [legalGate, setLegalGate] = useState(true);
  const [advisoryMessage, setAdvisoryMessage] = useState(BRAND.legalAdvisory);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setLoading(true);

    fetch('/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': `idem_${planId}_${Date.now()}`
      },
      body: JSON.stringify({
        planId,
        userEmail: userEmail || 'user@tichsan.vn',
        amount
      })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        setLoading(false);
        if (data.legalGate || !data.success) {
          setLegalGate(true);
          setAdvisoryMessage(data.message || BRAND.legalAdvisory);
        } else {
          setLegalGate(false);
          setOrderData(data.data);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
        setLegalGate(true);
        setAdvisoryMessage(BRAND.legalAdvisory);
      });

    return () => {
      isMounted = false;
    };
  }, [open, planId, amount, userEmail]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCode size={20} color="var(--brand-primary, #355E52)" />
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
            Thông Tin Thanh Toán Gói Dịch Vụ
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 2 }}>
            <CircularProgress size={36} sx={{ color: 'var(--brand-primary, #355E52)' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Đang kiểm tra trạng thái cổng thanh toán và xác thực đối soát...
            </Typography>
          </Box>
        ) : legalGate ? (
          /* LEGAL COMPLIANCE GATE ADVISORY (Rule 11.1) */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert
              severity="warning"
              icon={<ShieldAlert size={22} />}
              sx={{
                bgcolor: 'rgba(245, 158, 11, 0.08)',
                color: '#92400E',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                '& .MuiAlert-icon': { color: '#D97706' }
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                Thông Báo Pháp Lý & Chưa Mở Thu Phí Trực Tuyến
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                {advisoryMessage}
              </Typography>
            </Alert>

            {/* Plan Info Card */}
            <Box
              sx={{
                p: 2,
                borderRadius: '8px',
                bgcolor: 'action.hover',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  GÓI ĐÃ CHỌN
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {planName}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  SỐ TIỀN NIÊM YẾT
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--brand-primary)' }}>
                  {money(amount)}
                </Typography>
              </Box>
            </Box>

            {/* Non-scannable Placeholder QR Box */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 3,
                borderRadius: '8px',
                border: '2px dashed var(--border-subtle)',
                bgcolor: 'background.paper',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  width: 180,
                  height: 180,
                  bgcolor: '#F1F5F9',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  opacity: 0.6,
                  border: '1px solid #CBD5E1'
                }}
              >
                <QrCode size={64} color="#64748B" />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem', textAlign: 'center' }}>
                  QR MẪU MINH HỌA
                </Typography>
              </Box>

              <Chip
                label="CHƯA KÍCH HOẠT THANH TOÁN THẬT"
                size="small"
                sx={{
                  mt: 2,
                  bgcolor: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
              />

              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, textAlign: 'center', maxWidth: 360, fontSize: '0.75rem' }}>
                Mã QR trên là khung mẫu trực quan giao diện. Bạn hoàn toàn không bị trừ tiền và tài khoản vẫn được sử dụng bình thường với quyền lợi 30 ngày VIP Gold dùng thử.
              </Typography>
            </Box>
          </Box>
        ) : (
          /* REAL PAYOS QR & PAYMENT LINK (When Legal Compliance is fully Approved) */
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Alert severity="info" sx={{ width: '100%' }}>
              Vui lòng quét mã VietQR bên dưới bằng ứng dụng ngân hàng hoặc ví điện tử để hoàn tất thanh toán tự động qua PayOS.
            </Alert>

            {orderData?.qrCode && (
              <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <img src={orderData.qrCode} alt="VietQR PayOS" style={{ width: 220, height: 220, display: 'block' }} />
              </Box>
            )}

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--brand-primary)' }}>
                {money(orderData?.amount || amount)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Mã đơn hàng: #{orderData?.orderCode}
              </Typography>
            </Box>

            {orderData?.checkoutUrl && (
              <Button
                variant="outlined"
                size="small"
                href={orderData.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<ExternalLink size={14} />}
                sx={{ mt: 1 }}
              >
                Mở cổng thanh toán PayOS trực tiếp
              </Button>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 700 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
