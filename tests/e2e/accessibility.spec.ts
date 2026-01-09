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

  test('login page has accessible form', async ({ page }) => {
    await page.goto('/login');

    // Form fields should have accessible labels
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Submit button should be accessible
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('signup page has accessible form', async ({ page }) => {
    await page.goto('/signup');

    // Form should be present
    await expect(page.getByRole('form').or(page.locator('form'))).toBeVisible();

    // Role selection should be accessible
    await expect(page.getByText(/teacher/i)).toBeVisible();
    await expect(page.getByText(/parent/i)).toBeVisible();
  });
});

test.describe('Error States', () => {
  test('shows 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page-12345');

    // Should show error page or redirect
    await expect(page.getByText(/not found|404|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('handles invalid login gracefully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 5000 });

    // Page should still be functional
    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled();
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
  test('allows normal authentication attempts', async ({ page }) => {
    await page.goto('/login');

    // Multiple normal attempts should work
    for (let i = 0; i < 3; i++) {
      await page.fill('input[name="email"]', `test${i}@example.com`);
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should get normal error, not rate limit
      const errorText = page.getByText(/invalid|error|incorrect/i);
      await expect(errorText).toBeVisible({ timeout: 5000 });

      // Clear for next attempt
      await page.fill('input[name="email"]', '');
      await page.fill('input[name="password"]', '');
    }
  });
});

test.describe('Keyboard Navigation', () => {
  test('can navigate login form with keyboard', async ({ page }) => {
    await page.goto('/login');

    // Tab to email field
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip nav links

    // Type email
    await page.keyboard.type('test@example.com');

    // Tab to password
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');

    // Tab to submit button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Form should have been submitted
    await expect(page.getByText(/invalid|error|dashboard/i)).toBeVisible({ timeout: 5000 });
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
