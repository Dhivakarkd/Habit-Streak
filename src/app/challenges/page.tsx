'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { ChallengeCard } from '@/components/challenge-card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { Challenge } from '@/lib/types';
import { getCachedData, revalidateCache } from '@/lib/cache';

export default function ChallengesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  // map not strictly needed if we trust the API, but useful for optimistic updates
  const [membershipMap, setMembershipMap] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        console.log('[CHALLENGES PAGE] Fetching all challenges...');
        
        // Pass all=true to get all challenges, and include user ID for membership status
        const response = await fetch('/api/challenges?all=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(user && { 'X-User-ID': user.id }),
          },
        });

        if (response.ok) {
          const result = await response.json();
          const allChallenges = result.data || [];
          setChallenges(allChallenges);
          setFilteredChallenges(allChallenges);
        }
      } catch (error) {
        console.error('[CHALLENGES PAGE] Failed to fetch challenges:', error);
      } finally {
        setLoadingChallenges(false);
      }
    };

    if (user) {
      fetchChallenges();
    }
  }, [user]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = challenges.filter(
      (challenge) =>
        challenge.name.toLowerCase().includes(term.toLowerCase()) ||
        challenge.description?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredChallenges(filtered);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold leading-none tracking-tight">
              Discover Challenges
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Join a community or start your own journey.
            </p>
          </div>
          <div className="flex w-full md:w-auto gap-2 flex-shrink-0">
            <Input
              placeholder="Search challenges..."
              className="flex-1 md:flex-initial md:w-64"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Button asChild className="flex-shrink-0">
              <Link href="/challenges/new">
                <PlusCircle className="mr-1 md:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
                <span className="sm:hidden">+</span>
              </Link>
            </Button>
          </div>
        </div>

        {loadingChallenges ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading challenges...</p>
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'No challenges match your search.' : 'No challenges available.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="w-full basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 min-w-0"
              >
                <ChallengeCard
                  challenge={challenge}
                  // Prefer map if set (optimistic), else legacy property (API)
                  isMember={membershipMap[challenge.id] ?? (challenge as any).isMember}
                  onJoinSuccess={() => {
                    // Update membership map after joining
                    setMembershipMap(prev => ({
                      ...prev,
                      [challenge.id]: true
                    }));
                    
                    // Invalidate both dashboard and challenges caches
                    if (user) {
                      revalidateCache(`challenges:user:${user.id}`);
                      revalidateCache(`challenges:all:user:${user.id}`);
                      revalidateCache(`challenge:memberships:${user.id}`);
                    }
                  }}
                  variant="discover"
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
