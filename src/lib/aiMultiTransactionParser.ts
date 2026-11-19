/**
 * FINORA AI MULTI-TRANSACTION NATURAL LANGUAGE PARSER
 *
 * Disassembles complex compound sentences into multiple distinct financial transactions.
 * Example:
 * "Tối qua đi ăn với bạn hết 250k, hôm nay nhận 2 triệu tiền freelance."
 * -> Tx 1: Expense 250.000₫ (Ăn uống, Tối qua)
 * -> Tx 2: Income 2.000.000₫ (Freelance, Hôm nay)
 *
 * Principles:
 * - Deterministic, safe regex-based NLP combined with vocabulary context.
 * - Categorizes each transaction accurately.
 * - Extracts amount, date, description, type, category, and income source.
 * - Enforces preview and user confirmation before saving.
 */

import type { Category, Account, TxType, IncomeSourceType } from '../types';
import { uid } from './finance';
import { parseNaturalLanguageTransaction, type ParsedTransactionResult } from './transactionParser';

export interface MultiParsedDraft {
  id: string;
  clause: string;
  name: string;
  amount: number;
  type: TxType;
  date: string;
  categoryId: string;
  categoryName?: string;
  accountId: string;
  incomeSourceType?: IncomeSourceType;
  confidence: number;
  explanation: string;
}

export interface MultiParseResult {
  originalText: string;
  clausesCount: number;
  drafts: MultiParsedDraft[];
}

/**
 * Splits compound sentence into candidate transaction clauses
 */
export function splitCompoundSentence(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Replace common Vietnamese conjunction transitions with newline split marker
  let normalized = text
    .replace(/(\d+)\s*k(?=[,;.\s]|$)/gi, '$1000 ') // normalize 250k -> 250000
    .replace(/(\d+)\s*tr(?=[,;.\s]|$)/gi, '$1000000 ')
    .replace(/(\d+)\s*củ(?=[,;.\s]|$)/gi, '$1000000 ')
    .replace(/\s+và\s+(?=[a-zA-Zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ\d])/gi, ', ');

  // Split on delimiters: punctuation or transitional connectives
  // Conjunction patterns: ", hôm nay", ", rồi", ", và", ";", "\n", ", sau đó", ", tiếp tục"
  const splitPattern = /[,;.\n]+(?=\s*(?:hôm nay|tối qua|sáng nay|chiều qua|hôm qua|ngày mai|sau đó|rồi|tiếp|nhận|thu|chi|tiêu|chuyển|mua|bán|uống|ăn|đổ|\d))/i;

  const rawChunks = normalized.split(splitPattern);
  const clauses: string[] = [];

  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    clauses.push(trimmed);
  }

  // Filter clauses that actually have amounts or money-related terms
  const result: string[] = [];
  let buffer = '';

  for (const c of clauses) {
    // Check if clause has digits or money keyword
    const hasMoney = /\d/.test(c) || /(?:triệu|nghìn|ngàn|trăm|đồng|vnd|usd)/i.test(c);
    if (hasMoney) {
      if (buffer) {
        result.push(`${buffer} ${c}`.trim());
        buffer = '';
      } else {
        result.push(c);
      }
    } else {
      // Might be a prefix like "Tối qua"
      buffer = buffer ? `${buffer} ${c}` : c;
    }
  }

  if (buffer && result.length === 0) {
    result.push(buffer);
  }

  return result.length > 0 ? result : [text.trim()];
}

/**
 * Parses full natural language text into a multi-transaction draft list
 */
export function parseMultiTransactions(
  text: string,
  categories: Category[],
  accounts: Account[],
  defaultAccountId: string
): MultiParseResult {
  const clauses = splitCompoundSentence(text);
  const drafts: MultiParsedDraft[] = [];

  for (const clause of clauses) {
    const parsed: ParsedTransactionResult = parseNaturalLanguageTransaction(
      clause,
      { categories, accounts, defaultAccountId }
    );

    // If no amount detected, skip invalid phantom clauses
    if (parsed.amount <= 0) continue;

    // Detect explicit income keywords
    const lower = clause.toLowerCase();
    const isExplicitIncome = /(?:nhận|thu|lương|freelance|thưởng|bán|cổ tức|tiền về)/i.test(lower);
    const finalType: TxType = isExplicitIncome ? 'income' : parsed.type;

    // Detect income source if type is income
    let incomeSourceType: IncomeSourceType | undefined;
    let categoryId = parsed.categoryId;

    if (finalType === 'income') {
      if (lower.includes('freelance') || lower.includes('du an')) {
        incomeSourceType = 'freelance';
        const matchCat = categories.find(c => c.type === 'income' && (c.id.includes('freelance') || c.name.toLowerCase().includes('freelance')));
        if (matchCat) categoryId = matchCat.id;
      } else if (lower.includes('luong') || lower.includes('cong ty')) {
        incomeSourceType = 'salary';
        const matchCat = categories.find(c => c.type === 'income' && (c.id.includes('salary') || c.name.toLowerCase().includes('lương')));
        if (matchCat) categoryId = matchCat.id;
      } else if (lower.includes('ban hang') || lower.includes('kinh doanh')) {
        incomeSourceType = 'business';
      } else if (lower.includes('co tuc') || lower.includes('lai') || lower.includes('dau tu')) {
        incomeSourceType = 'investment';
      } else if (lower.includes('hoa hong') || lower.includes('thuong')) {
        incomeSourceType = 'commission';
      } else {
        incomeSourceType = 'other';
      }

      // If category is still an expense category, swap to default income category
      const currentCat = categories.find(c => c.id === categoryId);
      if (!currentCat || currentCat.type !== 'income') {
        const defaultInc = categories.find(c => c.type === 'income');
        if (defaultInc) categoryId = defaultInc.id;
      }
    }

    const catName = categories.find(c => c.id === categoryId)?.name;

    drafts.push({
      id: `draft-${uid()}`,
      clause,
      name: parsed.name,
      amount: parsed.amount,
      type: finalType,
      date: parsed.date,
      categoryId,
      categoryName: catName,
      accountId: parsed.accountId || defaultAccountId,
      incomeSourceType,
      confidence: parsed.confidence,
      explanation: parsed.explanation
    });
  }

  return {
    originalText: text,
    clausesCount: clauses.length,
    drafts
  };
}
