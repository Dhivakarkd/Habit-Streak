/**
 * Icon System Configuration
 * Centralized mapping of icon types to brand colors for consistent visual hierarchy
 */

export type IconType = 'success' | 'error' | 'warning' | 'info' | 'streak' | 'achievement' | 'primary' | 'secondary';
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

const ICON_SIZE_MAP: Record<IconSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

/**
 * Get icon color class based on type
 * Uses Tailwind CSS color classes for consistency with design system
 */
export const getIconColor = (type: IconType): string => {
  const colorMap: Record<IconType, string> = {
    success: 'text-emerald-500 dark:text-emerald-400',
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-amber-500 dark:text-amber-400',
    info: 'text-blue-500 dark:text-blue-400',
    streak: 'text-orange-500 dark:text-orange-400',
    achievement: 'text-purple-500 dark:text-purple-400',
    primary: 'text-purple-600 dark:text-purple-400',
    secondary: 'text-blue-600 dark:text-blue-400',
  };

  return colorMap[type];
};

/**
 * Get icon size in pixels
 */
export const getIconSize = (size: IconSize): number => {
  return ICON_SIZE_MAP[size];
};

/**
 * Get responsive icon size based on breakpoint
 * Mobile: sm/md, Desktop: md/lg
 */
export const getResponsiveIconClass = (type: IconType, mobileSize: IconSize = 'sm', desktopSize: IconSize = 'md'): string => {
  const mobilePixels = getIconSize(mobileSize);
  const desktopPixels = getIconSize(desktopSize);

  const color = getIconColor(type);

  // Tailwind responsive sizing (w-X h-X)
  const sizeClass = `w-${mobilePixels} h-${mobilePixels} md:w-${desktopPixels} md:h-${desktopPixels}`;

  return `${sizeClass} ${color}`;
};

/**
 * Icon configuration with multiple properties for consistent rendering
 */
export interface IconConfig {
  type: IconType;
  size: IconSize;
  animate?: boolean;
  strokeWidth?: number;
}

/**
 * Get complete icon styling object
 */
export const getIconConfig = ({
  type,
  size = 'md',
  animate = false,
  strokeWidth = 2,
}: Partial<IconConfig> & { type: IconType }): IconConfig & { color: string; sizePixels: number } => {
  return {
    type,
    size,
    animate,
    strokeWidth,
    color: getIconColor(type),
    sizePixels: getIconSize(size),
  };
};

/**
 * Icon animation states for Framer Motion integration
 */
export const iconAnimationVariants = {
  success: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  pulse: {
    animate: { scale: [1, 1.1, 1] },
    transition: { duration: 2, repeat: Infinity },
  },
  bounce: {
    animate: { y: [0, -8, 0] },
    transition: { duration: 1, repeat: Infinity },
  },
  spin: {
    animate: { rotate: 360 },
    transition: { duration: 2, repeat: Infinity, linear: true },
  },
};

/**
 * Category icon mappings for challenge categories
 */
export const categoryIconColors: Record<string, IconType> = {
  Fitness: 'streak',
  Learning: 'primary',
  Wellness: 'info',
  Productivity: 'primary',
  Creative: 'achievement',
};

/**
 * Status icon color mappings
 */
export const statusIconColors: Record<string, IconType> = {
  completed: 'success',
  missed: 'error',
  pending: 'warning',
};
