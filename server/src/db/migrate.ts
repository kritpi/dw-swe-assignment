import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

async function runMigrations() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      'postgres://postgres:postgres@localhost:5432/dw_swe_assignment',
  });

  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: './drizzle' });
  } finally {
    await pool.end();
  }
}

void runMigrations();
