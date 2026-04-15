'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// Added exchangeName to props
export default function BotStatus({ userId, exchangeName = 'binance' }: { userId: string, exchangeName?: string }) {
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
    if (!userId) return;
    // 1. Initial Fetch
    const getInitialStatus = async () => {
      const { data } = await supabase
        .from('exchange_auth')
        .select('last_heartbeat')
        .eq('user_id', userId)
        .eq('exchange_name', exchangeName)
        .single();
      setIsOnline(checkStatus(data?.last_heartbeat));
    };
    getInitialStatus();

    // 2. Realtime Subscription
    const channel = supabase
      .channel(`status-${exchangeName}-${userId}`)
      .on('postgres_changes',
        { event: 'UPDATE',
          schema: 'public',
          table: 'exchange_auth',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new.exchange_name === exchangeName) {
            setIsOnline(checkStatus(payload.new.last_heartbeat));
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, exchangeName, supabase]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-lg border border-white/10 backdrop-blur-md">
      <div className="relative flex h-3 w-3">
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
        {exchangeName} {isOnline ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
  );
}
