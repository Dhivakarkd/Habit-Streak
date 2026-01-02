-- ============================================
-- RPC FUNCTIONS FOR PERFORMANCE OPTIMIZATION
-- Run this in Supabase SQL Editor to enable server-side joins
-- ============================================

-- Function 1: Get User Dashboard Data
-- Returns joined data for challenges the user has joined, including their specific metrics
CREATE OR REPLACE FUNCTION get_user_dashboard(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  current_streak integer,
  best_streak integer,
  completion_rate float,
  is_member boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.category,
    c.created_by,
    c.created_at,
    c.updated_at,
    COALESCE(lm.current_streak, 0) as current_streak,
    COALESCE(lm.best_streak, 0) as best_streak,
    COALESCE(lm.completion_rate, 0) as completion_rate,
    true as is_member
  FROM 
    challenges c
  INNER JOIN 
    challenge_members cm ON c.id = cm.challenge_id
  LEFT JOIN 
    leaderboard_metrics lm ON c.id = lm.challenge_id AND lm.user_id = p_user_id
  WHERE 
    cm.user_id = p_user_id
  ORDER BY 
    c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Get Discover Challenges
-- Returns all challenges with a flag indicating if the requesting user is a member
CREATE OR REPLACE FUNCTION get_discover_challenges(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  current_streak integer,
  best_streak integer,
  is_member boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.category,
    c.created_by,
    c.created_at,
    c.updated_at,
    COALESCE(lm.current_streak, 0) as current_streak,
    COALESCE(lm.best_streak, 0) as best_streak,
    CASE 
      WHEN p_user_id IS NULL THEN false
      WHEN cm.user_id IS NOT NULL THEN true 
      ELSE false 
    END as is_member
  FROM 
    challenges c
  LEFT JOIN 
    challenge_members cm ON c.id = cm.challenge_id AND cm.user_id = p_user_id
  LEFT JOIN 
    leaderboard_metrics lm ON c.id = lm.challenge_id AND lm.user_id = p_user_id
  ORDER BY 
    c.created_at DESC;
END;
$$ LANGUAGE plpgsql;
