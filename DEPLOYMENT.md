# Deployment Guide - Permission Please

This guide covers deploying Permission Please to production using Vercel and Supabase.

## Prerequisites

- Node.js 20+
- Git repository (GitHub, GitLab, or Bitbucket)
- Vercel account (free tier works)
- Supabase account (free tier works)
- Resend account for emails (optional but recommended)
- Sentry account for error tracking (optional)

## Quick Start

### 1. Database Setup (Supabase)

1. Create a new Supabase project at https://supabase.com/dashboard
2. Go to **Project Settings > Database**
3. Copy these connection strings:
   - **Connection string (Pooler)** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`

Example format:
```bash
DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
```

### 2. Deploy to Vercel

1. Push your code to a Git repository
2. Go to https://vercel.com/new
3. Import your repository
4. Set up environment variables (see below)
5. Deploy

### 3. Environment Variables

Set these in Vercel Dashboard > Project Settings > Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase pooler connection string |
| `DIRECT_URL` | Yes | Supabase direct connection string |
| `NEXTAUTH_SECRET` | Yes | 32+ character random string |
| `NEXTAUTH_URL` | Yes | Your production URL (e.g., `https://app.permissionplease.app`) |
| `RESEND_API_KEY` | No* | Resend API key for emails |
| `FROM_EMAIL` | No | Sender email (e.g., `noreply@yourdomain.com`) |
| `CRON_SECRET` | Yes | Secret for cron job authentication |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Same as SENTRY_DSN (for client-side) |

*Without `RESEND_API_KEY`, emails won't be sent but the app will still work.

**Generate secrets:**
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -hex 32
```

### 4. Run Database Migrations

After first deployment, run migrations:

```bash
# From your local machine with DIRECT_URL set
npm run db:migrate:deploy
```

Or use Vercel's build command to run migrations automatically:
```json
{
  "buildCommand": "prisma migrate deploy && next build"
}
```

### 5. Create First Admin User

1. Go to your deployed app's `/signup` page
2. Create an account with your email
3. Connect to the database and update the role:

```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'your-email@example.com';
```

## Production Checklist

### Security

- [ ] `NEXTAUTH_SECRET` is a strong random string (not the development default)
- [ ] `CRON_SECRET` is set for cron job protection
- [ ] `.env` file is not committed to git
- [ ] Database password is unique and strong
- [ ] HTTPS is enforced (automatic on Vercel)

### Email

- [ ] `RESEND_API_KEY` is configured
- [ ] `FROM_EMAIL` domain is verified in Resend
- [ ] Test emails work (Admin > Email > Test)

### Monitoring

- [ ] Sentry DSN is configured
- [ ] Vercel Analytics enabled (automatic)
- [ ] `/api/health` endpoint responding

### Database

- [ ] Migrations are applied (`npm run db:migrate:status`)
- [ ] Database indexes are created (automatic with migrations)
- [ ] Connection pooling enabled (pgbouncer in DATABASE_URL)

## Cron Jobs

The app uses Vercel Cron for scheduled tasks. These are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This sends reminder emails daily at 8 AM UTC.

**Important:** The cron endpoint is protected by `CRON_SECRET`. Vercel automatically sends this header for cron jobs.

## Multi-Tenant Subdomains

Permission Please supports school subdomains (e.g., `school-name.permissionplease.app`).

### DNS Setup

1. Add a wildcard DNS record: `*.permissionplease.app → vercel`
2. Configure the wildcard domain in Vercel Dashboard > Project > Domains

### Creating Schools

1. Log in as SUPER_ADMIN or ADMIN
2. Go to Admin > Schools > Add School
3. Enter school name and subdomain
4. The school portal is now accessible at `{subdomain}.permissionplease.app`

## Troubleshooting

### Database Connection Issues

**Error: "Connection refused" or timeout**
- Check that `DATABASE_URL` uses the pooler connection (port 6543)
- Check that `DIRECT_URL` is set for migrations
- Verify IP is not blocked in Supabase settings

**Error: "Prepared statement already exists"**
- Add `?pgbouncer=true` to your DATABASE_URL

### Email Not Sending

1. Check `RESEND_API_KEY` is set in Vercel
2. Verify the FROM_EMAIL domain in Resend dashboard
3. Check Resend dashboard for delivery logs
4. Test with Admin > Email > Test

### Migrations Failing

```bash
# Check migration status
npm run db:migrate:status

# Reset if needed (WARNING: deletes all data)
npm run db:migrate:reset

# Generate new migration
npm run db:migrate
```

### Build Failures

```bash
# Check TypeScript errors
npm run type-check

# Check linting
npm run lint

# Test build locally
npm run build
```

## Performance Optimization

### Database

- Connection pooling is enabled via Supabase pgbouncer
- Key indexes are defined in the Prisma schema
- Analytics queries use aggregation

### Caching

- API routes have `Cache-Control: no-store` headers
- Static assets are cached by Vercel CDN
- Consider adding `revalidate` for semi-static pages

### Monitoring

- Vercel Analytics tracks page views automatically
- Custom events tracked via `src/lib/analytics.ts`
- Sentry captures errors with context

## Rollback Procedure

### Code Rollback

1. Go to Vercel Dashboard > Deployments
2. Find the last working deployment
3. Click the three dots > Promote to Production

### Database Rollback

**Warning:** Database changes may require manual intervention.

```bash
# View migration history
npm run db:migrate:status

# To rollback, you may need to:
# 1. Create a reverse migration
# 2. Restore from backup (configure in Supabase)
```

## Support

- Check logs in Vercel Dashboard > Logs
- Check errors in Sentry Dashboard
- Check database in Supabase Dashboard
- Health check: `GET /api/health`

## Environment Variables Reference

```bash
# Required
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="https://your-domain.com"
CRON_SECRET="your-cron-secret"

# Email (recommended)
RESEND_API_KEY="re_..."
FROM_EMAIL="Permission Please <noreply@yourdomain.com>"

# Monitoring (optional)
SENTRY_DSN="https://...@sentry.io/..."
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="permission-please"
SENTRY_AUTH_TOKEN="sntrys_..."

# Development only
NODE_ENV="production"
```
