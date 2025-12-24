'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
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

  // Refresh roles when component mounts to get latest admin status
  React.useEffect(() => {
    refreshRoles();
  }, []);

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

  const displayName = user?.user_metadata?.username || user?.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center gap-2 md:gap-4 border-b bg-background/95 backdrop-blur-sm px-3 md:px-6 support-[backdrop-filter]:bg-background/60">
      <nav className="flex w-full items-center justify-between">
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 flex-shrink-0"
          >
            <Flame className="h-6 w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
            <span className="sr-only">Habit Streak</span>
            <span className="hidden font-bold sm:inline-block text-sm md:text-base">Habit Streak</span>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 ml-6">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground py-2"
          >
            Dashboard
          </Link>
          <Link
            href="/challenges"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground py-2"
          >
            Challenges
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {/* Create Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-10 md:h-10 text-xs md:text-sm min-w-[40px] md:w-auto"
            asChild
          >
            <Link href="/challenges/new" className="flex items-center gap-1 md:gap-2">
              <span className="hidden sm:inline">+</span>
              <span className="hidden md:inline">New</span>
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 flex-shrink-0 min-h-[44px]">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="text-sm md:text-base">{initials}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 md:w-64">
              <DropdownMenuLabel className="text-xs md:text-sm">
                {displayName}
                {isSuperAdmin && <span className="ml-2 text-xs text-red-600">Super Admin</span>}
                {isAdmin && !isSuperAdmin && <span className="ml-2 text-xs text-blue-600">Admin</span>}
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
