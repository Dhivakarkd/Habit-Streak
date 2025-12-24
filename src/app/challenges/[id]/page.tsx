import { Header } from '@/components/header';
import { mockChallenges } from '@/lib/data';
import { notFound } from 'next/navigation';
import { StreakDisplay } from '@/components/streak-display';
import { DailyCheckin } from '@/components/daily-checkin';
import { MembersList } from '@/components/members-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ChallengeDetailPageProps = {
  params: {
    id: string;
  };
};

export default function ChallengeDetailPage({ params }: ChallengeDetailPageProps) {
  const challenge = mockChallenges.find((c) => c.id === params.id);

  if (!challenge) {
    notFound();
  }

  const { name, description, icon: Icon, members, checkins } = challenge;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-3">
          <div className="grid gap-8 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold">{name}</CardTitle>
                    <CardDescription className="mt-2 text-base">{description}</CardDescription>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                 <StreakDisplay
                    currentStreak={challenge.currentStreak}
                    bestStreak={challenge.bestStreak}
                  />
              </CardContent>
            </Card>

            <DailyCheckin />
          </div>

          <div className="grid gap-8">
             <MembersList members={members} checkins={checkins} />
          </div>
        </div>
      </main>
    </div>
  );
}

export function generateStaticParams() {
  return mockChallenges.map((challenge) => ({
    id: challenge.id,
  }));
}
