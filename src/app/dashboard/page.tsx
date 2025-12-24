'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { ChallengeCard } from '@/components/challenge-card';
import { useAuth } from '@/lib/auth-context';
import { Challenge } from '@/lib/types';
import { getCachedData, revalidateCache } from '@/lib/cache';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUserChallenges = async () => {
      try {
        if (!user) return;
        
        console.log('[DASHBOARD] Fetching user challenges for:', user.id);
        
        // Use cache with 5-minute TTL
        const cacheKey = `challenges:user:${user.id}`;
        const data = await getCachedData(
          cacheKey,
          async () => {
            const response = await fetch('/api/challenges', {
              headers: {
                'X-User-ID': user.id,
              },
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('[DASHBOARD] Fetched challenges:', result.data?.length);
              return result.data || [];
            }
            throw new Error('Failed to fetch challenges');
          },
          5 * 60 * 1000 // 5 minute TTL
        );
        
        setChallenges(data);
      } catch (error) {
        console.error('[DASHBOARD] Failed to fetch challenges:', error);
        setChallenges([]);
      } finally {
        setLoadingChallenges(false);
      }
    };

    if (user) {
      fetchUserChallenges();
    }

    // Listen for challenge joined event
    const handleChallengeJoined = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[DASHBOARD] Challenge joined event received:', customEvent.detail);
      if (customEvent.detail.userId === user?.id) {
        refetchChallenges();
      }
    };

    window.addEventListener('challengeJoined', handleChallengeJoined);

    return () => {
      window.removeEventListener('challengeJoined', handleChallengeJoined);
    };
  }, [user]);

  // Expose refetch function for parent components to revalidate after check-in
  const refetchChallenges = async () => {
    if (!user) return;
    
    try {
      // Small delay to allow database trigger to calculate new streaks
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const cacheKey = `challenges:user:${user.id}`;
      revalidateCache(cacheKey);
      console.log('[DASHBOARD] Cache invalidated, fetching fresh challenges');
      setLoadingChallenges(true);
      
      // Refetch fresh data
      const data = await getCachedData(
        cacheKey,
        async () => {
          const response = await fetch('/api/challenges', {
            headers: {
              'X-User-ID': user.id,
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('[DASHBOARD] Fresh challenges fetched:', result.data?.length);
            return result.data || [];
          }
          throw new Error('Failed to fetch challenges');
        },
        5 * 60 * 1000
      );
      
      setChallenges(data);
    } catch (error) {
      console.error('[DASHBOARD] Error refetching challenges:', error);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const displayName = user?.user_metadata?.username || user?.email || 'User';

  if (loading) {
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
              Welcome back, {displayName}!
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">Here are your active challenges.</p>
          </div>
          <Button asChild className="w-full md:w-auto min-h-[44px]" size="sm">
            <Link href="/challenges/new">
              <PlusCircle className="mr-2 h-4 w-4" /> New Challenge
            </Link>
          </Button>
        </div>

        {loadingChallenges ? (
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
          <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} isMember={true} variant="dashboard" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
