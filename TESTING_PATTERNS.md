# Testing Patterns & Examples

This guide provides concrete examples of how to test different parts of the application.

## 🧪 Unit Testing Patterns

### Testing React Components

```typescript
// components/FormCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormCard } from './FormCard';

describe('FormCard', () => {
  it('renders form title and description', () => {
    const form = {
      id: '1',
      title: 'Field Trip to Zoo',
      description: 'Annual zoo visit',
      deadline: new Date('2025-12-01'),
    };

    render(<FormCard form={form} />);

    expect(screen.getByText('Field Trip to Zoo')).toBeInTheDocument();
    expect(screen.getByText('Annual zoo visit')).toBeInTheDocument();
  });

  it('shows overdue badge when deadline has passed', () => {
    const form = {
      id: '1',
      title: 'Old Trip',
      deadline: new Date('2020-01-01'),
    };

    render(<FormCard form={form} />);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const handleDelete = vi.fn();
    const form = { id: '1', title: 'Test Form' };

    const { user } = render(<FormCard form={form} onDelete={handleDelete} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(handleDelete).toHaveBeenCalledWith('1');
  });
});
```

### Testing Custom Hooks

```typescript
// hooks/useFormValidation.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFormValidation } from './useFormValidation';

describe('useFormValidation', () => {
  it('validates required fields', () => {
    const { result } = renderHook(() => useFormValidation());

    act(() => {
      result.current.validate({ title: '', description: 'test' });
    });

    expect(result.current.errors.title).toBe('Title is required');
    expect(result.current.errors.description).toBeUndefined();
  });

  it('validates deadline is in the future', () => {
    const { result } = renderHook(() => useFormValidation());
    const pastDate = new Date('2020-01-01');

    act(() => {
      result.current.validate({ deadline: pastDate });
    });

    expect(result.current.errors.deadline).toBe('Deadline must be in the future');
  });
});
```

### Testing Utility Functions

```typescript
// lib/date-utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDeadline, isOverdue } from './date-utils';

describe('date-utils', () => {
  describe('formatDeadline', () => {
    it('formats date as "MMM DD, YYYY"', () => {
      const date = new Date('2025-12-25');
      expect(formatDeadline(date)).toBe('Dec 25, 2025');
    });
  });

  describe('isOverdue', () => {
    it('returns true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('returns false for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isOverdue(futureDate)).toBe(false);
    });
  });
});
```

### Testing Zod Schemas

```typescript
// lib/validations/form-schema.test.ts
import { describe, it, expect } from 'vitest';
import { formSchema } from './form-schema';

describe('formSchema', () => {
  it('validates a valid form', () => {
    const validForm = {
      title: 'Field Trip',
      description: 'Zoo visit',
      eventDate: new Date('2025-12-01'),
      deadline: new Date('2025-11-20'),
    };

    const result = formSchema.safeParse(validForm);
    expect(result.success).toBe(true);
  });

  it('rejects form with missing title', () => {
    const invalidForm = {
      description: 'Zoo visit',
      eventDate: new Date('2025-12-01'),
    };

    const result = formSchema.safeParse(invalidForm);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['title']);
    }
  });

  it('rejects deadline after event date', () => {
    const invalidForm = {
      title: 'Field Trip',
      eventDate: new Date('2025-11-01'),
      deadline: new Date('2025-12-01'), // After event!
    };

    const result = formSchema.safeParse(invalidForm);
    expect(result.success).toBe(false);
  });
});
```

## 🔗 Integration Testing Patterns

### Testing API Routes

```typescript
// app/api/forms/route.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/db';

describe('POST /api/forms', () => {
  beforeEach(async () => {
    // Set up test data
    await prisma.user.create({
      data: { id: 'teacher-1', email: 'teacher@test.com', role: 'teacher' },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.form.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates a new form', async () => {
    const request = new Request('http://localhost:3000/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Zoo Trip',
        description: 'Annual visit',
        eventDate: '2025-12-01',
        deadline: '2025-11-20',
      }),
    });

    // Mock authentication
    vi.mock('@/lib/auth', () => ({
      getSession: () => ({ user: { id: 'teacher-1', role: 'teacher' } }),
    }));

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.form.title).toBe('Zoo Trip');

    // Verify in database
    const form = await prisma.form.findUnique({ where: { id: data.form.id } });
    expect(form).not.toBeNull();
    expect(form?.teacherId).toBe('teacher-1');
  });

  it('returns 401 for unauthenticated requests', async () => {
    vi.mock('@/lib/auth', () => ({
      getSession: () => null,
    }));

    const request = new Request('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid data', async () => {
    const request = new Request('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify({ title: '' }), // Empty title
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### Testing Email Sending

```typescript
// lib/email/send-form.test.ts
import { describe, it, expect, vi } from 'vitest';
import { sendFormToParents } from './send-form';
import { resend } from '@/lib/resend';

