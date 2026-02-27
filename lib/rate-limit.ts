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

    const row = await client.execute({
      sql: "SELECT count, reset_at FROM rate_limits WHERE key = ?",
      args: [key],
    });

    const entry = row.rows[0];

    if (!entry || now > Number(entry.reset_at)) {
      // New window — reset count to 1
      await client.execute({
        sql: "INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)",
        args: [key, now + options.windowMs],
      });
      // Periodically prune expired entries (1% chance per request to avoid overhead)
      if (Math.random() < 0.01) {
        await client.execute({
          sql: "DELETE FROM rate_limits WHERE reset_at < ?",
          args: [now],
        });
      }
      return true;
    }

    const newCount = Number(entry.count) + 1;
    await client.execute({
      sql: "UPDATE rate_limits SET count = ? WHERE key = ?",
      args: [newCount, key],
    });

    return newCount <= options.maxAttempts;
  };
}
