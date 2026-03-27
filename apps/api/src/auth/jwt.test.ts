import { describe, it, expect } from 'vitest';
import { signJwt, verifyJwt } from './jwt.js';

const SECRET = 'test-secret-at-least-32-chars-long!!';

describe('JWT helpers', () => {
  it('signs a payload and verifies it back', async () => {
    const token = await signJwt({ sub: 'user-1', email: 'a@b.com' }, SECRET);
    expect(typeof token).toBe('string');
    const payload = await verifyJwt(token, SECRET);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.com');
  });

  it('throws when verified with the wrong secret', async () => {
    const token = await signJwt({ sub: 'user-1', email: 'a@b.com' }, SECRET);
    await expect(verifyJwt(token, 'wrong-secret')).rejects.toThrow();
  });

  it('throws for a malformed token', async () => {
    await expect(verifyJwt('not.a.jwt', SECRET)).rejects.toThrow();
  });
});
