# 🔗 Railway Connection Helper

## Quick Reference for Your Setup

### Your Local Project Path

```
/Users/temp/permission-please/
```

### Commands You'll Need

```bash
# Navigate to project
cd /Users/temp/permission-please

# Check current .env (to see what needs updating)
cat .env | grep DATABASE_URL

# After updating .env with Railway URL:
npm run db:push

# Then seed the database:
npm run db:seed

# View your database:
npm run db:studio
```

---

## What Your DATABASE_URL Should Look Like

### ❌ Current (probably):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/permission_please"
```

### ✅ After Railway Setup:

```
DATABASE_URL="postgresql://postgres:abc123xyz...@region.railway.app:12345/railway"
```

The Railway URL will be something like:

- `postgresql://postgres:[PASSWORD]@monorail.proxy.rlwy.net:[PORT]/railway`
- `postgresql://postgres:[PASSWORD]@roundhouse.proxy.rlwy.net:[PORT]/railway`
- `postgresql://postgres:[PASSWORD]@viaduct.proxy.rlwy.net:[PORT]/railway`

---

## How to Update Your .env File

### Option 1: Using a Text Editor

```bash
# Open with VS Code (if you have it)
code /Users/temp/permission-please/.env

# Or use nano
nano /Users/temp/permission-please/.env
```

### Option 2: Using Terminal Commands

```bash
cd /Users/temp/permission-please

# Backup current .env
cp .env .env.backup

# Create new .env with Railway URL
cat > .env << 'EOF'
# Database (Railway PostgreSQL)
DATABASE_URL="PASTE_YOUR_RAILWAY_URL_HERE"

# NextAuth
NEXTAUTH_SECRET="development-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
EOF
```

Then replace `PASTE_YOUR_RAILWAY_URL_HERE` with your actual Railway connection string.

---

## Step-by-Step Checklist

### 1. Railway Account ☐

- [ ] Signed up at railway.app
- [ ] Logged in with GitHub
- [ ] See Railway dashboard

### 2. Create Database ☐

- [ ] Clicked "+ New Project"
- [ ] Selected "Provision PostgreSQL"
- [ ] See PostgreSQL card/service
- [ ] Database shows green dot (running)

### 3. Get Connection String ☐

- [ ] Clicked PostgreSQL service
- [ ] Went to "Connect" tab
- [ ] Found "Postgres Connection URL"
- [ ] Copied the entire URL
- [ ] URL starts with `postgresql://`

### 4. Update .env File ☐

- [ ] Opened `/Users/temp/permission-please/.env`
- [ ] Replaced DATABASE_URL value
- [ ] Saved the file
- [ ] Verified it saved correctly

### 5. Push Schema ☐

- [ ] Ran `npm run db:push`
- [ ] Saw "✔ Your database is now in sync"
- [ ] No errors

### 6. Seed Data ☐

- [ ] Ran `npm run db:seed`
- [ ] Saw "🌱 Starting database seed..."
- [ ] Saw "✅ Created teacher: teacher@test.com"
- [ ] Saw "🎉 Database seeded successfully!"
- [ ] Saw test account list

### 7. Test Connection ☐

- [ ] Ran `npm run db:studio`
- [ ] Browser opened to http://localhost:5555
- [ ] Can see tables (users, students, permission_forms)
- [ ] Can see data in tables

### 8. Test App ☐

- [ ] Went to http://localhost:3000/login
- [ ] Logged in with teacher@test.com / password123
- [ ] See dashboard with 3 forms
- [ ] Stats show real numbers

---

## Expected Outputs

### After `npm run db:push`

```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "railway", schema "public" at "region.railway.app:PORT"

✔ Generated Prisma Client (v6.19.0) to ./node_modules/@prisma/client in 178ms

🚀  Your database is now in sync with your Prisma schema. Done in 2.85s
```

### After `npm run db:seed`

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

📝 Test Accounts Created:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Teacher: teacher@test.com / password123
Parent 1: parent1@test.com / password123
Parent 2: parent2@test.com / password123
Admin: admin@test.com / password123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Troubleshooting

### "Cannot connect to database"

```bash
# Check your DATABASE_URL
cat .env | grep DATABASE_URL

# Make sure Railway database is running
# (Check Railway dashboard - green dot)

# Try regenerating Prisma client
npx prisma generate
npm run db:push
```

### "Environment variable not found"

```bash
# Make sure .env file exists
ls -la /Users/temp/permission-please/.env

# If not, create it
touch .env
# Then add your DATABASE_URL
```

### "Migration failed"

```bash
# Try pushing directly
npx prisma db push --skip-generate

# Then generate client
npx prisma generate
```

---

## Success Indicators

✅ **Database Connected**: `npm run db:push` succeeds  
✅ **Data Seeded**: See test accounts listed  
✅ **Prisma Studio**: Can browse tables at localhost:5555  
✅ **App Works**: Can login and see dashboard

---

## Next Steps After Success

1. ✅ Railway database is connected
2. 🧪 Test all features locally
3. 🚀 Deploy to production

**You're on step 1 right now!**
