'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Challenge } from '@/lib/types';
import { useCallback, useEffect } from 'react';

/**
 * Hook to fetch and manage challenges
 */
export function useChallenges() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const {
        data: challenges = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['challenges', user?.id],
        queryFn: async (): Promise<Challenge[]> => {
            // Don't fetch if no user
            if (!user?.id) return [];

            console.log('[USE_CHALLENGES] Fetching challenges for:', user.id);

            const response = await fetch('/api/challenges');

            if (!response.ok) {
                throw new Error('Failed to fetch challenges');
            }

            const result = await response.json();
            return result.data || [];
        },
        // Only run query if we have a user
        enabled: !!user?.id,
    });

    // Function to invalidate cache and refetch (useful after check-ins)
    const invalidateChallenges = useCallback(() => {
        if (user?.id) {
            console.log('[USE_CHALLENGES] Invalidating challenges cache');
            queryClient.invalidateQueries({ queryKey: ['challenges', user.id] });
        }
    }, [queryClient, user?.id]);

    // Listen for global challenge joined events to trigger refetch
    // This maintains compatibility with existing event-based updates
    useEffect(() => {
        const handleChallengeJoined = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail.userId === user?.id) {
                invalidateChallenges();
            }
        };

        window.addEventListener('challengeJoined', handleChallengeJoined);
        return () => {
            window.removeEventListener('challengeJoined', handleChallengeJoined);
        };
    }, [user?.id, invalidateChallenges]);

    return {
        challenges,
        isLoading,
        error,
        refetch,
        invalidateChallenges,
    };
}
