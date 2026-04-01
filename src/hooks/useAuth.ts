import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<number>(0); 
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Check initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await handleUserSession(session);
      } else {
        // If we finished checking and there is NO session, redirect
        setLoading(false);
        router.push('/login');
      }

      // 2. Listen for Auth Changes (Login/Logout/Token Refresh)
      // This is crucial to prevent being kicked out during a session refresh
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await handleUserSession(session);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setTier(0);
          router.push('/login');
        }
      });

      return () => subscription.unsubscribe();
    };

    const handleUserSession = async (session: any) => {
      setUser(session.user);
      
      // Fetch the user's TIER
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', session.user.id)
        .single();

      if (!error && profile) {
        setTier(Number(profile.tier) || 0);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [router]);

  return { user, tier, loading };
};
