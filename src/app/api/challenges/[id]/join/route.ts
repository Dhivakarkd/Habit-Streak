import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;
    console.log('[JOIN CHALLENGE API] Joining challenge:', id);

    // Get user ID from header
    const userId = request.headers.get('X-User-ID');
    console.log('[JOIN CHALLENGE API] User ID from header:', userId || 'none');

    if (!userId) {
      console.log('[JOIN CHALLENGE API] No user ID provided');
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
      console.error('[JOIN CHALLENGE API] Missing Supabase env vars');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check if user profile exists, if not create it
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      console.log('[JOIN CHALLENGE API] User profile not found, creating it...');
      
      // Create a basic user profile with a generic username
      // This is just a fallback - ideally users should have profiles from signup
      const username = `user_${userId.substring(0, 8)}`;
      const { error: createUserError } = await supabase.from('users').insert({
        id: userId,
        email: `${username}@example.com`,
        username: username,
        display_name: username,
        is_admin: false,
        can_create_challenges: false,
      });

      if (createUserError) {
        console.error('[JOIN CHALLENGE API] Failed to create user profile:', createUserError);
        // Don't throw - continue and see if the profile already exists
      } else {
        console.log('[JOIN CHALLENGE API] User profile created with username:', username);
      }
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('challenge_members')
      .select('id')
      .eq('challenge_id', id)
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      console.log('[JOIN CHALLENGE API] User already a member');
      return NextResponse.json(
        {
          success: false,
          error: 'You are already a member of this challenge',
        },
        { status: 400 }
      );
    }

    // Add user to challenge
    const { error: joinError } = await supabase.from('challenge_members').insert({
      challenge_id: id,
      user_id: userId,
    });

    if (joinError) {
      console.error('[JOIN CHALLENGE API] Join error:', joinError);
      throw joinError;
    }

    console.log('[JOIN CHALLENGE API] Successfully joined challenge');

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully joined challenge',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[JOIN CHALLENGE API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
