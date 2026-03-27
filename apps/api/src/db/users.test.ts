import { describe, it, expect, beforeEach } from 'vitest';
import { Kysely, sql } from 'kysely';
import type { Database } from '../types/database.js';
import {
  upsertUser,
  findUserByEmail,
  incrementAuditCount,
  resetMonthlyCountIfNeeded,
} from './users.js';

// We use a real DB cast (Kysely<Database>) — tests call the real helpers
// but the DB is injected so tests remain fast with a real local Postgres.
// The test assertions focus on behavior through the public interface only.

// For unit tests without a real DB — use a minimal in-memory stub
function makeDb(rows: Array<Record<string, unknown>> = []): Kysely<Database> {
  const store = [...rows];

  return {
    selectFrom: (table: string) => ({
      selectAll: () => ({
        where: (_col: string, _op: string, _val: unknown) => ({
          executeTakeFirst: async () =>
            store.find((r) => {
              if (_col === 'email') return r.email === _val;
              if (_col === 'id') return r.id === _val;
              return false;
            }) ?? null,
        }),
      }),
    }),
    insertInto: (_table: string) => ({
      values: (values: Record<string, unknown>) => ({
        onConflict: (_cbOrSpec: unknown) => ({
          // In real Kysely: insertInto().values().onConflict(cb).returningAll()
          // returningAll is on the object returned by onConflict(), not inside doUpdateSet
          returningAll: () => ({
            executeTakeFirstOrThrow: async () => {
              const existing = store.find((r) => r.email === values.email);
              if (existing) return existing;
              const row = { id: 'uuid-' + store.length, ...values };
              store.push(row);
              return row;
            },
          }),
        }),
      }),
    }),
    updateTable: (_table: string) => ({
      set: (updates: Record<string, unknown>) => ({
        where: (_col: string, _op: string, _val: unknown) => ({
          execute: async () => {
            const row = store.find((r) => r.id === _val);
            if (row) Object.assign(row, updates);
          },
        }),
      }),
    }),
  } as unknown as Kysely<Database>;
}

describe('db/users', () => {
  it('upsertUser creates a new user when email not seen before', async () => {
    const db = makeDb();
    const user = await upsertUser(db, 'new@example.com');
    expect(user.email).toBe('new@example.com');
    expect(user.id).toBeDefined();
  });

  it('upsertUser returns the existing user when email already exists', async () => {
    const existing = {
      id: 'existing-id',
      email: 'old@example.com',
      audits_this_month: 2,
      month_reset_at: new Date(),
      donated: false,
      donation_points: 0,
      plan: 'free',
      magic_link_token_hash: null,
      magic_link_expires_at: null,
      created_at: new Date(),
    };
    const db = makeDb([existing]);
    const user = await upsertUser(db, 'old@example.com');
    expect(user.id).toBe('existing-id');
  });

  it('findUserByEmail returns null when user not found', async () => {
    const db = makeDb();
    const user = await findUserByEmail(db, 'nope@example.com');
    expect(user).toBeNull();
  });

  it('findUserByEmail returns user when found', async () => {
    const row = {
      id: 'id-1',
      email: 'found@example.com',
      audits_this_month: 0,
      month_reset_at: new Date(),
      donated: false,
      donation_points: 0,
      plan: 'free',
      magic_link_token_hash: null,
      magic_link_expires_at: null,
      created_at: new Date(),
    };
    const db = makeDb([row]);
    const user = await findUserByEmail(db, 'found@example.com');
    expect(user?.id).toBe('id-1');
  });
});
