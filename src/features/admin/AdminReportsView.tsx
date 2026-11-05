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
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Download
} from 'lucide-react';
import { BaseCard } from '../../components/ui/CardVariants';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FinoraButton } from '../../components/ui/FinoraButton';

export function AdminReportsView() {
  const [reportCategory, setReportCategory] = useState<'business' | 'financial' | 'accounting' | 'infra'>('business');
  const [period, setPeriod] = useState('2026-Q4');

  const handleExportCsv = (name: string) => {
    const csvContent = "data:text/csv;charset=utf-8,Mã,Danh mục,Giá trị,Thời gian\n1,Doanh thu MRR,104200000,2026-11\n2,Chi phí vận hành,450000,2026-11\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Finora_Admin_Report_${name}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Report Header & Filter Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Trung Tâm Báo Cáo Điều Hành & Kế Toán SaaS
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Xuất dữ liệu chuẩn báo cáo tài chính, thuế GTGT và phân tích tăng trưởng
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Kỳ báo cáo</InputLabel>
            <Select value={period} label="Kỳ báo cáo" onChange={e => setPeriod(e.target.value)}>
              <MenuItem value="2026-11">Tháng 11 / 2026</MenuItem>
              <MenuItem value="2026-10">Tháng 10 / 2026</MenuItem>
              <MenuItem value="2026-Q4">Quý IV / 2026</MenuItem>
              <MenuItem value="2026-YEAR">Cả năm 2026</MenuItem>
            </Select>
          </FormControl>

          <FinoraButton
            variant="primary"
            size="small"
            startIcon={<Download size={14} />}
            onClick={() => handleExportCsv(reportCategory)}
          >
            Xuất CSV / Excel
          </FinoraButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={reportCategory}
          onChange={(_, v) => setReportCategory(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTabs-scroller': { overflowX: 'auto !important' },
            '& .MuiTab-root': { whiteSpace: 'nowrap', flexShrink: 0 }
          }}
        >
          <Tab value="business" label="1. Báo cáo Tăng trưởng & Khách hàng" />
          <Tab value="financial" label="2. Báo cáo Doanh thu & MRR / ARR" />
          <Tab value="accounting" label="3. Kế toán, Hóa đơn & Thuế VAT" />
          <Tab value="infra" label="4. Hạ tầng & Uptime Hệ thống" />
        </Tabs>
      </Box>

      {reportCategory === 'business' && (
        <BaseCard>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Chỉ số Thu hút & Tỷ lệ Giữ chân Khách hàng (Cohort Retention)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Đo lường mức độ tương tác và tốc độ gia tăng thuê bao trả phí
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Chỉ số đo lường</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Kỳ hiện tại ({period})</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Kỳ trước</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tăng trưởng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Đánh giá mục tiêu</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Người dùng mới đăng ký</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>370 tài khoản</TableCell>
                  <TableCell>290 tài khoản</TableCell>
                  <TableCell sx={{ color: 'success.main', fontWeight: 800 }}>+27.5%</TableCell>
                  <TableCell><StatusBadge label="Vượt chỉ tiêu" status="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tỷ lệ chuyển đổi Free ➔ Pro</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>25.4%</TableCell>
                  <TableCell>21.2%</TableCell>
                  <TableCell sx={{ color: 'success.main', fontWeight: 800 }}>+4.2%</TableCell>
                  <TableCell><StatusBadge label="Rất tốt" status="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tỷ lệ rời bỏ (Monthly Churn)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>1.4%</TableCell>
                  <TableCell>2.0%</TableCell>
                  <TableCell sx={{ color: 'success.main', fontWeight: 800 }}>-0.6%</TableCell>
                  <TableCell><StatusBadge label="Cực an toàn" status="success" size="small" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      )}

      {reportCategory === 'financial' && (
        <BaseCard>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Đối soát Doanh thu & Cổng Thanh toán
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Chi tiết dòng tiền thực nhận từ các ngân hàng qua mã VietQR
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Khoản mục doanh thu</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Số tiền</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tỷ trọng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tình trạng đối soát</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Thuê bao Finora Pro Năm</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>77.870.000 ₫</TableCell>
                  <TableCell>74.7%</TableCell>
                  <TableCell><StatusBadge label="Đã khớp 100%" status="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Thuê bao Finora Pro Tháng</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>26.330.000 ₫</TableCell>
                  <TableCell>25.3%</TableCell>
                  <TableCell><StatusBadge label="Đã khớp 100%" status="success" size="small" /></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 800 }}>TỔNG DOANH THU THỰC NHẬN</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main', fontSize: 15 }}>104.200.000 ₫</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>100%</TableCell>
                  <TableCell><StatusBadge label="Đã chốt sổ" status="success" size="small" variant="dot" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      )}

      {reportCategory === 'accounting' && (
        <BaseCard>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Kê khai Thuế Giá Trị Gia Tăng (VAT) & Khấu trừ
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Phục vụ lập tờ khai thuế mẫu 01/GTGT gửi Cơ quan Thuế
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Chỉ tiêu thuế</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Doanh số (Chưa thuế)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Thuế GTGT (10%)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ghi chú kế toán</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Hàng hóa, dịch vụ bán ra chịu thuế 10%</TableCell>
                  <TableCell align="right">94.727.273 ₫</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main' }}>9.472.727 ₫</TableCell>
                  <TableCell>Thuế đầu ra (Output VAT)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Hàng hóa, dịch vụ mua vào (Máy chủ, API)</TableCell>
                  <TableCell align="right">3.500.000 ₫</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'success.main' }}>350.000 ₫</TableCell>
                  <TableCell>Thuế đầu vào được khấu trừ</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 800 }}>THUẾ GTGT CÒN PHẢI NỘP NGÂN SÁCH</TableCell>
                  <TableCell align="right">—</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main', fontSize: 15 }}>9.122.727 ₫</TableCell>
                  <TableCell><StatusBadge label="Sẵn sàng nộp thuế" status="info" size="small" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      )}

      {reportCategory === 'infra' && (
        <BaseCard>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Hiệu năng Kỹ thuật & Độ sẵn sàng Hệ thống (Uptime 99.98%)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Theo dõi tải máy chủ, độ trễ API và tần suất sao lưu dữ liệu
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '4px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Độ trễ trung bình API</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>42ms</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '4px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Tỷ lệ lỗi HTTP 5xx</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>0.01%</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '4px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Bản sao lưu gần nhất</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>30 phút trước</Typography>
            </Box>
          </Box>
        </BaseCard>
      )}
    </Box>
  );
}
