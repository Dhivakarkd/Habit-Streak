import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, Checkin } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Checkin[]>>> {
  try {
    const { id } = await params;
    console.log('[CHECKIN HISTORY API] Fetching check-in history for challenge:', id);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[CHECKIN HISTORY API] Missing Supabase env vars');
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
    console.log('[CHECKIN HISTORY API] User ID from header:', userId || 'none');

    if (!userId) {
      const token = request.cookies.get('sb-access-token')?.value;
      if (token) {
        supabase.auth.setSession({
          access_token: token,
          refresh_token: request.cookies.get('sb-refresh-token')?.value || '',
        } as any);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    if (!userId) {
      console.error('[CHECKIN HISTORY API] User not authenticated');
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated',
        },
        { status: 401 }
      );
    }

    console.log('[CHECKIN HISTORY API] Final userId:', userId);

    // Calculate date range: current month + previous 2 months (90 days)
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    const startDate = ninetyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD
    const endDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log('[CHECKIN HISTORY API] Fetching check-ins from', startDate, 'to', endDate);

    // Fetch all check-ins for this user in this challenge within the date range
    const { data: checkins, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('challenge_id', id)
      .eq('user_id', userId)
      .gte('check_in_date', startDate)
      .lte('check_in_date', endDate)
      .order('check_in_date', { ascending: false });

    if (error) {
      console.error('[CHECKIN HISTORY API] Error fetching check-ins:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch check-in history',
        },
        { status: 500 }
      );
    }

    console.log('[CHECKIN HISTORY API] Found', checkins?.length || 0, 'check-ins');

    // Format response to match Checkin type
    const formattedCheckins: Checkin[] = (checkins || []).map((c: any) => ({
      id: c.id,
      challengeId: c.challenge_id,
      userId: c.user_id,
      date: c.check_in_date,
      status: c.status,
      createdAt: c.created_at,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedCheckins,
        message: 'Check-in history retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CHECKIN HISTORY API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
