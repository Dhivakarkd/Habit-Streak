'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  adminUserId: string;
  user: {
    id: string;
    username: string;
  } | null;
}

export function SetPasswordDialog({ open, onOpenChange, onSuccess, adminUserId, user }: SetPasswordDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleGeneratePassword = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/users/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': adminUserId,
        },
        body: JSON.stringify({
          userId: user.id,
          // No password provided - will generate temporary password
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set password');
      }

      const data = await response.json();
      if (data.success && data.data.temporaryPassword) {
        setTempPassword(data.data.temporaryPassword);
      }
    } catch (error) {
      console.error('Set password failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast({
        title: 'Copied',
        description: 'Password copied to clipboard',
      });
    }
  };

  const handleClose = () => {
    setTempPassword(null);
    onOpenChange(false);
  };

  const handleFinish = () => {
    toast({
      title: 'Success',
      description: 'Password reset successfully',
    });
    handleClose();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Password for {user?.username}</DialogTitle>
          <DialogDescription>
            {tempPassword
              ? 'Password reset successfully. Save the password below.'
              : 'Generate a new temporary password for this user.'}
          </DialogDescription>
        </DialogHeader>

        {!tempPassword ? (
          <>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-sm">
                A secure temporary password will be generated. The user should change it after first login.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleGeneratePassword} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Password'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-sm font-medium mb-2">⚠️ Temporary Password</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Save this password securely and share it with the user.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={tempPassword}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPassword}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleFinish} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
