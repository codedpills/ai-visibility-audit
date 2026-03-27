import { createHash } from 'node:crypto';
import type { Redis } from 'ioredis';
import type { Kysely } from 'kysely';
import type { Database } from '../types/database.js';
import { resetMonthlyCountIfNeeded } from '../db/users.js';

type RateLimitResult = { allowed: true } | { allowed: false; resetsAt: string };

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Checks the anonymous daily rate limit using two independent Redis keys:
 * one keyed by the browser UUID (anon_id) and one by the SHA-256-truncated IP.
 * Either key hitting 1 on previous calls blocks the request.
 *
 * @param hashIpFn — injectable hasher for testing; defaults to the real SHA-256 impl
 */
export async function checkAnonLimit(
  redis: Redis,
  anonId: string,
  ip: string,
  hashIpFn: (ip: string) => string = hashIp
): Promise<RateLimitResult> {
  const today = todayKey();
  const ipHash = hashIpFn(ip);
  const anonKey = `anon:daily:${today}:id:${anonId}`;
  const ipKey = `anon:daily:${today}:ip:${ipHash}`;
  const ttl = 48 * 60 * 60; // 48h so keys survive to next calendar day

  // Read current counts before incrementing
  const [anonCount, ipCount] = await Promise.all([
    redis.get(anonKey),
    redis.get(ipKey),
  ]);

  if (
    (anonCount && parseInt(anonCount) >= 1) ||
    (ipCount && parseInt(ipCount) >= 1)
  ) {
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    return { allowed: false, resetsAt: midnight.toISOString() };
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
