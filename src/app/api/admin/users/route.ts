import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/lib/types';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  challengeCount: number;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AdminUser[]>>> {
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

    // Check if user is super admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', userId)
      .single();

    if (userError || !userData?.is_super_admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get all users with their challenge count
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        username,
        is_admin,
        is_super_admin,
        challenge_members (count)
      `
      )
      .order('username', { ascending: true });

    if (usersError) {
      console.error('Users query error:', usersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Transform response
    const transformedUsers: AdminUser[] = (users || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      isAdmin: u.is_admin || false,
      isSuperAdmin: u.is_super_admin || false,
      challengeCount: u.challenge_members?.[0]?.count || 0,
    }));

    return NextResponse.json({
      success: true,
      data: transformedUsers,
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
