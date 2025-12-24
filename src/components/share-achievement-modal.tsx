'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Share2, Copy, Twitter, Facebook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeName: string;
  currentStreak: number;
  bestStreak: number;
  completionRate: number;
  achievements?: Array<{ icon?: string; name: string }>;
}

export function ShareAchievementModal({
  isOpen,
  onClose,
  challengeName,
  currentStreak,
  bestStreak,
  completionRate,
  achievements = [],
}: ShareAchievementModalProps) {
  const [shareMessage, setShareMessage] = useState('');
  const { toast } = useToast();

  // Generate share message on mount or when props change
  useEffect(() => {
    const achievementsList = achievements.length > 0 
      ? achievements.map(a => `${a.icon || '🏆'} ${a.name}`).join(', ')
      : 'Multiple achievements';

    const message = `🏆 I've completed ${currentStreak} days in "${challengeName}"!
Current Streak: ${currentStreak} days 🔥
Best Streak: ${bestStreak} days ⭐
Completion Rate: ${Math.round(completionRate)}% 📊
Achievements: ${achievementsList}

Join me on the #HabitStreak app and start your habit journey! 💪`;

    setShareMessage(message);
  }, [challengeName, currentStreak, bestStreak, completionRate, achievements]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      toast({
        title: 'Copied!',
        description: 'Achievement summary copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(shareMessage);
    const url = `https://twitter.com/intent/tweet?text=${text}&hashtags=HabitStreak,Habits,Motivation`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleShareFacebook = () => {
    const url = 'https://www.facebook.com/sharer/sharer.php?u=https://habit-streak.app';
    window.open(url, '_blank', 'width=550,height=420');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Achievement Summary
          </DialogTitle>
          <DialogDescription>
            Celebrate your success and inspire others to join the challenge!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats Preview */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 border-amber-200 dark:border-amber-800">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">🔥</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{currentStreak} days</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Current</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">⭐</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{bestStreak} days</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Best Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">📊</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{Math.round(completionRate)}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Completion</p>
              </div>
            </div>
          </Card>

          {/* Share Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Message:</label>
            <Textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              className="h-40 resize-none text-sm"
              placeholder="Edit your share message..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {shareMessage.length} characters
            </p>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleCopyToClipboard}
              className="flex-1 gap-2 bg-blue-500 hover:bg-blue-600"
            >
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </Button>
            <Button
              onClick={handleShareTwitter}
              className="flex-1 gap-2 bg-sky-500 hover:bg-sky-600"
            >
              <Twitter className="h-4 w-4" />
              Share on Twitter
            </Button>
            <Button
              onClick={handleShareFacebook}
              className="flex-1 gap-2 bg-blue-700 hover:bg-blue-800"
            >
              <Facebook className="h-4 w-4" />
              Share on Facebook
            </Button>
          </div>

          {/* Achievements List */}
          {achievements.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Your Achievements:</p>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-sm"
                  >
                    <span>{achievement.icon || '🏆'}</span>
                    <span>{achievement.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
