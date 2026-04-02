import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<number>(0); 
  const [role, setRole] = useState<string>('user'); // Added role for Admin/Mod bypass
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, role')
        .eq('id', userId)
        .single();

      if (profile) {
        setTier(Number(profile.tier) || 0);
        setRole(profile.role || 'user');
      }
    };

    const initializeAuth = async () => {
      setLoading(true);
      
      // 1. Check initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      
      setLoading(false);

      // 2. Listen for Auth Changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          setUser(session.user);
          await fetchProfile(session.user.id);
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

  // Return role so your pages can use the Admin bypass
  return { user, tier, role, loading };
};
