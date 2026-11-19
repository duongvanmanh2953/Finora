/**
 * FINORA MULTI-SOURCE INCOME & PHASED INSTALLMENT ENGINE
 *
 * Manages diversified income sources:
 * - Fixed salary, freelance gigs, business ventures, investment returns, commissions, and other revenue.
 * - Multi-stage payment milestone tracking:
 *   Tracks Total Contract Value vs. Actually Received vs. Remaining Receivables.
 * - Prevents conflating expected revenue with cash in hand.
 */

import type { IncomeContract, IncomeSourceType, Transaction, Money } from '../types';
import { uid, todayKey } from './finance';

export interface ContractProgress {
  contract: IncomeContract;
  totalValue: Money;
  receivedAmount: Money;
  receivableAmount: Money;
  progressPercent: number;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  isFullyPaid: boolean;
}

export interface IncomeOverview {
  totalExpectedRevenue: Money;
  totalActuallyReceived: Money;
  totalPendingReceivables: Money;
  activeContractsCount: number;
  bySource: Record<
    IncomeSourceType,
    {
      source: IncomeSourceType;
      label: string;
      contractCount: number;
      totalValue: Money;
      received: Money;
      receivable: Money;
    }
  >;
}

export const INCOME_SOURCE_LABELS: Record<IncomeSourceType, string> = {
  salary: 'Lương cố định',
  freelance: 'Freelance / Dự án',
  business: 'Kinh doanh / Bán hàng',
  investment: 'Đầu tư / Cổ tức',
  commission: 'Hoa hồng / Thưởng',
  other: 'Thu nhập khác'
};

/**
 * Calculates progress and receivable balance for a single contract.
 */
export function calculateContractProgress(contract: IncomeContract): ContractProgress {
  const totalValue = contract.totalContractValue;
  const receivedAmount = (contract.milestones || [])
    .filter(m => m.status === 'received')
    .reduce((sum, m) => sum + m.amount, 0);

  const receivableAmount = Math.max(0, totalValue - receivedAmount);
  const progressPercent = totalValue > 0 ? Math.min(100, Math.round((receivedAmount / totalValue) * 100)) : 0;
  const completedMilestonesCount = (contract.milestones || []).filter(m => m.status === 'received').length;
  const totalMilestonesCount = (contract.milestones || []).length;
  const isFullyPaid = receivedAmount >= totalValue && totalValue > 0;

  return {
    contract,
    totalValue,
    receivedAmount,
    receivableAmount,
    progressPercent,
    completedMilestonesCount,
    totalMilestonesCount,
    isFullyPaid
  };
}

/**
 * Calculates global income statistics across all contracts and income streams.
 */
export function calculateIncomeOverview(contracts: IncomeContract[] = []): IncomeOverview {
  const bySource: Record<
    IncomeSourceType,
    {
      source: IncomeSourceType;
      label: string;
      contractCount: number;
      totalValue: Money;
      received: Money;
      receivable: Money;
    }
  > = {
    salary: { source: 'salary', label: INCOME_SOURCE_LABELS.salary, contractCount: 0, totalValue: 0, received: 0, receivable: 0 },
    freelance: { source: 'freelance', label: INCOME_SOURCE_LABELS.freelance, contractCount: 0, totalValue: 0, received: 0, receivable: 0 },
    business: { source: 'business', label: INCOME_SOURCE_LABELS.business, contractCount: 0, totalValue: 0, received: 0, receivable: 0 },
    investment: { source: 'investment', label: INCOME_SOURCE_LABELS.investment, contractCount: 0, totalValue: 0, received: 0, receivable: 0 },
    commission: { source: 'commission', label: INCOME_SOURCE_LABELS.commission, contractCount: 0, totalValue: 0, received: 0, receivable: 0 },
    other: { source: 'other', label: INCOME_SOURCE_LABELS.other, contractCount: 0, totalValue: 0, received: 0, receivable: 0 }
  };

  let totalExpectedRevenue = 0;
  let totalActuallyReceived = 0;
  let totalPendingReceivables = 0;
  let activeContractsCount = 0;

  for (const c of contracts) {
    if (c.status === 'canceled') continue;
    activeContractsCount++;
    const progress = calculateContractProgress(c);

    totalExpectedRevenue += progress.totalValue;
    totalActuallyReceived += progress.receivedAmount;
    totalPendingReceivables += progress.receivableAmount;

    const src = c.sourceType || 'other';
    if (bySource[src]) {
      bySource[src].contractCount += 1;
      bySource[src].totalValue += progress.totalValue;
      bySource[src].received += progress.receivedAmount;
      bySource[src].receivable += progress.receivableAmount;
    }
  }

  return {
    totalExpectedRevenue,
    totalActuallyReceived,
    totalPendingReceivables,
    activeContractsCount,
    bySource
  };
}

/**
 * Marks an installment milestone as received and generates the associated Transaction record.
 */
export function markMilestoneReceived(
  contract: IncomeContract,
  milestoneId: string,
  targetAccountId: string,
  receivedDate: string = todayKey(),
  categoryId?: string
): { updatedContract: IncomeContract; newTransaction: Transaction } {
  const milestone = contract.milestones.find(m => m.id === milestoneId);
  if (!milestone) {
    throw new Error(`Không tìm thấy đợt thanh toán có mã: ${milestoneId}`);
  }

  const txId = uid();
  const newTransaction: Transaction = {
    id: txId,
    name: `${contract.title} - ${milestone.name}`,
    amount: milestone.amount,
    type: 'income',
    accountId: targetAccountId,
    categoryId: categoryId || 'cat-income-freelance',
    date: receivedDate,
    method: 'transfer',
    note: `Thanh toán đợt từ hợp đồng: ${contract.title}${contract.clientName ? ` (${contract.clientName})` : ''}`,
    status: 'completed',
    incomeSourceType: contract.sourceType === 'salary' ? 'active' : contract.sourceType === 'investment' ? 'investment_yield' : 'business'
  };

  const updatedMilestones = contract.milestones.map(m => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: 'received' as const,
        receivedDate,
        transactionId: txId,
        accountId: targetAccountId
      };
    }
    return m;
  });

  const totalReceived = updatedMilestones
    .filter(m => m.status === 'received')
    .reduce((sum, m) => sum + m.amount, 0);

  const updatedContract: IncomeContract = {
    ...contract,
    status: totalReceived >= contract.totalContractValue ? 'completed' : contract.status,
    milestones: updatedMilestones,
    updatedAt: todayKey()
  };

  return { updatedContract, newTransaction };
}
