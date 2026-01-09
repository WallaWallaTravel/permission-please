# Permission Please - Project Configuration

## Overview
School permission slip management app with digital signing, reminders, and document management.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Auth**: NextAuth.js with Google OAuth + Magic Link (no passwords)
- **Database**: PostgreSQL via Prisma (hosted on Supabase)
- **Email**: Resend for transactional emails
- **Storage**: Supabase Storage for document uploads
- **Hosting**: Vercel

---

## Known Issues & Solutions

### Google OAuth 500 Error
**Problem**: Users getting HTTP 500 when trying to sign in with Google.

**Root Cause**: Database connection errors in auth callbacks were not being caught, causing unhandled exceptions.

**Solution**: Added try-catch blocks to the NextAuth callbacks in `src/lib/auth/config.ts`:
- `signIn` callback: Catches DB errors and redirects to `/login?error=DatabaseError`
- `jwt` callback: Catches DB errors and continues with partial token (graceful degradation)

**Files Changed**:
- `src/lib/auth/config.ts` - Added error handling
- `src/app/(auth)/login/page.tsx` - Added `DatabaseError` handling in the error display

### ESLint react-hooks/purity Errors
**Problem**: ESLint flags `Date.now()` and `window.location.href` in server components.

**Solutions**:
1. **Date.now()**: Calculate once before render, add eslint-disable comment for server components
2. **window.location.href in onChange**: Extract to client component using `useRouter().push()`

**Created**: `src/components/parent/StudentFilterSelect.tsx` - Client component for navigation

---

## Authentication Flow

### Supported Methods
1. **Google OAuth** (recommended) - For users with Google accounts
2. **Magic Link** - Email-based passwordless login

### User Creation
- **Invite-only system** - No self-registration
- Admin creates invite via `/api/invite/[token]`
- User accepts invite and authenticates with Google/Magic Link
- User record already exists from invite, just needs first login

### Auth Config Location
`src/lib/auth/config.ts`

---

## Reminders System

### Customizable Schedules
Forms can have custom reminder schedules stored as JSON:
```json
[
  {"value": 7, "unit": "days"},
  {"value": 3, "unit": "days"},
  {"value": 18, "unit": "hours"}
]
```

### Cron Endpoints
- `/api/cron/reminders` - New customizable reminder system
- `/api/cron/send-reminders` - Legacy fixed-schedule reminders

### Vercel Cron
Configured in `vercel.json` to run every 2 hours for better timing accuracy.

---

## Document Uploads

### Supabase Storage
- Bucket: `form-documents`
- API: `/api/upload/document`
- Client: `src/lib/supabase.ts` (lazy-initialized)

### Required Environment Variables
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

---

## Environment Variables

### Required
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Optional
```
RESEND_API_KEY=...
SENTRY_DSN=...
CRON_SECRET=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

---

## Testing Notes

### Pre-commit Hooks
Uses Husky with lint-staged. To bypass for urgent commits:
```bash
HUSKY=0 git commit -m "message"
```

### Known Test Issues
- `tests/integration/cron.test.ts` - Some tests need mock data updates
- Auth tests removed (routes were deleted when switching to Google/Magic Link)
