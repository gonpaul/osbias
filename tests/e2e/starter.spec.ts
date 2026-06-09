import { test, expect } from '@playwright/test';

test.describe('Starter chooser and placeholder behavior', () => {
  test('starter shows on first visit, placeholder hidden until dismissed', async ({ page }) => {
    const email = `starter${Date.now()}@example.com`;
    const password = 'pass1234';
    await page.goto('/en/register');
    await page.getByLabel('Name').fill('Starter Test');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/auth/register') && r.status() === 201,
        { timeout: 30_000 }
      ),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/en\/?$/, { timeout: 15_000 });

    // Expect hello/starter widget content to be visible (heading/button text from HelloWidget)
    await expect(page.getByText('Welcome to your new journal entry', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue Blank' })).toBeVisible();

    // Title input should exist; type a title
    const titleInput = page.getByPlaceholder('Title...');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('My First Note');

    // Screenshot: after typing title while starter is active
    await page.screenshot({
      path: 'test-results/starter-after-title.png',
      fullPage: true,
    });

    // Placeholder "Start writing here..." must NOT be visible while starter is active
    await expect(page.getByText('Start writing here...')).toHaveCount(0);

    // Dismiss starter
    await page.getByRole('button', { name: 'Continue Blank' }).click();

    // Screenshot: after dismissing starter
    await page.screenshot({
      path: 'test-results/starter-after-dismiss.png',
      fullPage: true,
    });

    // After dismissal, placeholder should appear when content empty
    await expect(page.getByText('Start writing here...')).toBeVisible();
  });
});
