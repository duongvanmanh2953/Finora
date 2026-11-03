import type { FinanceData } from '../../types';
import type {
  AIChatMessage,
  AIConversation,
  ActionPlan,
  AIUsageMetrics
} from './types';
import { AIIntentRouter } from './aiIntentRouter';
import { AIFinancialContextService } from './aiFinancialContextService';
import { AIActionPlanner } from './aiActionPlanner';
import { AIActionExecutor, type ExecutionResult } from './aiActionExecutor';
import { money } from '../../lib/finance';
import { isProUser } from '../../lib/subscription';

export class AIService {
  private conversations = new Map<string, AIConversation>();
  private actionPlans = new Map<string, ActionPlan>();

  // Telemetry metrics
  private totalRequests = 0;
  private totalTokens = 0;
  private dailyUserRequests = new Map<string, { count: number; date: string }>();

  public getTelemetry(): {
    totalRequests: number;
    totalTokens: number;
    estimatedCostVND: number;
    activeConversations: number;
  } {
    // Estimated cost ~0.05 VND per token
    return {
      totalRequests: this.totalRequests,
      totalTokens: this.totalTokens,
      estimatedCostVND: Math.round(this.totalTokens * 0.05),
      activeConversations: this.conversations.size
    };
  }

  public getUsage(data: FinanceData): AIUsageMetrics {
    const isPro = isProUser(data);
    const today = new Date().toISOString().slice(0, 10);
    const record = this.dailyUserRequests.get(data.user.id);
    const count = record && record.date === today ? record.count : 0;

    return {
      totalRequests: this.totalRequests,
      totalTokens: this.totalTokens,
      estimatedCostVND: Math.round(this.totalTokens * 0.05),
      freeQuotaUsedToday: count,
      freeQuotaMaxDaily: 5,
      isPro
    };
  }

  private incrementUserQuota(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const record = this.dailyUserRequests.get(userId);
    if (!record || record.date !== today) {
      this.dailyUserRequests.set(userId, { count: 1, date: today });
    } else {
      record.count++;
    }
  }

  /**
   * Main conversational intelligence entry point
   */
  public async handleMessage(
    userText: string,
    data: FinanceData,
    conversationId: string = 'default'
  ): Promise<AIChatMessage> {
    this.totalRequests++;
    const isPro = isProUser(data);
    const today = new Date().toISOString().slice(0, 10);
    const userQuota = this.dailyUserRequests.get(data.user.id);
    const todayCount = userQuota && userQuota.date === today ? userQuota.count : 0;

    // Check Free Quota (5 messages/day)
    if (!isPro && todayCount >= 5) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        type: 'subscription_required',
        text: 'Bạn đã sử dụng hết 5 lượt hội thoại Finora AI miễn phí trong ngày hôm nay. Nâng cấp gói Pro để trò chuyện không giới hạn, phân tích danh mục chuyên sâu và lập kế hoạch tài chính tự động!',
        data: {
          code: 'PRO_REQUIRED',
          feature: 'ai_copilot',
          quotaUsed: todayCount,
          quotaMax: 5
        },
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
    }

    this.incrementUserQuota(data.user.id);
    this.totalTokens += Math.round(userText.length * 1.5) + 200;

    const intent = AIIntentRouter.classify(userText);

