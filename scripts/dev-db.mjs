#!/usr/bin/env node
/**
 * PostgreSQL lokal untuk pengembangan.
 *
 * Skrip ini menjalankan PostgreSQL (embedded-postgres) pada port 55432 dengan
 * data tersimpan di ./.pgdata sehingga tidak memerlukan instalasi PostgreSQL
 * sistem maupun hak sudo. Berguna untuk mesin pengembangan, sandbox, atau CI.
 *
 * Pakai:
 *   npm run db:dev
 *
 * Untuk produksi gunakan database PostgreSQL terkelola (Neon, Supabase, RDS,
 * Vercel Postgres, dll) dan cukup atur DATABASE_URL pada environment.
 */
import EmbeddedPostgres from 'embedded-postgres';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), '.pgdata');
const PORT = Number(process.env.PG_PORT ?? 55432);
const USER = process.env.PG_USER ?? 'postgres';
const PASSWORD = process.env.PG_PASSWORD ?? 'postgres';
const DATABASE = process.env.PG_DATABASE ?? 'dimsum';

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
});

async function main() {
  const fresh = !fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'));
  if (fresh) {
    console.info('[db:dev] Menyiapkan cluster PostgreSQL baru di', DATA_DIR);
    await pg.initialise();
  }

  await pg.start();
  console.info(`[db:dev] PostgreSQL aktif di port ${PORT}`);

  try {
    await pg.createDatabase(DATABASE);
    console.info(`[db:dev] Database "${DATABASE}" dibuat.`);
  } catch {
    console.info(`[db:dev] Database "${DATABASE}" sudah ada.`);
  }

  const url = `postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}?schema=public`;
  console.info('[db:dev] DATABASE_URL =', url);
  console.info('[db:dev] Tekan Ctrl+C untuk menghentikan.');

  const shutdown = async () => {
    console.info('\n[db:dev] Menghentikan PostgreSQL...');
    try {
      await pg.stop();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(async (error) => {
  console.error('[db:dev] Gagal menjalankan PostgreSQL:', error);
  try {
    await pg.stop();
  } catch {
    /* abaikan */
  }
  process.exit(1);
});
