import { format, subDays, addDays, startOfWeek } from 'date-fns';
import type { Category, Account, TxType, Transaction } from '../types';
import { todayKey } from './finance';

export interface ParsedTransactionResult {
  raw: string;
  name: string;
  amount: number;
  type: TxType;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  date: string;
  note?: string;
  confidence: number;
  explanation: string;
  isDuplicatePossible?: boolean;
  duplicateWarning?: string;
  matchedStrAmount?: string;
  matchedStrDate?: string;
}

/**
 * Normalizes Vietnamese diacritics for flexible fuzzy token matching
 */
export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * 1. EXTRACT AMOUNT
 * Robust deterministic Vietnamese financial amount parser
 * Handles:
 * - 30k = 30.000
 * - 45 nghìn / ngàn = 45.000
 * - 350k = 350.000
 * - 1tr2 = 1.200.000
 * - 1tr5 = 1.500.000
 * - 2 triệu rưỡi = 2.500.000
 * - 1 triệu 200 nghìn = 1.200.000
 * - 250.000 = 250.000
 * - 1,500,000 = 1.500.000
 * - 1.500.000 = 1.500.000
 * - 500 nghìn = 500.000
 * - 15 triệu = 15.000.000
 * - 3 củ = 3.000.000
 * - 2 lít = 200.000
 */
export function extractAmount(text: string): { amount: number; matchedStr: string } {
  if (!text || !text.trim()) return { amount: 0, matchedStr: '' };
  const lower = text.toLowerCase().trim();

  // Pattern 0: "X triệu rưỡi" / "X tr rưỡi" (e.g. 2 triệu rưỡi -> 2.500.000, 1 tr rưỡi -> 1.500.000)
  const rưỡiRegex = /(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|củ)\s+rưỡi/i;
  const matchRưỡi = lower.match(rưỡiRegex);
  if (matchRưỡi) {
    const base = parseFloat(matchRưỡi[1].replace(',', '.'));
    if (!isNaN(base)) {
      const amount = Math.round((base + 0.5) * 1000000);
      return { amount, matchedStr: matchRưỡi[0].trim() };
    }
  }

  // Pattern 1: "X triệu Y nghìn" or "X tr Y k" (e.g. 1 triệu 200 nghìn -> 1.200.000)
  const compoundRegex = /(\d+)\s*(?:triệu|tr|củ)\s*(\d+)\s*(?:nghìn|ngàn|k)?/i;
  const matchCompound = lower.match(compoundRegex);
  if (matchCompound) {
    const millions = parseInt(matchCompound[1], 10);
    let thousands = parseInt(matchCompound[2], 10);
    // If user wrote "1 triệu 2" (meaning 1.2m), normalize 2 -> 200 or 200000
    if (thousands < 10) {
      thousands = thousands * 100; // 1tr2 -> 1tr + 200k
    } else if (thousands < 100) {
      thousands = thousands * 10;
    }
    const amount = millions * 1000000 + thousands * 1000;
    return { amount, matchedStr: matchCompound[0].trim() };
  }

  // Pattern 2: Young slang compacted format like "1tr2", "1tr5", "2tr8"
  const compactTrRegex = /(\d+)\s*(?:tr|củ)\s*(\d+)(?:\s|$|[.,;!])/i;
  const matchCompactTr = lower.match(compactTrRegex);
  if (matchCompactTr) {
    const millions = parseInt(matchCompactTr[1], 10);
    let remainder = parseInt(matchCompactTr[2], 10);
    if (remainder < 10) {
      remainder = remainder * 100000;
    } else if (remainder < 100) {
      remainder = remainder * 10000;
    } else if (remainder < 1000) {
      remainder = remainder * 1000;
    }
    const amount = millions * 1000000 + remainder;
    return { amount, matchedStr: matchCompactTr[0].trim() };
  }

  // Pattern 3: Explicit standard currency unit "30k", "70 nghìn", "1.5tr", "2.5 triệu", "15 triệu"
  const unitRegex = /(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn|tr|triệu|củ|lít|m|tỷ|vnd|đ|₫)(?:\s|$|[.,;!])/i;
  const matchUnit = lower.match(unitRegex);
  if (matchUnit) {
    const matchedStr = matchUnit[0].trim();
    const numPart = matchUnit[1].replace(',', '.');
    const unit = matchUnit[2].toLowerCase();
    const baseNum = parseFloat(numPart);

    if (!isNaN(baseNum)) {
      let amount = 0;
      if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn') {
        amount = Math.round(baseNum * 1000);
      } else if (unit === 'tr' || unit === 'triệu' || unit === 'củ' || unit === 'm') {
        amount = Math.round(baseNum * 1000000);
      } else if (unit === 'lít') {
        amount = Math.round(baseNum * 100000);
      } else if (unit === 'tỷ') {
        amount = Math.round(baseNum * 1000000000);
      } else if (unit === 'vnd' || unit === 'đ' || unit === '₫') {
        if (/\d+[.,]\d{3}/.test(matchUnit[1])) {
          amount = parseInt(matchUnit[1].replace(/[.,]/g, ''), 10);
        } else {
          amount = Math.round(baseNum);
        }
      }
      return { amount, matchedStr };
    }
  }

  // Pattern 4: Formatted digits with dot or comma thousands separators e.g. "1.500.000", "1,500,000", "250.000", "55.000"
  const thousandsSepRegex = /\b(\d{1,3}(?:[.,]\d{3})+)(?:\s*(?:đ|vnd|₫))?(?:\s|$|[.,;!])/i;
  const matchThousands = lower.match(thousandsSepRegex);
  if (matchThousands) {
    const rawDigits = matchThousands[1].replace(/[.,]/g, '');
    const amount = parseInt(rawDigits, 10);
    if (!isNaN(amount) && amount > 0) {
      return { amount, matchedStr: matchThousands[0].trim() };
    }
  }

  // Pattern 5: Plain number fallback e.g. "ăn trưa 45" -> 45.000
  const plainNumberRegex = /\b(\d+)\b(?:\s|$|[.,;!])/;
  const matchPlain = lower.match(plainNumberRegex);
  if (matchPlain) {
    const val = parseInt(matchPlain[1], 10);
    if (!isNaN(val) && val > 0) {
      // In Vietnamese daily expense context, numbers < 1000 like 45, 30, 100 almost always mean 45k, 30k
      const amount = val < 1000 ? val * 1000 : val;
      return { amount, matchedStr: matchPlain[0].trim() };
    }
  }

  return { amount: 0, matchedStr: '' };
}

