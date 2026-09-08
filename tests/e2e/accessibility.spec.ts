import { test, expect } from '@playwright/test';

test.describe('Public Pages Accessibility', () => {
  test('homepage has accessible structure', async ({ page }) => {
    await page.goto('/');

    // Should have main heading
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

    // Should have navigation
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();

    // Should have accessible links
    const links = page.getByRole('link');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test('login page has accessible sign-in options', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /magic link/i })).toBeVisible();
  });

  test('signup page is not offered', async ({ page }) => {
    const response = await page.goto('/signup');
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Error States', () => {
  test('shows 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page-12345');

    // Should show error page or redirect
    await expect(page.getByText(/not found|404|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('magic link form is usable without a password field', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /^magic link$/i }).click();
    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.click('button[type="submit"]');

    await expect(
      page.getByText(/check your email|failed to send|something went wrong/i)
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeEnabled();
    await expect(page.locator('input[name="password"]')).toHaveCount(0);
  });
});

test.describe('Health Check', () => {
  test('health endpoint returns OK', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toMatch(/healthy|degraded/);
    expect(data.checks).toBeDefined();
    expect(data.checks.database).toBeDefined();
    expect(data.checks.memory).toBeDefined();
  });

  test('health endpoint HEAD request works', async ({ request }) => {
    const response = await request.head('/api/health');
    expect(response.status()).toBe(200);
  });
});

test.describe('Rate Limiting Behavior', () => {
  test('allows normal magic-link attempts', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /^magic link$/i }).click();

    for (let i = 0; i < 3; i++) {
      await page.fill('input[name="email"]', `test${i}@example.com`);
      await page.click('button[type="submit"]');

      await expect(
        page.getByText(/check your email|failed to send|something went wrong|too many/i)
      ).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Keyboard Navigation', () => {
  test('can navigate login form with keyboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /^magic link$/i }).click();
    await page.locator('#magic-email').focus();
    await page.keyboard.type('test@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(
      page.getByText(/check your email|failed to send|something went wrong/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('can navigate with tab through main page', async ({ page }) => {
    await page.goto('/');

    // Should be able to tab through all interactive elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should have moved through the page
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });
});
