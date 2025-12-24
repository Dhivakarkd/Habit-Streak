'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 md:py-12">
      {/* Background grid pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg border border-border/50">
          <CardHeader className="text-center pb-4 md:pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
              className="mb-3 md:mb-4 flex justify-center"
            >
              <Flame className="h-10 w-10 md:h-12 md:w-12 text-primary animate-pulse-soft" />
            </motion.div>
            <CardTitle className="text-2xl md:text-3xl font-bold">Habit Streak</CardTitle>
            <CardDescription className="text-sm md:text-base mt-2">
              {mode === 'signin'
                ? 'Sign in to track your habits and build your streak.'
                : 'Create an account to start tracking your habits.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-3 md:space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {mode === 'signup' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="username" className="text-sm md:text-base">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="john_doe"
                    required={mode === 'signup'}
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={mode === 'signin'}
                    className="min-h-[44px] text-sm md:text-base"
                  />
                </motion.div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="min-h-[44px] text-sm md:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm md:text-base">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={mode === 'signup' ? 'Must be 8+ chars with uppercase, lowercase, number' : ''}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="min-h-[44px] text-sm md:text-base"
                />
                {mode === 'signup' && (
                  <p className="text-xs text-muted-foreground">
                    Must be 8+ characters with uppercase, lowercase, and numbers
                  </p>
                )}
              </div>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button 
                  type="submit" 
                  className="w-full min-h-[44px] text-sm md:text-base" 
                  disabled={loading}
                >
                  {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>
              </motion.div>
            </motion.form>
          </CardContent>
          <CardFooter className="flex justify-center text-xs md:text-sm pt-3 md:pt-4">
            <p>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <motion.button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setFormData({ username: '', email: '', password: '' });
                }}
                className="font-semibold text-primary hover:underline inline-block"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </motion.button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}
