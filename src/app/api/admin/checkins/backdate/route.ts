import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
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
    const { userId: targetUserId, challengeId, date, status } = body;

    if (!targetUserId || !challengeId || !date || !status) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Upsert check-in
    const { error: upsertError } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: targetUserId,
          challenge_id: challengeId,
          check_in_date: date,
          status,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'challenge_id,user_id,check_in_date',
        }
      );

    if (upsertError) {
      console.error('Check-in upsert error:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to update check-in' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: targetUserId,
        challengeId,
        date,
        status,
      },
    });
  } catch (error) {
    console.error('Backdate check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
