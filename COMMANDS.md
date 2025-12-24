# 🔧 Commands Reference

## Installation & Setup

### 1. Install Dependencies (if needed)
```bash
cd /home/dhivakar_kd/VSProjects/Habit-Streak
npm install
```

### 2. Install Supabase Packages (already done)
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## Local Development

### Start Development Server
```bash
npm run dev
```

Then open: http://localhost:3000

### Build for Production
```bash
npm run build
```

### Format Code
```bash
npm run format
```

### Lint Code
```bash
npm run lint
```

---

## Supabase Setup

### In Supabase Dashboard

**Step 1: Open SQL Editor**
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click "SQL Editor" in left menu
4. Click "New Query"

**Step 2: Run Database Setup**
```sql
-- Copy entire content from: docs/SUPABASE_SETUP.sql
-- Paste into SQL editor
-- Click "Run"
```

**Step 3: Configure Auth Redirect URLs**
1. Click "Authentication" → "URL Configuration"
2. Add to "Redirect URLs":
   ```
   http://localhost:3000
   ```
3. Save

---

## Environment Variables

### Local Development (.env.local)
```bash
# Get these from Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Vercel Production
```
Settings → Environment Variables
Add:
  Name: NEXT_PUBLIC_SUPABASE_URL
  Value: https://your-project.supabase.co
  
  Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
  Value: your-anon-key-here
```

---

## Testing Commands

### Test Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Test Sign In
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123"
  }'
```

### Get Leaderboard (no auth needed)
```bash
curl -X GET "http://localhost:3000/api/leaderboard?filter=current-streak&challengeId=<challenge-uuid>"
```

### Get User Achievements
```bash
curl -X GET "http://localhost:3000/api/achievements/<user-uuid>"
```

### Log Check-in (requires auth)
```bash
curl -X POST http://localhost:3000/api/checkins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session-token>" \
  -d '{
    "challengeId": "<challenge-uuid>",
    "date": "2025-12-24",
    "status": "completed"
  }'
```

---

## Vercel Deployment

### Deploy from Command Line
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Deploy from Git
1. Push to GitHub
2. Connect repo in Vercel dashboard
3. Add environment variables
4. Auto-deploys on push

---

## Monitoring & Debugging

### Check Supabase Database
1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "Table Editor"
3. Browse any table
4. View real-time data

### Check Supabase Logs
1. Click "Logs" in Supabase dashboard
2. View API/Auth/Database logs
3. Search for errors

### Check Vercel Logs
1. Go to Vercel dashboard
2. Click your project
3. Click "Functions" for API routes
4. View deployment logs
5. View runtime logs for errors

### Local TypeScript Check
```bash
# Check for TS errors (no build)
npx tsc --noEmit
```

---

## Git Commands

### View Changes
```bash
git status
git diff src/lib/types.ts
```

### Commit Changes
```bash
git add .
git commit -m "feat: implement Supabase backend with auth, leaderboards, achievements"
git push origin main
```

---

## Database Operations

### View Specific Table
```sql
-- Run in Supabase SQL Editor

-- View all users
SELECT * FROM users;

-- View all challenges
SELECT * FROM challenges;

-- View leaderboard metrics for a challenge
SELECT u.username, lm.current_streak, lm.best_streak, lm.completion_rate
FROM leaderboard_metrics lm
JOIN users u ON lm.user_id = u.id
WHERE lm.challenge_id = 'challenge-uuid'
ORDER BY lm.current_streak DESC;

-- View earned achievements
SELECT u.username, a.name, ua.earned_at
FROM user_achievements ua
JOIN users u ON ua.user_id = u.id
JOIN achievements a ON ua.achievement_id = a.id
ORDER BY ua.earned_at DESC;
```

### Reset Database (Careful!)
```sql
-- Drop all tables (will lose all data)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS challenge_members CASCADE;
DROP TABLE IF EXISTS leaderboard_metrics CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then re-run SUPABASE_SETUP.sql
```

---

## Common Issues & Fixes

### "Missing environment variables"
```bash
# Check .env.local exists
cat .env.local

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Restart dev server
npm run dev
```

### "Cannot connect to Supabase"
```bash
# Test connection
curl https://your-project.supabase.co/rest/v1/

# Should return 401 Unauthorized (not connection error)
```

### "Username already exists"
```bash
# Try different username
# Usernames are globally unique across app
```

### "Leaderboard returns empty"
```bash
# Make sure you:
# 1. Joined a challenge
# 2. Logged a check-in
# 3. Check-in was marked "completed"

# Query to verify:
SELECT * FROM checkins WHERE user_id = 'your-uuid';
```

### TypeScript Errors in Build
```bash
# Check for errors
npx tsc --noEmit

# See all errors
npm run build

# Fix formatting
npx prettier --write src/

# Run ESLint
npm run lint
```

---

## Performance Tuning

### Analyze Query Performance
```sql
-- In Supabase SQL Editor
EXPLAIN ANALYZE
SELECT * FROM leaderboard_metrics
WHERE challenge_id = 'uuid'
ORDER BY current_streak DESC
LIMIT 20;

-- Should show index usage, not full table scans
```

### Monitor API Performance
1. Vercel Dashboard → Functions
2. See response times
3. Identify slow endpoints
4. Add caching if needed

---

## Backup & Recovery

### Export Supabase Data
```bash
# Use Supabase CLI
supabase db dump --db-url $DATABASE_URL > backup.sql

# Or manually export in dashboard:
# Settings → Export → Custom Export
```

### Restore from Backup
```bash
# Use Supabase CLI
supabase db restore --db-url $DATABASE_URL < backup.sql
```

---

## Additional Resources

### Documentation
- [QUICK_START.md](QUICK_START.md) - 4-step setup
- [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) - Detailed guide
- [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) - Technical details
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [FILES_CREATED.md](FILES_CREATED.md) - File listing

### Official Docs
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

---

## Quick Command Summary

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Check code quality
npm run format                 # Format code

# Deployment
vercel                         # Deploy to preview
vercel --prod                  # Deploy to production

# Database
# Run: docs/SUPABASE_SETUP.sql in Supabase SQL Editor

# Testing
curl http://localhost:3000/api/health  # Check server
```

---

**Remember:** All commands assume you're in the project root directory.  
**Path**: `/home/dhivakar_kd/VSProjects/Habit-Streak`
