import { Check, Hourglass, X } from 'lucide-react';
import type { Checkin, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

type MembersListProps = {
  members: User[];
  checkins: Checkin[];
};

const StatusIcon = ({ status }: { status: Checkin['status'] }) => {
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

export function MembersList({ members, checkins }: MembersListProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysCheckins = checkins.filter((c) => c.date === todayStr);

  const getMemberStatus = (userId: string) => {
    const checkin = todaysCheckins.find((c) => c.userId === userId);
    return checkin ? checkin.status : 'pending';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          <TooltipProvider>
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{member.name}</span>
                </div>
                <StatusIcon status={getMemberStatus(member.id)} />
              </li>
            ))}
          </TooltipProvider>
        </ul>
      </CardContent>
    </Card>
  );
}
