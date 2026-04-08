'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function BotStatus({ userId }: { userId: string }) {
  const [isOnline, setIsOnline] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const checkStatus = (heartbeat: string | null) => {
    if (!heartbeat) return false;
    const lastActive = new Date(heartbeat).getTime();
    const now = new Date().getTime();
    return (now - lastActive) < 120000; // 2 minutes in ms
  };

  useEffect(() => {
    // 1. Initial Fetch
    const getInitialStatus = async () => {
      const { data } = await supabase
        .from('binance_auth')
        .select('last_heartbeat')
        .eq('user_id', userId)
        .single();
      setIsOnline(checkStatus(data?.last_heartbeat));
    };
    getInitialStatus();

    // 2. Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'binance_auth', filter: `user_id=eq.${userId}` },
        (payload) => {
          setIsOnline(checkStatus(payload.new.last_heartbeat));
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-lg border border-white/10 backdrop-blur-md">
      <div className="relative flex h-3 w-3">
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
      </div>
      <span className="text-sm font-medium text-white/90">
        {isOnline ? 'GUARDIAN LIVE' : 'GUARDIAN OFFLINE'}
      </span>
    </div>
  );
}
