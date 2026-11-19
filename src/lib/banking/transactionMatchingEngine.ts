/**
 * FINORA BANK TRANSACTION NOTIFICATION PARSER & MATCHING ENGINE
 *
 * Implements:
 * - On-device parsing of banking transaction push notifications.
 * - Precision matching against pending Payment Intents.
 * - Idempotency and duplicate suppression.
 * - Confidence scoring and automated state transitions.
 */

import type { PaymentIntent, Transaction, Account, Category } from '../../types';
import { todayKey, uid } from '../finance';

export interface IncomingBankNotification {
  id: string; // Notification unique ID or hash
  packageName: string;
  bankCode?: string;
  amount: number;
  currency: string;
  direction: 'IN' | 'OUT';
  timestamp: number; // Milliseconds
  referenceId?: string;
  recipientInfo?: string;
  description?: string;
  accountNumber?: string;
  balanceAfter?: number;
}

export interface MatchEvaluationResult {
  isMatch: boolean;
  confidenceScore: number; // 0.0 to 1.0
  intent?: PaymentIntent;
  decision: 'CONFIRMED' | 'REVIEW_REQUIRED' | 'UNMATCHED';
  reasons: string[];
}

/**
 * Fingerprint store to guarantee idempotency across multiple notification/webhook attempts
 */
const processedFingerprints = new Set<string>();

export function generateNotificationFingerprint(notification: IncomingBankNotification): string {
  const ref = notification.referenceId || `${notification.timestamp}_${notification.amount}`;
  return `${notification.bankCode || notification.packageName}_${notification.amount}_${notification.direction}_${ref}`;
}

export function isNotificationAlreadyProcessed(notification: IncomingBankNotification): boolean {
  const fp = generateNotificationFingerprint(notification);
  return processedFingerprints.has(fp);
}

export function markNotificationProcessed(notification: IncomingBankNotification): void {
  const fp = generateNotificationFingerprint(notification);
  processedFingerprints.add(fp);
  if (processedFingerprints.size > 1000) {
    const it = processedFingerprints.values();
    for (let i = 0; i < 200; i++) {
      const v = it.next().value;
      if (v) processedFingerprints.delete(v);
    }
  }
}

/**
 * Parses raw notification text on-device from popular Vietnamese banking apps
 */
