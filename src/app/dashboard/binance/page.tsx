'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import CryptoJS from 'crypto-js';

// Internal Components
import BotStatus from '@/components/BotStatus';
import TradeHistory from '@/components/TradeHistory';

// Pulls from your .env.local file
const MASTER_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

export default function BinanceDashboard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Settings & Credentials State
  const [dailyRisk, setDailyRisk] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);
    const [minRR, setMinRR] = useState(1.2);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isBotEnabled, setIsBotEnabled] = useState(true);
  
  // NEW: Environment State (Testnet vs Live)
  const [environment, setEnvironment] = useState<'testnet' | 'live'>('testnet');

  // Optimized log handler to prevent unnecessary re-renders
  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  }, []);

  const fetchBotData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data } = await supabase.from('binance_auth').select('*').eq('user_id', user.id).single();
      if (data) {
        setBotConfig(data);
        setDailyRisk(data.daily_risk_wallet || 1000);
        setRiskPercent(data.risk_percentage || 1.0);
        setMinRR(data.rr || 1.2);
        setIsBotEnabled(data.is_bot_enabled ?? true);
        setApiKey(data.api_key || '');
        // NEW: Load Environment from DB
        setEnvironment(data.environment || 'testnet');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!MASTER_ENCRYPTION_KEY) {
        console.error("❌ CRITICAL: NEXT_PUBLIC_ENCRYPTION_KEY is missing from .env.local");
        addLog("❌ SECURITY ERROR: Encryption key missing.");
    }
    fetchBotData();

    const channel = supabase
      .channel('guardian-sync')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'binance_auth' },
        (payload) => {
            setBotConfig(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [addLog]);

  // NEW: Dedicated listener for User's Private Bot Logs
  useEffect(() => {
    if (!userId) return;

    // Fetch historical logs on initial load so the terminal isn't empty
    const fetchRecentLogs = async () => {
      const { data } = await supabase
        .from('binance_bot_logs')
        .select('message, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
        
      if (data) {
        const history = data.map((log: any) => `[${new Date(log.created_at).toLocaleTimeString()}] ${log.message}`);
        setLogs(history);
      }
    };
    fetchRecentLogs();

    const logChannel = supabase
      .channel(`private-logs-${userId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'binance_bot_logs', filter: `user_id=eq.${userId}` }, 
        (payload) => {
          addLog(payload.new.message);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(logChannel); }
  }, [userId, addLog, supabase]);

  const saveAllSettings = async () => {
    if (!botConfig) return;
    
    if (!MASTER_ENCRYPTION_KEY) {
        addLog("❌ CANNOT SAVE: Encryption key not configured in .env.local");
        return;
    }

    addLog("🔒 Encrypting & Syncing Credentials...");
    
    let encryptedSecret = botConfig.api_secret; 
    if (apiSecret) {
        try {
            encryptedSecret = CryptoJS.AES.encrypt(apiSecret, MASTER_ENCRYPTION_KEY).toString();
        } catch (e) {
            return addLog("❌ Encryption Error: Check your environment variables.");
        }
    }

    const updates: any = { 
        daily_risk_wallet: dailyRisk, 
        risk_percentage: riskPercent,
        rr: minRR,
        is_bot_enabled: isBotEnabled,
        api_key: apiKey,
        api_secret: encryptedSecret,
        // NEW: Sync environment to DB
        environment: environment,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('binance_auth').update(updates).eq('id', botConfig.id);

    if (!error) {
        addLog(`✅ System Secured & Cloud Synced to ${environment.toUpperCase()}.`);
        setApiSecret(''); 
    } else {
        addLog(`❌ Sync Failed: ${error.message}`);
    }
  };

  if (loading) return (
    <div className="p-10 bg-[#05070a] min-h-screen flex items-center justify-center font-mono">
        <div className="text-yellow-500 animate-pulse uppercase tracking-widest">Initialising Guardian Terminal...</div>
    </div>
  );

  return (
    <div className="lg:ml-72 bg-[#05070a] min-h-screen text-gray-300 font-mono transition-all duration-300">
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-yellow-500/30 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/binance-logo.png" alt="Binance" className="w-8 h-8 object-contain" />
              <h1 className="text-xl md:text-2xl font-bold text-yellow-500 tracking-tighter italic">
                  Binance {environment === 'live' ? 'Live' : 'Testnet'} Terminal
              </h1>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold mt-2">Kimoo Pro Secure Engine v2.0</p>
          </div>
          
          <div className="w-full md:w-auto">
            {userId && <BotStatus userId={userId} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR: CONTROLS */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* AES VAULT */}
            <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl shadow-2xl backdrop-blur-sm">
              <h2 className="text-[11px] text-yellow-500 mb-5 uppercase font-black flex items-center gap-2">
                <span className="opacity-50 tracking-tighter">01</span> SECURE API VAULT
              </h2>
              <div className="space-y-5">
                {/* NEW: ENVIRONMENT TOGGLE */}
                <div className="pb-2">
                  <label className="text-[9px] text-zinc-600 uppercase font-black block mb-1.5 ml-1">Network Mode</label>
                  <div className="flex bg-[#05070a] rounded-lg p-1 border border-zinc-800">
                    <button 
                      onClick={() => setEnvironment('testnet')}
                      className={`flex-1 py-2 text-[9px] font-black rounded-md transition-all ${environment === 'testnet' ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}
                    >
                      TESTNET
                    </button>
                    <button 
                      onClick={() => setEnvironment('live')}
                      className={`flex-1 py-2 text-[9px] font-black rounded-md transition-all ${environment === 'live' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                      LIVE
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-zinc-600 uppercase font-black block mb-1.5 ml-1">Public API Key</label>
                  <input 
                    type="text" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    className="w-full bg-[#05070a] border border-zinc-800 p-3 rounded-lg text-[11px] focus:border-yellow-500/50 outline-none text-white transition-all" 
                    placeholder="Binance API Key..."
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-600 uppercase font-black block mb-1.5 ml-1">Secret Key (AES)</label>
                  <input 
                    type="password" 
                    value={apiSecret} 
                    onChange={(e) => setApiSecret(e.target.value)} 
                    className="w-full bg-[#05070a] border border-zinc-800 p-3 rounded-lg text-[11px] focus:border-yellow-500/50 outline-none text-white transition-all" 
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>

            {/* RISK PARAMETERS */}
            <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl shadow-2xl space-y-5 backdrop-blur-sm">
              <h2 className="text-[11px] text-yellow-500 uppercase font-black flex items-center gap-2">
                <span className="opacity-50 tracking-tighter">02</span> RISK STRATEGY
              </h2>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-[9px] text-zinc-600 uppercase font-black block mb-1.5 ml-1">Wallet ($)</label>
                      <input 
                        type="number" 
                        value={dailyRisk} 
                        onChange={(e) => setDailyRisk(Number(e.target.value))} 
                        className="w-full bg-[#05070a] border border-zinc-800 p-3 rounded-lg text-xs focus:border-yellow-500/50 outline-none"
                      />
                  </div>
                  <div>
                      <label className="text-[9px] text-zinc-600 uppercase font-black block mb-1.5 ml-1">Risk (%)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={riskPercent} 
                        onChange={(e) => setRiskPercent(Number(e.target.value))} 
                        className="w-full bg-[#05070a] border border-zinc-800 p-3 rounded-lg text-xs focus:border-yellow-500/50 outline-none"
                      />
                  </div>
                  <div className="col-span-2">
                      <label className="text-[9px] text-zinc-600 uppercase font-black block mb-1.5 ml-1">Min RR (Risk/Reward)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={minRR} 
                        onChange={(e) => setMinRR(Number(e.target.value))} 
                        className="w-full bg-[#05070a] border border-zinc-800 p-3 rounded-lg text-xs focus:border-yellow-500/50 outline-none"
                      />
                  </div>
              </div>
              
              <div className="py-2">
                  <label className="flex items-center gap-3 cursor-pointer group bg-[#05070a]/40 p-3 rounded-lg border border-zinc-800/50 hover:border-yellow-500/30 transition-all">
                      <input 
                        type="checkbox" 
                        checked={isBotEnabled} 
                        onChange={() => setIsBotEnabled(!isBotEnabled)} 
                        className="accent-yellow-500 w-4 h-4"
                      />
                      <span className="text-[10px] uppercase font-black text-zinc-400 group-hover:text-yellow-500 transition-colors">
                        Engine Execution Armed
                      </span>
                  </label>
              </div>

              <button 
                onClick={saveAllSettings} 
                className={`w-full ${environment === 'live' ? 'bg-red-700 hover:bg-red-600' : 'bg-yellow-600 hover:bg-yellow-500'} text-white font-black py-4 rounded-xl text-[11px] uppercase transition-all active:scale-95 shadow-lg`}
              >
                SAVE & SYNC {environment.toUpperCase()}
              </button>
            </div>
          </div>

          {/* MAIN TERMINAL AREA */}
          <div className="lg:col-span-3 space-y-8 order-1 lg:order-2">
            
            {/* LOG TERMINAL */}
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl h-[400px] flex flex-col shadow-2xl overflow-hidden backdrop-blur-md">
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#05070a]/40">
                <span className="text-[10px] font-black tracking-widest text-zinc-300 flex items-center gap-2 uppercase">
                  <span className={`h-2 w-2 rounded-full animate-pulse ${environment === 'live' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                  Live Execution Logs [{environment}]
                </span>
                <span className="hidden sm:block text-[9px] text-zinc-600 font-mono bg-zinc-800/50 px-2 py-1 rounded tracking-tighter">
                  UUID: {botConfig?.id?.slice(0,18)}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-2 font-mono scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {logs.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-zinc-700 text-[10px] uppercase tracking-[0.4em] animate-pulse">Waiting for Data Stream...</span>
                  </div>
                )}
                {logs.map((log, i) => (
                  <div key={i} className={`text-[11px] flex gap-4 p-1.5 rounded-md transition-colors ${log.includes('SIGNAL') ? 'bg-yellow-500/5 border-l-2 border-yellow-500' : 'hover:bg-zinc-800/30'}`}>
                    <span className="text-zinc-800 select-none min-w-[24px] text-right">{i}</span>
                    <span className={
                      log.includes('❌') ? 'text-red-500' : 
                      log.includes('🚀') ? 'text-yellow-400 font-bold' : 
                      log.includes('✅') ? 'text-green-400' : 
                      'text-zinc-500'
                    }>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TRADE HISTORY TABLE */}
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl min-h-[300px] shadow-2xl backdrop-blur-md overflow-hidden">
              <div className="p-4 border-b border-zinc-800 bg-[#05070a]/40">
                  <span className="text-[10px] font-black tracking-widest text-zinc-300 flex items-center gap-2 uppercase">
                    <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    Global Signal History (Crypto)
                  </span>
              </div>
              <div className="p-2 overflow-x-auto">
                  <TradeHistory category="CRYPTO" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
