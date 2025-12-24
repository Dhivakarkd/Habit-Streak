import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/lib/types';

interface ChallengeMember {
  userId: string;
  username: string;
  email: string;
  currentStreak?: number;
  completionRate?: number;
  checkins?: Array<{ date: string; status: 'completed' | 'missed' | 'pending' }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ChallengeMember[]>>> {
  try {
    const { id } = await params;
    
    const userId = request.headers.get('X-User-ID');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get challenge members with user details
    const { data: members, error: membersError } = await supabase
      .from('challenge_members')
      .select(
        `
        user_id,
        users (username, email)
      `
      )
      .eq('challenge_id', id);

    if (membersError) {
      console.error('Members query error:', membersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    // Get leaderboard metrics for all members
    const memberIds = (members || []).map((m: any) => m.user_id);
    
    const { data: metrics, error: metricsError } = await supabase
      .from('leaderboard_metrics')
      .select('user_id, current_streak, completion_rate')
      .eq('challenge_id', id)
      .in('user_id', memberIds.length > 0 ? memberIds : ['00000000-0000-0000-0000-000000000000']);

    if (metricsError) {
      console.error('Metrics query error:', metricsError);
    }

    // Get check-ins for all members in this challenge
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('user_id, check_in_date, status')
      .eq('challenge_id', id)
      .order('check_in_date', { ascending: false });

    if (checkinsError) {
      console.error('Checkins query error:', checkinsError);
    }

    // Build metrics map for quick lookup
    const metricsMap = new Map();
    (metrics || []).forEach((m: any) => {
      metricsMap.set(m.user_id, {
        currentStreak: m.current_streak || 0,
        completionRate: m.completion_rate || 0,
      });
    });

    // Transform response
    const transformedMembers: ChallengeMember[] = (members || []).map((m: any) => {
      const memberMetrics = metricsMap.get(m.user_id) || { currentStreak: 0, completionRate: 0 };
      const memberCheckins = (checkins || [])
        .filter((c: any) => c.user_id === m.user_id)
        .map((c: any) => ({
          date: c.check_in_date,
          status: c.status as 'completed' | 'missed' | 'pending',
        }));

      return {
        userId: m.user_id,
        username: m.users?.username || 'Unknown',
        email: m.users?.email || '',
        currentStreak: memberMetrics.currentStreak,
        completionRate: memberMetrics.completionRate,
        checkins: memberCheckins,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedMembers,
    });
  } catch (error) {
    console.error('Admin challenge members GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
