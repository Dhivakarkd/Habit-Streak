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
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Shield, Users, Archive, LayoutGrid, Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
             <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
             <p className="text-muted-foreground animate-pulse">Verifying access...</p>
           </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Filter challenges based on search
  const filteredChallenges = challenges.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChallenges = filteredChallenges.filter((c) => !c.isArchived);
  const archivedChallenges = filteredChallenges.filter((c) => c.isArchived);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Admin Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white pb-12 pt-8 md:pt-12 px-4 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-4 text-indigo-300">
             <Shield className="h-5 w-5" />
             <span className="text-sm font-semibold uppercase tracking-wider">Admin Portal</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline mb-4">
            Challenge Management
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Oversee all active challenges, manage memberships, and review platform engagement stats.
          </p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 -mt-8">
        {/* Stats Overview (Static for now) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Challenges</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{challenges.length}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <LayoutGrid className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
           </Card>
           <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg bg-emerald-50/50 dark:bg-emerald-950/10">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{challenges.reduce((acc, c) => acc + (c.memberCount || 0), 0)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
           </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 border max-w-md">
            <Search className="h-5 w-5 text-muted-foreground ml-3" />
            <Input
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* Filters & Content */}
        <div className="space-y-6">
          <Tabs defaultValue="active" className="w-full">
            <div className="flex items-center justify-between mb-6">
               <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="active" className="px-4">Active ({activeChallenges.length})</TabsTrigger>
                <TabsTrigger value="archived" className="px-4">Archived ({archivedChallenges.length})</TabsTrigger>
              </TabsList>
            </div>

            {/* Active Challenges Tab */}
            <TabsContent value="active" className="space-y-4 mt-0">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : activeChallenges.length === 0 ? (
                <Card className="glass-card p-12 text-center text-muted-foreground border-dashed">
                  <div className="mx-auto h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    <LayoutGrid className="h-8 w-8 opacity-50" />
                  </div>
                  No active challenges found
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeChallenges.map((challenge) => (
                    <Card
                      key={challenge.id}
                      className="glass-card p-6 cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all duration-200 border-l-4 border-l-indigo-500"
                      onClick={() => router.push(`/admin/challenges/${challenge.id}`)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                             <h3 className="text-xl font-bold font-headline truncate">{challenge.name}</h3>
                             <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-0">
                                {challenge.category}
                             </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {challenge.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                             <span className="flex items-center gap-1">
                               <Users className="h-3.5 w-3.5" /> {challenge.memberCount || 0} members
                             </span>
                             <span>•</span>
                             <span>Created {new Date(challenge.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-indigo-600">
                           <ChevronRight className="h-6 w-6" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Archived Challenges Tab */}
            <TabsContent value="archived" className="space-y-4 mt-0">
              {loading ? (
                 <div className="space-y-4">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : archivedChallenges.length === 0 ? (
                <Card className="glass-card p-12 text-center text-muted-foreground border-dashed">
                   No archived challenges
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {archivedChallenges.map((challenge) => (
                    <Card
                      key={challenge.id}
                      className="glass-card p-6 opacity-75 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 cursor-pointer transition-all duration-200 border-l-4 border-l-slate-400 group"
                      onClick={() => router.push(`/admin/challenges/${challenge.id}`)}
                    >
                      <div className="flex items-center justify-between">
                         <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                             <h3 className="text-xl font-bold text-muted-foreground group-hover:text-foreground transition-colors">{challenge.name}</h3>
                             <Badge variant="outline" className="border-slate-400 text-slate-500">
                                Archived
                             </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                             {challenge.memberCount || 0} members • {challenge.category}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0">
                           <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
