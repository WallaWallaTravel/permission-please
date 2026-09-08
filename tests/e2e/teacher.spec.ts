import { test, expect } from '@playwright/test';

test.describe('Teacher routes require invite-only sign-in', () => {
  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('create-form page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/teacher/forms/create');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login offers Google and no password field', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.locator('input[name="password"]')).toHaveCount(0);
  });
});
