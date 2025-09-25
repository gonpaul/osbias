import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const RUN_SUFFIX = `${Date.now()}`;

async function api(ctx: APIRequestContext, method: 'GET'|'POST', path: string, body?: any) {
  const url = `${BASE_URL}/api${path}`;
  const res = await ctx.fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    data: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function register(ctx: APIRequestContext, name: string, email: string, password: string) {
  const res = await api(ctx, 'POST', '/auth/register', { name, email, password });
  return res;
}

async function login(ctx: APIRequestContext, email: string, password: string) {
  const res = await api(ctx, 'POST', '/auth/login', { email, password });
  return res;
}

async function me(ctx: APIRequestContext) {
  const res = await api(ctx, 'GET', '/auth/me');
  return res;
}

test.describe('Permissions & Authorization', () => {
  let anon: APIRequestContext;
  let admin: APIRequestContext;
  let userA: APIRequestContext;
  let userB: APIRequestContext;
  let userAId: number;
  let userBId: number;

  test.beforeAll(async ({ playwright }) => {
    anon = await pwRequest.newContext();
    admin = await pwRequest.newContext();
    userA = await pwRequest.newContext();
    userB = await pwRequest.newContext();

    // Admin login (seeded)
    let r = await login(admin, 'admin@osbias.local', 'Admin1234!');
    expect(r.status()).toBe(200);
    r = await me(admin);
    expect(r.status()).toBe(200);
    const adminJson = await r.json();
    expect(adminJson.role).toBe('admin');

    // Create user A
    const emailA = `userA_${Date.now()}@test.local`;
    r = await register(userA, 'User A', emailA, 'userApass!');
    expect(r.status()).toBe(201);
    r = await me(userA);
    expect(r.status()).toBe(200);
    const meA = await r.json();
    expect(meA.role).toBe('user');
    userAId = meA.id;

    // Create user B
    const emailB = `userB_${Date.now()}@test.local`;
    r = await register(userB, 'User B', emailB, 'userBpass!');
    expect(r.status()).toBe(201);
    r = await me(userB);
    expect(r.status()).toBe(200);
    const meB = await r.json();
    expect(meB.role).toBe('user');
    userBId = meB.id;
  });

  test('Unauthenticated requests return 401', async () => {
    const paths = [
      ['/journal', 'GET'],
      ['/journal', 'POST'],
      ['/beliefs', 'GET'],
      ['/beliefs', 'POST'],
      ['/goals', 'GET'],
      ['/goals', 'POST'],
      ['/frameworks', 'GET'],
      ['/frameworks', 'POST'],
    ] as const;
    for (const [p, m] of paths) {
      const res = await api(anon, m as any, p, m === 'POST' ? {} : undefined);
      expect(res.status()).toBe(401);
    }
  });

  test('User A ownership: GET/POST own journal/beliefs/goals', async () => {
    // GET no user_id defaults to self
    let r = await api(userA, 'GET', '/goals');
    expect(r.status()).toBe(200);

    // POST goal for self without user_id
    r = await api(userA, 'POST', '/goals', { title: 'A goal', status: 'planned' });
    expect(r.status()).toBe(201);
    const createdGoal = await r.json();
    expect(createdGoal.user_id).toBe(userAId);

    // POST journal without user_id
    r = await api(userA, 'POST', '/journal', { title: 'j', content: 'c' });
    expect(r.status()).toBe(201);
    const createdEntry = await r.json();
    expect(createdEntry.user_id).toBe(userAId);

    // POST belief without user_id
    r = await api(userA, 'POST', '/beliefs', { belief: 'b', confidence_level: 50 });
    expect(r.status()).toBe(201);
    const createdBelief = await r.json();
    expect(createdBelief.user_id).toBe(userAId);
  });

  test('Cross-user access: User A cannot access User B data', async () => {
    let r = await api(userA, 'GET', `/goals?user_id=${userBId}`);
    expect(r.status()).toBe(403);

    r = await api(userA, 'POST', '/goals', { user_id: userBId, title: 'x', status: 'planned' });
    expect(r.status()).toBe(403);

    r = await api(userA, 'GET', `/beliefs?user_id=${userBId}`);
    expect(r.status()).toBe(403);

    r = await api(userA, 'POST', '/beliefs', { user_id: userBId, belief: 'b', confidence_level: 10 });
    expect(r.status()).toBe(403);

    r = await api(userA, 'GET', `/journal?user_id=${userBId}`);
    expect(r.status()).toBe(403);

    r = await api(userA, 'POST', '/journal', { user_id: userBId, title: 'j', content: 'c' });
    expect(r.status()).toBe(403);
  });

  test('Frameworks: user cannot create system or null-user frameworks; can create own', async () => {
    // normal user can create personal framework (no user_id, is_system omitted)
    let r = await api(userA, 'POST', '/frameworks', { name: `Mine_${RUN_SUFFIX}`, description: 'd', concepts: ['a'] });
    expect(r.status()).toBe(201);
    let fw = await r.json();
    expect(fw.user_id).toBe(userAId);
    expect(fw.is_system).toBe(false);

    // forbidden: is_system=true
    r = await api(userA, 'POST', '/frameworks', { name: `Sys_${RUN_SUFFIX}`, description: 'd', concepts: ['a'], is_system: true });
    expect(r.status()).toBe(403);

    // forbidden: user_id null
    r = await api(userA, 'POST', '/frameworks', { user_id: null, name: `NullU_${RUN_SUFFIX}`, description: 'd', concepts: ['a'] });
    expect(r.status()).toBe(403);

    // forbidden: query others
    r = await api(userA, 'GET', `/frameworks?user_id=${userBId}`);
    expect(r.status()).toBe(403);
  });

  test('Admin: can GET/POST for any user; can create system frameworks', async () => {
    let r = await api(admin, 'GET', `/journal?user_id=${userAId}`);
    expect(r.status()).toBe(200);

    r = await api(admin, 'POST', '/journal', { user_id: userAId, title: 't', content: 'c' });
    expect(r.status()).toBe(201);

    r = await api(admin, 'GET', `/beliefs?user_id=${userBId}`);
    expect(r.status()).toBe(200);

    r = await api(admin, 'POST', '/beliefs', { user_id: userBId, belief: 'b', confidence_level: 60 });
    expect(r.status()).toBe(201);

    r = await api(admin, 'GET', `/goals?user_id=${userBId}`);
    expect(r.status()).toBe(200);

    r = await api(admin, 'POST', '/goals', { user_id: userBId, title: 'g', status: 'planned' });
    expect(r.status()).toBe(201);

    // Admin can create system framework with null user
    r = await api(admin, 'POST', '/frameworks', { user_id: null, name: `SYS_${RUN_SUFFIX}`, description: 'd', concepts: ['x'], is_system: true });
    expect(r.status()).toBe(201);

    // Admin can query frameworks for any user
    r = await api(admin, 'GET', `/frameworks?user_id=${userAId}`);
    expect(r.status()).toBe(200);
  });

  test('ID routes: user cannot delete others goal; admin can', async () => {
    // Create a goal for userB
    let r = await api(userB, 'POST', '/goals', { title: `GB_${RUN_SUFFIX}`, status: 'planned' });
    expect(r.status()).toBe(201);
    const created = await r.json();
    const goalId = created.id;

    // User A cannot delete User B's goal
    const delForbidden = await userA.fetch(`${BASE_URL}/api/goals/${goalId}`, { method: 'DELETE' });
    expect(delForbidden.status()).toBe(403);

    // Admin can delete User B's goal
    const delAdmin = await admin.fetch(`${BASE_URL}/api/goals/${goalId}`, { method: 'DELETE' });
    expect(delAdmin.status()).toBe(204);
  });
});


