'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    console.log('[PAGE] Sign in form submitted');

    try {
      console.log('[PAGE] Calling signIn with email:', formData.email);
      const result = await signIn(formData.email, formData.password);
      console.log('[PAGE] Sign in result:', result);
      if (result.success) {
        console.log('[PAGE] Sign in successful, redirecting to dashboard');
        toast({
          title: 'Success',
          description: 'Signed in successfully!',
        });
        router.push('/dashboard');
      } else {
        console.log('[PAGE] Sign in failed:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to sign in',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[PAGE] Sign in exception:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    console.log('[PAGE] Sign up form submitted');

    try {
      console.log('[PAGE] Calling signUp with email:', formData.email, 'username:', formData.username);
      const result = await signUp(formData.email, formData.password, formData.username);
      console.log('[PAGE] Sign up result:', result);
      if (result.success) {
        console.log('[PAGE] Sign up successful, switching to signin mode');
        toast({
          title: 'Success',
          description: 'Account created! Please sign in.',
        });
        setMode('signin');
        setFormData({ username: '', email: '', password: '' });
      } else {
        console.log('[PAGE] Sign up failed:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to sign up',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[PAGE] Sign up exception:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = mode === 'signin' ? handleSignIn : handleSignUp;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Flame className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Habit Streak</CardTitle>
          <CardDescription>
            {mode === 'signin'
              ? 'Sign in to track your habits and build your streak.'
              : 'Create an account to start tracking your habits.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={mode === 'signup' ? 'space-y-2' : 'hidden'}>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="john_doe"
                required={mode === 'signup'}
                value={formData.username}
                onChange={handleInputChange}
                disabled={mode === 'signin'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={mode === 'signup' ? 'Must be 8+ chars with uppercase, lowercase, number' : ''}
                required
                value={formData.password}
                onChange={handleInputChange}
              />
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground">
                  Must be 8+ characters with uppercase, lowercase, and numbers
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setFormData({ username: '', email: '', password: '' });
              }}
              className="font-semibold text-primary hover:underline"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
