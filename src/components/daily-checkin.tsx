'use client';

import { useState } from 'react';
import { Check, X, PartyPopper } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { format } from 'date-fns';

export function DailyCheckin() {
  const [status, setStatus] = useState<'pending' | 'completed' | 'missed'>('pending');
  const today = format(new Date(), 'EEEE, MMMM do');

  const handleCheckin = (newStatus: 'completed' | 'missed') => {
    setStatus(newStatus);
  };

  const renderContent = () => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <PartyPopper className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-green-700">
              Great job! You're on fire!
            </p>
            <p className="text-sm text-muted-foreground">
              Come back tomorrow to keep the streak alive.
            </p>
          </div>
        );
      case 'missed':
        return (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in zoom-in-95">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-lg font-medium text-red-700">
              It happens. Let's get back on track tomorrow.
            </p>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="space-y-6">
            <p className="text-center text-lg text-muted-foreground">
              Did you complete your goal today?
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Button
                size="lg"
                className="h-20 w-full transform bg-green-500 text-lg text-white transition hover:scale-105 hover:bg-green-600"
                onClick={() => handleCheckin('completed')}
              >
                <Check className="mr-2 h-8 w-8" /> Yes, I did!
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-20 w-full transform border-2 text-lg transition hover:scale-105"
                onClick={() => handleCheckin('missed')}
              >
                <X className="mr-2 h-8 w-8" /> Not today
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Check-in</CardTitle>
        <CardDescription>{today}</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
