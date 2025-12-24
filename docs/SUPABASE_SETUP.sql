/**
 * SUPABASE DATABASE SETUP GUIDE
 * 
 * This file contains SQL commands to set up your Supabase database.
 * Run these in the Supabase SQL Editor: https://app.supabase.com/project/[YOUR_PROJECT_ID]/sql
 * 
 * This script is idempotent - safe to run multiple times to reset the database
 */

-- ============================================
-- 0. CLEANUP - DROP EXISTING OBJECTS IN REVERSE DEPENDENCY ORDER
-- ============================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_grant_achievements ON checkins;
DROP TRIGGER IF EXISTS trigger_calculate_streaks ON checkins;

-- Drop functions
DROP FUNCTION IF EXISTS grant_achievements();
DROP FUNCTION IF EXISTS calculate_streaks();

-- Drop tables in reverse dependency order (respecting foreign keys)
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS leaderboard_metrics;
DROP TABLE IF EXISTS checkins;
DROP TABLE IF EXISTS challenge_members;
DROP TABLE IF EXISTS challenges;
DROP TABLE IF EXISTS users;

-- ============================================
-- 1. USERS TABLE (linked to auth.users)
-- ============================================
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  is_admin boolean DEFAULT false,
  is_super_admin boolean DEFAULT false,
  can_create_challenges boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- 2. CHALLENGES TABLE
-- ============================================
CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('Fitness', 'Wellness', 'Productivity', 'Learning', 'Creative')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  is_archived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on category for faster filtering
CREATE INDEX idx_challenges_category ON challenges(category);

-- ============================================
-- 3. CHALLENGE MEMBERS (many-to-many)
-- ============================================
CREATE TABLE challenge_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Create indexes for efficient joins
CREATE INDEX idx_challenge_members_challenge_id ON challenge_members(challenge_id);
CREATE INDEX idx_challenge_members_user_id ON challenge_members(user_id);

-- ============================================
-- 4. CHECK-INS TABLE
-- ============================================
CREATE TABLE checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('completed', 'missed', 'pending')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(challenge_id, user_id, check_in_date)
);

-- Create indexes for efficient queries
CREATE INDEX idx_checkins_challenge_id ON checkins(challenge_id);
CREATE INDEX idx_checkins_user_id ON checkins(user_id);
CREATE INDEX idx_checkins_check_in_date ON checkins(check_in_date);

-- ============================================
-- 5. LEADERBOARD METRICS TABLE
-- ============================================
CREATE TABLE leaderboard_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  completion_rate float DEFAULT 0,
  total_completions integer DEFAULT 0,
  missed_days_count integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_leaderboard_metrics_challenge_id ON leaderboard_metrics(challenge_id);
CREATE INDEX idx_leaderboard_metrics_user_id ON leaderboard_metrics(user_id);
CREATE INDEX idx_leaderboard_metrics_current_streak ON leaderboard_metrics(current_streak DESC);
CREATE INDEX idx_leaderboard_metrics_completion_rate ON leaderboard_metrics(completion_rate DESC);
CREATE INDEX idx_leaderboard_metrics_missed_days ON leaderboard_metrics(missed_days_count DESC);

-- ============================================
-- 6. ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  criteria text NOT NULL CHECK (criteria IN ('streak_7', 'streak_30', 'streak_100', 'perfect_week', 'first_completion', 'comeback')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(criteria)
);

-- Create index on criteria for faster lookups
CREATE INDEX idx_achievements_criteria ON achievements(criteria);

-- ============================================
-- 7. USER ACHIEVEMENTS (earned badges)
-- ============================================
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- ============================================
-- 8. SEED DEFAULT ACHIEVEMENTS
-- ============================================
INSERT INTO achievements (name, description, icon, criteria) VALUES
  ('7-Day Streak', 'Complete 7 consecutive days', '🔥', 'streak_7'),
  ('30-Day Streak', 'Complete 30 consecutive days', '🌟', 'streak_30'),
  ('100-Day Streak', 'Complete 100 consecutive days', '💯', 'streak_100'),
  ('Perfect Week', 'Complete 7/7 days in a week', '✨', 'perfect_week'),
  ('First Completion', 'Complete your first check-in', '🚀', 'first_completion'),
  ('Comeback', 'Return to a challenge after missing days', '💪', 'comeback')
