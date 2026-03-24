import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<Record<string, never>>): Promise<void> {
  // users
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('plan', 'varchar(10)', (col) => col.notNull().defaultTo('free'))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // audits
  await db.schema
    .createTable('audits')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('url', 'varchar(2048)', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) =>
      col.notNull().defaultTo('pending')
    )
    .addColumn('tier', 'varchar(10)', (col) => col.notNull().defaultTo('free'))
    .addColumn('geo_score', 'integer')
    .addColumn('category_scores', 'jsonb')
    .addColumn('findings', 'jsonb')
    .addColumn('recommendations', 'jsonb')
    .addColumn('expires_at', 'timestamptz')
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('set null')
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // audit_emails
  await db.schema
    .createTable('audit_emails')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('audit_id', 'uuid', (col) =>
      col.notNull().references('audits.id').onDelete('cascade')
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // index on audits.expires_at for expiry job efficiency
  await db.schema
    .createIndex('idx_audits_expires_at')
    .on('audits')
    .column('expires_at')
    .execute();
}

export async function down(db: Kysely<Record<string, never>>): Promise<void> {
  await db.schema.dropTable('audit_emails').execute();
  await db.schema.dropIndex('idx_audits_expires_at').execute();
  await db.schema.dropTable('audits').execute();
  await db.schema.dropTable('users').execute();
}
