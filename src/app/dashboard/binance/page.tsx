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
  
  // Settings & Credentials State
  const [dailyRisk, setDailyRisk] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isBotEnabled, setIsBotEnabled] = useState(true);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  };

  useEffect(() => {
    fetchBotData();

    // REAL-TIME MONITORING: Listen for trade executions in the signals table
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'signals' }, 
        (payload) => {
          addLog(`🚀 NEW SIGNAL: ${payload.new.symbol} ${payload.new.side} @ ${payload.new.entry_price}`);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'binance_auth' },
        (payload) => {
            // Update local state if heartbeat or status changes from Python side
            setBotConfig(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, []);

  const fetchBotData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('binance_auth').select('*').eq('user_id', user.id).single();
      if (data) {
        setBotConfig(data);
        setDailyRisk(data.daily_risk_wallet || 1000);
        setRiskPercent(data.risk_percentage || 1.0);
        setIsBotEnabled(data.is_bot_enabled ?? true);
        setApiKey(data.api_key || '');
        // We don't fetch/show the full secret for security
      }
    }
    setLoading(false);
  };

  const saveAllSettings = async () => {
    if (!botConfig) return;
    addLog("🔒 Syncing Credentials & Risk Parameters...");
    
    const updates: any = { 
        daily_risk_wallet: dailyRisk, 
        risk_percentage: riskPercent,
        is_bot_enabled: isBotEnabled,
        api_key: apiKey
    };

    // Only update secret if user typed something new
    if (apiSecret) updates.api_secret = apiSecret;

    const { error } = await supabase.from('binance_auth').update(updates).eq('id', botConfig.id);

    if (!error) addLog("✅ System Updated Successfully.");
    else addLog(`❌ Update Failed: ${error.message}`);
  };

  // Logic to check if bot is "Live" based on heartbeat timestamp
  const isOnline = () => {
    if (!botConfig?.last_heartbeat) return false;
    const lastSeen = new Date(botConfig.last_heartbeat).getTime();
    const now = new Date().getTime();
    return (now - lastSeen) < 120000; // Online if seen in last 2 mins
  };

  if (loading) return <div className="p-10 bg-black min-h-screen text-yellow-500 font-mono">LOADING KIMOO TERMINAL...</div>;

  return (
    <div className="p-6 bg-black min-h-screen text-gray-300 font-mono">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-yellow-500/30 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-yellow-500">BINANCE LIVE TERMINAL</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">KIMOO PRO GUARDIAN v2.0</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className={`h-2 w-2 rounded-full ${isOnline() ? 'bg-green-500 animate-pulse' : 'bg-red-600'}`}></span>
            <span className={isOnline() ? 'text-green-400' : 'text-red-600'}>
                {isOnline() ? 'SYSTEM LIVE' : 'SYSTEM OFFLINE'}
            </span>
          </div>
          <p className="text-[9px] text-zinc-600">HB: {botConfig?.last_heartbeat ? new Date(botConfig.last_heartbeat).toLocaleTimeString() : 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT COLUMN: CONTROLS */}
        <div className="space-y-6">
          {/* BINANCE API VAULT */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
            <h2 className="text-xs text-yellow-500 mb-4 uppercase">API Credentials</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500">Binance API Key</label>
                <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full bg-black border border-zinc-800 p-2 text-xs focus:border-yellow-500 outline-none" placeholder="Paste Key..."/>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500">Binance Secret Key</label>
                <input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} className="w-full bg-black border border-zinc-800 p-2 text-xs focus:border-yellow-500 outline-none" placeholder="••••••••••••"/>
              </div>
            </div>
          </div>

          {/* RISK MANAGEMENT */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-4">
            <h2 className="text-xs text-yellow-500 uppercase">Risk Parameters</h2>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] text-zinc-500">Daily Risk ($)</label>
                    <input type="number" value={dailyRisk} onChange={(e) => setDailyRisk(Number(e.target.value))} className="w-full bg-black border border-zinc-800 p-2 text-sm"/>
                </div>
                <div>
                    <label className="text-[10px] text-zinc-500">Trade Risk (%)</label>
                    <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))} className="w-full bg-black border border-zinc-800 p-2 text-sm"/>
                </div>
            </div>
            
            <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isBotEnabled} onChange={() => setIsBotEnabled(!isBotEnabled)} className="accent-yellow-500"/>
                    <span className="text-xs uppercase">Enable Execution Engine</span>
                </label>
            </div>

            <button onClick={saveAllSettings} className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 rounded text-xs transition-all">
              SAVE & SYNC SYSTEM
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGS & MONITORING */}
        <div className="lg:col-span-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded h-[600px] flex flex-col">
            <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-black/40">
              <span className="text-xs font-bold">EXECUTION TERMINAL</span>
              <span className="text-[10px] text-zinc-600 tracking-tighter">SECURE_ID: {botConfig?.id}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono scrollbar-hide">
              {logs.map((log, i) => (
                <div key={i} className={`text-xs flex gap-3 ${log.includes('SIGNAL') ? 'bg-yellow-500/10 p-1 border-l-2 border-yellow-500' : ''}`}>
                  <span className="text-zinc-600 select-none">[{i}]</span>
                  <span className={log.includes('❌') ? 'text-red-500' : log.includes('🚀') ? 'text-yellow-400 font-bold' : 'text-zinc-400'}>
                    {log}
                  </span>
                </div>
              ))}
              <div className="animate-pulse text-zinc-800 text-xs">_</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
