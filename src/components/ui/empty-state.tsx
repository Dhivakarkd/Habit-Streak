'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <AlertCircle className="w-16 h-16 md:w-24 md:h-24 text-muted-foreground/50" />,
  title,
  description,
  action,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center gap-3 md:gap-4 py-8 md:py-16 px-4 ${className}`}
    >
      <div className="flex items-center justify-center">{icon}</div>

      <div className="text-center space-y-2 md:space-y-3">
        <h3 className="text-lg md:text-xl font-semibold text-foreground">{title}</h3>

        {description && (
          <p className="text-sm md:text-base text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>

      {action && (
        <Button onClick={action.onClick} variant="default" className="mt-2 md:mt-4 min-w-[120px]">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};
