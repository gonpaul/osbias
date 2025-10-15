import { test, expect } from '@playwright/test';

test.describe('Starter chooser and placeholder behavior', () => {
  test('starter shows on first visit, placeholder hidden until dismissed', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('tu3@osbias.local');
    await page.getByLabel('Password').fill('testuser3');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('');

    // Screenshot: initial state with starter visible
    await page.screenshot({
      path: 'test-results/starter-initial.png',
      fullPage: true,
    });

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


