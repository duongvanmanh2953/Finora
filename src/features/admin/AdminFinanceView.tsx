import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import {
  Receipt,
  Download,
  Building2,
  Scale
} from 'lucide-react';
import { BaseCard, MetricCard } from '../../components/ui/CardVariants';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FinoraButton } from '../../components/ui/FinoraButton';
import { money } from '../../lib/finance';

export function AdminFinanceView() {
  const [tab, setTab] = useState<'invoices' | 'expenses' | 'tax'>('invoices');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Financial Overview Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        <MetricCard
          title="Tổng Thu Hóa Đơn (Doanh thu gộp)"
          value="1.797.000 ₫"
          secondary="4 hóa đơn điện tử MISA đã xuất"
          icon={<Receipt size={18} />}
          module="income"
          statusLabel="Khớp 100%"
          status="success"
        />

        <MetricCard
          title="Thuế GTGT (VAT 10%) Phải nộp"
          value="163.365 ₫"
          secondary="Kê khai Quý IV / 2026"
          icon={<Scale size={18} />}
          module="budgets"
          statusLabel="Đã trích lập"
          status="info"
        />

        <MetricCard
          title="Chi phí Hạ tầng & Vận hành"
          value="450.000 ₫"
          secondary="Máy chủ Cloud & Cổng API"
          icon={<Building2 size={18} />}
          module="debts"
          statusLabel="Trong định mức"
          status="success"
        />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab value="invoices" label="Hóa đơn Điện tử MISA (e-Invoices)" />
          <Tab value="expenses" label="Quản lý Chi phí Bên Thứ Ba (Server, Domain, AI...)" />
          <Tab value="tax" label="Kê khai Thuế & Đối soát Kế toán" />
        </Tabs>
      </Box>

      {tab === 'invoices' && (
        <BaseCard>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Danh sách Hóa đơn Điện tử Đã phát hành
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Đồng bộ tự động lên hệ thống meInvoice MISA chuẩn Tổng cục Thuế
              </Typography>
            </Box>

            <FinoraButton variant="secondary" size="small" startIcon={<Download size={14} />}>
              Xuất XML / PDF
            </FinoraButton>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Số hóa đơn</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mẫu số / Ký hiệu</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Khách hàng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mã số thuế</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Tiền trước thuế</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Thuế VAT (10%)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Tổng thanh toán</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { no: 'HD26E00001', pattern: '1/001', name: 'Minh Anh', tax: '0109988221', sub: 544545, vat: 54455, total: 599000, status: 'ISSUED' },
                  { no: 'HD26E00002', pattern: '1/001', name: 'Tuấn Nguyễn', tax: '0315892110', sub: 544545, vat: 54455, total: 599000, status: 'ISSUED' },
                  { no: 'HD26E00003', pattern: '1/001', name: 'Lê Thu Trang', tax: '0318991204', sub: 544545, vat: 54455, total: 599000, status: 'ISSUED' }
                ].map(inv => (
                  <TableRow key={inv.no} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{inv.no}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{inv.pattern}</TableCell>
                    <TableCell sx={{ fontWeight: 650 }}>{inv.name}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{inv.tax}</TableCell>
                    <TableCell align="right">{money(inv.sub)}</TableCell>
                    <TableCell align="right">{money(inv.vat)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{money(inv.total)}</TableCell>
                    <TableCell>
                      <StatusBadge label="Đã phát hành" status="success" size="small" variant="soft" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      )}

      {tab === 'expenses' && (
        <BaseCard>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Quản lý Chi phí Bên Thứ Ba & Hạ tầng Vận hành
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Theo dõi định kỳ các dịch vụ: Máy chủ VPS, Tên miền DNS, Email SMTP, AI Tokens, Cloud Storage
              </Typography>
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Hạng mục dịch vụ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nhà cung cấp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Chu kỳ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hạn thanh toán</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Số tiền</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Người duyệt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { name: 'Máy chủ VPS & Node.js Runtime', provider: 'Hetzner Cloud VPS', cycle: 'Hàng tháng', due: '20/11/2026', amount: 320000, status: 'Đã thanh toán', approver: 'Root Admin', isPaid: true },
                  { name: 'Tên miền tichsan.vn & DNS SSL', provider: 'Cloudflare Registrar', cycle: 'Hàng năm', due: '15/05/2027', amount: 240000, status: 'Đã thanh toán', approver: 'Root Admin', isPaid: true },
                  { name: 'Hệ thống Email Xác minh SMTP', provider: 'Resend SMTP', cycle: 'Hàng tháng', due: '30/11/2026', amount: 0, status: 'Gói Free (Đủ quota)', approver: 'Hệ thống', isPaid: true },
                  { name: 'Trợ lý AI & NLP Market Engine', provider: 'Google Gemini Pro / Flash', cycle: 'Theo lưu lượng', due: '05/12/2026', amount: 150000, status: 'Chờ thanh toán', approver: 'Chờ duyệt', isPaid: false },
                  { name: 'Cổng kết nối thanh toán VietQR', provider: 'payOS Merchant Services', cycle: 'Theo giao dịch', due: 'Cuối tháng', amount: 100000, status: 'Đã trích nợ tự động', approver: 'Kế toán', isPaid: true }
                ].map((c, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{c.name}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{c.provider}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{c.cycle}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{c.due}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{money(c.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge label={c.status} status={c.isPaid ? 'success' : 'warning'} size="small" variant="soft" />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{c.approver}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      )}

      {tab === 'tax' && (
        <BaseCard>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Đối soát Thuế & Báo cáo Lợi nhuận
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Báo cáo tài chính nội bộ phục vụ kế toán doanh nghiệp
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Doanh thu thuần (chưa VAT):</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>1.633.635 ₫</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Chi phí hợp lý được trừ:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'error.main' }}>-450.000 ₫</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', pt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Lợi nhuận trước thuế (EBT):</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>1.183.635 ₫</Typography>
            </Box>
          </Box>
        </BaseCard>
      )}
    </Box>
  );
}
