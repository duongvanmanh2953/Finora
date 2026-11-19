import { describe, it, expect } from 'vitest';
import { getMonthBalanceSummary } from './balanceRollover';
import type { Account, Transaction } from '../types';

describe('Finora Monthly Balance Rollover Engine', () => {
  const sampleAccounts: Account[] = [
    {
      id: 'acc-cash',
      name: 'Tiền mặt',
      type: 'cash',
      openingBalance: 1000000, // 1M VND initial
      color: '#10B981',
      createdAt: '2026-01-01',
      active: true
    },
    {
      id: 'acc-bank',
      name: 'Techcombank',
      type: 'bank',
      openingBalance: 5000000, // 5M VND initial
      color: '#EF4444',
      createdAt: '2026-01-01',
      active: true
    }
  ];

  it('correctly calculates opening and closing balance for Month 1 (October 2026)', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        name: 'Lương tháng 10',
        amount: 20000000,
        type: 'income',
        accountId: 'acc-bank',
        date: '2026-10-05',
        method: 'transfer',
        note: '',
        status: 'completed'
      },
      {
        id: 'tx-2',
        name: 'Tiền nhà tháng 10',
        amount: 5000000,
        type: 'expense',
        accountId: 'acc-bank',
        date: '2026-10-10',
        method: 'transfer',
        note: '',
        status: 'completed'
      },
      {
        id: 'tx-3',
        name: 'Rút tiền mặt tiêu vặt',
        amount: 2000000,
        type: 'transfer',
        accountId: 'acc-bank',
        toAccountId: 'acc-cash',
        date: '2026-10-15',
        method: 'atm',
        note: '',
        status: 'completed'
      }
    ];

    const octSummary = getMonthBalanceSummary('2026-10', sampleAccounts, transactions);
    // Initial total opening = 1M + 5M = 6M
    expect(octSummary.openingBalance).toBe(6000000);
    // Income = 20M, Expense = 5M, Net transfer = 0 (internal transfer)
    expect(octSummary.totalIncome).toBe(20000000);
    expect(octSummary.totalExpense).toBe(5000000);
    expect(octSummary.netTransfers).toBe(0);
    expect(octSummary.netCashflow).toBe(15000000);
    // Closing = 6M + 15M = 21M
    expect(octSummary.closingBalance).toBe(21000000);
  });

  it('rolls over Month 1 closing balance to Month 2 opening balance automatically', () => {
    const transactions: Transaction[] = [
      // October transactions
      {
        id: 'tx-1',
        name: 'Lương tháng 10',
        amount: 20000000,
        type: 'income',
        accountId: 'acc-bank',
        date: '2026-10-05',
        method: 'transfer',
        note: '',
        status: 'completed'
      },
      {
        id: 'tx-2',
        name: 'Tiền nhà tháng 10',
        amount: 5000000,
        type: 'expense',
        accountId: 'acc-bank',
        date: '2026-10-10',
        method: 'transfer',
        note: '',
        status: 'completed'
      },
      // November transactions
      {
        id: 'tx-4',
        name: 'Ăn uống đầu tháng 11',
        amount: 1000000,
        type: 'expense',
        accountId: 'acc-cash',
        date: '2026-11-02',
        method: 'cash',
        note: '',
        status: 'completed'
      }
    ];

    const octSummary = getMonthBalanceSummary('2026-10', sampleAccounts, transactions);
    const novSummary = getMonthBalanceSummary('2026-11', sampleAccounts, transactions);

    // Month 2 opening balance MUST strictly equal Month 1 closing balance
    expect(novSummary.openingBalance).toBe(octSummary.closingBalance);
    expect(novSummary.openingBalance).toBe(21000000);

    // Nov activity
    expect(novSummary.totalExpense).toBe(1000000);
    expect(novSummary.closingBalance).toBe(20000000);
  });

  it('ripples changes from past transactions forward without double counting', () => {
    const baseTransactions: Transaction[] = [
      {
        id: 'tx-1',
        name: 'Lương tháng 10',
        amount: 20000000,
        type: 'income',
        accountId: 'acc-bank',
        date: '2026-10-05',
        method: 'transfer',
        note: '',
        status: 'completed'
      }
    ];

    const novBefore = getMonthBalanceSummary('2026-11', sampleAccounts, baseTransactions);
    expect(novBefore.openingBalance).toBe(26000000); // 6M + 20M

    // Now user discovers an old expense in October of 2,000,000 VND
    const updatedTransactions: Transaction[] = [
      ...baseTransactions,
      {
        id: 'tx-old-expense',
        name: 'Hóa đơn điện T10',
        amount: 2000000,
        type: 'expense',
        accountId: 'acc-bank',
        date: '2026-10-20',
        method: 'transfer',
        note: '',
        status: 'completed'
      }
    ];

    const novAfter = getMonthBalanceSummary('2026-11', sampleAccounts, updatedTransactions);
    // November opening balance is now automatically reduced by 2,000,000 to 24,000,000
    expect(novAfter.openingBalance).toBe(24000000);
  });
});
