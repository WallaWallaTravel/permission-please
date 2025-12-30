# What's Live Right Now!

Your **Permission Please** app is running at:

## **http://localhost:6001**

---

## Test Accounts

| Role     | Email            | Password    |
| -------- | ---------------- | ----------- |
| Teacher  | teacher@test.com | password123 |
| Parent 1 | parent1@test.com | password123 |
| Parent 2 | parent2@test.com | password123 |
| Admin    | admin@test.com   | password123 |

---

## Working Features

### 1. Authentication System

- **Login** (`/login`) - Fully functional with email/password
- **Signup** (`/signup`) - Create new accounts with role selection
- **Forgot Password** (`/forgot-password`) - Request password reset
- **Reset Password** (`/reset-password/[token]`) - Complete password reset
- Session management with NextAuth.js
- Role-based access control (Teacher, Parent, Admin)

### 2. Teacher Dashboard (`/teacher/dashboard`)

- Stats cards showing total forms, active forms, pending signatures
- Recent forms list with completion progress bars
- Quick actions for common tasks
- Form status indicators (Draft, Active, Closed)
- Distribute button to send forms to parents

### 3. Form Builder (`/teacher/forms/create`)

- Create permission forms with:
  - Title and description
  - Event date/time
  - Deadline
  - Event type (Field Trip, Sports, Activity, Other)
- Custom field builder supporting:
  - Text fields
  - Long text (textarea)
  - Checkbox (yes/no)
  - Date fields
- Save as draft or activate immediately
- Form validation with Zod schemas

### 4. Parent Dashboard (`/parent/dashboard`)

- Pending forms requiring signatures with urgency indicators
- Signed forms history
- Stats: pending, signed, my students
- Deadline countdown in days
- Multi-student support

### 5. Digital Signature System (`/parent/sign/[id]`)

- Canvas-based signature capture
- Mouse and touch support (works on tablets/phones)
- High DPI support for sharp signatures
- Clear button to reset
- Multi-student signing (sign for multiple children)
- Custom form field responses
- Agreement checkbox for legal confirmation

### 6. Email System (via Resend)

- Permission request emails
- Reminder emails with urgency indicators
- Confirmation emails after signing
- Invite emails for new users
- Password reset emails

### 7. API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Complete password reset
- `GET /api/forms` - List teacher's forms
- `POST /api/forms` - Create new form
- `GET /api/forms/[id]/sign` - Get form for signing
- `POST /api/forms/[id]/sign` - Submit signature
- `POST /api/forms/[id]/distribute` - Send form to parents
- `GET /api/health` - Health check with database status

---

## Running the App

```bash
# Start development server
npm run dev

# Open in browser
open http://localhost:6001
```

### Other Commands

```bash
# Database
npm run db:studio     # Open Prisma Studio (database GUI)
npm run db:push       # Push schema changes
npm run db:seed       # Seed test data

# Testing
npm run test          # Run unit tests
npm run test:e2e      # Run E2E tests

# Code Quality
npm run lint          # Run ESLint
npm run format        # Format with Prettier
npm run type-check    # TypeScript check
```

---

## Try It Now!

1. **As a Teacher:**
   - Login with `teacher@test.com` / `password123`
   - View your dashboard at `/teacher/dashboard`
   - Create a new form at `/teacher/forms/create`
   - See existing forms: Zoo Field Trip, Basketball Tournament

2. **As a Parent:**
   - Login with `parent1@test.com` / `password123`
   - View pending forms at `/parent/dashboard`
   - Click "Sign Now" on any pending form
   - Draw your signature and submit

---

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS 4**
- **Prisma** with PostgreSQL (Supabase)
- **NextAuth.js** for authentication
- **React Hook Form** + Zod validation
- **Resend** for emails
- **Vitest** + Playwright for testing

---

## Database Connected

Supabase PostgreSQL database is connected and seeded with:

- 4 test users (teacher, 2 parents, admin)
- 3 students (Emma, Liam, Olivia)
- 3 permission forms (2 active, 1 draft)
- 1 sample signature submission

---

**Your app is fully functional! Start exploring!**
