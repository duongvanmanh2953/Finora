/**
 * FINORA MONTHLY BALANCE ROLLOVER & TRANSITION ENGINE
 *
 * Implements accurate multi-account month-to-month balance rollover:
 * - Starting balance (Số dư đầu kỳ) of month M = Ending balance (Số dư cuối kỳ) of month M-1.
 * - Formula: ClosingBalance = OpeningBalance + TotalIncome - TotalExpense + NetTransfers.
 * - Internal transfers between user accounts never count as income or expense.
 * - Modifying a past transaction automatically ripples through subsequent months accurately without double counting.
 */

import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { Account, Transaction, Money } from '../types';

export interface MonthBalanceSummary {
  month: string; // 'yyyy-MM'
  accountId?: string; // 'all' or specific account id
  accountName?: string;
  openingBalance: Money;
  totalIncome: Money;
  totalExpense: Money;
  netTransfers: Money;
  netCashflow: Money;
  closingBalance: Money;
  transactionCount: number;
}

export interface AccountMonthBreakdown {
  account: Account;
  openingBalance: Money;
  income: Money;
  expense: Money;
  transfersIn: Money;
  transfersOut: Money;
  netTransfers: Money;
  closingBalance: Money;
}

/**
 * Returns date boundary strings [startDateStr, endDateStr] for a given 'yyyy-MM'
 */
export function getMonthDateRange(monthKeyStr: string): { start: string; end: string } {
  const parts = monthKeyStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const d = new Date(year, month, 1);
  const start = format(startOfMonth(d), 'yyyy-MM-dd');
  const end = format(endOfMonth(d), 'yyyy-MM-dd');
  return { start, end };
}

/**
 * Calculates the balance of a single account at the beginning of a specific date (exclusive of that date).
 */
export function getAccountBalanceBeforeDate(
  account: Account,
  transactions: Transaction[],
  beforeDate: string
): Money {
  let bal = account.openingBalance;

  for (const t of transactions) {
    if (t.status !== 'completed') continue;
    const tDate = t.date.slice(0, 10);
    if (tDate >= beforeDate) continue;

    if (t.accountId === account.id) {
      if (t.type === 'income') {
        bal += t.amount;
      } else if (t.type === 'expense') {
        bal -= t.amount;
      } else if (t.type === 'transfer') {
        bal -= t.amount; // Outflow from this account
      }
    }

    if (t.type === 'transfer' && t.toAccountId === account.id) {
      bal += t.amount; // Inflow to this account
    }
  }

  return bal;
}

/**
 * Calculates the monthly balance rollover summary for a specific month.
 */
export function getMonthBalanceSummary(
  monthKeyStr: string,
  accounts: Account[],
  transactions: Transaction[],
  targetAccountId?: string
): MonthBalanceSummary {
  const { start, end } = getMonthDateRange(monthKeyStr);
  const isSingleAccount = targetAccountId && targetAccountId !== 'all';
  const filteredAccounts = isSingleAccount
    ? accounts.filter(a => a.id === targetAccountId)
    : accounts;

  // 1. Calculate Opening Balance before 'start'
  let openingBalance = 0;
  for (const acc of filteredAccounts) {
    openingBalance += getAccountBalanceBeforeDate(acc, transactions, start);
  }

  // 2. Iterate transactions in the month
  let totalIncome = 0;
  let totalExpense = 0;
  let netTransfers = 0;
  let transactionCount = 0;

  for (const t of transactions) {
    if (t.status !== 'completed') continue;
    const tDate = t.date.slice(0, 10);
    if (tDate < start || tDate > end) continue;

    if (isSingleAccount) {
      const isSource = t.accountId === targetAccountId;
      const isDest = t.type === 'transfer' && t.toAccountId === targetAccountId;

      if (!isSource && !isDest) continue;

      transactionCount++;

      if (isSource) {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else if (t.type === 'expense') {
          totalExpense += t.amount;
        } else if (t.type === 'transfer') {
          netTransfers -= t.amount; // Outflow
        }
      }

      if (isDest) {
        netTransfers += t.amount; // Inflow
      }
    } else {
      // All accounts combined
      transactionCount++;
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
      }
      // For all accounts, internal transfers net out to exactly 0
    }
  }

  const netCashflow = totalIncome - totalExpense;
  const closingBalance = openingBalance + netCashflow + netTransfers;

  return {
    month: monthKeyStr,
    accountId: targetAccountId || 'all',
    accountName: isSingleAccount ? filteredAccounts[0]?.name : 'Tất cả tài khoản',
    openingBalance,
    totalIncome,
    totalExpense,
    netTransfers,
    netCashflow,
    closingBalance,
    transactionCount
  };
}

/**
 * Returns month-by-month historical rollover balance progression.
 */
export function getMonthlyBalanceHistory(
  accounts: Account[],
  transactions: Transaction[],
  monthCount = 6,
  targetAccountId?: string
): MonthBalanceSummary[] {
  const result: MonthBalanceSummary[] = [];
  const now = new Date();

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    const mKey = format(d, 'yyyy-MM');
    result.push(getMonthBalanceSummary(mKey, accounts, transactions, targetAccountId));
  }

  return result;
}

/**
 * Returns breakdown of all accounts for a specific month.
 */
export function getAccountBreakdownForMonth(
  monthKeyStr: string,
  accounts: Account[],
  transactions: Transaction[]
): AccountMonthBreakdown[] {
  const { start, end } = getMonthDateRange(monthKeyStr);

  return accounts.map(acc => {
    const openingBalance = getAccountBalanceBeforeDate(acc, transactions, start);
    let income = 0;
    let expense = 0;
    let transfersIn = 0;
    let transfersOut = 0;

    for (const t of transactions) {
      if (t.status !== 'completed') continue;
      const tDate = t.date.slice(0, 10);
      if (tDate < start || tDate > end) continue;

      if (t.accountId === acc.id) {
        if (t.type === 'income') {
          income += t.amount;
        } else if (t.type === 'expense') {
          expense += t.amount;
        } else if (t.type === 'transfer') {
          transfersOut += t.amount;
        }
      }

      if (t.type === 'transfer' && t.toAccountId === acc.id) {
        transfersIn += t.amount;
      }
    }

    const netTransfers = transfersIn - transfersOut;
    const closingBalance = openingBalance + income - expense + netTransfers;

    return {
      account: acc,
      openingBalance,
      income,
      expense,
      transfersIn,
      transfersOut,
      netTransfers,
      closingBalance
    };
  });
}

/**
 * Verifies month-to-month rollover integrity across a period of months.
 */
export function verifyRolloverIntegrity(
  accounts: Account[],
  transactions: Transaction[],
  monthCount = 6
): { isValid: boolean; checkedMonths: number; discrepancies: string[] } {
  const history = getMonthlyBalanceHistory(accounts, transactions, monthCount);
  const discrepancies: string[] = [];

  for (let i = 0; i < history.length - 1; i++) {
    const current = history[i];
    const next = history[i + 1];
    if (Math.abs(current.closingBalance - next.openingBalance) > 1) {
      discrepancies.push(
        `Chênh lệch số dư giữa cuối tháng ${current.month} (${current.closingBalance}) và đầu tháng ${next.month} (${next.openingBalance})`
      );
    }
  }

  return {
    isValid: discrepancies.length === 0,
    checkedMonths: history.length,
    discrepancies
  };
}
