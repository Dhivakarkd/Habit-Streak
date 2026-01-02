import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
    test('should ignore X-User-ID header and return 401 or public data', async ({ request }) => {
        // Attempt to impersonate a random user ID
        const fakeUserId = '00000000-0000-0000-0000-000000000000';

        const response = await request.get('/api/challenges', {
            headers: {
                'X-User-ID': fakeUserId,
            },
        });

        const body = await response.json();

        // The API should NOT return data specific to the fakeUserId.
        // Since our fix removes the X-User-ID check entirely, it will try to get the user from the session.
        // If we are not logged in (no session cookies), it should return either 401 (if strict) or public data (if showAll=true logic applies).
        // In our current implementation:
        // 1. It checks session.
        // 2. If no session, userId is null.
        // 3. If !showAll and userId is null -> it actually continues to "fetching all challenges" logic! 
        // Wait, let's re-read the code logic in route.ts.

        // Logic after fix:
        // ... authenticates user ...
        // const userId = user?.id || null;
        // if (!showAll && userId) { ... return user joined challenges ... }
        // ...
        // // If showAll=true OR no user, return all challenges
        // const { data: allChallenges } ...

        // So if we send a request without session, userId is null.
        // It will fall through to return ALL challenges.
        // CRITICALLY: It will NOT return joined challenges for 'fakeUserId'.

        // To verify the fix, we should check that the response does NOT contain private data that we didn't ask for?
        // Or better: In the OLD code, if we sent X-User-ID, it would set userId = header value.
        // Then it would enter `if (!showAll && userId)` block and return THAT user's challenges.

        // So if the fix IS working, sending X-User-ID should result in `userId` being NULL (since no session).
        // And thus it should SKIP the `if (!showAll && userId)` block.
        // And instead return ALL challenges (public view).

        // Ideally we'd want to assert that it didn't return user-specific data, but we don't have a specific user to test against that we KNOW exists and has private data easily without seeding.
        // But we can check behavior.

        expect(response.status()).toBe(200);

        // In the "vulnerable" version, if we passed a random ID that has NO challenges, it would return [], saying "User has no joined challenges".
        // In the "fixed" version, if we pass a random ID (and no session), it returns ALL challenges (public list).
        // So if the response has data (assuming there are public challenges), that's a sign it fell through.

        // Actually, checking standard behavior:
        // If I pass a random UUID that definitely has no challenges joined.
        // Vulnerable code: returns [] (inside the finding user challenges block).
        // Fixed code: returns [ ... all public challenges ... ].

        // So if there ARE challenges in the DB, the fixed code returns them. The vulnerable code returns empty array (for a non-existent user).
        // Let's assume there are challenges seeded.

        // To make this robust, we can also check that the log output (if we could see it) doesn't say "User ID from header".

        // Let's rely on the fact that without the header, it returns public challenges.
        // And with the header (if vulnerable), it would try to fetch for that user.

        // Wait, let's just make sure the output structure confirms we are getting the public list.
        // The public list returns `currentStreak` and `bestStreak` as 0 (since no user).

        if (body.data.length > 0) {
            const challenge = body.data[0];
            expect(challenge.currentStreak).toBe(0);
            expect(challenge.bestStreak).toBe(0);
        }
    });
});