vi.mock('@/lib/resend');

describe('sendFormToParents', () => {
  it('sends email to all parents', async () => {
    const form = {
      id: '1',
      title: 'Zoo Trip',
      description: 'Annual visit',
    };

    const parents = [
      { id: '1', email: 'parent1@test.com', name: 'Parent 1' },
      { id: '2', email: 'parent2@test.com', name: 'Parent 2' },
    ];

    await sendFormToParents(form, parents);

    expect(resend.emails.send).toHaveBeenCalledTimes(2);
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'parent1@test.com',
        subject: expect.stringContaining('Zoo Trip'),
      })
    );
  });

  it('handles email sending failures gracefully', async () => {
    vi.mocked(resend.emails.send).mockRejectedValueOnce(new Error('SMTP error'));

    const form = { id: '1', title: 'Test' };
    const parents = [{ id: '1', email: 'parent@test.com' }];

    await expect(sendFormToParents(form, parents)).rejects.toThrow();
  });
});
```

## 🎭 E2E Testing Patterns

### Testing Critical User Flows

```typescript
// tests/e2e/create-and-sign-form.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Form Creation and Signing Flow', () => {
  test('teacher creates form and parent signs it', async ({ page, context }) => {
    // TEACHER FLOW
    await page.goto('/login');
    await page.fill('[name="email"]', 'teacher@school.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/teacher/dashboard');

    // Create new form
    await page.click('button:has-text("Create Form")');
    await page.fill('[name="title"]', 'Zoo Field Trip');
    await page.fill('[name="description"]', 'Annual zoo visit for 3rd graders');
    await page.fill('[name="eventDate"]', '2025-12-15');
    await page.fill('[name="deadline"]', '2025-12-01');

    // Select students
    await page.click('text=Select Students');
    await page.check('[data-student-id="student-1"]');
    await page.check('[data-student-id="student-2"]');

    // Submit form
    await page.click('button:has-text("Send to Parents")');

    // Verify success message
    await expect(page.locator('text=Form sent successfully')).toBeVisible();

    // Verify form appears in dashboard
    await expect(page.locator('text=Zoo Field Trip')).toBeVisible();
    await expect(page.locator('text=0/2 signed')).toBeVisible();

    // PARENT FLOW (new browser context to simulate different user)
    const parentPage = await context.newPage();

    // In real scenario, parent would receive email with link
    // For testing, we'll navigate directly
    const formId = await page.getAttribute('[data-form-id]', 'data-form-id');
    await parentPage.goto(`/sign/${formId}?token=test-token`);

    // Parent reviews form
    await expect(parentPage.locator('h1')).toHaveText('Zoo Field Trip');
    await expect(parentPage.locator('text=Annual zoo visit')).toBeVisible();

    // Fill out additional info
    await parentPage.fill('[name="emergencyContact"]', '555-1234');
    await parentPage.check('[name="medicationConsent"]');

    // Sign (using signature canvas)
    const canvas = parentPage.locator('canvas');
    await canvas.click(); // Simulate drawing signature
    await canvas.dispatchEvent('mousedown', { clientX: 10, clientY: 10 });
    await canvas.dispatchEvent('mousemove', { clientX: 100, clientY: 50 });
    await canvas.dispatchEvent('mouseup');

    // Submit signature
    await parentPage.click('button:has-text("Submit Signature")');

    // Verify confirmation
    await expect(parentPage.locator('text=Thank you')).toBeVisible();
    await expect(parentPage.locator('text=signed successfully')).toBeVisible();

    // VERIFY TEACHER DASHBOARD UPDATES
    await page.reload();
    await expect(page.locator('text=1/2 signed')).toBeVisible();
  });

  test('prevents signing after deadline', async ({ page }) => {
    // Create expired form (past deadline)
    const expiredFormId = 'expired-form-123';

    await page.goto(`/sign/${expiredFormId}`);

    await expect(page.locator('text=This form has expired')).toBeVisible();
    await expect(page.locator('button:has-text("Submit")')).toBeDisabled();
  });
});
```

### Testing Mobile Experience

```typescript
// tests/e2e/mobile-signing.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 13']);

