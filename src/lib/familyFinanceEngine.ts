/**
 * Finora Family & Duo Finance Engine
 * Multi-user shared ledger, expense splitting, and debt simplification algorithm
 */

export type SharedGroupType = 'duo' | 'family' | 'roommates' | 'trip';
export type MemberRole = 'owner' | 'editor' | 'viewer';
export type SplitMethod = 'equal' | 'ratio' | 'custom';

export interface FamilyMember {
  id: string;
  name: string;
  role: MemberRole;
  avatar?: string;
  incomeShareRatio?: number; // e.g. 0.6 = 60%, 0.4 = 40%
}

export interface SharedGroup {
  id: string;
  name: string;
  type: SharedGroupType;
  createdDate: string;
  currency: string;
  members: FamilyMember[];
  sharedAccountIds: string[];
}

export interface SharedExpenseItem {
  id: string;
  description: string;
  totalAmount: number;
  paidByMemberId: string;
  splitMethod: SplitMethod;
  customSplits?: Record<string, number>; // memberId -> exact share
  date: string;
  isSettled?: boolean;
}

export interface SettlementTransfer {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}

export interface GroupSettlementSummary {
  totalGroupSpent: number;
  memberBalances: Array<{
    memberId: string;
    name: string;
    totalPaid: number;
    totalShare: number;
    netBalance: number; // positive = creditor (needs to receive), negative = debtor (needs to pay)
  }>;
  suggestedTransfers: SettlementTransfer[];
}

/**
 * Calculates member shares for an individual expense
 */
export function calculateExpenseSplits(
  expense: SharedExpenseItem,
  members: FamilyMember[]
): Record<string, { paid: number; share: number; net: number }> {
  const result: Record<string, { paid: number; share: number; net: number }> = {};
  const memberCount = members.length;

  if (memberCount === 0) return result;

  // Initialize
  for (const m of members) {
    result[m.id] = {
      paid: m.id === expense.paidByMemberId ? expense.totalAmount : 0,
      share: 0,
      net: 0
    };
  }

  if (expense.splitMethod === 'custom' && expense.customSplits) {
    for (const m of members) {
      result[m.id].share = expense.customSplits[m.id] || 0;
    }
  } else if (expense.splitMethod === 'ratio') {
    // Ratio split based on income share or equal default if sum ratio != 1
    const totalRatio = members.reduce((sum, m) => sum + (m.incomeShareRatio || 1 / memberCount), 0);
    for (const m of members) {
      const ratio = (m.incomeShareRatio || 1 / memberCount) / totalRatio;
      result[m.id].share = Math.round(expense.totalAmount * ratio);
    }
  } else {
    // Equal split
    const equalShare = Math.floor(expense.totalAmount / memberCount);
    let remainder = expense.totalAmount - equalShare * memberCount;
    for (const m of members) {
      result[m.id].share = equalShare + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
    }
  }

  // Calculate net = paid - share
  for (const m of members) {
    result[m.id].net = result[m.id].paid - result[m.id].share;
  }

  return result;
}

/**
 * Debt Minimization Algorithm (Greedy Debt Settlement)
 * Reduces N*N pairwise debts to maximum N-1 direct bank transfers
 */
export function minimizeSettlements(
  netBalances: Record<string, number>,
  members: FamilyMember[]
): SettlementTransfer[] {
  const memberMap = new Map(members.map(m => [m.id, m.name]));

  // Separate creditors (positive net) and debtors (negative net)
  interface BalanceNode {
    memberId: string;
    amount: number;
  }

  const creditors: BalanceNode[] = [];
  const debtors: BalanceNode[] = [];

  for (const [memberId, net] of Object.entries(netBalances)) {
    if (net > 1) {
      creditors.push({ memberId, amount: net });
    } else if (net < -1) {
      debtors.push({ memberId, amount: -net }); // store absolute amount owed
    }
  }

  // Sort descending to settle largest debts first
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];

  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const settledAmount = Math.min(creditor.amount, debtor.amount);

    if (settledAmount > 0) {
      transfers.push({
        fromMemberId: debtor.memberId,
        fromName: memberMap.get(debtor.memberId) || debtor.memberId,
        toMemberId: creditor.memberId,
        toName: memberMap.get(creditor.memberId) || creditor.memberId,
        amount: Math.round(settledAmount)
      });
    }

    creditor.amount -= settledAmount;
    debtor.amount -= settledAmount;

    if (creditor.amount <= 1) cIdx++;
    if (debtor.amount <= 1) dIdx++;
  }

  return transfers;
}

/**
 * Calculates complete settlement summary for a list of shared expenses
 */
export function calculateGroupSettlement(
  expenses: SharedExpenseItem[],
  members: FamilyMember[]
): GroupSettlementSummary {
  const netBalances: Record<string, number> = {};
  const paidTotals: Record<string, number> = {};
  const shareTotals: Record<string, number> = {};

  for (const m of members) {
    netBalances[m.id] = 0;
    paidTotals[m.id] = 0;
    shareTotals[m.id] = 0;
  }

  let totalGroupSpent = 0;

  // Process unsettled expenses
  for (const exp of expenses) {
    if (exp.isSettled) continue;
    totalGroupSpent += exp.totalAmount;
    const split = calculateExpenseSplits(exp, members);

    for (const m of members) {
      paidTotals[m.id] += split[m.id]?.paid || 0;
      shareTotals[m.id] += split[m.id]?.share || 0;
      netBalances[m.id] += split[m.id]?.net || 0;
    }
  }

  const memberBalances = members.map(m => ({
    memberId: m.id,
    name: m.name,
    totalPaid: paidTotals[m.id],
    totalShare: shareTotals[m.id],
    netBalance: netBalances[m.id]
  }));

  const suggestedTransfers = minimizeSettlements(netBalances, members);

  return {
    totalGroupSpent,
    memberBalances,
    suggestedTransfers
  };
}

/**
 * Filters transactions to ensure personal data privacy
 * Shared ledger view only includes transactions linked to shared accounts
 */
export function filterSharedLedgerTransactions<T extends { accountId: string; isSharedExpense?: boolean }>(
  transactions: T[],
  sharedAccountIds: string[]
): T[] {
  const sharedSet = new Set(sharedAccountIds);
  return transactions.filter(tx => sharedSet.has(tx.accountId) || tx.isSharedExpense === true);
}