/**
 * 2. EXTRACT TRANSACTION DATE
 * Recognizes relative and calendar dates in Vietnamese
 * - "hôm nay"
 * - "hôm qua"
 * - "hôm kia"
 * - "thứ hai tuần trước"
 * - "ngày 10", "mùng 10"
 * - "10/11", "10/11/2026"
 */
export function extractDate(text: string, refDate: Date = new Date()): { date: string; matchedStr: string } {
  const lower = text.toLowerCase();

  // "hôm nay"
  if (lower.includes('hôm nay')) {
    return { date: format(refDate, 'yyyy-MM-dd'), matchedStr: 'hôm nay' };
  }

  // "hôm qua"
  if (lower.includes('hôm qua')) {
    const d = subDays(refDate, 1);
    return { date: format(d, 'yyyy-MM-dd'), matchedStr: 'hôm qua' };
  }

  // "hôm kia"
  if (lower.includes('hôm kia')) {
    const d = subDays(refDate, 2);
    return { date: format(d, 'yyyy-MM-dd'), matchedStr: 'hôm kia' };
  }

  // "ngày mai"
  if (lower.includes('ngày mai')) {
    const d = addDays(refDate, 1);
    return { date: format(d, 'yyyy-MM-dd'), matchedStr: 'ngày mai' };
  }

  // "thứ [hai|ba|tư|năm|sáu|bảy|chủ nhật] tuần trước"
  const lastWeekMatch = lower.match(/thứ\s*(hai|ba|tư|bốn|năm|sáu|bảy|chủ\s*nhật)\s*tuần\s*trước/i);
  if (lastWeekMatch) {
    const dayName = lastWeekMatch[1].replace(/\s+/g, '');
    const dayMap: Record<string, number> = {
      hai: 1,
      ba: 2,
      tu: 3,
      bon: 3,
      nam: 4,
      sau: 5,
      bay: 6,
      chunhat: 0
    };
    const normDay = removeDiacritics(dayName);
    const targetDayIndex = dayMap[normDay] ?? 1;

    // Start of current week (Monday)
    const thisWeekStart = startOfWeek(refDate, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const offset = targetDayIndex === 0 ? 6 : targetDayIndex - 1;
    const targetDate = addDays(lastWeekStart, offset);
    return { date: format(targetDate, 'yyyy-MM-dd'), matchedStr: lastWeekMatch[0] };
  }

  // Explicit full date: "DD/MM/YYYY" or "DD-MM-YYYY"
  const fullDateMatch = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (fullDateMatch) {
    const day = parseInt(fullDateMatch[1], 10);
    const month = parseInt(fullDateMatch[2], 10);
    const year = parseInt(fullDateMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { date: formatted, matchedStr: fullDateMatch[0] };
    }
  }

  // Date without year: "DD/MM" or "DD-MM"
  const shortDateMatch = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/);
  if (shortDateMatch) {
    const day = parseInt(shortDateMatch[1], 10);
    const month = parseInt(shortDateMatch[2], 10);
    const year = refDate.getFullYear();
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { date: formatted, matchedStr: shortDateMatch[0] };
    }
  }

  // Day of month: "ngày 10", "mùng 10", "ngày 25"
  const dayMatch = lower.match(/(?:ngày|mùng)\s*(\d{1,2})\b/i);
  if (dayMatch) {
    const day = parseInt(dayMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const year = refDate.getFullYear();
      let month = refDate.getMonth() + 1;
      // If day is greater than today's day, it likely refers to previous month
      if (day > refDate.getDate() && month > 1) {
        month -= 1;
      }
      const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { date: formatted, matchedStr: dayMatch[0] };
    }
  }

  return { date: todayKey(), matchedStr: '' };
}

