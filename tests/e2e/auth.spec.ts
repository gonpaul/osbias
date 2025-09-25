import { test, expect } from '@playwright/test';

test('register, logout, login', async ({ page }) => {
  const email = `user${Date.now()}@example.com`;
  const password = 'pass1234';

  // Register
  await page.goto('/register');
  await page.getByLabel('Name').fill('Test User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();

  // Should land on home (authenticated)
  await expect(page).toHaveURL('/');

  // Verify session via API
  const meRes1 = await page.request.get('/api/auth/me');
  expect(meRes1.status()).toBe(200);

  // Logout
  await page.request.post('/api/auth/logout');
  await page.goto('/login'); // ensure redirected or at login

  // Verify unauthenticated
  const meRes2 = await page.request.get('/api/auth/me');
  expect(meRes2.status()).toBe(401);

  // Login
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /login/i }).click();

  // Authenticated again
  await expect(page).toHaveURL('/');
  const meRes3 = await page.request.get('/api/auth/me');
  expect(meRes3.status()).toBe(200);
});
