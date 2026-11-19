import { describe, it, expect } from 'vitest';
import {
  getEffectiveTier,
  hasFeatureAccess,
  checkTrialStatus
} from './subscriptionEngine';
import type { User } from '../types';

describe('Finora Monetization & Subscription Entitlements Engine', () => {
  const baseFreeUser: User = {
    id: 'user-free',
    name: 'Người dùng Free',
    email: 'free@finora.vn',
    currency: 'VND',
    financialMonthStart: 1,
    plan: 'free',
    subscription_status: 'free',
    streakCount: 0
  };

  const activeTrialUser: User = {
    ...baseFreeUser,
    id: 'user-trial',
    plan: 'free',
    subscription_status: 'trialing',
    trial_started_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    trial_ends_at: new Date(Date.now() + 25 * 86400000).toISOString()
  };

  const expiredTrialUser: User = {
    ...baseFreeUser,
    id: 'user-expired',
    plan: 'gold',
    subscription_status: 'expired',
    trial_ends_at: new Date(Date.now() - 2 * 86400000).toISOString()
  };

  const goldUser: User = {
    ...baseFreeUser,
    id: 'user-gold',
    plan: 'gold',
    subscription_status: 'active'
  };

  it('1. Determines effective tier correctly with trials and expirations', () => {
    expect(getEffectiveTier(baseFreeUser)).toBe('free');
    expect(getEffectiveTier(activeTrialUser)).toBe('gold');
    expect(getEffectiveTier(expiredTrialUser)).toBe('free');
    expect(getEffectiveTier(goldUser)).toBe('gold');
  });

  it('2. Enforces account count limit on Free tier', () => {
    // Free tier allows up to 2 accounts
    const check1 = hasFeatureAccess(baseFreeUser, 'unlimited_accounts', { currentAccountCount: 1 });
    expect(check1.allowed).toBe(true);

    const check2 = hasFeatureAccess(baseFreeUser, 'unlimited_accounts', { currentAccountCount: 2 });
    expect(check2.allowed).toBe(false);
    expect(check2.requiredPlan).toBe('pro');

    // Trial user has gold tier -> unlimited accounts
    const checkTrial = hasFeatureAccess(activeTrialUser, 'unlimited_accounts', { currentAccountCount: 5 });
    expect(checkTrial.allowed).toBe(true);
  });

  it('3. Gates advanced features (multi_currency, family_wallet, tax_engine)', () => {
    // Multi currency is blocked on Free, allowed on Pro/Gold
    expect(hasFeatureAccess(baseFreeUser, 'multi_currency').allowed).toBe(false);
    expect(hasFeatureAccess(goldUser, 'multi_currency').allowed).toBe(true);

    // Family wallet requires Gold
    expect(hasFeatureAccess(baseFreeUser, 'family_wallet').allowed).toBe(false);
    expect(hasFeatureAccess(baseFreeUser, 'family_wallet').requiredPlan).toBe('gold');
    expect(hasFeatureAccess(activeTrialUser, 'family_wallet').allowed).toBe(true);

    // Tax engine requires Gold
    expect(hasFeatureAccess(goldUser, 'tax_engine').allowed).toBe(true);
  });

  it('4. Checks trial days remaining and expired banner', () => {
    const trialStatus = checkTrialStatus(activeTrialUser);
    expect(trialStatus.isTrial).toBe(true);
    expect(trialStatus.isExpired).toBe(false);
    expect(trialStatus.daysRemaining).toBe(25);

    const expiredStatus = checkTrialStatus(expiredTrialUser);
    expect(expiredStatus.isTrial).toBe(true);
    expect(expiredStatus.isExpired).toBe(true);
    expect(expiredStatus.daysRemaining).toBe(0);
    expect(expiredStatus.bannerMessage).toContain('đã kết thúc');
  });
});
