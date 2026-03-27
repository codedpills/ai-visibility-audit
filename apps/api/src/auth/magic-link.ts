import { randomBytes, createHash } from 'node:crypto';

/** Generates a cryptographically random, URL-safe base64 token. */
export function generateMagicToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Returns the SHA-256 hex digest of the given token. Store this, not the raw token. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
