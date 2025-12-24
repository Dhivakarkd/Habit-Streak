'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkin } from '@/lib/types';
import { format, getDaysInMonth, getDay, startOfWeek, addDays, isAfter } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CheckinHistoryCalendarProps {
  checkins?: Checkin[];
}

export function CheckinHistoryCalendar({ checkins = [] }: CheckinHistoryCalendarProps) {
  const today = new Date();
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState<Date>(today);
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [missedDates, setMissedDates] = useState<Set<string>>(new Set());
  const [freezeDates, setFreezeDates] = useState<Set<string>>(new Set());

  // Process checkins to get completed, missed, and freeze dates
  useEffect(() => {
    console.log('[CALENDAR] Processing checkins:', checkins?.length || 0);
    const completed = new Set<string>();
    const missed = new Set<string>();
    const freeze = new Set<string>();

    (checkins || []).forEach((checkin) => {
      console.log('[CALENDAR] Checkin:', checkin.date, checkin.status);
      if (checkin.status === 'completed') {
        completed.add(checkin.date);
      } else if (checkin.status === 'missed') {
        missed.add(checkin.date);
      } else if (checkin.status === 'freeze') {
        freeze.add(checkin.date);
      }
    });

    console.log('[CALENDAR] Completed dates:', Array.from(completed));
    console.log('[CALENDAR] Missed dates:', Array.from(missed));
    console.log('[CALENDAR] Freeze dates:', Array.from(freeze));
    setCompletedDates(completed);
    setMissedDates(missed);
    setFreezeDates(freeze);
  }, [checkins]);

  // Get status for a specific date
  const getDateStatus = (date: Date): 'completed' | 'missed' | 'freeze' | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (completedDates.has(dateStr)) return 'completed';
    if (missedDates.has(dateStr)) return 'missed';
    if (freezeDates.has(dateStr)) return 'freeze';
    return null;
  };

  // Check if date is part of an active streak (completed or freeze)
  const isStreakDay = (date: Date): boolean => {
    const status = getDateStatus(date);
    return status === 'completed' || status === 'freeze';
  };

  // Check if next day continues the streak (for connecting line)
  const hasStreakContinuation = (date: Date): boolean => {
    const nextDate = addDays(date, 1);
    return isStreakDay(nextDate);
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

  const renderMonthCalendar = () => {
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

  const renderWeekView = () => {
    const weekStart = startOfWeek(today);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return weekDays;
  };

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const DayCell = ({ date, showConnector }: { date: Date; showConnector?: boolean }) => {
    const status = getDateStatus(date);
    const isDisabled = date > today;
    const isToday = date.toDateString() === today.toDateString();
    const isStreakDay = status === 'completed' || status === 'freeze';

    let bgColor = '';
    let textColor = '';
    let icon = '';

    if (status === 'completed') {
      bgColor = 'bg-green-100 dark:bg-green-950';
      textColor = 'text-gray-700 dark:text-gray-300 font-semibold';
      icon = '🔥';
    } else if (status === 'freeze') {
      bgColor = 'bg-blue-100 dark:bg-blue-950';
      textColor = 'text-blue-700 dark:text-blue-300 font-semibold';
      icon = '❄️';
    } else if (status === 'missed') {
      bgColor = 'bg-red-100 dark:bg-red-950';
      textColor = 'text-red-700 dark:text-red-300 line-through opacity-70';
    } else if (isToday) {
      bgColor = 'bg-amber-100 dark:bg-amber-950';
      textColor = 'text-amber-900 dark:text-amber-300 font-bold';
    }

    return (
      <div key={date.toDateString()} className="relative">
        <div
          className={`
            w-8 md:w-10 h-8 md:h-10 flex items-center justify-center text-xs md:text-sm rounded font-medium
            ${bgColor || (isDisabled ? 'opacity-40' : '')}
            ${textColor || 'text-gray-700 dark:text-gray-300'}
            ${!isDisabled && !status ? 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer' : ''}
            transition-colors
          `}
        >
          {icon || date.getDate()}
        </div>
        {/* Connecting line for streak continuation */}
        {isStreakDay && hasStreakContinuation(date) && showConnector && (
          <div className="absolute top-1/2 -right-1 md:-right-1.5 w-2 md:w-3 h-0.5 bg-green-400 dark:bg-green-600 transform -translate-y-1/2" />
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2 md:pb-3">
        <CardTitle className="text-sm sm:text-base">Check-in History</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="space-y-3 w-full flex flex-col items-center">
          {isMobile ? (
            // Mobile Week View
            <>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                Week of {format(today, 'MMM d, yy')}
              </div>
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex gap-2 sm:gap-3 px-2 min-w-max">
                  {renderWeekView().map((date) => (
                    <div key={date.toDateString()} className="flex flex-col items-center gap-1">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-center">
                        {format(date, 'EEE')}
                      </div>
                      <DayCell date={date} showConnector={true} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            // Desktop Month View
            <div className="w-full max-w-sm">
              {/* Month/Year Header */}
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <button
                  onClick={previousMonth}
                  className="p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <h2 className="text-base md:text-lg font-semibold">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>

              {/* Week days header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayLabels.map((day) => (
                  <div
                    key={day}
                    className="w-8 md:w-10 h-8 md:h-10 flex items-center justify-center text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {renderMonthCalendar().map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="w-8 md:w-10 h-8 md:h-10" />;
                  }
                  return <DayCell key={date.toDateString()} date={date} showConnector={true} />;
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-col gap-2 text-xs sm:text-sm mt-4 w-full px-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-100 dark:bg-green-950 rounded flex items-center justify-center text-xs">
                  🔥
                </div>
                <span className="text-xs">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-100 dark:bg-blue-950 rounded flex items-center justify-center text-xs">
                  ❄️
                </div>
                <span className="text-xs">Freeze Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-100 dark:bg-red-950 rounded flex items-center justify-center text-xs font-bold text-red-700 dark:text-red-300">
                  ✕
                </div>
                <span className="text-xs">Missed</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="inline-block">The connecting line shows consecutive streak days</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
