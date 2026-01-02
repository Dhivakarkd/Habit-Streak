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
import { Share2, Snowflake, Calendar, Users, Trophy } from 'lucide-react';

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
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground animate-pulse">Loading challenge...</p>
          </div>
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
    <div className="flex min-h-screen w-full flex-col bg-[#F8F9FE] dark:bg-[#0a0a0a]">
      <ConfettiAnimation trigger={showConfetti} />
      {/* Immersive Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent dark:from-indigo-900/20 pointer-events-none" />
      
      <Header />
      
      <main className="relative flex-1 w-full overflow-x-hidden">
        {/* HERO HEADER */}
        <div className="relative w-full bg-gradient-to-b from-indigo-600 to-purple-800 dark:from-indigo-900 dark:to-black pb-24 pt-12 md:pt-16 lg:pt-20 px-4">
           {/* Abstract Shapes */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
            <div className="absolute top-[-20%] right-[-10%] w-[50vh] h-[50vh] bg-pink-500 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40vh] h-[40vh] bg-blue-500 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 text-white text-sm font-medium">
               <span className="capitalize">{category}</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-headline text-white tracking-tight">
              {name}
            </h1>
            <p className="text-indigo-100/90 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
              {description}
            </p>
            
            {isMember && (
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-white">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                   <Calendar className="h-5 w-5 opacity-80" />
                   <span className="font-semibold">{challenge.checkins?.length || 0}</span>
                   <span className="text-sm opacity-80">check-ins</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                   <Users className="h-5 w-5 opacity-80" />
                   <span className="font-semibold">{challenge.members?.length || 0}</span>
                   <span className="text-sm opacity-80">members</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-12 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN (Main Content) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* MEMBER STATE: Check-in & Actions */}
              {isMember ? (
                <>
                  <DailyCheckin 
                    challengeId={params?.id} 
                    onCheckInSuccess={refetchChallenge} 
                    todayStatus={todayCheckin?.status as 'completed' | 'missed' | undefined}
                    currentStreak={challenge.currentStreak || 0}
                    lastActivity={`${name} activity`}
                  />

                   {/* Stats Grid */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <Card className="bg-background/90 md:glass-card flex flex-col items-center justify-center p-6 text-center border-border/50">
                        <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
                        <span className="text-2xl font-bold">{challenge.bestStreak || 0}</span>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Best Streak</span>
                     </Card>
                     <Card className="bg-background/90 md:glass-card flex flex-col items-center justify-center p-6 text-center border-border/50">
                        <Calendar className="h-8 w-8 text-indigo-500 mb-2" />
                        <span className="text-2xl font-bold">{Math.round(challenge.completionRate || 0)}%</span>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Completion</span>
                     </Card>
                      {/* Action Buttons */}
                      <Card 
                        className="bg-background/90 md:glass-card col-span-2 flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
                        onClick={() => setIsFreezeDayPickerOpen(true)}
                      >
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                             <Snowflake className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                           </div>
                           <div className="text-left">
                             <p className="font-semibold text-sm">Freeze Days</p>
                             <p className="text-xs text-muted-foreground">Skip without losing streak</p>
                           </div>
                         </div>
                      </Card>
                       <Card 
                        className="bg-background/90 md:glass-card col-span-2 flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
                        onClick={() => setIsShareModalOpen(true)}
                      >
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                             <Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                           </div>
                           <div className="text-left">
                             <p className="font-semibold text-sm">Share Progress</p>
                             <p className="text-xs text-muted-foreground">Show off your achievements</p>
                           </div>
                         </div>
                      </Card>
                   </div>
                  
                  {/* History Tabs */}
                  <div className="bg-white/50 dark:bg-card/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/10 p-4 md:p-6 shadow-sm">
                    <Tabs defaultValue="calendar" className="w-full">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold font-headline">History</h3>
                        <TabsList className="bg-muted/50">
                          <TabsTrigger value="calendar">Calendar</TabsTrigger>
                          <TabsTrigger value="list">List View</TabsTrigger>
                        </TabsList>
                      </div>
                      <TabsContent value="calendar" className="mt-0">
                        <CheckinHistoryCalendar checkins={checkinHistory} />
                      </TabsContent>
                      <TabsContent value="list" className="mt-0">
                        <div className="text-center py-12 text-muted-foreground">
                          Check-in list view coming soon.
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </>
              ) : (
                <Card className="glass-card p-6 md:p-8 text-center space-y-6">
                  <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Join this Challenge</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Start tracking your progress, compete with friends, and build a lasting habit.
                    </p>
                  </div>
                  <Button 
                    onClick={handleJoinChallenge}
                    disabled={joiningChallenge}
                    size="lg"
                    className="w-full max-w-sm font-semibold text-lg h-12"
                    variant="gradient"
                  >
                    {joiningChallenge ? 'Joining...' : 'Start Challenge Now'}
                  </Button>
                </Card>
              )}
            </div>

            {/* RIGHT COLUMN (Sidebar) */}
            <div className="lg:col-span-4 space-y-6">
               <ChallengeLeaderboard challengeId={params?.id || ''} />
               
               <MembersList 
                members={challenge.members || []} 
                checkins={challenge.checkins || []}
                completionRates={completionRates}
              />
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
