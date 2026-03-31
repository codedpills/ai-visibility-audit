import { createHash } from 'node:crypto';
import type { Redis } from 'ioredis';
import type { Kysely } from 'kysely';
import type { Database } from '../types/database.js';
import { resetMonthlyCountIfNeeded } from '../db/users.js';

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; resetsAt: string };

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function thisMonthKey(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

/**
 * Checks the anonymous monthly rate limit using two independent Redis keys:
 * one keyed by the browser UUID (anon_id) and one by the SHA-256-truncated IP.
 * Either key hitting the limit on previous calls blocks the request.
 *
 * @param hashIpFn — injectable hasher for testing; defaults to the real SHA-256 impl
 */
export async function checkAnonLimit(
  redis: Redis,
  anonId: string,
  ip: string,
  hashIpFn: (ip: string) => string = hashIp,
  limit: number = 1
): Promise<RateLimitResult> {
  const month = thisMonthKey();
  const ipHash = hashIpFn(ip);
  const anonKey = `anon:monthly:${month}:id:${anonId}`;
  const ipKey = `anon:monthly:${month}:ip:${ipHash}`;
  const ttl = 32 * 24 * 60 * 60; // 32 days — safely covers any calendar month

  // Read current counts before incrementing
  const [anonCount, ipCount] = await Promise.all([
    redis.get(anonKey),
    redis.get(ipKey),
  ]);

  if (
    (anonCount && parseInt(anonCount) >= limit) ||
    (ipCount && parseInt(ipCount) >= limit)
  ) {
    const firstOfNextMonth = new Date();
    firstOfNextMonth.setUTCDate(1);
    firstOfNextMonth.setUTCMonth(firstOfNextMonth.getUTCMonth() + 1);
    firstOfNextMonth.setUTCHours(0, 0, 0, 0);
    return { allowed: false, resetsAt: firstOfNextMonth.toISOString() };
  }

  // Increment both keys
  await Promise.all([
    redis.incr(anonKey).then(() => redis.expire(anonKey, ttl)),
    redis.incr(ipKey).then(() => redis.expire(ipKey, ttl)),
  ]);

  return { allowed: true };
}

/**
 * Checks the registered-user monthly audit limit.
 * Performs a lazy monthly reset before checking the count.
 */
export async function checkRegisteredLimit(
  db: Kysely<Database>,
  userId: string,
  limit: number
): Promise<RateLimitResult> {
  await resetMonthlyCountIfNeeded(db, userId);

  const row = await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!row) {
    return { allowed: false, resetsAt: new Date().toISOString() };
  }

  if ((row.audits_this_month as number) >= limit) {
    const firstOfNextMonth = new Date();
    firstOfNextMonth.setDate(1);
    firstOfNextMonth.setMonth(firstOfNextMonth.getMonth() + 1);
    firstOfNextMonth.setHours(0, 0, 0, 0);
    return { allowed: false, resetsAt: firstOfNextMonth.toISOString() };
  }

  return { allowed: true };
}
