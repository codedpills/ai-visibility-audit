import { describe, it, expect, vi } from 'vitest';
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

    it('blocks a second request in the same month for the same anon ID', async () => {
      const redis = makeRedis();
      await checkAnonLimit(redis as never, 'anon-1', '1.2.3.4');
      const result = await checkAnonLimit(redis as never, 'anon-1', '1.2.3.4');
      expect(result.allowed).toBe(false);
    });

    it('blocks when IP has already used its monthly limit', async () => {
      // Simulate IP already at 1 for this month, but a new anonId
      const month = new Date().toISOString().slice(0, 7);
      const ipHash = 'sha256ofip';
      const redis = makeRedis({ [`anon:monthly:${month}:ip:sha256ofip`]: 1 });
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
