'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Challenge, Checkin } from '@/lib/types';
import { StreakDisplay } from '@/components/streak-display';
import { DailyCheckin } from '@/components/daily-checkin';
import { MembersList } from '@/components/members-list';
import { CheckinHistoryCalendar } from '@/components/checkin-history-calendar';
import { ChallengeLeaderboard } from '@/components/challenge-leaderboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getCachedData, revalidateCache } from '@/lib/cache';

type ChallengeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ChallengeDetailPage({ params: paramsPromise }: ChallengeDetailPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [checkinHistory, setCheckinHistory] = useState<Checkin[]>([]);
  const [loadingChallenge, setLoadingChallenge] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [joiningChallenge, setJoiningChallenge] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await paramsPromise;
      setParams(resolved);
    };
    resolveParams();
  }, [paramsPromise]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!params?.id || !user) return;

    const fetchChallenge = async () => {
      try {
        console.log('[CHALLENGE DETAIL] Fetching challenge:', params.id);
        
        // Use cache with 5-minute TTL
        const cacheKey = `challenge:${params.id}:user:${user.id}`;
        const data = await getCachedData(
          cacheKey,
          async () => {
            const response = await fetch(`/api/challenges/${params.id}`, {
              headers: {
                'X-User-ID': user.id,
              },
            });
            console.log('[CHALLENGE DETAIL] Response status:', response.status);
            
            if (response.ok) {
              const result = await response.json();
              console.log('[CHALLENGE DETAIL] Challenge data:', result);
              return result.data;
            }
            throw new Error('Failed to fetch challenge');
          },
          5 * 60 * 1000 // 5 minute TTL
        );
        
        setChallenge(data);
        
        // Check if user is a member
        const membershipResponse = await fetch(`/api/challenges/${params.id}/membership`, {
          headers: {
            'X-User-ID': user.id,
          },
        });
        const { data: membershipData } = await membershipResponse.json();
        console.log('[CHALLENGE DETAIL] Membership check:', membershipData?.isMember);
        setIsMember(membershipData?.isMember || false);

        // Fetch check-in history if user is a member
        if (membershipData?.isMember) {
          const checkinCacheKey = `challenge:checkins:history:${params.id}:${user.id}`;
          const checkinData = await getCachedData(
            checkinCacheKey,
            async () => {
              const response = await fetch(`/api/challenges/${params.id}/checkins`, {
                headers: {
                  'X-User-ID': user.id,
                },
              });
              if (response.ok) {
                const result = await response.json();
                console.log('[CHALLENGE DETAIL] Check-in history:', result.data?.length, 'entries');
                return result.data || [];
              }
              return [];
            },
            5 * 60 * 1000 // 5 minute TTL
          );
          setCheckinHistory(checkinData);
        }
      } catch (err) {
        console.error('[CHALLENGE DETAIL] Error:', err);
        setError('Failed to load challenge');
      } finally {
        setLoadingChallenge(false);
      }
    };

    fetchChallenge();
  }, [params?.id, user]);

  const refetchChallenge = async () => {
    if (!params?.id || !user) return;
    
    try {
      console.log('[CHALLENGE DETAIL] Refetching challenge after check-in');
      
      // Small delay to allow database trigger to calculate new streaks
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Invalidate cache to fetch fresh data
      const cacheKey = `challenge:${params.id}:user:${user.id}`;
      revalidateCache(cacheKey);
      
      // Invalidate check-in history cache
      const checkinCacheKey = `challenge:checkins:history:${params.id}:${user.id}`;
      revalidateCache(checkinCacheKey);
      
      console.log('[CHALLENGE DETAIL] Cache invalidated, fetching fresh data');
      
      // Fetch fresh challenge data
      const response = await fetch(`/api/challenges/${params.id}`, {
        headers: {
          'X-User-ID': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[CHALLENGE DETAIL] Fresh challenge data:', data.data);
        setChallenge(data.data);
      }

      // Fetch fresh check-in history
      const checkinResponse = await fetch(`/api/challenges/${params.id}/checkins`, {
        headers: {
          'X-User-ID': user.id,
        },
      });
      if (checkinResponse.ok) {
        const checkinData = await checkinResponse.json();
        console.log('[CHALLENGE DETAIL] Fresh check-in history:', checkinData.data?.length, 'entries');
        setCheckinHistory(checkinData.data || []);
      }
    } catch (err) {
      console.error('[CHALLENGE DETAIL] Error refetching:', err);
    }
  };

  const handleJoinChallenge = async () => {
    if (!params?.id || !user) return;

    setJoiningChallenge(true);
    try {
      console.log('[CHALLENGE DETAIL] Joining challenge:', params.id, 'user:', user.id);
      
      const response = await fetch(`/api/challenges/${params.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
      });

      if (response.ok) {
        console.log('[CHALLENGE DETAIL] Joined successfully');
        setIsMember(true);
        toast({
          title: 'Success',
          description: 'You have joined the challenge!',
        });
      } else {
        const error = await response.json();
        console.error('[CHALLENGE DETAIL] Join failed:', error);
        toast({
          title: 'Error',
          description: error.error || 'Failed to join challenge',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[CHALLENGE DETAIL] Exception:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setJoiningChallenge(false);
    }
  };

  if (authLoading || loadingChallenge) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading challenge...</p>
        </main>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">{error || 'Challenge not found'}</p>
        </main>
      </div>
    );
  }

  const { name, description, category } = challenge;
  
  // Get today's check-in status for this user
  const today = new Date().toISOString().split('T')[0];
  const todayCheckin = challenge.checkins?.find((c: any) => c.userId === user?.id && c.date === today);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-3">
          <div className="grid gap-8 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold">{name}</CardTitle>
                    <CardDescription className="mt-2 text-base">{description}</CardDescription>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-xl">{category}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <StreakDisplay
                  currentStreak={challenge.currentStreak || 0}
                  bestStreak={challenge.bestStreak || 0}
                />
                {!isMember && (
                  <Button 
                    onClick={handleJoinChallenge}
                    disabled={joiningChallenge}
                    className="mt-4 w-full"
                  >
                    {joiningChallenge ? 'Joining...' : 'Join Challenge'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {isMember && <DailyCheckin challengeId={params?.id} onCheckInSuccess={refetchChallenge} todayStatus={todayCheckin?.status as 'completed' | 'missed' | undefined} />}
            
            {isMember && <CheckinHistoryCalendar checkins={checkinHistory} />}
          </div>

          <div className="grid gap-8">
            <MembersList members={challenge.members || []} checkins={challenge.checkins || []} />
            
            <ChallengeLeaderboard challengeId={params?.id || ''} />
          </div>
        </div>
      </main>
    </div>
  );
}
