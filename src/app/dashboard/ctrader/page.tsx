'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Terminal, Copy, Power, Activity, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

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
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setError("Authentication required. Please log in.");
          return;
        }

        // 1. Fetch User Profile & Bot Config from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', user.id)
          .single();
        
        setUserTier(profile?.tier || 0);

        // 2. Fetch Bot Token and the PERSISTENT Status
        let { data, error: tokenError } = await supabase
          .from('bot_signals')
          .select('bot_token, is_active') // IMPORTANT: fetching the saved state
          .eq('user_id', user.id)
          .maybeSingle();

        if (!data && !tokenError) {
          const { data: newData } = await supabase
            .from('bot_signals')
            .insert([{ user_id: user.id, is_active: false }])
            .select()
            .single();
          data = newData;
        }

        if (data) {
          setBotToken(data.bot_token);
          // SYNC UI WITH DATABASE: If DB says it's active, set running.
          setStatus(data.is_active ? 'running' : 'stopped');
          addLog(data.is_active ? "Cloud Bridge is currently ACTIVE." : "Cloud Bridge is currently STANDBY.");
        }

      } catch (err) {
        console.error("Bridge Init Error:", err);
        setError("Failed to initialize secure bridge.");
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
      // 1. Update Supabase FIRST so the state is saved even if the API call is slow
      const { error: dbError } = await supabase
        .from('bot_signals')
        .update({ is_active: isStarting })
        .eq('bot_token', botToken);

      if (dbError) throw new Error("Database update failed");

      // 2. Trigger your Backend API Bridge
      const res = await fetch('/api/terminal/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            platform: 'ctrader', 
            action, 
            botToken // Pass token so backend knows which user to start/stop
        }),
      });

      if (res.ok) {
        setStatus(isStarting ? 'running' : 'stopped');
        addLog(`SUCCESS: cTrader Bridge is now ${isStarting ? 'ONLINE' : 'OFFLINE'}.`);
      } else {
        addLog(`API Error: Server returned ${res.status}. Check backend logs.`);
      }
    } catch (e) {
      addLog("CRITICAL ERROR: Could not sync state with cloud server.");
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center space-y-4">
        <Activity className="text-cyan-500 animate-spin" size={32} />
        <p className="text-cyan-800 text-[10px] font-black uppercase tracking-[0.4em]">Syncing with Cloud Terminal</p>
      </div>
    );
  }

  if (error || (userTier !== null && userTier < 3)) {
    return (
      <div className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-white font-black text-xl uppercase italic">Access Denied</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-xs">{error || "This feature requires a Lifetime Pro (Tier 3) subscription."}</p>
      </div>
    );
  }

  const apiBaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/signals` : "";
  const fullUrl = botToken ? `${apiBaseUrl}?botId=${botToken}` : "Generating Token...";

  return (
    <div className="p-4 md:p-8 lg:ml-72 bg-[#05070a] min-h-screen text-zinc-400">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">cTrader Cloud Bridge</h1>
          <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mt-1">
            Mode: Persistent Webhook Execution
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/5">
          {status === 'running' ? <CheckCircle2 size={14} className="text-cyan-500" /> : <XCircle size={14} className="text-zinc-600" />}
          <span className={`text-[10px] font-black uppercase ${status === 'running' ? 'text-cyan-500' : 'text-zinc-500'}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-6">Bridge Controls</h3>
            
            <button 
              onClick={() => handleControl('start')}
              disabled={status === 'running'}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-xs uppercase
                ${status === 'running' 
                  ? 'bg-zinc-900 text-zinc-700 border border-transparent cursor-not-allowed' 
                  : 'bg-cyan-600/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-600/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]'}`}
            >
              <Power size={14} /> Start Bridge
            </button>

            <button 
              onClick={() => handleControl('stop')}
              disabled={status === 'stopped'}
              className={`w-full py-4 mt-3 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-xs uppercase
                ${status === 'stopped' 
                  ? 'bg-zinc-900 text-zinc-700 border border-transparent cursor-not-allowed' 
                  : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'}`}
            >
              <Power size={14} /> Stop Bridge
            </button>

            <div className="mt-8 pt-6 border-t border-white/5">
              <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Unique Signal URL</label>
              <div className="relative group">
                <input 
                  readOnly 
                  value={fullUrl} 
                  className="w-full p-3 bg-black rounded-lg border border-white/5 text-[10px] font-mono text-cyan-700 pr-10 overflow-hidden text-ellipsis"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(fullUrl);
                    addLog("URL Copied to clipboard.");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-600 hover:text-white transition-colors"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="mt-4 text-[9px] text-zinc-500 leading-relaxed italic">
                Signals sent to this URL will be processed by the bridge 24/7 until stopped.
              </p>
            </div>
          </div>
        </div>

        {/* Console / Logs Panel */}
        <div className="lg:col-span-3">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl h-[550px] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-cyan-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Secure Console Logs</span>
              </div>
              <span className="text-[9px] text-zinc-600 font-bold uppercase">Session Live</span>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-2 scrollbar-hide">
              {logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-zinc-700 italic text-[10px] uppercase tracking-widest">
                  System Standby - Awaiting Command
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 group border-l border-white/5 pl-4 hover:border-cyan-500/50 transition-colors">
                  <span className="text-zinc-800 shrink-0 select-none text-[10px]">{logs.length - i}</span>
                  <span className={`${log.includes('Error') || log.includes('CRITICAL') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-cyan-400' : 'text-zinc-500'} group-hover:text-zinc-300 transition-colors`}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}