export function parseBankNotificationText(
  packageName: string,
  title: string,
  text: string,
  timestamp = Date.now()
): IncomingBankNotification | null {
  const combined = `${title || ''} ${text || ''}`.trim();
  if (!combined) return null;

  // 1. Detect Direction: Check for debit / expense indicators
  // Vietnamese bank patterns for money out: -100,000; GD: -; Tru: ; Thanh toan: ; Rut tien: ; Chuyen khoan:
  const isDebit =
    combined.includes('-') ||
    /tr[uừ]\s*ti[eề]n/i.test(combined) ||
    /thanh\s*to[aá]n/i.test(combined) ||
    /chuy[eể]n\s*kho[aả]n/i.test(combined) ||
    /ph[ií]\s*d[iị]ch\s*v[uụ]/i.test(combined) ||
    /r[uú]t\s*ti[eề]n/i.test(combined);

  const isCredit =
    combined.includes('+') ||
    /c[oộ]ng\s*ti[eề]n/i.test(combined) ||
    /nh[aậ]n\s*ti[eề]n/i.test(combined);

  if (!isDebit && !isCredit) {
    return null; // Not a balance change notification
  }

  const direction: 'IN' | 'OUT' = isDebit ? 'OUT' : 'IN';

  // 2. Extract Amount
  // Matches: -150,000 VND; -150.000VND; 150000d; 150,000d
  const amountRegex = /(?:[-+]|\b)(?:[0-9]{1,3}[.,]){1,4}[0-9]{3}(?:\s*(?:VND|vnđ|d|đ))?/gi;
  const matches = combined.match(amountRegex);

  let amount = 0;
  if (matches && matches.length > 0) {
    // Find the first matching amount token
    for (const m of matches) {
      const cleanNum = m.replace(/[^0-9]/g, '');
      const val = parseInt(cleanNum, 10);
      if (!isNaN(val) && val > 0) {
        amount = val;
        break;
      }
    }
  }

  if (amount <= 0) return null;

  // 3. Extract Reference ID (Ref: 123456, Ma GD: 123456, FT23...)
  let referenceId: string | undefined;
  const refMatch = combined.match(/(?:ref|m[aã]\s*gd|s[oố]\s*gd|ft)[\s:]*([A-Za-z0-9_-]{5,20})/i);
  if (refMatch && refMatch[1]) {
    referenceId = refMatch[1].trim();
  }

  // 4. Extract Transfer Content / Description
  let description: string | undefined;
  const descMatch = combined.match(/(?:nd|n[oộ]i\s*dung|memo|ly\s*do)[\s:]*([^.]+?)(?:[\n.]|$)/i);
  if (descMatch && descMatch[1]) {
    description = descMatch[1].trim();
  }

  // 5. Extract Destination/Recipient Account if mentioned
  let recipientInfo: string | undefined;
  const recipMatch = combined.match(/(?:den|t[oớ]i|nguoi\s*nhan|stk)[\s:]*([0-9]{6,20})/i);
  if (recipMatch && recipMatch[1]) {
    recipientInfo = recipMatch[1].trim();
  }

  // Bank code derivation from package
  let bankCode = 'UNKNOWN';
  if (packageName.includes('vcbmobile')) bankCode = 'VCB';
  else if (packageName.includes('mbmobile')) bankCode = 'MB';
  else if (packageName.includes('techcombank')) bankCode = 'TCB';
  else if (packageName.includes('vietinbank')) bankCode = 'CTG';
  else if (packageName.includes('bidv')) bankCode = 'BIDV';
  else if (packageName.includes('vpbank')) bankCode = 'VPB';
  else if (packageName.includes('tpb')) bankCode = 'TPB';
  else if (packageName.includes('acb')) bankCode = 'ACB';
  else if (packageName.includes('mservice')) bankCode = 'MOMO';

  return {
    id: `notif_${timestamp}_${amount}`,
    packageName,
    bankCode,
    amount,
    currency: 'VND',
    direction,
    timestamp,
    referenceId,
    recipientInfo,
    description
  };
}

/**
 * Matches an incoming bank notification against currently pending payment intents
 */
