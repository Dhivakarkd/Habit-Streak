import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { signinSchema } from '@/lib/schemas/auth.schema';
import { ApiResponse, AuthSession } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthSession>>> {
  try {
    const body = await request.json();

    // Validate request body
    const validation = signinSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { email: emailOrUsername, password } = validation.data;

    console.log('[SIGNIN] Attempting signin with:', emailOrUsername);

    // Determine if input is email or username
    let userEmail: string;
    let userUsername: string;

    if (emailOrUsername.includes('@')) {
      // It's an email, look up username
      userEmail = emailOrUsername;
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('email', emailOrUsername)
        .single();

      if (userError || !userData) {
        console.log('[SIGNIN] Email not found:', emailOrUsername);
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid email or password',
          },
          { status: 401 }
        );
      }
      userUsername = userData.username;
    } else {
      // It's a username, look up email
      userUsername = emailOrUsername;
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', emailOrUsername)
        .single();

      if (userError || !userData) {
        console.log('[SIGNIN] Username not found:', emailOrUsername);
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid username or password',
          },
          { status: 401 }
        );
      }
      userEmail = userData.email;
    }

    console.log('[SIGNIN] Looking up auth user with email:', userEmail);

    // Sign in with Supabase Auth using email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid username or password',
        },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sign in failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email || '',
            username: userUsername,
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          },
        },
        message: 'Signed in successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
