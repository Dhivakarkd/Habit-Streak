'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const challengeFormSchema = z.object({
  name: z.string().min(3, {
    message: 'Challenge name must be at least 3 characters.',
  }),
  description: z.string().max(280, {
    message: 'Description cannot be longer than 280 characters.',
  }).optional(),
  category: z.enum(['Fitness', 'Wellness', 'Productivity', 'Learning', 'Creative']),
  isPublic: z.boolean().default(true),
});

type ChallengeFormValues = z.infer<typeof challengeFormSchema>;

const defaultValues: Partial<ChallengeFormValues> = {
  isPublic: true,
};

export default function NewChallengePage() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  function onSubmit(data: ChallengeFormValues) {
    console.log(data);
    toast({
      title: 'Challenge Created!',
      description: `Your new challenge "${data.name}" is live.`,
    });
    router.push('/dashboard');
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
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Public Challenge
                        </FormLabel>
                        <FormDescription>
                          Allow anyone to discover and join this challenge.
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
