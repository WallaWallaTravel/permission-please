# Quick Reference Guide 🚀

Essential commands and patterns for Permission Please development.

## 📦 Installation & Setup

```bash
# Initial setup
npm install
cp .env.example .env.local
npm run db:push
npm run db:seed

# Start development
npm run dev
```

## 🔧 Common Commands

### Development

```bash
npm run dev              # Start dev server (localhost:6001)
npm run build            # Build for production
npm run start            # Start production server
```

### Testing

```bash
npm run test             # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run E2E tests with Playwright
npm run test:e2e:ui      # Run E2E tests in UI mode
```

### Database

```bash
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create and run migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database with test data
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types
```

## 📁 Project Structure

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Auth routes (grouped)
│   │   ├── login/
│   │   └── signup/
│   ├── (teacher)/               # Teacher routes
│   │   ├── dashboard/
│   │   └── forms/
│   ├── (parent)/                # Parent routes
│   │   ├── dashboard/
│   │   └── sign/[id]/
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   └── forms/
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                  # React components
│   ├── ui/                      # shadcn/ui components
│   ├── forms/                   # Form components
│   └── shared/                  # Shared components
├── lib/                         # Utilities
│   ├── db.ts                    # Prisma client
│   ├── auth.ts                  # Auth utilities
│   └── validations/             # Zod schemas
├── hooks/                       # Custom hooks
└── types/                       # TypeScript types
```

## 🎨 Component Patterns

### Server Component (Default)

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const forms = await prisma.form.findMany();
  return <FormList forms={forms} />;
}
```

### Client Component

```typescript
// components/CreateFormButton.tsx
'use client';

import { useState } from 'react';

export function CreateFormButton() {
  const [open, setOpen] = useState(false);
  return <Button onClick={() => setOpen(true)}>Create</Button>;
}
```

### API Route

```typescript
// app/api/forms/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const forms = await prisma.form.findMany();
  return NextResponse.json({ forms });
}

export async function POST(request: Request) {
  const body = await request.json();
  const form = await prisma.form.create({ data: body });
  return NextResponse.json({ form }, { status: 201 });
}
```

## 🔐 Authentication

### Protect Server Component

```typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession();
  if (!session) redirect('/login');

  return <div>Protected content</div>;
}
```

### Protect API Route

```typescript
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Handle authenticated request
}
```

### Client-side Session

```typescript
'use client';

import { useSession } from 'next-auth/react';

export function UserProfile() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Not signed in</div>;

  return <div>Welcome {session.user.name}</div>;
}
```

## 📝 Form Handling

### With Zod Validation

```typescript
'use client';

import { useState } from 'react';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  deadline: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export function CreateFormDialog() {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = formSchema.safeParse({ title, deadline: new Date().toISOString() });

    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    const response = await fetch('/api/forms', {
      method: 'POST',
      body: JSON.stringify(result.data),
    });

    if (response.ok) {
      // Handle success
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      {error && <span>{error}</span>}
      <button type="submit">Create</button>
    </form>
  );
}
```

## 🗄 Database Operations

### Create

```typescript
const form = await prisma.form.create({
  data: {
    title: 'Zoo Trip',
    teacherId: userId,
  },
});
```

### Read

```typescript
// Find many with filters
const forms = await prisma.form.findMany({
  where: { teacherId: userId, status: 'ACTIVE' },
  include: { submissions: true },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

// Find unique
const form = await prisma.form.findUnique({
  where: { id: formId },
});
```

### Update

```typescript
const form = await prisma.form.update({
  where: { id: formId },
  data: { status: 'CLOSED' },
});
```

### Delete

```typescript
await prisma.form.delete({
  where: { id: formId },
});
```

### Transactions

```typescript
await prisma.$transaction([
  prisma.form.create({ data: formData }),
  prisma.notification.create({ data: notificationData }),
]);
```

## 🧪 Testing Patterns

### Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from './date-utils';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-12-25');
    expect(formatDate(date)).toBe('Dec 25, 2025');
  });
});
```

### Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormCard } from './FormCard';

describe('FormCard', () => {
  it('renders form details', () => {
    const form = { id: '1', title: 'Zoo Trip' };
    render(<FormCard form={form} />);
    expect(screen.getByText('Zoo Trip')).toBeInTheDocument();
  });
});
```

### E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('teacher can create form', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'teacher@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');

  await expect(page).toHaveURL('/teacher/dashboard');

  await page.click('button:has-text("Create Form")');
  await page.fill('[name="title"]', 'Zoo Trip');
  await page.click('button:has-text("Submit")');

  await expect(page.locator('text=Zoo Trip')).toBeVisible();
});
```

## 🎨 Styling with Tailwind

### Common Patterns

```tsx
// Button
<button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
  Click me
</button>

// Card
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
  Card content
</div>

// Responsive
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} />)}
</div>

// Dark mode (if enabled)
<div className="bg-white text-black dark:bg-gray-900 dark:text-white">
  Content
</div>
```

### Using shadcn/ui Components

```tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

export function Example() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>Title</DialogHeader>
        <Button>Click me</Button>
      </DialogContent>
    </Dialog>
  );
}
```

## 🚀 Data Fetching

### Server Component (Recommended)

```typescript
export default async function FormsPage() {
  const forms = await prisma.form.findMany();
  return <FormsList forms={forms} />;
}
```

### Client Component with Fetch

```typescript
'use client';

import { useState, useEffect } from 'react';

export function FormsList() {
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/forms')
      .then(res => res.json())
      .then(data => setForms(data.forms))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render forms */}</div>;
}
```

## 📧 Sending Emails

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Permission Please <noreply@permissionplease.app>',
  to: parent.email,
  subject: 'New Permission Form: Zoo Field Trip',
  html: `
    <h1>New Permission Form</h1>
    <p>Please sign the form for ${student.name}</p>
    <a href="${signUrl}">Sign Form</a>
  `,
});
```

## 🔍 Common Issues & Solutions

### "Module not found" error

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Database connection issues

```bash
# Check DATABASE_URL in .env
# Verify Supabase project is running at supabase.com/dashboard
# Try regenerating Prisma client
npx prisma generate
```

### Tests failing after update

```bash
# Clear test cache
npm run test -- --clearCache
```

### Type errors in tests

```typescript
// Add to tests/setup.ts
import '@testing-library/jest-dom';
```

## 📚 Documentation Links

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

## 🆘 Getting Help

1. Check this Quick Reference
2. Search project documentation
3. Check GitHub Issues
4. Ask in team chat
5. Create new GitHub Issue

---

**Pro Tip**: Bookmark this page! 📑
