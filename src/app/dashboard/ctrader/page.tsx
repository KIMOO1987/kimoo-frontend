'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Terminal, Copy, Power, Activity, ShieldAlert } from 'lucide-react';

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

  useEffect(() => {
    async function initializeBridge() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }

        // 1. Fetch User Tier (Verify they are Lifetime Pro / Tier 3)
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', user.id)
          .single();
        
        setUserTier(profile?.tier || 0);

        // 2. Fetch or Create Bot Token
        let { data, error: tokenError } = await supabase
          .from('bot_signals')
          .select('bot_token')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!data && !tokenError) {
          const { data: newData } = await supabase
            .from('bot_signals')
            .insert([{ user_id: user.id }])
            .select()
            .single();
          data = newData;
        }

        if (data) setBotToken(data.bot_token);
      } catch (err) {
        console.error("Bridge Init Error:", err);
        setError("Failed to initialize secure bridge.");
      } finally {
        setLoading(false);
      }
    }

    initializeBridge();
  }, [supabase]);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  const handleControl = async (action: 'start' | 'stop') => {
    addLog(`Sending ${action.toUpperCase()} command to Cloud Bridge...`);
    
    // Simulate API call - Replace with your actual /api/terminal/control
    try {
      const res = await fetch('/api/terminal/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'ctrader', action }),
      });

      if (res.ok) {
        setStatus(action === 'start' ? 'running' : 'stopped');
        addLog(`cTrader Bridge: ${action === 'start' ? 'ACTIVE & LISTENING' : 'OFFLINE'}.`);
      } else {
        addLog(`Error: Server responded with status ${res.status}`);
      }
    } catch (e) {
      addLog("Connection Error: Check your internet or API route.");
    }
  };

  // --- UI STATES ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center space-y-4">
        <Activity className="text-cyan-500 animate-spin" size={32} />
        <p className="text-cyan-800 text-[10px] font-black uppercase tracking-[0.4em]">Initializing Secure Bridge</p>
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

  const apiBaseUrl = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/signals` 
  : "";
  const fullUrl = botToken ? `${apiBaseUrl}?botId=${botToken}` : "Generating Token...";

  return (
    <div className="p-4 md:p-8 lg:ml-72 bg-[#05070a] min-h-screen text-zinc-400">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">cTrader Cloud Bridge</h1>
          <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mt-1">Status: {status === 'running' ? 'Connected' : 'Disconnected'}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/5">
          <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-cyan-500 animate-pulse' : 'bg-zinc-700'}`} />
          <span className="text-[10px] font-black uppercase text-zinc-500">{status}</span>
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
                  : 'bg-cyan-600/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-600/20'}`}
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-600 hover:text-white"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="mt-4 text-[9px] text-zinc-500 leading-relaxed italic">
                Paste this into your <span className="text-white">Kimoo cBot</span> parameters within cTrader.
              </p>
            </div>
          </div>
        </div>

        {/* Console / Logs Panel */}
        <div className="lg:col-span-3">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl h-[550px] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-white/[0.02]">
              <Terminal size={14} className="text-cyan-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Secure Console Logs</span>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-2">
              {logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-zinc-700 italic text-[10px] uppercase tracking-widest">
                  System Standby - Awaiting Command
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 group">
                  <span className="text-zinc-700 shrink-0 select-none">{logs.length - i}</span>
                  <span className={`${log.includes('Error') ? 'text-red-400' : 'text-zinc-500'} group-hover:text-zinc-300 transition-colors`}>
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
