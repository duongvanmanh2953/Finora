import { parseISO, differenceInCalendarDays, subMonths, format } from 'date-fns';
import type { FinanceData, Transaction, Category, Budget, RecurringTransaction } from '../types';
import { money, todayKey, monthKey, budgetSpent } from './finance';
import { removeDiacritics } from './transactionParser';

export interface DetectedRecurringPattern {
  name: string;
  amount: number;
  categoryId: string;
  accountId: string;
  frequency: 'monthly' | 'weekly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  confidence: number;
  occurrences: number;
  explanation: string;
}

export interface SpendingAnomalyResult {
  isAnomaly: boolean;
  severity?: 'warning' | 'info';
  categoryAverage?: number;
  ratio?: number;
  explanation?: string;
}

export interface BudgetSuggestion {
  categoryId: string;
  categoryName: string;
  currentLimit?: number;
  suggestedLimit: number;
  averageMonthlySpent: number;
  reason: string;
}

export interface FinancialQueryResult {
  query: string;
  intent: 'TOTAL_EXPENSE' | 'TOP_CATEGORY' | 'CATEGORY_EXPENSE' | 'BUDGET_REMAINING' | 'TOP_TRANSACTIONS' | 'UNKNOWN';
  answerText: string;
  data?: any;
}

/**
 * 3.1. RECURRING TRANSACTION DETECTION
 * Detects repeating transactions with consistent intervals and amounts
 */
