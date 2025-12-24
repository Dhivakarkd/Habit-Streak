'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Flame,
  LogOut,
  User as UserIcon,
  Shield,
  Users,
  Menu,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  const { user, signOut, isAdmin, isSuperAdmin, refreshRoles } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Refresh roles when component mounts to get latest admin status
  React.useEffect(() => {
    refreshRoles();
  }, []);

  // Fetch user profile from database
  useEffect(() => {
    if (!user?.id) {
      setUserProfile(null);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, display_name, email')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUserProfile(data);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
      router.push('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  const displayName = userProfile?.display_name || userProfile?.username || user?.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center gap-1 sm:gap-2 md:gap-4 border-b bg-background/95 backdrop-blur-sm px-2 sm:px-3 md:px-6 support-[backdrop-filter]:bg-background/60">
      <nav className="flex w-full items-center justify-between">
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
          >
            <Flame className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-primary flex-shrink-0" />
            <span className="sr-only">Habit Streak</span>
            <span className="hidden font-bold sm:inline-block text-xs md:text-sm lg:text-base">Habit Streak</span>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 ml-6">
          <Link
            href="/dashboard"
            className="text-xs lg:text-sm text-muted-foreground transition-colors hover:text-foreground py-2"
          >
            Dashboard
          </Link>
          <Link
            href="/challenges"
            className="text-xs lg:text-sm text-muted-foreground transition-colors hover:text-foreground py-2"
          >
            Challenges
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 ml-auto">
          {/* Create Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 md:h-10 text-xs md:text-sm min-w-fit px-2 md:px-3"
            asChild
          >
            <Link href="/challenges/new" className="flex items-center gap-1 md:gap-2 whitespace-nowrap">
              <span className="hidden sm:inline">+</span>
              <span className="hidden md:inline">New</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10 flex-shrink-0 min-h-[44px] min-w-[44px]">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="text-xs md:text-sm">{initials}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 md:w-56 lg:w-64">
              <DropdownMenuLabel className="text-xs md:text-sm truncate">
                {displayName}
                {isSuperAdmin && <span className="ml-1 text-xs text-red-600 block">Super Admin</span>}
                {isAdmin && !isSuperAdmin && <span className="ml-1 text-xs text-blue-600 block">Admin</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs md:text-sm">
                <UserIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Profile</span>
              </DropdownMenuItem>
              {(isAdmin || isSuperAdmin) && <DropdownMenuSeparator />}
              {isAdmin && (
                <DropdownMenuItem asChild className="text-xs md:text-sm cursor-pointer">
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>Challenge Admin</span>
                  </Link>
                </DropdownMenuItem>
              )}
              {isSuperAdmin && (
                <DropdownMenuItem asChild className="text-xs md:text-sm cursor-pointer">
                  <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>User Management</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-xs md:text-sm">
                <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}
