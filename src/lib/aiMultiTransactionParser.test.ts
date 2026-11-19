import { describe, it, expect } from 'vitest';
import { splitCompoundSentence, parseMultiTransactions } from './aiMultiTransactionParser';
import type { Category, Account } from '../types';

describe('Finora AI Multi-Transaction Natural Language Parser', () => {
  const categories: Category[] = [
    { id: 'food', name: 'Ăn uống', type: 'expense', icon: 'Utensils', color: '#10b981', hidden: false },
    { id: 'transport', name: 'Di chuyển', type: 'expense', icon: 'Car', color: '#3b82f6', hidden: false },
    { id: 'freelance', name: 'Thu nhập Freelance', type: 'income', icon: 'Briefcase', color: '#8b5cf6', hidden: false },
    { id: 'salary', name: 'Lương cố định', type: 'income', icon: 'Banknote', color: '#10b981', hidden: false }
  ];

  const accounts: Account[] = [
    { id: 'bank', name: 'Tài khoản Vietcombank', type: 'bank', openingBalance: 10000000, color: '#10b981', active: true, createdAt: '2026-01-01' },
    { id: 'wallet', name: 'Ví tiền mặt', type: 'cash', openingBalance: 500000, color: '#f59e0b', active: true, createdAt: '2026-01-01' }
  ];

  it('1. Splits complex compound sentences into individual clauses', () => {
    const input = 'Tối qua đi ăn với bạn hết 250k, hôm nay nhận 2 triệu tiền freelance.';
    const clauses = splitCompoundSentence(input);
    expect(clauses.length).toBe(2);
    expect(clauses[0]).toContain('250');
    expect(clauses[1]).toContain('2');
  });

  it('2. Correctly parses compound input from Master Prompt Section 6.1', () => {
    const input = 'Tối qua đi ăn với bạn hết 250k, hôm nay nhận 2 triệu tiền freelance.';
    const result = parseMultiTransactions(input, categories, accounts, 'bank');

    expect(result.drafts.length).toBe(2);

    // First transaction: Expense 250.000₫
    const tx1 = result.drafts[0];
    expect(tx1.type).toBe('expense');
    expect(tx1.amount).toBe(250000);
    expect(tx1.categoryId).toBe('food');

    // Second transaction: Income 2.000.000₫
    const tx2 = result.drafts[1];
    expect(tx2.type).toBe('income');
    expect(tx2.amount).toBe(2000000);
    expect(tx2.incomeSourceType).toBe('freelance');
  });

  it('3. Handles sentences with 3 actions joined by commas and "và"', () => {
    const input = 'Sáng uống cà phê 35k, đổ xăng 50k và nhận lương 15 triệu';
    const result = parseMultiTransactions(input, categories, accounts, 'bank');

    expect(result.drafts.length).toBe(3);
    expect(result.drafts[0].amount).toBe(35000);
    expect(result.drafts[1].amount).toBe(50000);
    expect(result.drafts[2].amount).toBe(15000000);
    expect(result.drafts[2].type).toBe('income');
  });
});
