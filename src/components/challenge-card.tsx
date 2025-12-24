'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell, Book, Leaf, Code, Palette } from 'lucide-react';
import type { Challenge } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StreakDisplay } from '@/components/streak-display';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { getIconColor } from '@/lib/icon-config';

type ChallengeCardProps = {
  challenge: Challenge;
  isMember?: boolean;
  onJoinSuccess?: () => void;
  variant?: 'dashboard' | 'discover';
  className?: string;
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Fitness': Dumbbell,
  'Learning': Book,
  'Wellness': Leaf,
  'Productivity': Code,
  'Creative': Palette,
};

const categoryIconType: Record<string, 'streak' | 'primary' | 'secondary' | 'achievement'> = {
  'Fitness': 'streak',
  'Learning': 'primary',
  'Wellness': 'secondary',
  'Productivity': 'primary',
  'Creative': 'achievement',
};

export function ChallengeCard({
  challenge,
  isMember = false,
  onJoinSuccess,
  variant = 'dashboard',
  className,
}: ChallengeCardProps) {
  const { id, name, category, members = [] } = challenge;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [joiningChallenge, setJoiningChallenge] = useState(false);
  const Icon = categoryIcons[category] || Dumbbell;

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to join',
        variant: 'destructive',
      });
      return;
    }

    setJoiningChallenge(true);
    try {
      console.log('[CHALLENGE CARD] Joining challenge:', id);
      const response = await fetch(`/api/challenges/${id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
      });

      if (response.ok) {
        console.log('[CHALLENGE CARD] Joined successfully');
        toast({
          title: 'Success',
          description: 'You have joined the challenge!',
        });
        
        // Dispatch custom event for cache invalidation across the app
        window.dispatchEvent(new CustomEvent('challengeJoined', { detail: { challengeId: id, userId: user.id } }));
        
        onJoinSuccess?.();
        // Navigate to the challenge
        router.push(`/challenges/${id}`);
      } else {
        const error = await response.json();
        console.error('[CHALLENGE CARD] Join failed:', error);
        toast({
          title: 'Error',
          description: error.error || 'Failed to join challenge',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[CHALLENGE CARD] Exception:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setJoiningChallenge(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className={cn('flex h-full flex-col shadow-sm hover:shadow-md transition-shadow', className)}>
        <CardHeader className="pb-3 md:pb-4">
          <div className="flex items-start justify-between gap-2 md:gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base md:text-lg font-semibold truncate">{name}</CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">{category}</CardDescription>
            </div>
            <div className={`flex-shrink-0 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-secondary/50 ${getIconColor(categoryIconType[category] || 'primary')}`}>
              <Icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow pb-3 md:pb-4 space-y-3 md:space-y-4">
          <StreakDisplay
            currentStreak={challenge.currentStreak || 0}
            bestStreak={challenge.bestStreak || 0}
          />
          <div className="flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="flex -space-x-2 overflow-hidden">
                <TooltipProvider>
                  {members.slice(0, 3).map((member) => (
                    <Tooltip key={member.id}>
                      <TooltipTrigger asChild>
                        <Avatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-background">
                          <AvatarImage src={member.avatarUrl} alt={member.username} />
                          <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{member.username}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
              {members.length > 3 && (
                <span className="text-muted-foreground">+{members.length - 3}</span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 md:pt-3">
          {isMember ? (
            <Button asChild className="w-full min-h-[44px]" size="sm">
              <Link href={`/challenges/${id}`}>
                {variant === 'dashboard' ? (
                  <>
                    View Challenge <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  'Go to Challenge'
                )}
              </Link>
            </Button>
          ) : (
            <Button 
              onClick={handleJoin}
              disabled={joiningChallenge}
              className="w-full min-h-[44px]"
              size="sm"
              variant={variant === 'dashboard' ? 'default' : 'outline'}
            >
              {joiningChallenge ? 'Joining...' : 'Join Challenge'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
