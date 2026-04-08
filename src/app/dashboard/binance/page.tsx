'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import CryptoJS from 'crypto-js';
import { 
  Terminal, 
  Copy, 
  ShieldCheck, 
  Activity, 
  Lock, 
  Save, 
  Cpu, 
  Zap 
} from 'lucide-react';

// Internal Components
import BotStatus from '@/components/BotStatus';
import TradeHistory from '@/components/TradeHistory';

const MASTER_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

export default function BinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Settings State
  const [dailyRisk, setDailyRisk] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isBotEnabled, setIsBotEnabled] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  }, []);

  const fetchBotData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data } = await supabase.from('binance_auth').select('*').eq('user_id', user.id).single();
      if (data) {
        setBotConfig(data);
        setDailyRisk(data.daily_risk_wallet || 1000);
        setRiskPercent(data.risk_percentage || 1.0);
        setIsBotEnabled(data.is_bot_enabled ?? true);
        setApiKey(data.api_key || '');
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchBotData();

    const channel = supabase
      .channel('guardian-sync')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'signals' }, 
        (payload) => {
          addLog(`🚀 SIGNAL RECEIVED: ${payload.new.symbol} ${payload.new.side.toUpperCase()}`);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [fetchBotData, addLog, supabase]);

  const saveAllSettings = async () => {
    if (!botConfig || !MASTER_ENCRYPTION_KEY) return;
    addLog("🔒 SECURING CREDENTIALS...");
    
    let encryptedSecret = botConfig.api_secret; 
    if (apiSecret) {
      try {
        encryptedSecret = CryptoJS.AES.encrypt(apiSecret, MASTER_ENCRYPTION_KEY).toString();
      } catch (e) {
        return addLog("❌ ENCRYPTION ERROR");
      }
    }

    const { error } = await supabase.from('binance_auth').update({ 
      daily_risk_wallet: dailyRisk, 
      risk_percentage: riskPercent,
      is_bot_enabled: isBotEnabled,
      api_key: apiKey,
      api_secret: encryptedSecret,
      updated_at: new Date().toISOString()
    }).eq('id', botConfig.id);

    if (!error) {
      addLog("✅ CLOUD SYNC COMPLETE");
      setApiSecret(''); 
    } else {
      addLog(`❌ SYNC ERROR: ${error.message}`);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center font-mono text-yellow-500 tracking-[0.2em] animate-pulse">
        INITIALIZING TERMINAL...
    </div>
  );

  return (
    <div className="p-4 md:p-8 lg:ml-72 bg-[#05070a] min-h-screen text-zinc-400 font-mono">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Binance Guardian</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`h-1.5 w-1.5 rounded-full ${isBotEnabled ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">
              {isBotEnabled ? 'Execution Armed' : 'System Standby'}
            </p>
          </div>
        </div>
        {userId && <BotStatus userId={userId} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* API VAULT */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-[10px] text-yellow-500 mb-6 font-black uppercase flex items-center gap-2">
              <Lock size={12}/> Secure API Vault
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] text-zinc-600 uppercase font-black mb-2 block">Public Key</label>
                <input 
                  type="text" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  className="w-full bg-black border border-white/5 rounded-lg p-3 text-[10px] text-zinc-300 focus:border-yellow-500/50 outline-none transition-all"
                  placeholder="Binance API Key"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-600 uppercase font-black mb-2 block">Secret Key</label>
                <input 
                  type="password" 
                  value={apiSecret} 
                  onChange={(e) => setApiSecret(e.target.value)} 
                  className="w-full bg-black border border-white/5 rounded-lg p-3 text-[10px] text-zinc-300 focus:border-yellow-500/50 outline-none transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>

          {/* RISK STRATEGY */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
            <h2 className="text-[10px] text-yellow-500 font-black uppercase flex items-center gap-2">
              <ShieldCheck size={12}/> Risk Parameters
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-zinc-600 uppercase font-black mb-2 block">Daily ($)</label>
                <input 
                  type="number" 
                  value={dailyRisk} 
                  onChange={(e) => setDailyRisk(Number(e.target.value))} 
                  className="w-full bg-black border border-white/5 rounded-lg p-3 text-xs text-zinc-300 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-600 uppercase font-black mb-2 block">Risk %</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={riskPercent} 
                  onChange={(e) => setRiskPercent(Number(e.target.value))} 
                  className="w-full bg-black border border-white/5 rounded-lg p-3 text-xs text-zinc-300 outline-none"
                />
              </div>
            </div>

            <button 
              onClick={() => setIsBotEnabled(!isBotEnabled)}
              className={`w-full py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 transition-all ${isBotEnabled ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
            >
              <Zap size={12}/> {isBotEnabled ? 'ENGINE ARMED' : 'ENGINE DISARMED'}
            </button>

            <button 
              onClick={saveAllSettings} 
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save size={14}/> SYNC ALL SETTINGS
            </button>
          </div>
        </div>

        {/* MAIN CONSOLE AREA */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* LOGS */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl h-[450px] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Terminal size={14} className="text-yellow-500"/>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">System Console</span>
              </div>
              <div className="text-[8px] text-zinc-700">NODE_UUID: {botConfig?.id?.slice(0,13)}</div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-900">
              {logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-[10px] text-zinc-800 uppercase tracking-[0.3em]">
                  Listening for signals...
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 group">
                  <span className="text-zinc-800 text-[10px] min-w-[20px]">{i}</span>
                  <span className={`text-[11px] font-mono ${
                    log.includes('✅') ? 'text-green-400' : 
                    log.includes('🚀') ? 'text-yellow-400 font-bold' : 
                    log.includes('❌') ? 'text-red-500' : 'text-zinc-500'
                  }`}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* HISTORY */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={14} className="text-blue-500"/>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Global Signal Stream</span>
            </div>
            <TradeHistory />
          </div>

        </div>
      </div>
    </div>
  );
}
