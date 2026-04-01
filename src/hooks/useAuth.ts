import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { useRouter } from 'next/router';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null); // To store plan_type and role
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      // 1. Get the Auth Session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);

        // 2. Fetch the Profile data from Supabase 'profiles' table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('plan_type, role, full_name')
          .eq('id', session.user.id)
          .single();

        if (!error && profileData) {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  // 3. Permission Logic (Centralized here)
  const plan = (profile?.plan_type || 'FREE').toUpperCase();
  const role = (profile?.role || 'user').toLowerCase();

  // Access Levels
  const isAlpha = plan === 'ALPHA' || plan === 'PRO' || role === 'ULTIMATE' || role === 'admin' || role === 'moderator';
  const isPro = plan === 'PRO' || role === 'ULTIMATE' || role === 'admin' || role === 'moderator';
  const isUltimate = role === 'ULTIMATE' || 'admin' || role === 'moderator';

  return { 
    user, 
    profile, 
    loading, 
    plan,
    isAlpha, 
    isPro, 
    isUltimate 
  };
};
