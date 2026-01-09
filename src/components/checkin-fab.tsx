'use client';

import { useState } from 'react';
import { Plus, Check, Trophy, ArrowLeft, ArrowRight, X, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DailyCheckin } from '@/components/daily-checkin';
import { useChallenges } from '@/hooks/use-challenges';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function CheckInFab() {
  const [open, setOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const { challenges, isLoading, invalidateChallenges } = useChallenges();

  // Filter for today's checkins
  const today = format(new Date(), 'yyyy-MM-dd');

  const getTodayStatus = (challenge: any) => {
    // If challenges data structure is complex, ensure we access checkins safely
    if (!challenge.checkins || !Array.isArray(challenge.checkins)) return undefined;
    const todayCheckin = challenge.checkins.find((c: any) => c.date === today);
    return todayCheckin?.status; // 'completed' | 'missed' | undefined
  };

  const pendingChallenges = challenges.filter(c => {
    const status = getTodayStatus(c);
    return status !== 'completed' && status !== 'missed';
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset selection when closing
      setTimeout(() => setSelectedChallenge(null), 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className={cn(
            "fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-xl z-50 transition-all hover:scale-110 active:scale-95",
            pendingChallenges.length > 0
              ? "bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 animate-pulse-soft"
              : "bg-emerald-500 hover:bg-emerald-600"
          )}
        >
          {pendingChallenges.length > 0 ? (
            <ClipboardCheck className="h-8 w-8 text-white" />
          ) : (
            <Check className="h-8 w-8 text-white" />
          )}
          <span className="sr-only">Quick Check-in</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden glass-card border-white/20"
        onInteractOutside={(e) => {
          setOpen(false);
        }}
      >
        
        {selectedChallenge ? (
          // DETAIL VIEW
          <>
            <DialogHeader className="p-4 px-6 border-b border-white/10 flex flex-row items-center gap-4 space-y-0">
               <Button 
                variant="ghost" 
                size="icon" 
                className="-ml-2 h-8 w-8 rounded-full" 
                onClick={() => setSelectedChallenge(null)}
               >
                 <ArrowLeft className="h-4 w-4" />
               </Button>
               <DialogTitle className="text-lg font-headline truncate flex-1">
                {selectedChallenge.name}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <DailyCheckin
                challengeId={selectedChallenge.id}
                todayStatus={getTodayStatus(selectedChallenge)}
                currentStreak={selectedChallenge.currentStreak}
                onCheckInSuccess={async () => {
                  await invalidateChallenges();
                  // Close after successful check-in since it will disappear from list
                  setTimeout(() => {
                    setSelectedChallenge(null);
                  }, 1000); 
                }}
              />
            </div>
          </>
        ) : (
          // LIST VIEW
          <>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                <Trophy className="h-6 w-6 text-indigo-500" />
                {pendingChallenges.length > 0 ? "Pending Check-ins" : "All Caught Up!"}
              </DialogTitle>
              <DialogDescription>
                 {pendingChallenges.length > 0 
                   ? "Select a challenge to check in for today." 
                   : "You've completed all your check-ins for the day."}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-4 py-2">
              <div className="space-y-2 p-2 pt-0">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading challenges...
                  </div>
                ) : challenges.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active challenges found. Join one to start tracking!
                  </div>
                ) : pendingChallenges.length === 0 ? (
                   <div className="text-center py-8 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 m-4">
                     <p className="text-emerald-600 dark:text-emerald-400 font-medium text-lg mb-2">
                       Great job! 🎉
                     </p>
                     <p className="text-emerald-600/80 dark:text-emerald-400/80 text-sm">
                       You've kept all your streaks alive today.
                     </p>
                   </div>
                ) : (
                  pendingChallenges.map((challenge) => {
                    return (
                      <Button
                        key={challenge.id}
                        variant="ghost"
                        onClick={() => setSelectedChallenge(challenge)}
                        className="w-full justify-between h-auto py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl group"
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-semibold text-base">{challenge.name}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {challenge.category} • {challenge.currentStreak} day streak
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                           <div className="h-8 w-8 rounded-full bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors flex items-center justify-center">
                              <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>
                      </Button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
