"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: any;
  tier: number;
  role: string;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tier: 0,
  role: 'user',
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<number>(0);
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, role')
        .eq('id', userId)
        .single();

      if (profile) {
        setTier(Number(profile.tier) || 0);
        setRole(profile.role || 'user');
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      // 1. Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      setLoading(false);

      // 2. Listen for changes (Login/Logout)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (currentSession?.user) {
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          setUser(null);
          setTier(0);
          setRole('user');
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, tier, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// This is the hook you use in your pages
export const useAuth = () => useContext(AuthContext);