ON CONFLICT(criteria) DO NOTHING;

-- ============================================
-- 9. SEED DEFAULT CHALLENGES
-- ============================================
INSERT INTO challenges (name, description, category, created_by) VALUES
  ('Fitness Quest', 'Complete daily fitness exercises and build a strong habit.', 'Fitness', NULL),
  ('Daily Reading', 'Read for at least 30 minutes every day to expand knowledge.', 'Learning', NULL),
  ('Mindfulness', 'Practice daily meditation or mindfulness for mental clarity.', 'Wellness', NULL),
  ('Code Daily', 'Write code or contribute to projects every single day.', 'Productivity', NULL),
  ('Creative Hour', 'Dedicate an hour daily to creative pursuits and projects.', 'Creative', NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. TRIGGER FOR STREAK RECALCULATION
-- ============================================
CREATE OR REPLACE FUNCTION calculate_streaks()
RETURNS TRIGGER AS $$
DECLARE
  v_current_streak integer := 0;
  v_best_streak integer := 0;
  v_total_completions integer := 0;
  v_missed_days_count integer := 0;
  v_completion_rate float := 0;
  v_challenge_days integer := 0;
BEGIN
  -- Get total completed check-ins
  SELECT COUNT(*) INTO v_total_completions
  FROM checkins
  WHERE challenge_id = NEW.challenge_id
    AND user_id = NEW.user_id
    AND status = 'completed';

  -- Get total missed days
  SELECT COUNT(*) INTO v_missed_days_count
  FROM checkins
  WHERE challenge_id = NEW.challenge_id
    AND user_id = NEW.user_id
    AND status = 'missed';

  -- Calculate current streak (consecutive completed days)
  WITH consecutive_completed AS (
    SELECT
      check_in_date,
      ROW_NUMBER() OVER (ORDER BY check_in_date DESC) -
      (CURRENT_DATE - check_in_date) AS grp
    FROM checkins
    WHERE challenge_id = NEW.challenge_id
      AND user_id = NEW.user_id
      AND status = 'completed'
    ORDER BY check_in_date DESC
  )
  SELECT COUNT(*) INTO v_current_streak
  FROM consecutive_completed
  WHERE grp = (SELECT MAX(grp) FROM consecutive_completed);

  -- Calculate best streak
  WITH streaks AS (
    SELECT
      check_in_date,
      status,
      SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END)
        OVER (ORDER BY check_in_date) AS streak_group
    FROM checkins
    WHERE challenge_id = NEW.challenge_id
      AND user_id = NEW.user_id
  ),
  streak_counts AS (
    SELECT COUNT(*) as streak_length
    FROM streaks
    WHERE status = 'completed'
    GROUP BY streak_group
  )
  SELECT COALESCE(MAX(streak_length), 0) INTO v_best_streak
  FROM streak_counts;

  -- Get total days in challenge (from first check-in to now)
  SELECT COUNT(DISTINCT check_in_date) INTO v_challenge_days
  FROM checkins
  WHERE challenge_id = NEW.challenge_id
    AND user_id = NEW.user_id;

  -- Calculate completion rate
  IF v_challenge_days > 0 THEN
    v_completion_rate := (v_total_completions::float / v_challenge_days::float) * 100;
  END IF;

  -- Update or insert leaderboard metrics
  INSERT INTO leaderboard_metrics (challenge_id, user_id, current_streak, best_streak, completion_rate, total_completions, missed_days_count)
  VALUES (NEW.challenge_id, NEW.user_id, v_current_streak, v_best_streak, v_completion_rate, v_total_completions, v_missed_days_count)
  ON CONFLICT (challenge_id, user_id) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    best_streak = EXCLUDED.best_streak,
    completion_rate = EXCLUDED.completion_rate,
    total_completions = EXCLUDED.total_completions,
    missed_days_count = EXCLUDED.missed_days_count,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to checkins table
