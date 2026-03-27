import { describe, it, expect } from 'vitest';
import { generateMagicToken, hashToken } from './magic-link.js';

describe('magic link token helpers', () => {
  it('generates a URL-safe base64 token of reasonable length', () => {
    const token = generateMagicToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThanOrEqual(40);
    // URL-safe base64: no +, /, = characters
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generates unique tokens on each call', () => {
    const a = generateMagicToken();
    const b = generateMagicToken();
    expect(a).not.toBe(b);
  });

  it('hashes the same token to the same value', () => {
    const token = generateMagicToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('produces a 64-char hex SHA-256 hash', () => {
    const token = generateMagicToken();
    const hash = hashToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
