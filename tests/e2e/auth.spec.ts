import { test, expect } from '@playwright/test';

test('register, logout, login', async ({ page }) => {
  const email = `user${Date.now()}@example.com`;
  const password = 'pass1234';

  // Register — go to locale-prefixed path
  await page.goto('/en/register');
  await page.getByLabel('Name').fill('Test User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/auth/register') && r.status() === 201,
      { timeout: 30_000 }
    ),
    page.getByRole('button', { name: /create account/i }).click(),
  ]);

  // Should land on home (authenticated) — with locale prefix
  await expect(page).toHaveURL(/\/en\/?$/, { timeout: 15_000 });

  // Verify session via API
  const meRes1 = await page.request.get('/api/auth/me');
  expect(meRes1.status()).toBe(200);

  // Logout
  await page.request.post('/api/auth/logout');
  await page.goto('/en/login');

  // Verify unauthenticated
  const meRes2 = await page.request.get('/api/auth/me');
  expect(meRes2.status()).toBe(401);

  // Login
  await page.goto('/en/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /login/i }).click();

  // Authenticated again — with locale prefix
  await expect(page).toHaveURL(/\/en\/?$/, { timeout: 15_000 });
  const meRes3 = await page.request.get('/api/auth/me');
  expect(meRes3.status()).toBe(200);
});
