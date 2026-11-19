import { describe, it, expect } from 'vitest';
import {
  generateSmartCalendar,
  formatCompactCalendarMoney,
  verifyCalendarReconciliation
} from './calendarEngine';
import type { Transaction } from '../types';

describe('Finora Smart Calendar Engine & Section 14.4 Acceptance Tests', () => {
  it('formats compact calendar currency labels cleanly (+2tr, -500k, -85k)', () => {
    expect(formatCompactCalendarMoney(2000000, 'income')).toBe('+2tr');
    expect(formatCompactCalendarMoney(500000, 'expense')).toBe('-500k');
    expect(formatCompactCalendarMoney(85000, 'expense')).toBe('-85k');
    expect(formatCompactCalendarMoney(1500000, 'income')).toBe('+1.5tr');
    expect(formatCompactCalendarMoney(0, 'income')).toBe('');
  });

  it('strictly validates Section 14.4 test cases: Day 18, 19, 20 calculations and monthly reconciliation', () => {
    const testTransactions: Transaction[] = [
      // Ngày 18: Thu 2.000.000, Chi 500.000, Chênh lệch +1.500.000
      {
        id: 'tx-18-inc',
        name: 'Thưởng nóng dự án',
        amount: 2000000,
        type: 'income',
        accountId: 'acc-bank',
        categoryId: 'cat-bonus',
        date: '2026-11-18',
        method: 'transfer',
        note: '',
        status: 'completed'
      },
      {
        id: 'tx-18-exp',
        name: 'Ăn tối liên hoan',
        amount: 500000,
        type: 'expense',
        accountId: 'acc-bank',
        categoryId: 'cat-food',
        date: '2026-11-18',
        method: 'card',
        note: '',
        status: 'completed'
      },

      // Ngày 19: Thu 0, Chi 300.000, Chênh lệch -300.000
      {
        id: 'tx-19-exp',
        name: 'Mua sách chuyên ngành',
        amount: 300000,
        type: 'expense',
        accountId: 'acc-cash',
        categoryId: 'cat-education',
        date: '2026-11-19',
        method: 'cash',
        note: '',
        status: 'completed'
      },

      // Ngày 20: Thu 1.000.000, Chi 1.200.000, Chênh lệch -200.000
      {
        id: 'tx-20-inc',
        name: 'Tiền bán đồ cũ',
        amount: 1000000,
        type: 'income',
        accountId: 'acc-bank',
        categoryId: 'cat-other-income',
        date: '2026-11-20',
        method: 'transfer',
        note: '',
        status: 'completed'
      },
      {
        id: 'tx-20-exp',
        name: 'Sửa xe máy',
        amount: 1200000,
        type: 'expense',
        accountId: 'acc-bank',
        categoryId: 'cat-transport',
        date: '2026-11-20',
        method: 'transfer',
        note: '',
        status: 'completed'
      }
    ];

    const calendar = generateSmartCalendar('2026-11', testTransactions);

    // 1. Verify Day 18
    const day18 = calendar.days.find(d => d.date === '2026-11-18')!;
    expect(day18).toBeDefined();
    expect(day18.totalIncome).toBe(2000000);
    expect(day18.totalExpense).toBe(500000);
    expect(day18.netDifference).toBe(1500000); // +1.500.000

    // 2. Verify Day 19
    const day19 = calendar.days.find(d => d.date === '2026-11-19')!;
    expect(day19).toBeDefined();
    expect(day19.totalIncome).toBe(0);
    expect(day19.totalExpense).toBe(300000);
    expect(day19.netDifference).toBe(-300000); // -300.000

    // 3. Verify Day 20
    const day20 = calendar.days.find(d => d.date === '2026-11-20')!;
    expect(day20).toBeDefined();
    expect(day20.totalIncome).toBe(1000000);
    expect(day20.totalExpense).toBe(1200000);
    expect(day20.netDifference).toBe(-200000); // -200.000

    // 4. Verify Total Month Summary on Calendar
    // Total Income = 2.000.000 + 0 + 1.000.000 = 3.000.000
    // Total Expense = 500.000 + 300.000 + 1.200.000 = 2.000.000
    // Net Cashflow = 3.000.000 - 2.000.000 = +1.000.000
    // Active Days = 3 (18, 19, 20)
    expect(calendar.totalMonthIncome).toBe(3000000);
    expect(calendar.totalMonthExpense).toBe(2000000);
    expect(calendar.netCashflow).toBe(1000000);
    expect(calendar.activeDaysCount).toBe(3);

    // 5. Verify 100% Reconciliation against standard monthly report totals
    const reconciliation = verifyCalendarReconciliation(calendar, testTransactions);
    expect(reconciliation.isReconciled).toBe(true);
    expect(reconciliation.calendarTotals.income).toBe(reconciliation.reportTotals.income);
    expect(reconciliation.calendarTotals.expense).toBe(reconciliation.reportTotals.expense);
  });

  it('handles multiple transactions in a single day and transactions across different accounts and filters', () => {
    const multiTx: Transaction[] = [
      {
        id: 'tx-a1',
        name: 'Ăn trưa',
        amount: 50000,
        type: 'expense',
        accountId: 'acc-cash',
        categoryId: 'cat-food',
        date: '2026-11-10',
        method: 'cash',
        note: '',
        status: 'completed'
      },
      {
        id: 'tx-a2',
        name: 'Cà phê',
        amount: 35000,
        type: 'expense',
        accountId: 'acc-cash',
        categoryId: 'cat-food',
        date: '2026-11-10',
        method: 'cash',
        note: '',
        status: 'completed'
      },
      {
        id: 'tx-a3',
        name: 'Hoàn tiền thẻ Techcombank',
        amount: 200000,
        type: 'income',
        accountId: 'acc-bank',
        categoryId: 'cat-cashback',
        date: '2026-11-10',
        method: 'bank',
        note: '',
        status: 'completed'
      }
    ];

    // All accounts
    const calAll = generateSmartCalendar('2026-11', multiTx);
    const day10All = calAll.days.find(d => d.date === '2026-11-10')!;
    expect(day10All.totalIncome).toBe(200000);
    expect(day10All.totalExpense).toBe(85000); // 50k + 35k
    expect(day10All.transactionCount).toBe(3);

    // Filter by acc-cash only: Should only include 85k expense, 0 income
    const calCash = generateSmartCalendar('2026-11', multiTx, { accountId: 'acc-cash' });
    const day10Cash = calCash.days.find(d => d.date === '2026-11-10')!;
    expect(day10Cash.totalIncome).toBe(0);
    expect(day10Cash.totalExpense).toBe(85000);
    expect(day10Cash.transactionCount).toBe(2);

    // Filter by type: 'income' only
    const calIncomeOnly = generateSmartCalendar('2026-11', multiTx, { typeFilter: 'income' });
    const day10Income = calIncomeOnly.days.find(d => d.date === '2026-11-10')!;
    expect(day10Income.totalIncome).toBe(200000);
    expect(day10Income.totalExpense).toBe(0);
  });
});
