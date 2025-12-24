import type { User, Challenge } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Dumbbell, BookOpen, BrainCircuit, Brush, Leaf } from 'lucide-react';
import { subDays, format } from 'date-fns';

const users: User[] = PlaceHolderImages.map((img, index) => ({
  id: `user-${index + 1}`,
  name: `User ${index + 1}`,
  avatarUrl: img.imageUrl,
}));

// A function to get a random subset of users
const getRandomUsers = (count: number): User[] => {
  const shuffled = [...users].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateCheckins = (members: User[], days: number, completionRate: number) => {
  const checkins: { userId: string; date: string; status: 'completed' | 'missed' | 'pending' }[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = subDays(today, i);
    for (const member of members) {
      if (i === 0) { // Today
        checkins.push({
          userId: member.id,
          date: format(date, 'yyyy-MM-dd'),
          status: 'pending',
        });
      } else {
        checkins.push({
          userId: member.id,
          date: format(date, 'yyyy-MM-dd'),
          status: Math.random() < completionRate ? 'completed' : 'missed',
        });
      }
    }
  }
  return checkins;
};

const challengeMembers1 = getRandomUsers(4);
const challengeMembers2 = getRandomUsers(3);
const challengeMembers3 = getRandomUsers(5);
const challengeMembers4 = getRandomUsers(2);

export const mockChallenges: Challenge[] = [
  {
    id: '1',
    name: '30-Day Fitness Quest',
    description: 'Commit to 30 minutes of exercise every day for 30 days. Any activity counts!',
    category: 'Fitness',
    icon: Dumbbell,
    currentStreak: 12,
    bestStreak: 25,
    members: challengeMembers1,
    checkins: generateCheckins(challengeMembers1, 30, 0.8),
  },
  {
    id: '2',
    name: 'Daily Reading Habit',
    description: 'Read at least 20 pages of a book every day. Expand your mind, one page at a time.',
    category: 'Learning',
    icon: BookOpen,
    currentStreak: 5,
    bestStreak: 10,
    members: challengeMembers2,
    checkins: generateCheckins(challengeMembers2, 15, 0.7),
  },
  {
    id: '3',
    name: 'Mindfulness Moments',
    description: 'Practice 10 minutes of meditation or mindfulness each day to reduce stress and improve focus.',
    category: 'Wellness',
    icon: Leaf,
    currentStreak: 28,
    bestStreak: 28,
    members: challengeMembers3,
    checkins: generateCheckins(challengeMembers3, 40, 0.9),
  },
  {
    id: '4',
    name: 'Code Something Daily',
    description: 'Write code for at least 15 minutes every day. Personal projects, tutorials, or contributions.',
    category: 'Productivity',
    icon: BrainCircuit,
    currentStreak: 0,
    bestStreak: 7,
    members: challengeMembers4,
    checkins: generateCheckins(challengeMembers4, 10, 0.6),
  },
];

export const mockUser = users[0];

export const allUsers = users;
