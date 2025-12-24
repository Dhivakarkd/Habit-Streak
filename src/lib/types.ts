export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Checkin = {
  userId: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'missed' | 'pending';
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  category: 'Fitness' | 'Wellness' | 'Productivity' | 'Learning' | 'Creative';
  icon: React.ComponentType<{ className?: string }>;
  currentStreak: number;
  bestStreak: number;
  members: User[];
  checkins: Checkin[];
};
