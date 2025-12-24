'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

type CheckinStatus = 'completed' | 'missed' | 'pending';

interface CheckinRecord {
  date: string;
  status: CheckinStatus;
}

interface CheckinCalendarAdminProps {
  userId: string;
  challengeId: string;
  checkins: CheckinRecord[];
  onDateToggle: (date: string, status: CheckinStatus) => void;
  currentStreak?: number;
  completionRate?: number;
  isLoading?: boolean;
}

export function CheckinCalendarAdmin({
  userId,
  challengeId,
  checkins,
  onDateToggle,
  currentStreak = 0,
  completionRate = 0,
  isLoading = false,
}: CheckinCalendarAdminProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Create a map of check-in dates for quick lookup
  const checkinMap = useMemo(() => {
    const map = new Map<string, CheckinStatus>();
    checkins.forEach((c) => {
      map.set(c.date, c.status);
    });
    return map;
  }, [checkins]);

  // Get all days in current month
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const currentStatus = checkinMap.get(dateStr);

    // Cycle through: empty → completed → missed → empty
    let newStatus: CheckinStatus | null;
    if (!currentStatus) {
      newStatus = 'completed';
    } else if (currentStatus === 'completed') {
      newStatus = 'missed';
    } else {
      newStatus = null; // Remove check-in
    }

    if (newStatus) {
      onDateToggle(dateStr, newStatus);
    } else {
      // In a real app, you might want to delete the check-in
      onDateToggle(dateStr, 'pending'); // Or handle deletion
    }
  };

  const getStatusColor = (status?: CheckinStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'missed':
        return 'bg-red-500 text-white';
      case 'pending':
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-100 hover:bg-gray-200';
    }
  };

  const getStatusLabel = (status?: CheckinStatus) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'missed':
        return '✗';
      case 'pending':
        return '•';
      default:
        return '';
    }
  };

  // Get day names for header
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="p-6 w-full">
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg mb-2">Check-in History</h3>
            <div className="flex gap-4">
              {currentStreak !== undefined && (
                <Badge variant="secondary">Streak: {currentStreak} days</Badge>
              )}
              {completionRate !== undefined && (
                <Badge variant="secondary">Rate: {Math.round(completionRate)}%</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Month/Year Navigation */}
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-base">
            {format(currentDate, 'MMMM yyyy')}
          </h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              disabled={isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const status = checkinMap.get(dateStr);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isCurrentDay = isToday(date);

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(date)}
                  disabled={!isCurrentMonth || isLoading}
                  className={`
                    h-10 w-full rounded text-sm font-medium transition-all
                    ${isCurrentMonth ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed'}
                    ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                    ${getStatusColor(status)}
                  `}
                  title={dateStr}
                >
                  <span className="flex items-center justify-center h-full w-full">
                    {isCurrentMonth ? (
                      <>
                        <span className="text-xs">{format(date, 'd')}</span>
                        {status && <span className="ml-1 text-xs">{getStatusLabel(status)}</span>}
                      </>
                    ) : (
                      format(date, 'd')
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100 border"></div>
            <span>No check-in</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
