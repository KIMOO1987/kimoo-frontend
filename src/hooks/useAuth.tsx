"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: any;
  tier: number;
  role: string;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<number>(0); // Initialize to 0
  const [role, setRole] = useState<string>('user'); // Initialize to 'user'
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tier, role')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        setTier(profile.tier ?? 0);
        setRole(profile.role ?? 'user');
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      // Fallback to basic access on error
      setTier(0);
      setRole('user');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
  
    // Safety net: if Supabase takes too long, unblock the UI anyway
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);
  
    // onAuthStateChange is the ONLY source of truth.
    // It fires INITIAL_SESSION immediately on load — no need for getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
  
        clearTimeout(timeout); // Auth responded — cancel the safety timer
  
        if (session?.user) {
          setUser(session.user);
          setLoading(false); // ✅ Unblock the UI immediately
          fetchProfile(session.user.id); // Fetch profile in background (no await)
        } else {
          setUser(null);
          setTier(0);
          setRole('user');
          setLoading(false); // ✅ Unblock the UI immediately
        }
      }
    );
  
    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, tier, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
