import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/lib/types';

interface AdminChallenge {
  id: string;
  name: string;
  description: string;
  category: string;
  createdBy: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AdminChallenge[]>>> {
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

    // Get archived filter from query params
    const searchParams = request.nextUrl.searchParams;
    const archived = searchParams.get('archived') === 'true';

    // Fetch challenges with member count
    let query = supabase
      .from('challenges')
      .select(
        `
        id,
        name,
        description,
        category,
        created_by,
        is_archived,
        created_at,
        updated_at,
        challenge_members (count)
      `
      );

    if (archived) {
      query = query.eq('is_archived', true);
    } else {
      query = query.eq('is_archived', false);
    }

    const { data: challenges, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Challenges query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch challenges' },
        { status: 500 }
      );
    }

    // Transform response
    const transformedChallenges: AdminChallenge[] = (challenges || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      category: c.category,
      createdBy: c.created_by,
      isArchived: c.is_archived,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      memberCount: c.challenge_members?.[0]?.count || 0,
    }));

    return NextResponse.json({
      success: true,
      data: transformedChallenges,
    });
  } catch (error) {
    console.error('Admin challenges GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
