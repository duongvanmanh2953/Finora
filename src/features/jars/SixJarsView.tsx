import React, { useState } from 'react';
import {
  Box,
  Card,
  Paper,
  Typography,
  Chip,
  Button,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ShoppingBag,
  PiggyBank,
  GraduationCap,
  PartyPopper,
  TrendingUp,
  HeartHandshake,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useFinance } from '../../store';
import { money, monthKey } from '../../lib/finance';
import { MuiCurrencyInput, MuiMonthPicker } from '../../components/mui/MuiInputs';
import { Progress } from '../../components/ui';
import { FundLogoBadge } from '../../lib/brandBadges';

interface JarDefinition {
  key: 'nec' | 'ltss' | 'educ' | 'play' | 'ffa' | 'give';
  name: string;
  code: string;
  defaultPct: number;
  description: string;
  color: string;
  icon: React.ComponentType<{ size?: number }>;
}

export const JARS_DATA: JarDefinition[] = [
  {
    key: 'nec',
    name: 'Chi tiêu thiết yếu',
    code: 'NEC (55%)',
    defaultPct: 55,
    description: 'Ăn uống, thuê nhà, điện nước, xăng xe, nhu yếu phẩm hàng ngày',
    color: '#059669',
    icon: ShoppingBag
  },
  {
    key: 'ltss',
    name: 'Tiết kiệm dài hạn',
    code: 'LTSS (10%)',
    defaultPct: 10,
    description: 'Quỹ dự phòng khẩn cấp, mua sắm lớn, bảo hiểm, mục tiêu tương lai',
    color: '#2563eb',
    icon: PiggyBank
  },
  {
    key: 'educ',
    name: 'Giáo dục & Bản thân',
    code: 'EDUC (10%)',
    defaultPct: 10,
    description: 'Mua sách, khóa học, hội thảo, rèn luyện kỹ năng chuyên môn',
    color: '#0891b2',
    icon: GraduationCap
  },
  {
    key: 'play',
    name: 'Hưởng thụ & Giải trí',
    code: 'PLAY (10%)',
    defaultPct: 10,
    description: 'Du lịch, cà phê bạn bè, nhà hàng, xem phim, nuông chiều bản thân',
    color: '#b45309',
    icon: PartyPopper
  },
  {
    key: 'ffa',
    name: 'Tự do tài chính',
    code: 'FFA (10%)',
    defaultPct: 10,
    description: 'Đầu tư sinh lời, cổ phiếu, vàng, kinh doanh (tiền để đẻ ra tiền)',
    color: '#16a34a',
    icon: TrendingUp
  },
  {
    key: 'give',
    name: 'Cho đi & Thiện nguyện',
    code: 'GIVE (5%)',
    defaultPct: 5,
    description: 'Giúp đỡ người thân, từ thiện, quà cáp, hiếu hỉ, chia sẻ may mắn',
    color: '#dc2626',
    icon: HeartHandshake
  }
];

