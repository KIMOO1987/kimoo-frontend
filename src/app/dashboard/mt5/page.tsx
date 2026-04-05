'use client';

import React, { useState, useEffect } from 'react';

export default function MT5Dashboard() {
  const [status, setStatus] = useState('stopped');
  const [logs, setLogs] = useState<string[]>([]);
  const [userTier, setUserTier] = useState(3);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
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

  if (userTier < 3) return <div className="p-10 text-red-500 text-center">Tier 3 Required.</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-mono">
      <div className="flex justify-between items-center border-b border-blue-500/30 pb-4 mb-6">
        <h1 className="text-xl font-bold text-blue-400">METATRADER 5 TERMINAL</h1>
        <div className="flex items-center gap-4 bg-slate-900 px-3 py-1 rounded border border-slate-800">
          <span className="text-xs text-slate-500 uppercase">VPS Status:</span>
          <span className="text-xs text-green-400">ONLINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded">
            <h2 className="text-xs text-slate-500 mb-4 uppercase">Terminal Control</h2>
            <button 
              onClick={() => handleControl('start')}
              className={`w-full py-3 mb-3 rounded font-bold transition-all ${status === 'running' ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              disabled={status === 'running'}
            >
              CONNECT MT5
            </button>
            <button 
              onClick={() => handleControl('stop')}
              className={`w-full py-3 rounded font-bold transition-all ${status === 'stopped' ? 'bg-slate-800 text-slate-500' : 'bg-red-600 hover:bg-red-500 text-white'}`}
              disabled={status === 'stopped'}
            >
              DISCONNECT
            </button>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded text-xs">
            <h2 className="text-slate-500 mb-2 uppercase">Server Config</h2>
            <p>Login: <span className="text-slate-100">8829103</span></p>
            <p>Server: <span className="text-slate-100">ICMarkets-SC</span></p>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-black border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold">MT5_EXECUTION_STREAM</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="p-4 h-[450px] overflow-y-auto text-sm leading-relaxed">
              {logs.map((log, i) => (
                <div key={i} className="mb-1 border-l-2 border-blue-900 pl-3">
                  <span className="text-blue-500/50 mr-2">MT5-CORE:</span>
                  <span className="text-slate-300">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}