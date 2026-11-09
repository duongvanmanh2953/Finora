import type { SignedLease } from './indexedDbAdapter';

const LEASE_SECRET = 'finora_vip_lease_secret_2026';
const MAX_TIME_KEY = 'finora:max_observed_server_time';
let inMemoryMaxObservedTime = 0;

export function _resetMaxObservedTime(time = 0) {
  inMemoryMaxObservedTime = time;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(MAX_TIME_KEY);
  }
}

/**
 * Deterministic signature generator for client & server verification
 */
export function generateLeaseSignature(
  userId: string,
  planId: string,
  tier: string,
  issuedAt: string,
  expiresAt: string
): string {
  const payload = `${userId}:${planId}:${tier}:${issuedAt}:${expiresAt}:${LEASE_SECRET}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sig_${Math.abs(hash).toString(36)}_${payload.length.toString(36)}`;
}

export interface LeaseValidationResult {
  valid: boolean;
  tier: 'free' | 'pro' | 'gold';
  reason?: 'ACTIVE' | 'EXPIRED' | 'CLOCK_ROLLBACK_DETECTED' | 'INVALID_SIGNATURE' | 'NO_LEASE';
  daysRemaining: number;
  expiresAt?: string;
}

/**
 * Validate lease with clock tampering detection (prevents rolling back system time to stay VIP forever)
 */
export function validateOfflineLease(lease: SignedLease | null, serverTimeNow?: number): LeaseValidationResult {
  if (!lease) {
    return { valid: false, tier: 'free', reason: 'NO_LEASE', daysRemaining: 0 };
  }

  // 1. Signature check
  const expectedSig = generateLeaseSignature(
    lease.user_id,
    lease.plan_id,
    lease.tier,
    lease.issued_at,
    lease.expires_at
  );
  if (lease.signature !== expectedSig) {
    return { valid: false, tier: 'free', reason: 'INVALID_SIGNATURE', daysRemaining: 0 };
  }

  const now = serverTimeNow || Date.now();

  // 2. Clock rollback & monotonic check
  try {
    const lastSavedTimeStr = typeof localStorage !== 'undefined' ? localStorage.getItem(MAX_TIME_KEY) : null;
    let maxObserved = lastSavedTimeStr ? parseInt(lastSavedTimeStr, 10) : inMemoryMaxObservedTime;
    const leaseVerifiedTime = new Date(lease.last_verified_server_time).getTime();
    if (leaseVerifiedTime > maxObserved) {
      maxObserved = leaseVerifiedTime;
    }

    // If client clock was rolled back by more than 60 seconds behind highest observed timestamp
    if (maxObserved > 0 && now < maxObserved - 60000) {
      return {
        valid: false,
        tier: 'free',
        reason: 'CLOCK_ROLLBACK_DETECTED',
        daysRemaining: 0,
        expiresAt: lease.expires_at
      };
    }

    // Monotonically advance observed time
    if (now > maxObserved) {
      inMemoryMaxObservedTime = now;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MAX_TIME_KEY, String(now));
      }
    }
  } catch {
    // Environment without localStorage
  }

  // 3. Expiration check
  const expiresAtMs = new Date(lease.expires_at).getTime();
  if (now > expiresAtMs) {
    return {
      valid: false,
      tier: 'free',
      reason: 'EXPIRED',
      daysRemaining: 0,
      expiresAt: lease.expires_at
    };
  }

  const diffMs = expiresAtMs - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    valid: true,
    tier: lease.tier,
    reason: 'ACTIVE',
    daysRemaining,
    expiresAt: lease.expires_at
  };
}

/**
 * Factory helper to issue a signed lease
 */
export function createSignedLease(
  userId: string,
  planId: string,
  tier: 'free' | 'pro' | 'gold',
  durationDays = 30
): SignedLease {
  const now = new Date();
  const expires = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const issuedAt = now.toISOString();
  const expiresAt = expires.toISOString();

  return {
    user_id: userId,
    plan_id: planId,
    tier,
    issued_at: issuedAt,
    expires_at: expiresAt,
    last_verified_server_time: issuedAt,
    signature: generateLeaseSignature(userId, planId, tier, issuedAt, expiresAt)
  };
}
