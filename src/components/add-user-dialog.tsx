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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

export function AddUserDialog({ open, onOpenChange, onSuccess, userId }: AddUserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    isAdmin: false,
  });
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formData.username.trim() || !formData.email.trim()) {
      toast({
        title: 'Error',
        description: 'Username and email are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      const data = await response.json();
      if (data.success) {
        if (data.data.temporaryPassword) {
          setTempPassword(data.data.temporaryPassword);
        } else {
          // If no temporary password, close and refresh
          toast({
            title: 'Success',
            description: 'User created successfully',
          });
          handleClose();
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Create user failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ username: '', email: '', displayName: '', isAdmin: false });
    setTempPassword(null);
    onOpenChange(false);
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

  const handleFinish = () => {
    toast({
      title: 'Success',
      description: 'User created successfully',
    });
    handleClose();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            {tempPassword 
              ? 'User created successfully. Save the temporary password below.'
              : 'Create a new user account. A temporary password will be generated.'}
          </DialogDescription>
        </DialogHeader>

        {!tempPassword ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter display name (optional)"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isAdmin: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label htmlFor="isAdmin" className="cursor-pointer">
                  Make this user an admin
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-sm font-medium mb-2">⚠️ Temporary Password</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Save this password securely. The user should change it after first login.
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

              <div className="text-sm space-y-1">
                <p><strong>Username:</strong> {formData.username}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                {formData.displayName && <p><strong>Display Name:</strong> {formData.displayName}</p>}
                <p><strong>Role:</strong> {formData.isAdmin ? 'Admin' : 'User'}</p>
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
