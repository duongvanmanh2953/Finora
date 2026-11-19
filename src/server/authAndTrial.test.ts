import { describe, it, expect } from 'vitest';
import { db } from './db/database';

describe('Finora Authentication, 30-Day VIP Gold Trial & Ownership Protection', () => {
  const testEmail = `user_test_${Date.now()}@finora.vn`;
  const testName = 'Lê Văn Kiểm Thử';

  it('1. Automatically grants 30-day VIP Gold trial upon user registration', () => {
    const result = db.register(testName, testEmail);

    expect(result.user).toBeDefined();
    expect(result.user.name).toBe(testName);
    expect(result.user.email).toBe(testEmail);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    // Verify VIP Gold tier & 30-day trial status
    expect(result.user.plan).toBe('gold');
    expect(result.user.subscription_status).toBe('trialing');
    expect(result.user.trial_started_at).toBeDefined();
    expect(result.user.trial_ends_at).toBeDefined();

    const startedAt = new Date(result.user.trial_started_at!).getTime();
    const endsAt = new Date(result.user.trial_ends_at!).getTime();
    const diffDays = Math.round((endsAt - startedAt) / (1000 * 86400));
    expect(diffDays).toBe(30);

    // Initial clean partition created
    const financeData = db.getFinanceData(result.user.id);
    expect(financeData).toBeDefined();
    expect(financeData.accounts.length).toBeGreaterThan(0);
    expect(financeData.user.id).toBe(result.user.id);
  });

  it('2. Authenticates registered user with persistent session and returns matching user profile', () => {
    const loginResult = db.login(testEmail);
    expect(loginResult.user.email).toBe(testEmail);
    expect(loginResult.accessToken).toBeDefined();

    const userByToken = db.getUserByToken(loginResult.accessToken);
    expect(userByToken).toBeDefined();
    expect(userByToken?.id).toBe(loginResult.user.id);
  });

  it('3. Auto-reverts to Free plan when 30-day trial expires without deleting any user data', () => {
    const expiredEmail = `expired_user_${Date.now()}@finora.vn`;
    const regResult = db.register('Người Dùng Hết Hạn', expiredEmail);
    const userId = regResult.user.id;

    // Simulate 31 days elapsed
    const pastDate = new Date(Date.now() - 31 * 86400 * 1000);
    regResult.user.trial_ends_at = pastDate.toISOString();

    // Add a custom transaction before trial expiration
    const initialData = db.getFinanceData(userId);
    initialData.transactions.push({
      id: 'tx_pre_expiry_test',
      name: 'Chi tiêu trước khi hết hạn',
      amount: 150000,
      type: 'expense',
      accountId: 'acc_wallet',
      date: '2026-10-01',
      method: 'Tiền mặt',
      note: 'Dữ liệu không bao giờ bị xóa',
      status: 'completed'
    });
    db.saveFinanceData(userId, initialData);

    // Retrieve data to trigger auto-expiry verification
    const refreshedData = db.getFinanceData(userId);

    // Plan should safely revert to free
    expect(refreshedData.user.plan).toBe('free');
    expect(refreshedData.user.subscription_status).toBe('expired');

    // Data retention verification: all transactions and accounts remain intact
    expect(refreshedData.transactions.some(tx => tx.id === 'tx_pre_expiry_test')).toBe(true);
    expect(refreshedData.accounts.length).toBe(initialData.accounts.length);
  });

  it('4. Enforces strict ownership protection: User A cannot mutate User B metadata', () => {
    const userA = db.register('User A', `userA_${Date.now()}@finora.vn`).user;
    const userB = db.register('User B', `userB_${Date.now()}@finora.vn`).user;

    const dataA = db.getFinanceData(userA.id);

    // Attempt malicious takeover by tampering with user ID in payload
    dataA.user.id = userB.id;
    dataA.user.plan = 'gold';

    // Saving under User A's ID must force ownership to stay with User A
    db.saveFinanceData(userA.id, dataA);

    const verifiedA = db.getFinanceData(userA.id);
    const verifiedB = db.getFinanceData(userB.id);

    expect(verifiedA.user.id).toBe(userA.id);
    expect(verifiedB.user.id).toBe(userB.id);
  });

  it('5. Admin operations: grantTrial successfully extends VIP Gold trial and logs audit entry', () => {
    const user = db.register('User C', `userC_${Date.now()}@finora.vn`).user;
    const updated = db.grantTrial(user.id, 30);

    expect(updated.plan).toBe('gold');
    expect(updated.subscription_status).toBe('trialing');

    const logs = db.getAuditLogs();
    expect(logs.some(l => l.action.includes('ADMIN_GRANT_30D_TRIAL'))).toBe(true);
  });

  it('6. Admin operations: toggleSuspend toggles suspension and blocks login for suspended account', () => {
    const user = db.register('User Suspended', `user_sus_${Date.now()}@finora.vn`).user;
    db.toggleSuspend(user.id);

    expect(() => db.login(user.email)).toThrowError(/tạm khóa/);

    // Un-suspend and verify login succeeds
    db.toggleSuspend(user.id);
    const res = db.login(user.email);
    expect(res.user.email).toBe(user.email);
  });

  it('7. 120-Day session refresh token rotation and token reuse detection', () => {
    const user = db.register('User Refresh Test', `refresh_${Date.now()}@tichsan.site`);
    const initialRefresh = user.refreshToken;

    // Normal rotation
    const rotated = db.rotateRefreshToken(initialRefresh, '127.0.0.1', 'Vitest');
    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(initialRefresh);

    // Reuse detection: Attempting to use initialRefresh again must throw and revoke session
    expect(() => db.rotateRefreshToken(initialRefresh, '127.0.0.1', 'Attacker')).toThrowError(/đã qua sử dụng/);
  });

  it('8. Server Admin CLI password rotation enforces 7-day cooldown', () => {
    const adminEmail = `admin_test_${Date.now()}@tichsan.site`;
    // First rotation succeeds
    const firstRotation = db.rotateAdminPassword('InitialPass123!@#', adminEmail);
    expect(firstRotation.admin.role).toBe('admin');
    expect(firstRotation.cooldownDays).toBe(7);

    // Immediate second rotation must fail due to 7-day cooldown
    expect(() => db.rotateAdminPassword('SecondPass456!@#', adminEmail)).toThrowError(/7 ngày/);
  });

  it('9. Logout completely revokes and deletes session & refresh tokens in database', () => {
    const email = `logout_test_${Date.now()}@tichsan.site`;
    const reg = db.register('Logout User', email);
    const accessToken = reg.accessToken;
    const refreshToken = reg.refreshToken;

    // Verify token can retrieve user
    expect(db.getUserByToken(accessToken)?.id).toBe(reg.user.id);

    // Call logout
    db.logout(accessToken, refreshToken, reg.user.id);

    // Verify accessToken no longer exists in DB sessions
    expect(db.getUserByToken(accessToken)).toBeNull();

    // Verify refreshToken cannot be rotated anymore
    expect(() => db.rotateRefreshToken(refreshToken, '127.0.0.1', 'Vitest')).toThrow();
  });

  it('10. Registration strictly checks duplicate email and prevents re-registering existing accounts', () => {
    const dupEmail = `dup_check_${Date.now()}@finora.vn`;
    expect(db.isEmailRegistered(dupEmail)).toBe(false);

    db.register('User Original', dupEmail, 'Password123');
    expect(db.isEmailRegistered(dupEmail)).toBe(true);

    // Attempting to register the same email must throw
    expect(() => db.register('User Impostor', dupEmail, 'AnotherPass123')).toThrowError(/đã được đăng ký/);
  });

  it('11. Newly registered users receive pristine empty finance data with zero fake transactions', () => {
    const freshEmail = `fresh_user_${Date.now()}@finora.vn`;
    const reg = db.register('Fresh User', freshEmail);
    const data = db.getFinanceData(reg.user.id);

    expect(data.transactions).toEqual([]);
    expect(data.budgets).toEqual([]);
    expect(data.goals).toEqual([]);
    expect(data.debts).toEqual([]);
    expect(data.investments).toEqual([]);
    expect(data.recurring).toEqual([]);
    expect(data.accounts.length).toBe(1);
    expect(data.accounts[0].openingBalance).toBe(0);
  });

  it('12. Login strictly rejects unregistered email without auto-provisioning demo accounts', () => {
    const unregEmail = `unregistered_${Date.now()}@finora.vn`;
    expect(() => db.login(unregEmail, 'AnyPassword123')).toThrowError(/chưa được đăng ký/);
  });

  it('13. OAuth login seamlessly logs in or registers without separate registration or email check', () => {
    const oauthEmail = `oauth_user_${Date.now()}@gmail.com`;
    // First time OAuth: should register and sign in in one shot
    const oauthResult = db.oauthLogin('Nguyễn Google', oauthEmail, 'google');
    expect(oauthResult.isNewUser).toBe(true);
    expect(oauthResult.user.email).toBe(oauthEmail);
    expect(oauthResult.user.emailVerified).toBe(true);
    expect(oauthResult.user.type_method_login).toBe('google');
    expect(oauthResult.accessToken).toBeDefined();

    // Verify clean data for OAuth user
    const data = db.getFinanceData(oauthResult.user.id);
    expect(data.accounts[0].openingBalance).toBe(0);
    expect(data.transactions).toEqual([]);
    expect(data.investments).toEqual([]);
    expect(data.debts).toEqual([]);

    // Subsequent OAuth login: should log in existing user seamlessly
    const loginAgain = db.oauthLogin('Nguyễn Google', oauthEmail, 'google');
    expect(loginAgain.isNewUser).toBe(false);
    expect(loginAgain.user.id).toBe(oauthResult.user.id);
    expect(loginAgain.user.emailVerified).toBe(true);
  });
});