export function matchBankNotificationWithPendingIntents(
  notification: IncomingBankNotification,
  pendingIntents: PaymentIntent[],
  timeWindowMs = 30 * 60 * 1000 // 30 minutes
): MatchEvaluationResult {
  const reasons: string[] = [];

  // Filter only candidate intents that are awaiting payment confirmation or recently scanned
  const candidates = pendingIntents.filter(intent =>
    ['SCANNED', 'PENDING_PAYMENT', 'AWAITING_CONFIRMATION', 'REVIEW_REQUIRED'].includes(intent.status)
  );

  if (candidates.length === 0) {
    return {
      isMatch: false,
      confidenceScore: 0,
      decision: 'UNMATCHED',
      reasons: ['Không có Payment Intent nào đang chờ xác nhận.']
    };
  }

  // Step 1: Filter by exact amount & Currency & Direction
  if (notification.direction !== 'OUT') {
    return {
      isMatch: false,
      confidenceScore: 0,
      decision: 'UNMATCHED',
      reasons: ['Biến động số dư là tiền vào (IN), không phải chi tiêu.']
    };
  }

  // Filter candidates where amount matches exactly (or if intent had no amount encoded)
  const exactAmountCandidates = candidates.filter(intent => {
    if (!intent.amount) return true; // Scan without amount can match notification amount
    return intent.amount === notification.amount;
  });

  if (exactAmountCandidates.length === 0) {
    return {
      isMatch: false,
      confidenceScore: 0,
      decision: 'UNMATCHED',
      reasons: [`Không tìm thấy giao dịch nào có số tiền khớp với ${notification.amount.toLocaleString('vi-VN')} ₫.`]
    };
  }

  // Step 2: Time proximity check
  const now = notification.timestamp;
  const timeFiltered = exactAmountCandidates.filter(intent => {
    const startedTime = intent.payment_started_at
      ? new Date(intent.payment_started_at).getTime()
      : new Date(intent.scanned_at).getTime();
    const diff = Math.abs(now - startedTime);
    return diff <= timeWindowMs;
  });

  if (timeFiltered.length === 0) {
    return {
      isMatch: false,
      confidenceScore: 0,
      decision: 'UNMATCHED',
      reasons: ['Giao dịch vượt quá cửa sổ thời gian 30 phút.']
    };
  }

  // Step 3: Check for ambiguity (multiple pending transactions with exact same amount)
  if (timeFiltered.length > 1) {
    // Check if one has strong distinguishing signals (Reference ID or Destination account)
    let bestCandidate: PaymentIntent | undefined;
    let highestExtraScore = -1;

    for (const intent of timeFiltered) {
      let extra = 0;
      if (
        notification.recipientInfo &&
        intent.destination_account.includes(notification.recipientInfo)
      ) {
        extra += 0.3;
      }
      if (
        notification.description &&
        intent.transfer_description &&
        notification.description.toLowerCase().includes(intent.transfer_description.toLowerCase())
      ) {
        extra += 0.3;
      }
      if (extra > highestExtraScore) {
        highestExtraScore = extra;
        bestCandidate = intent;
      }
    }

    if (highestExtraScore > 0 && bestCandidate) {
      return {
        isMatch: true,
        confidenceScore: 0.90,
        intent: bestCandidate,
        decision: 'CONFIRMED',
        reasons: ['Khớp số tiền và khớp chi tiết tài khoản/nội dung chuyển tiền trong danh sách giao dịch cùng giá trị.']
      };
    }

    // Multiple intents with same amount and no distinguishing signal -> REVIEW_REQUIRED
    return {
      isMatch: true,
      confidenceScore: 0.70,
      intent: timeFiltered[0],
      decision: 'REVIEW_REQUIRED',
      reasons: ['Phát hiện nhiều hơn 1 giao dịch đang chờ có cùng số tiền. Cần người dùng kiểm tra lại để tránh nhầm lẫn.']
    };
  }

  // Step 4: Single candidate - calculate fine-grained confidence
  const candidate = timeFiltered[0];
  let score = 0.40; // Base score for exact amount match
  reasons.push(`Khớp chính xác số tiền ${notification.amount.toLocaleString('vi-VN')} ₫ (+0.40)`);

  // Direction OUT
  if (notification.direction === 'OUT') {
    score += 0.20;
    reasons.push('Chiều giao dịch trừ tiền (OUT) (+0.20)');
  }

  // Time proximity
  const startedTime = candidate.payment_started_at
    ? new Date(candidate.payment_started_at).getTime()
    : new Date(candidate.scanned_at).getTime();
  const timeDiffMinutes = Math.abs(now - startedTime) / (60 * 1000);

  if (timeDiffMinutes <= 5) {
    score += 0.20;
    reasons.push(`Thời gian phát sinh rất gần (< 5 phút) (+0.20)`);
  } else if (timeDiffMinutes <= 15) {
    score += 0.15;
    reasons.push(`Thời gian phát sinh hợp lý (< 15 phút) (+0.15)`);
  } else {
    score += 0.10;
    reasons.push(`Thời gian phát sinh trong khoảng 15-30 phút (+0.10)`);
  }

  // Beneficiary / Account / Description match
  if (notification.recipientInfo && candidate.destination_account.includes(notification.recipientInfo)) {
    score += 0.10;
    reasons.push('Khớp số tài khoản thụ hưởng (+0.10)');
  }

  if (
    notification.description &&
    candidate.transfer_description &&
    notification.description.toLowerCase().includes(candidate.transfer_description.toLowerCase())
  ) {
    score += 0.10;
    reasons.push('Khớp nội dung chuyển tiền (+0.10)');
  }

  if (notification.referenceId) {
    score += 0.05;
    reasons.push('Có mã tham chiếu giao dịch ngân hàng (+0.05)');
  }

  // Clamp to max 1.0
  const finalScore = Math.min(1.0, score);
  const decision: 'CONFIRMED' | 'REVIEW_REQUIRED' | 'UNMATCHED' =
    finalScore >= 0.85 ? 'CONFIRMED' : finalScore >= 0.60 ? 'REVIEW_REQUIRED' : 'UNMATCHED';

  return {
    isMatch: decision !== 'UNMATCHED',
    confidenceScore: finalScore,
    intent: candidate,
    decision,
    reasons
  };
}

