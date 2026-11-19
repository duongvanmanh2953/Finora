import { useState, useMemo } from 'react';
import type { MouseEvent } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  Drawer,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Scale,
  Plus,
  Filter,
  Pencil,
  Trash2,
  Eye,
  Clock,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useFinance } from '../../store';
import { money } from '../../lib/finance';
import {
  generateSmartCalendar,
  formatCompactCalendarMoney,
  type CalendarDayCell,
  type CalendarFilterOptions
} from '../../lib/calendarEngine';
import { CategoryAvatarBadge } from '../../lib/brandBadges';
import type { Transaction, TxType } from '../../types';

export interface SmartCalendarViewProps {
  onAddTransaction?: (defaultDate: string, type?: TxType) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onViewTransaction?: (tx: Transaction) => void;
}

const WEEKDAY_NAMES = [
  { key: 't2', label: 'T2', full: 'Thứ 2' },
  { key: 't3', label: 'T3', full: 'Thứ 3' },
  { key: 't4', label: 'T4', full: 'Thứ 4' },
  { key: 't5', label: 'T5', full: 'Thứ 5' },
  { key: 't6', label: 'T6', full: 'Thứ 6' },
  { key: 't7', label: 'T7', full: 'Thứ 7' },
  { key: 'cn', label: 'CN', full: 'Chủ nhật' }
];