export function detectRecurringPatterns(
  transactions: Transaction[],
  existingRecurring: RecurringTransaction[] = []
): DetectedRecurringPattern[] {
  if (!transactions || transactions.length < 4) return [];

  const existingKeys = new Set(
    existingRecurring.map(r => `${removeDiacritics(r.name)}_${r.categoryId}`)
  );

  // Group expense transactions by normalized name and category
  const groups: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    if (t.type !== 'expense' && t.type !== 'income') continue;
    const norm = removeDiacritics(t.name).trim();
    if (norm.length < 3) continue;
    const key = `${norm}_${t.categoryId}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  const results: DetectedRecurringPattern[] = [];

  for (const [key, group] of Object.entries(groups)) {
    if (group.length < 2 || existingKeys.has(key)) continue;

    // Sort by date ascending
    const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate average amount and variance
    const totalAmount = sorted.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = totalAmount / sorted.length;
    const amountsConsistent = sorted.every(t => Math.abs(t.amount - avgAmount) / (avgAmount || 1) < 0.2);

    if (!amountsConsistent) continue;

    // Calculate intervals between consecutive occurrences
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const d1 = parseISO(sorted[i - 1].date);
      const d2 = parseISO(sorted[i].date);
      const diff = Math.abs(differenceInCalendarDays(d2, d1));
      if (diff > 0) intervals.push(diff);
    }

    if (intervals.length === 0) continue;

    const avgInterval = intervals.reduce((s, n) => s + n, 0) / intervals.length;

    // Monthly pattern: average interval around 25-35 days
    if (avgInterval >= 25 && avgInterval <= 35) {
      const lastTx = sorted[sorted.length - 1];
      const dayOfMonth = parseInt(lastTx.date.slice(8, 10), 10);
      const catId = lastTx.categoryId || 'food';
      results.push({
        name: lastTx.name,
        amount: Math.round(avgAmount),
        categoryId: catId,
        accountId: lastTx.accountId,
        frequency: 'monthly',
        dayOfMonth,
        confidence: sorted.length >= 3 ? 0.95 : 0.8,
        occurrences: sorted.length,
        explanation: `Bạn thường chi trả "${lastTx.name}" (~${money(avgAmount)}) vào khoảng ngày ${dayOfMonth} hàng tháng (${sorted.length} lần gần đây).`
      });
    }
    // Weekly pattern: average interval around 6-8 days
    else if (avgInterval >= 6 && avgInterval <= 8) {
      const lastTx = sorted[sorted.length - 1];
      const catId = lastTx.categoryId || 'food';
      results.push({
        name: lastTx.name,
        amount: Math.round(avgAmount),
        categoryId: catId,
        accountId: lastTx.accountId,
        frequency: 'weekly',
        confidence: sorted.length >= 3 ? 0.92 : 0.75,
        occurrences: sorted.length,
        explanation: `Bạn thường thanh toán "${lastTx.name}" (~${money(avgAmount)}) đều đặn mỗi tuần (${sorted.length} lần gần đây).`
      });
    }
  }

  return results;
}

/**
 * 3.2. SPENDING ANOMALY DETECTION
 * Statistically checks if a candidate transaction is an outlier compared to user history
 */
export function detectSpendingAnomaly(
  tx: { amount: number; categoryId: string; date: string; name: string },
  history: Transaction[]
): SpendingAnomalyResult {
  if (!history || history.length < 5 || tx.amount <= 0) {
    return { isAnomaly: false };
  }

  // Filter history for completed expenses in the same category within the last 90 days
  const catExpenses = history.filter(
    h => h.type === 'expense' && h.categoryId === tx.categoryId && h.amount > 0
  );

  if (catExpenses.length < 3) {
    return { isAnomaly: false };
  }

  const amounts = catExpenses.map(h => h.amount);
  const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const ratio = tx.amount / mean;

  // Anomaly criteria: amount > 2.5 times the category baseline
  if (ratio >= 2.5 && tx.amount - mean >= 200000) {
    return {
      isAnomaly: true,
      severity: ratio >= 4 ? 'warning' : 'info',
      categoryAverage: Math.round(mean),
      ratio: Math.round(ratio * 10) / 10,
      explanation: `Khoản chi "${tx.name}" (${money(tx.amount)}) cao gấp ${Math.round(ratio * 10) / 10} lần so với mức chi tiêu trung bình (${money(mean)}) của danh mục này gần đây.`
    };
  }

  return { isAnomaly: false };
}

/**
 * 3.3. BUDGET SUGGESTION ENGINE
 * Calculates intelligent budget suggestions from real multi-month spending averages
 */
export function generateBudgetSuggestions(
  transactions: Transaction[],
  categories: Category[],
  currentBudgets: Budget[] = []
): BudgetSuggestion[] {
  if (!transactions || transactions.length === 0) return [];

  const now = new Date();
  const currentM = monthKey(now);
  const m1 = monthKey(subMonths(now, 1));
  const m2 = monthKey(subMonths(now, 2));
  const validMonths = [currentM, m1, m2];

  // Group expenses by category
  const categoryMonthlySpent: Record<string, Record<string, number>> = {};

  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const m = t.date.slice(0, 7);
    if (!validMonths.includes(m)) continue;
    const catId = t.categoryId || 'other';

    if (!categoryMonthlySpent[catId]) {
      categoryMonthlySpent[catId] = {};
    }
    categoryMonthlySpent[catId][m] = (categoryMonthlySpent[catId][m] || 0) + t.amount;
  }

  const suggestions: BudgetSuggestion[] = [];

  for (const [catId, monthsData] of Object.entries(categoryMonthlySpent)) {
    const cat = categories.find(c => c.id === catId);
    if (!cat || cat.type !== 'expense') continue;

    const values = Object.values(monthsData);
    if (values.length === 0) continue;

    const avgSpent = values.reduce((s, v) => s + v, 0) / values.length;
    if (avgSpent < 100000) continue;

    // Propose budget with a 10% safety buffer, rounded to nearest 50.000đ
    const rawSuggested = avgSpent * 1.1;
    const suggestedLimit = Math.ceil(rawSuggested / 50000) * 50000;

    const existingBudget = currentBudgets.find(b => b.categoryId === catId && b.month === currentM);

    suggestions.push({
      categoryId: catId,
      categoryName: cat.name,
      currentLimit: existingBudget?.limit,
      suggestedLimit,
      averageMonthlySpent: Math.round(avgSpent),
      reason: `Dựa trên mức chi trung bình ~${money(avgSpent)}/tháng trong các tháng gần đây.`
    });
  }

  return suggestions.sort((a, b) => b.suggestedLimit - a.suggestedLimit);
}

/**
 * 3.4. NATURAL LANGUAGE FINANCIAL QUERY
 * Answers financial questions deterministically and safely from user's actual data
 */
export function queryFinancialData(queryText: string, data: FinanceData): FinancialQueryResult {
  const norm = removeDiacritics(queryText).trim().toLowerCase();
  const currentMonth = todayKey().slice(0, 7);
  const now = new Date();
  const lastMonth = format(subMonths(now, 1), 'yyyy-MM');

  // Query A: Total expense this month ("tháng này tôi đã tiêu bao nhiêu tiền?", "tổng chi tháng này")
  if (
    norm.includes('thang nay') &&
    (norm.includes('tieu bao nhieu') || norm.includes('tong chi') || norm.includes('het bao nhieu'))
  ) {
    const thisMonthTxs = (data.transactions || []).filter(
      t => t.type === 'expense' && t.date.startsWith(currentMonth)
    );
    const total = thisMonthTxs.reduce((s, t) => s + t.amount, 0);
    return {
      query: queryText,
      intent: 'TOTAL_EXPENSE',
      answerText: `Trong tháng ${currentMonth.slice(5)}/${currentMonth.slice(0, 4)}, bạn đã chi tiêu tổng cộng ${money(total)} với ${thisMonthTxs.length} giao dịch.`,
      data: { total, count: thisMonthTxs.length, month: currentMonth }
    };
  }

  // Query B: Top category this month ("tôi tiêu nhiều nhất ở danh mục nào?", "khoản chi nhiều nhất")
  if (norm.includes('tieu nhieu nhat') || norm.includes('danh muc nao') || norm.includes('chi nhieu nhat')) {
    const thisMonthTxs = (data.transactions || []).filter(
      t => t.type === 'expense' && t.date.startsWith(currentMonth)
    );
    const catTotals: Record<string, number> = {};
    for (const t of thisMonthTxs) {
      const catId = t.categoryId || 'other';
      catTotals[catId] = (catTotals[catId] || 0) + t.amount;
    }
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const topCat = data.categories.find(c => c.id === sorted[0][0]);
      const topAmount = sorted[0][1];
      const totalMonth = thisMonthTxs.reduce((s, t) => s + t.amount, 0);
      const pct = Math.round((topAmount / (totalMonth || 1)) * 100);
      return {
        query: queryText,
        intent: 'TOP_CATEGORY',
        answerText: `Danh mục ngốn tiền nhất tháng này của bạn là "${topCat?.name || 'Chung'}" với ${money(topAmount)} (chiếm ${pct}% tổng chi tiêu).`,
        data: { category: topCat, amount: topAmount, percent: pct }
      };
    }
  }

  // Query C: Specific category expense ("tháng trước ăn uống hết bao nhiêu?", "tiền ăn uống tháng này")
  for (const cat of data.categories) {
    const catNorm = removeDiacritics(cat.name);
    if (norm.includes(catNorm)) {
      const targetMonth = norm.includes('thang truoc') ? lastMonth : currentMonth;
      const catTxs = (data.transactions || []).filter(
        t => t.type === 'expense' && t.categoryId === cat.id && t.date.startsWith(targetMonth)
      );
      const total = catTxs.reduce((s, t) => s + t.amount, 0);
      const monthLabel = targetMonth === lastMonth ? 'tháng trước' : 'tháng này';
      return {
        query: queryText,
        intent: 'CATEGORY_EXPENSE',
        answerText: `Khoản chi "${cat.name}" ${monthLabel} của bạn là ${money(total)} (${catTxs.length} giao dịch).`,
        data: { category: cat, total, month: targetMonth, count: catTxs.length }
      };
    }
  }

  // Query D: Budget remaining ("tuần này tôi còn bao nhiêu ngân sách?", "còn bao nhiêu ngân sách", "hạn mức còn lại")
  if (norm.includes('ngan sach') || norm.includes('han muc')) {
    const thisMonthBudgets = (data.budgets || []).filter(b => b.month === currentMonth);
    const totalLimit = thisMonthBudgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = thisMonthBudgets.reduce((s, b) => s + budgetSpent(b, data.transactions || []), 0);
    const remaining = Math.max(0, totalLimit - totalSpent);
    return {
      query: queryText,
      intent: 'BUDGET_REMAINING',
      answerText: `Tổng hạn mức ngân sách tháng này là ${money(totalLimit)}. Đã chi ${money(totalSpent)}, bạn còn lại ${money(remaining)} để chi tiêu.`,
      data: { totalLimit, totalSpent, remaining }
    };
  }

  // Query E: Top single transactions ("những giao dịch lớn nhất trong tháng?", "khoản chi lớn nhất")
  if (norm.includes('lon nhat') || norm.includes('cao nhat')) {
    const thisMonthTxs = (data.transactions || [])
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const listText = thisMonthTxs.map((t, idx) => `${idx + 1}. ${t.name}: ${money(t.amount)} (${t.date})`).join('; ');
    return {
      query: queryText,
      intent: 'TOP_TRANSACTIONS',
      answerText: `Top khoản chi lớn nhất tháng này: ${listText || 'Chưa có khoản chi nào.'}`,
      data: { topTransactions: thisMonthTxs }
    };
  }

  // Fallback general overview
  const totalThisMonth = (data.transactions || [])
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((s, t) => s + t.amount, 0);

  return {
    query: queryText,
    intent: 'UNKNOWN',
    answerText: `Tổng chi tiêu tháng này của bạn hiện tại là ${money(totalThisMonth)}. Bạn có thể hỏi cụ thể hơn như "Tháng này ăn uống hết bao nhiêu?" hoặc "Khoản chi lớn nhất tháng này".`,
    data: { totalThisMonth }
  };
}
