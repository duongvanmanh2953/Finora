import type { FinanceData, Transaction, Budget } from '../../types';
import type { ActionPlan } from './types';
import { uid, todayKey } from '../../lib/finance';

export interface ExecutionResult {
  success: boolean;
  totalExecuted: number;
  totalFailed: number;
  results: {
    actionId: string;
    status: 'success' | 'failed';
    title: string;
    message: string;
  }[];
  updatedData: FinanceData;
  summaryText: string;
}

export class AIActionExecutor {
  /**
   * Deterministically executes confirmed ActionPlan items on FinanceData
   */
  public static executePlan(plan: ActionPlan, currentData: FinanceData): ExecutionResult {
    let mutatedData = { ...currentData };
    const selectedActions = plan.actions.filter(a => a.isSelected);

    const results: ExecutionResult['results'] = [];
    let successCount = 0;
    let failCount = 0;

    for (const action of selectedActions) {
      try {
        if (action.actionType === 'CREATE' && action.entityType === 'transaction') {
          const values = action.proposedValues;
          const newTx: Transaction = {
            id: uid(),
            name: values.name || 'Giao dịch',
            amount: Number(values.amount) || 0,
            type: values.type || 'expense',
            categoryId: values.categoryId || 'other',
            accountId: values.accountId || mutatedData.accounts[0]?.id || 'bank',
            date: values.date || todayKey(),
            method: values.method || 'cash',
            note: values.note || 'Tạo bởi Finora AI',
            status: 'completed'
          };

          mutatedData = {
            ...mutatedData,
            transactions: [newTx, ...(mutatedData.transactions || [])]
          };

          results.push({
            actionId: action.id,
            status: 'success',
            title: action.title,
            message: `Đã ghi nhận giao dịch "${newTx.name}": ${new Intl.NumberFormat('vi-VN').format(newTx.amount)} ₫`
          });
          successCount++;
        } else if (action.actionType === 'CREATE' && action.entityType === 'budget') {
          const values = action.proposedValues;
          const newBudget: Budget = {
            id: uid(),
            name: values.name || 'Ngân sách',
            categoryId: values.categoryId,
            limit: Number(values.limit) || 0,
            month: values.month
          };

          mutatedData = {
            ...mutatedData,
            budgets: [...(mutatedData.budgets || []), newBudget]
          };

          results.push({
            actionId: action.id,
            status: 'success',
            title: action.title,
            message: `Đã thiết lập ngân sách "${newBudget.name}": ${new Intl.NumberFormat('vi-VN').format(newBudget.limit)} ₫`
          });
          successCount++;
        } else if (action.actionType === 'UPDATE' && action.entityType === 'budget') {
          const values = action.proposedValues;
          const targetId = action.entityId || values.id;

          mutatedData = {
            ...mutatedData,
            budgets: (mutatedData.budgets || []).map(b =>
              b.id === targetId ? { ...b, limit: Number(values.limit) || b.limit, name: values.name || b.name } : b
            )
          };

          results.push({
            actionId: action.id,
            status: 'success',
            title: action.title,
            message: `Đã cập nhật hạn mức ngân sách "${values.name}" thành ${new Intl.NumberFormat('vi-VN').format(values.limit)} ₫`
          });
          successCount++;
        } else {
          results.push({
            actionId: action.id,
            status: 'failed',
            title: action.title,
            message: 'Loại hành động chưa được hỗ trợ thực thi tự động.'
          });
          failCount++;
        }
      } catch (err: any) {
        results.push({
          actionId: action.id,
          status: 'failed',
          title: action.title,
          message: err?.message || 'Lỗi khi áp dụng hành động vào cơ sở dữ liệu.'
        });
        failCount++;
      }
    }

    const summaryText =
      failCount === 0
        ? `Đã hoàn thành ${successCount}/${selectedActions.length} hành động tài chính thành công vào Sổ cái.`
        : `Đã hoàn thành ${successCount}/${selectedActions.length} hành động. Có ${failCount} hành động không thể thực thi.`;

    return {
      success: failCount === 0,
      totalExecuted: successCount,
      totalFailed: failCount,
      results,
      updatedData: mutatedData,
      summaryText
    };
  }
}
