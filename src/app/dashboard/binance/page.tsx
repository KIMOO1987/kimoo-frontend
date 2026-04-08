'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr'

export default function BinanceDashboard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Risk & Control Settings State
  const [dailyRisk, setDailyRisk] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [isBotEnabled, setIsBotEnabled] = useState(true);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  useEffect(() => {
    fetchBotData();
  }, []);

  const fetchBotData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('binance_auth')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setBotConfig(data);
        setDailyRisk(data.daily_risk_wallet || 1000);
        setRiskPercent(data.risk_percentage || 1.0);
        setIsBotEnabled(data.is_bot_enabled ?? true);
      }
    }
    setLoading(false);
  };

  const handleInitialize = async () => {
    addLog("Connecting to Secure Setup Route...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return addLog("Error: Session expired. Please re-login.");
  
    try {
      const response = await fetch('/api/binance/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        setBotConfig(result);
        addLog("✅ Success: Binance Row Created.");
        fetchBotData(); // Refresh UI
      } else {
        addLog(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      addLog("❌ Critical: Failed to reach backend.");
    }
  };

  const saveSettings = async () => {
    if (!botConfig) return;
    addLog("Updating Cloud Risk Parameters...");
    
    const { error } = await supabase
      .from('binance_auth')
      .update({ 
        daily_risk_wallet: dailyRisk, 
        risk_percentage: riskPercent,
        is_bot_enabled: isBotEnabled
      })
      .eq('id', botConfig.id);

    if (!error) {
      addLog("🚀 Settings Synced to Guardian Bot.");
      // Briefly show success in the UI
      setBotConfig({...botConfig, is_bot_enabled: isBotEnabled});
    } else {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const toggleBot = () => {
    const newState = !isBotEnabled;
    setIsBotEnabled(newState);
    addLog(newState ? "Bot Armed: Ready for signals." : "Bot Disarmed: Trade execution paused.");
  };

  if (loading) return (
    <div className="p-10 bg-black min-h-screen flex items-center justify-center">
      <div className="text-yellow-500 animate-pulse font-mono">INITIALIZING KIMOO TERMINAL...</div>
    </div>
  );

  return (
    <div className="p-6 bg-black min-h-screen text-gray-300 font-mono">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-yellow-500/30 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-yellow-500">BINANCE LIVE TERMINAL</h1>
          <p className="text-[10px] text-zinc-500 tracking-widest">KIMOO PRO GUARDIAN SYSTEM v2.0</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500">ENGINE STATUS</span>
            <div className="flex items-center gap-2">
               <span className={`h-2 w-2 rounded-full ${botConfig?.is_bot_enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
               <span className={`text-sm ${botConfig?.is_bot_enabled ? 'text-green-400' : 'text-red-400'}`}>
                 {botConfig?.is_bot_enabled ? 'ACTIVE' : 'PAUSED'}
               </span>
            </div>
          </div>
        </div>
      </div>

      {!botConfig ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-zinc-700 rounded-lg">
          <p className="mb-4 text-zinc-500">No Binance Bot linked to this account.</p>
          <button 
            onClick={handleInitialize}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded transition-all"
          >
            GENERATE ACCESS TOKEN
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-4">
            
            {/* MASTER SWITCH */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
              <h2 className="text-xs text-zinc-500 mb-3 uppercase">Master Control</h2>
              <button 
                onClick={toggleBot}
                className={`w-full py-3 rounded font-bold text-xs transition-all border ${
                  isBotEnabled 
                  ? 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20' 
                  : 'bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-500/20'
                }`}
              >
                {isBotEnabled ? "DISARM BOT (KILL SWITCH)" : "ARM BOT (READY)"}
              </button>
            </div>

            {/* TOKEN SECTION */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
              <h2 className="text-xs text-zinc-500 mb-2 uppercase">Your Bot Token</h2>
              <div className="bg-black p-2 rounded text-[10px] break-all text-yellow-400 border border-yellow-500/20">
                {botConfig.bot_token}
              </div>
              <p className="text-[9px] mt-2 text-zinc-600">* Ensure this token matches your .env in Python.</p>
            </div>

            {/* RISK CONTROL */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-4">
              <h2 className="text-xs text-zinc-500 uppercase">Risk Management</h2>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Daily Risk Wallet ($)</label>
                <input 
                    type="number" 
                    value={dailyRisk} 
                    onChange={(e) => setDailyRisk(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-700 p-2 text-white text-sm focus:border-yellow-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Risk per Trade (%)</label>
                <input 
                    type="number" 
                    step="0.1" 
                    value={riskPercent} 
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-700 p-2 text-white text-sm focus:border-yellow-500 outline-none"
                />
              </div>
              <button 
                onClick={saveSettings}
                className="w-full text-xs bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded font-bold transition-all"
              >
                SAVE & SYNC SETTINGS
              </button>
            </div>
          </div>

          {/* LOGS SECTION */}
          <div className="md:col-span-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded h-[500px] flex flex-col">
              <div className="p-2 border-b border-zinc-800 text-xs text-zinc-500 flex justify-between bg-black/20">
                <span>SYSTEM LOGS (REAL-TIME)</span>
                <span className="text-[10px]">SESSION: {botConfig.id.slice(0,13)}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1 text-[13px] font-mono scrollbar-thin scrollbar-thumb-zinc-700">
                {logs.length === 0 && <div className="text-zinc-600">Initializing stream...</div>}
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2 border-b border-white/5 pb-1">
                    <span className="text-zinc-600">▸</span>
                    <span className={
                      log.includes('Success') || log.includes('Synced') || log.includes('Armed') 
                      ? 'text-green-400' 
                      : log.includes('Error') || log.includes('Disarmed') 
                      ? 'text-red-400' 
                      : 'text-zinc-400'
                    }>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
