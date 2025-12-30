# Permission Please

> Digital permission slips for schools - create, sign, track

## What It Does

Teachers create permission forms. Parents sign digitally from any device. Everyone saves time.

- **Teachers**: Create forms in minutes, track who's signed, send reminders
- **Parents**: Sign from phone/tablet with finger, no paper to lose
- **Schools**: Digital records, audit trails, FERPA-compliant

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment (copy and fill in values)
cp .env.example .env

# Push database schema
npm run db:push

# Seed test data
npm run db:seed

# Start development server
npm run dev
```

Open **http://localhost:6001**

### Test Accounts

| Role    | Email            | Password    |
| ------- | ---------------- | ----------- |
| Teacher | teacher@test.com | password123 |
| Parent  | parent1@test.com | password123 |
| Admin   | admin@test.com   | password123 |

## Tech Stack

| Layer     | Technology              |
| --------- | ----------------------- |
| Framework | Next.js 16 (App Router) |
| Language  | TypeScript              |
| Database  | PostgreSQL (Supabase)   |
| ORM       | Prisma                  |
| Auth      | NextAuth.js             |
| Styling   | Tailwind CSS            |
| Email     | Resend                  |

## Project Structure

```
src/
├── app/                  # Next.js pages and API routes
│   ├── (auth)/          # Login, signup, password reset
│   ├── teacher/         # Teacher dashboard, form builder
│   ├── parent/          # Parent dashboard, signing flow
│   ├── admin/           # Admin panel
│   └── api/             # API endpoints
├── components/          # React components
│   ├── ui/              # Base UI components
│   ├── forms/           # Form-related components
│   └── signatures/      # Signature canvas
├── lib/                 # Utilities and services
│   ├── auth/            # Authentication helpers
│   ├── email/           # Email templates
│   └── validations/     # Zod schemas
└── types/               # TypeScript types
```

## Commands

```bash
npm run dev              # Start dev server (port 6001)
npm run build            # Production build
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:push          # Push schema changes
npm run db:seed          # Seed test data
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run lint             # Lint code
npm run format           # Format code
```

## Features

### Implemented

- [x] Authentication (login, signup, password reset)
- [x] Teacher dashboard with stats
- [x] Form builder with custom fields
- [x] Digital signature capture (touch + mouse)
- [x] Parent dashboard
- [x] Form distribution via email
- [x] Multi-student support
- [x] Audit logging
- [x] Role-based access control

### Planned

- [ ] Form templates
- [ ] Automated reminders
- [ ] PDF export
- [ ] Analytics dashboard

## Documentation

- [Architecture](./ARCHITECTURE.md) - System design
- [Setup Guide](./SETUP_GUIDE.md) - Detailed setup
- [Testing](./TESTING_PATTERNS.md) - Test patterns

## License

MIT
