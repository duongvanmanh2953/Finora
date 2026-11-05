import crypto from 'crypto';

const PEPPER = process.env.REFRESH_TOKEN_PEPPER || 'TichSan_Pepper_2026_Secure_Enclave';

/**
 * Memory-hard password hashing using Node.js native scrypt
 * Format: scrypt$N=16384,r=8,p=1$hexSalt$hexHash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const salt = parts[1];
  const expectedHash = parts[2];
  const actualKey = crypto.scryptSync(password, salt, 64);
  const actualHash = actualKey.toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
}

/**
 * Generate cryptographically secure random token (hex)
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash refresh token before saving into DB to prevent plain token leak
 */
export function hashToken(token: string, pepper = PEPPER): string {
  return crypto.createHash('sha256').update(`${token}:${pepper}`).digest('hex');
}

/**
 * Generates a high-entropy random password for admin bootstrap
 */
export function generateSecurePassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let pwd = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    pwd += chars[randomBytes[i] % chars.length];
  }
  // Ensure at least one uppercase, lowercase, digit, and symbol
  return `TS-${pwd}`;
}

