import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, Challenge } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Challenge>>> {
  try {
    const { id } = await params;
    console.log('[CHALLENGE DETAIL API] Fetching challenge:', id);

    // Create a Supabase client for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[CHALLENGE DETAIL API] Missing Supabase env vars');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get user ID from header first (priority), then try cookies
    let userId = request.headers.get('X-User-ID');
    console.log('[CHALLENGE DETAIL API] User ID from header:', userId || 'none');

    if (!userId) {
      // Fallback to cookie-based auth
      const token = request.cookies.get('sb-access-token')?.value;
      console.log('[CHALLENGE DETAIL API] Token from cookies:', token ? 'present' : 'missing');

      if (token) {
        supabase.auth.setSession({
          access_token: token,
          refresh_token: request.cookies.get('sb-refresh-token')?.value || '',
        } as any);
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log('[CHALLENGE DETAIL API] User from session:', user?.id || 'none');
      userId = user?.id || null;
    }

    console.log('[CHALLENGE DETAIL API] Final userId:', userId);

    // Fetch the challenge
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !challenge) {
      console.error('[CHALLENGE DETAIL API] Challenge not found:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Challenge not found',
        },
        { status: 404 }
      );
    }

    console.log('[CHALLENGE DETAIL API] Challenge found:', challenge.id);

    // Fetch members for this challenge
    const { data: members, error: membersError } = await supabase
      .from('challenge_members')
      .select(
        `
        user_id,
        users(id, username, display_name, avatar_url)
      `
      )
      .eq('challenge_id', id);

    if (membersError) {
      console.error('[CHALLENGE DETAIL API] Error fetching members:', membersError);
    }

    // Fetch today's check-ins for this challenge
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: todayCheckins, error: checkinsError } = await supabase
      .from('checkins')
      .select('user_id, status')
      .eq('challenge_id', id)
      .eq('check_in_date', today);

    if (checkinsError) {
      console.error('[CHALLENGE DETAIL API] Error fetching check-ins:', checkinsError);
    }

    console.log('[CHALLENGE DETAIL API] Today check-ins:', todayCheckins?.length || 0);

    // Fetch user's streak and metrics for this challenge
    let currentStreak = 0;
    let bestStreak = 0;

    if (userId) {
      console.log('[CHALLENGE DETAIL API] Fetching metrics for user:', userId);
      const { data: metrics, error: metricsError } = await supabase
        .from('leaderboard_metrics')
        .select('current_streak, best_streak')
        .eq('challenge_id', id)
        .eq('user_id', userId)
        .single();

      if (metricsError) {
        console.log('[CHALLENGE DETAIL API] No metrics found for user (normal if just joined)');
      } else if (metrics) {
        currentStreak = metrics.current_streak;
        bestStreak = metrics.best_streak;
        console.log('[CHALLENGE DETAIL API] Metrics found:', { currentStreak, bestStreak });
      }
    }

    // Format response
    const responseData: Challenge = {
      id: challenge.id,
      name: challenge.name,
      description: challenge.description,
      category: challenge.category,
      createdBy: challenge.created_by,
      createdAt: challenge.created_at,
      updatedAt: challenge.updated_at,
      currentStreak,
      bestStreak,
      members: members
        ? members.map((m: any) => ({
            id: m.users.id,
            username: m.users.username,
            displayName: m.users.display_name,
            avatarUrl: m.users.avatar_url,
          }))
        : [],
      checkins: todayCheckins
        ? todayCheckins.map((c: any) => ({
            id: c.id || `${c.user_id}-${today}`,
            challengeId: id,
            userId: c.user_id,
            date: today,
            status: c.status,
            createdAt: new Date().toISOString(),
          }))
        : [],
    };

    console.log('[CHALLENGE DETAIL API] Returning challenge with', responseData.members?.length || 0, 'members');

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: 'Challenge retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CHALLENGE DETAIL API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
