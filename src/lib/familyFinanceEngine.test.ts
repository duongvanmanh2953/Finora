import { describe, it, expect } from 'vitest';
import {
  calculateExpenseSplits,
  minimizeSettlements,
  calculateGroupSettlement,
  filterSharedLedgerTransactions,
  FamilyMember,
  SharedExpenseItem
} from './familyFinanceEngine';

describe('Finora Family & Duo Finance Engine', () => {
  const duoMembers: FamilyMember[] = [
    { id: 'user-1', name: 'Chồng (Anh)', role: 'owner', incomeShareRatio: 0.6 },
    { id: 'user-2', name: 'Vợ (Em)', role: 'editor', incomeShareRatio: 0.4 }
  ];

  it('1. Equal Split divides expense equally among group members', () => {
    const expense: SharedExpenseItem = {
      id: 'exp-1',
      description: 'Tiền điện nước tháng 11',
      totalAmount: 1000000,
      paidByMemberId: 'user-1',
      splitMethod: 'equal',
      date: '2026-11-15'
    };

    const splits = calculateExpenseSplits(expense, duoMembers);

    // Total 1M, 2 members -> 500k each
    // user-1 paid 1M -> net +500k (creditor)
    // user-2 paid 0 -> net -500k (debtor)
    expect(splits['user-1'].paid).toBe(1000000);
    expect(splits['user-1'].share).toBe(500000);
    expect(splits['user-1'].net).toBe(500000);

    expect(splits['user-2'].paid).toBe(0);
    expect(splits['user-2'].share).toBe(500000);
    expect(splits['user-2'].net).toBe(-500000);
  });

  it('2. Ratio Split divides expense proportionally based on income ratios', () => {
    const expense: SharedExpenseItem = {
      id: 'exp-2',
      description: 'Tiền mua sắm siêu thị',
      totalAmount: 1000000,
      paidByMemberId: 'user-2',
      splitMethod: 'ratio',
      date: '2026-11-16'
    };

    const splits = calculateExpenseSplits(expense, duoMembers);

    // user-1 ratio 60% = 600,000 share
    // user-2 ratio 40% = 400,000 share
    // user-2 paid 1M -> net +600,000
    // user-1 paid 0 -> net -600,000
    expect(splits['user-1'].share).toBe(600000);
    expect(splits['user-2'].share).toBe(400000);
    expect(splits['user-1'].net).toBe(-600000);
    expect(splits['user-2'].net).toBe(600000);
  });

  it('3. Debt Minimization resolves multiple cross-debts into minimal direct transfers', () => {
    const familyMembers: FamilyMember[] = [
      { id: 'm1', name: 'Alice', role: 'owner' },
      { id: 'm2', name: 'Bob', role: 'editor' },
      { id: 'm3', name: 'Charlie', role: 'viewer' }
    ];

    // Net balances: Alice paid extra 300k, Bob owes 100k, Charlie owes 200k
    const netBalances = {
      m1: 300000,
      m2: -100000,
      m3: -200000
    };

    const transfers = minimizeSettlements(netBalances, familyMembers);

    expect(transfers).toHaveLength(2);
    // Charlie pays Alice 200k
    // Bob pays Alice 100k
    const totalTransferred = transfers.reduce((sum, t) => sum + t.amount, 0);
    expect(totalTransferred).toBe(300000);
    expect(transfers.every(t => t.toName === 'Alice')).toBe(true);
  });

  it('4. Calculates complete settlement summary across multiple expenses', () => {
    const expenses: SharedExpenseItem[] = [
      {
        id: 'exp-1',
        description: 'Bữa tối nhà hàng',
        totalAmount: 600000,
        paidByMemberId: 'user-1',
        splitMethod: 'equal',
        date: '2026-11-10'
      },
      {
        id: 'exp-2',
        description: 'Vé xem phim',
        totalAmount: 400000,
        paidByMemberId: 'user-2',
        splitMethod: 'equal',
        date: '2026-11-12'
      }
    ];

    const summary = calculateGroupSettlement(expenses, duoMembers);

    expect(summary.totalGroupSpent).toBe(1000000);
    // user-1 paid 600k, share 500k -> net +100k
    // user-2 paid 400k, share 500k -> net -100k
    expect(summary.suggestedTransfers).toHaveLength(1);
    expect(summary.suggestedTransfers[0].fromMemberId).toBe('user-2');
    expect(summary.suggestedTransfers[0].toMemberId).toBe('user-1');
    expect(summary.suggestedTransfers[0].amount).toBe(100000);
  });

  it('5. Filters personal transactions to guarantee privacy', () => {
    const allTransactions = [
      { id: 'tx-1', accountId: 'acc-personal', name: 'Cà phê cá nhân' },
      { id: 'tx-2', accountId: 'acc-shared-bank', name: 'Đi chợ chung gia đình' },
      { id: 'tx-3', accountId: 'acc-personal-card', name: 'Mua quà sinh nhật', isSharedExpense: true }
    ];

    const sharedAccounts = ['acc-shared-bank'];
    const filtered = filterSharedLedgerTransactions(allTransactions, sharedAccounts);

    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['tx-2', 'tx-3']);
  });
});
