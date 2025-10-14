import db from '@/lib/db';
import type { User } from '@/models/user';

type CheckResult = { allowed: boolean; remaining: number; retryAfterMs?: number };

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_QUOTA = 50; // per 24h
const SCOPE_AI = 'ai';

function effectiveQuota(user: User): number {
  if (user.exempt_from_rate_limit) return Number.POSITIVE_INFINITY;
  if (typeof user.rate_limit_quota === 'number' && user.rate_limit_quota > 0) return user.rate_limit_quota;
  if (user.is_test_user) return DEFAULT_QUOTA; // same by default; could be lower
  return DEFAULT_QUOTA;
}

export async function checkAndConsume(user: User): Promise<CheckResult> {
  if (user.exempt_from_rate_limit) return { allowed: true, remaining: Number.MAX_SAFE_INTEGER };
  const quota = effectiveQuota(user);
  if (!Number.isFinite(quota)) return { allowed: true, remaining: Number.MAX_SAFE_INTEGER };
  const since = new Date(Date.now() - DAY_MS).toISOString();
  // Transaction to avoid race: insert first, then count and roll back if exceeded
  return await db.transaction(async (trx) => {
    await trx('request_logs').insert({ user_id: user.id, scope: SCOPE_AI });
    const countRow = await trx('request_logs')
      .where({ user_id: user.id, scope: SCOPE_AI })
      .andWhere('created_at', '>=', since)
      .count<{ cnt: number }>('id as cnt')
      .first();
    const used = Number((countRow?.cnt as unknown) ?? 0);
    if (used > quota) {
      // remove the just-added row: delete newest row for this user/scope in window
      const last = await trx('request_logs')
        .where({ user_id: user.id, scope: SCOPE_AI })
        .andWhere('created_at', '>=', since)
        .orderBy('created_at', 'desc')
        .first('id', 'created_at');
      if (last) {
        await trx('request_logs').where({ id: last.id }).del();
      }
      const oldest = await trx('request_logs')
        .where({ user_id: user.id, scope: SCOPE_AI })
        .andWhere('created_at', '>=', since)
        .orderBy('created_at', 'asc')
        .first('created_at');
      const oldestVal = oldest?.created_at as unknown;
      const oldestTs = oldestVal instanceof Date
        ? oldestVal.getTime()
        : new Date((oldestVal as string) || Date.now()).getTime();
      const retryAfterMs = Math.max(0, oldestTs + DAY_MS - Date.now());
      return { allowed: false, remaining: 0, retryAfterMs };
    }
    return { allowed: true, remaining: Math.max(0, quota - used) };
  });
}

export async function resetUserQuota(userId: number) {
  const since = new Date(Date.now() - DAY_MS).toISOString();
  await db('request_logs')
    .where({ user_id: userId, scope: SCOPE_AI })
    .andWhere('created_at', '>=', since)
    .del();
}

export async function getRemainingQuota(user: User): Promise<number> {
  if (user.exempt_from_rate_limit) return Number.MAX_SAFE_INTEGER;
  const quota = effectiveQuota(user);
  if (!Number.isFinite(quota)) return Number.MAX_SAFE_INTEGER;
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const countRow = await db('request_logs')
    .where({ user_id: user.id, scope: SCOPE_AI })
    .andWhere('created_at', '>=', since)
    .count<{ cnt: number }>('id as cnt')
    .first();
  const used = Number((countRow?.cnt as unknown) ?? 0);
  return Math.max(0, quota - used);
}

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