/**
 * 3. DETECT TRANSACTION TYPE & TRANSFER ACCOUNTS
 */
export function detectType(
  text: string,
  accounts: Account[] = []
): { type: TxType; fromAccountId?: string; toAccountId?: string } {
  const lower = text.toLowerCase();

  // Internal transfer detection: "chuyển 2 triệu từ VCB sang tiền mặt", "chuyển khoản từ ví sang bank"
  const transferMatch = lower.match(/chuyển(?:\s+khoản)?\s+.*(?:từ\s+(.+?)\s+)?sang\s+(.+?)(?:$|[.,;])/i);
  if (transferMatch || (lower.includes('chuyển') && lower.includes('sang'))) {
    let fromId: string | undefined;
    let toId: string | undefined;

    for (const acc of accounts) {
      const accName = acc.name.toLowerCase();
      if (lower.includes(`từ ${accName}`) || lower.includes(`từ ví ${accName}`)) {
        fromId = acc.id;
      }
      if (lower.includes(`sang ${accName}`) || lower.includes(`vào ${accName}`)) {
        toId = acc.id;
      }
    }

    // Keyword heuristics for bank / cash
    if (!fromId) {
      if (lower.includes('vcb') || lower.includes('vietcombank')) {
        fromId = accounts.find(a => a.name.toLowerCase().includes('vcb') || a.name.toLowerCase().includes('vietcombank') || a.id.toLowerCase().includes('vcb'))?.id;
      } else if (lower.includes('tiền mặt')) {
        fromId = accounts.find(a => a.type === 'cash')?.id;
      }
    }

    if (!toId) {
      if (lower.includes('tiền mặt')) {
        toId = accounts.find(a => a.type === 'cash')?.id;
      } else if (lower.includes('vcb') || lower.includes('vietcombank')) {
        toId = accounts.find(a => a.name.toLowerCase().includes('vcb') || a.name.toLowerCase().includes('vietcombank') || a.id.toLowerCase().includes('vcb'))?.id;
      }
    }

    return { type: 'transfer', fromAccountId: fromId, toAccountId: toId };
  }

  // Income keywords
  const incomeKeywords = [
    'lương',
    'nhận lương',
    'thưởng',
    'hoa hồng',
    'thu nhập',
    'tiền vào',
    'được cho',
    'bán đồ',
    'bán hàng',
    'lãi suất',
    'cổ tức',
    'hoàn tiền',
    'thu nợ',
    'được tặng'
  ];
  if (incomeKeywords.some(kw => lower.includes(kw))) {
    return { type: 'income' };
  }

  return { type: 'expense' };
}

