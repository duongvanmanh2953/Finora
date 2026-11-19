import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseVietQr,
  computeCrc16Ccitt,
  isDuplicateSessionScan
} from '../vietQrScanner';
import {
  classifyMerchantExpense,
  rememberMerchantCorrection
} from './merchantRecognitionEngine';
import {
  getBankAppById,
  createPaymentHandoffPlan
} from './bankAppRegistry';
import {
  parseBankNotificationText,
  matchBankNotificationWithPendingIntents,
  executePaymentIntentConfirmation,
  isNotificationAlreadyProcessed,
  markNotificationProcessed,
  type IncomingBankNotification
} from './transactionMatchingEngine';
import type { PaymentIntent, Category, Transaction, Account } from '../../types';

describe('FEATURE MODULE: SMART QR TRANSACTION & AUTOMATIC PAYMENT CONFIRMATION', () => {
  const mockCategories: Category[] = [
    { id: 'cat-food', name: 'Ăn uống & Cà phê', type: 'expense', color: '#10b981', icon: 'utensils', hidden: false },
    { id: 'cat-groceries', name: 'Đi chợ & Siêu thị', type: 'expense', color: '#f59e0b', icon: 'shopping-cart', hidden: false },
    { id: 'cat-transport', name: 'Di chuyển & Xăng xe', type: 'expense', color: '#3b82f6', icon: 'car', hidden: false },
    { id: 'cat-health', name: 'Thuốc men & Y tế', type: 'expense', color: '#ef4444', icon: 'heart', hidden: false },
    { id: 'cat-entertainment', name: 'Giải trí & Phim ảnh', type: 'expense', color: '#8b5cf6', icon: 'film', hidden: false },
    { id: 'cat-bills', name: 'Hóa đơn & Tiện ích', type: 'expense', color: '#6b7280', icon: 'file-text', hidden: false },
    { id: 'cat-other', name: 'Chi tiêu khác', type: 'expense', color: '#9ca3af', icon: 'more-horizontal', hidden: false }
  ];

  const mockAccounts: Account[] = [
    { id: 'acc-vcb', name: 'Vietcombank Digibank', type: 'bank', openingBalance: 50000000, color: '#10b981', createdAt: '2026-01-01', active: true },
    { id: 'acc-mb', name: 'MBBank Quân Đội', type: 'bank', openingBalance: 15000000, color: '#1039bb', createdAt: '2026-01-01', active: true }
  ];

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  // ===========================================================================
  // 1. PHASE QR-1: VietQR & EMVCo Parser with CRC16 Checksum
  // ===========================================================================
  describe('PHASE QR-1: VietQR Parser & CRC Checksum', () => {
    it('1.1. Computes correct CRC16-CCITT for EMVCo standard', () => {
      // Standard test string
      const testData = '0002010102126304';
      const crc = computeCrc16Ccitt(testData);
      expect(crc).toHaveLength(4);
      expect(/^[0-9A-F]{4}$/.test(crc)).toBe(true);
    });

    it('1.2. Parses Dynamic VietQR with amount and validates correct CRC', () => {
      // Construct dynamic VietQR payload:
      const payloadBase =
        '000201010212' +
        '38540010A00000072701240006970436011000110023450208QRIBFTTC' +
        '5303704' +
        '5406180000' + // 180,000 VND
        '5802VN' +
        '5916HIGHLANDS COFFEE' + // length 16
        '62160812Tien an trua' +
        '6304';

      const calculatedCrc = computeCrc16Ccitt(payloadBase);
      const fullQrPayload = payloadBase + calculatedCrc;

      const parsed = parseVietQr(fullQrPayload);

      expect(parsed.isValidVietQr).toBe(true);
      expect(parsed.qrType).toBe('VIETQR_DYNAMIC');
      expect(parsed.bankBin).toBe('970436');
      expect(parsed.bankShortName).toBe('VCB');
      expect(parsed.accountNumber).toBe('0011002345');
      expect(parsed.amount).toBe(180000);
      expect(parsed.accountName).toBe('HIGHLANDS COFFEE');
      expect(parsed.content).toBe('Tien an trua');
      expect(parsed.crcValid).toBe(true);
      expect(parsed.crcActual).toBe(calculatedCrc);
    });

    it('1.3. Parses Static VietQR without amount (does NOT invent/guess amount)', () => {
      const payloadBase =
        '000201010211' + // 11 = Static
        '38540010A00000072701240006970422011012345678900208QRIBFTTC' +
        '5303704' +
        '5802VN' +
        '5910TRAN VAN B' + // length 10
        '6304';

      const calculatedCrc = computeCrc16Ccitt(payloadBase);
      const fullQrPayload = payloadBase + calculatedCrc;

      const parsed = parseVietQr(fullQrPayload);

      expect(parsed.isValidVietQr).toBe(true);
      expect(parsed.qrType).toBe('VIETQR_STATIC');
      expect(parsed.bankBin).toBe('970422');
      expect(parsed.bankShortName).toBe('MB');
      expect(parsed.accountNumber).toBe('1234567890');
      // Crucial: Must NOT invent or guess missing amount
      expect(parsed.amount).toBeUndefined();
      expect(parsed.accountName).toBe('TRAN VAN B');
      expect(parsed.crcValid).toBe(true);
    });

    it('1.4. Detects checksum corruption / invalid CRC', () => {
      const payloadWithWrongCrc =
        '000201010212' +
        '38540010A00000072701240006970436011000110023450208QRIBFTTC' +
        '5303704' +
        '5406180000' +
        '5802VN' +
        '5918HIGHLANDS COFFEE' +
        '63040000'; // Wrong CRC

      const parsed = parseVietQr(payloadWithWrongCrc);
      expect(parsed.crcValid).toBe(false);
    });

    it('1.5. Distinguishes invoice/receipt QR from payment QR', () => {
      const invoicePayload = 'MST:0100109106|HD:0012345|NGAY:2026-11-19|TIEN:350000';
      const parsed = parseVietQr(invoicePayload);

      expect(parsed.isValidVietQr).toBe(false);
      expect(parsed.qrType).toBe('INVOICE_RECEIPT');
    });

    it('1.6. Deduplicates rapid duplicate scans within a session', () => {
      const payload = '00020101021238...';
      expect(isDuplicateSessionScan(payload, 3000)).toBe(false);
      // Immediately scan same payload again within 3000ms
      expect(isDuplicateSessionScan(payload, 3000)).toBe(true);
    });
  });

  // ===========================================================================
  // 2. PHASE QR-1.4: Smart Expense Classification (Merchant Recognition Engine)
  // ===========================================================================
  describe('PHASE QR-1: Smart Expense Classification Engine', () => {
    it('2.1. Recognizes food merchant from beneficiary name keyword', () => {
      const res = classifyMerchantExpense({
        beneficiaryName: 'CONG TY CP CA FE HIGHLANDS',
        transferDescription: 'Thanh toan tien nuoc',
        categories: mockCategories
      });

      expect(res.isMerchant).toBe(true);
      expect(res.categoryId).toBe('cat-food');
      expect(res.source).toBe('BENEFICIARY_KEYWORD');
      expect(res.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('2.2. Recognizes supermarket/grocery from merchant database', () => {
      const res = classifyMerchantExpense({
        beneficiaryName: 'WINMART VINCOM THAO DIEN',
        categories: mockCategories
      });

      expect(res.isMerchant).toBe(true);
      expect(res.categoryId).toBe('cat-groceries');
      expect(res.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('2.3. Recognizes gas station/transportation from description keyword', () => {
      const res = classifyMerchantExpense({
        beneficiaryName: 'NGUYEN VAN C',
        transferDescription: 'Do xang Petrolimex',
        categories: mockCategories
      });

      expect(res.categoryId).toBe('cat-transport');
      expect(res.source).toBe('DESCRIPTION_KEYWORD');
    });

    it('2.4. Priority 1: User rule overrides heuristic keyword rules', () => {
      // User remembered that "PETROLIMEX" should go to "bills" for their specific use-case
      rememberMerchantCorrection('PETROLIMEX', 'cat-bills', 'Hóa đơn');

      const res = classifyMerchantExpense({
        beneficiaryName: 'PETROLIMEX CH CUA HANG 12',
        categories: mockCategories
      });

      expect(res.categoryId).toBe('cat-bills');
      expect(res.source).toBe('USER_RULE');
      expect(res.confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('2.5. Priority 2: User past transaction history matches recipient', () => {
      const pastTransactions: Transaction[] = [
        {
          id: 'tx-old-1',
          name: 'TIEM THUOC PHARMACITY',
          amount: 85000,
          type: 'expense',
          categoryId: 'cat-health',
          accountId: 'acc-vcb',
          date: '2026-11-01',
          method: 'Chuyển khoản',
          note: 'Mua khau trang',
          status: 'completed'
        }
      ];

      const res = classifyMerchantExpense({
        beneficiaryName: 'TIEM THUOC PHARMACITY',
        categories: mockCategories,
        previousTransactions: pastTransactions
      });

      expect(res.categoryId).toBe('cat-health');
      expect(res.source).toBe('PREVIOUS_TRANSACTION');
    });
  });

  // ===========================================================================
  // 3. PHASE QR-2: Bank App Registry & Payment Handoff
  // ===========================================================================
  describe('PHASE QR-2: Bank App Registry & Payment Handoff', () => {
    it('3.1. Registry contains all top Vietnamese banks with package IDs and URL schemes', () => {
      const vcb = getBankAppById('vcb');
      expect(vcb).toBeDefined();
      expect(vcb?.androidPackageId).toBe('com.vcbmobile');
      expect(vcb?.iosUrlScheme).toBe('vcb://');

      const mb = getBankAppById('mb');
      expect(mb).toBeDefined();
      expect(mb?.androidPackageId).toBe('com.mbmobile');

      const tcb = getBankAppById('tcb');
      expect(tcb).toBeDefined();
      expect(tcb?.androidPackageId).toBe('vn.com.techcombank.bb.app');
    });

    it('3.2. Generates complete payment handoff plan with clipboard fallback', () => {
      const mockIntent: PaymentIntent = {
        id: 'intent-101',
        user_id: 'user-1',
        source_qr_payload: '000201...',
        destination_bank: 'Ngân hàng TMCP Ngoại thương Việt Nam (VCB)',
        destination_account: '0011002345678',
        beneficiary_name: 'CONG TY TNHH ABC',
        amount: 250000,
        currency: 'VND',
        transfer_description: 'Thanh toan don hang #998',
        predicted_category_id: 'cat-food',
        selected_source_bank: 'mb',
        scanned_at: new Date().toISOString(),
        payment_started_at: null,
        confirmed_at: null,
        status: 'SCANNED',
        confirmation_source: null,
        matched_transaction_id: null,
        confidence_score: null,
        qr_type: 'VIETQR_DYNAMIC'
      };

      const handoff = createPaymentHandoffPlan('mb', mockIntent);

      expect(handoff.bank.id).toBe('mb');
      expect(handoff.clipboardText).toContain('0011002345678');
      expect(handoff.clipboardText).toContain('250.000 ₫');
      expect(handoff.clipboardText).toContain('Thanh toan don hang #998');
      expect(handoff.canDirectLaunch).toBe(true);
    });
  });

  // ===========================================================================
  // 4. PHASE QR-3: Notification Parser, Matching Engine & Idempotency
  // ===========================================================================
  describe('PHASE QR-3: Automatic Payment Confirmation & Matching Engine', () => {
    it('4.1. Parses Vietnamese bank transaction push notification on-device', () => {
      const rawTitle = 'VCB Digibank';
      const rawText = 'Biến động số dư: TK 001100... GD: -250,000 VND lúc 19/11/2026 10:30. ND: Thanh toan don hang #998. Ref: FT2632349182';

      const parsed = parseBankNotificationText('com.vcbmobile', rawTitle, rawText);

      expect(parsed).not.toBeNull();
      expect(parsed?.direction).toBe('OUT');
      expect(parsed?.amount).toBe(250000);
      expect(parsed?.currency).toBe('VND');
      expect(parsed?.bankCode).toBe('VCB');
      expect(parsed?.referenceId).toBe('FT2632349182');
    });

    it('4.2. Automatically matches bank notification with pending Payment Intent (CONFIRMED)', () => {
      const now = Date.now();
      const mockPendingIntent: PaymentIntent = {
        id: 'intent-auto-1',
        user_id: 'user-1',
        source_qr_payload: '000201...',
        destination_bank: 'VCB',
        destination_account: '0011002345678',
        beneficiary_name: 'CONG TY TNHH ABC',
        amount: 250000,
        currency: 'VND',
        transfer_description: 'Thanh toan don hang #998',
        predicted_category_id: 'cat-food',
        selected_source_bank: 'vcb',
        scanned_at: new Date(now - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        payment_started_at: new Date(now - 1 * 60 * 1000).toISOString(),
        confirmed_at: null,
        status: 'AWAITING_CONFIRMATION',
        confirmation_source: null,
        matched_transaction_id: null,
        confidence_score: null,
        qr_type: 'VIETQR_DYNAMIC'
      };

      const notification: IncomingBankNotification = {
        id: 'notif-1',
        packageName: 'com.vcbmobile',
        bankCode: 'VCB',
        amount: 250000,
        currency: 'VND',
        direction: 'OUT',
        timestamp: now,
        referenceId: 'FT2632349182',
        description: 'Thanh toan don hang #998'
      };

      const evalResult = matchBankNotificationWithPendingIntents(
        notification,
        [mockPendingIntent],
        30 * 60 * 1000
      );

      expect(evalResult.isMatch).toBe(true);
      expect(evalResult.decision).toBe('CONFIRMED');
      expect(evalResult.confidenceScore).toBeGreaterThanOrEqual(0.85);
      expect(evalResult.intent?.id).toBe('intent-auto-1');
    });

    it('4.3. Ambiguity handling: multiple pending intents with exact same amount flag REVIEW_REQUIRED', () => {
      const now = Date.now();
      const intentA: PaymentIntent = {
        id: 'intent-ambig-1',
        user_id: 'user-1',
        source_qr_payload: '...',
        destination_bank: 'VCB',
        destination_account: '111111',
        beneficiary_name: 'Shop A',
        amount: 150000,
        currency: 'VND',
        transfer_description: null,
        predicted_category_id: 'cat-food',
        selected_source_bank: 'vcb',
        scanned_at: new Date(now - 3 * 60 * 1000).toISOString(),
        payment_started_at: null,
        confirmed_at: null,
        status: 'AWAITING_CONFIRMATION',
        confirmation_source: null,
        matched_transaction_id: null,
        confidence_score: null,
        qr_type: 'VIETQR_STATIC'
      };

      const intentB: PaymentIntent = {
        id: 'intent-ambig-2',
        user_id: 'user-1',
        source_qr_payload: '...',
        destination_bank: 'MB',
        destination_account: '222222',
        beneficiary_name: 'Shop B',
        amount: 150000,
        currency: 'VND',
        transfer_description: null,
        predicted_category_id: 'cat-groceries',
        selected_source_bank: 'vcb',
        scanned_at: new Date(now - 2 * 60 * 1000).toISOString(),
        payment_started_at: null,
        confirmed_at: null,
        status: 'AWAITING_CONFIRMATION',
        confirmation_source: null,
        matched_transaction_id: null,
        confidence_score: null,
        qr_type: 'VIETQR_STATIC'
      };

      const notification: IncomingBankNotification = {
        id: 'notif-ambig',
        packageName: 'com.vcbmobile',
        bankCode: 'VCB',
        amount: 150000,
        currency: 'VND',
        direction: 'OUT',
        timestamp: now
      };

      const evalResult = matchBankNotificationWithPendingIntents(
        notification,
        [intentA, intentB],
        30 * 60 * 1000
      );

      // Must NOT confirm blindly when multiple match!
      expect(evalResult.decision).toBe('REVIEW_REQUIRED');
      expect(evalResult.reasons.some(r => r.includes('cùng số tiền'))).toBe(true);
    });

    it('4.4. Idempotency: Prevents duplicate confirmation when duplicate notifications arrive', () => {
      const notification: IncomingBankNotification = {
        id: 'notif-dup-1',
        packageName: 'com.vcbmobile',
        bankCode: 'VCB',
        amount: 300000,
        currency: 'VND',
        direction: 'OUT',
        timestamp: 1700000000000,
        referenceId: 'REF_DUP_9999'
      };

      expect(isNotificationAlreadyProcessed(notification)).toBe(false);
      markNotificationProcessed(notification);
      expect(isNotificationAlreadyProcessed(notification)).toBe(true);
    });

    it('4.5. Execution updates existing Payment Intent rather than duplicating', () => {
      const mockIntent: PaymentIntent = {
        id: 'intent-exec-1',
        user_id: 'user-1',
        source_qr_payload: '...',
        destination_bank: 'VCB',
        destination_account: '0011002345',
        beneficiary_name: 'Highlands Coffee',
        amount: 85000,
        currency: 'VND',
        transfer_description: 'Ca phe sang',
        predicted_category_id: 'cat-food',
        selected_source_bank: 'acc-vcb',
        scanned_at: new Date().toISOString(),
        payment_started_at: new Date().toISOString(),
        confirmed_at: null,
        status: 'AWAITING_CONFIRMATION',
        confirmation_source: null,
        matched_transaction_id: null,
        confidence_score: null,
        qr_type: 'VIETQR_DYNAMIC'
      };

      const existingTransactions: Transaction[] = [];

      // Execute first confirmation
      const res1 = executePaymentIntentConfirmation({
        intent: mockIntent,
        confirmationSource: 'NOTIFICATION_LISTENER',
        confidenceScore: 0.95,
        accounts: mockAccounts,
        categories: mockCategories,
        existingTransactions
      });

      expect(res1.isNewTransaction).toBe(true);
      expect(res1.updatedIntent.status).toBe('CONFIRMED');
      expect(res1.updatedIntent.matched_transaction_id).toBe(res1.transaction.id);

      // Execute subsequent confirmation with the already created transaction present
      const res2 = executePaymentIntentConfirmation({
        intent: res1.updatedIntent,
        confirmationSource: 'NOTIFICATION_LISTENER',
        confidenceScore: 0.95,
        accounts: mockAccounts,
        categories: mockCategories,
        existingTransactions: [res1.transaction]
      });

      // Must NOT create duplicate transaction
      expect(res2.isNewTransaction).toBe(false);
      expect(res2.transaction.id).toBe(res1.transaction.id);
    });
  });
});
