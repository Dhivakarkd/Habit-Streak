import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, Challenge } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Challenge[]>>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const showAll = searchParams.get('all') === 'true';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ success: false, error: 'Server config error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Authenticate
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // Also check X-User-ID as fallback/supplement for some internal calls
    let userId = request.headers.get('X-User-ID');

    if (!userId && token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    console.log('[CHALLENGES API] Token User ID:', userId);
    console.log('[CHALLENGES API] Header X-User-ID:', request.headers.get('X-User-ID'));
    console.log('[CHALLENGES API] Fetching for User:', userId, 'ShowAll:', showAll);

    let data;
    let error;

    // SCENARIO 1: User's Dashboard (My Challenges)
    if (!showAll && userId) {
      console.log('[CHALLENGES API] Using RPC: get_user_dashboard');
      const result = await supabase.rpc('get_user_dashboard', { p_user_id: userId });
      data = result.data;
      error = result.error;
    }
    // SCENARIO 2: Discover / Public Listing
    else {
      console.log('[CHALLENGES API] Using RPC: get_discover_challenges');
      // Pass userId if present to get membership status, otherwise null
      const result = await supabase.rpc('get_discover_challenges', { p_user_id: userId || null });
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('[CHALLENGES API] RPC Error:', error);
      throw error;
    }

    // Map RPC result to standardized Challenge type
    // Note: RPC returns snake_case, we map to camelCase for frontend
    const challenges = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      category: c.category,
      createdBy: c.created_by,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      currentStreak: c.current_streak,
      bestStreak: c.best_streak,
      completionRate: c.completion_rate,
      isMember: c.is_member
    }));

    return NextResponse.json({
      success: true,
      data: challenges,
      message: 'Challenges retrieved successfully'
    });

  } catch (error) {
    console.error('[CHALLENGES API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
