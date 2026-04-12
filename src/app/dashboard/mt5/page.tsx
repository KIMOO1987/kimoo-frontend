'use client';

import React, { useState, useEffect, useRef } from 'react';
import AccessGuard from '@/components/AccessGuard';
import { Terminal, Power, Settings2, Server, Activity, ShieldCheck } from 'lucide-react';

export default function MT5Dashboard() {
  const [status, setStatus] = useState('stopped');
  const [logs, setLogs] = useState<{time: string, msg: string}[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }].slice(-100));
  };

  const handleControl = async (action: 'start' | 'stop') => {
    addLog(`Sending ${action} command to MT5 Windows VPS...`);
    const res = await fetch('/api/terminal/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'mt5', action }),
    });

    if (res.ok) {
      setStatus(action === 'start' ? 'running' : 'stopped');
      addLog(`MT5 Bridge ${action === 'start' ? 'initialized' : 'disconnected'}.`);
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

  return (
    <AccessGuard requiredTier={3} tierName="Lifetime Pro">
      <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden">
        
        {/* Ambient Glowing Backgrounds */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-[1700px] mx-auto relative z-10 space-y-6 md:space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
                MetaTrader 5<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Terminal</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
                • HIGH-FREQUENCY EXECUTION BRIDGE •
              </p>
            </div>
            
            {/* VPS Status Pill */}
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl backdrop-blur-md shadow-xl">
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
              <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
                <h2 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                  <Settings2 size={16} className="text-blue-400" /> Engine Controls
                </h2>
                <button 
                  onClick={() => handleControl('start')}
                  className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 mb-4 active:scale-95 ${
                    status === 'running' 
                      ? 'bg-white/[0.02] border border-white/5 text-zinc-600 cursor-not-allowed shadow-none' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] border border-blue-500/30'
                  }`}
                  disabled={status === 'running'}
                >
                  <Power size={16} className={status === 'running' ? 'text-zinc-600' : 'text-blue-200'} /> CONNECT ENGINE
                </button>
                <button 
                  onClick={() => handleControl('stop')}
                  className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 ${
                    status === 'stopped' 
                      ? 'bg-white/[0.02] border border-white/5 text-zinc-600 cursor-not-allowed shadow-none' 
                      : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                  }`}
                  disabled={status === 'stopped'}
                >
                  <Power size={16} /> DISCONNECT
                </button>
              </div>

              {/* Server Config Block */}
              <div className="bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem]">
                <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Server size={14} /> VPS Identity
                </h2>
                <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-white/[0.02] pb-3">
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Login ID</span>
                    <span className="text-[10px] font-black text-white font-mono tracking-widest">8829103</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/[0.02] pb-3">
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Server / Broker</span>
                    <span className="text-[10px] font-black text-blue-400 font-mono tracking-widest drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">ICMarkets-SC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Latency Node</span>
                    <span className="text-[10px] font-black text-emerald-400 font-mono tracking-widest drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">12ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal Output Window */}
            <div className="lg:col-span-8">
              <div className="bg-[#020305] border border-white/[0.08] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[600px] relative">
                <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 blur-[100px] pointer-events-none" />
                
                <div className="bg-white/[0.02] border-b border-white/[0.05] px-6 py-4 flex justify-between items-center relative z-10 backdrop-blur-md">
                  <div className="flex items-center gap-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
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
                    logs.map((log, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="text-zinc-600 shrink-0 select-none">[{log.time}]</span>
                        <span className="text-blue-500 shrink-0 font-bold select-none">MT5-CORE:</span>
                        <span className="text-zinc-300 break-words">{log.msg}</span>
                      </div>
                    ))
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
