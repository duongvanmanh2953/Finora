import { uid, monthKey, todayKey } from '../../lib/finance';
import type { FinanceData } from '../../types';
import type { ActionPlan, ActionItem } from './types';

export class AIActionPlanner {
  /**
   * Attempts to parse intent and formulate structured ActionPlans
   * CRITICAL REQUIREMENT: All valid proposed actions are marked with isSelected = true by default!
   */
  public static parseActionPlan(
    userText: string,
    data: FinanceData,
    conversationId: string
  ): ActionPlan | null {
    const text = userText.trim().toLowerCase();
    const currentMonth = monthKey(new Date());
    const currentDate = todayKey();
    const defaultAccount = data.accounts[0]?.id || 'bank';

    // -------------------------------------------------------------------------
    // Pattern 1: Batch or Single Transaction Create
    // e.g.: "thêm 3 khoản chi: 50k ăn sáng, 30k gửi xe, 80k ăn trưa"
    // e.g.: "chi 45k cà phê sáng", "tiêu 250k tiền ăn trưa hôm nay"
    // -------------------------------------------------------------------------
    if (
      text.includes('thêm khoản chi') ||
      text.includes('thêm 3 khoản chi') ||
      text.includes('thêm') && (text.includes('chi') || text.includes('tiêu')) ||
      text.startsWith('chi ') ||
      text.startsWith('tiêu ')
    ) {
      const actions: ActionItem[] = [];

      // Extract parts if formatted with colon or commas
      let itemsToParse: string[] = [];
      if (text.includes(':')) {
        const afterColon = text.split(':')[1];
        itemsToParse = afterColon.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      } else {
        itemsToParse = [text];
      }

      for (const itemStr of itemsToParse) {
        const parsed = this.parseSingleTxItem(itemStr, data);
        if (parsed) {
          actions.push({
            id: uid(),
            actionType: 'CREATE',
            entityType: 'transaction',
            title: `Ghi nhận chi tiêu: ${parsed.name}`,
            description: `Số tiền: ${new Intl.NumberFormat('vi-VN').format(parsed.amount)} ₫ · Ngày ${currentDate}`,
            proposedValues: {
              name: parsed.name,
              amount: parsed.amount,
              type: 'expense',
              categoryId: parsed.categoryId,
              accountId: defaultAccount,
              date: currentDate,
              method: 'cash',
              note: 'Finora AI Action Assistant ghi nhận'
            },
            validationStatus: parsed.amount > 0 ? 'valid' : 'invalid',
            // CRITICAL: All valid actions selected by default!
            isSelected: parsed.amount > 0,
            idempotencyKey: `act-tx-${Date.now()}-${uid()}`
          });
        }
      }

      if (actions.length > 0) {
        return {
          id: `plan-${Date.now()}`,
          userId: data.user.id,
          conversationId,
          title: `Đề xuất ghi nhận ${actions.length} giao dịch chi tiêu`,
          summary: `Finora AI đã phân tích câu lệnh và chuẩn bị sẵn ${actions.length} bút toán giao dịch. Bạn có thể chỉnh sửa trực tiếp hoặc xác nhận thực thi.`,
          status: 'draft',
          actions,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        };
      }
    }

    // -------------------------------------------------------------------------
    // Pattern 2: Batch or Single Budget Create
    // e.g.: "tạo ngân sách tháng này gồm ăn uống 3 triệu, đi lại 1 triệu, mua sắm 1,5 triệu"
    // e.g.: "tạo ngân sách đi lại 1 triệu mỗi tháng"
    // -------------------------------------------------------------------------
    if (
      text.includes('tạo ngân sách') ||
      text.includes('thiết lập ngân sách')
    ) {
      const actions: ActionItem[] = [];

      let rawSegments: string[] = [];
      if (text.includes('gồm')) {
        rawSegments = text.split('gồm')[1].split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      } else if (text.includes(':')) {
        rawSegments = text.split(':')[1].split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      } else {
        rawSegments = [text.replace(/tạo ngân sách|thiết lập ngân sách/gi, '').trim()];
      }

      for (const seg of rawSegments) {
        const parsedBudget = this.parseSingleBudgetItem(seg, data);
        if (parsedBudget) {
          actions.push({
            id: uid(),
            actionType: 'CREATE',
            entityType: 'budget',
            title: `Tạo ngân sách: ${parsedBudget.name}`,
            description: `Hạn mức: ${new Intl.NumberFormat('vi-VN').format(parsedBudget.limit)} ₫ · Tháng ${currentMonth}`,
            proposedValues: {
              name: parsedBudget.name,
              categoryId: parsedBudget.categoryId,
              limit: parsedBudget.limit,
              month: currentMonth
            },
            validationStatus: parsedBudget.limit > 0 ? 'valid' : 'invalid',
            // CRITICAL: All valid actions selected by default!
            isSelected: parsedBudget.limit > 0,
            idempotencyKey: `act-bg-${Date.now()}-${uid()}`
          });
        }
      }

      if (actions.length > 0) {
        return {
          id: `plan-${Date.now()}`,
          userId: data.user.id,
          conversationId,
          title: `Đề xuất thiết lập ${actions.length} ngân sách chi tiêu`,
          summary: `Finora AI đã tạo ${actions.length} hạn mức ngân sách tháng ${currentMonth} theo yêu cầu. Toàn bộ hành động hợp lệ đã được chọn sẵn theo mặc định.`,
          status: 'draft',
          actions,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        };
      }
    }

    // -------------------------------------------------------------------------
    // Pattern 3: Budget Update / Inline Edit
    // e.g.: "sửa ngân sách ăn uống thành 3,5 triệu", "đổi thành 3,5 triệu"
    // -------------------------------------------------------------------------
    if (
      (text.includes('sửa ngân sách') || text.includes('đổi thành') || text.includes('thay đổi ngân sách'))
    ) {
      const amount = this.extractAmount(text);
      if (amount > 0) {
        // Find relevant budget or default to food/dining
        const existingBudget = (data.budgets || []).find(b =>
          b.month === currentMonth && (
            text.includes(b.name.toLowerCase()) ||
            (b.categoryId && text.includes(b.categoryId.toLowerCase())) ||
            b.name.toLowerCase().includes('ăn')
          )
        ) || data.budgets[0];

        if (existingBudget) {
          return {
            id: `plan-${Date.now()}`,
            userId: data.user.id,
            conversationId,
            title: `Đề xuất điều chỉnh ngân sách: ${existingBudget.name}`,
            summary: `Cập nhật hạn mức ngân sách từ ${new Intl.NumberFormat('vi-VN').format(existingBudget.limit)} ₫ sang ${new Intl.NumberFormat('vi-VN').format(amount)} ₫.`,
            status: 'draft',
            actions: [
              {
                id: uid(),
                actionType: 'UPDATE',
                entityType: 'budget',
                entityId: existingBudget.id,
                title: `Điều chỉnh ngân sách: ${existingBudget.name}`,
                description: `Từ ${new Intl.NumberFormat('vi-VN').format(existingBudget.limit)} ₫ ➔ ${new Intl.NumberFormat('vi-VN').format(amount)} ₫`,
                originalValues: {
                  limit: existingBudget.limit,
                  name: existingBudget.name
                },
                proposedValues: {
                  id: existingBudget.id,
                  name: existingBudget.name,
                  categoryId: existingBudget.categoryId,
                  limit: amount,
                  month: existingBudget.month
                },
                validationStatus: 'valid',
                isSelected: true, // Default selected!
                idempotencyKey: `act-bg-upd-${existingBudget.id}-${Date.now()}`
              }
            ],
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          };
        }
      }
    }

    return null;
  }

