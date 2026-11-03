import type { AIIntentType } from './types';

export class AIIntentRouter {
  public static classify(query: string): AIIntentType {
    const text = (query || '').toLowerCase().trim();

    // 1. Action intents (Commands to create or modify data)
    if (
      text.includes('thêm') ||
      text.includes('tạo') ||
      text.includes('sửa') ||
      text.includes('đổi thành') ||
      text.includes('thiết lập') ||
      text.startsWith('chi ') ||
      text.startsWith('tiêu ')
    ) {
      if (text.includes('ngân sách')) {
        return text.includes('sửa') || text.includes('đổi') ? 'ACTION_BUDGET_UPDATE' : 'ACTION_BUDGET_CREATE';
      }
      if (text.includes('tiết kiệm') || text.includes('mục tiêu')) {
        return 'ACTION_SAVINGS_CREATE';
      }
      return 'ACTION_TRANSACTION_CREATE';
    }

    // 2. Query intents
    if (text.includes('đầu tư') || text.includes('cổ phiếu') || text.includes('lãi lỗ') || text.includes('lời lỗ') || text.includes('vàng') || text.includes('chứng chỉ quỹ') || text.includes('cắt lỗ')) {
      return 'INVESTMENT_ANALYSIS';
    }

    if (text.includes('ngân sách') || text.includes('hạn mức') || text.includes('lạm chi') || text.includes('vượt ngân sách')) {
      return 'BUDGET_ANALYSIS';
    }

    if (text.includes('tiêu hết bao nhiêu') || text.includes('khoản nào ngốn') || text.includes('chi tiêu') || text.includes('chi bao nhiêu') || text.includes('ăn uống')) {
      return 'EXPENSE_ANALYSIS';
    }

    if (text.includes('thu nhập') || text.includes('lương') || text.includes('thưởng')) {
      return 'INCOME_ANALYSIS';
    }

    if (text.includes('nợ') || text.includes('vay') || text.includes('trả góp')) {
      return 'DEBT_ANALYSIS';
    }

    if (text.includes('tiết kiệm') || text.includes('đạt mục tiêu')) {
      return 'SAVINGS_PLANNING';
    }

    if (text.includes('tổng quan') || text.includes('tình hình') || text.includes('an toàn') || text.includes('cháy túi') || text.includes('tài sản ròng')) {
      return 'FINANCIAL_OVERVIEW';
    }

    return 'GENERAL_CHAT';
  }
}
