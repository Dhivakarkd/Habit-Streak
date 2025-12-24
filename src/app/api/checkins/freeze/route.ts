import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/lib/types';
import { addDays, startOfDay } from 'date-fns';

interface FreezeRequestBody {
  challengeId: string;
  dates: string[]; // ISO date strings
}

interface FreezeResponse {
  message: string;
  createdCount: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<FreezeResponse>>> {
  try {
    // Get user ID from header
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

    // Get Supabase config
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body: FreezeRequestBody = await request.json();
    const { challengeId, dates } = body;

    // Validate inputs
    if (!challengeId || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: challengeId and dates array required',
        },
        { status: 400 }
      );
    }

    if (dates.length > 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot freeze more than 3 days per week',
        },
        { status: 400 }
      );
    }

    // Validate dates are in future
    const today = startOfDay(new Date());
    const validDates = dates.filter((dateStr) => {
      const date = startOfDay(new Date(dateStr));
      return date > today && date <= addDays(today, 90);
    });

    if (validDates.length !== dates.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'All dates must be 1-90 days in the future',
        },
        { status: 400 }
      );
    }

    // Check that user is a member of the challenge
    const { data: membership } = await supabase
      .from('challenge_members')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: 'User is not a member of this challenge',
        },
        { status: 403 }
      );
    }

    // Create freeze day checkins
    const freezeCheckins = validDates.map((dateStr) => ({
      challenge_id: challengeId,
      user_id: userId,
      checkin_date: dateStr,
      status: 'freeze' as const,
      notes: 'Scheduled freeze day',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('checkins')
      .insert(freezeCheckins);

    if (insertError) {
      console.error('Freeze day insertion error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create freeze days: ' + insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully created ${validDates.length} freeze day(s)`,
        createdCount: validDates.length,
      },
    });
  } catch (error) {
    console.error('Freeze day API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
