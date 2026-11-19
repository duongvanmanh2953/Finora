/**
 * FINORA SMART EXPENSE CLASSIFICATION & MERCHANT RECOGNITION ENGINE
 *
 * Implements priority-based recognition:
 * 1. Confirmed merchant corrections / user rules.
 * 2. User's previous transactions history (by account number or beneficiary name).
 * 3. Beneficiary name keyword analysis.
 * 4. Transfer description keyword analysis.
 * 5. Built-in Vietnamese merchant dictionary.
 * 6. Heuristic / fallback.
 */

import type { Category, Transaction } from '../../types';

export interface MerchantClassificationResult {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0.0 to 1.0
  source: 'USER_RULE' | 'PREVIOUS_TRANSACTION' | 'BENEFICIARY_KEYWORD' | 'DESCRIPTION_KEYWORD' | 'MERCHANT_DB' | 'FALLBACK';
  isMerchant: boolean;
  matchedKeyword?: string;
}

export interface MerchantRule {
  identifier: string; // account number, beneficiary name, or merchant slug
  categoryId: string;
  categoryName: string;
  updatedAt: string;
}

const STORAGE_KEY_MERCHANT_RULES = 'finora_merchant_rules_v1';

/**
 * Built-in dictionary of prominent Vietnamese merchants mapped to standard expense category types
 */
const KNOWN_MERCHANTS: Array<{
  keywords: string[];
  categoryHint: 'food' | 'groceries' | 'transport' | 'health' | 'entertainment' | 'shopping' | 'bills' | 'education' | 'services';
  isVerifiedMerchant: boolean;
}> = [
  // Food & Dining
  {
    keywords: [
      'nha hang', 'quan an', 'coffee', 'cafe', 'highlands', 'phuc long', 'starbucks',
      'the coffee house', 'kfc', 'lotteria', 'jollibee', 'pizza hut', 'dominos',
      'pizza 4ps', 'golden gate', 'haidilao', 'manwah', 'gogi', 'kichi', 'king bbq',
      'pho 24', 'com tam', 'tra sua', 'tocotoco', 'gong cha', 'koi the', 'mixue',
      'chu dau do', 'banh mi', 'bakery', 'paris baguette', 'tous les jours'
    ],
    categoryHint: 'food',
    isVerifiedMerchant: true
  },
  // Groceries & Supermarkets
  {
    keywords: [
      'sieu thi', 'winmart', 'winmart+', 'coopmart', 'co.op', 'bach hoa xanh',
      'big c', 'go!', 'tops market', 'circle k', '7-eleven', '7 eleven', 'gs25',
      'familymart', 'ministop', 'mega market', 'lotte mart', 'aeon', 'aeon mall',
      'an nam gourmet', 'farmers market', 'thuc pham', 'tap hoa', 'cho truyen thong'
    ],
    categoryHint: 'groceries',
    isVerifiedMerchant: true
  },
  // Transportation & Fuel
  {
    keywords: [
      'petrolimex', 'pv oil', 'pvoil', 'xang dau', 'cay xang', 'grab', 'be group',
      'be delivery', 'gojek', 'xanh sm', 'gsm', 'taxi', 'mai linh', 'vinasun',
      've xe', 'futa', 'phuong trang', 'hang khong', 'vietjet', 'vietnam airlines',
      'bamboo airways', 'duong sat', 've tau', 'gui xe', 'bai do xe', 'thu phi', 'vetc', 'epass'
    ],
    categoryHint: 'transport',
    isVerifiedMerchant: true
  },
  // Healthcare & Medicine
  {
    keywords: [
      'nha thuoc', 'pharmacity', 'long chau', 'an khang', 'duoc pham', 'benh vien',
      'phong kham', 'nha khoa', 'y te', 'kham benh', 'xet nghiem', 'mat kinh', 'tiem thuoc'
    ],
    categoryHint: 'health',
    isVerifiedMerchant: true
  },
  // Entertainment & Recreation
  {
    keywords: [
      'cgv', 'bhd star', 'lotte cinema', 'galaxy cinema', 'rap chieu phim',
      'karaoke', 'billiards', 'gym', 'fitness', 'california fitness', 'the duc',
      'yoga', 've xem phim', 'khu vui choi', 'tiem game', 'playstation', 'steam'
    ],
    categoryHint: 'entertainment',
    isVerifiedMerchant: true
  },
  // Shopping & Electronics
  {
    keywords: [
      'shopee', 'lazada', 'tiki', 'tiktok shop', 'sendo', 'the gioi di dong',
      'dien may xanh', 'fpt shop', 'cellphones', 'hoang ha mobile', 'viettel store',
      'uniqlo', 'zara', 'h&m', 'canifa', 'routine', 'yame', 'ananas', 'bitis', 'coolmate'
    ],
    categoryHint: 'shopping',
    isVerifiedMerchant: true
  },
  // Utilities & Bills
  {
    keywords: [
      'dien luc', 'evn', 'cap nuoc', 'viettel telecom', 'vnpt', 'fpt telecom',
      'internet', 'truyen hinh', 'phi chung cu', 'ban quan ly', 've sinh moi truong'
    ],
    categoryHint: 'bills',
    isVerifiedMerchant: true
  }
];

