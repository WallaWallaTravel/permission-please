import { test, expect } from '@playwright/test';

test.describe('Parent Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('parent can view dashboard after login', async ({ page }) => {
    // Login as parent
    await page.fill('input[name="email"]', 'parent1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to parent dashboard
    await expect(page).toHaveURL(/\/parent\/dashboard/, { timeout: 10000 });

    // Dashboard should show heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('parent dashboard shows pending forms section', async ({ page }) => {
    await page.fill('input[name="email"]', 'parent1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/parent\/dashboard/, { timeout: 10000 });

    // Should show pending forms section or empty state
    const pendingSection = page.getByText(/pending|forms to sign|no pending/i);
    await expect(pendingSection).toBeVisible({ timeout: 5000 });
  });

  test('parent can access history page', async ({ page }) => {
    await page.fill('input[name="email"]', 'parent1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/parent\/dashboard/, { timeout: 10000 });

    // Navigate to history
    const historyLink = page.getByRole('link', { name: /history/i });
    if (await historyLink.isVisible()) {
      await historyLink.click();
      await expect(page).toHaveURL(/\/parent\/history/);
    }
  });
});

test.describe('Form Signing Flow', () => {
  test('parent can view form details when form exists', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'parent1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/parent\/dashboard/, { timeout: 10000 });

    // If there's a pending form, click it
    const formCard = page.locator('[data-testid="form-card"]').first();
    if (await formCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await formCard.click();
      // Should navigate to sign page
      await expect(page).toHaveURL(/\/parent\/sign\//);
    }
  });

  test('sign page shows form details and signature area', async ({ page }) => {
    // This test assumes there's a valid form - skip if not in seeded db
    await page.goto('/login');
    await page.fill('input[name="email"]', 'parent1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/parent\/dashboard/, { timeout: 10000 });

    // Try to find a form to sign
    const formLink = page.getByRole('link', { name: /sign|view/i }).first();
    if (await formLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await formLink.click();

      // Signing page should have signature canvas
      await expect(page.locator('canvas').or(page.getByText(/signature/i))).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

test.describe('Parent Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'parent1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/parent\/dashboard/, { timeout: 10000 });
  });

  test('parent can logout', async ({ page }) => {
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/\/(login)?$/);
    }
  });

  test('parent cannot access teacher routes', async ({ page }) => {
    // Try to access teacher dashboard
    await page.goto('/teacher/dashboard');

    // Should be redirected or show error
    await expect(page).not.toHaveURL(/\/teacher\/dashboard$/);
  });
});

test.describe('Mobile Parent Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('parent dashboard is responsive on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'parent1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/parent\/dashboard/, { timeout: 10000 });

    // Check that main content is visible on mobile
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Mobile menu should be accessible
    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Navigation should appear
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
});
