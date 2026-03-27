import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<Record<string, never>>): Promise<void> {
  // Drop password-based auth column (unused going forward — magic link only)
  await db.schema.alterTable('users').dropColumn('password_hash').execute();

  // Add magic link auth columns
  await db.schema
    .alterTable('users')
    .addColumn('magic_link_token_hash', 'varchar(64)')
    .execute();
  await db.schema
    .alterTable('users')
    .addColumn('magic_link_expires_at', 'timestamptz')
    .execute();

  // Add rate limiting columns
  await db.schema
    .alterTable('users')
    .addColumn('audits_this_month', 'integer', (col) =>
      col.notNull().defaultTo(0)
    )
    .execute();
  await db.schema
    .alterTable('users')
    .addColumn('month_reset_at', 'date', (col) =>
      col.notNull().defaultTo(sql`current_date`)
    )
    .execute();

  // Add donation tracking columns
  await db.schema
    .alterTable('users')
    .addColumn('donated', 'boolean', (col) => col.notNull().defaultTo(false))
    .execute();
  await db.schema
    .alterTable('users')
    .addColumn('donation_points', 'integer', (col) =>
      col.notNull().defaultTo(0)
    )
    .execute();
}

export async function down(db: Kysely<Record<string, never>>): Promise<void> {
  await db.schema.alterTable('users').dropColumn('donation_points').execute();
  await db.schema.alterTable('users').dropColumn('donated').execute();
  await db.schema.alterTable('users').dropColumn('month_reset_at').execute();
  await db.schema.alterTable('users').dropColumn('audits_this_month').execute();
  await db.schema
    .alterTable('users')
    .dropColumn('magic_link_expires_at')
    .execute();
  await db.schema
    .alterTable('users')
    .dropColumn('magic_link_token_hash')
    .execute();
  await db.schema
    .alterTable('users')
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .execute();
}