    // 1. Check if user requested an Action Proposal (e.g. create transactions, create/update budget)
    if (intent.startsWith('ACTION_')) {
      const plan = AIActionPlanner.parseActionPlan(userText, data, conversationId);
      if (plan && plan.actions.length > 0) {
        this.actionPlans.set(plan.id, plan);

        return {
          id: `ai-msg-${Date.now()}`,
          sender: 'assistant',
          type: 'action_plan',
          text: `Tôi đã lập kế hoạch gồm **${plan.actions.length} hành động tài chính**. Toàn bộ hành động hợp lệ đã được chọn sẵn theo mặc định. Bạn có thể kiểm tra, điều chỉnh hoặc bấm thực thi.`,
          actionPlan: plan,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    // 2. Query Intents: Financial Overview
    if (intent === 'FINANCIAL_OVERVIEW') {
      const overview = AIFinancialContextService.getFinancialOverview(data);
      const text =
        `📊 **TỔNG QUAN TÀI CHÍNH HIỆN TẠI**:\n\n` +
        `• **Tài sản ròng (Net Worth)**: ${money(overview.netWorth)}\n` +
        `• **Số dư thực có thể tiêu**: ${money(overview.trueSpendableBalance)}\n` +
        `• **Hạn mức an toàn hôm nay**: ${money(overview.dailySafeToSpend)} / ngày\n` +
        `• **Dự báo ngày cháy túi**: Còn khoảng **${overview.burnRateDaysLeft} ngày** (Trạng thái: ${overview.burnRateStatus === 'safe' ? 'An toàn' : 'Cảnh báo'})\n` +
        `• **Danh mục đầu tư**: ${overview.investments.count} mã · Giá trị: ${money(overview.investments.totalValue)} · Lãi/lỗ: ${money(overview.investments.totalPnL)} (${overview.investments.pnlPercent}%)\n` +
        `• **Nợ & Cho vay**: Cần trả ${money(overview.debt.owed)} · Cần thu ${money(overview.debt.lent)}`;

      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        type: 'financial_insight',
        text,
        data: overview,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 3. Query Intents: Expense Analysis
    if (intent === 'EXPENSE_ANALYSIS') {
      const expense = AIFinancialContextService.getExpenseSummary(data);
      let text = `💸 **PHÂN TÍCH CHI TIÊU THÁNG ${expense.month}**:\n\n` +
        `• **Tổng chi tiêu hoàn tất**: ${money(expense.totalSpent)} (${expense.transactionCount} giao dịch)\n`;

      if (expense.topExpense) {
        text += `• **Khoản ngốn tiền nhất**: **${expense.topExpense.categoryName}** (${money(expense.topExpense.amount)} - chiếm ${expense.topExpense.percent}% tổng chi)\n\n`;
      }

      text += `**Top danh mục chi tiêu**:\n` +
        expense.categoryBreakdown.map(c => `• ${c.categoryName}: ${money(c.amount)} (${c.percent}%)`).join('\n');

      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        type: 'financial_insight',
        text,
        data: expense,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 4. Query Intents: Budget Analysis
    if (intent === 'BUDGET_ANALYSIS') {
      const budget = AIFinancialContextService.getBudgetSummary(data);
      let text = `🎯 **TÌNH HÌNH NGÂN SÁCH THÁNG ${budget.month}**:\n\n` +
        `• **Tổng hạn mức**: ${money(budget.totalBudgetLimit)}\n` +
        `• **Đã sử dụng**: ${money(budget.totalBudgetSpent)} (${Math.round((budget.totalBudgetSpent / (budget.totalBudgetLimit || 1)) * 100)}%)\n`;

      if (budget.overspentCount > 0) {
        text += `⚠️ **Cảnh báo**: Có ${budget.overspentCount} ngân sách đã chạm hoặc vượt trần chi tiêu!\n\n`;
      }

      text += budget.budgets.map(b =>
        `• ${b.name}: ${money(b.spent)} / ${money(b.limit)} (${b.percentUsed}%) ${b.isOver ? '🚨 Vượt trần' : '✅ Trong hạn mức'}`
      ).join('\n');

      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        type: 'financial_insight',
        text,
        data: budget,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 5. Query Intents: Investment Portfolio
    if (intent === 'INVESTMENT_ANALYSIS') {
      const inv = AIFinancialContextService.getInvestmentSummary(data);
      let text = `📈 **DANH MỤC ĐẦU TƯ HIỆN TẠI**:\n\n` +
        `• **Tổng giá trị thị trường**: ${money(inv.totalValue)}\n` +
        `• **Tổng giá vốn (Cost Basis)**: ${money(inv.totalCostBasis)}\n` +
        `• **Lãi/Lỗ chưa thực hiện**: ${inv.totalPnL >= 0 ? '+' : ''}${money(inv.totalPnL)} (${inv.pnlPercent}%)\n\n` +
        `**Chi tiết các vị thế**:\n` +
        inv.holdings.map(h =>
          `• ${h.symbol} (${h.name}): ${h.quantity} đơn vị · Thị giá: ${money(h.currentPrice)} · PnL: ${h.pnl >= 0 ? '+' : ''}${money(h.pnl)} (${h.pnlPercent}%)`
        ).join('\n');

      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        type: 'financial_insight',
        text,
        data: inv,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 6. Default General Chat
    return {
      id: `ai-msg-${Date.now()}`,
      sender: 'assistant',
      type: 'text',
      text: 'Xin chào! Tôi là Trợ lý Tài chính Finora AI. Tôi có thể giúp bạn phân tích chi tiêu, kiểm tra ngân sách, rà soát danh mục đầu tư, hoặc tạo nhanh các giao dịch & ngân sách chi tiêu bằng câu lệnh tự nhiên.',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
  }

  /**
   * Action plan execution
   */
  public executeActionPlan(planId: string, currentData: FinanceData): ExecutionResult {
    const plan = this.actionPlans.get(planId);
    if (!plan) {
      throw new Error('Kế hoạch hành động không tồn tại hoặc đã hết hạn.');
    }

    const result = AIActionExecutor.executePlan(plan, currentData);
    plan.status = 'executed';
    plan.executedAt = new Date().toISOString();

    return result;
  }

  /**
   * Inline update of a pending action in draft plan
   */
  public updateActionInPlan(
    planId: string,
    actionId: string,
    newProposedValues: Record<string, any>,
    isSelected?: boolean
  ): ActionPlan | null {
    const plan = this.actionPlans.get(planId);
    if (!plan) return null;

    plan.actions = plan.actions.map(action => {
      if (action.id === actionId) {
        const mergedValues = { ...action.proposedValues, ...newProposedValues };
        const amount = Number(mergedValues.amount ?? mergedValues.limit ?? 0);
        const isValid = amount > 0;

        return {
          ...action,
          proposedValues: mergedValues,
          isSelected: isSelected !== undefined ? isSelected : action.isSelected,
          validationStatus: isValid ? 'valid' : 'invalid',
          description: mergedValues.name
            ? `${mergedValues.name} · ${new Intl.NumberFormat('vi-VN').format(amount)} ₫`
            : action.description
        };
      }
      return action;
    });

    return plan;
  }
}

export const aiService = new AIService();
