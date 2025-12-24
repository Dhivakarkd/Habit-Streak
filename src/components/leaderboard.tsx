'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LeaderboardEntry } from '@/lib/types';

type SortFilter = 'current-streak' | 'best-streak' | 'completion-rate' | 'missed-days';

interface LeaderboardProps {
  challengeId: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ challengeId }) => {
  const [activeFilter, setActiveFilter] = useState<SortFilter>('current-streak');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data
  const fetchLeaderboard = async (filter: SortFilter) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/leaderboard?filter=${filter}&challengeId=${challengeId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLeaderboard(activeFilter);
  }, [challengeId]);

  // Set up polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard(activeFilter);
    }, 30000);

    return () => clearInterval(interval);
  }, [activeFilter, challengeId]);

  const handleFilterChange = (filter: SortFilter) => {
    setActiveFilter(filter);
    fetchLeaderboard(filter);
  };

  const getMetricLabel = (filter: SortFilter): string => {
    switch (filter) {
      case 'current-streak':
        return 'Current Streak';
      case 'best-streak':
        return 'Best Streak';
      case 'completion-rate':
        return 'Completion Rate';
      case 'missed-days':
        return 'Missed Days';
    }
  };

  const getMetricValue = (entry: LeaderboardEntry, filter: SortFilter): string | number => {
    switch (filter) {
      case 'current-streak':
        return entry.currentStreak || 0;
      case 'best-streak':
        return entry.bestStreak || 0;
      case 'completion-rate':
        return `${entry.completionRate?.toFixed(1) || 0}%`;
      case 'missed-days':
        return entry.missedDays || 0;
    }
  };

  return (
    <div className="w-full">
      <Tabs value={activeFilter} onValueChange={(value) => handleFilterChange(value as SortFilter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current-streak">Current Streak</TabsTrigger>
          <TabsTrigger value="best-streak">Best Streak</TabsTrigger>
          <TabsTrigger value="completion-rate">Completion Rate</TabsTrigger>
          <TabsTrigger value="missed-days">Missed Days</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No entries yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">{getMetricLabel(activeFilter)}</TableHead>
                  <TableHead>Achievements</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => (
                  <TableRow key={entry.userId}>
                    <TableCell className="font-bold">
                      <Badge variant={entry.rank === 1 ? 'default' : 'outline'}>{entry.rank}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.avatarUrl} alt={entry.username} />
                          <AvatarFallback>{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{entry.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{getMetricValue(entry, activeFilter)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {entry.achievements.map((achievement) => (
                          <Badge
                            key={achievement.id}
                            variant="secondary"
                            title={achievement.description}
                            className="cursor-help"
                          >
                            {achievement.icon ? <span className="mr-1">{achievement.icon}</span> : null}
                            {achievement.name}
                          </Badge>
                        ))}
                        {entry.achievements.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
