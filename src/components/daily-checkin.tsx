'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, PartyPopper, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Progress } from './ui/progress';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

interface DailyCheckinProps {
  challengeId?: string;
  onCheckInSuccess?: () => void | Promise<void>;
  todayStatus?: 'completed' | 'missed';
  currentStreak?: number;
  lastActivity?: string;
}

const MILESTONE_THRESHOLDS = [7, 30, 100];

export function DailyCheckin({ 
  challengeId, 
  onCheckInSuccess, 
  todayStatus,
  currentStreak = 0,
  lastActivity = 'Challenge activity'
}: DailyCheckinProps) {
  const [status, setStatus] = useState<'pending' | 'completed' | 'missed'>('pending');
  
  useEffect(() => {
    if (todayStatus) {
      console.log('[CHECKIN] Initializing from todayStatus:', todayStatus);
      setStatus(todayStatus);
    }
  }, [todayStatus]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const today = format(new Date(), 'EEEE, MMMM do');

  const getNextMilestone = () => {
    for (const threshold of MILESTONE_THRESHOLDS) {
      if (currentStreak < threshold) {
        return threshold;
      }
    }
    return MILESTONE_THRESHOLDS[MILESTONE_THRESHOLDS.length - 1];
  };

  const nextMilestone = getNextMilestone();
  const progressToMilestone = Math.min((currentStreak / nextMilestone) * 100, 100);

  const handleCheckin = async (newStatus: 'completed' | 'missed') => {
    if (!challengeId) return;
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setStatus(newStatus);
    
    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify({
          challengeId,
          status: newStatus,
          date: format(new Date(), 'yyyy-MM-dd'),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: newStatus === 'completed' ? 'Great job! Keep the streak alive!' : 'See you tomorrow!',
        });
        await onCheckInSuccess?.();
      } else {
        const error = await response.json();
        setStatus('pending');
        toast({
          title: 'Error',
          description: error.error || 'Failed to submit check-in',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setStatus('pending');
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'completed':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex flex-col items-center gap-6 text-center py-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl ring-4 ring-emerald-100 dark:ring-emerald-900/30">
                <PartyPopper className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-headline">
                Complete!
              </h3>
              <p className="text-lg text-muted-foreground font-medium">
                You kept the streak alive today.
              </p>
            </div>

            <div className="w-full max-w-sm bg-muted/50 rounded-xl p-4 border border-border/50">
               <div className="flex items-center justify-between text-sm font-medium mb-2">
                 <span className="flex items-center gap-2">
                   <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                   {currentStreak} Day Streak
                 </span>
                 <span className="text-muted-foreground">{Math.round(progressToMilestone)}% to {nextMilestone}</span>
               </div>
               <Progress value={progressToMilestone} className="h-2.5" />
            </div>
          </motion.div>
        );
      case 'missed':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex flex-col items-center gap-4 text-center py-6"
          >
             <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <X className="h-10 w-10 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Missed Today</p>
              <p className="text-muted-foreground">Don't worry, just get back to it tomorrow.</p>
            </div>
            <Button variant="ghost" onClick={() => setStatus('pending')} size="sm">
              Undo
            </Button>
          </motion.div>
        );
      case 'pending':
      default:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold">Ready to check in?</h3>
              <p className="text-muted-foreground text-sm">Mark today's progress to maintain your streak.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 shadow-lg shadow-emerald-500/20"
                  onClick={() => handleCheckin('completed')}
                  disabled={loading}
                >
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">Complete</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                  onClick={() => handleCheckin('missed')}
                  disabled={loading}
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <X className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-lg font-medium text-muted-foreground">Skip</span>
                </Button>
              </motion.div>
            </div>
            
            {currentStreak > 0 && (
               <div className="flex items-center justify-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 py-2 rounded-lg">
                 <Zap className="h-4 w-4 fill-amber-500" />
                 <span>Current Streak: {currentStreak} Days</span>
               </div>
            )}
          </motion.div>
        );
    }
  };

  return (
    <Card className="glass-card w-full shadow-lg border-primary/10">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-headline">Daily Check-in</CardTitle>
            <CardDescription>{today}</CardDescription>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-soft">
            <Zap className="h-5 w-5 text-primary fill-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">{renderContent()}</CardContent>
    </Card>
  );
}
