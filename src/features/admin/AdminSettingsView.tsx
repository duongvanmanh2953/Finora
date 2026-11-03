import { useState } from 'react';
import { Box, Typography, Switch, Divider } from '@mui/material';
import { Save } from 'lucide-react';
import { BaseCard } from '../../components/ui/CardVariants';
import { FinoraButton } from '../../components/ui/FinoraButton';

export function AdminSettingsView() {
  const [flags, setFlags] = useState({
    webmcpEnabled: true,
    payOsLiveMode: true,
    misaEInvoiceAutoIssue: true,
    autoRebalanceAlerts: true,
    strictZeroAccessEnforcement: true
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
      <BaseCard>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
          Cấu Hình Tính Năng & Cờ Nền Tảng (Feature Flags)
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
          Điều khiển tính năng theo thời gian thực không cần triển khai lại máy chủ
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Giao thức WebMCP AI Finance Assistant
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Cho phép trợ lý ảo Gemini / Claude truy vấn số dư và tạo giao dịch thông qua Model Context Protocol
              </Typography>
            </Box>
            <Switch
              checked={flags.webmcpEnabled}
              onChange={e => setFlags({ ...flags, webmcpEnabled: e.target.checked })}
              color="primary"
            />
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Cổng VietQR / payOS Chế độ Production Live
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Bật nhận tiền thật qua tài khoản doanh nghiệp (tắt đi sẽ chuyển sang Sandbox Test)
              </Typography>
            </Box>
            <Switch
              checked={flags.payOsLiveMode}
              onChange={e => setFlags({ ...flags, payOsLiveMode: e.target.checked })}
              color="primary"
            />
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Tự động Xuất Hóa Đơn Điện Tử MISA
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Phát hành hóa đơn VAT điện tử ngay khi đơn hàng thanh toán thành công
              </Typography>
            </Box>
            <Switch
              checked={flags.misaEInvoiceAutoIssue}
              onChange={e => setFlags({ ...flags, misaEInvoiceAutoIssue: e.target.checked })}
              color="primary"
            />
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Bắt Buộc Kiểm Toán Zero-Access (Non-Bypassable)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Từ chối mọi quyền của superuser cố gắng truy vấn dữ liệu tài chính người dùng cuối
              </Typography>
            </Box>
            <Switch
              checked={flags.strictZeroAccessEnforcement}
              disabled
              color="primary"
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <FinoraButton variant="primary" startIcon={<Save size={15} />} onClick={handleSave}>
              {saved ? 'Đã lưu cấu hình ✓' : 'Lưu thay đổi'}
            </FinoraButton>
          </Box>
        </Box>
      </BaseCard>
    </Box>
  );
}
