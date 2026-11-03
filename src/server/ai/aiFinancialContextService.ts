import type { FinanceData } from '../../types';
import { monthKey, todayKey, budgetSpent, debtRemaining, balance } from '../../lib/finance';
import {
  calculateTrueSpendableBalance,
  calculateInvestmentSummary,
  analyzeFinancialRisks
} from '../../lib/riskAndInsightEngine';
import {
  calculateComprehensiveNetWorth,
  getSampleWealthInvestmentNotes
} from '../../lib/investmentProjectionEngine';

export class AIFinancialContextService {
  /**
   * Complete High-Level Financial Overview (Net worth, Safe-to-Spend, Cash, Debt, Investments)
   */
  public static getFinancialOverview(data: FinanceData) {
    const trueSpendable = calculateTrueSpendableBalance(data);
    const invSummary = calculateInvestmentSummary(data.investments || []);
    const risks = analyzeFinancialRisks(data);

    const totalBankCash = (data.accounts || [])
      .filter(a => a.type === 'bank' || a.type === 'cash')
      .reduce((sum, a) => sum + balance(a, data.transactions || []), 0);

    const totalDebtOwed = (data.debts || [])
      .filter(d => d.kind === 'owed')
      .reduce((sum, d) => sum + debtRemaining(d), 0);

    const totalDebtLent = (data.debts || [])
      .filter(d => d.kind === 'lent')
      .reduce((sum, d) => sum + debtRemaining(d), 0);

    // Wealth Management Smart Ledger Integration
    const notes = (data.smartInvestmentNotes && data.smartInvestmentNotes.length > 0)
      ? data.smartInvestmentNotes
      : getSampleWealthInvestmentNotes();

    const wealthNetWorth = calculateComprehensiveNetWorth(
      totalBankCash,
      notes,
      totalDebtOwed,
      Boolean(data.hideRiskyAssetsGlobal)
    );

    return {
      netWorth: wealthNetWorth.headlineNetWorth,
      fullNetWorth: wealthNetWorth.fullNetWorth,
      conservativeNetWorth: wealthNetWorth.conservativeNetWorth,
      isSafeModeActive: wealthNetWorth.isSafeModeActive,
      totalBankCash,
      trueSpendableBalance: trueSpendable.trueBalance,
      dailySafeToSpend: trueSpendable.dailySafeToSpend,
      burnRateDaysLeft: trueSpendable.burnRateDaysLeft,
      burnRateStatus: trueSpendable.status,
      wealth: {
        unrecoveredCapital: wealthNetWorth.unrecoveredCapital,
        totalInvestedCapital: wealthNetWorth.totalInvestedCapital,
        totalRecoveredCapital: wealthNetWorth.totalRecoveredCapital,
        totalInvestmentValue: wealthNetWorth.totalInvestmentValue,
        unrealizedPnL: wealthNetWorth.unrealizedPnL,
        highLiquidityRatio: wealthNetWorth.highLiquidityRatio,
        riskBreakdown: wealthNetWorth.riskBreakdown
      },
      investments: {
        totalValue: invSummary.totalCurrentValue,
        totalCostBasis: invSummary.totalCostBasis,
        totalPnL: invSummary.totalPnL,
        pnlPercent: invSummary.totalPnLPercent,
        count: invSummary.assetsWithPnL.length
      },
      debt: {
        owed: totalDebtOwed,
        lent: totalDebtLent
      },
      activeRisksCount: risks.length,
      topRisks: risks.slice(0, 3).map(r => `[${r.level.toUpperCase()}] ${r.title}`)
    };
  }

  /**
   * Monthly Expense Breakdown (Top categories, total spent, transaction volume)
   */
  public static getExpenseSummary(data: FinanceData, targetMonth?: string) {
    const m = targetMonth || monthKey(new Date());
    const monthlyTxs = (data.transactions || []).filter(
      t => t.type === 'expense' && t.status === 'completed' && t.date.startsWith(m)
    );

    const totalSpent = monthlyTxs.reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const catMap = new Map<string, number>();
    for (const tx of monthlyTxs) {
      const cId = tx.categoryId || 'other';
      catMap.set(cId, (catMap.get(cId) || 0) + tx.amount);
    }

    const categories = (data.categories || []).filter(c => c.type === 'expense');
    const categoryBreakdown = Array.from(catMap.entries())
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        return {
          categoryId: catId,
          categoryName: cat?.name || 'Khác',
          amount,
          percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      month: m,
      totalSpent,
      transactionCount: monthlyTxs.length,
      categoryBreakdown: categoryBreakdown.slice(0, 8),
      topExpense: categoryBreakdown[0] || null
    };
  }

