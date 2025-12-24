import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { signupSchema } from '@/lib/schemas/auth.schema';
import { ApiResponse, AuthSession } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthSession>>> {
  try {
    const body = await request.json();
    console.log('[SIGNUP] Starting signup process for:', body.email);

    // Validate request body
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      console.error('[SIGNUP] Validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { email, password, username } = validation.data;
    console.log('[SIGNUP] Validation passed, checking username:', username);

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username);

    if (existingUser && existingUser.length > 0) {
      console.log('[SIGNUP] Username already exists:', username);
      return NextResponse.json(
        {
          success: false,
          error: 'Username already exists',
        },
        { status: 400 }
      );
    }

    // Sign up with Supabase Auth
    console.log('[SIGNUP] Creating Supabase auth user...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: `${new URL(request.url).origin}/dashboard`,
      },
    });

    if (error) {
      console.error('[SIGNUP] Supabase auth error object:', error);
      console.error('[SIGNUP] Error keys:', Object.keys(error));
      console.error('[SIGNUP] Error message:', error.message);
      console.error('[SIGNUP] Error status:', error.status);
      console.error('[SIGNUP] Full error:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Authentication failed',
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      console.error('[SIGNUP] No user data returned from signup');
      return NextResponse.json(
        {
          success: false,
          error: 'User creation failed',
        },
        { status: 500 }
      );
    }

    console.log('[SIGNUP] Auth user created:', data.user.id);

    // Create user profile in users table
    console.log('[SIGNUP] Creating user profile with id:', data.user.id, 'email:', email, 'username:', username);
    const { data: insertedUser, error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      username,
      display_name: username,
      is_admin: false,
      can_create_challenges: false,
    })
    .select();

    if (profileError) {
      console.error('[SIGNUP] Profile creation error:', profileError);
      console.error('[SIGNUP] Error code:', profileError.code);
      console.error('[SIGNUP] Error message:', profileError.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user profile: ' + profileError.message,
        },
        { status: 500 }
      );
    }

    console.log('[SIGNUP] User profile created successfully:', insertedUser);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email || '',
            username,
          },
          session: data.session
            ? {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              }
            : null,
        },
        message: 'User registered successfully! Check your email to verify your account.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SIGNUP] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