/**
 * Executes confirmation: updates the Payment Intent and ensures only ONE official transaction is recorded
 */
export function executePaymentIntentConfirmation(params: {
  intent: PaymentIntent;
  notification?: IncomingBankNotification;
  confirmationSource: 'NOTIFICATION_LISTENER' | 'OPEN_BANKING_WEBHOOK' | 'RECEIPT_OCR' | 'MANUAL_ONE_TAP';
  confidenceScore: number;
  accounts: Account[];
  categories: Category[];
  existingTransactions: Transaction[];
}): {
  updatedIntent: PaymentIntent;
  transaction: Transaction;
  isNewTransaction: boolean;
} {
  const {
    intent,
    notification,
    confirmationSource,
    confidenceScore,
    accounts,
    categories,
    existingTransactions
  } = params;

  const nowIso = new Date().toISOString();
  const txAmount = notification?.amount || intent.amount || 0;

  // Determine paying account: use selected_source_bank or first active account
  const sourceAccount =
    accounts.find(a => a.id === intent.selected_source_bank) ||
    accounts[0] ||
    { id: 'acc-default', name: 'Tài khoản chính' };

  // Determine category
  const categoryId =
    intent.predicted_category_id ||
    categories.find(c => c.type === 'expense')?.id ||
    'other';

  // Check if a transaction for this intent already exists (Idempotency)
  const existingTx = existingTransactions.find(
    t => t.paymentIntentId === intent.id || (intent.matched_transaction_id && t.id === intent.matched_transaction_id)
  );

  let targetTx: Transaction;
  let isNewTransaction = false;

  if (existingTx) {
    // Update existing transaction
    targetTx = {
      ...existingTx,
      amount: txAmount,
      status: 'completed',
      note: existingTx.note || intent.transfer_description || `Thanh toán VietQR ${intent.destination_bank}`,
      method: 'Chuyển khoản'
    };
  } else {
    // Insert brand new transaction
    isNewTransaction = true;
    targetTx = {
      id: uid(),
      name: intent.beneficiary_name || `Thanh toán ${intent.destination_bank}`,
      amount: txAmount,
      type: 'expense',
      categoryId,
      accountId: sourceAccount.id,
      date: intent.scanned_at ? intent.scanned_at.slice(0, 10) : todayKey(),
      method: 'Chuyển khoản',
      note: intent.transfer_description || `Chuyển khoản VietQR đến ${intent.destination_account} (${intent.destination_bank})`,
      status: 'completed',
      paymentIntentId: intent.id
    };
  }

  // Update original Intent
  const updatedIntent: PaymentIntent = {
    ...intent,
    amount: txAmount,
    status: 'CONFIRMED',
    confirmed_at: nowIso,
    confirmation_source: confirmationSource,
    matched_transaction_id: targetTx.id,
    confidence_score: confidenceScore
  };

  return {
    updatedIntent,
    transaction: targetTx,
    isNewTransaction
  };
}
