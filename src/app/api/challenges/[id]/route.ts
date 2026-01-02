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

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Run all database queries in parallel for better performance
    const [challengeResult, membersResult, checkinsResult, metricsResult] = await Promise.all([
      // Fetch the challenge
      supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single(),

      // Fetch members for this challenge
      supabase
        .from('challenge_members')
        .select(`
          user_id,
          users(id, username, display_name, avatar_url)
        `)
        .eq('challenge_id', id),

      // Fetch today's check-ins for this challenge
      supabase
        .from('checkins')
        .select('user_id, status')
        .eq('challenge_id', id)
        .eq('check_in_date', today),

      // Fetch user's streak and metrics for this challenge (if userId exists)
      userId
        ? supabase
          .from('leaderboard_metrics')
          .select('current_streak, best_streak')
          .eq('challenge_id', id)
          .eq('user_id', userId)
          .single()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const { data: challenge, error } = challengeResult;
    const { data: members, error: membersError } = membersResult;
    const { data: todayCheckins, error: checkinsError } = checkinsResult;
    const { data: metrics, error: metricsError } = metricsResult;

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

    if (membersError) {
      console.error('[CHALLENGE DETAIL API] Error fetching members:', membersError);
    }

    if (checkinsError) {
      console.error('[CHALLENGE DETAIL API] Error fetching check-ins:', checkinsError);
    }

    console.log('[CHALLENGE DETAIL API] Today check-ins:', todayCheckins?.length || 0);

    // Extract metrics
    let currentStreak = 0;
    let bestStreak = 0;

    if (userId && metrics && !metricsError) {
      currentStreak = metrics.current_streak;
      bestStreak = metrics.best_streak;
      console.log('[CHALLENGE DETAIL API] Metrics found:', { currentStreak, bestStreak });
    } else if (userId && metricsError) {
      console.log('[CHALLENGE DETAIL API] No metrics found for user (normal if just joined)');
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
          email: m.users.email || '',
          username: m.users.username,
          displayName: m.users.display_name,
          avatarUrl: m.users.avatar_url,
          bio: m.users.bio,
          isAdmin: m.users.is_admin || false,
          isSuperAdmin: m.users.is_super_admin || false,
          canCreateChallenges: m.users.can_create_challenges || false,
          createdAt: m.users.created_at || new Date().toISOString(),
          updatedAt: m.users.updated_at || new Date().toISOString(),
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