  private static parseSingleTxItem(str: string, data: FinanceData) {
    const amount = this.extractAmount(str);
    if (!amount) return null;

    // Detect category
    let categoryId = 'other';
    let cleanName = str.replace(/\b\d+(\s*(k|nghìn|ngàn|tr|triệu))?\b/gi, '').trim();
    cleanName = cleanName.replace(/^(chi|tiêu|thêm|khoản|tiền)\s+/gi, '').trim();

    if (!cleanName) cleanName = 'Chi tiêu sinh hoạt';

    const categories = data.categories.filter(c => c.type === 'expense');
    for (const cat of categories) {
      if (str.includes(cat.name.toLowerCase()) || cat.name.toLowerCase().includes(cleanName.toLowerCase())) {
        categoryId = cat.id;
        break;
      }
    }

    if (categoryId === 'other') {
      if (str.includes('ăn') || str.includes('cơm') || str.includes('phở') || str.includes('sáng') || str.includes('trưa') || str.includes('tối')) {
        categoryId = 'food';
      } else if (str.includes('xe') || str.includes('xăng') || str.includes('grab') || str.includes('gửi xe')) {
        categoryId = 'transport';
      } else if (str.includes('mua') || str.includes('sắm') || str.includes('áo') || str.includes('quần')) {
        categoryId = 'shopping';
      }
    }

    return {
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      amount,
      categoryId
    };
  }

  private static parseSingleBudgetItem(str: string, data: FinanceData) {
    const amount = this.extractAmount(str);
    if (!amount) return null;

    let cleanName = str.replace(/\b\d+(\s*(k|nghìn|ngàn|tr|triệu))?\b/gi, '').trim();
    cleanName = cleanName.replace(/^(ngân sách|tiền|mỗi tháng|tháng này)\s+/gi, '').trim();

    let categoryId: string | undefined = undefined;
    const categories = data.categories.filter(c => c.type === 'expense');
    for (const cat of categories) {
      if (str.includes(cat.name.toLowerCase()) || cat.name.toLowerCase().includes(cleanName.toLowerCase())) {
        categoryId = cat.id;
        break;
      }
    }

    if (!categoryId) {
      if (str.includes('ăn')) categoryId = 'food';
      else if (str.includes('đi') || str.includes('xe') || str.includes('lại')) categoryId = 'transport';
      else if (str.includes('mua') || str.includes('sắm')) categoryId = 'shopping';
    }

    return {
      name: `Ngân sách ${cleanName || 'chi tiêu'}`,
      categoryId,
      limit: amount
    };
  }

  public static extractAmount(str: string): number {
    const lower = str.toLowerCase();

    // 1. Match '3.5 triệu', '3,5tr', '1 triệu'
    const trMatch = lower.match(/(\d+([.,]\d+)?)\s*(tr|triệu|trieu)/);
    if (trMatch) {
      const num = parseFloat(trMatch[1].replace(',', '.'));
      return Math.round(num * 1000000);
    }

    // 2. Match '50k', '250 nghìn', '30 ngàn'
    const kMatch = lower.match(/(\d+([.,]\d+)?)\s*(k|nghìn|ngàn|nghin|ngan)/);
    if (kMatch) {
      const num = parseFloat(kMatch[1].replace(',', '.'));
      return Math.round(num * 1000);
    }

    // 3. Match pure numbers like 50000 or 1000000
    const rawNumberMatch = lower.match(/\b\d{4,9}\b/);
    if (rawNumberMatch) {
      return parseInt(rawNumberMatch[0], 10);
    }

    return 0;
  }
}
