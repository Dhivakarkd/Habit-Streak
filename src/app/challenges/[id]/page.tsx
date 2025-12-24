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
import { ConfettiAnimation } from '@/components/confetti-animation';
import { FreezeDayPicker } from '@/components/freeze-day-picker';
import { ShareAchievementModal } from '@/components/share-achievement-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getCachedData, revalidateCache } from '@/lib/cache';
import { Share2, Snowflake } from 'lucide-react';

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFreezeDayPickerOpen, setIsFreezeDayPickerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
        setShowConfetti(true); // Trigger confetti animation
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
  const completionRates = challenge.members?.reduce((acc: Record<string, number>, member: any) => {
    acc[member.id] = challenge.completionRate || 0; // TODO: fetch from leaderboard metrics
    return acc;
  }, {}) || {};

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <ConfettiAnimation trigger={showConfetti} />
      <Header />
      <main className="flex-1 w-full overflow-x-hidden">
        <div className="w-full flex flex-col gap-4 md:gap-6 lg:gap-8">
          {/* Mobile: Full width cards, Desktop: Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 px-3 md:px-6 lg:px-8 pt-3 md:pt-6 lg:pt-8 auto-rows-max lg:auto-rows-auto">
            {/* LEFT COLUMN - Primary Content */}
            <div className="grid gap-4 md:gap-6 lg:gap-8 lg:col-span-2 row-span-full lg:row-span-1">
              {/* Challenge Header Card */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-2 md:pb-3 lg:pb-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold break-words">{name}</CardTitle>
                      </div>
                      <div className="flex-shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-lg bg-primary/10 text-base sm:text-lg md:text-2xl flex-col-reverse">
                        <span>{category}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground break-words">{description}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 pt-2 md:pt-3 lg:pt-4">
                  {isMember && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 md:p-4">
                      <StreakDisplay
                        currentStreak={challenge.currentStreak || 0}
                      bestStreak={challenge.bestStreak || 0}
                    />
                      <div className="flex flex-col gap-2 mt-3">
                        <Button 
                          onClick={() => setIsFreezeDayPickerOpen(true)}
                          variant="outline"
                          className="w-full gap-2 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                        >
                          <Snowflake className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Schedule Freeze Days</span>
                          <span className="sm:hidden">Freeze Days</span>
                        </Button>
                        <Button 
                          onClick={() => setIsShareModalOpen(true)}
                          className="w-full gap-2 text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 min-h-[36px] sm:min-h-[40px]"
                        >
                          <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Share Summary</span>
                          <span className="sm:hidden">Share</span>
                        </Button>
                      </div>
                    </div>
                  )}
                  {!isMember && (
                    <Button 
                      onClick={handleJoinChallenge}
                      disabled={joiningChallenge}
                      className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold"
                    >
                      Join Challenge
                    </Button>
                  )}
              </CardContent>
            </Card>

            {/* Daily Check-in - Top Priority */}
            {isMember && (
              <DailyCheckin 
                challengeId={params?.id} 
                onCheckInSuccess={refetchChallenge} 
                todayStatus={todayCheckin?.status as 'completed' | 'missed' | undefined}
                currentStreak={challenge.currentStreak || 0}
                lastActivity={`${name} activity`}
              />
            )}
            
            {/* Check-in History - Collapsible Tab */}
            {isMember && (
              <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm mb-3 md:mb-4">
                  <TabsTrigger value="calendar" className="text-xs sm:text-sm px-2 sm:px-4">Check-in</TabsTrigger>
                  <TabsTrigger value="stats" className="text-xs sm:text-sm px-2 sm:px-4">Stats</TabsTrigger>
                </TabsList>
                <div className="min-h-[240px] sm:min-h-[300px] md:min-h-[360px]">
                  <TabsContent value="calendar" className="mt-0 h-full">
                    <CheckinHistoryCalendar checkins={checkinHistory} />
                  </TabsContent>
                  <TabsContent value="stats" className="mt-0 h-full">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base">Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
                            <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">🔥</p>
                            <p className="text-xs sm:text-sm font-semibold mt-0.5">{challenge.currentStreak || 0}</p>
                            <p className="text-xs text-muted-foreground">Current</p>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-2 text-center">
                            <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">⭐</p>
                            <p className="text-xs sm:text-sm font-semibold mt-0.5">{challenge.bestStreak || 0}</p>
                            <p className="text-xs text-muted-foreground">Best</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                            <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">📊</p>
                            <p className="text-xs sm:text-sm font-semibold mt-0.5">{Math.round(challenge.completionRate || 0)}%</p>
                            <p className="text-xs text-muted-foreground">Rate</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </div>

          {/* RIGHT SIDEBAR - Supporting Info */}
            <div className="grid gap-4 md:gap-6 lg:gap-8 lg:row-span-full">
              <MembersList 
                members={challenge.members || []} 
                checkins={challenge.checkins || []}
                completionRates={completionRates}
              />
              
              <ChallengeLeaderboard challengeId={params?.id || ''} />
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <FreezeDayPicker 
        challengeId={params?.id || ''}
        isOpen={isFreezeDayPickerOpen}
        onClose={() => setIsFreezeDayPickerOpen(false)}
        onSuccess={refetchChallenge}
      />

      <ShareAchievementModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        challengeName={challenge.name}
        currentStreak={challenge.currentStreak || 0}
        bestStreak={challenge.bestStreak || 0}
        completionRate={challenge.completionRate || 0}
        achievements={challenge.achievements}
      />
    </div>
  );
}
