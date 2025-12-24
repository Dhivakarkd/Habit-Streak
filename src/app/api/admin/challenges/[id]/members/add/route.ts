import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
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

    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'userIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Add members to challenge
    const { data: added, error: addError } = await supabase
      .from('challenge_members')
      .insert(
        userIds.map((uid: string) => ({
          challenge_id: id,
          user_id: uid,
        }))
      )
      .select();

    if (addError) {
      console.error('Failed to add members:', addError);
      // Check if it's a constraint violation (already a member)
      if (addError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Some users are already members of this challenge' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to add members' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        challengeId: id,
        addedCount: added?.length || 0,
      },
    });
  } catch (error) {
    console.error('Admin add members error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
