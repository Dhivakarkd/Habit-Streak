'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaderboardEntry } from '@/lib/types';

type LeaderboardTab = 'streaks' | 'missed-days';

interface ChallengeLeaderboardProps {
  challengeId: string;
}

export function ChallengeLeaderboard({ challengeId }: ChallengeLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('streaks');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data
  const fetchLeaderboard = async (tab: LeaderboardTab) => {
    try {
      setLoading(true);
      setError(null);

      const metric = tab === 'streaks' ? 'current-streak' : 'missed-days';
      const response = await fetch(`/api/leaderboard?metric=${metric}&challengeId=${challengeId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }

      const data = await response.json();
      console.log('[CHALLENGE LEADERBOARD] Fetched leaderboard:', data.data?.length, 'entries');
      setLeaderboard(data.data || []);
    } catch (err) {
      console.error('[CHALLENGE LEADERBOARD] Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    fetchLeaderboard(activeTab);

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchLeaderboard(activeTab);
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab, challengeId]);

  const handleTabChange = (tab: LeaderboardTab) => {
    setActiveTab(tab);
  };

  const getMetricLabel = (): string => {
    return activeTab === 'streaks' ? 'Current Streak' : 'Missed Days';
  };

  const getMetricValue = (entry: LeaderboardEntry): number | undefined => {
    return activeTab === 'streaks' ? entry.currentStreak : entry.missedDays;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as LeaderboardTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="streaks" className="text-sm">
              Streaks
            </TabsTrigger>
            <TabsTrigger value="missed-days" className="text-sm">
              Missed Days
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground text-sm">No entries yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">{getMetricLabel()}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow key={entry.userId} className="hover:bg-muted/50">
                        <TableCell className="text-center">
                          <Badge
                            variant={index < 3 ? 'default' : 'secondary'}
                            className={
                              index === 0
                                ? 'bg-yellow-500 text-white'
                                : index === 1
                                  ? 'bg-gray-400 text-white'
                                  : index === 2
                                    ? 'bg-orange-600 text-white'
                                    : ''
                            }
                          >
                            {entry.rank}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={entry.avatarUrl} alt={entry.username} />
                              <AvatarFallback className="text-xs">
                                {entry.username?.slice(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{entry.username}</span>
                              {entry.achievements && entry.achievements.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {entry.achievements.slice(0, 2).map((achievement, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs py-0">
                                      {achievement.icon || '🏆'}
                                    </Badge>
                                  ))}
                                  {entry.achievements.length > 2 && (
                                    <Badge variant="outline" className="text-xs py-0">
                                      +{entry.achievements.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {getMetricValue(entry) ?? 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
