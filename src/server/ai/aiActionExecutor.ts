import type { FinanceData, Transaction, Budget, SavingsGoal } from '../../types';
import type { ActionPlan } from './types';
import { uid, todayKey } from '../../lib/finance';
import { syncSalaryToPayroll } from '../../lib/payrollEngine';

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

          let nextPayrolls = mutatedData.payrolls || [];
          if (newTx.type === 'income' && (newTx.categoryId === 'salary' || newTx.name.toLowerCase().includes('lương'))) {
            const sync = syncSalaryToPayroll(nextPayrolls, {
              name: newTx.name,
              amount: newTx.amount,
              date: newTx.date,
              accountId: newTx.accountId,
              note: newTx.note
            });
            nextPayrolls = sync.updatedPayrolls;
          }

          mutatedData = {
            ...mutatedData,
            payrolls: nextPayrolls,
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
        } else if (action.entityType === 'savings_goal') {
          const values = action.proposedValues;
          const savingAmt = Number(values.amount) || 0;
          const accountId = values.accountId || mutatedData.accounts[0]?.id || 'bank';
          const date = values.date || todayKey();

          if (action.actionType === 'UPDATE' && values.goalId) {
            // Update existing savings goal by adding contribution
            const goal = (mutatedData.goals || []).find(g => g.id === values.goalId);
            const goalName = goal?.name || values.name || 'Mục tiêu tiết kiệm';

            const newContrib = {
              id: uid(),
              amount: savingAmt,
              date,
              accountId
            };

            const contribTx: Transaction = {
              id: uid(),
              name: `Gửi tiết kiệm: ${goalName}`,
              amount: savingAmt,
              type: 'transfer',
              accountId,
              toAccountId: goal?.accountId || accountId,
              date,
              method: 'Chuyển khoản',
              note: `Đóng góp mục tiêu qua AI: ${goalName}`,
              status: 'completed'
            };

            mutatedData = {
              ...mutatedData,
              goals: (mutatedData.goals || []).map(g =>
                g.id === values.goalId
                  ? { ...g, contributions: [...(g.contributions || []), newContrib] }
                  : g
              ),
              transactions: [contribTx, ...(mutatedData.transactions || [])]
            };

            results.push({
              actionId: action.id,
              status: 'success',
              title: action.title,
              message: `Đã chuyển ${new Intl.NumberFormat('vi-VN').format(savingAmt)} ₫ vào sổ tiết kiệm "${goalName}"`
            });
            successCount++;
          } else {
            // Create a new savings goal
            const newGoalName = values.name || 'Quỹ tiết kiệm tích lũy';
            const newGoal: SavingsGoal = {
              id: uid(),
              name: newGoalName,
              icon: 'piggy-bank',
              target: Number(values.target) || savingAmt * 5,
              startDate: date,
              dueDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
              accountId,
              contributions: [
                {
                  id: uid(),
                  amount: savingAmt,
                  date,
                  accountId
                }
              ]
            };

            const contribTx: Transaction = {
              id: uid(),
              name: `Tạo sổ tiết kiệm: ${newGoalName}`,
              amount: savingAmt,
              type: 'transfer',
              accountId,
              toAccountId: accountId,
              date,
              method: 'Chuyển khoản',
              note: `Khởi tạo mục tiêu tiết kiệm qua AI`,
              status: 'completed'
            };

            mutatedData = {
              ...mutatedData,
              goals: [...(mutatedData.goals || []), newGoal],
              transactions: [contribTx, ...(mutatedData.transactions || [])]
            };

            results.push({
              actionId: action.id,
              status: 'success',
              title: action.title,
              message: `Đã tạo sổ tiết kiệm mới "${newGoalName}" và nạp khởi tạo ${new Intl.NumberFormat('vi-VN').format(savingAmt)} ₫`
            });
            successCount++;
          }
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
