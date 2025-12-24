import { Check, Hourglass, X } from 'lucide-react';
import type { Checkin, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

type MembersListProps = {
  members: User[];
  checkins: Checkin[];
  completionRates?: Record<string, number>; // userId -> completion_rate %
};

const ProgressRing = ({ 
  percentage, 
  status,
  size = 'md'
}: { 
  percentage: number;
  status: 'completed' | 'missed' | 'pending' | 'freeze';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizeMap = {
    sm: { radius: 20, circumference: 125 },
    md: { radius: 24, circumference: 150 },
    lg: { radius: 32, circumference: 200 }
  };

  const { radius, circumference } = sizeMap[size];
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = '#9CA3AF'; // gray for pending
  let bgGradient = 'from-gray-100 to-gray-50';
  let bgDark = 'dark:from-gray-800 dark:to-gray-900';

  if (status === 'completed') {
    strokeColor = '#10B981'; // emerald
    bgGradient = 'from-emerald-50 to-emerald-100';
    bgDark = 'dark:from-emerald-900/30 dark:to-emerald-800/30';
  } else if (status === 'missed') {
    strokeColor = '#EF4444'; // red
    bgGradient = 'from-red-50 to-red-100';
    bgDark = 'dark:from-red-900/30 dark:to-red-800/30';
  }

  return (
    <div className={`inline-flex items-center justify-center`}>
      <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 2}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 2}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-800 ease-out"
        />
      </svg>
      <div className={`absolute w-${size === 'sm' ? '8' : size === 'md' ? '10' : '14'} h-${size === 'sm' ? '8' : size === 'md' ? '10' : '14'} rounded-full bg-gradient-to-br ${bgGradient} ${bgDark} flex items-center justify-center`}>
        <span className={`text-${size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'base'} font-bold`}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

const StatusIcon = ({ status }: { status: 'completed' | 'missed' | 'pending' | 'freeze' }) => {
  switch (status) {
    case 'completed':
      return (
        <Tooltip>
          <TooltipTrigger>
            <Check className="h-5 w-5 text-green-500" />
          </TooltipTrigger>
          <TooltipContent>Completed</TooltipContent>
        </Tooltip>
      );
    case 'missed':
      return (
        <Tooltip>
          <TooltipTrigger>
            <X className="h-5 w-5 text-red-500" />
          </TooltipTrigger>
          <TooltipContent>Missed</TooltipContent>
        </Tooltip>
      );
    case 'freeze':
      return (
        <Tooltip>
          <TooltipTrigger>
            <X className="h-5 w-5 text-blue-500" />
          </TooltipTrigger>
          <TooltipContent>Freeze Day</TooltipContent>
        </Tooltip>
      );
    default:
      return (
        <Tooltip>
          <TooltipTrigger>
            <Hourglass className="h-5 w-5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>Pending</TooltipContent>
        </Tooltip>
      );
  }
};

export function MembersList({ members, checkins, completionRates = {} }: MembersListProps) {
  const { user } = useAuth();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysCheckins = checkins.filter((c) => c.date === todayStr);

  const getMemberStatus = (userId: string) => {
    const checkin = todaysCheckins.find((c) => c.userId === userId);
    return checkin ? checkin.status : 'pending';
  };

  const isCurrentUser = (userId: string) => user?.id === userId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Today's Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          <TooltipProvider>
            {members.map((member) => {
              const displayName = member.displayName || member.username || 'User';
              const initial = displayName.charAt(0).toUpperCase();
              const status = getMemberStatus(member.id);
              const completionRate = completionRates[member.id] || 0;
              const isYou = isCurrentUser(member.id);

              return (
                <li key={member.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Progress Ring */}
                    <div className="relative">
                      <ProgressRing 
                        percentage={completionRate} 
                        status={status}
                        size="md"
                      />
                      {isYou && (
                        <Badge 
                          variant="default" 
                          className="absolute -bottom-1 -right-1 h-5 text-xs bg-blue-500 hover:bg-blue-600"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(completionRate)}% completion
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusIcon status={status} />
                  </div>
                </li>
              );
            })}
          </TooltipProvider>
        </ul>
      </CardContent>
    </Card>
  );
}
