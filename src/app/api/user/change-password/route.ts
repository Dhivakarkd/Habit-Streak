import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setPasswordSchema } from '@/lib/schemas/auth.schema';
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

interface SetPasswordResponse {
    temporaryPassword?: string;
    message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<SetPasswordResponse>>> {
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

        // Check if requesting user is super admin (only super admins can reset passwords)
        const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('is_super_admin')
            .eq('id', adminUserId)
            .single();

        if (adminError || !adminData?.is_super_admin) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Super admin access required' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = setPasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { userId, newPassword } = validation.data;

        // Check if user exists
        const { data: userData, error: userCheckError } = await supabase
            .from('users')
            .select('id, username')
            .eq('id', userId)
            .single();

        if (userCheckError || !userData) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Generate password if not provided
        const finalPassword = newPassword || generateTempPassword();
        const temporaryPassword = newPassword ? undefined : finalPassword;

        // Update password using Supabase Admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: finalPassword }
        );

        if (updateError) {
            console.error('Set password error:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to set password' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                temporaryPassword,
                message: temporaryPassword
                    ? 'Temporary password generated successfully'
                    : 'Password updated successfully',
            },
        });
    } catch (error) {
        console.error('Set password error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
