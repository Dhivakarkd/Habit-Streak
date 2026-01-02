'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Calendar, Trophy, Flame, LayoutGrid, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { ChallengeCard } from '@/components/challenge-card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateChallengeModal } from '@/components/create-challenge-modal';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Challenge } from '@/lib/types';
import { useChallenges } from '@/hooks/use-challenges';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { challenges, isLoading: challengesLoading, error: challengesError, invalidateChallenges } = useChallenges();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

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

  const displayName = userProfile?.display_name || userProfile?.username || user?.email?.split('@')[0] || 'User';
  
  // Format current date
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground animate-pulse">Loading experience...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Header with Greeting */}
      <div className="relative bg-gradient-to-r from-indigo-900 via-purple-800 to-violet-900 text-white pb-16 pt-8 md:pt-12 px-4 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="h-48 w-48 -mr-12 -mt-12 rotate-12" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-4 text-indigo-300 bg-indigo-500/20 backdrop-blur-md rounded-full px-4 py-1.5 w-fit">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">{currentDate}</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline">
                Hello, {displayName}!
              </h1>
              <p className="text-indigo-100 text-lg max-w-xl">
                Ready to crush your goals today? You have {challenges.length} active streak{challenges.length !== 1 ? 's' : ''} going.
              </p>
            </div>
            
            <div className="hidden md:block">
              <CreateChallengeModal 
                buttonVariant="secondary"
                buttonClassName="bg-white text-indigo-600 hover:bg-indigo-50 border-0 shadow-lg hover:shadow-xl transition-all rounded-xl font-semibold"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 -mt-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Challenges</p>
              <h3 className="text-3xl font-bold mt-1 text-foreground">{challenges.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <LayoutGrid className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </Card>
          <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg bg-orange-50/50 dark:bg-orange-950/10">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Streak Fire</p>
              <h3 className="text-3xl font-bold mt-1 text-foreground">{challenges.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </Card>
          <Card className="glass-card p-6 flex flex-col justify-center border-slate-200/50 dark:border-slate-800/50 shadow-lg bg-emerald-50/50 dark:bg-emerald-950/10 col-span-2 md:col-span-1">
            <p className="text-sm font-medium text-muted-foreground">Tip of the day</p>
            <p className="text-base font-medium text-foreground mt-2 italic">
              "Small progress is still progress."
            </p>
          </Card>
        </div>

        {/* Mobile New Challenge Button */}
        <div className="md:hidden mb-4">
          <CreateChallengeModal buttonClassName="w-full gap-2" />
        </div>

        {/* Challenges Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Your Challenges
              </span>
            </h2>
            
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href="/challenges">
                <Compass className="mr-2 h-4 w-4" />
                Explore
              </Link>
            </Button>
          </div>
          
          {challengesError ? (
            <Card className="glass-card p-6 border-destructive/20 text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">Unable to load challenges</h3>
              <p className="text-muted-foreground mb-4">
                {(challengesError as Error).message || 'There was a problem connecting to the server.'}
              </p>
              <Button onClick={() => invalidateChallenges()} variant="outline">
                Try Again
              </Button>
            </Card>
          ) : challengesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <Card className="glass-card p-12 text-center text-muted-foreground border-dashed">
              <div className="mx-auto h-16 w-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">No active challenges</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Start building a new habit today. Track your progress and join the community.
              </p>
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/challenges">Explore Challenges</Link>
              </Button>
            </Card>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {challenges.map((challenge: Challenge) => (
                <motion.div key={challenge.id} variants={item} layout>
                  <ChallengeCard challenge={challenge} isMember={true} variant="dashboard" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Join More Challenges Button */}
          {challenges.length > 0 && (
            <div className="flex justify-center mt-8 pb-8">
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link href="/challenges">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Join More Challenges
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
