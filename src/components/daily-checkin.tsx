'use client';

import { useState, useEffect } from 'react';
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
          <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <PartyPopper className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-green-700">
              Great job! You're on fire!
            </p>
            <p className="text-sm text-muted-foreground">
              Come back tomorrow to keep the streak alive.
            </p>
          </div>
        );
      case 'missed':
        return (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in zoom-in-95">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-lg font-medium text-red-700">
              It happens. Let's get back on track tomorrow.
            </p>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="space-y-6">
            <p className="text-center text-lg text-muted-foreground">
              Did you complete your goal today?
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Button
                size="lg"
                className="h-20 w-full transform bg-green-500 text-lg text-white transition hover:scale-105 hover:bg-green-600"
                onClick={() => handleCheckin('completed')}
                disabled={loading}
              >
                <Check className="mr-2 h-8 w-8" /> {loading ? 'Saving...' : 'Yes, I did!'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-20 w-full transform border-2 text-lg transition hover:scale-105"
                onClick={() => handleCheckin('missed')}
                disabled={loading}
              >
                <X className="mr-2 h-8 w-8" /> {loading ? 'Saving...' : 'Not today'}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Check-in</CardTitle>
        <CardDescription>{today}</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
