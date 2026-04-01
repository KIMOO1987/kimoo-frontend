import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<number>(0); // Default to Tier 0 (Free)
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      // 1. Get the current Auth session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login if no session is found
        router.push('/login');
      } else {
        setUser(session.user);

        // 2. Fetch the user's TIER from your 'profiles' table
        // This ensures the dashboard knows if they are Free, Alpha, Pro, etc.
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', session.user.id)
          .single();

        if (!error && profile) {
          // Force it to a number just in case
          setTier(Number(profile.tier) || 0);
        }
      }
      
      setLoading(false);
    };

    checkUser();
  }, [router]);

  // Return the tier alongside user and loading status
  return { user, tier, loading };
};
