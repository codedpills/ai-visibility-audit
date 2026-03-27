import { sql, type Kysely, type Insertable } from 'kysely';
import type { Database } from '../types/database.js';

export type UserRow = {
  id: string;
  email: string;
  magic_link_token_hash: string | null;
  magic_link_expires_at: Date | null;
  audits_this_month: number;
  month_reset_at: Date;
  donated: boolean;
  donation_points: number;
  plan: 'free' | 'pro';
  created_at: Date;
};

/** Upserts a user by email; returns the row (existing or newly created). */
export async function upsertUser(
  db: Kysely<Database>,
  email: string
): Promise<UserRow> {
  const values: Insertable<Database['users']> = {
    email,
    audits_this_month: 0,
    month_reset_at: new Date(),
    donated: false,
    donation_points: 0,
    plan: 'free',
  };
  return db
    .insertInto('users')
    .values(values)
    .onConflict((oc) => oc.column('email').doUpdateSet({ email }))
    .returningAll()
    .executeTakeFirstOrThrow() as Promise<UserRow>;
}

export async function findUserByEmail(
  db: Kysely<Database>,
  email: string
): Promise<UserRow | null> {
  const row = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  return (row as UserRow | undefined) ?? null;
}

export async function findUserById(
  db: Kysely<Database>,
  id: string
): Promise<UserRow | null> {
  const row = await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
  return (row as UserRow | undefined) ?? null;
}

/** Saves a hashed magic link token for the given user. */
export async function saveMagicLink(
  db: Kysely<Database>,
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  await db
    .updateTable('users')
    .set({ magic_link_token_hash: tokenHash, magic_link_expires_at: expiresAt })
    .where('id', '=', userId)
    .execute();
}

/** Looks up a user by token hash; returns null if not found or expired. Nullifies token after use. */
export async function verifyMagicLink(
  db: Kysely<Database>,
  tokenHash: string
): Promise<UserRow | null> {
  const row = await db
    .selectFrom('users')
    .selectAll()
    .where('magic_link_token_hash', '=', tokenHash)
    .executeTakeFirst();

  if (!row) return null;
  const user = row as UserRow;
  if (!user.magic_link_expires_at || user.magic_link_expires_at < new Date()) {
    return null;
  }

  // Invalidate token after use
  await db
    .updateTable('users')
    .set({ magic_link_token_hash: null, magic_link_expires_at: null })
    .where('id', '=', user.id)
    .execute();

  return user;
}

/** Increments the monthly audit counter for a user. */
export async function incrementAuditCount(
  db: Kysely<Database>,
  userId: string
): Promise<void> {
  await db
    .updateTable('users')
    .set((eb) => ({
      audits_this_month: eb('audits_this_month', '+', 1),
    }))
    .where('id', '=', userId)
    .execute();
}

/**
 * Lazily resets the monthly audit counter if the stored month has rolled over.
 * Called at the start of each `POST /audits` request for authenticated users.
 */
export async function resetMonthlyCountIfNeeded(
  db: Kysely<Database>,
  userId: string
): Promise<void> {
  // Reset if month_reset_at < first day of the current month
  await db
    .updateTable('users')
    .set({
      audits_this_month: 0,
      month_reset_at: sql<Date>`date_trunc('month', current_date)::date`,
    })
    .where('id', '=', userId)
    .where(
      'month_reset_at',
      '<',
      sql<Date>`date_trunc('month', current_date)::date`
    )
    .execute();
}

/** Records a donation — increments points and sets donated flag. */
export async function recordDonation(
  db: Kysely<Database>,
  userId: string,
  points: number
): Promise<void> {
  await db
    .updateTable('users')
    .set((eb) => ({
      donated: true,
      donation_points: eb('donation_points', '+', points),
    }))
    .where('id', '=', userId)
    .execute();
}