test('parent can sign form on mobile', async ({ page }) => {
  await page.goto('/sign/form-123');

  // Check mobile-optimized layout
  await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();

  // Test touch-based signature
  const canvas = page.locator('canvas');
  await canvas.tap({ position: { x: 50, y: 50 } });

  // Simulate signature drawing with touch
  await page.touchscreen.tap(100, 100);

  // Submit
  await page.click('button:has-text("Sign")');

  await expect(page.locator('text=Signed successfully')).toBeVisible();
});
```

### Testing Accessibility

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('dashboard meets accessibility standards', async ({ page }) => {
  await page.goto('/teacher/dashboard');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test('keyboard navigation works correctly', async ({ page }) => {
  await page.goto('/teacher/dashboard');

  // Tab through interactive elements
  await page.keyboard.press('Tab');
  await expect(page.locator('button:focus')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.locator('a:focus')).toBeVisible();

  // Submit form with Enter key
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/forms\//);
});
```

## 🔍 Performance Testing

```typescript
// tests/performance/load-test.ts
import { test, expect } from '@playwright/test';

test('dashboard loads within performance budget', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/teacher/dashboard');

  // Measure First Contentful Paint
  const fcp = await page.evaluate(() => {
    return performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
  });

  expect(fcp).toBeLessThan(1800); // < 1.8s

  // Measure Time to Interactive
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // < 3s

  // Check bundle size
  const jsResources = await page.evaluate(() => {
    return performance
      .getEntriesByType('resource')
      .filter((r: any) => r.name.includes('.js'))
      .reduce((acc: number, r: any) => acc + r.transferSize, 0);
  });

  expect(jsResources).toBeLessThan(200 * 1024); // < 200KB
});
```

## 📝 Testing Best Practices

### 1. Test File Organization

```
src/
├── components/
│   ├── FormCard.tsx
│   └── FormCard.test.tsx          # Co-located with component
├── hooks/
│   ├── useFormValidation.ts
│   └── useFormValidation.test.ts  # Co-located with hook
└── lib/
    ├── utils.ts
    └── utils.test.ts              # Co-located with utilities

tests/
├── e2e/
│   ├── auth.spec.ts
│   ├── forms.spec.ts
│   └── signatures.spec.ts
└── integration/
    ├── api/
    └── database/
```

### 2. Test Naming Convention

```typescript
// ✅ Good: Descriptive, behavior-focused
test('displays error message when form submission fails');
test('redirects to dashboard after successful login');
test('disables submit button while request is pending');

// ❌ Bad: Implementation-focused, unclear
test('test1');
test('calls handleSubmit');
test('renders correctly');
```

### 3. AAA Pattern (Arrange, Act, Assert)

```typescript
test('creates form successfully', async () => {
  // Arrange
  const formData = {
    title: 'Zoo Trip',
    description: 'Annual visit',
  };
  const user = { id: '1', role: 'teacher' };

  // Act
  const result = await createForm(formData, user);

  // Assert
  expect(result.success).toBe(true);
  expect(result.form.title).toBe('Zoo Trip');
});
```

### 4. Test Data Builders

```typescript
// tests/helpers/builders.ts
export const buildUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'user@test.com',
  name: 'Test User',
  role: 'teacher',
  ...overrides,
});

export const buildForm = (overrides = {}) => ({
  id: 'form-1',
  title: 'Test Form',
  description: 'Test description',
  deadline: new Date('2025-12-01'),
  ...overrides,
});

// Usage
test('teacher can create form', () => {
  const teacher = buildUser({ role: 'teacher' });
  const form = buildForm({ title: 'Zoo Trip' });
  // ...
});
```

### 5. Mock External Dependencies

```typescript
// ✅ Mock external services
vi.mock('@/lib/resend', () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'email-123' }),
    },
  },
}));

// ✅ Mock environment variables
vi.stubEnv('DATABASE_URL', 'postgresql://test');

// ✅ Mock dates for consistent tests
vi.setSystemTime(new Date('2025-01-01'));
```

## 🎯 Coverage Goals

- **Overall**: > 80%
- **Critical paths** (auth, signatures): > 95%
- **Utility functions**: > 90%
- **UI components**: > 75%

Run coverage report:

```bash
npm run test:coverage
```

View coverage in browser:

```bash
open coverage/index.html
```
