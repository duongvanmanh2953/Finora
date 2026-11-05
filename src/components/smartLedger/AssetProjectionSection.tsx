import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Slider
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AutoGraphRounded from '@mui/icons-material/AutoGraphRounded';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid
} from 'recharts';

import { money } from '../../lib/finance';
import { generateThreeScenarioProjections } from '../../lib/investmentProjectionEngine';
import { FullscreenModal, FullscreenButton } from '../ui/FullscreenModal';

interface AssetProjectionSectionProps {
  currentNetWorth: number;
  initialMonthlySavings?: number;
  initialExpectedRate?: number;
}

export function AssetProjectionSection({
  currentNetWorth,
  initialMonthlySavings = 5000000,
  initialExpectedRate = 8.5
}: AssetProjectionSectionProps) {
  const [monthlySavings, setMonthlySavings] = useState<number>(initialMonthlySavings);
  const [expectedRate, setExpectedRate] = useState<number>(initialExpectedRate);
  const [inflationRate, setInflationRate] = useState<number>(3.5);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const projections = generateThreeScenarioProjections(
    currentNetWorth,
    monthlySavings,
    expectedRate,
    inflationRate
  );

  const chartData = projections.map(p => ({
    name: p.milestoneLabel,
    vonTichLuy: p.cumulativeSelfSaved,
    thanTrong: p.conservativeValue,
    coSo: p.baseValue,
    tichCuc: p.optimisticValue,
    sucMuaThucTe: p.purchasingPowerAdjusted
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <Paper
          elevation={4}
          sx={{
            p: 1.5,
            borderRadius: '4px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            fontSize: '0.8rem',
            minWidth: 220
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>
            Mốc thời gian: {label}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <span style={{ color: '#64748B' }}>Vốn tự tích lũy:</span>
              <strong>{money(dataPoint.vonTichLuy)}</strong>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <span style={{ color: '#3B82F6' }}>Kịch bản Thận trọng:</span>
              <strong>{money(dataPoint.thanTrong)}</strong>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <span style={{ color: '#10B981' }}>Kịch bản Cơ sở ({expectedRate}%):</span>
              <strong style={{ color: '#10B981' }}>{money(dataPoint.coSo)}</strong>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <span style={{ color: '#8B5CF6' }}>Kịch bản Tích cực:</span>
              <strong>{money(dataPoint.tichCuc)}</strong>
            </Box>
            <Box sx={{ pt: 0.75, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <span style={{ color: '#D97706' }}>Sức mua sau lạm phát:</span>
              <strong style={{ color: '#D97706' }}>{money(dataPoint.sucMuaThucTe)}</strong>
            </Box>
          </Box>
        </Paper>
      );
    }
    return null;
  };

  const renderProjectionChart = (height: number | `${number}%` = 280) => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
        <YAxis
          tickFormatter={v => `${(v / 1000000).toFixed(0)}tr`}
          tick={{ fontSize: 10 }}
          width={52}
        />
        <RechartsTooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '0.74rem', fontWeight: 600, paddingTop: '8px' }}
          formatter={value => (
            <span style={{ color: 'inherit' }}>
              {value === 'vonTichLuy'
                ? 'Vốn tự tích lũy'
                : value === 'thanTrong'
                ? 'Kịch bản Thận trọng'
                : value === 'coSo'
                ? `Kịch bản Cơ sở (${expectedRate}%)`
                : value === 'tichCuc'
                ? 'Kịch bản Tích cực'
                : 'Sức mua sau lạm phát'}
            </span>
          )}
        />
        <Line type="monotone" dataKey="vonTichLuy" stroke="#64748B" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="thanTrong" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="coSo" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="tichCuc" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="sucMuaThucTe" stroke="#D97706" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2.5 },
        borderRadius: '6px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      {/* 1. Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <AutoGraphRounded sx={{ color: 'primary.main', fontSize: 20, flexShrink: 0 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: '0.88rem', sm: '0.95rem' }, lineHeight: 1.3 }}>
            Phóng Chiếu Tài Sản & Dòng Tiền Tương Lai
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Chip
            size="small"
            label="Lãi kép 3 kịch bản"
            variant="outlined"
            sx={{ borderRadius: '4px', fontWeight: 650, fontSize: '0.72rem', height: 22 }}
          />
          <FullscreenButton
            onClick={() => setFullscreenOpen(true)}
            title="Xem biểu đồ toàn màn hình (Mặc định xoay ngang 90° trên Mobile)"
          />
        </Box>
      </Box>

      {/* 2. Interactive Parameter Sliders */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: '4px',
          bgcolor: 'action.hover',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary' }}>
              TIẾT KIỆM TÍCH LŨY MỖI THÁNG
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {money(monthlySavings)}
            </Typography>
          </Box>
          <Slider
            size="small"
            value={monthlySavings}
            min={0}
            max={30000000}
            step={1000000}
            onChange={(_, v) => setMonthlySavings(v as number)}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary' }}>
              LỢI SUẤT KỲ VỌNG CƠ SỞ / NĂM
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981' }}>
              {expectedRate.toFixed(1)}%
            </Typography>
          </Box>
          <Slider
            size="small"
            value={expectedRate}
            min={3}
            max={25}
            step={0.5}
            onChange={(_, v) => setExpectedRate(v as number)}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary' }}>
              TỶ LỆ LẠM PHÁT DỰ TÍNH / NĂM
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#D97706' }}>
              {inflationRate.toFixed(1)}%
            </Typography>
          </Box>
          <Slider
            size="small"
            value={inflationRate}
            min={1}
            max={8}
            step={0.5}
            onChange={(_, v) => setInflationRate(v as number)}
          />
        </Box>
      </Paper>

      {/* 3. Multi-Scenario Line Chart */}
      <Box sx={{ width: '100%', height: { xs: 260, sm: 290 }, maxWidth: '100%', overflow: 'hidden' }}>
        {renderProjectionChart()}
      </Box>

      {/* 4. Milestone Summary Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: '4px',
          border: '1px solid',
          borderColor: 'divider',
          overflowX: 'auto',
          maxWidth: '100%'
        }}
      >
        <Table size="small" sx={{ minWidth: 540 }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>MỐC THỜI GIAN</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>VỐN TÍCH LŨY</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>THẬN TRỌNG</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#10B981', whiteSpace: 'nowrap' }}>CƠ SỞ ({expectedRate}%)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>TÍCH CỰC</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#D97706', whiteSpace: 'nowrap' }}>SỨC MUA THỰC</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projections.map(p => (
              <TableRow key={p.milestoneKey} hover>
                <TableCell sx={{ fontWeight: 750, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {p.milestoneLabel} {p.months > 0 ? `(+${p.months} tháng)` : ''}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {money(p.cumulativeSelfSaved)}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#3B82F6', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {money(p.conservativeValue)}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#059669', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {money(p.baseValue)}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#8B5CF6', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {money(p.optimisticValue)}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {money(p.purchasingPowerAdjusted)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 5. Mandatory Disclaimer Alert */}
      <Alert
        severity="info"
        variant="outlined"
        icon={<InfoOutlinedIcon fontSize="inherit" />}
        sx={{
          borderRadius: '4px',
          fontSize: '0.78rem',
          lineHeight: 1.5,
          py: 0.75
        }}
      >
        <strong>Khuyến cáo pháp lý:</strong> Đây là kết quả mô phỏng toán học dựa trên các giả định đầu vào do bạn thiết lập. Số liệu mang tính tham khảo dự phóng, không phải cam kết lợi nhuận thực tế.
      </Alert>

      {/* Fullscreen Chart Modal (Defaults to 90deg Landscape on Mobile) */}
      <FullscreenModal
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        title="Phóng Chiếu Tài Sản & Dòng Tiền Tương Lai (3 Kịch Bản)"
        subtitle="Mô hình lãi kép 3 kịch bản: Thận trọng, Cơ sở và Tích cực, bù trừ theo tỷ lệ lạm phát (Hỗ trợ xoay ngang 90°)"
      >
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 2 } }}>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {renderProjectionChart('100%')}
          </Box>
        </Box>
      </FullscreenModal>
    </Paper>
  );
}
