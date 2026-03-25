import { describe, it, expect, vi } from 'vitest';
import { saveAuditEmail, deleteExpiredAudits } from './emails.js';
import type { Kysely } from 'kysely';
import type { Database } from '../types/database.js';

function makeDb() {
  const execute = vi.fn().mockResolvedValue([]);
  const whereInner = vi.fn().mockReturnValue({ execute });
  const whereOuter = vi.fn().mockReturnValue({ where: whereInner, execute });
  const deleteFrom = vi.fn().mockReturnValue({ where: whereOuter });

  const returningExecute = vi.fn().mockResolvedValue([]);
  const returning = vi.fn().mockReturnValue({ execute: returningExecute });
  const values = vi.fn().mockReturnValue({ returning, execute });
  const insertInto = vi.fn().mockReturnValue({ values });

  return { insertInto, deleteFrom } as unknown as Kysely<Database>;
}

describe('saveAuditEmail', () => {
  it('inserts a record into audit_emails', async () => {
    const db = makeDb();
    await saveAuditEmail(db, 'audit-123', 'user@example.com');
    expect(db.insertInto).toHaveBeenCalledWith('audit_emails');
  });
});

describe('deleteExpiredAudits', () => {
  it('deletes from audits table', async () => {
    const db = makeDb();
    await deleteExpiredAudits(db);
    expect(db.deleteFrom).toHaveBeenCalledWith('audits');
  });
});
