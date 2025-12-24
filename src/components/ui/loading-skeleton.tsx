'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'avatar' | 'line' | 'input';
  count?: number;
  className?: string;
}

const skeletonVariants = {
  initial: { opacity: 0.6 },
  animate: { opacity: 1 },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    repeatType: 'reverse' as const,
  },
};

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 1,
  className = '',
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <motion.div
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className={`w-full h-32 md:h-40 bg-skeleton rounded-lg ${className}`}
          />
        );

      case 'text':
        return (
          <motion.div
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className={`w-full h-4 bg-skeleton rounded ${className}`}
          />
        );

      case 'avatar':
        return (
          <motion.div
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className={`w-12 h-12 md:w-16 md:h-16 bg-skeleton rounded-full ${className}`}
          />
        );

      case 'line':
        return (
          <motion.div
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className={`w-full h-2 bg-skeleton rounded ${className}`}
          />
        );

      case 'input':
        return (
          <motion.div
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className={`w-full h-10 md:h-12 bg-skeleton rounded ${className}`}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3 md:space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

/**
 * Responsive card skeleton loader
 */
export const CardSkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} variant="card" />
      ))}
    </div>
  );
};

/**
 * List skeleton loader
 */
export const ListSkeletonLoader: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3 md:space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-card">
          <LoadingSkeleton variant="avatar" />
          <div className="flex-1 space-y-2 md:space-y-3">
            <LoadingSkeleton variant="text" />
            <LoadingSkeleton variant="line" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
