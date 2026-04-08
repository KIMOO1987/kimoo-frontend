'use client';



import React, { useState, useEffect } from 'react';

import { createBrowserClient } from '@supabase/ssr';

import CryptoJS from 'crypto-js';



// Internal Components

import BotStatus from '@/components/BotStatus';

import TradeHistory from '@/components/TradeHistory';



// pulls from your .env.local file.

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

  const [apiKey, setApiKey] = useState('');

  const [apiSecret, setApiSecret] = useState('');

  const [isBotEnabled, setIsBotEnabled] = useState(true);



  const addLog = (msg: string) => {

    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));

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

        { event: 'INSERT', schema: 'public', table: 'signals' }, 

        (payload) => {

          addLog(`🚀 NEW SIGNAL: ${payload.new.symbol} ${payload.new.side} @ ${payload.new.entry_price}`);

        }

      )

      .on('postgres_changes',

        { event: 'UPDATE', schema: 'public', table: 'binance_auth' },

        (payload) => {

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

  };



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

        is_bot_enabled: isBotEnabled,

        api_key: apiKey,

        api_secret: encryptedSecret,

        updated_at: new Date().toISOString()

    };



    const { error } = await supabase.from('binance_auth').update(updates).eq('id', botConfig.id);



    if (!error) {

        addLog("✅ System Secured & Cloud Synced.");

        setApiSecret(''); 

    } else {

        addLog(`❌ Sync Failed: ${error.message}`);

    }

  };



  if (loading) return (

    <div className="p-10 bg-black min-h-screen flex items-center justify-center font-mono">

        <div className="text-yellow-500 animate-pulse uppercase tracking-widest">Initialising Guardian Terminal...</div>

    </div>

  );



  return (

    <div className="p-6 bg-black min-h-screen text-gray-300 font-mono">

      {/* HEADER SECTION */}

      <div className="flex justify-between items-center border-b border-yellow-500/30 pb-4 mb-6">

        <div>

          <h1 className="text-xl font-bold text-yellow-500 tracking-tighter">BINANCE LIVE TERMINAL</h1>

          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">KIMOO PRO SECURE ENGINE v2.0</p>

        </div>

        

        {/* Real-time Status Indicator Component */}

        {userId && <BotStatus userId={userId} />}

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        

        {/* SIDEBAR: CONTROLS */}

        <div className="space-y-6">

          {/* AES VAULT */}

          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded shadow-2xl">

            <h2 className="text-[10px] text-yellow-500 mb-4 uppercase font-bold flex items-center gap-2">

              <span className="opacity-50">01</span> SECURE API VAULT

            </h2>

            <div className="space-y-4">

              <div>

                <label className="text-[9px] text-zinc-500 uppercase block mb-1">Public API Key</label>

                <input 

                  type="text" 

                  value={apiKey} 

                  onChange={(e) => setApiKey(e.target.value)} 

                  className="w-full bg-black border border-zinc-800 p-2 text-[11px] focus:border-yellow-500/50 outline-none text-white transition-colors" 

                  placeholder="Binance API Key..."

                />

              </div>

              <div>

                <label className="text-[9px] text-zinc-500 uppercase block mb-1">Secret Key (AES Encrypted)</label>

                <input 

                  type="password" 

                  value={apiSecret} 

                  onChange={(e) => setApiSecret(e.target.value)} 

                  className="w-full bg-black border border-zinc-800 p-2 text-[11px] focus:border-yellow-500/50 outline-none text-white transition-colors" 

                  placeholder="••••••••••••"

                />

                <p className="text-[8px] text-zinc-600 mt-2 italic">* Encrypted via .env.local master key.</p>

              </div>

            </div>

          </div>



          {/* RISK PARAMETERS */}

          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded shadow-2xl space-y-4">

            <h2 className="text-[10px] text-yellow-500 uppercase font-bold flex items-center gap-2">

              <span className="opacity-50">02</span> RISK STRATEGY

            </h2>

            <div className="grid grid-cols-2 gap-3">

                <div>

                    <label className="text-[9px] text-zinc-500 uppercase block mb-1">Wallet ($)</label>

                    <input 

                      type="number" 

                      value={dailyRisk} 

                      onChange={(e) => setDailyRisk(Number(e.target.value))} 

                      className="w-full bg-black border border-zinc-800 p-2 text-xs focus:border-yellow-500/50 outline-none"

                    />

                </div>

                <div>

                    <label className="text-[9px] text-zinc-500 uppercase block mb-1">Risk (%)</label>

                    <input 

                      type="number" 

                      step="0.1" 

                      value={riskPercent} 

                      onChange={(e) => setRiskPercent(Number(e.target.value))} 

                      className="w-full bg-black border border-zinc-800 p-2 text-xs focus:border-yellow-500/50 outline-none"

                    />

                </div>

            </div>

            

            <div className="pt-2">

                <label className="flex items-center gap-3 cursor-pointer group">

                    <input 

                      type="checkbox" 

                      checked={isBotEnabled} 

                      onChange={() => setIsBotEnabled(!isBotEnabled)} 

                      className="accent-yellow-500 w-4 h-4"

                    />

                    <span className="text-[10px] uppercase font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">

                      Engine Execution Armed

                    </span>

                </label>

            </div>



            <button 

              onClick={saveAllSettings} 

              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-3 rounded text-[10px] uppercase transition-all active:scale-95 border-b-2 border-yellow-800"

            >

              SAVE & SYNC SYSTEM

            </button>

          </div>

        </div>



        {/* MAIN TERMINAL AREA */}

        <div className="lg:col-span-3 space-y-6">

          

          {/* TOP HALF: LOG TERMINAL */}

          <div className="bg-zinc-900/40 border border-zinc-800 rounded h-[350px] flex flex-col shadow-2xl overflow-hidden">

            <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-black/60">

              <span className="text-[10px] font-bold tracking-widest text-zinc-400 flex items-center gap-2">

                <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></span>

                LIVE EXECUTION LOGS

              </span>

              <span className="text-[9px] text-zinc-600 font-mono select-none">NODE_REF: {botConfig?.id?.slice(0,18)}</span>

            </div>

            

            <div className="flex-1 overflow-y-auto p-5 space-y-1 font-mono scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">

              {logs.length === 0 && (

                <div className="h-full flex items-center justify-center">

                  <span className="text-zinc-700 text-[10px] uppercase tracking-widest animate-pulse">Waiting for Data Stream...</span>

                </div>

              )}

              {logs.map((log, i) => (

                <div key={i} className={`text-[11px] flex gap-4 p-1 rounded ${log.includes('SIGNAL') ? 'bg-yellow-500/5' : ''}`}>

                  <span className="text-zinc-700 select-none min-w-[20px]">{i}</span>

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



          {/* BOTTOM HALF: TRADE HISTORY TABLE */}

          <div className="bg-zinc-900/40 border border-zinc-800 rounded min-h-[250px] shadow-2xl">

            <div className="p-3 border-b border-zinc-800 bg-black/60">

                <span className="text-[10px] font-bold tracking-widest text-zinc-400 flex items-center gap-2">

                  <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>

                  GLOBAL SIGNAL HISTORY (LAST 10)

                </span>

            </div>

            <div className="p-2">

                <TradeHistory />

            </div>

          </div>



        </div>

      </div>

    </div>

  );

}