  /**
   * Budget Usage vs Limits
   */
  public static getBudgetSummary(data: FinanceData, targetMonth?: string) {
    const m = targetMonth || monthKey(new Date());
    const monthlyBudgets = (data.budgets || []).filter(b => b.month === m);

    const items = monthlyBudgets.map(b => {
      const spent = budgetSpent(b, data.transactions || []);
      const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
      const isOver = spent > b.limit;
      const cat = data.categories.find(c => c.id === b.categoryId);

      return {
        id: b.id,
        name: b.name,
        categoryId: b.categoryId,
        categoryName: cat?.name || 'Toàn bộ',
        limit: b.limit,
        spent,
        remaining: Math.max(0, b.limit - spent),
        percentUsed: pct,
        isOver
      };
    });

    const totalBudgetLimit = items.reduce((sum, i) => sum + i.limit, 0);
    const totalBudgetSpent = items.reduce((sum, i) => sum + i.spent, 0);
    const overspentCount = items.filter(i => i.isOver).length;

    return {
      month: m,
      totalBudgetLimit,
      totalBudgetSpent,
      overspentCount,
      budgets: items
    };
  }

  /**
   * Investment Portfolio Status & SL/TP Triggers
   */
  public static getInvestmentSummary(data: FinanceData) {
    const summary = calculateInvestmentSummary(data.investments || []);
    const holdings = (data.investments || []).map(inv => {
      const pnl = (inv.currentUnitPrice - (inv.totalCostBasis / (inv.quantity || 1))) * inv.quantity;
      const pnlPct = inv.totalCostBasis > 0 ? (pnl / inv.totalCostBasis) * 100 : 0;

      return {
        id: inv.id,
        symbol: inv.symbol,
        name: inv.name,
        quantity: inv.quantity,
        currentPrice: inv.currentUnitPrice,
        totalCost: inv.totalCostBasis,
        currentValue: inv.quantity * inv.currentUnitPrice,
        pnl: Math.round(pnl),
        pnlPercent: Math.round(pnlPct * 10) / 10,
        targetTakeProfit: inv.targetTakeProfit,
        targetStopLoss: inv.targetStopLoss,
        freshness: inv.freshness || 'reference'
      };
    });

    return {
      totalValue: summary.totalCurrentValue,
      totalCostBasis: summary.totalCostBasis,
      totalPnL: summary.totalPnL,
      pnlPercent: summary.totalPnLPercent,
      holdings
    };
  }

  /**
   * Outstanding Debt & Upcoming Due Dates
   */
  public static getDebtSummary(data: FinanceData) {
    const nowKey = todayKey();
    const debts = (data.debts || []).map(d => {
      const remaining = debtRemaining(d);
      const isOverdue = d.dueDate < nowKey && remaining > 0;
      return {
        id: d.id,
        name: d.name,
        kind: d.kind,
        principal: d.principal,
        remaining,
        dueDate: d.dueDate,
        isOverdue
      };
    });

    const owed = debts.filter(d => d.kind === 'owed').reduce((s, d) => s + d.remaining, 0);
    const lent = debts.filter(d => d.kind === 'lent').reduce((s, d) => s + d.remaining, 0);

    return {
      totalOwed: owed,
      totalLent: lent,
      debts: debts.filter(d => d.remaining > 0)
    };
  }

  /**
   * Active Savings Goals
   */
  public static getSavingsSummary(data: FinanceData) {
    const goals = (data.goals || []).map(g => {
      const current = (g.contributions || []).reduce((sum, c) => sum + c.amount, 0);
      return {
        id: g.id,
        name: g.name,
        target: g.target,
        current,
        percent: g.target > 0 ? Math.round((current / g.target) * 100) : 0,
        deadline: g.dueDate
      };
    });

    return {
      totalGoals: goals.length,
      goals
    };
  }
}
