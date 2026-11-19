import { useState, useMemo, useRef, useEffect, forwardRef } from 'react';
import type { FormEvent } from 'react';
import {
  Box,
  Paper,
  InputBase,
  IconButton,
  Chip,
  Typography,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  useTheme,
  useMediaQuery,
  Slide,
  Popper,
  Popover,
  ClickAwayListener,
  Collapse,
  Menu,
  MenuItem
} from '@mui/material';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
import { CalculatorKeypad } from './calculator/CalculatorKeypad';
import type { TransitionProps } from '@mui/material/transitions';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import WorkRounded from '@mui/icons-material/WorkRounded';
import LocalCafeRounded from '@mui/icons-material/LocalCafeRounded';
import RestaurantRounded from '@mui/icons-material/RestaurantRounded';
import LocalGasStationRounded from '@mui/icons-material/LocalGasStationRounded';
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded';
import LocalDrinkRounded from '@mui/icons-material/LocalDrinkRounded';
import DinnerDiningRounded from '@mui/icons-material/DinnerDiningRounded';
import LocalParkingRounded from '@mui/icons-material/LocalParkingRounded';
import MedicationRounded from '@mui/icons-material/MedicationRounded';
import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRounded from '@mui/icons-material/TrendingDownRounded';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded';
import MonetizationOnRounded from '@mui/icons-material/MonetizationOnRounded';
import SavingsRounded from '@mui/icons-material/SavingsRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import SparklesRounded from '@mui/icons-material/AutoAwesomeRounded';
import KeyboardRounded from '@mui/icons-material/KeyboardRounded';

import {
  CornerDownLeft,
  PiggyBank,
  Bot,
  Sparkles,
  Zap,
  X,
  UtensilsCrossed,
  Briefcase,
  Target,
  Landmark,
  CreditCard,
  Plus,
  Mic,
  MicOff,
  Camera,
  Paperclip,
  ChevronDown,
  Lightbulb,
  ShieldCheck,
  Check,
  ArrowLeft,
  Calendar,
  Eye,
  TrendingUp
} from 'lucide-react';

import { useFinance } from '../store';
import { money, todayKey, uid, formatVnMonth, goalSaved } from '../lib/finance';
import { syncSalaryToPayroll } from '../lib/payrollEngine';
import { parseVietnameseCommand, type ParsedCommand } from '../lib/nlpParser';
import { detectDuplicateTransaction } from '../lib/transactionParser';
import { voiceManager, type VoiceStatus } from '../lib/voiceInput';
import { processReceiptFile } from '../lib/receiptScanner';
import { detectSpendingAnomaly } from '../lib/financialIntelligence';
import { updateStreak, createReconciliationTransaction } from '../lib/habit';
import { checkNlpUsage, canAddGoal, isProUser } from '../lib/subscription';
import { MuiDatePicker, MuiTextField, MuiCurrencyInput, MuiSelect } from './mui/MuiInputs';
import { CategoryAvatarBadge, BankLogoBadge } from '../lib/brandBadges';
import { saveQuickNote } from '../lib/savedNotesStorage';
import { BankSmsModal } from './BankSmsModal';
import { CameraVietQrReceiptScanner, type CameraScanResult } from './camera/CameraVietQrReceiptScanner';
import type { TxType, Account, SavingsGoal, Transaction, InvestmentAsset, Category } from '../types';

export type MainEntryMode = 'daily' | 'camera' | 'ai' | 'manual';
export type QuickEntryType = 'expense' | 'income' | 'saving' | 'invest';

export interface ParsedNLPResult {
  type: QuickEntryType;
  amount: number;
  categoryKey: string;
  categoryName: string;
  note: string;
  date: string;
  accountId?: string;
  ticker?: string;
  quantity?: number;
  price?: number;
}

export interface HabitChip {
  id: string;
  emoji?: string;
  label: string;
  name: string;
  amount: number;
  type: 'expense' | 'income' | 'invest';
  categoryKey: string;
  categoryName: string;
  badgeColor?: string;
  isRecent?: boolean;
}

export function getHabitIcon(habitId: string, size = 16) {
  switch (habitId) {
    case 'h-cf':
    case 'tod-cf':
    case 'tod-cf2':
      return <LocalCafeRounded sx={{ fontSize: size }} />;
    case 'h-lunch':
    case 'tod-lunch':
    case 'tod-bfast':
    case 'tod-pho':
      return <RestaurantRounded sx={{ fontSize: size }} />;
    case 'h-gas':
    case 'tod-gas':
    case 'tod-gas2':
      return <LocalGasStationRounded sx={{ fontSize: size }} />;
    case 'h-market':
    case 'tod-market':
    case 'tod-mart':
      return <ShoppingCartRounded sx={{ fontSize: size }} />;
    case 'h-milktea':
    case 'tod-tea':
    case 'tod-drink':
    case 'tod-snack':
      return <LocalDrinkRounded sx={{ fontSize: size }} />;
    case 'h-dinner':
    case 'tod-dinner':
    case 'tod-fun':
      return <DinnerDiningRounded sx={{ fontSize: size }} />;
    case 'h-parking':
    case 'tod-park':
    case 'tod-grab':
      return <LocalParkingRounded sx={{ fontSize: size }} />;
    case 'h-pharmacy':
      return <MedicationRounded sx={{ fontSize: size }} />;
    case 'h-salary':
      return <PaymentsRounded sx={{ fontSize: size }} />;
    case 'h-bonus':
      return <CardGiftcardRounded sx={{ fontSize: size }} />;
    case 'h-freelance':
      return <WorkRounded sx={{ fontSize: size }} />;
    case 'h-interest':
      return <TrendingUpRounded sx={{ fontSize: size }} />;
    case 'h-fpt':
      return <ShowChartRounded sx={{ fontSize: size }} />;
    case 'h-tcb':
      return <AccountBalanceRounded sx={{ fontSize: size }} />;
    case 'h-gold':
      return <MonetizationOnRounded sx={{ fontSize: size }} />;
    default:
      return <ReceiptLongRounded sx={{ fontSize: size }} />;
  }
}

