import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to home
        await page.goto('/');
    });

    // Note: These tests assume a clean state or specific users exist.
    // Since we don't have a reliable seeding mechanism for E2E in this environment,
    // we'll focus on the structure and presence of keys.

    // Actually, without a backend running/seeded, these will fail if they depend on real data.
    // But we have the dev server running (via playwright config).

    test('should redirect unauthenticated user to login', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL('/');
    });

    test('should allow login and redirect to dashboard', async ({ page }) => {
        // Create a random user for this test to avoid conflicts
        const username = `user_${Date.now()}`;
        const email = `${username}@example.com`;
        const password = 'Password123!';

        // Fill signup form
        await page.getByRole('button', { name: 'Sign Up' }).click();
        await page.getByLabel('Username').fill(username);
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Password').fill(password);
        await page.getByRole('button', { name: 'Create Account' }).click();

        // Wait for success toast or assertion
        await expect(page.getByText('Account created! Please sign in.')).toBeVisible();

        // Switch to sign in and login
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Password').fill(password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');

        // Should see welcome message
        await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();

        // Should see challenges empty state (since new user)
        await expect(page.getByText('No challenges joined yet')).toBeVisible();
    });
});
