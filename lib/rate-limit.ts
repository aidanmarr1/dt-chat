// Shared rate limiter with DB-backed storage for serverless persistence
import { client } from "@/lib/db";

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await client.execute(
    "CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)"
  );
  tableReady = true;
}

interface RateLimiterOptions {
  maxAttempts: number;
  windowMs: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  return async function checkRateLimit(key: string): Promise<boolean> {
    await ensureTable();
    const now = Date.now();
    const resetAt = now + options.windowMs;

    // Atomic upsert: INSERT or UPDATE in a single statement to prevent TOCTOU races
    await client.execute({
      sql: `INSERT INTO rate_limits (key, count, reset_at)
            VALUES (?, 1, ?)
            ON CONFLICT(key) DO UPDATE SET
              count = CASE WHEN reset_at < ? THEN 1 ELSE count + 1 END,
              reset_at = CASE WHEN reset_at < ? THEN ? ELSE reset_at END`,
      args: [key, resetAt, now, now, resetAt],
    });

    // Read back the current count
    const row = await client.execute({
      sql: "SELECT count FROM rate_limits WHERE key = ?",
      args: [key],
    });

    const count = Number(row.rows[0]?.count ?? 1);

    // Periodically prune expired entries (1% chance per request to avoid overhead)
    if (Math.random() < 0.01) {
      await client.execute({
        sql: "DELETE FROM rate_limits WHERE reset_at < ?",
        args: [now],
      });
    }

    return count <= options.maxAttempts;
  };
}
