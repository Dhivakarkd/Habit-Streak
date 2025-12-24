'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 border-t backdrop-blur-sm z-40">
      <div className="flex items-center justify-around h-16">
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            isActive('/dashboard')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-medium">Dashboard</span>
        </Link>
        <Link
          href="/challenges"
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            isActive('/challenges')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Compass className="h-5 w-5" />
          <span className="text-xs font-medium">Challenges</span>
        </Link>
      </div>
    </nav>
  );
}
