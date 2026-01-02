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
import { ChevronLeft, Archive, Trash2, Edit2, Shield, Calendar, Users, Save, X, Plus } from 'lucide-react';
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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 p-8 flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
             <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
             <p className="text-muted-foreground animate-pulse">Loading challenge details...</p>
           </div>
        </main>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 p-8 flex items-center justify-center text-muted-foreground">
           Challenge not found
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Immersive Admin Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white pb-12 pt-8 md:pt-12 px-4 shadow-xl">
         <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
         
         <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
           <div className="space-y-4 max-w-2xl">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/admin')} 
                className="text-indigo-200 hover:text-white hover:bg-white/10 -ml-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
              </Button>
              
              {editing ? (
                 <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/10 space-y-4 w-full">
                    <Input
                      value={editData?.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="bg-black/20 border-white/20 text-white placeholder:text-white/40 text-lg font-bold"
                      placeholder="Challenge Name"
                    />
                    <Textarea
                      value={editData?.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
                      rows={3}
                      placeholder="Description"
                    />
                     <div className="flex items-center gap-2">
                         <Badge variant="outline" className="text-white border-white/20">Category:</Badge>
                        <select
                          value={editData?.category || ''}
                          onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                          className="bg-black/20 border border-white/20 text-white rounded px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat} className="text-black">
                              {cat}
                            </option>
                          ))}
                        </select>
                     </div>
                    <div className="flex gap-2 pt-2">
                       <Button size="sm" onClick={handleSaveEdit} className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                         <Save className="h-4 w-4 mr-2" /> Save Changes
                       </Button>
                       <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="bg-transparent border-white/20 text-white hover:bg-white/10">
                         <X className="h-4 w-4 mr-2" /> Cancel
                       </Button>
                    </div>
                 </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <Badge className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 border-0">
                         {challenge.category}
                       </Badge>
                       {challenge.isArchived && (
                         <Badge variant="destructive">Archived</Badge>
                       )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold font-headline leading-tight">
                      {challenge.name}
                    </h1>
                  </div>
                  <p className="text-lg text-slate-300 font-light leading-relaxed">
                    {challenge.description}
                  </p>
                </>
              )}
           </div>

           {/* Quick Actions Panel */}
           <Card className="glass-card bg-white/5 border-white/10 p-4 min-w-[280px]">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="h-3 w-3" /> Admin Controls
              </h3>
              <div className="space-y-2">
                 {!editing && (
                    <Button variant="secondary" className="w-full justify-start" onClick={() => setEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Edit Details
                    </Button>
                 )}
                 <Button 
                   variant="secondary" 
                   className="w-full justify-start hover:bg-amber-100 hover:text-amber-900 border-transparent" 
                   onClick={() => setConfirmAction('archive')}
                   disabled={challenge.isArchived}
                 >
                   <Archive className="h-4 w-4 mr-2" /> Archive Challenge
                 </Button>
                 <Button 
                   variant="destructive" 
                   className="w-full justify-start bg-red-900/50 hover:bg-red-600 border-transparent text-red-100" 
                   onClick={() => setConfirmAction('delete')}
                   disabled={!challenge.isArchived}
                 >
                   <Trash2 className="h-4 w-4 mr-2" /> Delete Permanent
                 </Button>
              </div>
           </Card>
         </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 -mt-8 relative z-20">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar Stats */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="glass-card p-6">
                   <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Overview</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                         <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{members.length}</p>
                         <p className="text-xs text-muted-foreground">Members</p>
                      </div>
                      <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                         <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                           {/* Calculate average streak or other metric */}
                           -
                         </p>
                         <p className="text-xs text-muted-foreground">Avg Streak</p>
                      </div>
                   </div>
                </Card>
            </div>

            {/* Main Content (Members) */}
            <div className="lg:col-span-2">
               <Card className="glass-card min-h-[500px] flex flex-col">
                  <div className="p-6 border-b border-border/40 flex items-center justify-between">
                     <h2 className="text-xl font-bold flex items-center gap-2">
                       <Users className="h-5 w-5 text-primary" /> Members
                     </h2>
                     <Button size="sm" onClick={handleOpenAddMembers} className="gap-2">
                       <Plus className="h-4 w-4" /> Add Users
                     </Button>
                  </div>
                  
                  <div className="p-0 flex-1">
                    {members.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Users className="h-12 w-12 opacity-20 mb-3" />
                        <p>No members in this challenge yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                         {members.map((member) => (
                           <div key={member.userId} className="border-b border-border/40 last:border-0">
                              <div 
                                className={`p-4 hover:bg-muted/30 cursor-pointer transition-colors ${selectedMemberForCheckins === member.userId ? 'bg-muted/50' : ''}`}
                                onClick={() => setSelectedMemberForCheckins(selectedMemberForCheckins === member.userId ? null : member.userId)}
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                          {member.username.charAt(0).toUpperCase()}
                                       </div>
                                       <div>
                                          <p className="font-semibold text-foreground">{member.username}</p>
                                          <p className="text-xs text-muted-foreground">{member.email}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                       <div className="text-right">
                                          <p className="font-mono font-bold">{member.currentStreak || 0}</p>
                                          <p className="text-[10px] text-muted-foreground uppercase">Streak</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="font-mono font-bold">{Math.round(member.completionRate || 0)}%</p>
                                          <p className="text-[10px] text-muted-foreground uppercase">Rate</p>
                                       </div>
                                       <ChevronLeft className={`h-4 w-4 text-muted-foreground transition-transform ${selectedMemberForCheckins === member.userId ? '-rotate-90' : ''}`} />
                                    </div>
                                 </div>
                              </div>
                              
                              {/* Expanded Member Details (Check-in Calendar) */}
                              {selectedMemberForCheckins === member.userId && member.checkins && (
                                <div className="p-4 bg-muted/20 animate-in slide-in-from-top-2 duration-200">
                                   <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
                                      <Calendar className="h-4 w-4" /> Participation History
                                   </div>
                                   <div className="border rounded-xl bg-background/50 p-4">
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
                                </div>
                              )}
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
               </Card>
            </div>
         </div>
      </main>

      {/* Dialogs */}
      <Dialog open={addMembersDialog} onOpenChange={setAddMembersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
            <DialogDescription>Select users to add to this challenge.</DialogDescription>
          </DialogHeader>
          <Input placeholder="Search users..." className="mb-2" />
          <div className="max-h-[300px] overflow-y-auto border rounded-xl p-2 space-y-1">
            {allUsers.map((u) => (
              <div 
                key={u.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedUsersToAdd.has(u.id) ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500' : 'hover:bg-muted'}`}
                onClick={() => {
                   const newSelected = new Set(selectedUsersToAdd);
                   if (newSelected.has(u.id)) newSelected.delete(u.id);
                   else newSelected.add(u.id);
                   setSelectedUsersToAdd(newSelected);
                }}
              >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedUsersToAdd.has(u.id) ? 'bg-indigo-600 border-indigo-600' : 'border-muted-foreground'}`}>
                      {selectedUsersToAdd.has(u.id) && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                 <div>
                   <p className="text-sm font-medium">{u.username}</p>
                   <p className="text-xs text-muted-foreground">{u.email}</p>
                 </div>
              </div>
            ))}
            {allUsers.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No available users found.</p>}
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setAddMembersDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMembers} disabled={selectedUsersToAdd.size === 0}>
              Add Selected ({selectedUsersToAdd.size})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'archive' ? 'Archive Challenge?' : 'Delete Challenge?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'archive'
                ? 'This challenge will be hidden from the active dashboard but data remains intact.'
                : 'This action cannot be undone. All check-ins and member data will be permanently removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
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
            <AlertDialogTitle>Update Check-in Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change status for <span className="font-semibold text-foreground">{confirmDialog.date}</span> to <Badge variant={confirmDialog.status === 'completed' ? 'default' : 'destructive'}>{confirmDialog.status}</Badge>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleExecuteIndividualCheckin}>Confirm Update</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
