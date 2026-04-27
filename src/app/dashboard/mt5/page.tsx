'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import AccessGuard from '@/components/AccessGuard';
import { Terminal, Power, Settings2, Server, Activity, ShieldCheck, Copy } from 'lucide-react';

export default function MT5Dashboard() {
  const [status, setStatus] = useState('stopped');
  const [logs, setLogs] = useState<string[]>([]);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const savedStatus = sessionStorage.getItem('mt5_bridge_status');
    if (savedStatus === 'running') {
      setStatus('running');
    }

    async function initializeBridge(isSilentRefresh = false) {
      try {
        if (!isSilentRefresh) {
          const cached = sessionStorage.getItem('mt5_data_cache');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setBotToken(parsed.botToken);
              setLoading(false);
            } catch (e) {}
          } else {
            setLoading(true);
          }
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setLoading(false);
          return;
        }
        if (!isSilentRefresh) setUserId(user.id);

        let { data, error: tokenError } = await supabase
          .from('bot_signals')
          .select('bot_token, is_active')
          .eq('user_id', user.id)
          .eq('platform', 'MT5')
          .maybeSingle();

        if (!data && !tokenError) {
          const { data: newData } = await supabase
            .from('bot_signals')
            .insert([{ user_id: user.id, platform: 'MT5' }])
            .select()
            .single();
          data = newData;
        }

        if (data) {
          if (!isSilentRefresh) setBotToken(data.bot_token);
          if (data.is_active) {
            setStatus('running');
            sessionStorage.setItem('mt5_bridge_status', 'running');
          } else {
            setStatus('stopped');
            sessionStorage.setItem('mt5_bridge_status', 'stopped');
          }
          sessionStorage.setItem('mt5_data_cache', JSON.stringify({
            botToken: data.bot_token
          }));
        }
      } catch (err) {
        console.error("MT5 Bridge Init Error:", err);
      } finally {
        setLoading(false);
      }
    }

    initializeBridge();
    const refreshInterval = setInterval(() => initializeBridge(true), 30000);
    return () => clearInterval(refreshInterval);
  }, [supabase]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-100));
  }, []);

  useEffect(() => {
    if (!botToken) return;

    const fetchRecentLogs = async () => {
      const { data } = await supabase
        .from('cbot_logs')
        .select('message, created_at')
        .eq('bot_token', botToken)
        .order('created_at', { ascending: false })
        .limit(30);
        
      if (data) {
        const history = data.map((log: any) => `[${new Date(log.created_at).toLocaleTimeString()}] ${log.message}`);
        setLogs(history.reverse());
      }
    };
    fetchRecentLogs();

    const logChannel = supabase
      .channel(`private-mt5-logs-${botToken}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'cbot_logs', filter: `bot_token=eq.${botToken}` }, 
        (payload) => { addLog(payload.new.message); }
      )
      .subscribe();

    return () => { supabase.removeChannel(logChannel); }
  }, [botToken, addLog, supabase]);

  const handleControl = async (action: 'start' | 'stop') => {
    addLog(`Sending ${action.toUpperCase()} command to MT5 Cloud Bridge...`);
    try {
      const res = await fetch('/api/terminal/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'mt5', action }),
      });

      if (res.ok) {
        setStatus(action === 'start' ? 'running' : 'stopped');
        sessionStorage.setItem('mt5_bridge_status', action === 'start' ? 'running' : 'stopped');
        addLog(`MT5 Bridge: ${action === 'start' ? 'ACTIVE & LISTENING' : 'OFFLINE'}.`);
        
        if (botToken) {
          await supabase.from('bot_signals').update({ is_active: action === 'start' }).eq('bot_token', botToken);
        }
      } else {
        addLog(`Error: Server responded with status ${res.status}`);
      }
    } catch (e) {
      addLog("Connection Error: Check your internet or API route.");
    }
  };

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTo({
        top: terminalRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <Activity size={40} className="text-blue-500 mb-4 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-800">Initializing Secure Bridge...</p>
        </div>
      </div>
    );
  }

  const apiBaseUrl = "https://kimoocrt.vercel.app/api/signals";
  const fullUrl = botToken ? `${apiBaseUrl}?botId=${botToken}` : "Generating Token...";

  return (
    <AccessGuard requiredTier={3} tierName="Lifetime Pro">
      <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72  min-h-screen text-zinc-900 dark:text-white font-sans overflow-x-hidden">
        
        {/* Ambient Glowing Backgrounds */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-[1700px] mx-auto relative z-10 space-y-6 md:space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-zinc-900 dark:text-white">
                <img src="/mt5.png" alt="MetaTrader 5" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                MetaTrader 5<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Terminal</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 dark:text-zinc-500 font-bold mt-3 leading-none">
                • HIGH-FREQUENCY EXECUTION BRIDGE •
              </p>
            </div>
            
            {/* VPS Status Pill */}
            <div className="flex items-center gap-3 px-5 py-2.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl backdrop-blur-md shadow-xl">
              <div className={`w-2.5 h-2.5 rounded-full ${status === 'running' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]'} animate-pulse`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${status === 'running' ? 'text-emerald-400' : 'text-red-400'}`}>
                {status === 'running' ? 'VPS ONLINE' : 'VPS OFFLINE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* Controls & Config Column */}
            <div className="lg:col-span-4 space-y-6 md:space-y-8">
              
              {/* Terminal Control Panel */}
              <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-[var(--glass-border)] p-6 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
                <h2 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                  <Settings2 size={16} className="text-blue-400" /> Engine Controls
                </h2>
                <button 
                  onClick={() => handleControl('start')}
                  className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 mb-4 active:scale-95 ${
                    status === 'running' 
                      ? 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-zinc-600 cursor-not-allowed shadow-none' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-zinc-900 dark:text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] border border-blue-500/30'
                  }`}
                  disabled={status === 'running'}
                >
                  <Power size={16} className={status === 'running' ? 'text-zinc-600' : 'text-blue-200'} /> CONNECT ENGINE
                </button>
                <button 
                  onClick={() => handleControl('stop')}
                  className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 ${
                    status === 'stopped' 
                      ? 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-zinc-600 cursor-not-allowed shadow-none' 
                      : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                  }`}
                  disabled={status === 'stopped'}
                >
                  <Power size={16} /> DISCONNECT
                </button>

                <div className="mt-8 pt-8 border-t border-[var(--glass-border)]">
                  <label className="block text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Server size={14} className="text-blue-400" /> Unique Signal URL
                  </label>
                  <div className="relative group">
                    <input 
                      readOnly 
                      value={fullUrl} 
                      className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl pl-4 pr-12 py-4 text-[10px] md:text-xs font-mono text-blue-400 outline-none hover:border-white/20 transition-all cursor-text overflow-hidden text-ellipsis"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(fullUrl);
                        addLog("URL Copied to clipboard.");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/[0.05] border border-[var(--glass-border)] hover:bg-white/[0.1] hover:text-zinc-900 dark:text-white rounded-lg transition-all text-zinc-700 dark:text-zinc-400"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="mt-5 text-[10px] text-zinc-600 dark:text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                    Paste this endpoint into your <span className="text-zinc-900 dark:text-white border-b border-white/20 pb-0.5">Kimoo EA</span> parameters within MT5.
                  </p>
                </div>
              </div>
            </div>

            {/* Terminal Output Window */}
            <div className="lg:col-span-8">
              <div className="bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[600px] relative">
                <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 blur-[100px] pointer-events-none" />
                
                <div className="bg-[var(--glass-bg)] border-b border-[var(--glass-border)] px-6 py-4 flex justify-between items-center relative z-10 backdrop-blur-md">
                  <div className="flex items-center gap-3 text-[10px] font-black text-zinc-700 dark:text-zinc-400 uppercase tracking-widest">
                    <Terminal size={14} className="text-blue-400" /> MT5_EXECUTION_STREAM
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
                    logs.map((log, i) => {
                      const firstBracket = log.indexOf(']');
                      const timeStr = log.substring(0, firstBracket + 1);
                      const msgStr = log.substring(firstBracket + 2);
                      return (
                        <div key={i} className={`flex gap-4 ${log.includes('SIGNAL') ? 'bg-blue-500/5 border-l-2 border-blue-500 pl-3 py-1' : ''}`}>
                          <span className="text-zinc-600 shrink-0 select-none">{timeStr}</span>
                          <span className="shrink-0 font-bold select-none text-blue-500">BRIDGE:</span>
                          <span className={`break-words ${
                            log.includes('❌') || log.includes('Error') ? 'text-red-400' : 
                            log.includes('🚀') ? 'text-blue-300 font-bold' : 
                            log.includes('✅') ? 'text-emerald-400' : 
                            'text-zinc-800 dark:text-zinc-300'
                          }`}>
                            {msgStr}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AccessGuard>
  );
}
