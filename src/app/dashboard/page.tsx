import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { ChallengeCard } from '@/components/challenge-card';
import { mockChallenges, mockUser } from '@/lib/data';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">
              Welcome back, {mockUser.name}!
            </h1>
            <p className="text-sm text-muted-foreground">Here are your active challenges.</p>
          </div>
          <Button asChild>
            <Link href="/challenges/new">
              <PlusCircle className="mr-2 h-4 w-4" /> New Challenge
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </main>
    </div>
  );
}
