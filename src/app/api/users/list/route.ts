import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
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

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase env configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify user is admin
    const { data: requester, error: requesterError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (requesterError || !requester || !requester.is_admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
        },
        { status: 403 }
      );
    }

    // Fetch all users except the current user
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, username')
      .neq('id', userId)
      .order('username', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
