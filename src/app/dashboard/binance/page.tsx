'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function BinanceDashboard() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Risk Settings State
  const [dailyRisk, setDailyRisk] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);

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
        setDailyRisk(data.daily_risk_wallet);
        setRiskPercent(data.risk_percentage);
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
      } else {
        addLog(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      addLog("❌ Critical: Failed to reach backend.");
    }
  };

  const saveSettings = async () => {
    addLog("Updating Risk Parameters...");
    const { error } = await supabase
      .from('binance_auth')
      .update({ 
        daily_risk_wallet: dailyRisk, 
        risk_percentage: riskPercent 
      })
      .eq('id', botConfig.id);

    if (!error) addLog("Settings saved to Cloud.");
    else addLog("Error updating settings.");
  };

  if (loading) return <div className="p-10 text-yellow-500">Loading KIMOO Terminal...</div>;

  return (
    <div className="p-6 bg-black min-h-screen text-gray-300 font-mono">
      <div className="flex justify-between items-center border-b border-yellow-500/30 pb-4 mb-6">
        <h1 className="text-xl font-bold text-yellow-500 underline">BINANCE LIVE TERMINAL</h1>
        <div className="flex items-center gap-4">
          <span className={`h-3 w-3 rounded-full ${botConfig?.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          <span className="text-sm uppercase">{botConfig?.status || 'OFFLINE'}</span>
        </div>
      </div>

      {!botConfig ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-zinc-700 rounded-lg">
          <p className="mb-4 text-zinc-500">No Binance Bot linked to this account.</p>
          <button 
            onClick={handleInitialize}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded"
          >
            GENERATE ACCESS TOKEN
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-4">
            {/* TOKEN SECTION */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
              <h2 className="text-xs text-zinc-500 mb-2 uppercase">Your Bot Token</h2>
              <div className="bg-black p-2 rounded text-[10px] break-all text-yellow-400 border border-yellow-500/20">
                {botConfig.bot_token}
              </div>
              <p className="text-[9px] mt-2 text-zinc-600">* Use this in your Python App to connect.</p>
            </div>

            {/* RISK CONTROL */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-3">
              <h2 className="text-xs text-zinc-500 uppercase">Risk Management</h2>
              <div>
                <label className="text-[10px] text-zinc-400">Daily Risk ($)</label>
                <input 
                    type="number" 
                    value={dailyRisk} 
                    onChange={(e) => setDailyRisk(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-700 p-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400">Risk per Trade (%)</label>
                <input 
                    type="number" 
                    step="0.1" 
                    value={riskPercent} 
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-700 p-1 text-white text-sm"
                />
              </div>
              <button 
                onClick={saveSettings}
                className="w-full text-xs bg-zinc-800 hover:bg-zinc-700 py-2 rounded transition-all"
              >
                SAVE PARAMETERS
              </button>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded h-[500px] flex flex-col">
              <div className="p-2 border-b border-zinc-800 text-xs text-zinc-500 flex justify-between">
                <span>LIVE EXECUTION LOGS</span>
                <span>UUID: {botConfig.id.slice(0,8)}...</span>
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
      )}
    </div>
  );
}
