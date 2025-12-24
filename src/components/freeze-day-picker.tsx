'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { addDays, format, isBefore } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

interface FreezeDayPickerProps {
  challengeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FreezeDayPicker({ challengeId, isOpen, onClose, onSuccess }: FreezeDayPickerProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const today = new Date();
  const maxFutureDate = addDays(today, 90);
  const minFutureDate = addDays(today, 1);
  const maxFreezeDays = 3;

  // Generate available future dates (next 90 days)
  const generateAvailableDates = () => {
    const dates: Date[] = [];
    for (let i = 1; i <= 90; i++) {
      dates.push(addDays(today, i));
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  const toggleDate = (date: Date) => {
    if (selectedDates.some(d => d.toDateString() === date.toDateString())) {
      // Remove date
      setSelectedDates(selectedDates.filter(d => d.toDateString() !== date.toDateString()));
    } else {
      // Add date if under limit
      if (selectedDates.length < maxFreezeDays) {
        setSelectedDates([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()));
      } else {
        toast({
          title: 'Limit reached',
          description: `You can only schedule up to ${maxFreezeDays} freeze days per week`,
          variant: 'default',
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: 'No dates selected',
        description: 'Please select at least one freeze day',
        variant: 'default',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Submit all freeze days in one request
      const response = await fetch('/api/checkins/freeze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify({
          challengeId,
          dates: selectedDates.map(date => format(date, 'yyyy-MM-dd')),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: `${result.data.createdCount} freeze day(s) scheduled`,
        });
        setSelectedDates([]);
        onSuccess?.();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to schedule freeze days',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[FREEZE DAY PICKER] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule freeze days',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Freeze Days
          </DialogTitle>
          <DialogDescription>
            Mark up to {maxFreezeDays} future dates as rest days. These won't break your streak.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Grid */}
          <div className="grid grid-cols-7 gap-2 max-h-96 overflow-y-auto">
            {availableDates.map((date) => {
              const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
              const dateStr = format(date, 'd');
              const dayStr = format(date, 'EEE');

              return (
                <button
                  key={date.toDateString()}
                  onClick={() => toggleDate(date)}
                  className={`
                    aspect-square rounded-lg font-medium text-sm flex flex-col items-center justify-center transition-colors
                    ${isSelected 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                  title={format(date, 'MMMM d, yyyy')}
                >
                  <span className="text-xs opacity-70">{dayStr}</span>
                  <span>{dateStr}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Dates Summary */}
          {selectedDates.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Selected freeze days ({selectedDates.length}/{maxFreezeDays}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((date) => (
                  <span 
                    key={date.toDateString()} 
                    className="bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-xs px-2 py-1 rounded"
                  >
                    {format(date, 'MMM d')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedDates.length === 0}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading ? 'Scheduling...' : `Schedule ${selectedDates.length > 0 ? selectedDates.length : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
