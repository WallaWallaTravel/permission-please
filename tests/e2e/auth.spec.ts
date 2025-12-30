import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /permission slips/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/teacher@school.com/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('signup page loads correctly', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.getByText(/teacher/i)).toBeVisible();
    await expect(page.getByText(/parent/i)).toBeVisible();
  });

  test('navigates between login and signup', async ({ page }) => {
    await page.goto('/login');

    await page.click('text=Sign up free');
    await expect(page).toHaveURL('/signup');

    await page.click('text=Sign in');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Successful Authentication', () => {
  test('teacher can login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to teacher dashboard
    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('parent can login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'parent1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to parent dashboard
    await expect(page).toHaveURL(/\/parent\/dashboard/, { timeout: 10000 });
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
