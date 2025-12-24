import { Flame, Trophy } from 'lucide-react';
import { Card, CardContent } from './ui/card';

type StreakDisplayProps = {
  currentStreak: number;
  bestStreak: number;
};

export function StreakDisplay({
  currentStreak,
  bestStreak,
}: StreakDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-secondary/50">
        <CardContent className="flex flex-col items-center justify-center p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold">{currentStreak}</span>
          </div>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold">{bestStreak}</span>
          </div>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </CardContent>
      </Card>
    </div>
  );
}
