import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkinSchema } from '@/lib/schemas/checkin.schema';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  try {
    console.log('[CHECKINS API] Starting check-in');

    // Get user ID from header
    const userId = request.headers.get('X-User-ID');
    console.log('[CHECKINS API] User ID from header:', userId || 'none');

    if (!userId) {
      console.log('[CHECKINS API] No user ID provided');
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
      console.error('[CHECKINS API] Missing Supabase env vars');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await request.json();
    console.log('[CHECKINS API] Request body:', body);

    // Validate request body
    const validation = checkinSchema.safeParse(body);
    if (!validation.success) {
      console.error('[CHECKINS API] Validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { challengeId, date, status } = validation.data;
    console.log('[CHECKINS API] Validated data:', { challengeId, date, status, userId });

    // Check if user profile exists, if not create it
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      console.log('[CHECKINS API] User profile not found, creating it...');
      
      const { error: createUserError } = await supabase.from('users').insert({
        id: userId,
        email: 'user@example.com',
        username: `user_${userId.substring(0, 8)}`,
        display_name: 'User',
        is_admin: false,
        can_create_challenges: false,
      });

      if (createUserError) {
        console.error('[CHECKINS API] Failed to create user profile:', createUserError);
        // Continue anyway
      } else {
        console.log('[CHECKINS API] User profile created');
      }
    }

    // Check if user is a member of the challenge
    const { data: membership, error: memberError } = await supabase
      .from('challenge_members')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      console.log('[CHECKINS API] User not a member of challenge:', challengeId);
      return NextResponse.json(
        {
          success: false,
          error: 'You are not a member of this challenge',
        },
        { status: 403 }
      );
    }

    console.log('[CHECKINS API] User is a member, recording check-in');

    // First check if a check-in already exists for this date
    const { data: existingCheckin } = await supabase
      .from('checkins')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .eq('check_in_date', date)
      .single();

    let checkinError;

    if (existingCheckin) {
      // Update existing check-in
      console.log('[CHECKINS API] Updating existing check-in');
      const { error } = await supabase
        .from('checkins')
        .update({ status })
        .eq('id', existingCheckin.id);
      checkinError = error;
    } else {
      // Insert new check-in
      console.log('[CHECKINS API] Inserting new check-in');
      const { error } = await supabase.from('checkins').insert({
        challenge_id: challengeId,
        user_id: userId,
        check_in_date: date,
        status,
      });
      checkinError = error;
    }

    if (checkinError) {
      console.error('[CHECKINS API] Check-in error:', checkinError);
      throw checkinError;
    }

    console.log('[CHECKINS API] Check-in recorded successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Check-in recorded successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CHECKINS API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
