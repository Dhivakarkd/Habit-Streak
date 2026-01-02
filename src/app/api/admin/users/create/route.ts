import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createUserSchema } from '@/lib/schemas/auth.schema';
import { ApiResponse } from '@/lib/types';

// Helper function to generate secure temporary password
function generateTempPassword(): string {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const all = uppercase + lowercase + numbers + symbols;

    let password = '';
    // Ensure at least one of each required type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

interface CreateUserResponse {
    user: {
        id: string;
        email: string;
        username: string;
        displayName?: string;
        isAdmin: boolean;
    };
    temporaryPassword?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CreateUserResponse>>> {
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
        const validation = createUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { username, email, displayName, isAdmin, password } = validation.data;

        // Check if username already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Username already exists' },
                { status: 400 }
            );
        }

        // Generate password if not provided
        const userPassword = password || generateTempPassword();
        const temporaryPassword = password ? undefined : userPassword;

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: userPassword,
            email_confirm: true, // Auto-confirm email
        });

        if (authError || !authData.user) {
            console.error('Create user auth error:', authError);
            return NextResponse.json(
                { success: false, error: authError?.message || 'Failed to create user account' },
                { status: 500 }
            );
        }

        // Create user record in users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                username,
                display_name: displayName || username,
                is_admin: isAdmin,
                is_super_admin: false,
            })
            .select()
            .single();

        if (userError) {
            console.error('Create user record error:', userError);
            // Rollback: delete the auth user
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json(
                { success: false, error: 'Failed to create user record' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: userData.id,
                    email: userData.email,
                    username: userData.username,
                    displayName: userData.display_name,
                    isAdmin: userData.is_admin,
                },
                temporaryPassword,
            },
        });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
