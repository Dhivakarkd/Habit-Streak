'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { ChallengeCard } from '@/components/challenge-card';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ApiResponse, Challenge } from '@/lib/types';
// cache methods removed
import { useChallenges } from '@/hooks/use-challenges';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { challenges, isLoading: challengesLoading, invalidateChallenges } = useChallenges();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

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

  // Expose refetch function for parent components to revalidate after check-in
  // We keep this method name for compatibility, but now it uses React Query invalidation
  const refetchChallenges = async () => {
    // Small delay to allow database trigger to calculate new streaks
    await new Promise(resolve => setTimeout(resolve, 500));
    invalidateChallenges();
  };

  const displayName = userProfile?.display_name || userProfile?.username || user?.email?.split('@')[0] || 'User';

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 lg:gap-8 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold">
              Welcome back, {displayName}!
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">Here are your active challenges.</p>
          </div>
          <Button asChild className="w-full sm:w-auto min-h-[44px]" size="sm" variant="default">
            <Link href="/challenges/new">
              <PlusCircle className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Challenge</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        </div>

        {challengesLoading ? (
          <div className="flex items-center justify-center py-12 md:py-16">
            <p className="text-sm md:text-base text-muted-foreground">Loading challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="flex items-center justify-center py-12 md:py-16">
            <div className="text-center space-y-3">
              <p className="text-sm md:text-base text-muted-foreground">No challenges joined yet.</p>
              <Link href="/challenges" className="text-primary hover:underline text-sm md:text-base inline-block">
                Browse available challenges
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 md:gap-4 lg:gap-6">
            {challenges.map((challenge: Challenge) => (
              <div
                key={challenge.id}
                className="w-full basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 min-w-0"
              >
                <ChallengeCard challenge={challenge} isMember={true} variant="dashboard" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
