type Key = string;

const counters = new Map<Key, { count: number; resetAt: number }>();

export function rateLimitOk(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = counters.get(key);
  if (!bucket || now > bucket.resetAt) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count < limit) {
    bucket.count += 1;
    return true;
  }
  return false;
}

export function rateLimitRemaining(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = counters.get(key);
  if (!bucket || now > bucket.resetAt) return { remaining: limit - 1, resetIn: windowMs };
  return { remaining: Math.max(0, limit - bucket.count), resetIn: Math.max(0, bucket.resetAt - now) };
}


