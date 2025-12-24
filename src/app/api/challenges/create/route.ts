import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createChallengeSchema } from '@/lib/schemas/challenge.schema';
import { ApiResponse, Challenge } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Challenge>>> {
  try {
    // Get user ID from header
    const userId = request.headers.get('X-User-ID');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Create a Supabase client for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check if user is admin or has permission to create challenges
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin, can_create_challenges')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    if (!userData.is_admin && !userData.can_create_challenges) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to create challenges',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = createChallengeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { name, description, category, userIds = [], addCreator = true } = validation.data;

    // Create challenge
    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        name,
        description,
        category,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Add creator as member if enabled
    if (addCreator) {
      await supabase.from('challenge_members').insert({
        challenge_id: challenge.id,
        user_id: userId,
      });

      // Initialize leaderboard metrics for creator
      await supabase.from('leaderboard_metrics').insert({
        challenge_id: challenge.id,
        user_id: userId,
        current_streak: 0,
        best_streak: 0,
        completion_rate: 0,
        total_completions: 0,
      });
    }

    // Add selected users as members
    if (userIds && userIds.length > 0) {
      const memberInserts = userIds.map((userId) => ({
        challenge_id: challenge.id,
        user_id: userId,
      }));
      
      await supabase.from('challenge_members').insert(memberInserts);

      // Initialize leaderboard metrics for invited users
      const metricsInserts = userIds.map((userId) => ({
        challenge_id: challenge.id,
        user_id: userId,
        current_streak: 0,
        best_streak: 0,
        completion_rate: 0,
        total_completions: 0,
      }));

      await supabase.from('leaderboard_metrics').insert(metricsInserts);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: challenge.id,
          name: challenge.name,
          description: challenge.description,
          category: challenge.category,
          createdBy: challenge.created_by,
          createdAt: challenge.created_at,
          updatedAt: challenge.updated_at,
        },
        message: 'Challenge created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
