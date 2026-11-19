import { describe, it, expect } from 'vitest';
import {
  extractAmount,
  extractDate,
  detectType,
  smartSuggestCategory,
  smartSuggestAccount,
  detectDuplicateTransaction,
  parseNaturalLanguageTransaction
} from './transactionParser';
import type { Category, Account, Transaction } from '../types';

const mockCategories: Category[] = [
  { id: 'food', name: 'Ăn uống', icon: 'Utensils', color: '#10B981', type: 'expense', hidden: false },
  { id: 'transport', name: 'Di chuyển', icon: 'Car', color: '#3B82F6', type: 'expense', hidden: false },
  { id: 'shopping', name: 'Mua sắm', icon: 'ShoppingBag', color: '#EC4899', type: 'expense', hidden: false },
  { id: 'bills', name: 'Hóa đơn', icon: 'FileText', color: '#F59E0B', type: 'expense', hidden: false },
  { id: 'housing', name: 'Nhà ở', icon: 'Home', color: '#8B5CF6', type: 'expense', hidden: false },
  { id: 'salary', name: 'Tiền lương', icon: 'Briefcase', color: '#10B981', type: 'income', hidden: false },
  { id: 'bonus', name: 'Thưởng', icon: 'Gift', color: '#6366F1', type: 'income', hidden: false }
];

const mockAccounts: Account[] = [
  { id: 'acc_cash', name: 'Tiền mặt', type: 'cash', openingBalance: 500000, color: '#10B981', createdAt: '2026-01-01', active: true },
  { id: 'acc_vcb', name: 'Vietcombank', type: 'bank', openingBalance: 15000000, color: '#3B82F6', createdAt: '2026-01-01', active: true },
  { id: 'acc_momo', name: 'Ví MoMo', type: 'ewallet', openingBalance: 800000, color: '#EC4899', createdAt: '2026-01-01', active: true }
];