export const COMMON_HABITS: HabitChip[] = [
  // Chi tiêu
  { id: 'h-cf', label: 'Cà phê sáng', name: 'Cà phê sáng', amount: 30000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#B45309' },
  { id: 'h-lunch', label: 'Cơm trưa', name: 'Ăn trưa', amount: 45000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#EA580C' },
  { id: 'h-gas', label: 'Đổ xăng', name: 'Đổ xăng xe', amount: 50000, type: 'expense', categoryKey: 'transport', categoryName: 'Di chuyển', badgeColor: '#0284C7' },
  { id: 'h-market', label: 'Đi chợ', name: 'Đi chợ siêu thị', amount: 150000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#16A34A' },
  { id: 'h-milktea', label: 'Trà sữa', name: 'Trà sữa chiều', amount: 35000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#D97706' },
  { id: 'h-dinner', label: 'Cơm tối', name: 'Cơm tối gia đình', amount: 80000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#DC2626' },
  { id: 'h-parking', label: 'Gửi xe', name: 'Vé gửi xe', amount: 5000, type: 'expense', categoryKey: 'transport', categoryName: 'Di chuyển', badgeColor: '#64748B' },
  { id: 'h-pharmacy', label: 'Thuốc men', name: 'Thuốc y tế', amount: 50000, type: 'expense', categoryKey: 'health', categoryName: 'Sức khỏe', badgeColor: '#0D9488' },

  // Thu nhập & Lương
  { id: 'h-salary', label: 'Lương tháng', name: 'Lương thực nhận', amount: 25000000, type: 'income', categoryKey: 'salary', categoryName: 'Tiền lương', badgeColor: '#059669' },
  { id: 'h-bonus', label: 'Thưởng nóng', name: 'Thưởng dự án', amount: 5000000, type: 'income', categoryKey: 'bonus', categoryName: 'Thưởng', badgeColor: '#D97706' },
  { id: 'h-freelance', label: 'Làm thêm', name: 'Thu nhập freelance', amount: 1500000, type: 'income', categoryKey: 'freelance', categoryName: 'Làm thêm', badgeColor: '#2563EB' },
  { id: 'h-interest', label: 'Lãi tiết kiệm', name: 'Lãi ngân hàng', amount: 500000, type: 'income', categoryKey: 'invest', categoryName: 'Đầu tư', badgeColor: '#7C3AED' },

  // Đầu tư
  { id: 'h-fpt', label: 'Mua 50 FPT', name: 'MUA 50 FPT', amount: 6500000, type: 'invest', categoryKey: 'invest', categoryName: 'Đầu tư', badgeColor: '#2563EB' },
  { id: 'h-tcb', label: 'Mua 100 TCB', name: 'MUA 100 TCB', amount: 3200000, type: 'invest', categoryKey: 'invest', categoryName: 'Đầu tư', badgeColor: '#DC2626' },
  { id: 'h-gold', label: 'Vàng 0.5 chỉ', name: 'MUA 0.5 chỉ vàng', amount: 4500000, type: 'invest', categoryKey: 'invest', categoryName: 'Đầu tư', badgeColor: '#D97706' }
];

export const EXPENSE_QUICK_AMOUNTS = [
  { label: '20k', value: 20000 },
  { label: '30k', value: 30000 },
  { label: '50k', value: 50000 },
  { label: '100k', value: 100000 },
  { label: '200k', value: 200000 },
  { label: '500k', value: 500000 },
  { label: '1tr', value: 1000000 },
  { label: '2tr', value: 2000000 }
];

export const SALARY_QUICK_AMOUNTS = [
  { label: '10tr', value: 10000000 },
  { label: '15tr', value: 15000000 },
  { label: '20tr', value: 20000000 },
  { label: '25tr', value: 25000000 },
  { label: '30tr', value: 30000000 },
  { label: '40tr', value: 40000000 },
  { label: '50tr', value: 50000000 }
];

export const SAVING_QUICK_AMOUNTS = [
  { label: '500k', value: 500000 },
  { label: '1tr', value: 1000000 },
  { label: '2tr', value: 2000000 },
  { label: '3tr', value: 3000000 },
  { label: '5tr', value: 5000000 },
  { label: '10tr', value: 10000000 }
];

// Smart time-of-day suggestions generator
export function getTimeOfDaySuggestions(): {
  timeLabel: string;
  habits: HabitChip[];
} {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return {
      timeLabel: 'Buổi sáng',
      habits: [
        { id: 'tod-cf', label: 'Cà phê sáng', name: 'Cà phê sáng', amount: 30000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#B45309' },
        { id: 'tod-bfast', label: 'Ăn sáng / Bánh mì', name: 'Ăn sáng', amount: 25000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#EA580C' },
        { id: 'tod-gas', label: 'Đổ xăng xe', name: 'Đổ xăng xe', amount: 50000, type: 'expense', categoryKey: 'transport', categoryName: 'Di chuyển', badgeColor: '#0284C7' },
        { id: 'tod-park', label: 'Vé gửi xe', name: 'Vé gửi xe', amount: 5000, type: 'expense', categoryKey: 'transport', categoryName: 'Di chuyển', badgeColor: '#64748B' }
      ]
    };
  } else if (hour >= 11 && hour < 14) {
    return {
      timeLabel: 'Buổi trưa',
      habits: [
        { id: 'tod-lunch', label: 'Cơm trưa văn phòng', name: 'Cơm trưa', amount: 45000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#EA580C' },
        { id: 'tod-drink', label: 'Trà đá / Nước ép', name: 'Nước uống trưa', amount: 20000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#10B981' },
        { id: 'tod-pho', label: 'Ăn bún / phở', name: 'Bún phở trưa', amount: 50000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#DC2626' },
        { id: 'tod-cf2', label: 'Cà phê trưa', name: 'Cà phê trưa', amount: 35000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#B45309' }
      ]
    };
  } else if (hour >= 14 && hour < 18) {
    return {
      timeLabel: 'Buổi chiều',
      habits: [
        { id: 'tod-tea', label: 'Trà sữa / Ăn vặt', name: 'Trà sữa chiều', amount: 35000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#D97706' },
        { id: 'tod-snack', label: 'Snack / Bánh ngọt', name: 'Ăn nhẹ chiều', amount: 25000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#8B5CF6' },
        { id: 'tod-market', label: 'Đi chợ / Siêu thị', name: 'Đi chợ siêu thị', amount: 150000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#16A34A' },
        { id: 'tod-gas2', label: 'Đổ xăng chiều', name: 'Đổ xăng về', amount: 50000, type: 'expense', categoryKey: 'transport', categoryName: 'Di chuyển', badgeColor: '#0284C7' }
      ]
    };
  } else {
    return {
      timeLabel: 'Buổi tối',
      habits: [
        { id: 'tod-dinner', label: 'Cơm tối gia đình', name: 'Cơm tối', amount: 80000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#DC2626' },
        { id: 'tod-mart', label: 'Bách hóa / Chợ tối', name: 'Mua thực phẩm tối', amount: 120000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#16A34A' },
        { id: 'tod-grab', label: 'Grab / Xe về nhà', name: 'Grab về nhà', amount: 60000, type: 'expense', categoryKey: 'transport', categoryName: 'Di chuyển', badgeColor: '#0284C7' },
        { id: 'tod-fun', label: 'Giải trí / Ăn ngoài', name: 'Gặp gỡ bạn bè', amount: 150000, type: 'expense', categoryKey: 'food', categoryName: 'Ăn uống', badgeColor: '#8B5CF6' }
      ]
    };
  }
}

// Extract user's actual frequent habits from their real transactions
export function extractFrequentUserHabits(
  transactions: Transaction[],
  categories: Category[],
  type: QuickEntryType
): HabitChip[] {
  if (!transactions || transactions.length === 0) return [];

  const targetType = type === 'saving' ? 'transfer' : type === 'invest' ? 'expense' : type;
  const filtered = transactions.filter(t => t.type === targetType && t.name && t.name.trim().length > 1);
  if (filtered.length === 0) return [];

  const counts: Record<string, { count: number; totalAmount: number; catId: string; lastDate: string }> = {};
  for (const t of filtered) {
    const key = t.name.trim().toLowerCase();
    if (!counts[key]) {
      counts[key] = { count: 0, totalAmount: 0, catId: t.categoryId || 'food', lastDate: t.date };
    }
    counts[key].count += 1;
    counts[key].totalAmount += t.amount;
    if (t.date > counts[key].lastDate) counts[key].lastDate = t.date;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([key, item], idx) => {
      const avgAmt = Math.round(item.totalAmount / item.count);
      const cat = categories.find(c => c.id === item.catId);
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return {
        id: `user-habit-${idx}`,
        label,
        name: label,
        amount: avgAmt,
        type: (type === 'saving' || type === 'invest' ? type : targetType) as any,
        categoryKey: item.catId,
        categoryName: cat?.name || 'Chi tiêu',
        badgeColor: cat?.color || '#10B981',
        isRecent: true
      };
    });
}

export function getPromptCategoryIcon(name: string, size = 14) {
  switch (name) {
    case 'utensils':
      return <UtensilsCrossed size={size} />;
    case 'briefcase':
      return <Briefcase size={size} />;
    case 'target':
      return <Target size={size} />;
    case 'building':
      return <Landmark size={size} />;
    case 'credit-card':
      return <CreditCard size={size} />;
    case 'chart':
      return <TrendingUp size={size} />;
    default:
      return <Sparkles size={size} />;
  }
}

// Categorized Smart Prompt Scenarios for AI
export const AI_CATEGORIZED_PROMPTS = [
  {
    category: 'Tra cứu & Báo cáo',
    iconName: 'chart',
    prompts: [
      { label: 'Xem chi tiêu hôm nay', cmd: 'xem chi tiêu hôm nay', desc: 'Thống kê tổng chi tiêu trong ngày' },
      { label: 'Xem số dư tài khoản', cmd: 'xem số dư các tài khoản', desc: 'Kiểm tra tiền hiện có ở các ví & ngân hàng' },
      { label: 'Xem tiền tiết kiệm', cmd: 'xem tiền tiết kiệm', desc: 'Tra cứu tiến độ tích lũy các sổ' },
      { label: 'Xem danh mục đầu tư', cmd: 'xem danh mục đầu tư', desc: 'Kiểm tra cổ phiếu, vàng, tài sản' }
    ]
  },
  {
    category: 'Sinh hoạt & Tiêu dùng',
    iconName: 'utensils',
    prompts: [
      { label: 'Ăn trưa 45k', cmd: 'ăn trưa cơm tấm 45k ví tiền mặt', desc: 'Ăn trưa công sở tiền mặt' },
      { label: 'Cà phê 30k', cmd: 'cà phê sáng 30k', desc: 'Uống cà phê sáng' },
      { label: 'Đổ xăng 70k', cmd: 'đổ xăng 70k ví Momo', desc: 'Di chuyển qua ví điện tử' },
      { label: 'Đi chợ 180k', cmd: 'đi chợ WinMart 180k quẹt VCB', desc: 'Mua sắm thực phẩm siêu thị' }
    ]
  },
  {
    category: 'Lương & Thu nhập',
    iconName: 'briefcase',
    prompts: [
      { label: 'Lương 25tr Techcombank', cmd: 'lương 25tr vào tài khoản Techcombank', desc: 'Khai báo lương tháng thực nhận' },
      { label: 'Thưởng nóng 5tr', cmd: 'thưởng nóng dự án 5tr tiền mặt', desc: 'Khoản thu thưởng đột xuất' },
      { label: 'Làm thêm 3.5tr', cmd: 'làm thêm freelance thiết kế 3.5tr', desc: 'Thu nhập thêm ngoài giờ' }
    ]
  },
  {
    category: 'Phân bổ Đa tầng (Lương + Tiết kiệm)',
    iconName: 'target',
    prompts: [
      { label: 'Lương 28tr trích 6tr tiết kiệm', cmd: 'lương 28tr trích 6tr vào tiết kiệm', desc: 'Tự động tách lương và nạp sổ' },
      { label: 'Lương 20tr cất 5tr mua xe', cmd: 'nhận lương 20tr gửi tiết kiệm 5tr mua xe', desc: 'Tích lũy vào mục tiêu cụ thể' }
    ]
  },
  {
    category: 'Tiết kiệm & Đầu tư',
    iconName: 'building',
    prompts: [
      { label: 'Gửi tiết kiệm 5tr', cmd: 'gửi tiết kiệm 5tr vào Quỹ khẩn cấp', desc: 'Nạp quỹ tiết kiệm tích lũy' },
      { label: 'Mua 100 cổ TCB 32k', cmd: 'mua 100 TCB giá 32', desc: 'Lệnh mua cổ phiếu Techcombank' },
      { label: 'Mua 1 chỉ vàng SJC', cmd: 'mua 1 chỉ vàng SJC 8.5tr', desc: 'Tích sản vàng vật chất' }
    ]
  },
  {
    category: 'Hóa đơn & Trả góp',
    iconName: 'credit-card',
    prompts: [
      { label: 'Laptop 18tr trả góp', cmd: 'quẹt thẻ VCB mua laptop 18tr trả góp 6 tháng', desc: 'Giao dịch trả góp dài hạn' },
      { label: 'Tiền điện nước 850k', cmd: 'thanh toán tiền điện nước 850k', desc: 'Hóa đơn sinh hoạt định kỳ' }
    ]
  }
];

export function parseNaturalLanguageInput(raw: string, currentType: QuickEntryType): ParsedNLPResult {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const today = todayKey();

  let recognizedType: QuickEntryType = currentType;
  let amount = 0;
  let categoryKey = 'other';
  let categoryName = 'Khác';
  let note = text;
  let ticker: string | undefined;
  let quantity: number | undefined;
  let price: number | undefined;

  // 1. Detect Investment patterns: e.g. "mua 100 TCB giá 32"
  const investMatch = text.match(/(mua|bán|ban)\s+(\d+)\s+([A-Za-z0-9]+)(\s+giá\s+(\d+k?))?/i);
  if (investMatch) {
    recognizedType = 'invest';
    quantity = parseInt(investMatch[2], 10);
    ticker = investMatch[3].toUpperCase();
    if (investMatch[5]) {
      const pStr = investMatch[5].toLowerCase();
      price = pStr.endsWith('k') ? parseInt(pStr, 10) * 1000 : parseInt(pStr, 10);
      amount = quantity * price;
    }
    categoryKey = 'invest';
    categoryName = 'Đầu tư';
    note = `${investMatch[1].toUpperCase()} ${quantity} ${ticker}${price ? ` @ ${money(price)}` : ''}`;
  } else {
    // 2. Detect Amount with suffixes (k, tr, m, củ, lít)
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn|tr|triệu|củ|lít|m|tỷ|vnd|đ|₫)?/i);
    if (amountMatch) {
      const num = parseFloat(amountMatch[1].replace(',', '.'));
      const unit = (amountMatch[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn') {
        amount = Math.round(num * 1000);
      } else if (unit === 'tr' || unit === 'triệu' || unit === 'củ' || unit === 'm') {
        amount = Math.round(num * 1000000);
      } else if (unit === 'lít') {
        amount = Math.round(num * 100000);
      } else if (unit === 'tỷ') {
        amount = Math.round(num * 1000000000);
      } else if (num < 1000 && !unit) {
        amount = Math.round(num * 1000);
      } else {
        amount = Math.round(num);
      }
    }

    // 3. Category Detection from Vietnamese keywords
    if (
      lower.includes('cà phê') ||
      lower.includes('cafe') ||
      lower.includes('cf') ||
      lower.includes('ăn') ||
      lower.includes('cơm') ||
      lower.includes('phở') ||
      lower.includes('trưa') ||
      lower.includes('tối') ||
      lower.includes('sáng') ||
      lower.includes('uống') ||
      lower.includes('bánh') ||
      lower.includes('trà sữa')
    ) {
      categoryKey = 'food';
      categoryName = 'Ăn uống';
      recognizedType = 'expense';
    } else if (
      lower.includes('xăng') ||
      lower.includes('xe') ||
      lower.includes('grab') ||
      lower.includes('taxi') ||
      lower.includes('gửi xe') ||
      lower.includes('gưi xe')
    ) {
      categoryKey = 'transport';
      categoryName = 'Di chuyển';
      recognizedType = 'expense';
    } else if (
      lower.includes('chợ') ||
      lower.includes('siêu thị') ||
      lower.includes('mua sắm') ||
      lower.includes('quần áo') ||
      lower.includes('shopee') ||
      lower.includes('tiki') ||
      lower.includes('lazada')
    ) {
      categoryKey = 'shopping';
      categoryName = 'Mua sắm';
      recognizedType = 'expense';
    } else if (
      lower.includes('thuốc') ||
      lower.includes('bệnh') ||
      lower.includes('khám') ||
      lower.includes('nha khoa') ||
      lower.includes('y tế')
    ) {
      categoryKey = 'health';
      categoryName = 'Sức khỏe';
      recognizedType = 'expense';
    } else if (
      lower.includes('lương') ||
      lower.includes('salary') ||
      lower.includes('thưởng') ||
      lower.includes('bonus') ||
      lower.includes('làm thêm')
    ) {
      categoryKey = 'salary';
      categoryName = 'Tiền lương';
      recognizedType = 'income';
    } else if (
      lower.includes('tiết kiệm') ||
      lower.includes('tích lũy') ||
      lower.includes('quỹ khẩn cấp') ||
      lower.includes('nạp quỹ')
    ) {
      categoryKey = 'saving';
      categoryName = 'Tiết kiệm';
      recognizedType = 'saving';
    }
  }

  return {
    type: recognizedType,
    amount,
    categoryKey,
    categoryName,
    note: note || (recognizedType === 'income' ? 'Khoản thu' : recognizedType === 'saving' ? 'Gửi tiết kiệm' : 'Khoản chi'),
    date: today,
    ticker,
    quantity,
    price
  };
}

// =========================================================================
// 1. SMART QUICK ENTRY TRIGGER BAR (Sleek Trigger Bar for Page Flow)
// =========================================================================
export interface SmartQuickEntryTriggerBarProps {
  id?: string;
  onOpenModal: (mode?: MainEntryMode, initialText?: string) => void;
  onOpenPricing?: (feature?: string) => void;
}

export function SmartQuickEntryTriggerBar({
  id = 'tour-tx-quick-bar',
  onOpenModal
}: SmartQuickEntryTriggerBarProps) {
  const timeInfo = useMemo(() => getTimeOfDaySuggestions(), []);
  const [dropdownAnchor, setDropdownAnchor] = useState<null | HTMLElement>(null);

  const handleOpenDropdown = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setDropdownAnchor(e.currentTarget);
  };

  const handleCloseDropdown = () => {
    setDropdownAnchor(null);
  };

  const handleSelectSuggestion = (item: HabitChip) => {
    handleCloseDropdown();
    const formatted = item.amount >= 1000000 ? `${item.amount / 1000000}tr` : `${item.amount / 1000}k`;
    onOpenModal('daily', `${item.name} ${formatted}`);
  };

  return (
    <Box id={id} sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        onClick={() => onOpenModal('daily')}
        sx={{
          p: { xs: 1, sm: 1.25 },
          px: { xs: 1.25, sm: 1.75 },
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: 'none',
          '&:hover': {
            borderColor: 'var(--border-strong)',
            bgcolor: 'background.default'
          }
        }}
      >
        {/* Left Side: Icon + Modern Search Placeholder */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              bgcolor: 'action.hover',
              color: 'var(--brand-primary, #1E5A48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Zap size={16} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                color: 'text.primary',
                fontSize: { xs: '0.84rem', sm: '0.88rem' },
                fontWeight: 650
              }}
            >
              Nhập nhanh giao dịch hoặc lệnh AI...
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.72rem', sm: '0.75rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Ví dụ: "cà phê 30k", "lương 25tr trích 5tr", "cơm trưa 45k"
            </Typography>
          </Box>
        </Box>

        {/* Right Side: Smart Dropdown Menu + Shortcut + Action */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {/* Smart Suggestions Dropdown Anchor Button */}
          <Button
            size="small"
            variant="text"
            onClick={handleOpenDropdown}
            startIcon={<Lightbulb size={14} style={{ color: '#D97706' }} />}
            endIcon={<ChevronDown size={13} />}
            sx={{
              fontSize: '0.78rem',
              fontWeight: 700,
              py: 0.5,
              px: 1.25,
              borderRadius: '6px',
              color: 'text.secondary',
              bgcolor: 'action.hover',
              border: '1px solid var(--border-subtle)',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'action.selected',
                borderColor: 'var(--border-strong)',
                color: 'text.primary'
              }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Gợi ý {timeInfo.timeLabel.toLowerCase()}</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Gợi ý</Box>
          </Button>

          {/* Shortcut Ctrl + K */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.4,
              px: 0.85,
              py: 0.4,
              borderRadius: '5px',
              bgcolor: 'action.hover',
              border: '1px solid var(--border-subtle)',
              color: 'text.secondary',
              fontSize: 11,
              fontWeight: 700
            }}
          >
            <KeyboardRounded sx={{ fontSize: 13 }} />
            <span>Ctrl + K</span>
          </Box>

          {/* Quick Camera VietQR Button */}
          <Tooltip title="Quét Camera VietQR hoặc Hóa đơn">
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onOpenModal('camera');
              }}
              sx={{
                bgcolor: 'rgba(59, 130, 246, 0.1)',
                color: '#3B82F6',
                borderRadius: '6px',
                p: 0.75,
                border: '1px solid rgba(59, 130, 246, 0.25)',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.2)',
                  borderColor: '#3B82F6'
                }
              }}
            >
              <Camera size={16} />
            </IconButton>
          </Tooltip>

          {/* Quick Add Button */}
          <Button
            size="small"
            variant="contained"
            onClick={e => {
              e.stopPropagation();
              onOpenModal('daily');
            }}
            startIcon={<Sparkles size={14} />}
            sx={{
              fontSize: { xs: 12, sm: 12.5 },
              fontWeight: 700,
              bgcolor: 'var(--brand-primary, #1E5A48)',
              '&:hover': { bgcolor: 'var(--brand-primary-hover, #164638)' },
              borderRadius: '6px',
              px: { xs: 1.5, sm: 2 },
              py: 0.65,
              textTransform: 'none',
              boxShadow: 'none'
            }}
          >
            Thêm nhanh
          </Button>
        </Box>
      </Paper>

      {/* Trigger Bar Contextual Dropdown Menu */}
      <Menu
        anchorEl={dropdownAnchor}
        open={Boolean(dropdownAnchor)}
        onClose={handleCloseDropdown}
        disableScrollLock={false}
        slotProps={{
          backdrop: {
            invisible: false,
            sx: {
              backgroundColor: 'transparent !important',
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important'
            }
          },
          paper: {
            sx: {
              mt: 1,
              width: 280,
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
              p: 0.5,
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important'
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.72rem', textTransform: 'uppercase' }}>
            ⚡ Gợi ý {timeInfo.timeLabel.toLowerCase()}
          </Typography>
        </Box>
        {timeInfo.habits.map(habit => {
          const formatted = habit.amount >= 1000000 ? `${habit.amount / 1000000}tr` : `${habit.amount / 1000}k`;
          return (
            <MenuItem
              key={habit.id}
              onClick={() => handleSelectSuggestion(habit)}
              sx={{
                borderRadius: '6px',
                py: 0.85,
                px: 1.25,
                my: 0.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '5px',
                    bgcolor: `${habit.badgeColor || '#10B981'}15`,
                    color: habit.badgeColor || '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {getHabitIcon(habit.id, 14)}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 650, fontSize: '0.82rem' }}>
                  {habit.label}
                </Typography>
              </Box>
              <Chip
                label={formatted}
                size="small"
                sx={{ height: 20, fontSize: '0.72rem', fontWeight: 750, borderRadius: '4px' }}
              />
            </MenuItem>
          );
        })}
        <Box sx={{ p: 0.75, pt: 1, borderTop: '1px solid var(--border-subtle)' }}>
          <Button
            fullWidth
            size="small"
            variant="text"
            onClick={() => {
              handleCloseDropdown();
              onOpenModal('ai');
            }}
            startIcon={<AutoAwesomeRounded sx={{ fontSize: 14, color: '#10B981' }} />}
            sx={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'none', color: '#10B981' }}
          >
            Mở Trợ lý AI NLP →
          </Button>
        </Box>
      </Menu>
    </Box>
  );
}

// =========================================================================
// 2. DEDICATED QUICK TRANSACTION MODAL (Pop-up Dialog)
// =========================================================================
const TransitionUp = forwardRef(function TransitionUp(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface SmartQuickEntryModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: MainEntryMode;
  initialText?: string;
  onOpenPricing?: (feature?: string) => void;
}

export function SmartQuickEntryModal({
  open,
  onClose,
  defaultMode = 'daily',
  initialText = '',
  onOpenPricing
}: SmartQuickEntryModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';
  const { data, update, notify } = useFinance();
  const [mainMode, setMainMode] = useState<MainEntryMode>(defaultMode);

  // Tab 1: Daily Quick State
  const [entryType, setEntryType] = useState<QuickEntryType>('expense');
  const [inputText, setInputText] = useState(initialText);
  const [overrideAmount, setOverrideAmount] = useState<number | null>(null);
  const [customCategory, setCustomCategory] = useState<{ key: string; name: string } | null>(null);
  const [customDate, setCustomDate] = useState<string | null>(null);
  const [customAccountId, setCustomAccountId] = useState<string | null>(null);

  // Separate Dedicated Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Savings specific
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [createGoalDialogOpen, setCreateGoalDialogOpen] = useState(false);
  const [newGoalForm, setNewGoalForm] = useState({ name: '', target: '20000000' });

  // Salary specific
  const [isSalaryMode, setIsSalaryMode] = useState(false);
  const [salaryMonth] = useState(() => todayKey().slice(0, 7));
  const [syncPayroll, setSyncPayroll] = useState(true);
  const [enableSalarySaving, setEnableSalarySaving] = useState(false);
  const [salarySavingGoalId, setSalarySavingGoalId] = useState<string>('');
  const [salarySavingAmount, setSalarySavingAmount] = useState<number>(0);

  // Phase 2: Voice Input State
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Phase 2: Receipt Scanner State
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);

  // Phase 1.2: Safe In-Keyboard Calculator State
  const [calcAnchor, setCalcAnchor] = useState<null | HTMLElement>(null);

  // Tab 3 & 4: Manual Form & Camera Scan Integration
  const [showQuickNumpad, setShowQuickNumpad] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    amount: 50000,
    type: 'expense' as TxType,
    categoryId: 'food',
    accountId: 'bank',
    date: todayKey(),
    note: ''
  });

  // Quick 1-Touch Presets
  const quickPresets = useMemo(() => [
    { id: 'p1', label: 'Cà phê sáng', name: 'Cà phê sáng', amount: 30000, type: 'expense' as QuickEntryType, categoryKey: 'food', emoji: '☕', color: '#D97706' },
    { id: 'p2', label: 'Cơm trưa', name: 'Cơm trưa', amount: 45000, type: 'expense' as QuickEntryType, categoryKey: 'food', emoji: '🍱', color: '#EA580C' },
    { id: 'p3', label: 'Đổ xăng', name: 'Đổ xăng xe máy', amount: 70000, type: 'expense' as QuickEntryType, categoryKey: 'transport', emoji: '⛽', color: '#2563EB' },
    { id: 'p4', label: 'Siêu thị', name: 'Mua đồ siêu thị', amount: 150000, type: 'expense' as QuickEntryType, categoryKey: 'groceries', emoji: '🛒', color: '#16A34A' },
    { id: 'p5', label: 'Trà sữa / Đồ uống', name: 'Trà sữa giải khát', amount: 35000, type: 'expense' as QuickEntryType, categoryKey: 'food', emoji: '🧋', color: '#9333EA' },
    { id: 'p6', label: 'Tiền lương', name: 'Nhận lương tháng', amount: 25000000, type: 'income' as QuickEntryType, categoryKey: 'salary', emoji: '💰', color: '#059669' },
  ], []);

  const handleSelectQuickPreset = (preset: typeof quickPresets[0]) => {
    setEntryType(preset.type);
    const cat = categories.find(c => c.id === preset.categoryKey || c.name.toLowerCase().includes(preset.categoryKey));
    if (cat) {
      setCustomCategory({ key: cat.id, name: cat.name });
    }
    setOverrideAmount(preset.amount);
    const amountStr = preset.amount >= 1000000 ? `${preset.amount / 1000000}tr` : `${preset.amount / 1000}k`;
    setInputText(`${preset.name} ${amountStr}`);
  };

  const handleManualSave = async () => {
    if (!manualForm.name.trim() || manualForm.amount <= 0) {
      notify('Vui lòng nhập tên giao dịch và số tiền hợp lệ (> 0đ)');
      return;
    }
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const newTx: Transaction = {
      id: uid(),
      name: manualForm.name.trim(),
      amount: manualForm.amount,
      type: manualForm.type,
      categoryId: manualForm.categoryId,
      accountId: manualForm.accountId,
      date: manualForm.date,
      method: manualForm.type === 'income' ? 'Chuyển khoản' : 'Tiền mặt',
      note: manualForm.note.trim(),
      status: 'completed',
      is_synced: !isOffline,
      sync_status: isOffline ? 'PENDING' : 'SYNCED'
    };

    await update(d => ({
      ...d,
      transactions: [newTx, ...d.transactions]
    }), `Đã thêm giao dịch "${newTx.name}" (${money(newTx.amount)})`);

    onClose();
  };

  const handleCameraScanComplete = async (res: CameraScanResult) => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const catId = res.suggestedCategoryId || categories[0]?.id || 'food';
    const accId = customAccountId || accounts[0]?.id || 'bank';

    const newTx: Transaction = {
      id: uid(),
      name: res.name,
      amount: res.amount,
      type: 'expense',
      categoryId: catId,
      accountId: accId,
      date: res.date || todayKey(),
      method: res.sourceType === 'vietqr' ? 'Chuyển khoản VietQR' : 'Tiền mặt',
      note: res.note || (res.sourceType === 'vietqr' ? `Quét VietQR ${res.bankName || ''}` : 'Quét Hóa đơn biên lai'),
      receiptUrl: res.receiptUrl,
      status: 'completed',
      is_synced: !isOffline,
      sync_status: isOffline ? 'PENDING' : 'SYNCED'
    };

    await update(d => ({
      ...d,
      transactions: [newTx, ...d.transactions]
    }), `Đã thêm giao dịch từ ${res.sourceType === 'vietqr' ? 'VietQR' : 'Hóa đơn'} (${money(newTx.amount)})`);

    onClose();
  };

  // Tab 2: AI Quick Note State
  const [aiText, setAiText] = useState('');
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const [aiCustomAccountId, setAiCustomAccountId] = useState<string | null>(null);
  const [aiCustomCategoryId, setAiCustomCategoryId] = useState<string | null>(null);
  const [bankSmsModalOpen, setBankSmsModalOpen] = useState(false);
  const [chatConfirmOpen, setChatConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    originalText: string;
    salaryAmount: number;
    salaryAccount: string;
    month: string;
    savingAmount: number;
    savingOption: 'existing' | 'new';
    selectedGoalId: string;
    newGoalName: string;
    newGoalTarget: number;
  }>({
    originalText: '',
    salaryAmount: 5000000,
    salaryAccount: 'bank',
    month: todayKey().slice(0, 7),
    savingAmount: 2000000,
    savingOption: 'existing',
    selectedGoalId: '',
    newGoalName: 'Sổ tiết kiệm mới',
    newGoalTarget: 10000000
  });

  // When opening or receiving initial text
  useEffect(() => {
    if (open) {
      setMainMode(defaultMode);
      if (initialText) {
        setInputText(initialText);
      }
    } else {
      voiceManager.stop();
      setVoiceStatus('idle');
      setReceiptUrl(null);
      setVoiceError(null);
    }
  }, [open, defaultMode, initialText]);

  const inputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputWrapperRef.current &&
        !inputWrapperRef.current.contains(e.target as Node) &&
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = data?.categories || [];
  const accounts: Account[] = data?.accounts || [];
  const goals: SavingsGoal[] = data?.goals || [];
  const activeAccount = accounts.find(a => a.id === customAccountId) || accounts[0];

  // Auto select default goal
  useEffect(() => {
    if (goals.length > 0 && !selectedGoalId) {
      setSelectedGoalId(goals[0].id);
    }
    if (goals.length > 0 && !salarySavingGoalId) {
      setSalarySavingGoalId(goals[0].id);
    }
  }, [goals, selectedGoalId, salarySavingGoalId]);

  // Live parsed recognition
  const parsed = useMemo(() => {
    const res = parseNaturalLanguageInput(inputText, entryType);
    if (overrideAmount !== null) {
      res.amount = overrideAmount;
    }
    if (customCategory) {
      res.categoryKey = customCategory.key;
      res.categoryName = customCategory.name;
    }
    if (customDate) {
      res.date = customDate;
    }
    res.accountId = activeAccount?.id;
    return res;
  }, [inputText, entryType, overrideAmount, customCategory, customDate, activeAccount]);

  // AI NLP command parser
  const nlpQuota = data ? checkNlpUsage(data) : { allowed: true, remaining: 5 };
  const aiCommandResult: ParsedCommand | null = aiText.trim() && data
    ? parseVietnameseCommand(aiText, data.categories, data.accounts, data.user.defaultAccountId)
    : null;

  // Reset custom AI selection when AI text changes
  useEffect(() => {
    setAiCustomAccountId(null);
    setAiCustomCategoryId(null);
  }, [aiText]);

  const yesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  const selectedDate = customDate || todayKey();
  const isToday = selectedDate === todayKey();
  const isYesterday = selectedDate === yesterdayDate();

  // Real-time financial query stats for AI view intent
  const queryStats = useMemo(() => {
    if (!data || !aiCommandResult?.queryView) return null;
    const q = aiCommandResult.queryView;
    const today = todayKey();
    const currentMonth = today.slice(0, 7);

    if (q.target === 'expense') {
      const txs = (data.transactions || []).filter(t => {
        if (t.type !== 'expense') return false;
        if (q.period === 'today') return t.date === today;
        if (q.period === 'month') return t.date.startsWith(currentMonth);
        return true;
      });
      const total = txs.reduce((s, t) => s + t.amount, 0);
      return {
        target: 'expense',
        title: q.title,
        total,
        count: txs.length,
        items: txs.slice(0, 4)
      };
    }

    if (q.target === 'income') {
      const txs = (data.transactions || []).filter(t => {
        if (t.type !== 'income') return false;
        if (q.period === 'today') return t.date === today;
        if (q.period === 'month') return t.date.startsWith(currentMonth);
        return true;
      });
      const total = txs.reduce((s, t) => s + t.amount, 0);
      return {
        target: 'income',
        title: q.title,
        total,
        count: txs.length,
        items: txs.slice(0, 4)
      };
    }

    if (q.target === 'balance') {
      const totalBalance = (data.accounts || []).reduce((s, a) => s + (a.openingBalance || 0), 0);
      return {
        target: 'balance',
        title: q.title,
        total: totalBalance,
        accounts: data.accounts || []
      };
    }

    if (q.target === 'savings') {
      const totalTarget = (data.goals || []).reduce((s, g) => s + g.target, 0);
      const totalSaved = (data.goals || []).reduce((s, g) => s + goalSaved(g), 0);
      return {
        target: 'savings',
        title: q.title,
        total: totalSaved,
        totalTarget,
        goals: data.goals || []
      };
    }

    if (q.target === 'investment') {
      const totalInvest = (data.investments || []).reduce((s, inv) => s + (inv.totalCostBasis || 0), 0);
      return {
        target: 'investment',
        title: q.title,
        total: totalInvest,
        investments: data.investments || []
      };
    }

    // All
    const mExpense = (data.transactions || [])
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0);
    const mIncome = (data.transactions || [])
      .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0);
    const totalBalance = (data.accounts || []).reduce((s, a) => s + (a.openingBalance || 0), 0);
    return {
      target: 'all',
      title: q.title,
      totalBalance,
      mExpense,
      mIncome
    };
  }, [data, aiCommandResult]);

  const activeTheme = useMemo(() => {
    switch (entryType) {
      case 'expense':
        return {
          accent: '#E11D48',
          bgSubtle: 'rgba(225, 29, 72, 0.08)',
          borderSubtle: 'rgba(225, 29, 72, 0.25)',
          text: '#BE123C'
        };
      case 'income':
        return {
          accent: '#059669',
          bgSubtle: 'rgba(5, 150, 105, 0.08)',
          borderSubtle: 'rgba(5, 150, 105, 0.25)',
          text: '#047857'
        };
      case 'saving':
        return {
          accent: '#7C3AED',
          bgSubtle: 'rgba(124, 58, 237, 0.08)',
          borderSubtle: 'rgba(124, 58, 237, 0.25)',
          text: '#6D28D9'
        };
      case 'invest':
        return {
          accent: '#2563EB',
          bgSubtle: 'rgba(37, 99, 235, 0.08)',
          borderSubtle: 'rgba(37, 99, 235, 0.25)',
          text: '#1D4ED8'
        };
    }
  }, [entryType]);

  const activeColor = activeTheme.accent;

  // Phase 1.7: Duplicate Transaction Detection
  const duplicateCheck = useMemo(() => {
    if (parsed.amount <= 0 || !activeAccount) return { isDuplicate: false };
    return detectDuplicateTransaction(
      {
        name: parsed.note || (entryType === 'income' ? 'Thu nhập' : 'Chi tiêu'),
        amount: parsed.amount,
        type: (entryType === 'invest' ? 'expense' : entryType === 'saving' ? 'transfer' : entryType) as TxType,
        categoryId: parsed.categoryKey,
        accountId: activeAccount.id,
        date: parsed.date || todayKey()
      },
      data?.transactions || []
    );
  }, [parsed.amount, parsed.note, parsed.categoryKey, parsed.date, entryType, activeAccount, data?.transactions]);

  // Phase 3.2: Spending Anomaly Detection
  const spendingAnomaly = useMemo(() => {
    if (entryType !== 'expense' || parsed.amount <= 0) return { isAnomaly: false };
    return detectSpendingAnomaly(
      {
        name: parsed.note || 'Chi tiêu',
        amount: parsed.amount,
        categoryId: parsed.categoryKey,
        date: parsed.date || todayKey()
      },
      data?.transactions || []
    );
  }, [entryType, parsed.amount, parsed.note, parsed.categoryKey, parsed.date, data?.transactions]);

  // Phase 2.1: Voice Quick Entry Handler
  const handleToggleVoice = () => {
    if (voiceStatus === 'listening') {
      voiceManager.stop();
      setVoiceStatus('idle');
    } else {
      setVoiceError(null);
      const ok = voiceManager.start({
        onTranscript: (transcript, isFinal) => {
          setInputText(transcript);
          setOverrideAmount(null);
          if (isFinal) {
            setVoiceStatus('idle');
          }
        },
        onError: err => {
          setVoiceError(err);
          setVoiceStatus('error');
        },
        onStatusChange: status => setVoiceStatus(status)
      });
      if (!ok) {
        setVoiceStatus('unsupported');
      }
    }
  };

  // Phase 2.2: Receipt Scanner Handler
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsScanningReceipt(true);
      const result = await processReceiptFile(file);
      setReceiptUrl(result.receiptDataUrl || null);
      if (result.amount > 0) {
        setOverrideAmount(result.amount);
        setInputText(`${result.merchantName} ${result.amount >= 1000000 ? `${result.amount / 1000000}tr` : `${result.amount / 1000}k`}`);
      } else {
        setInputText(result.merchantName);
      }
      if (result.date) {
        setCustomDate(result.date);
      }
      notify({
        message: `Đã trích xuất biên lai: ${result.merchantName} (${money(result.amount)})`,
        severity: 'success'
      });
    } catch (err: any) {
      notify({ message: err.message || 'Lỗi đọc biên lai', severity: 'error' });
    } finally {
      setIsScanningReceipt(false);
      if (receiptInputRef.current) receiptInputRef.current.value = '';
    }
  };

  // Smart suggestions
  const timeInfo = useMemo(() => getTimeOfDaySuggestions(), []);
  const frequentHabits = useMemo(
    () => extractFrequentUserHabits(data?.transactions || [], categories, entryType),
    [data?.transactions, categories, entryType]
  );

  const relevantHabits = useMemo(() => {
    if (entryType === 'expense') {
      return [...frequentHabits, ...timeInfo.habits, ...COMMON_HABITS.filter(h => h.type === 'expense')];
    }
    if (entryType === 'income') {
      return [...frequentHabits, ...COMMON_HABITS.filter(h => h.type === 'income')];
    }
    if (entryType === 'invest') {
      return COMMON_HABITS.filter(h => h.type === 'invest');
    }
    return timeInfo.habits;
  }, [entryType, frequentHabits, timeInfo.habits]);

  // Deduplicate habits by name
  const deduplicatedHabits = useMemo(() => {
    const seen = new Set<string>();
    const res: HabitChip[] = [];
    for (const h of relevantHabits) {
      const k = h.name.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        res.push(h);
      }
    }
    return res;
  }, [relevantHabits]);

  // Real-time suggestions based on current query, time of day and history
  const filteredSuggestions = useMemo(() => {
    const rawClean = inputText.replace(/(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|nghìn|củ|lít|m|tỷ|vnd|đ|₫)?/gi, '').trim().toLowerCase();
    const normalizedQuery = rawClean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

    const pool = deduplicatedHabits;
    if (!rawClean) {
      return pool.slice(0, 6);
    }

    return pool.filter(h => {
      const hNorm = h.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
      const cNorm = h.categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
      return hNorm.includes(normalizedQuery) || cNorm.includes(normalizedQuery) || h.label.toLowerCase().includes(rawClean);
    }).slice(0, 8);
  }, [inputText, deduplicatedHabits]);

  // Handle Habit click
  const handleApplyHabit = (habit: HabitChip) => {
    setEntryType(habit.type as QuickEntryType);
    setOverrideAmount(habit.amount);
    setCustomCategory({ key: habit.categoryKey, name: habit.categoryName });
    const formattedAmount = habit.amount >= 1000000 ? `${habit.amount / 1000000}tr` : `${habit.amount / 1000}k`;
    setInputText(`${habit.name} ${formattedAmount}`);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle Quick Amount click
  const handleApplyQuickAmount = (val: number, label: string) => {
    setOverrideAmount(val);
    const baseText = inputText.replace(/(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|nghìn|đ|vnd)?/gi, '').trim();
    if (baseText) {
      setInputText(`${baseText} ${label}`);
    } else {
      setInputText(label);
    }
    inputRef.current?.focus();
  };

  // Handle Create Savings Goal
  const handleCreateGoal = async () => {
    if (!newGoalForm.name.trim() || Number(newGoalForm.target) <= 0) {
      notify('Vui lòng nhập tên mục tiêu và số tiền đích hợp lệ');
      return;
    }
    if (!canAddGoal(data!)) {
      setCreateGoalDialogOpen(false);
      onOpenPricing?.('Gói Free hỗ trợ tối đa 1 mục tiêu tiết kiệm. Nâng cấp Pro để tạo không giới hạn!');
      return;
    }

    const newGoal: SavingsGoal = {
      id: uid(),
      name: newGoalForm.name.trim(),
      target: Number(newGoalForm.target),
      startDate: todayKey(),
      dueDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      accountId: activeAccount?.id || accounts[0]?.id || 'wallet',
      icon: 'PiggyBank',
      contributions: []
    };

    await update(d => ({
      ...d,
      goals: [...(d.goals || []), newGoal]
    }), `Đã tạo mục tiêu tiết kiệm "${newGoal.name}"!`);

    setSelectedGoalId(newGoal.id);
    setCreateGoalDialogOpen(false);
    setNewGoalForm({ name: '', target: '20000000' });
  };

  // 1. EXECUTE DAILY MANUAL TRANSACTION
  const handleRecordDailyTransaction = async () => {
    if (parsed.amount <= 0) {
      notify('Vui lòng nhập hoặc chọn số tiền (> 0 ₫)');
      inputRef.current?.focus();
      return;
    }

    if (!activeAccount) {
      notify('Vui lòng chọn tài khoản giao dịch');
      return;
    }

    const prevSnapshot = data ? structuredClone(data) : null;
    const targetDate = parsed.date || customDate || todayKey();

    // A. TIẾT KIỆM
    if (entryType === 'saving') {
      const targetGoal = goals.find(g => g.id === selectedGoalId) || goals[0];
      if (!targetGoal) {
        notify('Vui lòng chọn hoặc tạo sổ tiết kiệm cần nạp tiền');
        setCreateGoalDialogOpen(true);
        return;
      }

      const contrib = {
        id: uid(),
        amount: parsed.amount,
        date: targetDate,
        accountId: activeAccount.id
      };

      const savingTx: Transaction = {
        id: uid(),
        name: `Gửi tiết kiệm: ${targetGoal.name}`,
        amount: parsed.amount,
        type: 'transfer',
        accountId: activeAccount.id,
        toAccountId: targetGoal.accountId || activeAccount.id,
        date: targetDate,
        method: 'Chuyển khoản',
        note: inputText || `Nạp tiền vào mục tiêu: ${targetGoal.name}`,
        status: 'completed'
      };

      await update(d => ({
        ...d,
        goals: (d.goals || []).map(g =>
          g.id === targetGoal.id
            ? { ...g, contributions: [...(g.contributions || []), contrib] }
            : g
        ),
        transactions: [savingTx, ...d.transactions]
      }));

      notify({
        message: `Đã nạp ${money(parsed.amount)} vào mục tiêu "${targetGoal.name}"!`,
        actionLabel: 'Hoàn tác',
        onAction: async () => {
          if (prevSnapshot) {
            await update(() => prevSnapshot);
            notify({ message: 'Đã hoàn tác giao dịch nạp tiết kiệm!', severity: 'info' });
          }
        }
      });

      setInputText('');
      setOverrideAmount(null);
      setCustomDate(null);
      setConfirmModalOpen(false);
      onClose();
      return;
    }

    // B. ĐẦU TƯ
    if (entryType === 'invest') {
      const ticker = parsed.ticker || 'TCB';
      const qty = parsed.quantity || 1;
      const price = parsed.price || parsed.amount;

      await update(d => {
        const inv: InvestmentAsset = {
          id: uid(),
          symbol: ticker,
          name: parsed.note || `Đầu tư ${ticker}`,
          assetClass: 'stock',
          quantity: qty,
          totalCostBasis: parsed.amount,
          currentUnitPrice: price,
          updatedAt: targetDate
        };
        const newTx: Transaction = {
          id: uid(),
          name: `Đầu tư ${ticker}`,
          amount: parsed.amount,
          type: 'expense',
          categoryId: 'invest',
          accountId: activeAccount.id,
          date: targetDate,
          method: 'Chuyển khoản',
          note: parsed.note,
          status: 'completed'
        };
        return {
          ...d,
          investments: [...(d.investments || []), inv],
          transactions: [newTx, ...d.transactions]
        };
      });

      notify({
        message: `Đã ghi nhận lệnh đầu tư ${ticker} (${money(parsed.amount)})!`,
        actionLabel: 'Hoàn tác',
        onAction: async () => {
          if (prevSnapshot) {
            await update(() => prevSnapshot);
            notify({ message: 'Đã hoàn tác giao dịch đầu tư!', severity: 'info' });
          }
        }
      });

      setInputText('');
      setOverrideAmount(null);
      setCustomDate(null);
      setConfirmModalOpen(false);
      onClose();
      return;
    }

    // C. THU NHẬP LƯƠNG & TRÍCH TIẾT KIỆM
    if (entryType === 'income' && isSalaryMode) {
      const salaryTxName = `Lương tháng ${formatVnMonth(salaryMonth)}`;
      const salaryTx: Transaction = {
        id: uid(),
        name: salaryTxName,
        amount: parsed.amount,
        type: 'income',
        categoryId: 'salary',
        accountId: activeAccount.id,
        date: targetDate,
        method: activeAccount.type === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
        note: inputText || `Nhận lương tháng ${formatVnMonth(salaryMonth)}`,
        status: 'completed'
      };

      let savingTx: Transaction | null = null;
      let nextGoals = goals;
      if (enableSalarySaving && salarySavingAmount > 0) {
        const goal = goals.find(g => g.id === salarySavingGoalId) || goals[0];
        if (goal) {
          savingTx = {
            id: uid(),
            name: `Trích lương gửi tiết kiệm: ${goal.name}`,
            amount: salarySavingAmount,
            type: 'transfer',
            accountId: activeAccount.id,
            toAccountId: goal.accountId || activeAccount.id,
            date: targetDate,
            method: 'Chuyển khoản',
            note: `Trích từ ${salaryTxName}`,
            status: 'completed'
          };

          nextGoals = goals.map(g =>
            g.id === goal.id
              ? {
                  ...g,
                  contributions: [
                    ...(g.contributions || []),
                    {
                      id: uid(),
                      amount: salarySavingAmount,
                      date: targetDate,
                      accountId: activeAccount.id
                    }
                  ]
                }
              : g
          );
        }
      }

      await update(d => {
        let nextPayrolls = d.payrolls || [];
        if (syncPayroll) {
          const syncRes = syncSalaryToPayroll(nextPayrolls, {
            name: salaryTxName,
            amount: parsed.amount,
            date: targetDate,
            accountId: activeAccount.id,
            note: `Nhập nhanh từ mục Thu nhập: ${salaryTxName}`
          });
          nextPayrolls = syncRes.updatedPayrolls;
        }

        const newTxs: Transaction[] = savingTx ? [salaryTx, savingTx] : [salaryTx];
        return {
          ...d,
          transactions: [...newTxs, ...d.transactions],
          payrolls: nextPayrolls,
          goals: nextGoals
        };
      });

      notify({
        message: `Đã ghi nhận ${salaryTxName} (+${money(parsed.amount)})!`,
        actionLabel: 'Hoàn tác',
        onAction: async () => {
          if (prevSnapshot) {
            await update(() => prevSnapshot);
            notify({ message: 'Đã hoàn tác giao dịch lương!', severity: 'info' });
          }
        }
      });

      setInputText('');
      setOverrideAmount(null);
      setCustomDate(null);
      setIsSalaryMode(false);
      setConfirmModalOpen(false);
      onClose();
      return;
    }

    // D. GIAO DỊCH CHI TIÊU / THU NHẬP THƯỜNG
    const txName = parsed.note || (entryType === 'income' ? 'Khoản thu' : 'Khoản chi');
    const newTx: Transaction = {
      id: uid(),
      name: txName,
      amount: parsed.amount,
      type: entryType as TxType,
      categoryId: parsed.categoryKey,
      accountId: activeAccount.id,
      date: targetDate,
      method: activeAccount.type === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
      note: inputText || parsed.note,
      receiptUrl: receiptUrl || undefined,
      status: 'completed'
    };

    saveQuickNote(newTx.name);

    await update(d => ({
      ...d,
      transactions: [newTx, ...d.transactions]
    }));

    notify({
      message: `Đã lưu: ${newTx.name} (${entryType === 'income' ? '+' : '-'}${money(newTx.amount)})`,
      actionLabel: 'Hoàn tác',
      onAction: async () => {
        if (prevSnapshot) {
          await update(() => prevSnapshot);
          notify({ message: 'Đã hoàn tác giao dịch!', severity: 'info' });
        }
      }
    });

    setInputText('');
    setOverrideAmount(null);
    setCustomDate(null);
    setReceiptUrl(null);
    setVoiceStatus('idle');
    setConfirmModalOpen(false);
    onClose();
  };

  // Open separate dedicated confirmation modal
  const handleOpenConfirmModal = () => {
    if (parsed.amount <= 0) {
      notify('Vui lòng nhập hoặc chọn số tiền (> 0 ₫)');
      inputRef.current?.focus();
      return;
    }
    if (!activeAccount) {
      notify('Vui lòng chọn tài khoản giao dịch');
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleConfirmSave = async () => {
    setConfirmModalOpen(false);
    await handleRecordDailyTransaction();
  };

  // 2. EXECUTE AI COMMAND
  const handleAiSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!aiText.trim()) return;

    if (!nlpQuota.allowed) {
      onOpenPricing?.('Bạn đã dùng hết 5 lượt nhập nhanh AI hôm nay. Nâng cấp Pro để dùng không giới hạn!');
      return;
    }

    if (!aiCommandResult) {
      notify('Chưa nhận diện được lệnh. Hãy thử chọn các mẫu gợi ý bên dưới!');
      return;
    }

    // AI INTENT: QUERY / VIEW INSIGHTS
    if (aiCommandResult.intent === 'query_view') {
      // Just showing insights, no state mutations required
      return;
    }

    const today = todayKey();
    const streakResult = updateStreak(data!.user, today);
    const currentCount =
      data!.user.nlpUsageToday?.date === today
        ? data!.user.nlpUsageToday.count + 1
        : 1;

    const prevSnapshot = data ? structuredClone(data) : null;

    // AI COMPOUND: SALARY AND SAVING
    if (aiCommandResult.intent === 'salary_and_saving' && aiCommandResult.salaryAndSaving) {
      const { salaryAmount, salaryAccountId, month, savingAmount, savingGoalName } = aiCommandResult.salaryAndSaving;
      const matchedGoal = savingGoalName
        ? goals.find(g => g.name.toLowerCase().includes(savingGoalName.toLowerCase()))
        : null;

      setConfirmData({
        originalText: aiText,
        salaryAmount,
        salaryAccount: aiCustomAccountId || salaryAccountId || data!.user.defaultAccountId || activeAccount.id,
        month: month || todayKey().slice(0, 7),
        savingAmount,
        savingOption: (matchedGoal || goals.length > 0) ? 'existing' : 'new',
        selectedGoalId: matchedGoal?.id || goals[0]?.id || '',
        newGoalName: savingGoalName || 'Sổ tiết kiệm mới',
        newGoalTarget: savingAmount * 5
      });
      setChatConfirmOpen(true);
      return;
    }

    // AI SAVINGS DEPOSIT
    if (aiCommandResult.intent === 'savings_deposit' && aiCommandResult.savingsDeposit) {
      const { amount, goalName, sourceAccountId } = aiCommandResult.savingsDeposit;
      const matchedGoal = goalName
        ? goals.find(g => g.name.toLowerCase().includes(goalName.toLowerCase()))
        : null;

      setConfirmData({
        originalText: aiText,
        salaryAmount: 0,
        salaryAccount: aiCustomAccountId || sourceAccountId || data!.user.defaultAccountId || activeAccount.id,
        month: todayKey().slice(0, 7),
        savingAmount: amount,
        savingOption: (matchedGoal || goals.length > 0) ? 'existing' : 'new',
        selectedGoalId: matchedGoal?.id || goals[0]?.id || '',
        newGoalName: goalName || 'Sổ tiết kiệm mới',
        newGoalTarget: amount * 5
      });
      setChatConfirmOpen(true);
      return;
    }

    // AI RECONCILE
    if (aiCommandResult.intent === 'reconcile' && aiCommandResult.reconcile) {
      const { accountId, actualBalance } = aiCommandResult.reconcile;
      const targetAccountId = aiCustomAccountId || accountId;
      const targetAcc = accounts.find(a => a.id === targetAccountId);
      if (!targetAcc) {
        notify('Không tìm thấy tài khoản cần cân bằng');
        return;
      }
      const recResult = createReconciliationTransaction(targetAcc, actualBalance, data!.transactions, data!.categories);
      if (!recResult) {
        notify(`Số dư "${targetAcc.name}" đã khớp chính xác với ${money(actualBalance)}`);
        setAiText('');
        onClose();
        return;
      }

      await update(d => ({
        ...d,
        transactions: [recResult.transaction, ...d.transactions],
        user: {
          ...d.user,
          streakCount: streakResult.streakCount,
          lastCheckInDate: streakResult.lastCheckInDate,
          nlpUsageToday: { date: today, count: currentCount }
        }
      }));

      notify({
        message: `Đã cân bằng số dư "${targetAcc.name}" về ${money(actualBalance)}`,
        actionLabel: 'Hoàn tác',
        onAction: async () => {
          if (prevSnapshot) {
            await update(() => prevSnapshot);
            notify({ message: 'Đã hoàn tác thao tác cân bằng!', severity: 'info' });
          }
        }
      });

      setAiText('');
      onClose();
      return;
    }

    // AI MULTI-TRANSACTION (Compound sentence with multiple transactions)
    if (aiCommandResult.intent === 'multi_transaction' && aiCommandResult.multiTransactions) {
      const drafts = aiCommandResult.multiTransactions;
      await update(d => {
        const newTxs: Transaction[] = drafts.map(m => ({
          id: uid(),
          name: m.name,
          amount: m.amount,
          type: m.type,
          categoryId: m.categoryId,
          accountId: m.accountId || activeAccount.id,
          date: m.date,
          method: 'Lệnh AI Đa Giao Dịch',
          note: `[Tách từ câu phức] ${m.clause}`,
          status: 'completed'
        }));
        return {
          ...d,
          transactions: [...newTxs, ...(d.transactions || [])]
        };
      }, `Đã ghi nhận thành công ${drafts.length} giao dịch từ câu lệnh của bạn!`);

      setAiText('');
      onClose();
      return;
    }

    // AI STANDARD TRANSACTION
    if (aiCommandResult.intent === 'transaction' && aiCommandResult.transaction) {
      const tx = aiCommandResult.transaction;
      const finalAccountId = aiCustomAccountId || tx.accountId || activeAccount.id;
      const finalCategoryId = aiCustomCategoryId || tx.categoryId || (categories.find(c => c.type === tx.type)?.id || 'other');
      const isSalary = tx.type === 'income' && finalCategoryId === 'salary';

      await update(d => {
        const newTx: Transaction = {
          id: uid(),
          name: tx.name,
          amount: tx.amount,
          type: tx.type,
          categoryId: finalCategoryId,
          accountId: finalAccountId,
          date: tx.date,
          method: 'Lệnh AI',
          note: `Nhập qua AI: ${aiText}`,
          status: 'completed'
        };

        let nextPayrolls = d.payrolls || [];
        if (isSalary) {
          const syncRes = syncSalaryToPayroll(nextPayrolls, {
            name: tx.name,
            amount: tx.amount,
            date: tx.date,
            accountId: finalAccountId,
            note: `Lệnh AI: ${aiText}`
          });
          nextPayrolls = syncRes.updatedPayrolls;
        }

        return {
          ...d,
          transactions: [newTx, ...d.transactions],
          payrolls: nextPayrolls,
          user: {
            ...d.user,
            streakCount: streakResult.streakCount,
            lastCheckInDate: streakResult.lastCheckInDate,
            nlpUsageToday: { date: today, count: currentCount }
          }
        };
      });

      notify({
        message: `Đã ghi nhận qua AI: ${tx.name} (${money(tx.amount)})`,
        actionLabel: 'Hoàn tác',
        onAction: async () => {
          if (prevSnapshot) {
            await update(() => prevSnapshot);
            notify({ message: 'Đã hoàn tác giao dịch AI!', severity: 'info' });
          }
        }
      });

      setAiText('');
      onClose();
      return;
    }

    // AI INVESTMENT
    if (aiCommandResult.intent === 'investment' && aiCommandResult.investment) {
      const inv = aiCommandResult.investment;
      const finalAccountId = aiCustomAccountId || inv.accountId || activeAccount.id;

      await update(d => {
        const newAsset: InvestmentAsset = {
          id: uid(),
          symbol: inv.symbol,
          name: inv.name || `Đầu tư ${inv.symbol}`,
          assetClass: inv.assetClass,
          quantity: inv.quantity,
          totalCostBasis: inv.totalCostBasis,
          currentUnitPrice: inv.currentUnitPrice,
          updatedAt: today
        };
        const newTx: Transaction = {
          id: uid(),
          name: `Mua ${inv.quantity} ${inv.symbol}`,
          amount: inv.totalCostBasis,
          type: 'expense',
          categoryId: 'invest',
          accountId: finalAccountId,
          date: today,
          method: 'Lệnh AI',
          note: `Đầu tư AI: ${aiText}`,
          status: 'completed'
        };
        return {
          ...d,
          investments: [...(d.investments || []), newAsset],
          transactions: [newTx, ...d.transactions],
          user: {
            ...d.user,
            streakCount: streakResult.streakCount,
            lastCheckInDate: streakResult.lastCheckInDate,
            nlpUsageToday: { date: today, count: currentCount }
          }
        };
      });

      notify({
        message: `Đã ghi nhận lệnh mua ${inv.quantity} ${inv.symbol} (${money(inv.totalCostBasis)})!`,
        actionLabel: 'Hoàn tác',
        onAction: async () => {
          if (prevSnapshot) {
            await update(() => prevSnapshot);
            notify({ message: 'Đã hoàn tác lệnh đầu tư!', severity: 'info' });
          }
        }
      });

      setAiText('');
      onClose();
    }
  };

  // Confirm Compound Command
  const handleConfirmAiCompound = async () => {
    const today = todayKey();
    const targetAccount = accounts.find(a => a.id === confirmData.salaryAccount) || activeAccount;
    const prevSnapshot = data ? structuredClone(data) : null;

    await update(d => {
      let nextTransactions = [...d.transactions];
      let nextPayrolls = d.payrolls || [];
      let nextGoals = d.goals || [];

      if (confirmData.salaryAmount > 0) {
        const salaryTx: Transaction = {
          id: uid(),
          name: `Nhận lương tháng ${formatVnMonth(confirmData.month)}`,
          amount: confirmData.salaryAmount,
          type: 'income',
          categoryId: 'salary',
          accountId: targetAccount.id,
          date: today,
          method: targetAccount.type === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
          note: `Nhận lương AI: ${confirmData.originalText}`,
          status: 'completed'
        };

        const syncRes = syncSalaryToPayroll(nextPayrolls, {
          name: salaryTx.name,
          amount: confirmData.salaryAmount,
          date: today,
          accountId: targetAccount.id,
          note: `Nhập tự động qua AI: ${confirmData.originalText}`
        });
        nextPayrolls = syncRes.updatedPayrolls;
        nextTransactions = [salaryTx, ...nextTransactions];
      }

      if (confirmData.savingAmount > 0) {
        if (confirmData.savingOption === 'existing' && confirmData.selectedGoalId) {
          const targetGoal = goals.find(g => g.id === confirmData.selectedGoalId) || goals[0];
          const newContrib = {
            id: uid(),
            amount: confirmData.savingAmount,
            date: today,
            accountId: targetAccount.id
          };

          const savingTx: Transaction = {
            id: uid(),
            name: `Gửi tiết kiệm: ${targetGoal.name}`,
            amount: confirmData.savingAmount,
            type: 'transfer',
            accountId: targetAccount.id,
            toAccountId: targetGoal.accountId || targetAccount.id,
            date: today,
            method: 'Chuyển khoản',
            note: `Gửi tiết kiệm qua AI: ${confirmData.originalText}`,
            status: 'completed'
          };

          nextGoals = nextGoals.map(g =>
            g.id === confirmData.selectedGoalId
              ? { ...g, contributions: [...(g.contributions || []), newContrib] }
              : g
          );
          nextTransactions = [savingTx, ...nextTransactions];
        } else {
          const newGoalName = confirmData.newGoalName.trim() || 'Sổ tiết kiệm mới';
          const newGoal: SavingsGoal = {
            id: uid(),
            name: newGoalName,
            icon: 'PiggyBank',
            target: confirmData.newGoalTarget || confirmData.savingAmount * 5,
            startDate: today,
            dueDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
            accountId: targetAccount.id,
            contributions: [
              {
                id: uid(),
                amount: confirmData.savingAmount,
                date: today,
                accountId: targetAccount.id
              }
            ]
          };

          const savingTx: Transaction = {
            id: uid(),
            name: `Khởi tạo sổ tiết kiệm: ${newGoalName}`,
            amount: confirmData.savingAmount,
            type: 'transfer',
            accountId: targetAccount.id,
            toAccountId: targetAccount.id,
            date: today,
            method: 'Chuyển khoản',
            note: `Tạo sổ tiết kiệm qua AI: ${confirmData.originalText}`,
            status: 'completed'
          };

          nextGoals = [...nextGoals, newGoal];
          nextTransactions = [savingTx, ...nextTransactions];
        }
      }

      return {
        ...d,
        transactions: nextTransactions,
        payrolls: nextPayrolls,
        goals: nextGoals
      };
    });

    notify({
      message: confirmData.salaryAmount > 0
        ? `Đã nhận lương ${money(confirmData.salaryAmount)} & nạp ${money(confirmData.savingAmount)} vào sổ tiết kiệm!`
        : `Đã nạp ${money(confirmData.savingAmount)} vào sổ tiết kiệm!`,
      actionLabel: 'Hoàn tác',
      onAction: async () => {
        if (prevSnapshot) {
          await update(() => prevSnapshot);
          notify({ message: 'Đã hoàn tác giao dịch!', severity: 'info' });
        }
      }
    });

    setChatConfirmOpen(false);
    setAiText('');
    onClose();
  };

  const activeCategories = useMemo(() => {
    if (entryType === 'expense') {
      return categories.filter(c => c.type === 'expense');
    }
    if (entryType === 'income') {
      return categories.filter(c => c.type === 'income');
    }
    return [];
  }, [categories, entryType]);


  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        onKeyDown={e => {
          if (e.key === 'Enter') {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA') return;
            e.preventDefault();
            if (mainMode === 'daily') {
              handleOpenConfirmModal();
            } else {
              handleAiSubmit();
            }
          }
        }}
        disableScrollLock={false}
        slots={{
          transition: isMobile ? TransitionUp : undefined
        }}
        slotProps={{
          paper: {
            sx: {
              ...(isMobile
                ? {
                    m: 0,
                    width: '100%',
                    maxWidth: '100%',
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    borderRadius: '16px 16px 0 0',
                    maxHeight: '92vh',
                    pb: 'calc(env(safe-area-inset-bottom, 16px) + 12px)'
                  }
                : {
                    m: 2,
                    width: '100%',
                    maxWidth: 580,
                    borderRadius: '12px',
                    maxHeight: '88vh'
                  }),
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 48px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px var(--border-subtle)',
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              overflow: 'hidden'
            }
          }
        }}
      >
        {/* Mobile top drag handle indicator */}
        {isMobile && (
          <Box
            sx={{
              width: 38,
              height: 4,
              borderRadius: '2px',
              bgcolor: 'text.disabled',
              mx: 'auto',
              mt: 1.25,
              mb: 0.25,
              opacity: 0.5
            }}
          />
        )}

        {/* SLEEK UNIFIED MODAL HEADER */}
        <DialogTitle
          sx={{
            py: { xs: 1.5, sm: 1.75 },
            px: { xs: 2, sm: 2.75 },
            borderBottom: '1px solid var(--border-subtle)',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5
          }}
        >
          {/* Mode Switcher (4 Unified Modes: Daily, Camera VietQR, AI Assistant, Manual Full) */}
          <Box
            sx={{
              display: 'inline-flex',
              p: 0.4,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--border-subtle)',
              gap: 0.5,
              flexWrap: 'wrap'
            }}
          >
            <Button
              size="small"
              onClick={() => setMainMode('daily')}
              startIcon={<Zap size={14} />}
              sx={{
                borderRadius: '7px',
                px: { xs: 1.25, sm: 1.75 },
                py: 0.5,
                fontSize: { xs: '0.78rem', sm: '0.82rem' },
                fontWeight: mainMode === 'daily' ? 800 : 600,
                textTransform: 'none',
                color: mainMode === 'daily' ? (isDark ? '#FFFFFF' : '#0F172A') : 'text.secondary',
                bgcolor: mainMode === 'daily' ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
                boxShadow: mainMode === 'daily' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                border: mainMode === 'daily' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: mainMode === 'daily' ? (isDark ? '#1E293B' : '#FFFFFF') : 'action.hover'
                }
              }}
            >
              Ghi nhanh
            </Button>

            <Button
              size="small"
              onClick={() => setMainMode('camera')}
              startIcon={<Camera size={14} />}
              sx={{
                borderRadius: '7px',
                px: { xs: 1.25, sm: 1.75 },
                py: 0.5,
                fontSize: { xs: '0.78rem', sm: '0.82rem' },
                fontWeight: mainMode === 'camera' ? 800 : 600,
                textTransform: 'none',
                color: mainMode === 'camera' ? '#3B82F6' : 'text.secondary',
                bgcolor: mainMode === 'camera' ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
                boxShadow: mainMode === 'camera' ? '0 2px 6px rgba(59, 130, 246, 0.15)' : 'none',
                border: mainMode === 'camera' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: mainMode === 'camera' ? (isDark ? '#1E293B' : '#FFFFFF') : 'action.hover'
                }
              }}
            >
              Camera VietQR
              <Box
                component="span"
                sx={{
                  ml: 0.5,
                  px: 0.6,
                  py: 0.1,
                  borderRadius: '4px',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  bgcolor: '#3B82F6',
                  color: '#FFFFFF'
                }}
              >
                MỚI
              </Box>
            </Button>

            <Button
              size="small"
              onClick={() => setMainMode('ai')}
              startIcon={<Sparkles size={14} />}
              sx={{
                borderRadius: '7px',
                px: { xs: 1.25, sm: 1.75 },
                py: 0.5,
                fontSize: { xs: '0.78rem', sm: '0.82rem' },
                fontWeight: mainMode === 'ai' ? 800 : 600,
                textTransform: 'none',
                color: mainMode === 'ai' ? (isDark ? '#FFFFFF' : '#0F172A') : 'text.secondary',
                bgcolor: mainMode === 'ai' ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
                boxShadow: mainMode === 'ai' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                border: mainMode === 'ai' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: mainMode === 'ai' ? (isDark ? '#1E293B' : '#FFFFFF') : 'action.hover'
                }
              }}
            >
              Trợ lý AI
            </Button>

            <Button
              size="small"
              onClick={() => {
                setManualForm({
                  name: parsed.note || (parsed.categoryName ? `${parsed.categoryName}` : 'Chi tiêu'),
                  amount: parsed.amount > 0 ? parsed.amount : 50000,
                  type: (entryType === 'invest' ? 'expense' : entryType) as TxType,
                  categoryId: customCategory?.key || categories[0]?.id || 'food',
                  accountId: customAccountId || accounts[0]?.id || 'bank',
                  date: customDate || todayKey(),
                  note: ''
                });
                setMainMode('manual');
              }}
              startIcon={<Plus size={14} />}
              sx={{
                borderRadius: '7px',
                px: { xs: 1.25, sm: 1.75 },
                py: 0.5,
                fontSize: { xs: '0.78rem', sm: '0.82rem' },
                fontWeight: mainMode === 'manual' ? 800 : 600,
                textTransform: 'none',
                color: mainMode === 'manual' ? (isDark ? '#FFFFFF' : '#0F172A') : 'text.secondary',
                bgcolor: mainMode === 'manual' ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
                boxShadow: mainMode === 'manual' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                border: mainMode === 'manual' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: mainMode === 'manual' ? (isDark ? '#1E293B' : '#FFFFFF') : 'action.hover'
                }
              }}
            >
              Nhập chi tiết
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {mainMode === 'ai' && (
              <>
                {!isProUser(data!) && (
                  <Chip
                    label={`${nlpQuota.remaining}/5`}
                    size="small"
                    color={nlpQuota.remaining > 0 ? 'default' : 'error'}
                    sx={{ fontSize: 11, fontWeight: 750, height: 24 }}
                  />
                )}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AccountBalanceRounded sx={{ fontSize: 13 }} />}
                  onClick={() => setBankSmsModalOpen(true)}
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    height: 28,
                    borderRadius: '6px',
                    borderColor: 'rgba(21, 150, 107, 0.4)',
                    color: '#15966B'
                  }}
                >
                  Dán SMS
                </Button>
              </>
            )}

            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: 'text.secondary',
                borderRadius: '6px',
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }
              }}
            >
              <X size={18} />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* MODAL DIALOG CONTENT */}
        <DialogContent
          sx={{
            p: { xs: 2, sm: 2.5 },
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {/* =========================================================================
              TAB 1: GHI CHÉP 1-CHẠM (STREAMLINED, ZERO CLUTTER, FOCUSED)
              ========================================================================= */}
                    {/* =========================================================================
              TAB 1: GHI CHÉP 1-CHẠM (STREAMLINED, SPACIOUS, ZERO CLUTTER)
              ========================================================================= */}
          {mainMode === 'daily' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* 1. FINANCIAL INTENT SEGMENTED CONTROL (REDESIGNED ACTIVE PILLS) */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  p: 0.5,
                  borderRadius: '10px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(241, 245, 249, 0.85)',
                  border: '1px solid var(--border-subtle)',
                  gap: 0.5
                }}
              >
                {[
                  { type: 'expense' as const, label: 'Chi tiêu', color: '#DC2626', bg: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FFFFFF', icon: <TrendingDownRounded sx={{ fontSize: 16 }} /> },
                  { type: 'income' as const, label: 'Thu nhập', color: '#16A34A', bg: isDark ? 'rgba(22, 163, 74, 0.2)' : '#FFFFFF', icon: <TrendingUpRounded sx={{ fontSize: 16 }} /> },
                  { type: 'saving' as const, label: 'Tiết kiệm', color: '#7C3AED', bg: isDark ? 'rgba(124, 58, 237, 0.2)' : '#FFFFFF', icon: <SavingsRounded sx={{ fontSize: 16 }} /> },
                  { type: 'invest' as const, label: 'Đầu tư', color: '#2563EB', bg: isDark ? 'rgba(37, 99, 235, 0.2)' : '#FFFFFF', icon: <ShowChartRounded sx={{ fontSize: 16 }} /> }
                ].map(tab => {
                  const isSelected = entryType === tab.type;
                  return (
                    <Button
                      key={tab.type}
                      size="small"
                      onClick={() => {
                        setEntryType(tab.type);
                        setOverrideAmount(null);
                        if (tab.type === 'income') {
                          const salCat = categories.find(c => c.type === 'income');
                          setCustomCategory(salCat ? { key: salCat.id, name: salCat.name } : null);
                        } else if (tab.type === 'expense') {
                          const firstExp = categories.find(c => c.type === 'expense');
                          setCustomCategory(firstExp ? { key: firstExp.id, name: firstExp.name } : null);
                        } else {
                          setCustomCategory(null);
                        }
                      }}
                      startIcon={tab.icon}
                      sx={{
                        py: 0.85,
                        px: 0.5,
                        borderRadius: '8px',
                        fontSize: { xs: '0.76rem', sm: '0.82rem' },
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? tab.color : 'text.secondary',
                        bgcolor: isSelected ? tab.bg : 'transparent',
                        border: isSelected ? `1.5px solid ${tab.color}` : '1.5px solid transparent',
                        boxShadow: isSelected
                          ? isDark
                            ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                            : '0 2px 8px rgba(0, 0, 0, 0.08)'
                          : 'none',
                        transition: 'all 0.15s ease',
                        minWidth: 0,
                        textTransform: 'none',
                        '& .MuiButton-startIcon': { mr: { xs: 0.3, sm: 0.6 } },
                        '&:hover': {
                          bgcolor: isSelected ? tab.bg : 'action.hover',
                          color: isSelected ? tab.color : 'text.primary'
                        }
                      }}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </Box>

              {/* 2. TRANSACTION DATE (PLACED AT THE TOP) */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  px: 1.5,
                  borderRadius: '8px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.35)' : 'rgba(248, 250, 252, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Calendar size={15} style={{ color: activeColor }} />
                  <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.primary', fontSize: '0.8rem' }}>
                    Ngày ghi nhận:
                  </Typography>
                  <Chip
                    label="Hôm nay"
                    size="small"
                    clickable
                    onClick={() => setCustomDate(todayKey())}
                    sx={{
                      height: 24,
                      fontSize: '0.72rem',
                      fontWeight: 750,
                      borderRadius: '6px',
                      bgcolor: isToday ? activeTheme.bgSubtle : 'action.hover',
                      color: isToday ? activeColor : 'text.secondary',
                      border: isToday ? `1px solid ${activeColor}` : '1px solid var(--border-subtle)'
                    }}
                  />
                  <Chip
                    label="Hôm qua"
                    size="small"
                    clickable
                    onClick={() => setCustomDate(yesterdayDate())}
                    sx={{
                      height: 24,
                      fontSize: '0.72rem',
                      fontWeight: 750,
                      borderRadius: '6px',
                      bgcolor: isYesterday ? activeTheme.bgSubtle : 'action.hover',
                      color: isYesterday ? activeColor : 'text.secondary',
                      border: isYesterday ? `1px solid ${activeColor}` : '1px solid var(--border-subtle)'
                    }}
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: 160 } }}>
                  <MuiDatePicker
                    label=""
                    value={parsed.date || todayKey()}
                    onChange={val => {
                      if (val) setCustomDate(val);
                    }}
                  />
                </Box>
              </Box>

              {/* 3. HERO SMART INPUT & LIVE VALUE BADGE */}
              <Paper
                ref={inputWrapperRef}
                variant="outlined"
                sx={{
                  position: 'relative',
                  p: { xs: 1.75, sm: 2 },
                  borderRadius: '10px',
                  border: '1.5px solid',
                  borderColor: showSuggestions ? activeTheme.accent : 'var(--border-subtle)',
                  bgcolor: isDark ? '#1E293B' : '#F8FAFC',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease'
                }}
              >
                {/* Main text input row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <InputBase
                    inputRef={inputRef}
                    fullWidth
                    autoFocus
                    value={inputText}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={e => {
                      setInputText(e.target.value);
                      setOverrideAmount(null);
                      setShowSuggestions(true);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setShowSuggestions(false);
                        handleOpenConfirmModal();
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }}
                    placeholder={
                      entryType === 'saving'
                        ? 'Nhập: 2tr quỹ khẩn cấp, tiết kiệm 5tr...'
                        : entryType === 'income'
                        ? isSalaryMode
                          ? 'Nhập: Lương tháng 25tr...'
                          : 'Nhập: Thưởng 5tr, làm thêm 1.5tr...'
                        : entryType === 'invest'
                        ? 'Nhập: Mua 100 TCB giá 32, mua 1 chỉ vàng...'
                        : 'Nhập: Cà phê 30k, ăn trưa 45k, đổ xăng 50k...'
                    }
                    sx={{
                      fontSize: { xs: 16, sm: 18.5 },
                      fontWeight: 650,
                      color: 'text.primary',
                      '& input::placeholder': {
                        color: 'text.secondary',
                        opacity: 0.65,
                        fontWeight: 500,
                        fontSize: { xs: 14.5, sm: 16 }
                      }
                    }}
                  />

                  {inputText && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setInputText('');
                        setOverrideAmount(null);
                        inputRef.current?.focus();
                      }}
                      sx={{ p: 0.5, borderRadius: '6px', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                    >
                      <X size={16} />
                    </IconButton>
                  )}
                </Box>

                {/* Sub row inside hero input: Live Recognition Badges + Dropdown Trigger + Voice + Camera */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pt: 1.25,
                    borderTop: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: 1
                  }}
                >
                  {/* Live Recognition Pill */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {parsed.amount > 0 ? (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.25,
                          py: 0.45,
                          borderRadius: '7px',
                          bgcolor: activeTheme.bgSubtle,
                          border: `1px solid ${activeTheme.borderSubtle}`,
                          color: activeTheme.text
                        }}
                      >
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          {money(parsed.amount)}
                        </Typography>
                        {parsed.categoryName && (
                          <>
                            <Typography sx={{ opacity: 0.4, fontSize: '0.75rem' }}>•</Typography>
                            <Typography sx={{ fontSize: '0.76rem', fontWeight: 700 }}>
                              {parsed.categoryName}
                            </Typography>
                          </>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.76rem', fontWeight: 550 }}>
                        Gõ số tiền hoặc nội dung tự nhiên...
                      </Typography>
                    )}
                  </Box>

                  {/* Actions & Dropdown Button */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setShowSuggestions(prev => !prev)}
                      startIcon={<Lightbulb size={14} style={{ color: activeTheme.accent }} />}
                      endIcon={<ChevronDown size={13} style={{ transform: showSuggestions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                      sx={{
                        fontSize: '0.76rem',
                        fontWeight: 750,
                        py: 0.4,
                        px: 1.25,
                        borderRadius: '7px',
                        textTransform: 'none',
                        color: showSuggestions ? activeTheme.text : 'text.secondary',
                        bgcolor: showSuggestions ? activeTheme.bgSubtle : 'action.hover',
                        border: '1px solid var(--border-subtle)',
                        '&:hover': {
                          bgcolor: activeTheme.bgSubtle,
                          color: activeTheme.text
                        }
                      }}
                    >
                      Gợi ý thông minh
                    </Button>

                    {/* Hidden receipt file input */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={receiptInputRef}
                      style={{ display: 'none' }}
                      onChange={handleReceiptUpload}
                    />

                    {/* Receipt Scanner */}
                    <Tooltip title="Chụp / tải ảnh biên lai (OCR)">
                      <IconButton
                        size="small"
                        onClick={() => receiptInputRef.current?.click()}
                        disabled={isScanningReceipt}
                        sx={{
                          p: 0.6,
                          borderRadius: '6px',
                          color: receiptUrl ? '#10B981' : 'text.secondary',
                          bgcolor: receiptUrl ? 'rgba(16, 185, 129, 0.12)' : 'action.hover',
                          '&:hover': { color: '#10B981' }
                        }}
                      >
                        <Camera size={16} />
                      </IconButton>
                    </Tooltip>

                    {/* Voice */}
                    <Tooltip title={voiceStatus === 'listening' ? 'Đang nghe...' : 'Nhập bằng giọng nói'}>
                      <IconButton
                        size="small"
                        onClick={handleToggleVoice}
                        sx={{
                          p: 0.6,
                          borderRadius: '6px',
                          color: voiceStatus === 'listening' ? '#EF4444' : 'text.secondary',
                          bgcolor: voiceStatus === 'listening' ? 'rgba(239, 68, 68, 0.15)' : 'action.hover',
                          border: voiceStatus === 'listening' ? '1px solid #EF4444' : 'none',
                          '&:hover': { color: activeColor }
                        }}
                      >
                        {voiceStatus === 'listening' ? <MicOff size={16} /> : <Mic size={16} />}
                      </IconButton>
                    </Tooltip>

                    {/* In-Keyboard Calculator */}
                    <Tooltip title="Mở máy tính số tiền">
                      <IconButton
                        size="small"
                        onClick={(e) => setCalcAnchor(e.currentTarget)}
                        sx={{
                          p: 0.6,
                          borderRadius: '6px',
                          color: 'text.secondary',
                          bgcolor: 'action.hover',
                          '&:hover': { color: activeColor }
                        }}
                      >
                        <CalculateOutlined sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>

                    <Popover
                      open={Boolean(calcAnchor)}
                      anchorEl={calcAnchor}
                      onClose={() => setCalcAnchor(null)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                      }}
                      slotProps={{
                        paper: {
                          sx: {
                            mt: 1,
                            borderRadius: 3,
                            boxShadow: '0 12px 36px rgba(0,0,0,0.2)'
                          }
                        }
                      }}
                    >
                      <CalculatorKeypad
                        initialValue={parsed.amount > 0 ? parsed.amount : ''}
                        onApply={(finalVal) => {
                          setOverrideAmount(finalVal);
                          setCalcAnchor(null);
                        }}
                        onClose={() => setCalcAnchor(null)}
                      />
                    </Popover>
                  </Box>
                </Box>

                {/* THE FLOATING INTELLIGENT DROPDOWN WITH DISTINCT DEDICATED BACKGROUND */}
                <Popper
                  open={showSuggestions}
                  anchorEl={inputWrapperRef.current}
                  placement="bottom-start"
                  style={{ width: inputWrapperRef.current?.clientWidth, zIndex: 1450 }}
                >
                  <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
                    <Paper
                      elevation={10}
                      sx={{
                        mt: 0.75,
                        borderRadius: '12px',
                        border: '1.5px solid var(--border-subtle)',
                        bgcolor: isDark ? 'rgba(24, 32, 47, 0.98)' : '#FFFFFF',
                        backdropFilter: 'blur(16px)',
                        boxShadow: '0 20px 48px -8px rgba(15, 23, 42, 0.3)',
                        maxHeight: 340,
                        overflowY: 'auto',
                        p: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5
                      }}
                    >
                      {/* Section A: Quick Amount Presets (Inside Suggestions Dropdown) */}
                      <Box sx={{ p: 1, borderRadius: '8px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1, display: 'block' }}>
                          Phím tắt số tiền
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
                          {(entryType === 'saving'
                            ? SAVING_QUICK_AMOUNTS
                            : entryType === 'income' && isSalaryMode
                            ? SALARY_QUICK_AMOUNTS
                            : EXPENSE_QUICK_AMOUNTS
                          ).map(chip => (
                            <Button
                              key={chip.label}
                              variant="outlined"
                              size="small"
                              onClick={() => handleApplyQuickAmount(chip.value, chip.label)}
                              sx={{
                                borderRadius: '6px',
                                minWidth: 'auto',
                                py: 0.5,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: 'text.primary',
                                borderColor: 'var(--border-subtle)',
                                bgcolor: 'background.paper',
                                '&:hover': {
                                  borderColor: 'var(--brand-primary)',
                                  bgcolor: 'background.default'
                                }
                              }}
                            >
                              {chip.label}
                            </Button>
                          ))}
                        </Box>
                      </Box>

                      {/* Section B: Smart Suggestions (Filtered by input or time of day) */}
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            ⚡ Gợi ý {timeInfo.timeLabel.toLowerCase()} & thói quen
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            {filteredSuggestions.length} mục
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                          {filteredSuggestions.map(item => {
                            const formattedAmount = item.amount >= 1000000 ? `${item.amount / 1000000}tr` : `${item.amount / 1000}k`;
                            return (
                              <Box
                                key={item.id}
                                onClick={() => handleApplyHabit(item)}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 0.75,
                                  px: 1,
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.12s ease',
                                  '&:hover': {
                                    bgcolor: activeTheme.bgSubtle,
                                    '& .habit-title': { color: activeTheme.text }
                                  }
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                  <Box
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '6px',
                                      bgcolor: `${item.badgeColor || activeTheme.accent}14`,
                                      color: item.badgeColor || activeTheme.accent,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    {getHabitIcon(item.id, 15)}
                                  </Box>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography className="habit-title" variant="body2" noWrap sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}>
                                      {item.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                      {item.categoryName}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Chip
                                  label={formattedAmount}
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    bgcolor: 'action.hover',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'text.primary',
                                    borderRadius: '5px'
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Paper>
                  </ClickAwayListener>
                </Popper>
              </Paper>

              {/* QUICK 1-TOUCH PRESETS & FAST NUMPAD */}
              <Box sx={{ mt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ⚡ 1-Chạm thường dùng:
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowQuickNumpad(prev => !prev)}
                    startIcon={<KeyboardRounded sx={{ fontSize: 14 }} />}
                    sx={{ fontSize: '0.74rem', fontWeight: 700, py: 0.2, textTransform: 'none', color: showQuickNumpad ? 'var(--brand-primary)' : 'text.secondary' }}
                  >
                    {showQuickNumpad ? 'Ẩn phím số' : 'Bật phím số nhanh'}
                  </Button>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                    gap: 1
                  }}
                >
                  {quickPresets.map(preset => (
                    <Paper
                      key={preset.id}
                      variant="outlined"
                      onClick={() => handleSelectQuickPreset(preset)}
                      sx={{
                        p: 1.25,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid var(--border-subtle)',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: preset.color,
                          bgcolor: 'action.hover',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 18 }}>{preset.emoji}</Typography>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 750, fontSize: '0.78rem' }} noWrap>
                            {preset.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: preset.color, fontWeight: 800, fontSize: '0.72rem' }}>
                            {money(preset.amount)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>

              {/* QUICK NUMPAD */}
              <Collapse in={showQuickNumpad}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: '10px',
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.6)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 0.75
                    }}
                  >
                    {[
                      '1', '2', '3', '10k',
                      '4', '5', '6', '50k',
                      '7', '8', '9', '100k',
                      '0', '000', '⌫', '500k'
                    ].map(key => (
                      <Button
                        key={key}
                        variant="outlined"
                        onClick={() => {
                          if (key === '⌫') {
                            const cur = String(parsed.amount || '');
                            const next = cur.slice(0, -1);
                            setOverrideAmount(next ? parseInt(next, 10) : 0);
                          } else if (key.endsWith('k')) {
                            const val = parseInt(key.replace('k', ''), 10) * 1000;
                            setOverrideAmount(val);
                          } else {
                            const cur = parsed.amount > 0 ? String(parsed.amount) : '';
                            const next = cur + key;
                            setOverrideAmount(parseInt(next, 10) || 0);
                          }
                        }}
                        sx={{
                          py: 1,
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          borderRadius: '6px',
                          bgcolor: 'background.paper',
                          borderColor: 'var(--border-subtle)',
                          color: key.endsWith('k') ? 'var(--brand-primary)' : 'text.primary',
                          minWidth: 0
                        }}
                      >
                        {key}
                      </Button>
                    ))}
                  </Box>
                </Paper>
              </Collapse>

              {/* 4. CATEGORY & ACCOUNT SELECTORS (AT BOTTOM) */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.25,
                  pt: 0.25
                }}
              >
                {/* Field 1: Danh mục / Mục tiêu */}
                {entryType !== 'saving' ? (
                  <MuiSelect
                    label="Danh mục giao dịch"
                    value={parsed.categoryKey || activeCategories[0]?.id || ''}
                    onChange={val => {
                      const found = categories.find(c => c.id === val);
                      if (found) setCustomCategory({ key: found.id, name: found.name });
                    }}
                    options={activeCategories.map(c => ({
                      value: c.id,
                      label: c.name,
                      icon: <CategoryAvatarBadge categoryId={c.id} categoryName={c.name} txType={c.type} />
                    }))}
                  />
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {goals.length > 0 ? (
                      <MuiSelect
                        label="Mục tiêu tiết kiệm"
                        value={selectedGoalId || goals[0]?.id || ''}
                        onChange={val => setSelectedGoalId(val)}
                        options={goals.map(g => {
                          const saved = goalSaved(g);
                          const pct = g.target > 0 ? Math.min(100, Math.round((saved / g.target) * 100)) : 0;
                          return {
                            value: g.id,
                            label: `${g.name} (${pct}%)`,
                            subtitle: `${money(saved)} / ${money(g.target)}`
                          };
                        })}
                      />
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Plus size={13} />}
                        onClick={() => setCreateGoalDialogOpen(true)}
                        sx={{ color: '#8B5CF6', borderColor: '#8B5CF6', height: 40 }}
                      >
                        Tạo sổ tiết kiệm
                      </Button>
                    )}
                  </Box>
                )}

                {/* Field 2: Tài khoản thanh toán */}
                <MuiSelect
                  label="Tài khoản thanh toán"
                  value={activeAccount?.id || accounts[0]?.id || ''}
                  onChange={val => setCustomAccountId(val)}
                  options={accounts.map(a => ({
                    value: a.id,
                    label: a.name,
                    subtitle: money(a.openingBalance || 0),
                    icon: <BankLogoBadge accountName={a.name} accountType={a.type} size="small" />
                  }))}
                />
              </Box>

              {/* Income Salary Extras (Clean Collapsible Accordion) */}
              {entryType === 'income' && (
                <Box
                  sx={{
                    p: 1.25,
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isSalaryMode}
                          onChange={e => {
                            setIsSalaryMode(e.target.checked);
                            if (e.target.checked) {
                              setCustomCategory({ key: 'salary', name: 'Tiền lương' });
                              setInputText(`Lương tháng ${formatVnMonth(salaryMonth)}`);
                            }
                          }}
                          size="small"
                          color="success"
                        />
                      }
                      label={
                        <Typography variant="caption" sx={{ fontWeight: 750, color: isSalaryMode ? '#10B981' : 'text.secondary' }}>
                          Chế độ nhận lương ({formatVnMonth(salaryMonth)})
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>

                  <Collapse in={isSalaryMode}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1, borderTop: '1px solid var(--border-subtle)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <FormControlLabel
                          control={<Switch checked={syncPayroll} onChange={e => setSyncPayroll(e.target.checked)} size="small" color="primary" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Đồng bộ Bảng lương</Typography>}
                          sx={{ m: 0 }}
                        />
                        <FormControlLabel
                          control={<Switch checked={enableSalarySaving} onChange={e => setEnableSalarySaving(e.target.checked)} size="small" color="secondary" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Trích tiết kiệm</Typography>}
                          sx={{ m: 0 }}
                        />
                      </Box>
                      {enableSalarySaving && (
                        <MuiCurrencyInput
                          size="small"
                          label="Số tiền trích tiết kiệm"
                          value={salarySavingAmount}
                          onChange={v => setSalarySavingAmount(Number(v) || 0)}
                        />
                      )}
                    </Box>
                  </Collapse>
                </Box>
              )}

              {/* Voice recording live status */}
              {voiceStatus === 'listening' && (
                <Box
                  sx={{
                    p: 1,
                    px: 1.25,
                    borderRadius: '6px',
                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#DC2626', fontSize: '0.74rem' }}>
                    Đang nghe giọng nói... Nói: "Ăn trưa 45k" hoặc "Đổ xăng 70k ví MoMo"
                  </Typography>
                </Box>
              )}

              {voiceError && (
                <Alert severity="error" sx={{ py: 0.25, px: 1, fontSize: '0.72rem', borderRadius: '6px' }} onClose={() => setVoiceError(null)}>
                  {voiceError}
                </Alert>
              )}

              {/* Scanned Receipt Attached Notification */}
              {receiptUrl && (
                <Box
                  sx={{
                    p: 0.75,
                    px: 1.25,
                    borderRadius: '6px',
                    bgcolor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Paperclip size={13} color="#10B981" />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', fontSize: '0.74rem' }}>
                      Đã đính kèm ảnh biên lai
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => setReceiptUrl(null)}
                    sx={{ p: 0, minWidth: 'auto', fontSize: '0.72rem', color: 'text.secondary' }}
                  >
                    Gỡ ảnh
                  </Button>
                </Box>
              )}

              {/* Duplicate Transaction Soft Warning */}
              {duplicateCheck.isDuplicate && (
                <Alert severity="warning" sx={{ py: 0.4, px: 1.25, fontSize: '0.74rem', borderRadius: '6px' }}>
                  {duplicateCheck.message}
                </Alert>
              )}

              {/* Spending Anomaly Friendly Notice */}
              {spendingAnomaly.isAnomaly && (
                <Alert severity="info" sx={{ py: 0.4, px: 1.25, fontSize: '0.74rem', borderRadius: '6px' }}>
                  {spendingAnomaly.explanation}
                </Alert>
              )}
            </Box>
          )}

          {/* =========================================================================
              TAB: CAMERA VIETQR & HÓA ĐƠN OCR (SCAN TRỰC TIẾP HOẶC TẢI ẢNH)
              ========================================================================= */}
          {mainMode === 'camera' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
              <CameraVietQrReceiptScanner onScanComplete={handleCameraScanComplete} />
            </Box>
          )}

          {/* =========================================================================
              TAB: NHẬP CHI TIẾT THỦ CÔNG (ĐẦY ĐỦ TRƯỜNG, RỘNG RÃI THOÁNG ĐÃNG)
              ========================================================================= */}
          {mainMode === 'manual' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
              <MuiTextField
                label="Tên giao dịch / Nội dung"
                placeholder="VD: Cơm trưa văn phòng, Cà phê gặp khách, Đổ xăng xe..."
                value={manualForm.name}
                onChange={e => setManualForm({ ...manualForm, name: e.target.value })}
                fullWidth
                autoFocus
              />

              <MuiCurrencyInput
                label="Số tiền giao dịch (₫)"
                value={manualForm.amount}
                onChange={val => setManualForm({ ...manualForm, amount: Number(val) || 0 })}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <MuiSelect
                  label="Loại giao dịch"
                  value={manualForm.type}
                  onChange={v => setManualForm({ ...manualForm, type: v as TxType })}
                  options={[
                    { value: 'expense', label: 'Chi tiêu (-)' },
                    { value: 'income', label: 'Thu nhập (+)' },
                    { value: 'transfer', label: 'Chuyển khoản nội bộ' }
                  ]}
                />
                <MuiSelect
                  label="Danh mục tài chính"
                  value={manualForm.categoryId}
                  onChange={v => setManualForm({ ...manualForm, categoryId: v })}
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <MuiSelect
                  label="Tài khoản thanh toán"
                  value={manualForm.accountId}
                  onChange={v => setManualForm({ ...manualForm, accountId: v })}
                  options={accounts.map(a => ({ value: a.id, label: a.name }))}
                />
                <MuiDatePicker
                  label="Ngày thực hiện"
                  value={manualForm.date}
                  onChange={v => setManualForm({ ...manualForm, date: v })}
                />
              </Box>

              <MuiTextField
                label="Ghi chú chi tiết (tùy chọn)"
                placeholder="Thêm thông tin người đi cùng, dự án, mục đích..."
                value={manualForm.note}
                onChange={e => setManualForm({ ...manualForm, note: e.target.value })}
                fullWidth
              />
            </Box>
          )}

          {/* =========================================================================
              TAB 2: AI GHI CHÚ NHANH (AI ASSISTANT, INSIGHTS & RECOGNITION)
              ========================================================================= */}
          {mainMode === 'ai' && (
            <Box
              component="form"
              onSubmit={handleAiSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {/* AI Spotlight Input Box */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  border: '1.5px solid',
                  borderColor: aiCommandResult ? '#10B981' : 'var(--border-subtle)',
                  bgcolor: isDark ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.02)',
                  transition: 'all 0.2s ease',
                  '&:focus-within': {
                    borderColor: '#10B981',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <InputBase
                    inputRef={aiInputRef}
                    fullWidth
                    multiline
                    rows={2}
                    autoFocus
                    value={aiText}
                    onChange={e => setAiText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAiSubmit();
                      }
                    }}
                    placeholder={
                      'Nhập câu lệnh tự nhiên (VD: "xem chi tiêu tháng này", "ăn sáng 35k tiền mặt", "mua 100 TCB giá 32", "gửi tiết kiệm 5tr")...'
                    }
                    sx={{
                      fontSize: { xs: 13.5, sm: 14.5 },
                      fontWeight: 500,
                      color: 'text.primary',
                      lineHeight: 1.6
                    }}
                  />

                  <Tooltip title="Gửi câu lệnh AI (Enter ↵)">
                    <span>
                      <IconButton
                        type="submit"
                        disabled={!aiText.trim()}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '8px',
                          bgcolor: aiText.trim() ? '#10B981' : 'action.disabledBackground',
                          color: aiText.trim() ? '#ffffff' : 'text.disabled',
                          boxShadow: aiText.trim() ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                          flexShrink: 0,
                          '&:hover': {
                            bgcolor: aiText.trim() ? '#059669' : 'action.disabledBackground'
                          }
                        }}
                      >
                        <CornerDownLeft size={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Paper>

              {/* REAL-TIME AI INTERPRETATION & RECOGNIZED CARD */}
              {aiCommandResult && (
                <>
                  {/* CASE A: QUERY / VIEW INTENT */}
                  {aiCommandResult.intent === 'query_view' && queryStats && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        border: '1.5px solid #10B981',
                        bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Eye size={18} color="#10B981" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem' }}>
                            {queryStats.title}
                          </Typography>
                        </Box>
                        <Chip label="Báo cáo tức thì" size="small" color="success" sx={{ height: 20, fontSize: 10, fontWeight: 750 }} />
                      </Box>

                      {queryStats.target === 'all' && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                          <Box sx={{ p: 1, borderRadius: '6px', bgcolor: 'background.paper', border: '1px solid var(--border-subtle)' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>Tổng số dư</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981' }}>{money(queryStats.totalBalance || 0)}</Typography>
                          </Box>
                          <Box sx={{ p: 1, borderRadius: '6px', bgcolor: 'background.paper', border: '1px solid var(--border-subtle)' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>Chi tháng này</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#DC2626' }}>{money(queryStats.mExpense || 0)}</Typography>
                          </Box>
                          <Box sx={{ p: 1, borderRadius: '6px', bgcolor: 'background.paper', border: '1px solid var(--border-subtle)' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>Thu tháng này</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#16A34A' }}>{money(queryStats.mIncome || 0)}</Typography>
                          </Box>
                        </Box>
                      )}

                      {(queryStats.target === 'expense' || queryStats.target === 'income' || queryStats.target === 'savings' || queryStats.target === 'investment') && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '8px', bgcolor: 'background.paper', border: '1px solid var(--border-subtle)' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            {queryStats.target === 'savings' ? 'Tổng tiền đã tích lũy:' : queryStats.target === 'investment' ? 'Tổng danh mục đầu tư:' : 'Tổng số tiền:'}
                          </Typography>
                          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: queryStats.target === 'expense' ? '#DC2626' : '#10B981' }}>
                            {money(queryStats.total || 0)}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  )}

                  {/* CASE B: TRANSACTION / INVESTMENT / SAVINGS INTENT (DESIGN SỐ TIỀN & XÁC NHẬN) */}
                  {aiCommandResult.intent !== 'query_view' && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        border: '1.5px solid #10B981',
                        bgcolor: isDark ? '#1E293B' : '#F8FAFC',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)'
                      }}
                    >
                      {/* Header Badge */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SparklesRounded sx={{ fontSize: 16, color: '#10B981' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>
                            AI đã nhận diện lệnh giao dịch
                          </Typography>
                        </Box>
                        <Chip
                          label={aiCommandResult.badgeLabel}
                          size="small"
                          color={aiCommandResult.badgeColor}
                          sx={{ height: 22, fontSize: 11, fontWeight: 800 }}
                        />
                      </Box>

                      {/* Prominent Amount Box / Multi-transaction List */}
                      {aiCommandResult.intent === 'multi_transaction' && aiCommandResult.multiTransactions ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                            Chi tiết các giao dịch được phân tách ({aiCommandResult.multiTransactions.length} mục):
                          </Typography>
                          {aiCommandResult.multiTransactions.map((m, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                p: 1.25,
                                borderRadius: '8px',
                                border: '1px solid var(--border-subtle)',
                                bgcolor: isDark ? '#141A23' : '#FFFFFF',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{m.name}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {m.categoryName || (m.type === 'income' ? 'Thu nhập' : 'Chi tiêu')} • {m.date}
                                </Typography>
                              </Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: m.type === 'income' ? '#16A34A' : '#DC2626' }}>
                                {m.type === 'income' ? '+ ' : '− '}{money(m.amount)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : (() => {
                        const amount = aiCommandResult.transaction?.amount ||
                                       aiCommandResult.investment?.totalCostBasis ||
                                       aiCommandResult.salaryAndSaving?.salaryAmount ||
                                       aiCommandResult.salaryAndSaving?.savingAmount ||
                                       aiCommandResult.savingsDeposit?.amount || 0;
                        const isIncome = aiCommandResult.transaction?.type === 'income' || !!aiCommandResult.salaryAndSaving?.salaryAmount;
                        const color = isIncome ? '#16A34A' : '#DC2626';

                        return amount > 0 ? (
                          <Box
                            sx={{
                              py: 1.5,
                              px: 2,
                              borderRadius: '8px',
                              bgcolor: isDark ? '#141A23' : '#FFFFFF',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center'
                            }}
                          >
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                              Số tiền ghi nhận
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: { xs: '1.6rem', sm: '1.9rem' },
                                fontWeight: 900,
                                color,
                                fontVariantNumeric: 'tabular-nums',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.2,
                                mt: 0.25
                              }}
                            >
                              {isIncome ? '+ ' : '− '}{money(amount)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem', mt: 0.25 }}>
                              {aiCommandResult.explanation}
                            </Typography>
                          </Box>
                        ) : null;
                      })()}

                      {/* Explicit Interactive Category & Account Selectors if ambiguous or customizable */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
                        <MuiSelect
                          label="Danh mục (AI nhận diện)"
                          value={aiCustomCategoryId || aiCommandResult.transaction?.categoryId || (categories.find(c => c.type === (aiCommandResult.transaction?.type || 'expense'))?.id || '')}
                          onChange={val => setAiCustomCategoryId(val)}
                          options={categories.map(c => ({
                            value: c.id,
                            label: c.name,
                            icon: <CategoryAvatarBadge categoryId={c.id} categoryName={c.name} txType={c.type} />
                          }))}
                        />

                        <MuiSelect
                          label="Tài khoản thanh toán"
                          value={aiCustomAccountId || aiCommandResult.transaction?.accountId || activeAccount?.id || accounts[0]?.id || ''}
                          onChange={val => setAiCustomAccountId(val)}
                          options={accounts.map(a => ({
                            value: a.id,
                            label: a.name,
                            subtitle: money(a.openingBalance || 0),
                            icon: <BankLogoBadge accountName={a.name} accountType={a.type} size="small" />
                          }))}
                        />
                      </Box>

                      {/* Explicit Confirmation Button for AI */}
                      <Button
                        variant="contained"
                        onClick={() => handleAiSubmit()}
                        startIcon={<Check size={16} />}
                        sx={{
                          height: 44,
                          borderRadius: '8px',
                          bgcolor: '#10B981',
                          color: '#FFFFFF',
                          fontWeight: 750,
                          fontSize: '0.88rem',
                          textTransform: 'none',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                          '&:hover': {
                            bgcolor: '#059669',
                            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)'
                          }
                        }}
                      >
                        Xác nhận & Lưu giao dịch AI
                      </Button>
                    </Paper>
                  )}
                </>
              )}

              {/* Categorized AI Smart Prompts & Scenarios */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SparklesRounded sx={{ fontSize: 13, color: '#10B981' }} />
                    Kịch bản mẫu (Chạm để điền):
                  </Typography>

                  {/* Scenario Category Tabs */}
                  <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                    {AI_CATEGORIZED_PROMPTS.map((sc, idx) => (
                      <Chip
                        key={sc.category}
                        icon={getPromptCategoryIcon(sc.iconName, 12)}
                        label={sc.category}
                        size="small"
                        onClick={() => setSelectedScenarioIdx(idx)}
                        variant={selectedScenarioIdx === idx ? 'filled' : 'outlined'}
                        color={selectedScenarioIdx === idx ? 'primary' : 'default'}
                        sx={{
                          height: 24,
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          borderColor: 'var(--border-subtle)',
                          '& .MuiChip-icon': { ml: '5px', mr: '-3px' }
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* Prompts list in selected scenario */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 1
                  }}
                >
                  {AI_CATEGORIZED_PROMPTS[selectedScenarioIdx].prompts.map(item => (
                    <Paper
                      key={item.label}
                      variant="outlined"
                      onClick={() => {
                        setAiText(item.cmd);
                        aiInputRef.current?.focus();
                      }}
                      sx={{
                        p: 1.2,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.25,
                        borderColor: 'var(--border-subtle)',
                        bgcolor: 'background.paper',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: '#10B981',
                          bgcolor: 'rgba(16, 185, 129, 0.05)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 750, fontSize: '0.8rem', color: 'text.primary' }}>
                          "{item.cmd}"
                        </Typography>
                        <Chip label={item.label} size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 700 }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        {item.desc}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        {/* MODAL ACTIONS FOOTER */}
        <DialogActions
          sx={{
            px: { xs: 2, sm: 2.75 },
            py: 1.5,
            borderTop: '1px solid var(--border-subtle)',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Keyboard hints on desktop */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                component="kbd"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  px: 0.75,
                  py: 0.2,
                  borderRadius: '4px',
                  bgcolor: 'action.hover',
                  border: '1px solid var(--border-subtle)',
                  fontWeight: 700,
                  fontSize: '0.7rem'
                }}
              >
                Enter <CornerDownLeft size={11} />
              </Box>
              <span>lưu giao dịch</span>
            </Box>
            <span>•</span>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                component="kbd"
                sx={{
                  px: 0.75,
                  py: 0.2,
                  borderRadius: '4px',
                  bgcolor: 'action.hover',
                  border: '1px solid var(--border-subtle)',
                  fontWeight: 700,
                  fontSize: '0.7rem'
                }}
              >
                Esc
              </Box>
              <span>đóng</span>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
            <Button
              onClick={onClose}
              color="inherit"
              sx={{
                fontWeight: 700,
                borderRadius: '8px',
                height: 44,
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            >
              Hủy
            </Button>
            {mainMode === 'daily' && (
              <Button
                variant="contained"
                onClick={handleOpenConfirmModal}
                disabled={parsed.amount <= 0}
                startIcon={<Eye size={16} />}
                sx={{
                  flex: { xs: 1, sm: 'initial' },
                  height: 44,
                  bgcolor: parsed.amount > 0 ? activeColor : 'action.disabledBackground',
                  color: parsed.amount > 0 ? '#FFFFFF' : 'text.disabled',
                  '&:hover': {
                    bgcolor: activeColor,
                    filter: 'brightness(0.92)'
                  },
                  fontWeight: 750,
                  borderRadius: '8px',
                  px: 2.75,
                  fontSize: { xs: '0.84rem', sm: '0.88rem' },
                  textTransform: 'none',
                  boxShadow: 'none'
                }}
              >
                Xem trước giao dịch
              </Button>
            )}

            {mainMode === 'manual' && (
              <Button
                variant="contained"
                onClick={handleManualSave}
                disabled={!manualForm.name.trim() || manualForm.amount <= 0}
                startIcon={<Zap size={16} />}
                sx={{
                  flex: { xs: 1, sm: 'initial' },
                  height: 44,
                  bgcolor: 'var(--brand-primary, #1E5A48)',
                  '&:hover': { bgcolor: 'var(--brand-primary-hover, #164638)' },
                  fontWeight: 800,
                  borderRadius: '8px',
                  px: 3,
                  fontSize: { xs: '0.84rem', sm: '0.88rem' },
                  textTransform: 'none',
                  boxShadow: 'none'
                }}
              >
                Lưu Giao Dịch
              </Button>
            )}

            {mainMode === 'ai' && (
              <Button
                variant="contained"
                onClick={() => handleAiSubmit()}
                disabled={!aiText.trim()}
                sx={{
                  flex: { xs: 1, sm: 'initial' },
                  height: 44,
                  bgcolor: 'var(--brand-primary, #1E5A48)',
                  '&:hover': { bgcolor: 'var(--brand-primary-hover, #164638)' },
                  fontWeight: 750,
                  borderRadius: '8px',
                  px: 2.75,
                  fontSize: { xs: '0.84rem', sm: '0.88rem' },
                  textTransform: 'none',
                  boxShadow: 'none'
                }}
              >
                Thực hiện lệnh AI
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* =========================================================================
          SEPARATE DEDICATED TRANSACTION CONFIRMATION MODAL
          ========================================================================= */}
      <Dialog
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        maxWidth="xs"
        fullWidth
        disableScrollLock={false}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important'
            }
          },
          paper: {
            sx: {
              borderRadius: '10px',
              border: '1.5px solid var(--border-subtle)',
              bgcolor: 'background.paper',
              p: 0,
              boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)'
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            py: 1.75,
            px: 2.5,
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: isDark ? '#161D2A' : '#F8FAFC'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '6px',
                bgcolor: `${activeColor}15`,
                color: activeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={16} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 750, fontSize: '0.92rem', color: 'text.primary' }}>
              Xác nhận ghi chép
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setConfirmModalOpen(false)}
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            <X size={16} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Main Amount Card */}
          <Box
            sx={{
              py: 2,
              px: 2,
              borderRadius: '8px',
              bgcolor: isDark ? '#1E293B' : '#F8FAFC',
              border: '1.5px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              textAlign: 'center'
            }}
          >
            <Chip
              label={
                entryType === 'expense'
                  ? 'Khoản chi tiêu'
                  : entryType === 'income'
                  ? (isSalaryMode ? 'Lương nhận' : 'Khoản thu nhập')
                  : entryType === 'saving'
                  ? 'Gửi tiết kiệm'
                  : 'Lệnh đầu tư'
              }
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 750,
                bgcolor: activeTheme.bgSubtle,
                color: activeColor,
                borderRadius: '4px',
                border: `1px solid ${activeTheme.borderSubtle}`
              }}
            />
            <Typography
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem' },
                fontWeight: 900,
                color: activeColor,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.03em',
                lineHeight: 1.2
              }}
            >
              {entryType === 'expense' ? '− ' : entryType === 'income' ? '+ ' : ''}
              {money(parsed.amount)}
            </Typography>
          </Box>

          {/* Details 2x2 Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1.25,
              p: 1.5,
              borderRadius: '8px',
              bgcolor: isDark ? '#1E293B' : '#F8FAFC',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                {entryType === 'saving' ? 'Mục tiêu' : 'Danh mục'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 750, fontSize: '0.82rem', color: 'text.primary', mt: 0.25 }} noWrap>
                {entryType === 'saving'
                  ? (goals.find(g => g.id === selectedGoalId)?.name || 'Sổ tiết kiệm')
                  : (parsed.categoryName || 'Chưa phân loại')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                Tài khoản
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 750, fontSize: '0.82rem', color: 'text.primary', mt: 0.25 }} noWrap>
                {activeAccount?.name || 'Mặc định'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                Ngày ghi nhận
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 750, fontSize: '0.82rem', color: 'text.primary', mt: 0.25 }} noWrap>
                {parsed.date === todayKey() ? 'Hôm nay' : parsed.date || todayKey()}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                Diễn giải / Ghi chú
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 750, fontSize: '0.82rem', color: 'text.primary', mt: 0.25 }} noWrap>
                {parsed.note || inputText || 'Không có'}
              </Typography>
            </Box>
          </Box>

          {/* Warnings if any */}
          {duplicateCheck.isDuplicate && (
            <Alert severity="warning" sx={{ py: 0.4, px: 1.25, fontSize: '0.74rem', borderRadius: '6px' }}>
              {duplicateCheck.message}
            </Alert>
          )}

          {spendingAnomaly.isAnomaly && (
            <Alert severity="info" sx={{ py: 0.4, px: 1.25, fontSize: '0.74rem', borderRadius: '6px' }}>
              {spendingAnomaly.explanation}
            </Alert>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            pt: 1.5,
            borderTop: '1px solid var(--border-subtle)',
            bgcolor: isDark ? '#161D2A' : '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1
          }}
        >
          <Button
            onClick={() => setConfirmModalOpen(false)}
            variant="outlined"
            startIcon={<ArrowLeft size={14} />}
            sx={{
              fontWeight: 700,
              borderRadius: '8px',
              fontSize: '0.82rem',
              height: 44,
              px: 2,
              textTransform: 'none',
              borderColor: 'var(--border-subtle)',
              color: 'text.primary'
            }}
          >
            Trở về sửa giao dịch
          </Button>

          <Button
            onClick={handleConfirmSave}
            variant="contained"
            startIcon={<Check size={14} />}
            sx={{
              fontWeight: 750,
              borderRadius: '8px',
              fontSize: '0.84rem',
              height: 44,
              px: 2.5,
              textTransform: 'none',
              bgcolor: activeColor,
              color: '#FFFFFF',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: activeColor,
                filter: 'brightness(0.92)'
              }
            }}
          >
            Lưu giao dịch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Savings Goal Dialog */}
      <Dialog
        open={createGoalDialogOpen}
        onClose={() => setCreateGoalDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '10px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PiggyBank size={20} color="#8B5CF6" />
          Tạo Sổ tiết kiệm mới
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <MuiTextField
            label="Tên mục tiêu tích lũy"
            placeholder="VD: Quỹ khẩn cấp, Mua xe..."
            value={newGoalForm.name}
            onChange={e => setNewGoalForm(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
            required
          />
          <MuiCurrencyInput
            label="Số tiền mục tiêu (₫)"
            value={newGoalForm.target}
            onChange={val => setNewGoalForm(prev => ({ ...prev, target: val }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCreateGoalDialogOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>
            Hủy
          </Button>
          <Button
            onClick={handleCreateGoal}
            variant="contained"
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' }, fontWeight: 700 }}
          >
            Tạo mục tiêu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Interactive AI Chat Confirmation Dialog */}
      <Dialog
        open={chatConfirmOpen}
        onClose={() => setChatConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '10px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Bot size={20} color="#8B5CF6" />
          Xác nhận kế hoạch Phân bổ tài chính AI
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'action.hover', border: '1px solid var(--border-subtle)' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Câu lệnh gốc của bạn:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 650, color: 'text.primary', mt: 0.25 }}>
              "{confirmData.originalText}"
            </Typography>
          </Box>

          {confirmData.salaryAmount > 0 && (
            <Paper variant="outlined" sx={{ p: 1.75, borderRadius: '8px' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#10B981', mb: 1.25 }}>
                1. Nhận lương: +{money(confirmData.salaryAmount)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <MuiCurrencyInput
                  label="Số tiền lương"
                  value={String(confirmData.salaryAmount)}
                  onChange={v => setConfirmData(prev => ({ ...prev, salaryAmount: Number(v) || 0 }))}
                  sx={{ flex: 1, minWidth: 150 }}
                />
                <MuiSelect
                  label="Vào tài khoản"
                  value={confirmData.salaryAccount}
                  onChange={val => setConfirmData(prev => ({ ...prev, salaryAccount: val }))}
                  options={accounts.map(a => ({ value: a.id, label: a.name }))}
                  sx={{ flex: 1, minWidth: 150 }}
                />
              </Box>
            </Paper>
          )}

          {confirmData.savingAmount > 0 && (
            <Paper variant="outlined" sx={{ p: 1.75, borderRadius: '8px' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#8B5CF6', mb: 1.25 }}>
                2. Gửi tiết kiệm: +{money(confirmData.savingAmount)}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <MuiCurrencyInput
                  label="Số tiền gửi tiết kiệm"
                  value={String(confirmData.savingAmount)}
                  onChange={v => setConfirmData(prev => ({ ...prev, savingAmount: Number(v) || 0 }))}
                />
                {goals.length > 0 && (
                  <MuiSelect
                    label="Vào sổ tiết kiệm"
                    value={confirmData.selectedGoalId || goals[0]?.id || ''}
                    onChange={val => setConfirmData(prev => ({ ...prev, selectedGoalId: val }))}
                    options={goals.map(g => ({ value: g.id, label: `${g.name} (${money(g.target)})` }))}
                  />
                )}
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setChatConfirmOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirmAiCompound}
            variant="contained"
            color="primary"
            sx={{ fontWeight: 750, px: 2.5 }}
          >
            Xác nhận thực hiện
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bank SMS Modal */}
      <BankSmsModal open={bankSmsModalOpen} onClose={() => setBankSmsModalOpen(false)} />
    </>
  );
}

// =========================================================================
// 3. MAIN EXPORT: SMART QUICK ENTRY (Combines Trigger Bar + Popup Modal)
// =========================================================================
export interface SmartQuickEntryProps {
  onOpenPricing?: (feature?: string) => void;
  defaultMode?: MainEntryMode;
  open?: boolean;
  onClose?: () => void;
  onOpenModal?: () => void;
}

export function SmartQuickEntry({
  onOpenPricing,
  defaultMode = 'daily',
  open: externalOpen,
  onClose: externalOnClose,
  onOpenModal: externalOnOpenModal
}: SmartQuickEntryProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<MainEntryMode>(defaultMode);
  const [initialText, setInitialText] = useState('');

  const isControlled = typeof externalOpen === 'boolean';
  const isOpen = isControlled ? externalOpen : internalOpen;

  const handleOpen = (mode?: MainEntryMode, text?: string) => {
    if (mode) setModalMode(mode);
    if (text) setInitialText(text);
    else setInitialText('');

    if (externalOnOpenModal) {
      externalOnOpenModal();
    } else {
      setInternalOpen(true);
    }
  };

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleOpen('daily');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <SmartQuickEntryTriggerBar
        onOpenModal={handleOpen}
        onOpenPricing={onOpenPricing}
      />
      <SmartQuickEntryModal
        open={isOpen}
        onClose={handleClose}
        defaultMode={modalMode}
        initialText={initialText}
        onOpenPricing={onOpenPricing}
      />
    </>
  );
}
