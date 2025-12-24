'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './card';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const variantStyles = {
  default: 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/50',
  success: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50',
  warning: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/50',
  destructive: 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200/50 dark:border-red-800/50',
};

const trendStyles = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  variant = 'default',
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={`${variantStyles[variant]} h-full`}>
        <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div className="flex-1">
              <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </p>

              <div className="mt-2 md:mt-3 space-y-1 md:space-y-2">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>

                {subtext && (
                  <p className="text-xs md:text-sm text-muted-foreground">{subtext}</p>
                )}

                {trend && (
                  <div className={`flex items-center gap-1 text-xs md:text-sm font-semibold ${trendStyles[trend.direction]}`}>
                    <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
                    <span>{Math.abs(trend.value)}%</span>
                  </div>
                )}
              </div>
            </div>

            {icon && (
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-lg bg-background/50">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Responsive stat grid for dashboard
 */
export const StatGrid: React.FC<{
  stats: StatCardProps[];
  columns?: number;
}> = ({ stats, columns = 2 }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${columns} lg:grid-cols-${Math.min(columns + 1, 4)} gap-4 md:gap-6`}>
      {stats.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.3 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
};