/**
 * Normalizes text for accent-insensitive matching
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let memoryMerchantRules: MerchantRule[] = [];

/**
 * Loads stored user corrections
 */
export function getStoredMerchantRules(): MerchantRule[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_MERCHANT_RULES);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return memoryMerchantRules;
}

/**
 * Saves a user correction to improve future suggestions
 */
export function rememberMerchantCorrection(
  identifier: string,
  categoryId: string,
  categoryName: string
): void {
  if (!identifier || !categoryId) return;
  const cleanId = normalizeText(identifier);
  const currentRules = getStoredMerchantRules();
  const filtered = currentRules.filter(r => normalizeText(r.identifier) !== cleanId);
  filtered.unshift({
    identifier,
    categoryId,
    categoryName,
    updatedAt: new Date().toISOString()
  });

  const topRules = filtered.slice(0, 150);
  memoryMerchantRules = topRules;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_MERCHANT_RULES, JSON.stringify(topRules));
    } catch (err) {
      console.warn('Failed to save merchant correction rule:', err);
    }
  }
}

/**
 * Finds best matching category among available categories by type hint or name keyword
 */
function matchCategoryByHint(
  hint: string,
  categories: Category[]
): Category | undefined {
  const normHint = normalizeText(hint);
  const expenseCats = categories.filter(c => c.type === 'expense' && !c.hidden);

  // 1. Exact match on name
  const exact = expenseCats.find(c => normalizeText(c.name).includes(normHint));
  if (exact) return exact;

  // 2. Synonyms mapping
  const synonyms: Record<string, string[]> = {
    food: ['an uong', 'am thuc', 'an trua', 'an toi', 'cafe', 'ca phe', 'nha hang'],
    groceries: ['di cho', 'sieu thi', 'thuc pham', 'tap hoa', 'nhu yeu pham'],
    transport: ['di lai', 'xang xe', 'phuong tien', 'giao thong', 'xang'],
    health: ['suc khoe', 'y te', 'thuoc men', 'kham benh'],
    entertainment: ['giai tri', 'xem phim', 'vui choi', 'du lich'],
    shopping: ['mua sam', 'quan ao', 'do dien tu'],
    bills: ['hoa don', 'dien nuoc', 'tien nha', 'internet', 'dich vu']
  };

  const candidateKeywords = synonyms[hint] || [hint];
  for (const kw of candidateKeywords) {
    const found = expenseCats.find(c => normalizeText(c.name).includes(kw));
    if (found) return found;
  }

  return expenseCats[0];
}

/**
 * Classifies an incoming transaction or payment intent
 */
