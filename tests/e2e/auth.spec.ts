import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /permission slips/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /start free trial/i })).toHaveCount(0);
  });

  test('login page is invite-only', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByText(/contact your school administrator/i)).toBeVisible();
    await expect(page.locator('input[name="password"]')).toHaveCount(0);
  });

  test('signup route does not exist', async ({ page }) => {
    const response = await page.goto('/signup');
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Protected Routes', () => {
  test('teacher dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/teacher/dashboard');

    await expect(page).toHaveURL(/\/login/);
  });

  test('parent dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/parent/dashboard');

    await expect(page).toHaveURL(/\/login/);
  });
});
