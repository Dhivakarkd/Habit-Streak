'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { Shield, Users, UserPlus, Search, MoreVertical, Edit, Key, Crown, UserCheck } from 'lucide-react';
import { AddUserDialog } from '@/components/add-user-dialog';
import { EditUserDialog } from '@/components/edit-user-dialog';
import { SetPasswordDialog } from '@/components/set-password-dialog';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  challengeCount: number;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export default function AdminUsersPage() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'promote' | 'demote' | 'revoke' | null;
    userIds: string[];
  }>({ open: false, action: null, userIds: [] });
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Handler to close edit dialog and clear selected user
  const handleEditDialogClose = (open: boolean) => {
    setEditUserOpen(open);
    if (!open) {
      setTimeout(() => {
        setSelectedUser(null);
      }, 300);
    }
  };

  // Handler to close set password dialog and clear selected user
  const handleSetPasswordDialogClose = (open: boolean) => {
    setSetPasswordOpen(open);
    if (!open) {
      setTimeout(() => {
        setSelectedUser(null);
      }, 300);
    }
  };

  // Redirect if not super admin
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isSuperAdmin, router]);

  // Fetch users function
  const fetchUsers = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: {
          'X-User-ID': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [user?.id]);

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkAction = (action: 'promote' | 'demote') => {
    setConfirmDialog({
      open: true,
      action,
      userIds: Array.from(selectedUsers),
    });
  };

  const executeBulkAction = async () => {
    if (!confirmDialog.action || !user?.id) return;

    try {
      const endpoint =
        confirmDialog.action === 'promote'
          ? '/api/admin/users/bulk-promote'
          : '/api/admin/users/bulk-demote';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify({ userIds: confirmDialog.userIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to perform action');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: `Successfully ${confirmDialog.action}d ${confirmDialog.userIds.length} user(s)`,
        });
        setSelectedUsers(new Set());
        fetchUsers();
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to perform action',
        variant: 'destructive',
      });
    } finally {
      setConfirmDialog({ open: false, action: null, userIds: [] });
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminUsers = filteredUsers.filter((u) => u.isAdmin || u.isSuperAdmin);
  const regularUsers = filteredUsers.filter((u) => !u.isAdmin && !u.isSuperAdmin);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground animate-pulse">Verifying access...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  // Get selected users for smart bulk actions
  const selectedUsersList = filteredUsers.filter((u) => selectedUsers.has(u.id));
  const hasNonAdmins = selectedUsersList.some((u) => !u.isAdmin && !u.isSuperAdmin);
  const hasAdmins = selectedUsersList.some((u) => u.isAdmin || u.isSuperAdmin);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Admin Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 text-white pb-12 pt-8 md:pt-12 px-4 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-4 text-purple-300">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Admin Portal</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline mb-4">
                User Admin
              </h1>
              <p className="text-slate-300 text-lg max-w-2xl">
                Manage user accounts, roles, and permissions across the platform.
              </p>
            </div>
            <Button 
              onClick={() => setAddUserOpen(true)} 
              className="hidden md:flex gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 -mt-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-3xl font-bold mt-1 text-foreground">{users.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </Card>
          <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg bg-amber-50/50 dark:bg-amber-950/10">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admins</p>
              <h3 className="text-3xl font-bold mt-1 text-foreground">
                {users.filter((u) => u.isAdmin && !u.isSuperAdmin).length}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </Card>
          <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg bg-red-50/50 dark:bg-red-950/10">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Super Admins</p>
              <h3 className="text-3xl font-bold mt-1 text-foreground">
                {users.filter((u) => u.isSuperAdmin).length}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Crown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </Card>
          <Card className="glass-card p-6 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-lg bg-emerald-50/50 dark:bg-emerald-950/10">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Regular Users</p>
              <h3 className="text-3xl font-bold mt-1 text-foreground">
                {users.filter((u) => !u.isAdmin && !u.isSuperAdmin).length}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </Card>
        </div>

        {/* Mobile Add User Button */}
        <div className="md:hidden mb-4">
          <Button onClick={() => setAddUserOpen(true)} className="w-full gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Search and Bulk Actions */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 border">
            <Search className="h-5 w-5 text-muted-foreground ml-3" />
            <Input
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Bulk Actions - Show context-aware buttons */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
              <span className="text-sm font-medium">
                {selectedUsers.size} user(s) selected
              </span>
              <div className="flex-1" />
              {hasNonAdmins && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('promote')}
                >
                  Promote to Admin
                </Button>
              )}
              {hasAdmins && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('demote')}
                >
                  Remove Admin
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tabs & Content */}
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="all" className="px-4">All ({filteredUsers.length})</TabsTrigger>
              <TabsTrigger value="admins" className="px-4">Admins ({adminUsers.length})</TabsTrigger>
              <TabsTrigger value="users" className="px-4">Users ({regularUsers.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* All Users Tab */}
          <TabsContent value="all" className="space-y-4 mt-0">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <Card className="glass-card p-12 text-center text-muted-foreground border-dashed">
                <div className="mx-auto h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 opacity-50" />
                </div>
                No users found
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredUsers.map((adminUser) => (
                  <UserCard
                    key={adminUser.id}
                    user={adminUser}
                    isSelected={selectedUsers.has(adminUser.id)}
                    onSelect={handleSelectUser}
                    onEdit={(u) => {
                      setSelectedUser(u);
                      setEditUserOpen(true);
                    }}
                    onSetPassword={(u) => {
                      setSelectedUser(u);
                      setSetPasswordOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins" className="space-y-4 mt-0">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : adminUsers.length === 0 ? (
              <Card className="glass-card p-12 text-center text-muted-foreground border-dashed">
                No admin users found
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {adminUsers.map((adminUser) => (
                  <UserCard
                    key={adminUser.id}
                    user={adminUser}
                    isSelected={selectedUsers.has(adminUser.id)}
                    onSelect={handleSelectUser}
                    onEdit={(u) => {
                      setSelectedUser(u);
                      setEditUserOpen(true);
                    }}
                    onSetPassword={(u) => {
                      setSelectedUser(u);
                      setSetPasswordOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Regular Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-0">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : regularUsers.length === 0 ? (
              <Card className="glass-card p-12 text-center text-muted-foreground border-dashed">
                No regular users found
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {regularUsers.map((adminUser) => (
                  <UserCard
                    key={adminUser.id}
                    user={adminUser}
                    isSelected={selectedUsers.has(adminUser.id)}
                    onSelect={handleSelectUser}
                    onEdit={(u) => {
                      setSelectedUser(u);
                      setEditUserOpen(true);
                    }}
                    onSetPassword={(u) => {
                      setSelectedUser(u);
                      setSetPasswordOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'promote'
                ? `Are you sure you want to promote ${confirmDialog.userIds.length} user(s) to admin?`
                : `Are you sure you want to remove admin privileges from ${confirmDialog.userIds.length} user(s)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <DialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              className={confirmDialog.action === 'demote' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {confirmDialog.action === 'promote' ? 'Promote' : 'Remove Admin'}
            </AlertDialogAction>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog */}
      {user?.id && (
        <AddUserDialog
          open={addUserOpen}
          onOpenChange={setAddUserOpen}
          onSuccess={fetchUsers}
          userId={user.id}
        />
      )}

      {/* Edit User Dialog */}
      {user?.id && (
        <EditUserDialog
          open={editUserOpen && selectedUser !== null}
          onOpenChange={handleEditDialogClose}
          onSuccess={fetchUsers}
          userId={user.id}
          adminUserId={user.id}
          user={selectedUser || { id: '', username: '', email: '' }}
        />
      )}

      {/* Set Password Dialog */}
      {user?.id && (
        <SetPasswordDialog
          open={setPasswordOpen && selectedUser !== null}
          onOpenChange={handleSetPasswordDialogClose}
          onSuccess={fetchUsers}
          adminUserId={user.id}
          user={selectedUser || { id: '', username: '' }}
        />
      )}
    </div>
  );
}

// User Card Component
function UserCard({
  user,
  isSelected,
  onSelect,
  onEdit,
  onSetPassword,
}: {
  user: AdminUser;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (user: AdminUser) => void;
  onSetPassword: (user: AdminUser) => void;
}) {
  const getBorderColor = () => {
    if (user.isSuperAdmin) return 'border-l-red-500';
    if (user.isAdmin) return 'border-l-amber-500';
    return 'border-l-emerald-500';
  };

  const getRoleBadge = () => {
    if (user.isSuperAdmin) {
      return (
        <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-0">
          Super Admin
        </Badge>
      );
    }
    if (user.isAdmin) {
      return (
        <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-0">
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0">
        User
      </Badge>
    );
  };

  return (
    <Card
      className={`glass-card p-6 cursor-pointer hover:shadow-xl hover:scale-[1.005] transition-all duration-200 border-l-4 ${getBorderColor()} ${
        isSelected ? 'ring-2 ring-purple-500 ring-offset-2' : ''
      }`}
      onClick={() => onSelect(user.id)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold font-headline truncate">{user.username}</h3>
              {getRoleBadge()}
            </div>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {user.challengeCount || 0} challenges
              </span>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSetPassword(user);
              }}
            >
              <Key className="mr-2 h-4 w-4" />
              Set Password
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
