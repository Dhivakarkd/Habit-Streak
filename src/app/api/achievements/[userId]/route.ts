import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse, AchievementEarned } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse<ApiResponse<AchievementEarned[]>>> {
  try {
    const { userId } = params;

    // Verify the user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Get user's achievements
    const { data: achievements, error } = await supabase
      .from('user_achievements')
      .select(
        `
        id,
        earned_at,
        achievements(id, name, description, icon, criteria)
      `
      )
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      throw error;
    }

    const formattedAchievements: AchievementEarned[] = (achievements || []).map((achievement: any) => ({
      id: achievement.id,
      userId,
      achievementId: achievement.achievements?.id,
      achievement: {
        id: achievement.achievements?.id,
        name: achievement.achievements?.name,
        description: achievement.achievements?.description,
        icon: achievement.achievements?.icon,
        criteria: achievement.achievements?.criteria,
      },
      earnedAt: achievement.earned_at,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedAchievements,
        message: 'Achievements retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
