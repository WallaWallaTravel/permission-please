# Development Setup Guide

Complete guide to set up the Permission Please development environment with all best practices and tooling.

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm
- Git
- Docker (optional, for local PostgreSQL)
- VS Code (recommended) or your preferred IDE

## 🚀 Quick Start

```bash
# 1. Initialize Next.js project with TypeScript
npx create-next-app@latest permission-please \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd permission-please

# 2. Install additional dependencies
npm install prisma @prisma/client \
  zod react-hook-form @hookform/resolvers \
  @tanstack/react-query \
  next-auth \
  resend \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  class-variance-authority clsx tailwind-merge \
  lucide-react \
  date-fns

# 3. Install dev dependencies
npm install -D \
  vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom \
  @playwright/test \
  msw \
  @types/node \
  prettier prettier-plugin-tailwindcss \
  husky lint-staged \
  @faker-js/faker

# 4. Initialize Prisma
npx prisma init

# 5. Set up Git hooks
npx husky init
```

## ⚙️ Configuration Files

### 1. Vitest Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', '**/mockData/**'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
```

### 2. Playwright Configuration

```bash
# Initialize Playwright
npx playwright install
```

Update `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3. ESLint Configuration

Update `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### 4. Prettier Configuration

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Create `.prettierignore`:

```
node_modules
.next
out
dist
coverage
*.min.js
pnpm-lock.yaml
package-lock.json
```

### 5. Husky & lint-staged

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

Update `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "type-check": "tsc --noEmit",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write", "vitest related --run --passWithNoTests"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### 6. TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 7. Prisma Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  TEACHER
  PARENT
  ADMIN
}

enum FormStatus {
  DRAFT
  ACTIVE
  CLOSED
}

enum SubmissionStatus {
  PENDING
  SIGNED
  DECLINED
}

enum EventType {
  FIELD_TRIP
  SPORTS
  ACTIVITY
  OTHER
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  forms            PermissionForm[]    @relation("TeacherForms")
  parentStudents   ParentStudent[]
  formSubmissions  FormSubmission[]

  @@map("users")
}

model Student {
  id        String   @id @default(cuid())
  name      String
  grade     String
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  parents         ParentStudent[]
  formSubmissions FormSubmission[]

  @@map("students")
}

model ParentStudent {
  parentId     String
  studentId    String
  relationship String

  parent  User    @relation(fields: [parentId], references: [id], onDelete: Cascade)
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@id([parentId, studentId])
  @@map("parent_students")
}

model PermissionForm {
  id          String      @id @default(cuid())
  teacherId   String      @map("teacher_id")
  title       String
  description String      @db.Text
  eventDate   DateTime    @map("event_date")
  eventType   EventType   @default(OTHER) @map("event_type")
  deadline    DateTime
  status      FormStatus  @default(DRAFT)
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  // Relations
  teacher     User             @relation("TeacherForms", fields: [teacherId], references: [id], onDelete: Cascade)
  fields      FormField[]
  submissions FormSubmission[]

  @@index([teacherId, status])
  @@map("permission_forms")
}

model FormField {
  id        String  @id @default(cuid())
  formId    String  @map("form_id")
  fieldType String  @map("field_type")
  label     String
  required  Boolean @default(false)
  order     Int

  // Relations
  form      PermissionForm @relation(fields: [formId], references: [id], onDelete: Cascade)
  responses FieldResponse[]

  @@index([formId])
  @@map("form_fields")
}

model FormSubmission {
  id            String           @id @default(cuid())
  formId        String           @map("form_id")
  parentId      String           @map("parent_id")
  studentId     String           @map("student_id")
  signatureData String           @map("signature_data") @db.Text
  signedAt      DateTime?        @map("signed_at")
  ipAddress     String?          @map("ip_address")
  status        SubmissionStatus @default(PENDING)

  // Relations
  form      PermissionForm  @relation(fields: [formId], references: [id], onDelete: Cascade)
  parent    User            @relation(fields: [parentId], references: [id], onDelete: Cascade)
  student   Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  responses FieldResponse[]

  @@unique([formId, parentId, studentId])
  @@index([parentId])
  @@index([formId, status])
  @@map("form_submissions")
}

