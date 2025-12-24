'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, PartyPopper } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

export function DailyCheckin({ challengeId, onCheckInSuccess, todayStatus }: { challengeId?: string; onCheckInSuccess?: () => void | Promise<void>; todayStatus?: 'completed' | 'missed' }) {
  const [status, setStatus] = useState<'pending' | 'completed' | 'missed'>('pending');
  
  // Initialize status from todayStatus prop if provided
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

  const handleCheckin = async (newStatus: 'completed' | 'missed') => {
    if (!challengeId) {
      toast({
        title: 'Error',
        description: 'Challenge ID is missing',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    // OPTIMISTIC UPDATE: Set status immediately for instant UI feedback
    setStatus(newStatus);
    
    console.log('[CHECKIN] Submitting check-in:', { challengeId, status: newStatus, userId: user.id });

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

      console.log('[CHECKIN] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[CHECKIN] Check-in successful:', data);
        toast({
          title: 'Success',
          description: newStatus === 'completed' ? 'Great job! Keep the streak alive!' : 'See you tomorrow!',
        });
        // Refetch challenge data after successful check-in to sync streaks and metrics
        try {
          await onCheckInSuccess?.();
        } catch (err) {
          console.error('[CHECKIN] Error in onCheckInSuccess callback:', err);
        }
      } else {
        const error = await response.json();
        console.error('[CHECKIN] Check-in failed:', error);
        // REVERT optimistic update on error
        setStatus('pending');
        toast({
          title: 'Error',
          description: error.error || 'Failed to submit check-in',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[CHECKIN] Exception:', error);
      // REVERT optimistic update on error
      setStatus('pending');
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
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
            className="flex flex-col items-center gap-3 md:gap-4 text-center"
          >
            <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30">
              <PartyPopper className="h-8 w-8 md:h-10 md:w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-base md:text-lg font-semibold text-emerald-700 dark:text-emerald-400">
              Great job! You're on fire!
            </p>
            <p className="text-sm text-muted-foreground">
              Come back tomorrow to keep the streak alive.
            </p>
          </motion.div>
        );
      case 'missed':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex flex-col items-center gap-3 md:gap-4 text-center"
          >
            <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30">
              <X className="h-8 w-8 md:h-10 md:w-10 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-base md:text-lg font-semibold text-red-700 dark:text-red-400">
              It happens. Let's get back on track tomorrow.
            </p>
          </motion.div>
        );
      case 'pending':
      default:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 md:space-y-6"
          >
            <p className="text-center text-base md:text-lg text-muted-foreground">
              Did you complete your goal today?
            </p>
            <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="h-16 md:h-20 w-full text-base md:text-lg bg-emerald-500 hover:bg-emerald-600 text-white min-h-[44px]"
                  onClick={() => handleCheckin('completed')}
                  disabled={loading}
                >
                  <Check className="mr-2 h-6 w-6 md:h-8 md:w-8" /> {loading ? 'Saving...' : 'Yes, I did!'}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 md:h-20 w-full border-2 text-base md:text-lg min-h-[44px]"
                  onClick={() => handleCheckin('missed')}
                  disabled={loading}
                >
                  <X className="mr-2 h-6 w-6 md:h-8 md:w-8" /> {loading ? 'Saving...' : 'Not today'}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="text-lg md:text-xl">Daily Check-in</CardTitle>
        <CardDescription className="text-xs md:text-sm">{today}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 md:pt-3">{renderContent()}</CardContent>
    </Card>
  );
}
