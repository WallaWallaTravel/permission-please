# 🚂 Railway Setup Guide

## Complete setup for Permission Please on Railway

Railway provides both **PostgreSQL database** and **app hosting** in one place. Perfect for this project!

---

## 📋 Prerequisites

- GitHub account (for connecting Railway)
- Railway account (sign up free at [railway.app](https://railway.app))

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub (recommended)
4. Verify your email

### Step 2: Create PostgreSQL Database

1. In Railway dashboard, click **"+ New Project"**
2. Select **"Provision PostgreSQL"**
3. Railway creates your database instantly
4. Click on the PostgreSQL service
5. Go to **"Connect"** tab
6. Copy the **"Postgres Connection URL"**

Example format:

```
postgresql://postgres:PASSWORD@REGION.railway.app:PORT/railway
```

### Step 3: Update Local Environment

1. Open `/Users/temp/permission-please/.env`
2. Replace the DATABASE_URL with your Railway connection string:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@REGION.railway.app:PORT/railway"
NEXTAUTH_SECRET="development-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### Step 4: Push Database Schema

```bash
cd /Users/temp/permission-please
npm run db:push
```

You should see:

```
✔ Your database is now in sync with your schema.
```

### Step 5: Seed Test Data

```bash
npm run db:seed
```

You should see:

```
🌱 Starting database seed...
✅ Created teacher: teacher@test.com
✅ Created parent 1: parent1@test.com
✅ Created parent 2: parent2@test.com
✅ Created admin: admin@test.com
✅ Created student 1: Emma Smith
✅ Created student 2: Liam Williams
✅ Created student 3: Olivia Johnson
✅ Created form: Zoo Field Trip
✅ Created form: Basketball Tournament
✅ Created draft form: Science Museum Visit
✅ Created sample submission
🎉 Database seeded successfully!
```

### Step 6: Test Your App

```bash
# Dev server should already be running
# If not, start it:
npm run dev
```

Go to: http://localhost:3000/login

Login with:

- Email: `teacher@test.com`
- Password: `password123`

You should see your dashboard with **real data**! 🎉

---

## 🌐 Deploy to Railway (Production)

### Option 1: Deploy via GitHub

1. Push your code to GitHub:

```bash
cd /Users/temp/permission-please
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. In Railway dashboard:
   - Click **"+ New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository
   - Railway auto-detects Next.js and configures everything

3. Add environment variables in Railway:
   - Click on your service
   - Go to **"Variables"** tab
   - Add:
     ```
     DATABASE_URL = (select your PostgreSQL from dropdown)
     NEXTAUTH_SECRET = (generate: openssl rand -base64 32)
     NEXTAUTH_URL = https://your-app.railway.app
     NODE_ENV = production
     ```

4. Railway automatically:
   - Installs dependencies
   - Builds your app
   - Deploys to a URL
   - Provides HTTPS

5. Run migrations on production:
   - Go to your service settings
   - Add a custom start command:
   ```
   npm run db:push && npm run start
   ```
   Or create a one-time deployment with:
   ```
   npx prisma migrate deploy
   ```

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
railway up
```

---

## 🔧 Railway Configuration

### Connecting Database to App

Railway makes this automatic! When you:

1. Have a PostgreSQL service in your project
2. Deploy a Next.js app to the same project
3. Railway automatically creates a `DATABASE_URL` variable linking them

You can also manually reference it:

```
${{Postgres.DATABASE_URL}}
```

### Environment Variables

Set these in Railway dashboard under "Variables":

**Required:**

- `DATABASE_URL` - Auto-provided by Railway
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your Railway app URL

**Optional (for future features):**

- `RESEND_API_KEY` - For email sending
- `FROM_EMAIL` - Sender email address

---

## 🔍 View Your Database

### Option 1: Prisma Studio (Local)

```bash
npm run db:studio
```

Opens at http://localhost:5555 - visual database editor

### Option 2: Railway Database View

1. In Railway dashboard, click your PostgreSQL service
2. Go to "Data" tab
3. Browse tables and data directly

### Option 3: Railway CLI

```bash
railway connect postgres
```

Opens a psql shell to your database

---

## 📊 Monitor Your App

Railway provides built-in monitoring:

1. **Metrics** - CPU, Memory, Network usage
2. **Logs** - Real-time application logs
3. **Deployments** - History of all deploys
4. **Database Stats** - Storage, connections

Access all from your Railway dashboard.

---

## 💰 Pricing

**Starter Plan (Free):**

- $5 free credits/month
- Perfect for development and testing
- 512MB RAM
- 1GB storage

**Developer Plan ($5/month):**

- $5 free credits + pay for what you use
- Production ready
- Better performance
- Priority support

For this app at small scale: ~$5-10/month total

---

## 🔐 Security Best Practices

### 1. Generate Strong Secret

```bash
openssl rand -base64 32
```

Use this for `NEXTAUTH_SECRET` in production

### 2. Use Different Databases

Create separate Railway projects for:

- Development
- Staging
- Production

### 3. Enable Railway's Security Features

- Enable 2FA on Railway account
- Use GitHub integration (no manual deploys)
- Review audit logs regularly

### 4. Database Backups

Railway automatically backs up PostgreSQL:

- Point-in-time recovery
- Daily backups retained for 7 days
- Restore from dashboard

---

## 🐛 Troubleshooting

### "Can't connect to database"

1. Check DATABASE_URL is correct in .env
2. Verify Railway database is running (green dot)
3. Check firewall isn't blocking Railway IPs
4. Try `railway connect postgres` to test connection

### "Prisma migrate failed"

```bash
# Reset and try again
npx prisma migrate reset
npm run db:push
npm run db:seed
```

### "App deployed but not working"

1. Check Railway logs for errors
2. Verify all environment variables are set
3. Make sure `NEXTAUTH_URL` matches your Railway domain
4. Check build logs for any failures

### "Database is slow"

Railway free tier has limits:

- Upgrade to Developer plan
- Check connection pool settings in Prisma
- Add database indexes for frequently queried fields

---

## 📈 Scaling on Railway

As your app grows:

1. **Vertical Scaling** - Increase RAM/CPU in Railway
2. **Horizontal Scaling** - Add more service replicas
3. **Database Scaling** - Upgrade PostgreSQL plan
4. **CDN** - Railway provides global CDN automatically
5. **Caching** - Add Redis (also available on Railway)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Railway PostgreSQL is running
- [ ] DATABASE_URL is in .env
- [ ] `npm run db:push` succeeds
- [ ] `npm run db:seed` creates test data
- [ ] `npm run db:studio` shows tables and data
- [ ] Login at localhost:3000 works
- [ ] Dashboard shows seeded forms
- [ ] Can create new forms

---

## 🎉 You're All Set!

Your Permission Please app is now running on Railway infrastructure:

- ✅ Managed PostgreSQL database
- ✅ Automatic backups
- ✅ Ready for production deployment
- ✅ Scalable architecture
- ✅ Built-in monitoring

**Next:** Test the app and start creating forms! 🚀

---

## 🆘 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app
- This Project Docs: See README.md
