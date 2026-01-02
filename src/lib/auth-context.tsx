'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser, getCurrentSession } from './supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { clearAllCache } from './cache';

export type AuthContextType = {
  user: SupabaseUser | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user role info from database
  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin, is_super_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AUTH] Error fetching user roles:', error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      } else if (data) {
        setIsAdmin(data.is_admin || false);
        setIsSuperAdmin(data.is_super_admin || false);
      }
    } catch (error) {
      console.error('[AUTH] Exception fetching user roles:', error);
      setIsAdmin(false);
      setIsSuperAdmin(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentSession = await getCurrentSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (currentSession?.user?.id) {
          await fetchUserRoles(currentSession.user.id);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user?.id) {
        await fetchUserRoles(session.user.id);
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    username: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AUTH] Starting sign up for:', email);
      
      // Call our API route to create user and profile
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('[AUTH] Sign up error:', result.error);
        return { success: false, error: result.error || 'Sign up failed' };
      }

      console.log('[AUTH] Sign up successful, user:', result.data?.user?.id);
      
      // Set user from the response
      if (result.data?.user) {
        setUser(result.data.user);
      }
      
      return { success: true };
    } catch (error) {
      console.error('[AUTH] Sign up exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Sign up failed' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AUTH] Starting sign in for:', email);

      // Determine if input is email or username
      let userEmail = email;
      
      if (!email.includes('@')) {
        // It's a username, look up email first
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('username', email)
          .single();

        if (userError || !userData) {
          console.error('[AUTH] Username not found:', email);
          return { success: false, error: 'Invalid username or password' };
        }
        userEmail = userData.email;
      }

      // Sign in directly on the client side to establish the session
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (error) {
        console.error('[AUTH] Sign in error:', error.message);
        return { success: false, error: 'Invalid email or password' };
      }

      if (!data.user || !data.session) {
        return { success: false, error: 'Sign in failed' };
      }

      console.log('[AUTH] Sign in successful, user:', data.user.id);
      
      // The onAuthStateChange listener will handle setting user and session
      // But we can also set them here for immediate availability
      setUser(data.user);
      setSession(data.session);

      return { success: true };
    } catch (error) {
      console.error('[AUTH] Sign in exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' };
    }
  };

  const signOut = async () => {
    try {
      console.log('[AUTH] Starting sign out');
      await supabase.auth.signOut();
      console.log('[AUTH] Sign out successful');
      setUser(null);
      // Clear all cached data to prevent stale check-in data from showing on re-login
      clearAllCache();
      console.log('[AUTH] Cache cleared on sign out');
    } catch (error) {
      console.error('[AUTH] Sign out failed:', error);
    }
  };

  const refreshRoles = async () => {
    if (user?.id) {
      await fetchUserRoles(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isSuperAdmin, loading, signUp, signIn, signOut, refreshRoles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
