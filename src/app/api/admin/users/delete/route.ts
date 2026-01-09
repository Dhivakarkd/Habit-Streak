import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
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

        // Check if requesting user is super admin
        const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('is_super_admin')
            .eq('id', adminUserId)
            .single();

        if (adminError || !adminData?.is_super_admin) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Super Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Prevent deleting self
        if (userId === adminUserId) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        console.log(`Starting deletion process for user ${userId} requested by ${adminUserId}`);

        // 1. Delete user from challenge_members
        const { error: membersError } = await supabaseAdmin
            .from('challenge_members')
            .delete()
            .eq('user_id', userId);

        if (membersError) {
            console.error('Error deleting challenge members:', membersError);
            // Continue anyway to try to clean up as much as possible
        }

        // 2. Delete user's checkins
        const { error: checkinsError } = await supabaseAdmin
            .from('checkins')
            .delete()
            .eq('user_id', userId);

        if (checkinsError) {
            console.error('Error deleting checkins:', checkinsError);
        }

        // 3. Delete user's achievements
        const { error: achievementsError } = await supabaseAdmin
            .from('user_achievements')
            .delete()
            .eq('user_id', userId);

        if (achievementsError) {
            console.error('Error deleting user achievements:', achievementsError);
        }

        // 4. Delete user from public users table
        const { error: userError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (userError) {
            console.error('Error deleting public user record:', userError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete user record' },
                { status: 500 }
            );
        }

        // 5. Delete user from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Error deleting auth user:', authError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete auth user' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
