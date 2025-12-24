// Auth & Session Types
export type AuthSession = {
  user: AuthUser | null;
  session: {
    access_token: string;
    refresh_token: string;
  } | null;
};

export type AuthUser = {
  id: string;
  email: string;
  username: string;
};

// User Types
export type User = {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canCreateChallenges: boolean;
  createdAt: string;
  updatedAt: string;
};

// Challenge Types
export type Challenge = {
  id: string;
  name: string;
  description: string;
  category: 'Fitness' | 'Wellness' | 'Productivity' | 'Learning' | 'Creative';
  icon?: React.ComponentType<{ className?: string }>;
  createdBy: string | null; // null for default challenges
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  currentStreak?: number;
  bestStreak?: number;
  members?: User[];
  checkins?: Checkin[];
};

// Check-in Types
export type Checkin = {
  id: string;
  challengeId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'missed' | 'pending';
  createdAt: string;
};

// Leaderboard Types
export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  currentStreak?: number;
  bestStreak?: number;
  completionRate?: number;
  totalCompletions?: number;
  missedDays?: number;
  achievements: Achievement[];
};

// Achievement Types
export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  criteria: 'streak_7' | 'streak_30' | 'streak_100' | 'perfect_week' | 'first_completion' | 'comeback';
};

export type AchievementEarned = {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  earnedAt: string;
};

// API Response Types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Request/Response DTOs
export type SignupRequest = {
  username: string;
  email: string;
  password: string;
};

export type SigninRequest = {
  username: string;
  password: string;
};

export type CreateChallengeRequest = {
  name: string;
  description: string;
  category: 'Fitness' | 'Wellness' | 'Productivity' | 'Learning' | 'Creative';
};

export type CheckinRequest = {
  challengeId: string;
  date: string;
  status: 'completed' | 'missed' | 'pending';
};