DROP TRIGGER IF EXISTS trigger_calculate_streaks ON checkins;
CREATE TRIGGER trigger_calculate_streaks
AFTER INSERT OR UPDATE ON checkins
FOR EACH ROW
EXECUTE FUNCTION calculate_streaks();

-- ============================================
-- 11. TRIGGER FOR ACHIEVEMENT GRANTING
-- ============================================
CREATE OR REPLACE FUNCTION grant_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_streaks record;
  v_completion_count integer;
  v_perfect_week_days integer;
BEGIN
  -- Only process on completed check-ins
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get current streak data
  SELECT current_streak, best_streak INTO v_streaks
  FROM leaderboard_metrics
  WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;

  -- Grant 7-Day Streak achievement
  IF v_streaks.current_streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT NEW.user_id, id FROM achievements WHERE criteria = 'streak_7'
    ON CONFLICT(user_id, achievement_id) DO NOTHING;
  END IF;

  -- Grant 30-Day Streak achievement
  IF v_streaks.current_streak >= 30 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT NEW.user_id, id FROM achievements WHERE criteria = 'streak_30'
    ON CONFLICT(user_id, achievement_id) DO NOTHING;
  END IF;

  -- Grant 100-Day Streak achievement
  IF v_streaks.current_streak >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT NEW.user_id, id FROM achievements WHERE criteria = 'streak_100'
    ON CONFLICT(user_id, achievement_id) DO NOTHING;
  END IF;

  -- Check for Perfect Week (7 consecutive completed days within last 7 days)
  SELECT COUNT(*) INTO v_perfect_week_days
  FROM checkins
  WHERE challenge_id = NEW.challenge_id
    AND user_id = NEW.user_id
    AND status = 'completed'
    AND check_in_date >= CURRENT_DATE - INTERVAL '6 days'
    AND check_in_date <= CURRENT_DATE;

  IF v_perfect_week_days >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT NEW.user_id, id FROM achievements WHERE criteria = 'perfect_week'
    ON CONFLICT(user_id, achievement_id) DO NOTHING;
  END IF;

  -- Grant First Completion achievement
  SELECT COUNT(*) INTO v_completion_count
  FROM checkins
  WHERE challenge_id = NEW.challenge_id
    AND user_id = NEW.user_id
    AND status = 'completed';

  IF v_completion_count = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT NEW.user_id, id FROM achievements WHERE criteria = 'first_completion'
    ON CONFLICT(user_id, achievement_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to checkins table
DROP TRIGGER IF EXISTS trigger_grant_achievements ON checkins;
CREATE TRIGGER trigger_grant_achievements
AFTER INSERT OR UPDATE ON checkins
FOR EACH ROW
EXECUTE FUNCTION grant_achievements();

-- ============================================
-- 12. ENABLE ROW LEVEL SECURITY (Optional - for later)
-- ============================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE challenge_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leaderboard_metrics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USAGE NOTES
-- ============================================
-- 
-- This script is IDEMPOTENT - you can run it multiple times safely.
-- 
-- To reset the database:
-- 1. Open Supabase SQL Editor
-- 2. Copy-paste this entire script
-- 3. Click "Run" - it will:
--    a) Drop all existing tables, triggers, and functions
--    b) Recreate everything from scratch
--    c) Seed default achievements and challenges
-- 
-- All user check-in data will be cleared. Supabase auth.users remain untouched.
-- 
-- IMPORTANT: This only resets the application tables, NOT the Supabase auth schema.
-- To completely reset auth users, use Supabase Dashboard → Authentication → Users.