describe('Phase 1.2 — Natural Language Transaction Parser', () => {
  describe('1. Amount Extraction (extractAmount)', () => {
    // Required Test Table from Prompt
    it('Ăn sáng 30k -> 30.000', () => {
      expect(extractAmount('Ăn sáng 30k').amount).toBe(30000);
    });

    it('Ăn trưa 45 nghìn -> 45.000', () => {
      expect(extractAmount('Ăn trưa 45 nghìn').amount).toBe(45000);
    });

    it('Mua áo 350k -> 350.000', () => {
      expect(extractAmount('Mua áo 350k').amount).toBe(350000);
    });

    it('Đổ xăng 1tr2 -> 1.200.000', () => {
      expect(extractAmount('Đổ xăng 1tr2').amount).toBe(1200000);
    });

    it('Tiền nhà 2 triệu rưỡi -> 2.500.000', () => {
      expect(extractAmount('Tiền nhà 2 triệu rưỡi').amount).toBe(2500000);
    });

    it('Nhận lương 15 triệu -> 15.000.000', () => {
      expect(extractAmount('Nhận lương 15 triệu').amount).toBe(15000000);
    });

    it('Cafe 55.000 -> 55.000', () => {
      expect(extractAmount('Cafe 55.000').amount).toBe(55000);
    });

    it('Ăn uống 1.500.000 -> 1.500.000', () => {
      expect(extractAmount('Ăn uống 1.500.000').amount).toBe(1500000);
    });

    // Additional Edge Cases
    it('1tr5 -> 1.500.000', () => {
      expect(extractAmount('mua đồ 1tr5').amount).toBe(1500000);
    });

    it('250.000 -> 250.000', () => {
      expect(extractAmount('nạp tiền điện thoại 250.000').amount).toBe(250000);
    });

    it('1,500,000 -> 1.500.000', () => {
      expect(extractAmount('mua bàn làm việc 1,500,000').amount).toBe(1500000);
    });

    it('500 nghìn -> 500.000', () => {
      expect(extractAmount('tiền điện 500 nghìn').amount).toBe(500000);
    });

    it('1 triệu 200 nghìn -> 1.200.000', () => {
      expect(extractAmount('sửa xe 1 triệu 200 nghìn').amount).toBe(1200000);
    });

    it('trả về 0 khi không có số tiền hợp lệ', () => {
      expect(extractAmount('ăn trưa cùng bạn').amount).toBe(0);
      expect(extractAmount('').amount).toBe(0);
    });
  });

  describe('2. Date Extraction (extractDate)', () => {
    const fixedRef = new Date('2026-11-17T12:00:00Z');

    it('bóc tách "hôm nay"', () => {
      expect(extractDate('ăn sáng 30k hôm nay', fixedRef).date).toBe('2026-11-17');
    });

    it('bóc tách "hôm qua"', () => {
      expect(extractDate('cafe 45k hôm qua', fixedRef).date).toBe('2026-11-16');
    });

    it('bóc tách "hôm kia"', () => {
      expect(extractDate('đổ xăng 80k hôm kia', fixedRef).date).toBe('2026-11-15');
    });

    it('bóc tách định dạng ngày đầy đủ "10/11/2026"', () => {
      expect(extractDate('mua sách 150k ngày 10/11/2026', fixedRef).date).toBe('2026-11-10');
    });

    it('bóc tách định dạng ngày ngắn "10/11"', () => {
      expect(extractDate('tiền nhà 10/11', fixedRef).date).toBe('2026-11-10');
    });

    it('bóc tách "ngày 10"', () => {
      expect(extractDate('thanh toán điện ngày 10', fixedRef).date).toBe('2026-11-10');
    });
  });

  describe('3. Transaction Type & Internal Transfer (detectType)', () => {
    it('nhận diện giao dịch chuyển tiền nội bộ "Chuyển 2 triệu từ VCB sang tiền mặt"', () => {
      const res = detectType('Chuyển 2 triệu từ VCB sang tiền mặt', mockAccounts);
      expect(res.type).toBe('transfer');
      expect(res.fromAccountId).toBe('acc_vcb');
      expect(res.toAccountId).toBe('acc_cash');
    });

    it('nhận diện thu nhập "Nhận lương 15 triệu"', () => {
      const res = detectType('Nhận lương 15 triệu', mockAccounts);
      expect(res.type).toBe('income');
    });

    it('nhận diện chi tiêu thông thường "Ăn trưa 45k"', () => {
      const res = detectType('Ăn trưa 45k', mockAccounts);
      expect(res.type).toBe('expense');
    });
  });

  describe('4. Smart Category & Account Suggestion', () => {
    it('ưu tiên lịch sử giao dịch của người dùng trước quy tắc từ điển', () => {
      const history: Transaction[] = [
        {
          id: 'tx_1',
          name: 'The Coffee House',
          amount: 60000,
          type: 'expense',
          categoryId: 'food',
          accountId: 'acc_momo',
          date: '2026-11-10',
          method: 'Chuyển khoản',
          note: '',
          status: 'completed'
        }
      ];

      const res = smartSuggestCategory('The Coffee House 65k', mockCategories, 'expense', history);
      expect(res.categoryId).toBe('food');
      expect(res.confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('gợi ý danh mục theo từ khóa deterministic', () => {
      const resFood = smartSuggestCategory('Phở bò tái nạm 55k', mockCategories, 'expense');
      expect(resFood.categoryId).toBe('food');

      const resTransport = smartSuggestCategory('Đổ xăng xe máy 60k', mockCategories, 'expense');
      expect(resTransport.categoryId).toBe('transport');

      const resShopping = smartSuggestCategory('Mua áo sơ mi 300k', mockCategories, 'expense');
      expect(resShopping.categoryId).toBe('shopping');
    });

    it('gợi ý tài khoản theo từ khóa ngân hàng hoặc ví', () => {
      const resVcb = smartSuggestAccount('Mua đồ 350k bằng VCB', mockAccounts);
      expect(resVcb.accountId).toBe('acc_vcb');

      const resMomo = smartSuggestAccount('Trà sữa 45k qua MoMo', mockAccounts);
      expect(resMomo.accountId).toBe('acc_momo');

      const resCash = smartSuggestAccount('Gửi xe 5k tiền mặt', mockAccounts);
      expect(resCash.accountId).toBe('acc_cash');
    });
  });

  describe('5. Duplicate Transaction Detection', () => {
    it('phát hiện khả năng trùng lặp khi có giao dịch cùng ngày, cùng số tiền và danh mục', () => {
      const existing: Transaction[] = [
        {
          id: 'tx_dup',
          name: 'Ăn trưa',
          amount: 45000,
          type: 'expense',
          categoryId: 'food',
          accountId: 'acc_cash',
          date: '2026-11-17',
          method: 'Tiền mặt',
          note: '',
          status: 'completed'
        }
      ];

      const check = detectDuplicateTransaction(
        {
          name: 'Ăn trưa cơm tấm',
          amount: 45000,
          type: 'expense',
          categoryId: 'food',
          accountId: 'acc_cash',
          date: '2026-11-17'
        },
        existing
      );

      expect(check.isDuplicate).toBe(true);
      expect(check.message).toBeDefined();
    });

    it('không cảnh báo nếu khác ngày hoặc khác số tiền', () => {
      const existing: Transaction[] = [
        {
          id: 'tx_old',
          name: 'Ăn trưa',
          amount: 45000,
          type: 'expense',
          categoryId: 'food',
          accountId: 'acc_cash',
          date: '2026-11-16',
          method: 'Tiền mặt',
          note: '',
          status: 'completed'
        }
      ];

      const check = detectDuplicateTransaction(
        {
          name: 'Ăn trưa',
          amount: 45000,
          type: 'expense',
          categoryId: 'food',
          accountId: 'acc_cash',
          date: '2026-11-17'
        },
        existing
      );

      expect(check.isDuplicate).toBe(false);
    });
  });

  describe('6. End-to-end parseNaturalLanguageTransaction', () => {
    it('bóc tách toàn diện câu "Ăn trưa 45k"', () => {
      const res = parseNaturalLanguageTransaction('Ăn trưa 45k', {
        categories: mockCategories,
        accounts: mockAccounts,
        defaultAccountId: 'acc_cash'
      });

      expect(res.amount).toBe(45000);
      expect(res.type).toBe('expense');
      expect(res.categoryId).toBe('food');
      expect(res.accountId).toBe('acc_cash');
      expect(res.name).toBe('Ăn trưa');
      expect(res.isDuplicatePossible).toBe(false);
    });

    it('bóc tách toàn diện câu "Mua áo 350k bằng VCB hôm qua"', () => {
      const res = parseNaturalLanguageTransaction('Mua áo 350k bằng VCB hôm qua', {
        categories: mockCategories,
        accounts: mockAccounts,
        defaultAccountId: 'acc_cash'
      });

      expect(res.amount).toBe(350000);
      expect(res.type).toBe('expense');
      expect(res.categoryId).toBe('shopping');
      expect(res.accountId).toBe('acc_vcb');
    });
  });
});
