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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, ChevronLeft } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  challengeCount: number;
}

export default function AdminUsersPage() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [createAdminUsername, setCreateAdminUsername] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'promote' | 'demote' | 'revoke' | null;
    userIds: string[];
  }>({ open: false, action: null, userIds: [] });

  // Redirect if not super admin
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isSuperAdmin, router]);

  // Fetch users
  useEffect(() => {
    if (!user?.id) return;

    const fetchUsers = async () => {
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

    fetchUsers();
  }, [user?.id, toast]);

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBulkAction = (action: 'promote' | 'demote' | 'revoke') => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one user',
        variant: 'destructive',
      });
      return;
    }

    setConfirmDialog({
      open: true,
      action,
      userIds: Array.from(selectedUsers),
    });
  };

  const executeBulkAction = async () => {
    const { action, userIds } = confirmDialog;
    if (!action || userIds.length === 0 || !user?.id) return;

    try {
      const endpoint =
        action === 'promote'
          ? '/api/admin/users/bulk-promote'
          : action === 'demote'
            ? '/api/admin/users/bulk-demote'
            : '/api/admin/users/bulk-revoke';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform action');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: `Successfully ${action}d ${userIds.length} user(s)`,
        });
        
        // Refresh users list
        const newUsers = users.map((u) =>
          userIds.includes(u.id)
            ? action === 'promote'
              ? { ...u, isAdmin: true }
              : action === 'demote'
                ? { ...u, isAdmin: false }
                : { ...u, isAdmin: false }
            : u
        );
        setUsers(newUsers);
        setSelectedUsers(new Set());
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform action',
        variant: 'destructive',
      });
    } finally {
      setConfirmDialog({ open: false, action: null, userIds: [] });
    }
  };

  const handleCreateAdmin = async () => {
    if (!createAdminUsername.trim() || !user?.id) return;

    try {
      setCreatingAdmin(true);
      const response = await fetch('/api/admin/users/promote-to-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify({ username: createAdminUsername.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to promote user');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: `Successfully promoted ${createAdminUsername} to admin`,
        });
        setCreateAdminUsername('');
        setCreateAdminOpen(false);

        // Refresh users list
        setLoading(true);
        const listResponse = await fetch('/api/admin/users', {
          headers: {
            'X-User-ID': user.id,
          },
        });

        if (listResponse.ok) {
          const listData = await listResponse.json();
          if (listData.success) {
            setUsers(listData.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Create admin failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to promote user',
        variant: 'destructive',
      });
    } finally {
      setCreatingAdmin(false);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50 p-4 md:p-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">Manage user roles and permissions</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="manage" className="w-full">
            <TabsList>
              <TabsTrigger value="manage">Manage Users</TabsTrigger>
              <TabsTrigger value="create">Create Admin</TabsTrigger>
            </TabsList>

            {/* Manage Users Tab */}
            <TabsContent value="manage" className="space-y-4">
              <Card className="p-6">
                {/* Search and Bulk Actions */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by username or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  {/* Bulk Actions */}
                  {selectedUsers.size > 0 && (
                    <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded">
                      <span className="text-sm font-medium">
                        {selectedUsers.size} user(s) selected
                      </span>
                      <div className="flex-1" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('promote')}
                      >
                        Promote to Admin
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('demote')}
                      >
                        Demote from Admin
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBulkAction('revoke')}
                      >
                        Revoke All
                      </Button>
                    </div>
                  )}
                </div>

                {/* Users Table */}
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={
                                selectedUsers.size > 0 &&
                                selectedUsers.size === filteredUsers.length
                              }
                              ref={(el) => {
                                if (el) {
                                  el.indeterminate =
                                    selectedUsers.size > 0 &&
                                    selectedUsers.size < filteredUsers.length;
                                }
                              }}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="w-4 h-4"
                            />
                          </TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Challenges Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((adminUser) => (
                          <TableRow key={adminUser.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.has(adminUser.id)}
                                onCheckedChange={() => handleSelectUser(adminUser.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {adminUser.username}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {adminUser.email}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {adminUser.isSuperAdmin && (
                                  <Badge variant="default">Super Admin</Badge>
                                )}
                                {adminUser.isAdmin && !adminUser.isSuperAdmin && (
                                  <Badge variant="secondary">Admin</Badge>
                                )}
                                {!adminUser.isAdmin && !adminUser.isSuperAdmin && (
                                  <Badge variant="outline">User</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {adminUser.challengeCount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {filteredUsers.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Create Admin Tab */}
            <TabsContent value="create" className="space-y-4">
              <Card className="p-6 max-w-md">
                <h3 className="text-lg font-semibold mb-4">Promote User to Admin</h3>
                <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Admin</DialogTitle>
                      <DialogDescription>
                        Search for a user by username and promote them to admin
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter username..."
                        value={createAdminUsername}
                        onChange={(e) => setCreateAdminUsername(e.target.value)}
                        disabled={creatingAdmin}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCreateAdminOpen(false)}
                        disabled={creatingAdmin}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateAdmin}
                        disabled={!createAdminUsername.trim() || creatingAdmin}
                      >
                        {creatingAdmin ? 'Promoting...' : 'Promote'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
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
                : confirmDialog.action === 'demote'
                  ? `Are you sure you want to demote ${confirmDialog.userIds.length} admin(s)?`
                  : `Are you sure you want to revoke all permissions for ${confirmDialog.userIds.length} user(s)? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <DialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              className={confirmDialog.action === 'revoke' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {confirmDialog.action === 'promote'
                ? 'Promote'
                : confirmDialog.action === 'demote'
                  ? 'Demote'
                  : 'Revoke'}
            </AlertDialogAction>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
