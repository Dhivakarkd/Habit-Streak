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

    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid username' },
        { status: 400 }
      );
    }

    // Find user by username
    const { data: targetUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (findError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Promote user to admin and super-admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_admin: true, is_super_admin: true })
      .eq('id', targetUser.id);

    if (updateError) {
      console.error('Promote user error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to promote user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: targetUser.id,
        username,
        isAdmin: true,
        isSuperAdmin: true,
      },
    });
  } catch (error) {
    console.error('Promote to admin error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
