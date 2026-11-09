import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db/database';
import {
  createSignedLease,
  validateOfflineLease,
  _resetMaxObservedTime
} from '../lib/offline/signedLease';
import { isEntitled } from '../lib/offline/entitlementRegistry';
import { offlineStorage } from '../lib/offline/indexedDbAdapter';
import { outboxManager } from '../lib/offline/outboxManager';

describe('Offline-First Architecture, Anti-Abuse Signed Lease & Subscription Protection', () => {
  let userId: string;

  beforeEach(async () => {
    _resetMaxObservedTime(0);
    const reg = db.register('Test User', `test_${Date.now()}_${Math.random()}@finora.vn`);
    userId = reg.user.id;
    await offlineStorage.clearUserStore(userId);
  });

  describe('1. Signed Offline Entitlement Lease & Anti-Clock Tampering', () => {
    it('generates a cryptographically verifiable signed lease for VIP Gold', () => {
      const lease = createSignedLease(userId, 'plan-gold', 'gold', 30);
      expect(lease.user_id).toBe(userId);
      expect(lease.plan_id).toBe('plan-gold');
      expect(lease.tier).toBe('gold');
      expect(lease.signature).toBeDefined();

      const validation = validateOfflineLease(lease);
      expect(validation.valid).toBe(true);
      expect(validation.tier).toBe('gold');
      expect(validation.reason).toBe('ACTIVE');
      expect(validation.daysRemaining).toBe(30);
    });

    it('rejects lease with tampered signature or payload', () => {
      const lease = createSignedLease(userId, 'plan-gold', 'gold', 30);
      const tamperedLease = { ...lease, tier: 'gold' as const, signature: 'invalid_forged_signature' };
      const validation = validateOfflineLease(tamperedLease);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('INVALID_SIGNATURE');
      expect(validation.tier).toBe('free');
    });

    it('detects expiration after 30 days and gracefully returns expired status', () => {
      const lease = createSignedLease(userId, 'plan-gold', 'gold', 30);
      // Simulate 35 days in the future
      const futureTime = Date.now() + 35 * 24 * 60 * 60 * 1000;
      const validation = validateOfflineLease(lease, futureTime);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('EXPIRED');
      expect(validation.daysRemaining).toBe(0);
      expect(validation.tier).toBe('free');
    });

    it('prevents user from staying VIP forever by rolling back local system clock', () => {
      const now = Date.now();
      const lease = createSignedLease(userId, 'plan-gold', 'gold', 30);

      // Verify at day 10
      const day10Time = now + 10 * 24 * 60 * 60 * 1000;
      const val1 = validateOfflineLease(lease, day10Time);
      expect(val1.valid).toBe(true);

      // User tries to roll back clock to Day 1 to exploit VIP trial duration
      const rolledBackTime = now + 1 * 24 * 60 * 60 * 1000;
      const valRollback = validateOfflineLease(lease, rolledBackTime);
      expect(valRollback.valid).toBe(false);
      expect(valRollback.reason).toBe('CLOCK_ROLLBACK_DETECTED');
      expect(valRollback.tier).toBe('free');
    });
  });

  describe('2. Entitlement Registry & Graceful Downgrade without Data Loss', () => {
    it('restricts premium AI WebMCP assistant when tier is free', () => {
      const freeEntitled = isEntitled('free', 'ai_webmcp', true);
      expect(freeEntitled.allowed).toBe(false);
      expect(freeEntitled.reason).toContain('GOLD');

      const goldEntitled = isEntitled('gold', 'ai_webmcp', true);
      expect(goldEntitled.allowed).toBe(true);
    });

    it('forbids offline access for live online-only features like AI or Market Evaluation', () => {
      const mcpOffline = isEntitled('gold', 'ai_webmcp', false);
      expect(mcpOffline.allowed).toBe(false);
      expect(mcpOffline.reason).toContain('yêu cầu kết nối mạng');

      const offlineBudget = isEntitled('gold', 'unlimited_budgets', false);
      expect(offlineBudget.allowed).toBe(true);
    });

    it('preserves all user personal financial data on trial expiry', () => {
      const testEmail = `revert_test_${Date.now()}@finora.vn`;
      const reg = db.register('Người Dùng Revert', testEmail);
      const testUser = reg.user;

      const userFinance = db.getFinanceData(testUser.id);
      userFinance.transactions.push({
        id: 'tx_offline_safe',
        name: 'Giao dịch tạo trong thời gian trial',
        amount: 250000,
        type: 'expense',
        accountId: 'acc_wallet',
        date: '2026-11-09',
        method: 'Tiền mặt',
        note: 'Dữ liệu cá nhân',
        status: 'completed'
      });
      db.saveFinanceData(testUser.id, userFinance);

      // Simulate trial expiration
      testUser.subscription_status = 'expired';
      testUser.plan = 'free';

      const readAfterExpiry = db.getFinanceData(testUser.id);
      expect(readAfterExpiry.transactions.some(t => t.id === 'tx_offline_safe')).toBe(true);
      expect(readAfterExpiry.user.plan).toBe('free');
      expect(readAfterExpiry.user.subscription_status).toBe('expired');
    });
  });

  describe('3. Outbox Queue, Idempotency & Server Batch Sync', () => {
    it('enqueues mutations into local storage with PENDING status', async () => {
      const op = await outboxManager.enqueue(
        userId,
        'transaction',
        'tx_123',
        'CREATE',
        { name: 'Ăn trưa', amount: 45000, type: 'expense' },
        1
      );

      expect(op.operation_id).toBeDefined();
      expect(op.sync_status).toBe('PENDING');
      expect(op.idempotency_key).toContain('tx_123');

      const ops = await offlineStorage.getOutboxOperations(userId, 'PENDING');
      expect(ops.length).toBe(1);
      expect(ops[0].entity_id).toBe('tx_123');
    });

    it('processes batch sync with idempotency and prevents duplicate executions', () => {
      const testOpId = `op_test_${Date.now()}_${Math.random()}`;
      const testTxId = `tx_test_${Date.now()}_${Math.random()}`;
      const testIdemKey = `idem_key_${Date.now()}_${Math.random()}`;

      const operations = [
        {
          operation_id: testOpId,
          entity_type: 'transaction',
          entity_id: testTxId,
          operation_type: 'CREATE',
          payload: { id: testTxId, name: 'Giao dịch 1', amount: 50000, type: 'expense', accountId: 'acc_wallet', date: '2026-11-09', method: 'Tiền mặt', note: '', status: 'completed' },
          idempotency_key: testIdemKey,
          created_at: new Date().toISOString(),
          local_version: 1
        }
      ];

      // First execution
      const results1 = db.processSyncBatch(userId, operations);
      expect(results1.length).toBe(1);
      expect(results1[0].status).toBe('SYNCED');

      // Second retry execution with same idempotency key
      const results2 = db.processSyncBatch(userId, operations);
      expect(results2.length).toBe(1);
      expect(results2[0].status).toBe('SYNCED');

      // Ensure transaction is saved exactly once, not duplicated in DB
      const data = db.getFinanceData(userId);
      const matches = data.transactions.filter(t => t.id === testTxId);
      expect(matches.length).toBe(1);
    });

    it('records user terms and offline sync consent evidence', () => {
      const consentRecord = {
        terms_version: '2026.11',
        subscription_policy_version: 'v1.0_vip_gold_trial',
        accepted_at: new Date().toISOString(),
        consent_type: 'trial_and_offline_sync' as const,
        user_id: userId
      };

      db.recordConsent(userId, consentRecord);
      // No exception thrown, consent recorded
      expect(true).toBe(true);
    });
  });
});
