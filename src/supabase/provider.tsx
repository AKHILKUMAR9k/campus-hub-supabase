'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './client';

interface SupabaseContextState {
  user: User | null;
  session: Session | null;
  isUserLoading: boolean;
  userError: Error | null;
}

const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          // Handle refresh token errors by clearing localStorage and resetting state
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
            localStorage.clear(); // Clear all localStorage to remove invalid tokens
            setSession(null);
            setUser(null);
            setUserError(null); // Reset error since we're handling it
          } else {
            setUserError(error);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        setUserError(error as Error);
      } finally {
        setIsUserLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsUserLoading(false);
        setUserError(null);

        // Create user profile in database when user signs up and is confirmed
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: existingUser, error: selectError } = await supabase
              .from('users')
              .select('id')
              .eq('id', session.user.id)
              .single();

            // If user exists, no need to create profile
            if (existingUser) {
              return;
            }

            // If error exists and is not "not found" (PGRST116), log it and return
            if (selectError && selectError.code !== 'PGRST116') {
              console.error('Error checking existing user:', selectError.message || selectError);
              return;
            }

            // Prefer pending profile stored during signup
            let pendingProfile: { full_name?: string; role?: string; email?: string } | null = null;
            try {
              if (typeof window !== 'undefined') {
                const raw = localStorage.getItem('pendingUserProfile');
                if (raw) pendingProfile = JSON.parse(raw);
              }
            } catch (e) {
              console.warn('Failed to read pendingUserProfile:', e);
            }

            // Build profile payload aligned to current schema
            const userMetadata = session.user.user_metadata;
            let firstName = '';
            let lastName = '';
            let role: string = 'student';

            if (pendingProfile?.full_name) {
              const parts = pendingProfile.full_name.trim().split(' ');
              firstName = parts[0] || '';
              lastName = parts.slice(1).join(' ');
            } else if (userMetadata?.full_name) {
              const parts = String(userMetadata.full_name).trim().split(' ');
              firstName = parts[0] || '';
              lastName = parts.slice(1).join(' ');
            } else if (session.user.email) {
              // Fallback to email local-part as first name
              firstName = String(session.user.email).split('@')[0];
              lastName = '';
            }

            if (pendingProfile?.role) {
              role = pendingProfile.role;
            } else if (typeof userMetadata?.role === 'string') {
              role = userMetadata.role;
            }

            const userProfile = {
              id: session.user.id,
              email: pendingProfile?.email || session.user.email!,
              first_name: firstName,
              last_name: lastName,
              role: role,
              organizer_status: role === 'club_organizer' ? 'pending' : undefined,
            } as Record<string, any>;

            const { error: insertError } = await supabase.from('users').insert(userProfile);
            if (insertError) {
              console.error('Error creating user profile:', insertError);
            }

            // Clear pending profile upon success or after attempt
            try {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('pendingUserProfile');
              }
            } catch (e) {
              // Ignore
            }
          } catch (error) {
            console.error('Error in user profile creation:', error);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const contextValue: SupabaseContextState = {
    user,
    session,
    isUserLoading,
    userError,
  };

  return (
    <SupabaseContext.Provider value={contextValue}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = (): SupabaseContextState => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const useAuth = () => {
  const { user, session, isUserLoading, userError } = useSupabase();
  return { user, session, isUserLoading, userError };
};
