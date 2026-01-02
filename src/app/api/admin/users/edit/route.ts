import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { editUserSchema } from '@/lib/schemas/auth.schema';
import { ApiResponse } from '@/lib/types';

interface EditUserResponse {
    user: {
        id: string;
        email: string;
        username: string;
        displayName?: string;
        bio?: string;
        avatarUrl?: string;
    };
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<EditUserResponse>>> {
    try {
        const adminUserId = request.headers.get('X-User-ID');
        if (!adminUserId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Check if requesting user is admin
        const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('is_admin, is_super_admin')
            .eq('id', adminUserId)
            .single();

        if (adminError || (!adminData?.is_admin && !adminData?.is_super_admin)) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Admin access required' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = editUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { userId, username, email, displayName, bio, avatarUrl } = validation.data;

        // Check if user exists
        const { data: existingUser, error: userCheckError } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', userId)
            .single();

        if (userCheckError || !existingUser) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // If username is being changed, check if it's already taken
        if (username) {
            const { data: usernameTaken } = await supabase
                .from('users')
                .select('id')
                .eq('username', username)
                .neq('id', userId)
                .single();

            if (usernameTaken) {
                return NextResponse.json(
                    { success: false, error: 'Username already exists' },
                    { status: 400 }
                );
            }
        }

        // Build update object with only provided fields
        const updateData: any = {};
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (displayName !== undefined) updateData.display_name = displayName;
        if (bio !== undefined) updateData.bio = bio;
        if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
        updateData.updated_at = new Date().toISOString();

        // Update user record in users table
        const { data: userData, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            console.error('Update user error:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to update user' },
                { status: 500 }
            );
        }

        // If email changed, update in Supabase Auth
        if (email && email !== existingUser.email) {
            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { email }
            );

            if (authUpdateError) {
                console.error('Update auth email error:', authUpdateError);
                // Don't fail the request, but log the error
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: userData.id,
                    email: userData.email,
                    username: userData.username,
                    displayName: userData.display_name,
                    bio: userData.bio,
                    avatarUrl: userData.avatar_url,
                },
            },
        });
    } catch (error) {
        console.error('Edit user error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