export function SmartCalendarView({
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onViewTransaction
}: SmartCalendarViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';

  const { data } = useFinance();
  const transactions = useMemo(() => data?.transactions || [], [data?.transactions]);
  const accounts = useMemo(() => data?.accounts || [], [data?.accounts]);
  const categories = useMemo(() => data?.categories || [], [data?.categories]);

  // Current selected month
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const monthKey = useMemo(() => format(currentDate, 'yyyy-MM'), [currentDate]);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Selected date cell for details drawer
  const [selectedDay, setSelectedDay] = useState<CalendarDayCell | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Generate calendar month data memoized
  const calendarSummary = useMemo(() => {
    const filters: CalendarFilterOptions = {
      typeFilter,
      accountId: accountFilter,
      categoryId: categoryFilter
    };
    return generateSmartCalendar(monthKey, transactions, filters);
  }, [monthKey, transactions, typeFilter, accountFilter, categoryFilter]);

  // Keep selectedDay synchronized if transactions update
  const currentSelectedDayCell = useMemo(() => {
    if (!selectedDay) return null;
    return calendarSummary.days.find(d => d.date === selectedDay.date) || selectedDay;
  }, [selectedDay, calendarSummary]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const todayStr = format(now, 'yyyy-MM-dd');
    const dayCell = calendarSummary.days.find(d => d.date === todayStr);
    if (dayCell) {
      setSelectedDay(dayCell);
      setDetailDrawerOpen(true);
    }
  };

  // Day cell click handler
  const handleDayClick = (cell: CalendarDayCell) => {
    setSelectedDay(cell);
    setDetailDrawerOpen(true);
  };

  // Double click / quick add handler for a specific day
  const handleQuickAddForDay = (cell: CalendarDayCell, e: MouseEvent, type: TxType = 'expense') => {
    e.stopPropagation();
    if (onAddTransaction) {
      onAddTransaction(cell.date, type);
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 1. TOP MONTH OVERVIEW HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: '16px',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 2px 12px rgba(15, 23, 42, 0.04)'
        }}
      >
        {/* Navigation & Month Title */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            mb: 2.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: 'rgba(53, 94, 82, 0.1)',
                color: 'var(--brand-primary, #355E52)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CalendarDays size={22} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  lineHeight: 1.2
                }}
              >
                Tháng {format(currentDate, 'MM / yyyy')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Lịch thu chi trực quan & đối soát thông minh
              </Typography>
            </Box>
          </Box>

          {/* Action buttons: Prev, Today, Next */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleGoToday}
              startIcon={<Clock size={14} />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                color: 'text.primary',
                px: 1.5,
                py: 0.5
              }}
            >
              Hôm nay
            </Button>
            <IconButton
              size="small"
              onClick={handlePrevMonth}
              sx={{
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                borderRadius: '8px',
                p: 0.75
              }}
              title="Tháng trước"
            >
              <ChevronLeft size={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleNextMonth}
              sx={{
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                borderRadius: '8px',
                p: 0.75
              }}
              title="Tháng sau"
            >
              <ChevronRight size={18} />
            </IconButton>
          </Box>
        </Box>

        {/* 4 Summary Stat Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 1.5
          }}
        >
          {/* Total Income */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)',
              border: '1px solid',
              borderColor: 'rgba(16, 185, 129, 0.2)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <TrendingUp size={16} color="#10b981" />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Tổng thu tháng
              </Typography>
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 750,
                color: '#10b981',
                fontSize: { xs: '1rem', sm: '1.15rem' }
              }}
            >
              +{money(calendarSummary.totalMonthIncome)}
            </Typography>
          </Box>

          {/* Total Expense */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(244, 63, 94, 0.08)' : 'rgba(244, 63, 94, 0.06)',
              border: '1px solid',
              borderColor: 'rgba(244, 63, 94, 0.2)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <TrendingDown size={16} color="#f43f5e" />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Tổng chi tháng
              </Typography>
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 750,
                color: '#f43f5e',
                fontSize: { xs: '1rem', sm: '1.15rem' }
              }}
            >
              -{money(calendarSummary.totalMonthExpense)}
            </Typography>
          </Box>

          {/* Net Cashflow */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isDark
                ? calendarSummary.netCashflow >= 0
                  ? 'rgba(59, 130, 246, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)'
                : calendarSummary.netCashflow >= 0
                ? 'rgba(59, 130, 246, 0.06)'
                : 'rgba(239, 68, 68, 0.06)',
              border: '1px solid',
              borderColor:
                calendarSummary.netCashflow >= 0
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <Scale
                size={16}
                color={calendarSummary.netCashflow >= 0 ? '#3b82f6' : '#ef4444'}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Chênh lệch thu chi
              </Typography>
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 750,
                color: calendarSummary.netCashflow >= 0 ? '#3b82f6' : '#ef4444',
                fontSize: { xs: '1rem', sm: '1.15rem' }
              }}
            >
              {calendarSummary.netCashflow >= 0 ? '+' : ''}
              {money(calendarSummary.netCashflow)}
            </Typography>
          </Box>

          {/* Active Transaction Days */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(108, 99, 181, 0.08)' : 'rgba(108, 99, 181, 0.06)',
              border: '1px solid',
              borderColor: 'rgba(108, 99, 181, 0.2)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <Sparkles size={16} color="#6C63B5" />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Ngày có giao dịch
              </Typography>
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 750,
                color: '#6C63B5',
                fontSize: { xs: '1rem', sm: '1.15rem' }
              }}
            >
              {calendarSummary.activeDaysCount} ngày
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 2. SYNCHRONIZED CALENDAR FILTER BAR */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: '12px',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
          <Filter size={16} />
          <Typography variant="caption" sx={{ fontWeight: 650, textTransform: 'uppercase' }}>
            Bộ lọc:
          </Typography>
        </Box>

        {/* Type Filter Buttons */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {(['all', 'income', 'expense'] as const).map(f => (
            <Chip
              key={f}
              label={f === 'all' ? 'Tất cả' : f === 'income' ? 'Chỉ Thu' : 'Chỉ Chi'}
              size="small"
              onClick={() => setTypeFilter(f)}
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                bgcolor:
                  typeFilter === f
                    ? f === 'income'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : f === 'expense'
                      ? 'rgba(244, 63, 94, 0.15)'
                      : 'var(--brand-primary, #355E52)'
                    : 'transparent',
                color:
                  typeFilter === f
                    ? f === 'income'
                      ? '#10b981'
                      : f === 'expense'
                      ? '#f43f5e'
                      : '#FFFFFF'
                    : 'text.secondary',
                border: '1px solid',
                borderColor:
                  typeFilter === f
                    ? f === 'income'
                      ? '#10b981'
                      : f === 'expense'
                      ? '#f43f5e'
                      : 'var(--brand-primary, #355E52)'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : '#CBD5E1'
              }}
            />
          ))}
        </Box>

        {/* Account Filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
            displayEmpty
            sx={{
              height: 32,
              fontSize: '0.8rem',
              borderRadius: '8px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF'
            }}
          >
            <MenuItem value="all">Tất cả tài khoản / ví</MenuItem>
            {accounts.map(acc => (
              <MenuItem key={acc.id} value={acc.id}>
                {acc.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Category Filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            displayEmpty
            sx={{
              height: 32,
              fontSize: '0.8rem',
              borderRadius: '8px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF'
            }}
          >
            <MenuItem value="all">Tất cả danh mục</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* 3. CALENDAR 7-COLUMN GRID */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
          boxShadow: isDark
            ? '0 4px 24px rgba(0, 0, 0, 0.4)'
            : '0 4px 20px rgba(15, 23, 42, 0.06)'
        }}
      >
        {/* Days of Week Header: T2, T3, T4, T5, T6, T7, CN */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#CBD5E1',
            py: 1
          }}
        >
          {WEEKDAY_NAMES.map(w => (
            <Typography
              key={w.key}
              variant="caption"
              align="center"
              sx={{
                fontWeight: 700,
                color: w.key === 'cn' ? '#ef4444' : 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.85rem' }
              }}
            >
              {isMobile ? w.label : w.full}
            </Typography>
          ))}
        </Box>

        {/* Calendar Day Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '1px',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'
          }}
        >
          {calendarSummary.days.map(cell => {
            const hasIncome = cell.totalIncome > 0;
            const hasExpense = cell.totalExpense > 0;
            const isSelected = selectedDay?.date === cell.date;

            return (
              <Box
                key={cell.date}
                onClick={() => handleDayClick(cell)}
                sx={{
                  bgcolor: isSelected
                    ? isDark
                      ? 'rgba(53, 94, 82, 0.25)'
                      : 'rgba(53, 94, 82, 0.1)'
                    : cell.isCurrentMonth
                    ? isDark
                      ? '#161B22'
                      : '#FFFFFF'
                    : isDark
                    ? '#0D1117'
                    : '#F8FAFC',
                  minHeight: { xs: 72, sm: 96, md: 104 },
                  p: { xs: 0.5, sm: 1 },
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  outline: isSelected ? '2px solid var(--brand-primary, #355E52)' : 'none',
                  outlineOffset: '-2px',
                  opacity: cell.isCurrentMonth ? 1 : 0.38,
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(53, 94, 82, 0.05)'
                  }
                }}
              >
                {/* Day Header (Day number + Today badge) */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 22, sm: 26 },
                      height: { xs: 22, sm: 26 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: { xs: '0.75rem', sm: '0.85rem' },
                      fontWeight: cell.isToday ? 800 : cell.isCurrentMonth ? 650 : 400,
                      bgcolor: cell.isToday
                        ? 'var(--brand-primary, #355E52)'
                        : 'transparent',
                      color: cell.isToday
                        ? '#FFFFFF'
                        : cell.isCurrentMonth
                        ? 'text.primary'
                        : 'text.disabled',
                      boxShadow: cell.isToday ? '0 2px 6px rgba(53, 94, 82, 0.4)' : 'none'
                    }}
                  >
                    {cell.dayNumber}
                  </Box>

                  {/* Transaction count indicator badge on desktop */}
                  {cell.transactionCount > 0 && !isMobile && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: 'text.secondary',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        px: 0.6,
                        py: 0.1,
                        borderRadius: '4px'
                      }}
                    >
                      {cell.transactionCount} gd
                    </Typography>
                  )}
                </Box>

                {/* Direct Income & Expense Badges */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    overflow: 'hidden',
                    my: 0.5
                  }}
                >
                  {/* + Income (Green) */}
                  {hasIncome && (
                    <Tooltip title={`Thu nhập: +${money(cell.totalIncome)}`} arrow placement="top">
                      <Box
                        sx={{
                          fontSize: { xs: '0.68rem', sm: '0.78rem' },
                          fontWeight: 700,
                          color: '#10b981',
                          bgcolor: isDark
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(16, 185, 129, 0.09)',
                          px: { xs: 0.5, sm: 0.75 },
                          py: 0.15,
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.2
                        }}
                      >
                        {formatCompactCalendarMoney(cell.totalIncome, 'income')}
                      </Box>
                    </Tooltip>
                  )}

                  {/* - Expense (Red) */}
                  {hasExpense && (
                    <Tooltip title={`Chi tiêu: -${money(cell.totalExpense)}`} arrow placement="bottom">
                      <Box
                        sx={{
                          fontSize: { xs: '0.68rem', sm: '0.78rem' },
                          fontWeight: 700,
                          color: '#f43f5e',
                          bgcolor: isDark
                            ? 'rgba(244, 63, 94, 0.12)'
                            : 'rgba(244, 63, 94, 0.09)',
                          px: { xs: 0.5, sm: 0.75 },
                          py: 0.15,
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.2
                        }}
                      >
                        {formatCompactCalendarMoney(cell.totalExpense, 'expense')}
                      </Box>
                    </Tooltip>
                  )}
                </Box>

                {/* Subtle Quick Add button on hover (desktop only) */}
                {!isMobile && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      opacity: 0,
                      transition: 'opacity 0.15s ease',
                      '.MuiBox-root:hover > &': {
                        opacity: 1
                      }
                    }}
                  >
                    <Tooltip title="Thêm giao dịch ngày này" arrow>
                      <IconButton
                        size="small"
                        onClick={e => handleQuickAddForDay(cell, e, 'expense')}
                        sx={{
                          p: 0.25,
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F1F5F9',
                          '&:hover': {
                            bgcolor: 'var(--brand-primary, #355E52)',
                            color: '#FFFFFF'
                          }
                        }}
                      >
                        <Plus size={13} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* 4. DAY TRANSACTIONS DETAIL DRAWER / BOTTOM SHEET */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={detailDrawerOpen && !!currentSelectedDayCell}
        onClose={() => setDetailDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 440, md: 480 },
              maxHeight: { xs: '85vh', sm: '100vh' },
              borderTopLeftRadius: { xs: 20, sm: 0 },
              borderTopRightRadius: { xs: 20, sm: 0 },
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              bgcolor: isDark ? '#161B22' : '#FFFFFF',
              backgroundImage: 'none'
            }
          }
        }}
      >
        {currentSelectedDayCell && (
          <>
            {/* Drawer Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 750 }}>
                  {format(parseISO(currentSelectedDayCell.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {currentSelectedDayCell.transactionCount} giao dịch phát sinh
                </Typography>
              </Box>
              <IconButton onClick={() => setDetailDrawerOpen(false)} size="small">
                ✕
              </IconButton>
            </Box>

            {/* Daily Net Summary */}
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
                textAlign: 'center'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Tổng thu
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#10b981' }}>
                  +{money(currentSelectedDayCell.totalIncome)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Tổng chi
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#f43f5e' }}>
                  -{money(currentSelectedDayCell.totalExpense)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Chênh lệch
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 750,
                    color: currentSelectedDayCell.netDifference >= 0 ? '#3b82f6' : '#ef4444'
                  }}
                >
                  {currentSelectedDayCell.netDifference >= 0 ? '+' : ''}
                  {money(currentSelectedDayCell.netDifference)}
                </Typography>
              </Box>
            </Box>

            {/* Quick Action Buttons: + Thu, + Chi */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                fullWidth
                variant="outlined"
                color="success"
                startIcon={<Plus size={16} />}
                onClick={() => {
                  if (onAddTransaction) {
                    onAddTransaction(currentSelectedDayCell.date, 'income');
                  }
                }}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 650 }}
              >
                + Thu nhập
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="error"
                startIcon={<Plus size={16} />}
                onClick={() => {
                  if (onAddTransaction) {
                    onAddTransaction(currentSelectedDayCell.date, 'expense');
                  }
                }}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 650,
                  bgcolor: '#f43f5e',
                  '&:hover': { bgcolor: '#e11d48' }
                }}
              >
                + Chi tiêu
              </Button>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            {/* Transaction List of the Day */}
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {currentSelectedDayCell.transactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <CalendarIcon size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Chưa có giao dịch trong ngày này
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Nhấn nút phía trên để tạo giao dịch mới ngay lập tức
                  </Typography>
                </Box>
              ) : (
                currentSelectedDayCell.transactions.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const acc = accounts.find(a => a.id === tx.accountId);
                  const isInc = tx.type === 'income';
                  const isExp = tx.type === 'expense';

                  return (
                    <Paper
                      key={tx.id}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                        <CategoryAvatarBadge
                          categoryId={cat?.id}
                          categoryName={cat?.name || tx.name}
                          txType={tx.type}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {tx.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {cat?.name || 'Chung'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              •
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                              {acc?.name || 'Tài khoản'}
                            </Typography>
                          </Box>
                          {tx.note && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                display: 'block',
                                fontStyle: 'italic',
                                fontSize: '0.72rem'
                              }}
                            >
                              "{tx.note}"
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Right Amount & Actions */}
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 750,
                            color: isInc ? '#10b981' : isExp ? '#f43f5e' : '#3b82f6',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isInc ? '+' : isExp ? '-' : ''}
                          {money(tx.amount)}
                        </Typography>

                        {/* Action buttons */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.25, mt: 0.5 }}>
                          {onViewTransaction && (
                            <IconButton
                              size="small"
                              onClick={() => onViewTransaction(tx)}
                              sx={{ p: 0.25, color: 'text.secondary' }}
                              title="Xem chi tiết"
                            >
                              <Eye size={14} />
                            </IconButton>
                          )}
                          {onEditTransaction && (
                            <IconButton
                              size="small"
                              onClick={() => onEditTransaction(tx)}
                              sx={{ p: 0.25, color: 'text.secondary' }}
                              title="Sửa"
                            >
                              <Pencil size={14} />
                            </IconButton>
                          )}
                          {onDeleteTransaction && (
                            <IconButton
                              size="small"
                              onClick={() => onDeleteTransaction(tx)}
                              sx={{ p: 0.25, color: '#f43f5e' }}
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  );
                })
              )}
            </Box>
          </>
        )}
      </Drawer>
    </Box>
  );
}
