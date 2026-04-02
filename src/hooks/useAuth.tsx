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
  const [tier, setTier] = useState<number>(0);
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  // Memoize fetchProfile so it can be used inside useEffect safely
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tier, role')
        .eq('id', userId)
        .single();

      if (profile) {
        const userRole = profile.role || 'user';
        setRole(userRole);
        
        // If admin, force max tier, otherwise use DB value
        if (userRole === 'admin') {
          setTier(3);
        } else {
          setTier(Number(profile.tier) || 0);
        }
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        // Use getSession for quick client-side retrieval
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

    // Listen for Auth changes (Sign-in, Sign-out, Token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setTier(0);
        setRole('user');
      }
      setLoading(false);
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
