import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function useOptimisticAuth(cacheKey: string) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 1. Instantly load from cache to skip loading screen
    const cachedUser = localStorage.getItem(cacheKey);
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
        setLoading(false); 
      } catch (e) {}
    }

    // 2. Fetch fresh data in the background
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        localStorage.setItem(cacheKey, JSON.stringify(user));
      } else {
        localStorage.removeItem(cacheKey);
      }
      setLoading(false);
    }

    fetchUser();
  }, [cacheKey, supabase]);

  return { user, loading, supabase };
}