export const SixJarsView: React.FC = () => {
  const data = useFinance(s => s.data)!;
  const update = useFinance(s => s.update);
  const notify = useFinance(s => s.notify);

  const currentMonth = monthKey(new Date());
  const [month, setMonth] = useState(currentMonth);

  // Month transactions
  const monthTransactions = data.transactions.filter(
    t => t.status === 'completed' && t.date.startsWith(month)
  );

  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((n, t) => n + t.amount, 0);

  const monthExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((n, t) => n + t.amount, 0);

  // Custom or default income
  const [customIncome, setCustomIncome] = useState<string>(String(monthIncome || 20000000));
  const [configOpen, setConfigOpen] = useState(false);

  // Jars percentages config
  const savedConfig = data.sixJarsConfig || {
    nec: 55,
    ltss: 10,
    educ: 10,
    play: 10,
    ffa: 10,
    give: 5
  };

  const [percentages, setPercentages] = useState(savedConfig);

  const totalIncomeForJars = Number(customIncome) || monthIncome || 0;
  const totalAllocated = Object.values(percentages).reduce((a, b) => a + b, 0);

  // Estimate actual spending per jar by mapping categories
  const getJarSpending = (jarKey: JarDefinition['key']) => {
    // Map categories to jars
    const matchingCategories = data.categories.filter(c => {
      if (c.type !== 'expense') return false;
      if (c.jarType) return c.jarType === jarKey;
      // Default heuristic
      if (jarKey === 'nec') {
        return c.id === 'food' || c.id === 'transport' || c.id === 'housing' || c.isEssential;
      }
      if (jarKey === 'ltss') return c.id === 'savings' || c.name.toLowerCase().includes('tiết kiệm');
      if (jarKey === 'educ') return c.name.toLowerCase().includes('học') || c.name.toLowerCase().includes('sách');
      if (jarKey === 'play') return c.name.toLowerCase().includes('giải trí') || c.name.toLowerCase().includes('du lịch') || c.name.toLowerCase().includes('mua sắm');
      if (jarKey === 'ffa') return c.name.toLowerCase().includes('đầu tư');
      if (jarKey === 'give') return c.name.toLowerCase().includes('quà') || c.name.toLowerCase().includes('từ thiện');
      return false;
    });

    const categoryIds = new Set(matchingCategories.map(c => c.id));
    return monthTransactions
      .filter(t => t.type === 'expense' && t.categoryId && categoryIds.has(t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleSaveConfig = () => {
    update(d => ({
      ...d,
      sixJarsConfig: percentages
    }));
    notify?.('Đã lưu cấu hình tỷ lệ 6 chiếc hũ thành công!');
    setConfigOpen(false);
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* 1. Executive Hero Header Banner (Beautifully spaced, high visual hierarchy) */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.25, sm: 3 },
          borderRadius: '8px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2.5,
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: 'radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.08), transparent 70%)'
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, flexWrap: 'wrap' }}>
            <Chip
              label="T. HARV EKER METHOD"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            />
            <Chip
              label="Zero-based Budgeting (ZBB)"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 800,
                bgcolor: 'action.hover',
                color: 'text.secondary',
                border: '1px solid var(--border-subtle)'
              }}
            />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 850,
              fontSize: { xs: '1.05rem', sm: '1.25rem' },
              lineHeight: 1.35,
              color: 'text.primary',
              mb: 0.75
            }}
          >
            Phương pháp 6 chiếc hũ (6 Jars) & Zero-based Budgeting
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.82rem', sm: '0.875rem' },
              lineHeight: 1.6,
              maxWidth: 720
            }}
          >
            Phân bổ thu nhập vào 6 quỹ thông minh theo phương pháp quản lý tài chính kinh điển của T. Harv Eker. Mỗi đồng tiền làm ra đều được định danh rõ ràng, không để tiền nằm chết hoặc thất thoát vô định.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap', flexShrink: 0 }}>
          <MuiMonthPicker label="Kỳ ngân sách" value={month} onChange={setMonth} />
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Sliders size={15} />}
            onClick={() => setConfigOpen(true)}
            sx={{
              fontWeight: 750,
              fontSize: '0.82rem',
              textTransform: 'none',
              borderRadius: '6px',
              px: 1.75,
              py: 0.85,
              borderColor: 'var(--border-subtle)',
              whiteSpace: 'nowrap'
            }}
          >
            Tùy chỉnh % hũ
          </Button>
        </Box>
      </Paper>

      {/* 2. Three Harmonized Executive KPI Metric Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3.5
        }}
      >
        {/* Card 1: Target Allocatable Income */}
        <Card
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '8px',
            bgcolor: 'background.paper',
            borderColor: 'var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 1.5,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.04em' }}>
                THU NHẬP ĐỂ PHÂN BỔ VÀO 6 HŨ
              </Typography>
              <Chip
                label={`Tháng ${month}`}
                size="small"
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
              />
            </Box>
            <MuiCurrencyInput
              label="Mức thu nhập phân bổ (₫)"
              value={customIncome}
              onChange={val => setCustomIncome(val)}
              helperText="Tùy biến theo lương tháng thực nhận"
            />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem' }}>
            Toàn bộ số tiền này sẽ được tự động chia tỷ lệ cho 6 quỹ bên dưới.
          </Typography>
        </Card>

        {/* Card 2: ZBB 100% Status */}
        <Card
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '8px',
            bgcolor: 'background.paper',
            borderColor: totalAllocated === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 1.5
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.04em' }}>
                TRIẾT LÝ ZERO-BASED (ZBB)
              </Typography>
              <Chip
                label={totalAllocated === 100 ? '100% ĐÃ GÁN MỤC TIÊU' : `TỔNG TỶ LỆ ${totalAllocated}%`}
                size="small"
                color={totalAllocated === 100 ? 'success' : 'error'}
                variant="outlined"
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 0.5 }}>
              <CheckCircle2 size={24} style={{ color: totalAllocated === 100 ? '#10B981' : '#EF4444', flexShrink: 0 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 850, fontSize: '1.05rem', color: 'text.primary', lineHeight: 1.3 }}>
                  {money(totalIncomeForJars)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem' }}>
                  {totalAllocated === 100 ? '6/6 hũ phân bổ cân bằng tuyệt đối' : 'Cần điều chỉnh tỷ lệ về đúng 100%'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem', pt: 1, borderTop: '1px solid var(--border-subtle)' }}>
            Nguyên tắc cốt lõi: Thu nhập - Phân bổ = 0 ₫ (Không để đồng nào trôi nổi).
          </Typography>
        </Card>

        {/* Card 3: Actual Spending Velocity */}
        <Card
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '8px',
            bgcolor: 'background.paper',
            borderColor: 'var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 1.5
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.04em' }}>
                THỰC CHI THÁNG {month}
              </Typography>
              <Chip
                label={`${totalIncomeForJars > 0 ? Math.round((monthExpense / totalIncomeForJars) * 100) : 0}% thu nhập`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  bgcolor: (monthExpense > totalIncomeForJars && totalIncomeForJars > 0) ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  color: (monthExpense > totalIncomeForJars && totalIncomeForJars > 0) ? '#EF4444' : '#10B981'
                }}
              />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 850, color: 'text.primary', mb: 0.5, fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums' }}>
              {money(monthExpense)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem' }}>
              Còn lại khả dụng: <strong>{money(Math.max(0, totalIncomeForJars - monthExpense))}</strong>
            </Typography>
          </Box>
          <Box sx={{ pt: 1, borderTop: '1px solid var(--border-subtle)' }}>
            <Progress
              value={totalIncomeForJars > 0 ? Math.min(100, Math.round((monthExpense / totalIncomeForJars) * 100)) : 0}
              color={monthExpense > totalIncomeForJars ? '#EF4444' : '#10B981'}
            />
          </Box>
        </Card>
      </Box>

      {/* 3. The 6 Jars Modern Responsive Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2.25
        }}
      >
        {JARS_DATA.map(jar => {
          const pct = percentages[jar.key] || jar.defaultPct;
          const allocatedMoney = Math.round((totalIncomeForJars * pct) / 100);
          const spentMoney = getJarSpending(jar.key);
          const spentPct = allocatedMoney > 0 ? Math.round((spentMoney / allocatedMoney) * 100) : 0;
          const remainingMoney = Math.max(0, allocatedMoney - spentMoney);

          return (
            <Card
              variant="outlined"
              key={jar.key}
              sx={{
                borderRadius: '8px',
                p: 2.5,
                bgcolor: 'background.paper',
                borderColor: 'var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  borderColor: jar.color,
                  boxShadow: `0 4px 16px ${jar.color}15`
                }
              }}
            >
              <Box>
                {/* Top Row: Brand Badge + Percentage Chip */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <FundLogoBadge name={jar.name} kind={jar.key} size="medium" />
                  <Chip
                    label={`${pct}% Thu nhập`}
                    size="small"
                    sx={{
                      fontWeight: 850,
                      fontSize: '0.72rem',
                      bgcolor: `${jar.color}15`,
                      color: jar.color,
                      border: `1px solid ${jar.color}30`
                    }}
                  />
                </Box>

                {/* Name & Description */}
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', mb: 0.5, color: 'text.primary' }}>
                  {jar.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2, minHeight: 36, lineHeight: 1.5 }}>
                  {jar.description}
                </Typography>

                {/* Target Allocated Limit */}
                <Box sx={{ mb: 1.75 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      fontSize: '1.3rem',
                      fontFeatureSettings: '"tnum"',
                      fontVariantNumeric: 'tabular-nums',
                      color: 'text.primary',
                      mb: 0.25
                    }}
                  >
                    {money(allocatedMoney)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.74rem' }}>
                    Hạn mức phân bổ tháng {month}
                  </Typography>
                </Box>

                {/* Visual Progress Bar */}
                <Progress
                  value={spentPct}
                  color={spentPct >= 100 ? '#dc2626' : spentPct >= 80 ? '#d97706' : jar.color}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontSize: 11.5, color: 'text.secondary' }}>
                  <span>Đã chi: <strong>{money(spentMoney)}</strong> ({spentPct}%)</span>
                  <span>Còn: <strong>{money(remainingMoney)}</strong></span>
                </Box>
              </Box>

              {/* Status Note Footer */}
              <Box sx={{ mt: 2, pt: 1.25, borderTop: '1px solid var(--border-subtle)' }}>
                {spentPct > 100 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#dc2626', fontSize: 11.5, fontWeight: 750 }}>
                    <AlertTriangle size={14} />
                    <span>Đã vượt hũ {money(spentMoney - allocatedMoney)}</span>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#10B981', fontSize: 11.5, fontWeight: 700 }}>
                    <CheckCircle2 size={14} />
                    <span>Hũ hoạt động an toàn ({100 - spentPct}% khả dụng)</span>
                  </Box>
                )}
              </Box>
            </Card>
          );
        })}
      </Box>

      {/* Percentage Customization Dialog */}
      <Dialog open={configOpen} onClose={() => setConfigOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Tùy chỉnh tỷ lệ 6 chiếc hũ (%)
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2.5, pt: '16px !important' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
            Tổng tỷ lệ các hũ phải bằng 100%. Tỷ lệ mặc định chuẩn là: Thiết yếu 55%, Tiết kiệm 10%, Giáo dục 10%, Hưởng thụ 10%, Tự do 10%, Cho đi 5%.
          </Typography>

          {JARS_DATA.map(jar => (
            <Box key={jar.key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {jar.name} ({jar.key.toUpperCase()})
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: jar.color }}>
                  {percentages[jar.key]}%
                </Typography>
              </Box>
              <Slider
                value={percentages[jar.key]}
                min={0}
                max={80}
                step={1}
                onChange={(_, val) => setPercentages({ ...percentages, [jar.key]: val as number })}
                sx={{ color: jar.color }}
              />
            </Box>
          ))}

          <Box sx={{ p: 1.5, borderRadius: '6px', bgcolor: totalAllocated === 100 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', textAlign: 'center', border: '1px solid', borderColor: totalAllocated === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: totalAllocated === 100 ? '#10B981' : '#dc2626' }}>
              Tổng tỷ lệ: {totalAllocated}% {totalAllocated === 100 ? '(Hợp lệ 100%)' : '(Cần điều chỉnh về đúng 100%)'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfigOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={totalAllocated !== 100}
            onClick={handleSaveConfig}
          >
            Lưu tỷ lệ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