model FieldResponse {
  id           String @id @default(cuid())
  submissionId String @map("submission_id")
  fieldId      String @map("field_id")
  response     String @db.Text

  // Relations
  submission FormSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  field      FormField      @relation(fields: [fieldId], references: [id], onDelete: Cascade)

  @@index([submissionId])
  @@map("field_responses")
}
```

### 8. Environment Variables

Create `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/permission_please"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# Node Environment
NODE_ENV="development"
```

Create `.env.local` (git-ignored):

```env
# Copy from .env.example and fill in real values
```

## 🗄️ Database Setup

### Option 1: Local PostgreSQL with Docker

```bash
# Start PostgreSQL container
docker run --name postgres-dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=permission_please \
  -p 5432:5432 \
  -d postgres:15

# Update .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/permission_please"

# Run migrations
npx prisma migrate dev --name init

# Open Prisma Studio
npx prisma studio
```

### Option 2: Neon (Managed PostgreSQL)

1. Sign up at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `.env.local`
4. Run migrations: `npx prisma migrate deploy`

### Seed Database

Create `prisma/seed.ts`:

```typescript
import { Prisma Client, Role } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test teacher
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@test.com',
      name: 'Test Teacher',
      password: await hash('password123', 10),
      role: Role.TEACHER,
    },
  });

  // Create test parent
  const parent = await prisma.user.create({
    data: {
      email: 'parent@test.com',
      name: 'Test Parent',
      password: await hash('password123', 10),
      role: Role.PARENT,
    },
  });

  // Create test student
  const student = await prisma.student.create({
    data: {
      name: 'Test Student',
      grade: '3rd Grade',
      parents: {
        create: {
          parentId: parent.id,
          relationship: 'mother',
        },
      },
    },
  });

  // Create sample form
  const form = await prisma.permissionForm.create({
    data: {
      teacherId: teacher.id,
      title: 'Zoo Field Trip',
      description: 'Annual field trip to the local zoo',
      eventDate: new Date('2025-12-15'),
      deadline: new Date('2025-12-01'),
      status: 'ACTIVE',
      fields: {
        create: [
          {
            fieldType: 'text',
            label: 'Emergency Contact Number',
            required: true,
            order: 1,
          },
          {
            fieldType: 'checkbox',
            label: 'I give permission for photos',
            required: false,
            order: 2,
          },
        ],
      },
    },
  });

  console.log('✅ Database seeded successfully');
  console.log({ teacher, parent, student, form });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:

```bash
npm run db:seed
```

## 🎨 UI Component Setup (shadcn/ui)

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install commonly used components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add calendar
```

## 📂 Project Structure Setup

```bash
# Create directory structure
mkdir -p src/{app,components,lib,hooks,types}
mkdir -p src/app/\(auth\)/\{login,signup\}
mkdir -p src/app/\(teacher\)/\{dashboard,forms,students\}
mkdir -p src/app/\(parent\)/\{dashboard,sign\}
mkdir -p src/app/api/\{auth,forms,signatures\}
mkdir -p src/components/\{ui,forms,signatures,shared\}
mkdir -p src/lib/\{db,email,auth,validations\}
mkdir -p tests/\{unit,integration,e2e,helpers\}
```

## 🔧 VS Code Setup (Recommended)

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

## 🚀 Development Workflow

```bash
# 1. Start development server
npm run dev

# 2. Run tests in watch mode (separate terminal)
npm run test

# 3. Run Prisma Studio (separate terminal)
npm run db:studio

# 4. Before committing
npm run type-check
npm run lint
npm run test:coverage
npm run format

# 5. Run E2E tests
npm run test:e2e
```

## ✅ Verification Checklist

After setup, verify everything works:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format:check

# Unit tests
npm run test:coverage

# Build
npm run build

# E2E tests (requires build to be running)
npm run dev &
npm run test:e2e
```

## 📖 Next Steps

1. Review `PROJECT_PLAN.md` for feature roadmap
2. Review `ARCHITECTURE.md` for system design
3. Review `TESTING_PATTERNS.md` for testing examples
4. Start with authentication implementation
5. Build first feature: Form creation

## 🆘 Troubleshooting

### Database connection issues

```bash
# Check PostgreSQL is running
docker ps

# Restart container
docker restart postgres-dev

# Reset database
npx prisma migrate reset
```

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module resolution errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

**You're now ready to start development!** 🎉

All testing, linting, formatting, and quality checks are automated. Just write code and commit - the tools will guide you.
