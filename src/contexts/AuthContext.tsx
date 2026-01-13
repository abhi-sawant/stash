import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { syncService } from '@/lib/sync';
import { thumbnailService } from '@/lib/thumbnailService';
import * as db from '@/lib/db';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  syncing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Track if we've already synced this session - persists across component remounts
let hasPerformedInitialSync = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to sync completion to update syncing state and fetch thumbnails
    const unsubscribe = syncService.onSyncComplete(() => {
      setSyncing(false);

      // Wait a bit for the UI to update with synced bookmarks before fetching thumbnails
      setTimeout(() => {
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            thumbnailService.fetchMissingThumbnails(data.user.id).catch(error => {
              console.error('Background thumbnail fetch failed:', error);
            });
          }
        });
      }, 1000); // 1 second delay to ensure bookmarks are loaded in UI
    });

    // Get initial session - sync if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // If user is already logged in (e.g., page refresh), sync from cloud only if email is verified
      if (session?.user && !hasPerformedInitialSync) {
        if (session.user.email_confirmed_at) {
          hasPerformedInitialSync = true;
          setSyncing(true);
          syncService.initialSync(session.user.id).catch(error => {
            console.error('Initial sync failed:', error);
            setSyncing(false);
          });
        }
      }
    });

    // Listen for auth changes - ONLY sync on SIGNED_IN event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // ONLY sync when user signs in AND we haven't synced yet AND email is verified
      if (event === 'SIGNED_IN' && session?.user && !hasPerformedInitialSync) {
        // Only sync if email is verified
        if (session.user.email_confirmed_at) {
          hasPerformedInitialSync = true;
          setSyncing(true);
          syncService.initialSync(session.user.id).catch(error => {
            console.error('Sign in sync failed:', error);
            setSyncing(false);
          });
        }
      }

      // Clear local data on sign out
      if (event === 'SIGNED_OUT') {
        hasPerformedInitialSync = false; // Reset flag on logout
        await db.clearAllData();
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Data will be cleared by the SIGNED_OUT event handler
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    syncing,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
