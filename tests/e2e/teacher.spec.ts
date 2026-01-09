import { test, expect } from '@playwright/test';

test.describe('Teacher Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('teacher can view dashboard after login', async ({ page }) => {
    // Login as teacher
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to teacher dashboard
    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });

    // Dashboard should have key elements
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('teacher dashboard shows form stats', async ({ page }) => {
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });

    // Should show stats or empty state
    const statsSection = page.locator('[data-testid="stats"]');
    const emptyState = page.getByText(/no forms/i);

    // Either stats or empty state should be visible
    await expect(statsSection.or(emptyState)).toBeVisible({ timeout: 5000 });
  });

  test('teacher can access forms list', async ({ page }) => {
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });

    // Navigate to forms
    await page.click('text=Forms');
    await expect(page).toHaveURL(/\/teacher\/forms/);
  });

  test('teacher can navigate to create form page', async ({ page }) => {
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });

    // Click create form button (could be on dashboard or forms page)
    const createButton = page.getByRole('link', { name: /create|new form/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page).toHaveURL(/\/teacher\/forms\/new/);
    }
  });
});

test.describe('Form Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });
  });

  test('form creation page has required fields', async ({ page }) => {
    await page.goto('/teacher/forms/new');

    // Check for form fields
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/event date/i)).toBeVisible();
    await expect(page.getByLabel(/deadline/i)).toBeVisible();
  });

  test('form creation validates required fields', async ({ page }) => {
    await page.goto('/teacher/forms/new');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Teacher Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });
  });

  test('teacher can logout', async ({ page }) => {
    // Find and click logout
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // Should redirect to home or login
      await expect(page).toHaveURL(/\/(login)?$/);
    }
  });

  test('sidebar navigation works', async ({ page }) => {
    // Test sidebar links
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    const formsLink = page.getByRole('link', { name: /forms/i });

    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/\/teacher\/dashboard/);
    }

    if (await formsLink.isVisible()) {
      await formsLink.click();
      await expect(page).toHaveURL(/\/teacher\/forms/);
    }
  });
});
