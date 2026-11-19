import { describe, it, expect } from 'vitest';
import {
  calculateContractProgress,
  calculateIncomeOverview,
  markMilestoneReceived
} from './incomeEngine';
import type { IncomeContract } from '../types';

describe('Finora Multi-Source Income & Phased Installment Engine', () => {
  const sampleContract: IncomeContract = {
    id: 'contract-freelance-1',
    title: 'Thiết kế giao diện Fintech',
    clientName: 'Công ty Cổ phần Alpha',
    sourceType: 'freelance',
    totalContractValue: 10000000, // 10 million VND
    startDate: '2026-11-01',
    expectedEndDate: '2026-12-01',
    status: 'in_progress',
    milestones: [
      {
        id: 'm-1',
        name: 'Đợt 1 - Tạm ứng 30%',
        amount: 3000000,
        status: 'received',
        receivedDate: '2026-11-05',
        accountId: 'acc-bank'
      },
      {
        id: 'm-2',
        name: 'Đợt 2 - Bàn giao bản thảo Figma (50%)',
        amount: 5000000,
        status: 'pending',
        expectedDate: '2026-11-20'
      },
      {
        id: 'm-3',
        name: 'Đợt 3 - Nghiệm thu & chuyển giao (20%)',
        amount: 2000000,
        status: 'pending',
        expectedDate: '2026-12-01'
      }
    ],
    createdAt: '2026-11-01',
    updatedAt: '2026-11-05'
  };

  it('correctly tracks total contract value, received amount, and remaining receivable without conflating them', () => {
    const progress = calculateContractProgress(sampleContract);
    expect(progress.totalValue).toBe(10000000);
    expect(progress.receivedAmount).toBe(3000000); // 3M received
    expect(progress.receivableAmount).toBe(7000000); // 7M receivable remaining
    expect(progress.progressPercent).toBe(30);
    expect(progress.isFullyPaid).toBe(false);
  });

  it('aggregates income overview across multiple diversified sources', () => {
    const salaryContract: IncomeContract = {
      id: 'contract-salary',
      title: 'Hợp đồng lao động Tech Lead',
      sourceType: 'salary',
      totalContractValue: 35000000,
      startDate: '2026-01-01',
      status: 'in_progress',
      milestones: [
        {
          id: 'm-sal-1',
          name: 'Lương T11',
          amount: 35000000,
          status: 'received'
        }
      ],
      createdAt: '2026-01-01',
      updatedAt: '2026-11-01'
    };

    const overview = calculateIncomeOverview([sampleContract, salaryContract]);
    expect(overview.totalExpectedRevenue).toBe(45000000); // 10M + 35M
    expect(overview.totalActuallyReceived).toBe(38000000); // 3M + 35M
    expect(overview.totalPendingReceivables).toBe(7000000); // 7M remaining
    expect(overview.bySource.freelance.received).toBe(3000000);
    expect(overview.bySource.salary.received).toBe(35000000);
  });

  it('marking a milestone as received generates a completed Transaction record and marks contract completed when finished', () => {
    // Receive milestone 2 (5M)
    const { updatedContract, newTransaction } = markMilestoneReceived(
      sampleContract,
      'm-2',
      'acc-bank',
      '2026-11-18'
    );

    expect(newTransaction.amount).toBe(5000000);
    expect(newTransaction.type).toBe('income');
    expect(newTransaction.accountId).toBe('acc-bank');
    expect(newTransaction.status).toBe('completed');
    expect(newTransaction.name).toContain('Đợt 2');

    const progressAfterM2 = calculateContractProgress(updatedContract);
    expect(progressAfterM2.receivedAmount).toBe(8000000); // 3M + 5M = 8M
    expect(progressAfterM2.receivableAmount).toBe(2000000); // 2M left
    expect(updatedContract.status).toBe('in_progress');

    // Receive final milestone 3 (2M)
    const { updatedContract: finalContract } = markMilestoneReceived(
      updatedContract,
      'm-3',
      'acc-bank',
      '2026-11-25'
    );

    const progressFinal = calculateContractProgress(finalContract);
    expect(progressFinal.receivedAmount).toBe(10000000);
    expect(progressFinal.receivableAmount).toBe(0);
    expect(progressFinal.isFullyPaid).toBe(true);
    expect(finalContract.status).toBe('completed');
  });
});
