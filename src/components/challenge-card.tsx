import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

type ChallengeCardProps = {
  challenge: Challenge;
  variant?: 'dashboard' | 'discover';
  className?: string;
};

export function ChallengeCard({
  challenge,
  variant = 'dashboard',
  className,
}: ChallengeCardProps) {
  const { id, name, category, icon: Icon, members } = challenge;

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
          currentStreak={challenge.currentStreak}
          bestStreak={challenge.bestStreak}
        />
        <div className="mt-4 flex items-center space-x-2">
          <div className="flex -space-x-2 overflow-hidden">
            <TooltipProvider>
              {members.slice(0, 3).map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{member.name}</p>
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
        {variant === 'dashboard' ? (
          <Button asChild className="w-full">
            <Link href={`/challenges/${id}`}>
              View Challenge <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" className="w-full">
            <Link href={`/challenges/${id}`}>
              View Details
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