export function matchesKeyword(text: string, kw: string): boolean {
  const normText = removeDiacritics(text);
  const normKw = removeDiacritics(kw);
  if (normKw.length <= 4) {
    const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s|[.,;!?-])${escaped}($|\\s|[.,;!?-])`, 'i');
    return regex.test(normText);
  }
  return normText.includes(normKw);
}

/**
 * 4. SMART CATEGORY SUGGESTION
 * Priority:
 * 1. User's own history matching merchant or title
 * 2. Deterministic keyword rules
 * 3. Most frequent category for that tx type
 * 4. Default category
 */
export function smartSuggestCategory(
  cleanText: string,
  categories: Category[],
  type: TxType,
  history: Transaction[] = []
): { categoryId: string; confidence: number; reason: string } {
  const normClean = removeDiacritics(cleanText);

  // 1. Check user transaction history (exact or substring match)
  if (history && history.length > 0) {
    const matchedHistory = history.filter(
      h => h.type === type && (normClean.includes(removeDiacritics(h.name)) || removeDiacritics(h.name).includes(normClean))
    );
    if (matchedHistory.length > 0) {
      // Pick most recent classification
      const latest = matchedHistory[0];
      const catExists = categories.find(c => c.id === latest.categoryId);
      if (catExists) {
        return {
          categoryId: latest.categoryId || catExists.id,
          confidence: 0.98,
          reason: `Lịch sử: bạn từng phân loại "${latest.name}" vào [${catExists.name}]`
        };
      }
    }
  }

  // 2. Deterministic dictionary rules (Longer, specific keywords prioritized first)
  const rules: { keywords: string[]; categoryId: string; boost?: number }[] = [
    // Transportation
    {
      keywords: [
        'đổ xăng',
        'bảo dưỡng xe',
        'cầu đường',
        'xanh sm',
        'gửi xe',
        'vé xe',
        'rửa xe',
        'sửa xe',
        'grab',
        'gojek',
        'taxi',
        'xăng',
        'bot',
        'be'
      ],
      categoryId: 'transport'
    },
    // Food & Dining
    {
      keywords: [
        'highlands',
        'starbucks',
        'trà sữa',
        'nhà hàng',
        'uống nước',
        'bánh mì',
        'cà phê',
        'lotteria',
        'mcdonalds',
        'ăn vặt',
        'pizza',
        'snack',
        'quán',
        'nướng',
        'cafe',
        'cơm',
        'phở',
        'bún',
        'lẩu',
        'bữa',
        'trưa',
        'sáng',
        'tối',
        'ăn'
      ],
      categoryId: 'food'
    },
    // Shopping
    {
      keywords: [
        'quần áo',
        'bách hóa xanh',
        'tiktok shop',
        'mỹ phẩm',
        'siêu thị',
        'vinmart',
        'winmart',
        'coopmart',
        'shopee',
        'lazada',
        'quần',
        'giày',
        'dép',
        'sách',
        'tiki',
        'chợ',
        'mua',
        'áo'
      ],
      categoryId: 'shopping'
    },
    // Bills & Utilities
    {
      keywords: [
        'tiền điện',
        'tiền nước',
        'hóa đơn',
        'điện thoại',
        'nạp thẻ',
        'internet',
        'chung cư',
        'tiền rác',
        'dịch vụ',
        'cước',
        'wifi',
        '4g'
      ],
      categoryId: 'bills'
    },
    // Housing
    {
      keywords: ['tiền nhà', 'tiền phòng', 'thuê nhà', 'sửa nhà', 'nội thất', 'trọ'],
      categoryId: 'housing'
    },
    // Health & Fitness
    {
      keywords: ['bảo hiểm y tế', 'bệnh viện', 'nha khoa', 'thể thao', 'vitamin', 'thuốc', 'khám', 'gym'],
      categoryId: 'health'
    },
    // Entertainment
    {
      keywords: ['vé máy bay', 'khách sạn', 'xem phim', 'spotify', 'netflix', 'du lịch', 'cinema', 'game', 'cgv'],
      categoryId: 'entertainment'
    },
    // Salary & Income
    {
      keywords: ['lương tháng', 'tạm ứng', 'phụ cấp', 'thưởng', 'lương'],
      categoryId: 'salary'
    },
    // Bonus & Extra Income
    {
      keywords: ['thưởng nóng', 'thu nhập phụ', 'hoa hồng', 'tiền tip', 'freelance', 'được biếu', 'bán đồ'],
      categoryId: 'bonus'
    }
  ];

  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (matchesKeyword(cleanText, kw)) {
        const found = categories.find(c => c.id === rule.categoryId || c.name.toLowerCase().includes(kw));
        if (found) {
          return {
            categoryId: found.id,
            confidence: 0.92,
            reason: `Khớp từ khóa "${kw}" với danh mục [${found.name}]`
          };
        }
      }
    }
  }

  // 3. Match category name directly
  for (const cat of categories) {
    if (normClean.includes(removeDiacritics(cat.name))) {
      return {
        categoryId: cat.id,
        confidence: 0.9,
        reason: `Trùng tên danh mục [${cat.name}]`
      };
    }
  }

  // 4. Fallback to first suitable category for type
  const fallbackCat = categories.find(c => (type === 'income' ? c.type === 'income' : c.type === 'expense')) || categories[0];
  return {
    categoryId: fallbackCat?.id || 'food',
    confidence: 0.5,
    reason: `Gợi ý mặc định [${fallbackCat?.name || 'Chung'}]`
  };
}

/**
 * 5. SMART ACCOUNT SUGGESTION
 */
export function smartSuggestAccount(
  text: string,
  accounts: Account[],
  history: Transaction[] = [],
  defaultAccountId?: string
): { accountId: string; confidence: number; reason: string } {
  const lower = text.toLowerCase();

  // 1. Text keyword match
  for (const acc of accounts) {
    if (lower.includes(acc.name.toLowerCase())) {
      return { accountId: acc.id, confidence: 0.99, reason: `Nhận diện tài khoản [${acc.name}] từ câu nhập` };
    }
  }

  if (lower.includes('vcb') || lower.includes('vietcombank')) {
    const acc = accounts.find(a => a.name.toLowerCase().includes('vcb') || a.name.toLowerCase().includes('vietcombank'));
    if (acc) return { accountId: acc.id, confidence: 0.95, reason: `Nhận diện ngân hàng Vietcombank` };
  }
  if (lower.includes('tcb') || lower.includes('techcombank')) {
    const acc = accounts.find(a => a.name.toLowerCase().includes('tcb') || a.name.toLowerCase().includes('techcombank'));
    if (acc) return { accountId: acc.id, confidence: 0.95, reason: `Nhận diện ngân hàng Techcombank` };
  }
  if (lower.includes('momo')) {
    const acc = accounts.find(a => a.name.toLowerCase().includes('momo') || a.type === 'ewallet');
    if (acc) return { accountId: acc.id, confidence: 0.95, reason: `Nhận diện ví MoMo` };
  }
  if (lower.includes('tiền mặt') || lower.includes('cash')) {
    const acc = accounts.find(a => a.type === 'cash');
    if (acc) return { accountId: acc.id, confidence: 0.95, reason: `Nhận diện thanh toán bằng tiền mặt` };
  }

  // 2. User history: Most frequently used account recently
  if (history && history.length > 0) {
    const counts: Record<string, number> = {};
    for (const h of history.slice(0, 20)) {
      counts[h.accountId] = (counts[h.accountId] || 0) + 1;
    }
    const topAccId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topAcc = accounts.find(a => a.id === topAccId);
    if (topAcc) {
      return { accountId: topAcc.id, confidence: 0.85, reason: `Tài khoản bạn sử dụng thường xuyên nhất [${topAcc.name}]` };
    }
  }

  // 3. Fallback to default account
  const fallback = accounts.find(a => a.id === defaultAccountId) || accounts[0];
  return {
    accountId: fallback?.id || 'bank',
    confidence: 0.6,
    reason: `Tài khoản mặc định [${fallback?.name || 'Tài khoản'}]`
  };
}

/**
 * 6. DETECT DUPLICATE TRANSACTION
 */
export function detectDuplicateTransaction(
  candidate: {
    amount: number;
    type: TxType;
    categoryId: string;
    accountId: string;
    date: string;
    name: string;
  },
  existingTransactions: Transaction[] = []
): { isDuplicate: boolean; matchedTx?: Transaction; message?: string } {
  if (!existingTransactions.length || candidate.amount <= 0) {
    return { isDuplicate: false };
  }

  const match = existingTransactions.find(t => {
    const isSameDate = t.date === candidate.date;
    const isSameAmount = Math.abs(t.amount - candidate.amount) < 1;
    const isSameType = t.type === candidate.type;
    const isSameAccount = t.accountId === candidate.accountId;
    const isSameCat = t.categoryId === candidate.categoryId;

    return isSameDate && isSameAmount && isSameType && (isSameAccount || isSameCat);
  });

  if (match) {
    return {
      isDuplicate: true,
      matchedTx: match,
      message: `Đã có giao dịch tương tự: "${match.name}" (${new Intl.NumberFormat('vi-VN').format(match.amount)} ₫) vào ngày ${match.date}. Bạn có muốn tiếp tục lưu?`
    };
  }

  return { isDuplicate: false };
}

/**
 * 7. COMPLETE NATURAL LANGUAGE QUICK ENTRY PARSER
 */
export function parseNaturalLanguageTransaction(
  input: string,
  options: {
    categories: Category[];
    accounts: Account[];
    history?: Transaction[];
    defaultAccountId?: string;
  }
): ParsedTransactionResult {
  const raw = input.trim();
  const { amount, matchedStr: matchedStrAmount } = extractAmount(raw);
  const { date, matchedStr: matchedStrDate } = extractDate(raw);
  const { type, fromAccountId, toAccountId } = detectType(raw, options.accounts);

  // Clean description by stripping recognized amount & date substrings
  let cleanName = raw;
  if (matchedStrAmount) {
    cleanName = cleanName.replace(matchedStrAmount, '');
  }
  if (matchedStrDate) {
    cleanName = cleanName.replace(matchedStrDate, '');
  }

  // Remove common prefix noise e.g. "chi", "thu", "chuyển", "vào ví", "bằng", "từ"
  cleanName = cleanName
    .replace(/\b(?:chuyển|tiền|chi|thu|bằng|từ|sang|qua|vào ví|ví)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If clean name became empty, provide intelligent fallback
  if (!cleanName || cleanName.length < 2) {
    cleanName = type === 'income' ? 'Thu nhập' : type === 'transfer' ? 'Chuyển tiền' : 'Chi tiêu';
  } else {
    // Capitalize first letter
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }

  // Category and Account suggestions
  const catSuggestion = smartSuggestCategory(cleanName, options.categories, type, options.history);
  const accSuggestion = smartSuggestAccount(raw, options.accounts, options.history, options.defaultAccountId);

  const finalAccountId = fromAccountId || accSuggestion.accountId;

  // Check duplicate
  const dupCheck = detectDuplicateTransaction(
    {
      amount,
      type,
      categoryId: catSuggestion.categoryId,
      accountId: finalAccountId,
      date,
      name: cleanName
    },
    options.history
  );

  const targetCategory = options.categories.find(c => c.id === catSuggestion.categoryId);
  const targetAccount = options.accounts.find(a => a.id === finalAccountId);

  return {
    raw,
    name: cleanName,
    amount,
    type,
    categoryId: catSuggestion.categoryId,
    accountId: finalAccountId,
    toAccountId,
    date,
    note: raw,
    confidence: catSuggestion.confidence,
    explanation: `${type === 'income' ? 'Thu nhập' : type === 'transfer' ? 'Chuyển tiền' : 'Chi tiêu'} "${cleanName}" ${new Intl.NumberFormat('vi-VN').format(amount)} ₫ vào [${targetCategory?.name || 'Mục chi'}], tài khoản [${targetAccount?.name || 'Ví'}]`,
    isDuplicatePossible: dupCheck.isDuplicate,
    duplicateWarning: dupCheck.message,
    matchedStrAmount,
    matchedStrDate
  };
}
