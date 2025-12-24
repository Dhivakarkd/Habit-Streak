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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="current-streak" className="text-xs md:text-sm px-1 md:px-3 py-1 md:py-2">
            <span className="hidden md:inline">Current Streak</span>
            <span className="md:hidden">Current</span>
          </TabsTrigger>
          <TabsTrigger value="best-streak" className="text-xs md:text-sm px-1 md:px-3 py-1 md:py-2">
            <span className="hidden md:inline">Best Streak</span>
            <span className="md:hidden">Best</span>
          </TabsTrigger>
          <TabsTrigger value="completion-rate" className="text-xs md:text-sm px-1 md:px-3 py-1 md:py-2">
            <span className="hidden md:inline">Completion Rate</span>
            <span className="md:hidden">Rate</span>
          </TabsTrigger>
          <TabsTrigger value="missed-days" className="text-xs md:text-sm px-1 md:px-3 py-1 md:py-2">
            <span className="hidden md:inline">Missed Days</span>
            <span className="md:hidden">Missed</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-4 md:mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs md:text-sm text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs md:text-sm text-red-500">{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs md:text-sm text-muted-foreground">No entries yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full md:w-full px-4 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs md:text-sm">
                      <TableHead className="w-8 md:w-12">Rank</TableHead>
                      <TableHead className="min-w-32 md:min-w-40">User</TableHead>
                      <TableHead className="text-right min-w-24 md:min-w-32">{getMetricLabel(activeFilter)}</TableHead>
                      <TableHead className="hidden md:table-cell min-w-40">Achievements</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry) => (
                      <TableRow key={entry.userId} className="text-xs md:text-sm">
                        <TableCell className="font-bold">
                          <Badge variant={entry.rank === 1 ? 'default' : 'outline'} className="text-xs">
                            {entry.rank}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 md:gap-3">
                            <Avatar className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0">
                              <AvatarImage src={entry.avatarUrl} alt={entry.username} />
                              <AvatarFallback className="text-xs">{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate text-xs md:text-sm">{entry.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{getMetricValue(entry, activeFilter)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            {entry.achievements.slice(0, 3).map((achievement) => (
                              <Badge
                                key={achievement.id}
                                variant="secondary"
                                title={achievement.description}
                                className="cursor-help text-xs"
                              >
                                {achievement.icon ? <span className="mr-1">{achievement.icon}</span> : null}
                                <span className="hidden lg:inline">{achievement.name}</span>
                              </Badge>
                            ))}
                            {entry.achievements.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.achievements.length - 3}
                              </Badge>
                            )}
                            {entry.achievements.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
