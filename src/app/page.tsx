'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Flame, ArrowRight, CheckCircle2 } from 'lucide-react';
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

    try {
      const result = await signIn(formData.email, formData.password);
      if (result.success) {
        toast({
          title: 'Welcome back!',
          description: 'Signed in successfully. Getting your dashboard ready...',
        });
        router.push('/dashboard');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to sign in',
          variant: 'destructive',
        });
      }
    } catch (error) {
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

    try {
      const result = await signUp(formData.email, formData.password, formData.username);
      if (result.success) {
        toast({
          title: 'Account created!',
          description: 'Your journey starts now. Please sign in.',
        });
        setMode('signin');
        setFormData({ username: '', email: '', password: '' });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to sign up',
          variant: 'destructive',
        });
      }
    } catch (error) {
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FE] dark:bg-[#050505] p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8 text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center p-4 bg-white dark:bg-white/10 rounded-2xl shadow-xl mb-4"
          >
            <Flame className="h-8 w-8 text-primary animate-pulse-soft" />
          </motion.div>
          <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground">
            Habit Streak
          </h1>
          <p className="text-muted-foreground text-lg">
            Build habits that stick.
          </p>
        </div>

        <Card className="glass-panel border-white/40 dark:border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">
              {mode === 'signin' ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription className="text-base">
              {mode === 'signin'
                ? 'Enter your credentials to access your account'
                : 'Start your journey to better habits today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="johndoe"
                    required={mode === 'signup'}
                    value={formData.username}
                    onChange={handleInputChange}
                    className="min-h-[48px] bg-white/50 dark:bg-black/20"
                  />
                </motion.div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="min-h-[48px] bg-white/50 dark:bg-black/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="min-h-[48px] bg-white/50 dark:bg-black/20"
                />
                {mode === 'signup' && (
                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Min 8 characters</p>
                    <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Uppercase & Number</p>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full min-h-[48px] text-base font-semibold mt-4" 
                variant="gradient"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-center w-full text-sm text-muted-foreground">
              {mode === 'signin' ? "New here? " : 'Already a member? '}
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setFormData({ username: '', email: '', password: '' });
                }}
                className="font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                {mode === 'signin' ? 'Create account' : 'Sign in'}
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}
