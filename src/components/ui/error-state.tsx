'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface ErrorStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  icon = <AlertTriangle className="w-16 h-16 md:w-24 md:h-24 text-destructive/70" />,
  title,
  description,
  action,
  secondaryAction,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center gap-3 md:gap-4 py-8 md:py-16 px-4 rounded-lg bg-destructive/5 border border-destructive/20 ${className}`}
    >
      <div className="flex items-center justify-center">{icon}</div>

      <div className="text-center space-y-2 md:space-y-3">
        <h3 className="text-lg md:text-xl font-semibold text-destructive">{title}</h3>

        {description && (
          <p className="text-sm md:text-base text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-2 md:mt-4 w-full sm:w-auto">
        {action && (
          <Button
            onClick={action.onClick}
            variant="destructive"
            className="w-full sm:w-auto min-h-[44px]"
          >
            {action.label}
          </Button>
        )}

        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="outline"
            className="w-full sm:w-auto min-h-[44px]"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Full page error state
 */
export const FullPageErrorState: React.FC<ErrorStateProps> = (props) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <ErrorState {...props} />
    </div>
  );
};
