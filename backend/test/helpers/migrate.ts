import migrationSql from "../../../migrations/0001_init.sql?raw";
import type { D1Database } from "@cloudflare/workers-types";

/**
 * Apply the schema to the test D1 binding. vitest-pool-workers gives each
 * test isolated storage, so this must run fresh every test (no memoized
 * "already applied" guard) rather than once per worker isolate.
 */
export async function ensureMigrated(db: D1Database): Promise<void> {
  // D1's exec() treats each newline as a statement boundary, so multi-line
  // CREATE TABLE statements must be collapsed to a single line first.
  const statements = migrationSql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join(" ")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await db.exec(stmt);
  }
}
