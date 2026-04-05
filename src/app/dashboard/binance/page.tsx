'use client';

import React, { useState, useEffect } from 'react';

export default function BinanceDashboard() {
  const [status, setStatus] = useState('stopped');
  const [logs, setLogs] = useState<string[]>([]);
  const [userTier, setUserTier] = useState(3); // Mocking tier 3 check

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  const handleControl = async (action: 'start' | 'stop') => {
    addLog(`Requesting Binance ${action}...`);
    const res = await fetch('/api/terminal/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'binance', action }),
    });

    if (res.ok) {
      setStatus(action === 'start' ? 'running' : 'stopped');
      addLog(`Binance execution engine ${action === 'start' ? 'started' : 'halted'}.`);
    } else {
      addLog('Error: Failed to reach execution engine.');
    }
  };

  if (userTier < 3) return <div className="p-10 text-red-500">Tier 3 Access Required.</div>;

  return (
    <div className="p-6 bg-black min-h-screen text-gray-300 font-mono">
      <div className="flex justify-between items-center border-b border-yellow-500/30 pb-4 mb-6">
        <h1 className="text-xl font-bold text-yellow-500 underline">BINANCE LIVE TERMINAL</h1>
        <div className="flex items-center gap-4">
          <span className={`h-3 w-3 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          <span className="text-sm uppercase">{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
            <h2 className="text-xs text-zinc-500 mb-2 uppercase">Bot Control</h2>
            <button 
              onClick={() => handleControl('start')}
              disabled={status === 'running'}
              className="w-full mb-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded font-bold transition-all"
            >
              ACTIVATE SPOT/FUTURES
            </button>
            <button 
              onClick={() => handleControl('stop')}
              disabled={status === 'stopped'}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded font-bold transition-all"
            >
              EMERGENCY STOP
            </button>
          </div>
          
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
            <h2 className="text-xs text-zinc-500 mb-2 uppercase">Account Info</h2>
            <div className="text-sm">
              <div className="flex justify-between"><span>Pair:</span><span className="text-white">BTCUSDT</span></div>
              <div className="flex justify-between"><span>Mode:</span><span className="text-white">Hedge</span></div>
              <div className="flex justify-between"><span>Lev:</span><span className="text-white">20x</span></div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded h-[500px] flex flex-col">
            <div className="p-2 border-b border-zinc-800 text-xs text-zinc-500 flex justify-between">
              <span>LIVE EXECUTION LOGS</span>
              <span>CONNECTED TO CLOUD</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm">
              {logs.length === 0 && <div className="text-zinc-600">Waiting for data...</div>}
              {logs.map((log, i) => (
                <div key={i} className={log.includes('Error') ? 'text-red-400' : 'text-green-400'}>
                  <span className="text-zinc-600 mr-2">{'>'}</span>{log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}