export function classifyMerchantExpense(params: {
  beneficiaryName?: string | null;
  transferDescription?: string | null;
  accountNumber?: string | null;
  bankBin?: string | null;
  categories: Category[];
  previousTransactions?: Transaction[];
}): MerchantClassificationResult {
  const {
    beneficiaryName = '',
    transferDescription = '',
    accountNumber = '',
    categories,
    previousTransactions = []
  } = params;

  const expenseCategories = categories.filter(c => c.type === 'expense' && !c.hidden);
  const fallbackCat = expenseCategories[0] || { id: 'other', name: 'Chi tiêu khác' };

  const normBeneficiary = normalizeText(beneficiaryName || '');
  const normDesc = normalizeText(transferDescription || '');
  const normAccount = (accountNumber || '').trim();

  // PRIORITY 1: User's confirmed merchant corrections & rules
  const userRules = getStoredMerchantRules();
  if (userRules.length > 0) {
    // Check by account number
    if (normAccount) {
      const byAcc = userRules.find(r => r.identifier.replace(/\s+/g, '') === normAccount);
      if (byAcc) {
        return {
          categoryId: byAcc.categoryId,
          categoryName: byAcc.categoryName,
          confidence: 0.98,
          source: 'USER_RULE',
          isMerchant: true,
          matchedKeyword: normAccount
        };
      }
    }

    // Check by beneficiary name
    if (normBeneficiary) {
      const byName = userRules.find(r => {
        const ruleNorm = normalizeText(r.identifier);
        return ruleNorm && (normBeneficiary.includes(ruleNorm) || ruleNorm.includes(normBeneficiary));
      });
      if (byName) {
        return {
          categoryId: byName.categoryId,
          categoryName: byName.categoryName,
          confidence: 0.95,
          source: 'USER_RULE',
          isMerchant: true,
          matchedKeyword: byName.identifier
        };
      }
    }
  }

  // PRIORITY 2: User's previous transactions
  if (previousTransactions.length > 0) {
    if (normBeneficiary || normAccount) {
      const pastMatch = previousTransactions.find(t => {
        if (t.type !== 'expense') return false;
        const pastName = normalizeText(t.name);
        const pastNote = normalizeText(t.note);
        if (normAccount && (pastNote.includes(normAccount) || pastName.includes(normAccount))) return true;
        if (normBeneficiary && pastName.length > 3 && (pastName.includes(normBeneficiary) || normBeneficiary.includes(pastName))) return true;
        return false;
      });

      if (pastMatch && pastMatch.categoryId) {
        const cat = categories.find(c => c.id === pastMatch.categoryId);
        if (cat) {
          return {
            categoryId: cat.id,
            categoryName: cat.name,
            confidence: 0.90,
            source: 'PREVIOUS_TRANSACTION',
            isMerchant: true,
            matchedKeyword: pastMatch.name
          };
        }
      }
    }
  }

  // PRIORITY 3: Beneficiary Name keyword analysis (Merchant database check)
  if (normBeneficiary) {
    for (const merchantEntry of KNOWN_MERCHANTS) {
      for (const kw of merchantEntry.keywords) {
        const normKw = normalizeText(kw);
        if (normBeneficiary.includes(normKw)) {
          const matched = matchCategoryByHint(merchantEntry.categoryHint, categories);
          if (matched) {
            return {
              categoryId: matched.id,
              categoryName: matched.name,
              confidence: 0.88,
              source: 'BENEFICIARY_KEYWORD',
              isMerchant: true,
              matchedKeyword: kw
            };
          }
        }
      }
    }
  }

  // PRIORITY 4: Transfer description keyword analysis
  if (normDesc) {
    for (const merchantEntry of KNOWN_MERCHANTS) {
      for (const kw of merchantEntry.keywords) {
        const normKw = normalizeText(kw);
        if (normDesc.includes(normKw)) {
          const matched = matchCategoryByHint(merchantEntry.categoryHint, categories);
          if (matched) {
            return {
              categoryId: matched.id,
              categoryName: matched.name,
              confidence: 0.80,
              source: 'DESCRIPTION_KEYWORD',
              isMerchant: false, // Could be personal transfer for food
              matchedKeyword: kw
            };
          }
        }
      }
    }
  }

  // PRIORITY 5: Fallback
  return {
    categoryId: fallbackCat.id,
    categoryName: fallbackCat.name,
    confidence: 0.40,
    source: 'FALLBACK',
    isMerchant: false
  };
}
