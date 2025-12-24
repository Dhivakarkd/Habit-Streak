'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Archive, Trash2 } from 'lucide-react';
import { CheckinCalendarAdmin } from '@/components/checkin-calendar-admin';

interface Challenge {
  id: string;
  name: string;
  description: string;
  category: string;
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChallengeMember {
  userId: string;
  username: string;
  email: string;
  currentStreak?: number;
  completionRate?: number;
  checkins?: Array<{ date: string; status: 'completed' | 'missed' | 'pending' }>;
}

const CATEGORIES = ['Fitness', 'Wellness', 'Productivity', 'Learning', 'Creative'];
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function ChallengeDetailPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [members, setMembers] = useState<ChallengeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Challenge> | null>(null);
  const [selectedMemberForCheckins, setSelectedMemberForCheckins] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);

  const [addMembersDialog, setAddMembersDialog] = useState(false);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; username: string; email: string }>>([]);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<Set<string>>(new Set());

  const [bulkCheckinDate, setBulkCheckinDate] = useState('');
  const [bulkCheckinStatus, setBulkCheckinStatus] = useState<'completed' | 'missed'>('completed');
  const [selectedMembersForBulk, setSelectedMembersForBulk] = useState<Set<string>>(new Set());

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'individualCheckin' | null;
    userId?: string;
    date?: string;
    status?: 'completed' | 'missed' | 'pending';
  }>({ open: false, action: null });

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  // Fetch challenge and members
  useEffect(() => {
    if (!user?.id || !challengeId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch challenge
        const challengeRes = await fetch(`/api/challenges/${challengeId}`, {
          headers: { 'X-User-ID': user.id },
        });

        if (challengeRes.ok) {
          const data = await challengeRes.json();
          if (data.success) {
            setChallenge(data.data);
            setEditData(data.data);
          }
        }

        // Fetch members
        const membersRes = await fetch(`/api/admin/challenges/${challengeId}/members`, {
          headers: { 'X-User-ID': user.id },
        });

        if (membersRes.ok) {
          const data = await membersRes.json();
          if (data.success) {
            setMembers(data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch challenge:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, challengeId]);

  const handleSaveEdit = async () => {
    if (!editData || !user?.id || !challenge) return;

    try {
      const response = await fetch(`/api/admin/challenges/${challenge.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify({
          name: editData.name,
          description: editData.description,
          category: editData.category,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChallenge(data.data);
        setEditing(false);
        toast({ title: 'Success', description: 'Challenge updated' });
      }
    } catch (error) {
      console.error('Failed to save:', error);
      toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' });
    }
  };

  const handleArchive = async () => {
    if (!challenge || !user?.id) return;

    try {
      const response = await fetch(`/api/admin/challenges/${challenge.id}/archive`, {
        method: 'POST',
        headers: { 'X-User-ID': user.id },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Challenge archived' });
        router.push('/admin');
      }
    } catch (error) {
      console.error('Failed to archive:', error);
      toast({ title: 'Error', description: 'Failed to archive challenge', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!challenge || !user?.id) return;

    try {
      const response = await fetch(`/api/admin/challenges/${challenge.id}`, {
        method: 'DELETE',
        headers: { 'X-User-ID': user.id },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Challenge deleted permanently' });
        router.push('/admin');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      toast({ title: 'Error', description: 'Failed to delete challenge', variant: 'destructive' });
    }
  };

  const handleOpenAddMembers = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'X-User-ID': user.id },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter out users who are already members of this challenge
          const existingMemberIds = new Set(members.map(m => m.userId));
          const availableUsers = (data.data || []).filter(u => !existingMemberIds.has(u.id));
          
          setAllUsers(availableUsers);
          setSelectedUsersToAdd(new Set());
          setAddMembersDialog(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleAddMembers = async () => {
    if (!challenge || selectedUsersToAdd.size === 0 || !user?.id) return;

    try {
      const response = await fetch(`/api/admin/challenges/${challenge.id}/members/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify({
          userIds: Array.from(selectedUsersToAdd),
        }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: `Added ${selectedUsersToAdd.size} member(s)` });

        // Refresh members
        const membersRes = await fetch(`/api/admin/challenges/${challenge.id}/members`, {
          headers: { 'X-User-ID': user.id },
        });

        if (membersRes.ok) {
          const data = await membersRes.json();
          if (data.success) {
            setMembers(data.data || []);
          }
        }

        setAddMembersDialog(false);
        setSelectedUsersToAdd(new Set());
      }
    } catch (error) {
      console.error('Failed to add members:', error);
      toast({ title: 'Error', description: 'Failed to add members', variant: 'destructive' });
    }
  };

  const handleExecuteIndividualCheckin = async () => {
    if (!confirmDialog.userId || !confirmDialog.date || !confirmDialog.status || !user?.id || !challenge) return;

    if (!['completed', 'missed'].includes(confirmDialog.status)) {
      toast({ title: 'Error', description: 'Invalid status', variant: 'destructive' });
      setConfirmDialog({ open: false, action: null });
      return;
    }

    try {
      const response = await fetch('/api/admin/checkins/backdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          userId: confirmDialog.userId,
          date: confirmDialog.date,
          status: confirmDialog.status as 'completed' | 'missed',
        }),
      });

      if (response.ok) {
        const updatedMembers = members.map((m) =>
          m.userId === confirmDialog.userId
            ? {
                ...m,
                checkins: (() => {
                  const currentCheckins = m.checkins || [];
                  const existingIndex = currentCheckins.findIndex((c) => c.date === confirmDialog.date);

                  if (existingIndex >= 0) {
                    const updated = [...currentCheckins];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      status: confirmDialog.status as 'completed' | 'missed',
                    };
                    return updated;
                  } else {
                    return [
                      ...currentCheckins,
                      {
                        date: confirmDialog.date!,
                        status: confirmDialog.status as 'completed' | 'missed',
                      },
                    ];
                  }
                })(),
              }
            : m
        );
        setMembers(updatedMembers as ChallengeMember[]);
        toast({ title: 'Success', description: `Check-in updated for ${confirmDialog.date}` });
      }
    } catch (error) {
      console.error('Failed to update check-in:', error);
    } finally {
      setConfirmDialog({ open: false, action: null });
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50 p-4 md:p-8">Loading...</main>
      </>
    );
  }

  if (!challenge) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50 p-4 md:p-8">Challenge not found</main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl">
          {/* Back Button */}
          <Button variant="outline" size="sm" onClick={() => router.push('/admin')} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {/* Challenge Details */}
          <Card className="p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-4">
                    <Input
                      value={editData?.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      placeholder="Challenge name"
                    />
                    <Textarea
                      value={editData?.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      placeholder="Description"
                      rows={3}
                    />
                    <select
                      value={editData?.category || ''}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit}>Save</Button>
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-3xl font-bold">{challenge.name}</h1>
                    <p className="text-gray-600 mt-2">{challenge.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge>{challenge.category}</Badge>
                      {challenge.isArchived && <Badge variant="secondary">Archived</Badge>}
                    </div>
                  </div>
                )}
              </div>

              {!editing && (
                <div className="flex gap-2">
                  <Button onClick={() => setEditing(true)}>Edit</Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmAction('archive')}
                    disabled={challenge.isArchived}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmAction('delete')}
                    disabled={!challenge.isArchived}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="members" className="space-y-4">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Members ({members.length})</h2>
                <Button size="sm" onClick={handleOpenAddMembers}>
                  + Add Members
                </Button>
              </div>

              {members.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground">No members yet</Card>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <Card
                      key={member.userId}
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        setSelectedMemberForCheckins(
                          selectedMemberForCheckins === member.userId ? null : member.userId
                        )
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{member.username}</h3>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          {member.currentStreak !== undefined && (
                            <Badge variant="outline" className="mt-2">
                              Streak: {member.currentStreak}
                            </Badge>
                          )}
                        </div>
                        {member.completionRate !== undefined && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{member.completionRate.toFixed(0)}% Complete</p>
                          </div>
                        )}
                      </div>

                      {selectedMemberForCheckins === member.userId && member.checkins && (
                        <div className="mt-4 pt-4 border-t">
                          <CheckinCalendarAdmin
                            userId={member.userId}
                            challengeId={challenge.id}
                            checkins={member.checkins}
                            currentStreak={member.currentStreak}
                            completionRate={member.completionRate}
                            onDateToggle={(date, status) => {
                              setConfirmDialog({
                                open: true,
                                action: 'individualCheckin',
                                userId: member.userId,
                                date,
                                status,
                              });
                            }}
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Dialogs */}
      <Dialog open={addMembersDialog} onOpenChange={setAddMembersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
            <DialogDescription>Select users to add to this challenge</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto border rounded p-3 space-y-2">
            {allUsers.map((u) => (
              <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUsersToAdd.has(u.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedUsersToAdd);
                    if (e.target.checked) {
                      newSelected.add(u.id);
                    } else {
                      newSelected.delete(u.id);
                    }
                    setSelectedUsersToAdd(newSelected);
                  }}
                  className="w-4 h-4"
                />
                <div>
                  <p className="text-sm font-medium">{u.username}</p>
                  <p className="text-xs text-gray-600">{u.email}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddMembersDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMembers} disabled={selectedUsersToAdd.size === 0}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'archive' ? 'Archive Challenge' : 'Delete Challenge'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'archive'
                ? 'This challenge will be moved to archived and hidden from active view.'
                : 'This will permanently delete the challenge and all associated data.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => {
                if (confirmAction === 'archive') handleArchive();
                else if (confirmAction === 'delete') handleDelete();
              }}
            >
              {confirmAction === 'archive' ? 'Archive' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDialog.open && confirmDialog.action === 'individualCheckin'}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check-in Update</AlertDialogTitle>
            <AlertDialogDescription>
              Mark check-in as <span className="font-semibold">{confirmDialog.status}</span> for{' '}
              <span className="font-semibold">{confirmDialog.date}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExecuteIndividualCheckin}>Save</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
