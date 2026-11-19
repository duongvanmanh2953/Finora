import { describe, it, expect } from 'vitest';
import {
  getTelegramBotStatus,
  generateTelegramPairingToken,
  verifyAndPairTelegramAccount,
  unlinkTelegramAccount,
  getLinkedUserByChatId,
  handleTelegramWebhook
} from './telegramBotAdapter';

describe('Finora Telegram Bot Webhook Integration Adapter', () => {
  it('1. Reports BLOCKED_MISSING_TOKEN status when token is missing', () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const status = getTelegramBotStatus();
    expect(status.status).toBe('BLOCKED_MISSING_TOKEN');
    expect(status.isConfigured).toBe(false);
  });

  it('2. Generates pairing code and binds Telegram account securely', () => {
    const userId = 'usr-test-123';
    const { pairingCode, botUrl } = generateTelegramPairingToken(userId);

    expect(pairingCode).toMatch(/^FN-\d{6}$/);
    expect(botUrl).toContain(pairingCode);

    // Verify pairing
    const chatId = 987654321;
    const pairResult = verifyAndPairTelegramAccount(pairingCode, chatId, 'test_user');
    expect(pairResult.success).toBe(true);
    expect(pairResult.userId).toBe(userId);

    // Check linked user
    const linked = getLinkedUserByChatId(chatId);
    expect(linked).toBeDefined();
    expect(linked?.userId).toBe(userId);

    // Unlink
    const unlinked = unlinkTelegramAccount(chatId);
    expect(unlinked).toBe(true);
    expect(getLinkedUserByChatId(chatId)).toBeUndefined();
  });

  it('3. Prevents duplicate webhook execution via update_id idempotency', async () => {
    const payload = {
      update_id: 10001,
      message: {
        message_id: 1,
        from: { id: 111, is_bot: false, first_name: 'John' },
        chat: { id: 111, type: 'private' },
        date: 1700000000,
        text: 'Chi 50k cafe'
      }
    };

    const firstRun = await handleTelegramWebhook(payload);
    expect(firstRun.handled).toBe(true);

    // Second run with identical update_id should be dropped
    const secondRun = await handleTelegramWebhook(payload);
    expect(secondRun.actionTaken).toBe('DROPPED_DUPLICATE');
  });
});
