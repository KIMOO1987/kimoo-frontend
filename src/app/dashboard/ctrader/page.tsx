'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Terminal, Copy, Power, Activity, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import TradeHistory from '@/components/TradeHistory';

export default function CTraderDashboard() {
  const [status, setStatus] = useState<'stopped' | 'running'>('stopped');
  const [logs, setLogs] = useState<string[]>([]);
  const [userTier, setUserTier] = useState<number | null>(null);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    async function initializeBridge() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("Authentication required.");
          return;
        }

        // 1. Get Profile
        const { data: profile } = await supabase.from('profiles').select('tier').eq('id', user.id).single();
        setUserTier(profile?.tier || 0);

        // 2. Get Bot Data (Check if row exists)
        let { data, error: fetchError } = await supabase
          .from('bot_signals')
          .select('*') 
          .eq('user_id', user.id)
          .maybeSingle();

        // 3. Create row if it doesn't exist
        if (!data) {
          const { data: newData, error: insertError } = await supabase
            .from('bot_signals')
            .insert([{ user_id: user.id, is_active: false }])
            .select()
            .single();
          data = newData;
          if (insertError) console.error("Insert Error:", insertError);
        }

        if (data) {
          // Set values even if is_active is missing in DB for now
          setBotToken(data.bot_token);
          setStatus(data.is_active ? 'running' : 'stopped');
          addLog("System Initialized. URL Ready.");
        }
      } catch (err) {
        addLog("Init Error: Check Supabase table columns.");
      } finally {
        setLoading(false);
      }
    }
    initializeBridge();
  }, [supabase, addLog]);

  const handleControl = async (action: 'start' | 'stop') => {
    const isStarting = action === 'start';
    addLog(`Initiating ${action.toUpperCase()} sequence...`);
    
    try {
      // 1. Attempt Database Sync
      const { error: dbError } = await supabase
        .from('bot_signals')
        .update({ is_active: isStarting })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (dbError) {
        addLog(`DB Warning: Could not save state (${dbError.message})`);
        // We continue anyway so the button still works for the current session
      }

      // 2. Call API
      const res = await fetch('/api/terminal/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'ctrader', action, botToken }),
      });

      if (res.ok) {
        setStatus(isStarting ? 'running' : 'stopped');
        addLog(`SUCCESS: cTrader Bridge is ${isStarting ? 'ONLINE' : 'OFFLINE'}.`);
      }
    } catch (e) {
      addLog("CRITICAL ERROR: Connection failed.");
    }
  };

  // URL GENERATION - Fixed to ensure it shows once botToken is available
  const apiBaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/signals` : "";
  const fullUrl = botToken ? `${apiBaseUrl}?botId=${botToken}` : "Awaiting Token...";

  if (loading) return <div className="min-h-screen bg-[#05070a] flex items-center justify-center text-cyan-500">Loading...</div>;

  return (
    <div className="p-4 md:p-8 lg:ml-72 bg-[#05070a] min-h-screen text-zinc-400">
      <div className="flex justify-between items-center border-b border-white/5 pb-6 mb-8">
        <h1 className="text-2xl font-red text-white italic">c</h1>
        <h1 className="text-2xl font-black text-white italic">Trader Cloud Bridge</h1>
        <div className="px-4 py-2 bg-black/40 rounded-full border border-white/5 text-[10px] font-black">
          {status.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
            <button 
              onClick={() => handleControl('start')}
              disabled={status === 'running'}
              className={`w-full py-4 rounded-xl font-black text-xs mb-3 ${status === 'running' ? 'bg-zinc-800' : 'bg-cyan-600 text-white'}`}
            >
              START BRIDGE
            </button>
            <button 
              onClick={() => handleControl('stop')}
              disabled={status === 'stopped'}
              className={`w-full py-4 rounded-xl font-black text-xs ${status === 'stopped' ? 'bg-zinc-800' : 'bg-red-600 text-white'}`}
            >
              STOP BRIDGE
            </button>

            <div className="mt-8 pt-6 border-t border-white/5">
              <label className="text-[9px] font-black text-zinc-600 uppercase">Signal URL</label>
              <div className="flex gap-2 mt-2">
                <input 
                  readOnly value={fullUrl} 
                  className="flex-1 p-2 bg-black rounded border border-white/5 text-[10px] font-mono text-cyan-600 overflow-hidden" 
                />
                <button onClick={() => navigator.clipboard.writeText(fullUrl)} className="p-2 bg-zinc-900 rounded"><Copy size={14}/></button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl h-[500px] flex flex-col">
            <div className="p-4 border-b border-white/5 font-black text-[10px] text-white uppercase">Console</div>
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-2">
              {logs.map((log, i) => <div key={i} className="text-zinc-500">{log}</div>)}
            </div>
          </div>
        </div>
      </div>
      {/* TRADE HISTORY TABLE */}
      <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl min-h-[300px] shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-[#05070a]/40">
            <span className="text-[10px] font-black tracking-widest text-zinc-300 flex items-center gap-2 uppercase">
              <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
              Global Signal History
            </span>
        </div>
        <div className="p-2 overflow-x-auto">
            <TradeHistory />
        </div>
      </div>
    </div>
  );
}
