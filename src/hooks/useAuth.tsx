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
  const [tier, setTier] = useState<number>(3); // Default to max for testing
  const [role, setRole] = useState<string>('admin'); // Default to admin for testing
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, role')
        .eq('id', userId)
        .single();

      // DEBUG: We still fetch the real data just to see it in the console,
      // but we force the state to be Admin/Tier 3.
      if (profile) {
        console.log("REAL DB DATA:", profile);
      }
      
      // MASTER BYPASS: Force high-level access for testing
      setRole('admin');
      setTier(3);
      
    } catch (error) {
      console.error("Profile fetch error (Silenced for testing):", error);
      // Even on error, we keep the bypass active
      setRole('admin');
      setTier(3);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Initial session check error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        // On logout, we reset to 0
        setTier(0);
        setRole('user');
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
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