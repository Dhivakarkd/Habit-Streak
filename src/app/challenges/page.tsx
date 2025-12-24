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
  const [membershipMap, setMembershipMap] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchChallengesAndMembership = async () => {
      try {
        console.log('[CHALLENGES PAGE] Fetching all challenges...');
        
        // Use cache with 5-minute TTL for all challenges list
        const cacheKey = `challenges:all:user:${user?.id || 'anonymous'}`;
        const allChallenges = await getCachedData(
          cacheKey,
          async () => {
            // Pass all=true to get all challenges, and include user ID for streak data
            const response = await fetch('/api/challenges?all=true', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(user && { 'X-User-ID': user.id }),
              },
            });
            console.log('[CHALLENGES PAGE] Response status:', response.status);
            if (response.ok) {
              const data = await response.json();
              console.log('[CHALLENGES PAGE] Data received:', data.data?.length, 'challenges');
              return data.data || [];
            } else {
              console.error('[CHALLENGES PAGE] Response not ok:', response.statusText);
              const errorData = await response.json();
              console.error('[CHALLENGES PAGE] Error data:', errorData);
              throw new Error('Failed to fetch challenges');
            }
          },
          5 * 60 * 1000 // 5 minute TTL
        );
        
        setChallenges(allChallenges);
        setFilteredChallenges(allChallenges);

        // Cache membership checks with 5-minute TTL
        if (user) {
          const membershipCacheKey = `challenge:memberships:${user.id}`;
          const membershipData = await getCachedData(
            membershipCacheKey,
            async () => {
              console.log('[CHALLENGES PAGE] Fetching membership for all challenges...');
              const result: Record<string, boolean> = {};
              
              // Check membership in parallel for faster loading
              await Promise.all(
                allChallenges.map(async (challenge: Challenge) => {
                  try {
                    const membershipResponse = await fetch(
                      `/api/challenges/${challenge.id}/membership`,
                      {
                        headers: {
                          'X-User-ID': user.id,
                        },
                      }
                    );
                    if (membershipResponse.ok) {
                      const membershipInfo = await membershipResponse.json();
                      result[challenge.id] = membershipInfo.data?.isMember || false;
                    }
                  } catch (err) {
                    console.error('[CHALLENGES PAGE] Error checking membership for', challenge.id, err);
                  }
                })
              );
              
              return result;
            },
            5 * 60 * 1000 // 5 minute TTL
          );
          
          setMembershipMap(membershipData);
        }
      } catch (error) {
        console.error('[CHALLENGES PAGE] Failed to fetch challenges:', error);
      } finally {
        setLoadingChallenges(false);
      }
    };

    if (user) {
      console.log('[CHALLENGES PAGE] User exists:', user.email, 'fetching challenges');
      fetchChallengesAndMembership();
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
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">
              Discover Challenges
            </h1>
            <p className="text-sm text-muted-foreground">
              Join a community or start your own journey.
            </p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Input
              placeholder="Search challenges..."
              className="flex-1 md:w-64"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Button asChild>
              <Link href="/challenges/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isMember={membershipMap[challenge.id] || false}
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
