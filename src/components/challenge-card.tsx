'use client';

import Link from 'next/link';
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
    <Card className={cn('flex h-full flex-col shadow-md transition-shadow hover:shadow-xl', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{name}</CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <CardDescription>{category}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <StreakDisplay
          currentStreak={challenge.currentStreak || 0}
          bestStreak={challenge.bestStreak || 0}
        />
        <div className="mt-4 flex items-center space-x-2">
          <div className="flex -space-x-2 overflow-hidden">
            <TooltipProvider>
              {members.slice(0, 3).map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 border-2 border-background">
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
            <span className="text-xs text-muted-foreground">
              +{members.length - 3} others
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isMember ? (
          // User is a member - show View Challenge button
          <Button asChild className="w-full">
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
          // User is not a member - show Join button
          <Button 
            onClick={handleJoin}
            disabled={joiningChallenge}
            className="w-full"
            variant={variant === 'dashboard' ? 'default' : 'outline'}
          >
            {joiningChallenge ? 'Joining...' : 'Join Challenge'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
