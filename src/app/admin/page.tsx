'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Challenge {
  id: string;
  name: string;
  description: string;
  category: string;
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export default function AdminChallengesPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  // Fetch challenges
  useEffect(() => {
    if (!user?.id) return;

    const fetchChallenges = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/challenges', {
          headers: {
            'X-User-ID': user.id,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch challenges');
        }

        const data = await response.json();
        if (data.success) {
          setChallenges(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch challenges:', error);
        toast({
          title: 'Error',
          description: 'Failed to load challenges',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [user?.id, toast]);

  if (authLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50 p-4 md:p-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const activeChallenges = challenges.filter((c) => !c.isArchived);
  const archivedChallenges = challenges.filter((c) => c.isArchived);

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Challenge Management</h1>
                <p className="text-muted-foreground">View and manage challenges</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Challenges ({activeChallenges.length})</TabsTrigger>
              <TabsTrigger value="archived">Archived Challenges ({archivedChallenges.length})</TabsTrigger>
            </TabsList>

            {/* Active Challenges Tab */}
            <TabsContent value="active" className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : activeChallenges.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  No active challenges found
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeChallenges.map((challenge) => (
                    <Card
                      key={challenge.id}
                      className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(`/admin/challenges/${challenge.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{challenge.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {challenge.description}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Badge variant="secondary">{challenge.category}</Badge>
                            <Badge variant="outline">{challenge.memberCount || 0} members</Badge>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button variant="default" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/challenges/${challenge.id}`);
                          }}>
                            Manage
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Archived Challenges Tab */}
            <TabsContent value="archived" className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : archivedChallenges.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  No archived challenges
                </Card>
              ) : (
                <div className="space-y-4">
                  {archivedChallenges.map((challenge) => (
                    <Card
                      key={challenge.id}
                      className="p-6 opacity-75 cursor-pointer hover:shadow-lg transition-shadow flex items-center justify-between"
                      onClick={() => router.push(`/admin/challenges/${challenge.id}`)}
                    >
                      <div>
                        <h3 className="text-xl font-semibold">{challenge.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Archived • {challenge.memberCount || 0} members
                        </p>
                      </div>
                      <Button variant="default" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/challenges/${challenge.id}`);
                      }}>
                        Manage
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
