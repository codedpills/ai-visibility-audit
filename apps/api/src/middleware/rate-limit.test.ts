import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAnonLimit, checkRegisteredLimit } from './rate-limit.js';

// Minimal Redis stub — tracks incr/get calls in memory
function makeRedis(initial: Record<string, number> = {}) {
  const store: Record<string, number> = { ...initial };
  return {
    incr: vi.fn(async (key: string) => {
      store[key] = (store[key] ?? 0) + 1;
      return store[key];
    }),
    expire: vi.fn(async () => 1),
    get: vi.fn(async (key: string) => store[key]?.toString() ?? null),
  };
}

// Minimal DB stub
function makeDb(user: Record<string, unknown> | null) {
  // Build a chainable where clause that supports multiple .where() calls
  const whereChain = {
    where: () => whereChain,
    execute: async () => {},
    executeTakeFirst: async () => user,
  };

  return {
    selectFrom: () => ({
      selectAll: () => ({
        where: () => ({
          executeTakeFirst: async () => user,
        }),
      }),
    }),
    updateTable: () => ({
      set: () => whereChain,
    }),
  };
}

describe('rate-limit', () => {
  describe('checkAnonLimit', () => {
    it('allows the first request for a new anon ID', async () => {
      const redis = makeRedis();
      const result = await checkAnonLimit(redis as never, 'anon-1', '1.2.3.4');
      expect(result.allowed).toBe(true);
    });

    it('blocks a second request on the same day for the same anon ID', async () => {
      const redis = makeRedis();
      await checkAnonLimit(redis as never, 'anon-1', '1.2.3.4');
      const result = await checkAnonLimit(redis as never, 'anon-1', '1.2.3.4');
      expect(result.allowed).toBe(false);
    });

    it('blocks when IP has already used its daily limit', async () => {
      // Simulate IP already at 1, but new anonId
      const today = new Date().toISOString().slice(0, 10);
      const ipHash = 'sha256ofip'; // will be computed inside; use same IP
      const redis = makeRedis({ [`anon:daily:${today}:ip:sha256ofip`]: 1 });
      // The function should compute the hash internally — we test via real IPs
      // by making the anon key fresh but IP already hit
      // (We test this via the incr returning > 1 path for ip key)
      const result = await checkAnonLimit(
        redis as never,
        'brand-new-anon',
        '1.2.3.4',
        () => ipHash
      );
      expect(result.allowed).toBe(false);
    });
  });

  describe('checkRegisteredLimit', () => {
    it('allows when user is under the monthly limit', async () => {
      const db = makeDb({
        id: 'u1',
        audits_this_month: 2,
        month_reset_at: new Date(),
      });
      const result = await checkRegisteredLimit(db as never, 'u1', 3);
      expect(result.allowed).toBe(true);
    });

    it('blocks when user has reached the monthly limit', async () => {
      const db = makeDb({
        id: 'u1',
        audits_this_month: 3,
        month_reset_at: new Date(),
      });
      const result = await checkRegisteredLimit(db as never, 'u1', 3);
      expect(result.allowed).toBe(false);
    });

    it('returns not allowed when user not found', async () => {
      const db = makeDb(null);
      const result = await checkRegisteredLimit(db as never, 'ghost', 3);
      expect(result.allowed).toBe(false);
    });
  });
});
