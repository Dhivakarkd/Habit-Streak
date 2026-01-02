import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, LeaderboardEntry } from '@/lib/types';

type SortFilter = 'current-streak' | 'best-streak' | 'completion-rate' | 'missed-days';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<LeaderboardEntry[]>>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = (searchParams.get('filter') as SortFilter) || 'current-streak';
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'challengeId is required',
        },
        { status: 400 }
      );
    }

    // Get leaderboard metrics for the challenge, sorted by the selected filter
    let query = supabase
      .from('leaderboard_metrics')
      .select(
        `
        user_id,
        current_streak,
        best_streak,
        completion_rate,
        total_completions,
        missed_days_count,
        users(username, avatar_url)
      `
      )
      .eq('challenge_id', challengeId);

    // Apply sorting based on filter
    switch (filter) {
      case 'current-streak':
        query = query.order('current_streak', { ascending: false });
        break;
      case 'best-streak':
        query = query.order('best_streak', { ascending: false });
        break;
      case 'completion-rate':
        query = query.order('completion_rate', { ascending: false });
        break;
      case 'missed-days':
        // Now we can sort by precomputed missed_days_count
        query = query.order('missed_days_count', { ascending: false });
        break;
    }

    const { data: metrics, error } = await query.limit(20);

    if (error) {
      throw error;
    }

    const leaderboardData = metrics || [];

    // Get all user IDs to fetch achievements in one batch query
    const userIds = leaderboardData.map((m: any) => m.user_id);

    // Fetch all achievements for all users in a single query
    const { data: allAchievements } = await supabase
      .from('user_achievements')
      .select(`
        user_id,
        achievement_id,
        achievements(name, description, criteria, icon)
      `)
      .in('user_id', userIds);

    // Group achievements by user_id for quick lookup
    const achievementsByUser: Record<string, any[]> = {};
    (allAchievements || []).forEach((a: any) => {
      if (!achievementsByUser[a.user_id]) {
        achievementsByUser[a.user_id] = [];
      }
      achievementsByUser[a.user_id].push({
        id: a.achievement_id,
        name: a.achievements?.name,
        description: a.achievements?.description,
        criteria: a.achievements?.criteria,
        icon: a.achievements?.icon,
      });
    });

    // Build leaderboard entries without additional queries
    const leaderboard: LeaderboardEntry[] = leaderboardData.map((metric: any, index: number) => ({
      rank: index + 1,
      userId: metric.user_id,
      username: metric.users?.username || 'Unknown',
      avatarUrl: metric.users?.avatar_url,
      currentStreak: metric.current_streak,
      bestStreak: metric.best_streak,
      completionRate: metric.completion_rate,
      totalCompletions: metric.total_completions,
      missedDays: metric.missed_days_count,
      achievements: achievementsByUser[metric.user_id] || [],
    }));

    return NextResponse.json(
      {
        success: true,
        data: leaderboard,
        message: 'Leaderboard retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
