'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const challengeFormSchema = z.object({
  name: z.string().min(3, {
    message: 'Challenge name must be at least 3 characters.',
  }).max(50, {
    message: 'Challenge name must be at most 50 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }).max(500, {
    message: 'Description cannot be longer than 500 characters.',
  }),
  category: z.enum(['Fitness', 'Wellness', 'Productivity', 'Learning', 'Creative']),
  userIds: z.array(z.string()).default([]),
  addCreator: z.boolean().default(true),
});

type ChallengeFormValues = z.infer<typeof challengeFormSchema>;

type User = {
  id: string;
  email: string;
  username: string;
};

const defaultValues: Partial<ChallengeFormValues> = {
  userIds: [],
  addCreator: true,
};

export default function NewChallengePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users/list');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  async function onSubmit(data: ChallengeFormValues) {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a challenge',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/challenges/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create challenge');
      }

      const result = await response.json();

      toast({
        title: 'Success!',
        description: `Challenge "${data.name}" created successfully.`,
      });

      router.push(`/challenges/${result.data.id}`);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create challenge',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Create a New Challenge</CardTitle>
            <CardDescription>
              Define your goal and invite others to join you on your journey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Challenge Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 30-Day Fitness Quest" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us a little bit about your challenge"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Fitness">Fitness</SelectItem>
                          <SelectItem value="Wellness">Wellness</SelectItem>
                          <SelectItem value="Productivity">Productivity</SelectItem>
                          <SelectItem value="Learning">Learning</SelectItem>
                          <SelectItem value="Creative">Creative</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userIds"
                  render={() => (
                    <FormItem>
                      <Collapsible className="border rounded-lg">
                        <CollapsibleTrigger asChild>
                          <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900">
                            <div>
                              <FormLabel className="text-base font-semibold cursor-pointer">
                                Invite Members (Optional)
                              </FormLabel>
                              <FormDescription className="mt-1">
                                Select users to add to this challenge.
                              </FormDescription>
                            </div>
                            <ChevronDown className="h-5 w-5 opacity-50" />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="border-t px-4 py-3">
                          <div className="space-y-3">
                            {loadingUsers ? (
                              <p className="text-sm text-gray-500">Loading users...</p>
                            ) : users.length === 0 ? (
                              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  No other users available yet. You can invite members later after creating the challenge.
                                </p>
                              </div>
                            ) : (
                              <div className="max-h-80 overflow-y-auto space-y-3 border rounded p-3">
                                {users.map((user) => (
                                  <FormField
                                    key={user.id}
                                    control={form.control}
                                    name="userIds"
                                    render={({ field }) => {
                                      const isChecked = field.value?.includes(user.id) || false;
                                      return (
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={isChecked}
                                              onCheckedChange={(checked) => {
                                                const newValue = checked
                                                  ? [...(field.value || []), user.id]
                                                  : (field.value || []).filter((id) => id !== user.id);
                                                field.onChange(newValue);
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer">
                                            {user.username} ({user.email})
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addCreator"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Add Me as Member
                        </FormLabel>
                        <FormDescription>
                          Join this challenge when you create it.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit">Create Challenge</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
