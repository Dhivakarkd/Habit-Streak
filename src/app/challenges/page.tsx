'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Sparkles, Users, LayoutGrid, Search, Trophy, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { ChallengeCard } from '@/components/challenge-card';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { Challenge } from '@/lib/types';
import { revalidateCache } from '@/lib/cache';
import { cn } from '@/lib/utils';

export default function ChallengesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [membershipMap, setMembershipMap] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'joined' | 'new'>('all');
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        console.log('[CHALLENGES PAGE] Fetching all challenges...');
        
        const response = await fetch('/api/challenges?all=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(user && { 'X-User-ID': user.id }),
          },
        });

        if (response.ok) {
          const result = await response.json();
          const allChallenges = result.data || [];
          setChallenges(allChallenges);
        }
      } catch (error) {
        console.error('[CHALLENGES PAGE] Failed to fetch challenges:', error);
      } finally {
        setLoadingChallenges(false);
      }
    };

    if (user) {
      fetchChallenges();
    }
  }, [user]);

  // Memoized filtered challenges based on search, filter, and membership
  const filteredChallenges = useMemo(() => {
    let result = challenges;

    // Apply membership filter
    if (activeTab === 'joined') {
      result = result.filter((c) => membershipMap[c.id] ?? (c as any).isMember);
    } else if (activeTab === 'new') {
      result = result.filter((c) => !(membershipMap[c.id] ?? (c as any).isMember));
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (challenge) =>
          challenge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          challenge.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [challenges, activeTab, membershipMap, searchTerm]);

  // Count for filter badges
  const joinedCount = useMemo(() => 
    challenges.filter((c) => membershipMap[c.id] ?? (c as any).isMember).length, 
    [challenges, membershipMap]
  );
  
  const newCount = useMemo(() => 
    challenges.filter((c) => !(membershipMap[c.id] ?? (c as any).isMember)).length, 
    [challenges, membershipMap]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground animate-pulse">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-900 text-white pb-12 pt-8 md:pt-12 px-4 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-4 text-emerald-300">
            <Compass className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Explore</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline mb-4">
                Discover Challenges
              </h1>
              <p className="text-slate-300 text-lg max-w-2xl">
                Join a community, build lasting habits, and start your journey to success.
              </p>
            </div>
            <Button 
              asChild 
              className="hidden md:flex gap-2 bg-white text-emerald-700 hover:bg-emerald-50"
            >
              <Link href="/challenges/new">
                <PlusCircle className="h-4 w-4" />
                Create Challenge
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 -mt-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">All Challenges</p>
              <h3 className="text-3xl font-bold mt-1 text-foreground">{challenges.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <LayoutGrid className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </Card>
          <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg bg-blue-50/50 dark:bg-blue-950/10">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Joined</p>
              <h3 className="text-3xl font-bold mt-1 text-foreground">{joinedCount}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </Card>
          <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg bg-amber-50/50 dark:bg-amber-950/10 col-span-2 md:col-span-1">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <h3 className="text-3xl font-bold mt-1 text-foreground">{newCount}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </Card>
        </div>

        {/* Mobile Create Button */}
        <div className="md:hidden mb-4">
          <Button asChild className="w-full gap-2">
            <Link href="/challenges/new">
              <PlusCircle className="h-4 w-4" />
              Create Challenge
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 border">
            <Search className="h-5 w-5 text-muted-foreground ml-3" />
            <Input
              placeholder="Search challenges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* Tabs & Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="all" className="px-4">All ({challenges.length})</TabsTrigger>
              <TabsTrigger value="joined" className="px-4">Joined ({joinedCount})</TabsTrigger>
              <TabsTrigger value="new" className="px-4">Available ({newCount})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="space-y-4 mt-0">
            {loadingChallenges ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredChallenges.length === 0 ? (
              <Card className="glass-card p-12 text-center text-muted-foreground border-dashed">
                <div className="mx-auto h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  {activeTab === 'joined' ? (
                    <Users className="h-8 w-8 opacity-50" />
                  ) : activeTab === 'new' ? (
                    <Sparkles className="h-8 w-8 opacity-50" />
                  ) : (
                    <LayoutGrid className="h-8 w-8 opacity-50" />
                  )}
                </div>
                <p className="font-medium mb-2">
                  {searchTerm 
                    ? 'No challenges match your search.' 
                    : activeTab === 'joined' 
                      ? "You haven't joined any challenges yet." 
                      : activeTab === 'new' 
                        ? "You've joined all available challenges!" 
                        : 'No challenges available.'}
                </p>
                {activeTab !== 'all' && !searchTerm && (
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab('all')}
                    className="mt-2"
                  >
                    View all challenges
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredChallenges.map((challenge) => (
                  <div key={challenge.id}>
                    <ChallengeCard
                      challenge={challenge}
                      isMember={membershipMap[challenge.id] ?? (challenge as any).isMember}
                      onJoinSuccess={() => {
                        setMembershipMap(prev => ({
                          ...prev,
                          [challenge.id]: true
                        }));
                        
                        if (user) {
                          revalidateCache(`challenges:user:${user.id}`);
                          revalidateCache(`challenges:all:user:${user.id}`);
                          revalidateCache(`challenge:memberships:${user.id}`);
                        }
                      }}
                      variant="discover"
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
