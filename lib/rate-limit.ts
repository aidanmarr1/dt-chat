// Shared rate limiter with automatic cleanup of expired entries

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  maxAttempts: number;
  windowMs: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const map = new Map<string, RateLimitEntry>();

  return function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = map.get(key);

    if (!entry || now > entry.resetAt) {
      if (entry) map.delete(key);
      // Prune expired entries if map grows too large
      if (map.size > 10_000) {
        for (const [k, v] of map) {
          if (now > v.resetAt) map.delete(k);
        }
      }
      map.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }

    entry.count++;
    return entry.count <= options.maxAttempts;
  };
}
