import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { ChallengeCard } from '@/components/challenge-card';
import { mockChallenges } from '@/lib/data';
import { Input } from '@/components/ui/input';

export default function ChallengesPage() {
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
             <Input placeholder="Search challenges..." className="flex-1 md:w-64" />
            <Button asChild>
              <Link href="/challenges/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              variant="discover"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
