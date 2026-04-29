'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// 1. Perfectly formatted interface
interface BotStatusProps {
  userId: string;
  exchangeName: string;
  cachedStatus?: any;
  cachedHeartbeat?: string;
}

// 2. Moved the math helper OUTSIDE the effect so the initial state can use it
const checkStatus = (status: any, heartbeat: string | null | undefined) => {
  if (status === true || status === 'active' || status === 'ONLINE') return true;
  
  if (!heartbeat) return false;
  // Ensure UTC parsing by appending 'Z' if it's missing (Postgres timestamp without timezone fix)
  const heartbeatStr = heartbeat.endsWith('Z') || heartbeat.includes('+') ? heartbeat : heartbeat + 'Z';
  const lastActive = new Date(heartbeatStr).getTime();
  const now = new Date().getTime();
  return (now - lastActive) < 120000; // 2 minutes in ms
};

export default function BotStatus({ userId, exchangeName = 'binance', cachedStatus, cachedHeartbeat }: BotStatusProps) {
  
  // 3. THE MAGIC: Start instantly based on the cache instead of blinding guessing "false"
  const [isOnline, setIsOnline] = useState<boolean>(() => checkStatus(cachedStatus, cachedHeartbeat));
  
  // 4. Stable Supabase client initialization (Best practice for Next.js)
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  useEffect(() => {
    if (!userId) return;

    // 1. Background Fetch (Just to double-check if the cache is stale)
    const getInitialStatus = async () => {
      const { data } = await supabase
        .from('exchange_auth')
        .select('status, last_heartbeat')
        .eq('user_id', userId)
        .eq('exchange_name', exchangeName)
        .single();
      
      if (data) {
        setIsOnline(checkStatus(data.status, data.last_heartbeat));
      }
    };
    getInitialStatus();

    // 2. Realtime Subscription (Listens to Python Heartbeat or Status changes)
    const channel = supabase
      .channel(`status-${exchangeName}-${userId}`)
      .on('postgres_changes',
        { 
          event: 'UPDATE',
          schema: 'public',
          table: 'exchange_auth',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new.exchange_name === exchangeName) {
            setIsOnline(checkStatus(payload.new.status, payload.new.last_heartbeat));
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
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900/90 dark:text-white/90">
        {exchangeName} {isOnline ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
  );
}
