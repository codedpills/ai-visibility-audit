import { Kysely, sql } from 'kysely';
import type { Database } from '../types/database.js';

export async function saveAuditEmail(
  db: Kysely<Database>,
  auditId: string,
  email: string
): Promise<void> {
  await db
    .insertInto('audit_emails')
    .values({ audit_id: auditId, email })
    .execute();
}

export async function deleteExpiredAudits(db: Kysely<Database>): Promise<void> {
  await db
    .deleteFrom('audits')
    .where('tier', '=', 'free')
    .where('expires_at', '<', sql<Date>`now()`)
    .execute();
}
