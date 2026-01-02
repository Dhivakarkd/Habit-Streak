import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, Challenge } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Challenge[]>>> {
  try {
    console.log('[CHALLENGES API] Starting GET request');

    // Check for query parameter to get all challenges
    const searchParams = request.nextUrl.searchParams;
    const showAll = searchParams.get('all') === 'true';
    console.log('[CHALLENGES API] Show all challenges:', showAll);

    // Create a Supabase client for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[CHALLENGES API] Missing Supabase env vars');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Authenticate user via Supabase Auth
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    console.log('[CHALLENGES API] Token present:', !!token, 'Length:', token?.length);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token || undefined);

    if (authError) {
      console.error('[CHALLENGES API] getUser error:', authError.message);
    }

    console.log('[CHALLENGES API] getUser result:', user?.id || 'null');

    const userId = user?.id || null;
    console.log('[CHALLENGES API] Authenticated User ID:', userId || 'none');

    // If showAll=false (default) and user exists, return only user's joined challenges with streaks
    if (!showAll && userId) {
      console.log('[CHALLENGES API] Fetching challenges joined by user:', userId);

      const { data: memberships, error: memberError } = await supabase
        .from('challenge_members')
        .select('challenge_id')
        .eq('user_id', userId);

      if (memberError) {
        console.error('[CHALLENGES API] Membership query error:', memberError);
      } else if (memberships && memberships.length > 0) {
        const challengeIds = memberships.map(m => m.challenge_id);

        const { data: challenges, error } = await supabase
          .from('challenges')
          .select('*')
          .in('id', challengeIds)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[CHALLENGES API] Challenges query error:', error);
        } else {
          console.log('[CHALLENGES API] Found user joined challenges:', challenges?.length || 0);

          // Fetch user's streak metrics for each challenge
          const { data: metrics, error: metricsError } = await supabase
            .from('leaderboard_metrics')
            .select('challenge_id, current_streak, best_streak')
            .eq('user_id', userId)
            .in('challenge_id', challengeIds);

          if (metricsError) {
            console.error('[CHALLENGES API] Metrics query error:', metricsError);
          }

          const metricsMap = new Map((metrics || []).map(m => [m.challenge_id, m]));

          return NextResponse.json(
            {
              success: true,
              data: (challenges || []).map((challenge) => {
                const userMetrics = metricsMap.get(challenge.id);
                return {
                  id: challenge.id,
                  name: challenge.name,
                  description: challenge.description,
                  category: challenge.category,
                  createdBy: challenge.created_by,
                  createdAt: challenge.created_at,
                  updatedAt: challenge.updated_at,
                  currentStreak: userMetrics?.current_streak || 0,
                  bestStreak: userMetrics?.best_streak || 0,
                };
              }),
              message: 'User challenges retrieved successfully',
            },
            { status: 200 }
          );
        }
      } else {
        console.log('[CHALLENGES API] User has no joined challenges');
        return NextResponse.json(
          {
            success: true,
            data: [],
            message: 'No joined challenges',
          },
          { status: 200 }
        );
      }
    }

    // If showAll=true OR no user, return all challenges with user's streak data (if user exists)
    console.log('[CHALLENGES API] Fetching all challenges');
    const { data: allChallenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (challengesError) {
      console.error('[CHALLENGES API] Challenges query error:', challengesError);
      throw challengesError;
    }

    console.log('[CHALLENGES API] Found all challenges:', allChallenges?.length || 0);

    // If we have a user, fetch their streak metrics for all challenges
    let metricsMap = new Map();
    if (userId) {
      console.log('[CHALLENGES API] Fetching metrics for user:', userId);
      const { data: metrics, error: metricsError } = await supabase
        .from('leaderboard_metrics')
        .select('challenge_id, current_streak, best_streak')
        .eq('user_id', userId);

      if (metricsError) {
        console.error('[CHALLENGES API] Metrics query error:', metricsError);
      }

      metricsMap = new Map((metrics || []).map(m => [m.challenge_id, m]));
    }

    return NextResponse.json(
      {
        success: true,
        data: (allChallenges || []).map((challenge) => {
          const userMetrics = metricsMap.get(challenge.id);
          return {
            id: challenge.id,
            name: challenge.name,
            description: challenge.description,
            category: challenge.category,
            createdBy: challenge.created_by,
            createdAt: challenge.created_at,
            updatedAt: challenge.updated_at,
            currentStreak: userMetrics?.current_streak || 0,
            bestStreak: userMetrics?.best_streak || 0,
          };
        }),
        message: 'Challenges retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CHALLENGES API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
