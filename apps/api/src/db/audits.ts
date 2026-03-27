import { Kysely } from 'kysely';
import type { Database } from '../types/database.js';
import type { ScoringResult } from '../scoring/types.js';
import type { AuditStatus } from '@repo/shared';
import { addDays } from '../utils/date.js';

const ANON_RETENTION_DAYS = 7;
const REGISTERED_RETENTION_DAYS = 30;

export async function createAuditRecord(
  db: Kysely<Database>,
  url: string,
  userId?: string | null
): Promise<string> {
  const retentionDays = userId
    ? REGISTERED_RETENTION_DAYS
    : ANON_RETENTION_DAYS;
  const result = await db
    .insertInto('audits')
    .values({
      url,
      status: 'pending',
      tier: 'free',
      geo_score: null,
      category_scores: null,
      findings: null,
      recommendations: null,
      expires_at: addDays(new Date(), retentionDays),
      user_id: userId ?? null,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return result.id;
}

export async function updateAuditStatus(
  db: Kysely<Database>,
  auditId: string,
  status: AuditStatus
): Promise<void> {
  await db
    .updateTable('audits')
    .set({ status })
    .where('id', '=', auditId)
    .execute();
}

export async function persistAuditResult(
  db: Kysely<Database>,
  auditId: string,
  result: ScoringResult
): Promise<void> {
  await db
    .updateTable('audits')
    .set({
      geo_score: result.score,
      category_scores: JSON.stringify(result.categoryScores),
      findings: JSON.stringify(result.findings),
      recommendations: JSON.stringify(result.recommendations),
    })
    .where('id', '=', auditId)
    .execute();
}

export async function getAuditById(db: Kysely<Database>, auditId: string) {
  const row = await db
    .selectFrom('audits')
    .select([
      'id',
      'url',
      'status',
      'tier',
      'geo_score',
      'category_scores',
      'findings',
      'recommendations',
      'expires_at',
      'user_id',
      'created_at',
    ])
    .where('id', '=', auditId)
    .executeTakeFirst();

  if (!row) return null;

  return {
    ...row,
    category_scores:
      typeof row.category_scores === 'string'
        ? JSON.parse(row.category_scores)
        : row.category_scores,
    findings:
      typeof row.findings === 'string'
        ? JSON.parse(row.findings)
        : row.findings,
    recommendations:
      typeof row.recommendations === 'string'
        ? JSON.parse(row.recommendations)
        : row.recommendations,
  };
}
