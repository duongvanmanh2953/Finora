import { describe, it, expect } from 'vitest';
import {
  detectRecurringPatterns,
  detectSpendingAnomaly,
  generateBudgetSuggestions,
  queryFinancialData
} from './financialIntelligence';
import type { FinanceData, Transaction, Category, Account } from '../types';

const mockCategories: Category[] = [
  { id: 'food', name: 'Ăn uống', icon: 'Utensils', color: '#10B981', type: 'expense', hidden: false },
  { id: 'housing', name: 'Nhà ở', icon: 'Home', color: '#8B5CF6', type: 'expense', hidden: false },
  { id: 'bills', name: 'Hóa đơn', icon: 'FileText', color: '#F59E0B', type: 'expense', hidden: false }
];

const mockAccounts: Account[] = [
  { id: 'bank', name: 'Vietcombank', type: 'bank', openingBalance: 10000000, color: '#10B981', createdAt: '2026-01-01', active: true }
];

describe('Phase 3 — Financial Intelligence Assistant', () => {
  describe('3.1. Recurring Transaction Detection', () => {
    it('nhận diện giao dịch định kỳ hàng tháng (tiền nhà)', () => {
      const history: Transaction[] = [
        { id: '1', name: 'Tiền thuê nhà', amount: 2500000, type: 'expense', categoryId: 'housing', accountId: 'bank', date: '2026-08-05', method: 'Chuyển khoản', note: '', status: 'completed' },
        { id: '2', name: 'Tiền thuê nhà', amount: 2500000, type: 'expense', categoryId: 'housing', accountId: 'bank', date: '2026-09-05', method: 'Chuyển khoản', note: '', status: 'completed' },
        { id: '3', name: 'Tiền thuê nhà', amount: 2500000, type: 'expense', categoryId: 'housing', accountId: 'bank', date: '2026-10-05', method: 'Chuyển khoản', note: '', status: 'completed' },
        { id: '4', name: 'Tiền thuê nhà', amount: 2500000, type: 'expense', categoryId: 'housing', accountId: 'bank', date: '2026-11-05', method: 'Chuyển khoản', note: '', status: 'completed' }
      ];

      const patterns = detectRecurringPatterns(history);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].name).toBe('Tiền thuê nhà');
      expect(patterns[0].amount).toBe(2500000);
      expect(patterns[0].frequency).toBe('monthly');
      expect(patterns[0].dayOfMonth).toBe(5);
    });

    it('không gợi ý nếu giao dịch không đều đặn hoặc đã được thiết lập định kỳ', () => {
      const irregular: Transaction[] = [
        { id: '1', name: 'Mua đồ linh tinh', amount: 100000, type: 'expense', categoryId: 'food', accountId: 'bank', date: '2026-11-01', method: 'Tiền mặt', note: '', status: 'completed' },
        { id: '2', name: 'Mua đồ linh tinh', amount: 800000, type: 'expense', categoryId: 'food', accountId: 'bank', date: '2026-11-03', method: 'Tiền mặt', note: '', status: 'completed' }
      ];

      const patterns = detectRecurringPatterns(irregular);
      expect(patterns.length).toBe(0);
    });
  });

  describe('3.2. Spending Anomaly Detection', () => {
    it('cảnh báo khi một khoản chi ăn uống cao bất thường gấp nhiều lần mức trung bình', () => {
      const history: Transaction[] = [
        { id: '1', name: 'Ăn trưa', amount: 45000, type: 'expense', categoryId: 'food', accountId: 'cash', date: '2026-11-01', method: 'Tiền mặt', note: '', status: 'completed' },
        { id: '2', name: 'Ăn tối', amount: 50000, type: 'expense', categoryId: 'food', accountId: 'cash', date: '2026-11-02', method: 'Tiền mặt', note: '', status: 'completed' },
        { id: '3', name: 'Ăn trưa', amount: 40000, type: 'expense', categoryId: 'food', accountId: 'cash', date: '2026-11-03', method: 'Tiền mặt', note: '', status: 'completed' },
        { id: '4', name: 'Ăn sáng', amount: 35000, type: 'expense', categoryId: 'food', accountId: 'cash', date: '2026-11-04', method: 'Tiền mặt', note: '', status: 'completed' },
        { id: '5', name: 'Ăn tối', amount: 55000, type: 'expense', categoryId: 'food', accountId: 'cash', date: '2026-11-05', method: 'Tiền mặt', note: '', status: 'completed' }
      ];

      // Average is ~45.000. New candidate is 450.000 (10x average)
      const res = detectSpendingAnomaly(
        { name: 'Ăn tối sang chảnh', amount: 450000, categoryId: 'food', date: '2026-11-17' },
        history
      );

      expect(res.isAnomaly).toBe(true);
      expect(res.explanation).toContain('cao gấp');
      expect(res.categoryAverage).toBeDefined();
    });

    it('không cảnh báo khi khoản chi nằm trong biên độ thông thường', () => {
      const history: Transaction[] = [
        { id: '1', name: 'Ăn trưa', amount: 45000, type: 'expense', categoryId: 'food', accountId: 'cash', date: '2026-11-01', method: 'Tiền mặt', note: '', status: 'completed' },
        { id: '2', name: 'Ăn tối', amount: 50000, type: 'expense', categoryId: 'food', accountId: 'cash', date: '2026-11-02', method: 'Tiền mặt', note: '', status: 'completed' },
        { id: '3', name: 'Ăn trưa', amount: 40000, type: 'expense', categoryId: 'food', accountId: 'cash', date: '2026-11-03', method: 'Tiền mặt', note: '', status: 'completed' }
      ];

      const res = detectSpendingAnomaly(
        { name: 'Ăn trưa', amount: 60000, categoryId: 'food', date: '2026-11-17' },
        history
      );

      expect(res.isAnomaly).toBe(false);
    });
  });

  describe('3.3. Budget Suggestion Engine', () => {
    it('tính toán đề xuất ngân sách dựa trên mức chi trung bình thực tế', () => {
      const history: Transaction[] = [
        { id: '1', name: 'Ăn uống', amount: 1500000, type: 'expense', categoryId: 'food', accountId: 'bank', date: '2026-09-10', method: 'Chuyển khoản', note: '', status: 'completed' },
        { id: '2', name: 'Ăn uống', amount: 1600000, type: 'expense', categoryId: 'food', accountId: 'bank', date: '2026-10-10', method: 'Chuyển khoản', note: '', status: 'completed' },
        { id: '3', name: 'Ăn uống', amount: 1400000, type: 'expense', categoryId: 'food', accountId: 'bank', date: '2026-11-10', method: 'Chuyển khoản', note: '', status: 'completed' }
      ];

      const suggestions = generateBudgetSuggestions(history, mockCategories);
      expect(suggestions.length).toBeGreaterThan(0);
      const foodSug = suggestions.find(s => s.categoryId === 'food');
      expect(foodSug).toBeDefined();
      expect(foodSug?.suggestedLimit).toBeGreaterThan(1500000);
      expect(foodSug?.reason).toContain('mức chi trung bình');
    });
  });

  describe('3.4. Natural Language Financial Query', () => {
    const mockData: FinanceData = {
      user: {
        id: 'u1',
        name: 'Tester',
        email: 'test@finora.vn',
        currency: 'VND',
        financialMonthStart: 1,
        plan: 'free',
        streakCount: 0
      },
      accounts: mockAccounts,
      categories: mockCategories,
      transactions: [
        { id: '1', name: 'Ăn lẩu', amount: 400000, type: 'expense', categoryId: 'food', accountId: 'bank', date: '2026-11-02', method: 'Tiền mặt', note: '', status: 'completed' },
        { id: '2', name: 'Tiền điện', amount: 350000, type: 'expense', categoryId: 'bills', accountId: 'bank', date: '2026-11-05', method: 'Tiền mặt', note: '', status: 'completed' },
        { id: '3', name: 'Cơm tấm', amount: 50000, type: 'expense', categoryId: 'food', accountId: 'bank', date: '2026-11-10', method: 'Tiền mặt', note: '', status: 'completed' }
      ],
      budgets: [
        { id: 'b1', name: 'Ăn uống', categoryId: 'food', limit: 3000000, month: '2026-11' }
      ],
      goals: [],
      recurring: [],
      debts: [],
      notifications: [],
      quickTemplates: [],
      investments: []
    };

    it('trả lời đúng tổng chi tháng này từ dữ liệu thật', () => {
      const res = queryFinancialData('Tháng này tôi đã tiêu bao nhiêu tiền?', mockData);
      expect(res.intent).toBe('TOTAL_EXPENSE');
      expect(res.answerText).toContain('800,000 ₫');
      expect(res.data.count).toBe(3);
    });

    it('trả lời đúng danh mục ngốn tiền nhất', () => {
      const res = queryFinancialData('Tôi tiêu nhiều nhất ở danh mục nào?', mockData);
      expect(res.intent).toBe('TOP_CATEGORY');
      expect(res.answerText).toContain('Ăn uống');
      expect(res.data.amount).toBe(450000);
    });

    it('trả lời đúng hạn mức ngân sách còn lại', () => {
      const res = queryFinancialData('Tôi còn bao nhiêu ngân sách tháng này?', mockData);
      expect(res.intent).toBe('BUDGET_REMAINING');
      expect(res.answerText).toContain('hạn mức ngân sách');
      expect(res.data.remaining).toBe(2550000);
    });
  });
});
