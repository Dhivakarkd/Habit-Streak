import { motion } from 'framer-motion';
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
    <div className="grid grid-cols-2 gap-2 md:gap-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/50 h-full">
          <CardContent className="flex flex-col items-center justify-center p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 md:h-6 md:w-6 text-orange-500 dark:text-orange-400" />
              <span className="text-xl md:text-2xl font-bold text-foreground">{currentStreak}</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Current Streak</p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200/50 dark:border-yellow-800/50 h-full">
          <CardContent className="flex flex-col items-center justify-center p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 md:h-6 md:w-6 text-yellow-500 dark:text-yellow-400" />
              <span className="text-xl md:text-2xl font-bold text-foreground">{bestStreak}</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Best Streak</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
