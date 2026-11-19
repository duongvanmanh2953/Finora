/**
 * FINORA SMART CALENDAR ENGINE
 *
 * Provides month grid generation, daily finance aggregation,
 * synchronized filters, and reconciliation with monthly finance reports.
 */

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay
} from 'date-fns';
import type { Transaction, Money } from '../types';
import { totals } from './finance';

export interface CalendarDayCell {
  date: string; // 'yyyy-MM-dd'
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  totalIncome: Money;
  totalExpense: Money;
  netDifference: Money;
  transactionCount: number;
  transactions: Transaction[];
}

export interface CalendarMonthSummary {
  monthKey: string; // 'yyyy-MM'
  totalMonthIncome: Money;
  totalMonthExpense: Money;
  netCashflow: Money;
  activeDaysCount: number;
  days: CalendarDayCell[];
  weeks: CalendarDayCell[][];
}

export interface CalendarFilterOptions {
  typeFilter?: 'all' | 'income' | 'expense';
  accountId?: string;
  categoryId?: string;
}

/**
 * Compact currency formatter for calendar day cells:
 * e.g., 2,000,000 -> "+2tr", 500,000 -> "-500k", 85,000 -> "-85k"
 */
export function formatCompactCalendarMoney(amount: number, type: 'income' | 'expense'): string {
  if (amount <= 0) return '';
  const prefix = type === 'income' ? '+' : '-';
  const abs = Math.abs(amount);

  if (abs >= 1_000_000_000) {
    const val = abs / 1_000_000_000;
    return `${prefix}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}tỷ`;
  }
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    return `${prefix}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}tr`;
  }
  if (abs >= 1_000) {
    const val = Math.round(abs / 1_000);
    return `${prefix}${val}k`;
  }
  return `${prefix}${abs}`;
}

/**
 * Generates the Smart Calendar data for a given month and transactions list with optional filters.
 * Week starts on Monday (T2) matching Vietnamese cultural standard (weekStartsOn: 1).
 */
export function generateSmartCalendar(
  monthKeyStr: string, // 'yyyy-MM'
  transactions: Transaction[],
  filters: CalendarFilterOptions = {}
): CalendarMonthSummary {
  const parts = monthKeyStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const targetDate = new Date(year, month, 1);
  const today = new Date();

  // 1. Filter completed transactions
  const { typeFilter = 'all', accountId = 'all', categoryId = 'all' } = filters;

  const validTransactions = transactions.filter(t => {
    if (t.status !== 'completed') return false;

    // Type filter
    if (typeFilter === 'income' && t.type !== 'income') return false;
    if (typeFilter === 'expense' && t.type !== 'expense') return false;

    // Account filter
    if (accountId !== 'all') {
      const matchSource = t.accountId === accountId;
      const matchDest = t.type === 'transfer' && t.toAccountId === accountId;
      if (!matchSource && !matchDest) return false;
    }

    // Category filter
    if (categoryId !== 'all' && t.categoryId !== categoryId) return false;

    return true;
  });

  // Group transactions by date string 'yyyy-MM-dd'
  const txByDate = new Map<string, Transaction[]>();
  for (const t of validTransactions) {
    const dStr = t.date.slice(0, 10);
    const existing = txByDate.get(dStr);
    if (existing) {
      existing.push(t);
    } else {
      txByDate.set(dStr, [t]);
    }
  }

  // 2. Build Day grid from Monday of first week to Sunday of last week
  const mStart = startOfMonth(targetDate);
  const mEnd = endOfMonth(targetDate);

  const calStart = startOfWeek(mStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(mEnd, { weekStartsOn: 1 });

  const intervalDays = eachDayOfInterval({ start: calStart, end: calEnd });

  let totalMonthIncome = 0;
  let totalMonthExpense = 0;
  let activeDaysCount = 0;

  const days: CalendarDayCell[] = intervalDays.map(d => {
    const dStr = format(d, 'yyyy-MM-dd');
    const dayTransactions = txByDate.get(dStr) || [];
    const isCurrent = isSameMonth(d, targetDate);
    const isCurToday = isSameDay(d, today);

    let dayIncome = 0;
    let dayExpense = 0;

    for (const t of dayTransactions) {
      if (t.type === 'income') {
        dayIncome += t.amount;
      } else if (t.type === 'expense') {
        dayExpense += t.amount;
      }
    }

    const netDifference = dayIncome - dayExpense;

    // Only accumulate for active days within the target month
    if (isCurrent) {
      totalMonthIncome += dayIncome;
      totalMonthExpense += dayExpense;
      if (dayTransactions.length > 0) {
        activeDaysCount++;
      }
    }

    return {
      date: dStr,
      dayNumber: d.getDate(),
      isCurrentMonth: isCurrent,
      isToday: isCurToday,
      totalIncome: dayIncome,
      totalExpense: dayExpense,
      netDifference,
      transactionCount: dayTransactions.length,
      transactions: dayTransactions
    };
  });

  // Split into 7-day weeks for table/grid rendering
  const weeks: CalendarDayCell[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const netCashflow = totalMonthIncome - totalMonthExpense;

  return {
    monthKey: monthKeyStr,
    totalMonthIncome,
    totalMonthExpense,
    netCashflow,
    activeDaysCount,
    days,
    weeks
  };
}

/**
 * Reconciles Smart Calendar monthly totals against standard report `totals()` calculation.
 * Returns true if both calculations match 100% identically without deviation.
 */
export function verifyCalendarReconciliation(
  calendarSummary: CalendarMonthSummary,
  transactions: Transaction[],
  filters: CalendarFilterOptions = {}
): { isReconciled: boolean; calendarTotals: { income: Money; expense: Money }; reportTotals: { income: Money; expense: Money } } {
  const { typeFilter = 'all', accountId = 'all', categoryId = 'all' } = filters;

  const monthTxs = transactions.filter(t => {
    if (t.status !== 'completed') return false;
    if (!t.date.startsWith(calendarSummary.monthKey)) return false;

    if (typeFilter === 'income' && t.type !== 'income') return false;
    if (typeFilter === 'expense' && t.type !== 'expense') return false;

    if (accountId !== 'all') {
      const matchSource = t.accountId === accountId;
      const matchDest = t.type === 'transfer' && t.toAccountId === accountId;
      if (!matchSource && !matchDest) return false;
    }

    if (categoryId !== 'all' && t.categoryId !== categoryId) return false;

    return true;
  });

  const repTotals = totals(monthTxs);

  const isReconciled =
    calendarSummary.totalMonthIncome === repTotals.income &&
    calendarSummary.totalMonthExpense === repTotals.expense;

  return {
    isReconciled,
    calendarTotals: {
      income: calendarSummary.totalMonthIncome,
      expense: calendarSummary.totalMonthExpense
    },
    reportTotals: {
      income: repTotals.income,
      expense: repTotals.expense
    }
  };
}
