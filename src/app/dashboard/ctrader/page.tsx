'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Terminal, Copy, Power, Activity, ShieldAlert, Settings2, Server } from 'lucide-react';
import CBotLogs from '@/components/CBotLogs';

export default function CTraderDashboard() {
  const [status, setStatus] = useState<'stopped' | 'running'>('stopped');
  const [logs, setLogs] = useState<{time: string, msg: string}[]>([]);
  const [userTier, setUserTier] = useState<number | null>(null);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 1. Restore the bridge running status so it survives page refreshes
    const savedStatus = localStorage.getItem('ctrader_bridge_status');
    if (savedStatus === 'running') {
      setStatus('running');
    }

    async function initializeBridge() {
      try {
        // 2. Optimistic Cache Load (Stale-While-Revalidate) to skip loading screen
        const cached = localStorage.getItem('ctrader_data_cache');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setUserTier(parsed.tier);
            setBotToken(parsed.botToken);
            setLoading(false); // Instantly hide initialization screen
          } catch (e) {}
        } else {
          setLoading(true);
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }
        setUserId(user.id);

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
          .select('bot_token, is_active')
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

        if (data) {
          setBotToken(data.bot_token);
          if (data.is_active) {
            setStatus('running');
            sessionStorage.setItem('ctrader_bridge_status', 'running');
          } else {
            setStatus('stopped');
            sessionStorage.setItem('ctrader_bridge_status', 'stopped');
          }
          // Update cache silently in the background for the next refresh
          localStorage.setItem('ctrader_data_cache', JSON.stringify({
            tier: profile?.tier || 0,
            botToken: data.bot_token
          }));
        }
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
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }].slice(-100));
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTo({
        top: terminalRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs]);

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
        // Save the status to localStorage so it survives page refreshes
        localStorage.setItem('ctrader_bridge_status', action === 'start' ? 'running' : 'stopped');
        addLog(`cTrader Bridge: ${action === 'start' ? 'ACTIVE & LISTENING' : 'OFFLINE'}.`);
        
        // Sync the new status to the Supabase Database
        if (userId) {
          await supabase.from('bot_signals').update({ is_active: action === 'start' }).eq('user_id', userId);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-[#030407]">
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <Activity size={40} className="text-cyan-500 mb-4 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-800">Initializing Secure Bridge...</p>
        </div>
      </div>
    );
  }

  if (error || (userTier !== null && userTier < 3)) {
    return (
      <div className="min-h-screen bg-[#030407] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Access Denied</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-xs">{error || "This feature requires a Lifetime Pro (Tier 3) subscription."}</p>
      </div>
    );
  }

  const apiBaseUrl = "https://kimoocrt.supabase.co/functions/v1/get-signal";
  const fullUrl = botToken ? `${apiBaseUrl}?botId=${botToken}` : "Generating Token...";

  return (
    <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden">
      
      {/* Ambient Glowing Backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-[1700px] mx-auto relative z-10 space-y-6 md:space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
              <img src="/ctrader-logo.png" alt="cTrader" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
              cTrader<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Terminal</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
              • CLOUD EXECUTION BRIDGE •
            </p>
          </div>
          
          {/* Status Pill */}
          <div className="flex items-center gap-3 px-5 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl backdrop-blur-md shadow-xl">
            <div className={`w-2.5 h-2.5 rounded-full ${status === 'running' ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]'} animate-pulse`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${status === 'running' ? 'text-cyan-400' : 'text-red-400'}`}>
              {status === 'running' ? 'BRIDGE ONLINE' : 'BRIDGE OFFLINE'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Controls & Config Column */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            
            {/* Bridge Control Panel */}
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
              <h2 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                <Settings2 size={16} className="text-cyan-400" /> Bridge Controls
              </h2>
              
              <button 
                onClick={() => handleControl('start')}
                disabled={status === 'running'}
                className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 mb-4 active:scale-95 ${
                  status === 'running' 
                    ? 'bg-white/[0.02] border border-white/5 text-zinc-600 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] border border-cyan-500/30'
                }`}
              >
                <Power size={16} className={status === 'running' ? 'text-zinc-600' : 'text-cyan-200'} /> START BRIDGE
              </button>

              <button 
                onClick={() => handleControl('stop')}
                disabled={status === 'stopped'}
                className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 ${
                  status === 'stopped' 
                    ? 'bg-white/[0.02] border border-white/5 text-zinc-600 cursor-not-allowed shadow-none' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                }`}
              >
                <Power size={16} /> STOP BRIDGE
              </button>

              <div className="mt-8 pt-8 border-t border-white/5">
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Server size={14} className="text-cyan-400" /> Unique Signal URL
                </label>
                <div className="relative group">
                  <input 
                    readOnly 
                    value={fullUrl} 
                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl pl-4 pr-12 py-4 text-[10px] md:text-xs font-mono text-cyan-400 outline-none hover:border-white/20 transition-all cursor-text overflow-hidden text-ellipsis"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(fullUrl);
                      addLog("URL Copied to clipboard.");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/[0.05] border border-white/[0.05] hover:bg-white/[0.1] hover:text-white rounded-lg transition-all text-zinc-400"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="mt-5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                  Paste this endpoint into your <span className="text-white border-b border-white/20 pb-0.5">Kimoo cBot</span> parameters within the cTrader application.
                </p>
              </div>
            </div>
          </div>

          {/* Terminal Output Window */}
          <div className="lg:col-span-8">
            <div className="bg-[#020305] border border-white/[0.08] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[600px] relative">
              <div className="absolute top-0 left-0 w-full h-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
              
              <div className="bg-white/[0.02] border-b border-white/[0.05] px-6 py-4 flex justify-between items-center relative z-10 backdrop-blur-md">
                <div className="flex items-center gap-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <Terminal size={14} className="text-cyan-400" /> CTRADER_CLOUD_STREAM
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50 border border-emerald-500/20"></div>
                </div>
              </div>
              
              <div ref={terminalRef} className="p-6 md:p-8 overflow-y-auto flex-1 font-mono text-[11px] md:text-[13px] leading-relaxed space-y-3 relative z-10 scroll-smooth">
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-full flex-col text-zinc-600 gap-4 opacity-50">
                    <Activity size={32} className="animate-pulse" />
                    <span className="uppercase tracking-widest font-black text-[10px]">Awaiting Core Connection...</span>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-zinc-600 shrink-0 select-none">[{log.time}]</span>
                      <span className={`${log.msg.includes('Error') ? 'text-red-400' : 'text-cyan-500'} shrink-0 font-bold select-none`}>BRIDGE:</span>
                      <span className={`${log.msg.includes('Error') ? 'text-red-300' : 'text-zinc-300'} break-words`}>{log.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {userId && (
          <div className="mt-8">
             <CBotLogs userId={userId} />
          </div>
        )}
      </div>
    </div>
  );
}
