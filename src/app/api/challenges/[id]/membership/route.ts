import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ isMember: boolean }>>> {
  try {
    const { id } = await params;
    console.log('[MEMBERSHIP API] Checking membership for challenge:', id);

    // Create a Supabase client for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[MEMBERSHIP API] Missing Supabase env vars');
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
    console.log('[MEMBERSHIP API] User ID from header:', userId || 'missing');

    if (!userId) {
      // Fallback to cookie-based auth
      const token = request.cookies.get('sb-access-token')?.value;
      console.log('[MEMBERSHIP API] Token from cookies:', token ? 'present' : 'missing');

      if (token) {
        supabase.auth.setSession({
          access_token: token,
          refresh_token: request.cookies.get('sb-refresh-token')?.value || '',
        } as any);
      }

      // Get current user from session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log('[MEMBERSHIP API] User from session:', user?.id || 'none');

      if (!user) {
        console.log('[MEMBERSHIP API] No authenticated user');
        return NextResponse.json(
          {
            success: true,
            data: { isMember: false },
          },
          { status: 200 }
        );
      }

      userId = user.id;
    }

    console.log('[MEMBERSHIP API] Final userId:', userId);

    // Check if user is a member
    const { data: membership, error } = await supabase
      .from('challenge_members')
      .select('id')
      .eq('challenge_id', id)
      .eq('user_id', userId)
      .single();

    const isMember = !!membership && !error;
    console.log('[MEMBERSHIP API] Is member:', isMember);

    return NextResponse.json(
      {
        success: true,
        data: { isMember },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[MEMBERSHIP API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
