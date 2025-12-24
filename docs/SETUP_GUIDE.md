# Supabase Setup & Deployment Guide

## Prerequisites

- Supabase project created at [supabase.com](https://supabase.com)
- Your project URL and anon key available
- `.env.local` file with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 1: Set Up Supabase Database

### 1.1 Run SQL Setup Script

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** section
3. Click **New Query**
4. Copy the entire content from `/docs/SUPABASE_SETUP.sql`
5. Paste it into the SQL editor
6. Click **Run**

This will create:
- 7 database tables with proper relationships
- Database triggers for automatic streak calculation
- Database triggers for automatic achievement granting
- Indexes for optimal query performance
- 6 default achievements
- 5 default challenges

### 1.2 Verify Setup

After running the SQL, verify the tables were created:
1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `users`
   - `challenges`
   - `challenge_members`
   - `checkins`
   - `leaderboard_metrics`
   - `achievements`
   - `user_achievements`

## Step 2: Enable Authentication

1. Go to **Authentication** → **Providers**
2. Ensure "Email" provider is enabled (default)
3. Go to **Authentication** → **URL Configuration**
4. Add your Vercel production URL to "Redirect URLs" (e.g., `https://yourdomain.vercel.app`)
5. Also add `http://localhost:3000` for local development

## Step 3: Test Locally

```bash
cd /home/dhivakar_kd/VSProjects/Habit-Streak

# Make sure .env.local has:
# NEXT_PUBLIC_SUPABASE_URL=your_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Install dependencies (if not done)
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` and test:
1. Sign up with a new account
2. Sign in
3. Try creating/joining a challenge
4. Log a check-in
5. View the leaderboard

## Step 4: Deploy to Vercel

### 4.1 Add Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
   ```
4. Make sure they're set for **Production** environment
5. **Redeploy** your project

### 4.2 Update Supabase Auth URLs

1. Go back to your Supabase dashboard
2. **Authentication** → **URL Configuration**
3. Add your Vercel production URL to "Redirect URLs"
   - Example: `https://habit-streak.vercel.app`

### 4.3 Test Production

Once deployed, test your production deployment:
1. Visit your Vercel URL
2. Sign up with a new account
3. Complete the full flow

## Database Schema Overview

### users
- Linked to Supabase Auth
- Stores user profile data
- `is_admin` and `can_create_challenges` for permission control

### challenges
- Stores challenge metadata
- `created_by` field (NULL for default challenges)
- Categories: Fitness, Wellness, Productivity, Learning, Creative

### challenge_members
- Many-to-many relationship between users and challenges
- Tracks which users are members of which challenges

### checkins
- Daily check-in records
- Status: completed, missed, or pending
- UNIQUE constraint prevents duplicate entries per day

### leaderboard_metrics
- Automatically updated by database triggers
- Stores: current_streak, best_streak, completion_rate, total_completions
- Recalculated after each check-in

### achievements
- Predefined badges users can earn
- 6 default achievements included
- Criteria: streak_7, streak_30, streak_100, perfect_week, first_completion, comeback

### user_achievements
- Tracks which achievements users have earned
- Auto-populated by database triggers

## Database Triggers

### 1. calculate_streaks()
- Runs after every check-in insert/update
- Recalculates all streak metrics
- Updates leaderboard_metrics table

### 2. grant_achievements()
- Runs after every completed check-in
- Auto-grants achievements based on criteria:
  - **streak_7**: Current streak >= 7
  - **streak_30**: Current streak >= 30
  - **streak_100**: Current streak >= 100
  - **perfect_week**: 7 completions in last 7 days
  - **first_completion**: First completion recorded
  - **comeback**: Returns to challenge after missing

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login with username/password
- `POST /api/auth/signout` - Logout

### Challenges
- `GET /api/challenges` - Get user's challenges
- `POST /api/challenges/create` - Create new challenge (admin only)

### Check-ins
- `POST /api/checkins` - Log a check-in

### Leaderboard
- `GET /api/leaderboard?filter=...&challengeId=...` - Get ranked users
  - Filters: `current-streak`, `best-streak`, `completion-rate`, `missed-days`

### Achievements
- `GET /api/achievements/[userId]` - Get user's earned achievements

## Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Ensure `.env.local` has both variables and you've restarted the dev server

### Issue: "Invalid email or password" when signing in
**Solution**: Make sure you're using the correct username and password (auth stores by email internally)

### Issue: Leaderboard shows no data
**Solution**: 
1. Check that you've joined at least one challenge
2. Log a check-in
3. Wait for the database trigger to process (usually instant)

### Issue: Achievements not appearing
**Solution**:
1. Make sure you have completed check-ins
2. Check `user_achievements` table in Supabase
3. Database trigger should auto-grant on check-in completion

## Optional: Enable Row Level Security (RLS)

For production, enable RLS for better security:

1. Go to **Authentication** → **Policies**
2. For each table, create policies:
   - Users can see their own data
   - Leaderboards are publicly readable
   - Only admins can create/modify challenges

See comments in `/docs/SUPABASE_SETUP.sql` for RLS setup queries.

## Support

For issues with:
- **Supabase**: Check [Supabase Docs](https://supabase.com/docs)
- **Next.js**: Check [Next.js Docs](https://nextjs.org/docs)
- **Project**: Review the code comments and schema
