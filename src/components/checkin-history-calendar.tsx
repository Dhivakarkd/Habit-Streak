'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkin } from '@/lib/types';
import { format, getDaysInMonth, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CheckinHistoryCalendarProps {
  checkins?: Checkin[];
}

export function CheckinHistoryCalendar({ checkins = [] }: CheckinHistoryCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(today);
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [missedDates, setMissedDates] = useState<Set<string>>(new Set());

  // Process checkins to get completed and missed dates
  useEffect(() => {
    console.log('[CALENDAR] Processing checkins:', checkins?.length || 0);
    const completed = new Set<string>();
    const missed = new Set<string>();

    (checkins || []).forEach((checkin) => {
      console.log('[CALENDAR] Checkin:', checkin.date, checkin.status);
      if (checkin.status === 'completed') {
        completed.add(checkin.date);
      } else if (checkin.status === 'missed') {
        missed.add(checkin.date);
      }
    });

    console.log('[CALENDAR] Completed dates:', Array.from(completed));
    console.log('[CALENDAR] Missed dates:', Array.from(missed));
    setCompletedDates(completed);
    setMissedDates(missed);
  }, [checkins]);

  // Get status for a specific date
  const getDateStatus = (date: Date): 'completed' | 'missed' | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (completedDates.has(dateStr)) return 'completed';
    if (missedDates.has(dateStr)) return 'missed';
    return null;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const startDay = getDay(new Date(year, month, 1));
    
    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const days = generateCalendarDays();
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Check-in History</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="space-y-4 w-full flex flex-col items-center">
          {/* Calendar */}
          <div className="w-full max-w-sm">
            {/* Month/Year Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={previousMonth}
                className="p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="w-10 h-10" />;
                }

                const status = getDateStatus(date);
                const isDisabled = date > today;
                const isToday =
                  date.toDateString() === today.toDateString();

                let bgColor = '';
                let textColor = '';

                if (status === 'completed') {
                  bgColor = '';
                  textColor = 'text-gray-700 dark:text-gray-300';
                } else if (status === 'missed') {
                  bgColor = 'bg-red-100 dark:bg-red-950';
                  textColor = 'text-red-700 dark:text-red-300 line-through opacity-70';
                } else if (isToday) {
                  bgColor = 'bg-blue-100 dark:bg-blue-950';
                  textColor = 'text-blue-900 dark:text-blue-300 font-bold';
                }

                return (
                  <div
                    key={date.toDateString()}
                    className={`
                      w-10 h-10 flex items-center justify-center text-sm rounded relative
                      ${bgColor || (isDisabled ? 'opacity-40' : '')}
                      ${textColor || 'text-gray-700 dark:text-gray-300'}
                      ${!isDisabled && !status ? 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer' : ''}
                    `}
                  >
                    {status === 'completed' ? (
                      <span className="text-lg">🔥</span>
                    ) : (
                      date.getDate()
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-6 text-sm mt-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-950 rounded flex items-center justify-center font-bold text-green-700 dark:text-green-300">
                ✓
              </div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 dark:bg-red-950 rounded flex items-center justify-center font-bold text-red-700 dark:text-red-300">
                ✕
              </div>
              <span>Missed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
