import 'dotenv/config';
import { Kysely, Migrator, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import * as migration_001 from './2026_001_initial';
import * as migration_002 from './2026_002_users_auth_and_limits';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const db = new Kysely<Record<string, never>>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: databaseUrl }),
    }),
  });

  const runner = new Migrator({
    db,
    provider: {
      async getMigrations() {
        return {
          '2026_001_initial': migration_001,
          '2026_002_users_auth_and_limits': migration_002,
        };
      },
    },
  });

  const { error, results } = await runner.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✓  "${it.migrationName}" executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`✗  "${it.migrationName}" failed`);
    } else {
      console.log(`–  "${it.migrationName}" already applied`);
    }
  });

  if (!results || results.length === 0) {
    console.log('No pending migrations.');
  }

  if (error) {
    console.error('Migration failed:', error);
    await db.destroy();
    process.exit(1);
  }

  console.log('Done.');
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
