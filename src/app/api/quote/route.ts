import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const response = await fetch('https://zenquotes.io/api/random', {
            headers: {
                'Cache-Control': 'no-cache',
            },
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch quote');
        }

        const data = await response.json();

        // ZenQuotes returns an array with one object
        if (Array.isArray(data) && data.length > 0) {
            const { q: text, a: author } = data[0];
            return NextResponse.json({ text, author });
        }

        throw new Error('Invalid quote format');
    } catch (error) {
        console.error('Error fetching quote:', error);
        // Fallback quote
        return NextResponse.json({
            text: "Small progress is still progress.",
            author: "Unknown"
        });
    }
}
