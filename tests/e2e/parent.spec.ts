import { test, expect } from '@playwright/test';

test.describe('Parent routes and signing', () => {
  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/parent/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login magic link has an email field and no password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /^magic link$/i }).click();

    await expect(page.locator('#magic-email')).toBeVisible();
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible();
    await expect(page.locator('input[name="password"]')).toHaveCount(0);
  });

  test('invalid public sign link explains the failure', async ({ page }) => {
    await page.goto(`/s/${'a'.repeat(32)}`);
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated parent cannot stay on teacher dashboard', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await expect(page).not.toHaveURL(/\/teacher\/dashboard$/);
    await expect(page).toHaveURL(/\/login/);
  });
});
