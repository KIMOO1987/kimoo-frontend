'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type LogEntry = {
  id: string;
  symbol: string;
  log_type: 'INFO' | 'ERROR' | 'WARNING' | 'EXECUTION' | 'FILTER';
  message: string;
  created_at: string;
};

export default function CBotLogs({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // 1. Fetch initial logs
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('cbot_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // Get last 50 logs
      
      if (data) setLogs(data as LogEntry[]);
      setLoading(false);
    };

    fetchLogs();

    // 2. Subscribe to real-time updates from cBot
    const channel = supabase
      .channel('realtime_cbot_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cbot_logs', filter: `user_id=eq.${userId}` },
        (payload) => {
          setLogs((currentLogs) => [payload.new as LogEntry, ...currentLogs].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'ERROR': return 'text-red-500';
      case 'WARNING': return 'text-yellow-400';
      case 'EXECUTION': return 'text-green-400';
      case 'FILTER': return 'text-gray-500';
      default: return 'text-blue-300'; // INFO
    }
  };

  if (loading) return <div className="text-gray-400 animate-pulse font-mono text-sm">Connecting to cBot Telemetry...</div>;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 shadow-2xl overflow-hidden flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live cBot Terminal
        </h3>
        <span className="text-xs text-gray-500">Auto-scroll Active</span>
      </div>
      
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
        {logs.length === 0 ? (
          <div className="text-gray-600">No logs found. Waiting for cBot connection...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3 hover:bg-gray-800/50 p-1 rounded">
              <span className="text-gray-500 shrink-0">
                {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
              </span>
              <span className={`font-bold shrink-0 w-16 ${getLogColor(log.log_type)}`}>
                [{log.log_type}]
              </span>
              <span className="text-gray-300 break-words">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
