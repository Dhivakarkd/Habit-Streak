'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Calendar, Trophy, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { ChallengeCard } from '@/components/challenge-card';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Challenge } from '@/lib/types';
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
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground animate-pulse">Loading experience...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8F9FE] dark:bg-[#0a0a0a]">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent dark:from-indigo-900/20 pointer-events-none" />
      
      <Header />
      
      <main className="relative flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Greeting Card */}
          <div className="col-span-full lg:col-span-2 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="h-48 w-48 -mr-12 -mt-12 rotate-12" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-indigo-100 bg-indigo-500/20 backdrop-blur-md rounded-full px-4 py-1.5 w-fit text-sm font-medium">
                <Calendar className="h-4 w-4" />
                <span>{currentDate}</span>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight font-headline">
                  Hello, {displayName}!
                </h1>
                <p className="text-lg text-indigo-100 max-w-lg">
                  Ready to crush your goals today? You have {challenges.length} active streak{challenges.length !== 1 ? 's' : ''} going.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-white text-indigo-600 hover:bg-indigo-50 border-0 shadow-lg hover:shadow-xl transition-all rounded-xl font-semibold"
                >
                  <Link href="/challenges/new">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    New Challenge
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats / Motivation */}
          <div className="hidden lg:grid grid-rows-2 gap-6">
            <div className="glass-panel rounded-2xl p-6 flex items-center justify-between group hover:border-indigo-200 transition-colors">
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Active</p>
                <p className="text-4xl font-bold text-foreground mt-1">{challenges.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Flame className="h-6 w-6" />
              </div>
            </div>
            
            <div className="glass-panel rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-muted-foreground">Tip of the day</p>
              <p className="text-base font-medium text-foreground mt-2">
                "Small progress is still progress."
              </p>
            </div>
          </div>
        </motion.div>

        {/* Challenges Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Your Challenges
              </span>
            </h2>
            
            {/* Mobile New Challenge Button (Visible only on small screens) */}
            <Button asChild size="sm" variant="outline" className="lg:hidden rounded-full">
               <Link href="/challenges/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New
              </Link>
            </Button>
          </div>

          {challengesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 px-4 text-center glass-panel rounded-3xl border-dashed"
            >
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-full mb-6">
                <Trophy className="h-12 w-12 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">No active challenges</h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                Start building a new habit today. Track your progress and join the community.
              </p>
              <Button asChild size="lg" variant="gradient" className="rounded-full px-8">
                <Link href="/challenges">Explore Challenges</Link>
              </Button>
            </motion.div>
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
        </div>
      </main>
    </div>
  );
}
