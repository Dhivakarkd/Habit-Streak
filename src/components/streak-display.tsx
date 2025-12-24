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
    <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-center sm:justify-start w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0"
      >
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-950/30 dark:to-emerald-900/20 border-green-200/50 dark:border-green-800/50 h-full hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-600 dark:text-green-400" />
              <span className="text-lg sm:text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300">{currentStreak}</span>
            </div>
            <p className="text-xs font-medium text-green-600 dark:text-green-400">Current Streak</p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex-shrink-0"
      >
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100/50 dark:from-amber-950/30 dark:to-yellow-900/20 border-amber-200/50 dark:border-amber-800/50 h-full hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-amber-600 dark:text-amber-400" />
              <span className="text-lg sm:text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-300">{bestStreak}</span>
            </div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Best Streak</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
