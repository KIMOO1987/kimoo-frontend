'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import CryptoJS from 'crypto-js';
import { ShieldAlert, Terminal, Settings2, ShieldCheck, Activity, Wallet, Percent, Target, Lock, Save, ChevronDown } from 'lucide-react';
import ExecutionStats from '@/components/ExecutionStats';

// Internal Components
import BotStatus from '@/components/BotStatus';

// Pulls from your .env.local file
const MASTER_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

export default function KrakenDashboard() {
  // Wrap in useState to ensure the WebSocket instance survives React re-renders
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [loading, setLoading] = useState(true);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const cachedLogs = localStorage.getItem('kraken_terminal_logs');
      if (cachedLogs) return JSON.parse(cachedLogs);
    }
    return [];
  });
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Settings & Credentials State
  const [dailyRisk, setDailyRisk] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [minRR, setMinRR] = useState(1.2);
  const [maxConcurrent, setMaxConcurrent] = useState(3);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [passphrase, setPassphrase] = useState(''); // NEW: Unified Passphrase State
  const [isBotEnabled, setIsBotEnabled] = useState(true);
  


  // NEW: Symbol Filter
  const POPULAR_SYMBOLS = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 
    'TAOUSDT', 'ADAUSDT', 'DOGEUSDT','AVAXUSDT', 'DOTUSDT',
    'NEARUSDT','LTCUSDT', 'TRXUSDT', 'LINKUSDT', 'BCHUSDT',
    'ATOMUSDT', 'UNIUSDT','APTUSDT', 'INJUSDT', 'OPUSDT'
  ];
  const [allowedSymbols, setAllowedSymbols] = useState<string[]>(POPULAR_SYMBOLS);
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);

  // NEW: Environment State (Testnet vs Live)
  const [environment, setEnvironment] = useState<'testnet' | 'live'>('testnet');

  // Optimized log handler to prevent unnecessary re-renders
  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-100));
  }, []);

const fetchBotData = async (isSilentRefresh = false) => {
    // 1. INSTANT OPTIMISTIC UI: Unblock the screen immediately if cache exists
    if (!isSilentRefresh) {
      const cached = localStorage.getItem('kraken_data_cache'); // Change to 'kraken' or 'mexc' depending on the page
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUserTier(parsed.tier);
          setUserId(parsed.userId);
          if (parsed.data) {
            setBotConfig(parsed.data);
            setDailyRisk(parsed.data.daily_risk_wallet || 1000);
            setRiskPercent(parsed.data.risk_percentage || 1.0);
            setMinRR(parsed.data.rr || 1.2);
            setMaxConcurrent(parsed.data.max_concurrent_setups || 3);
            setIsBotEnabled(parsed.data.is_bot_enabled ?? true);
            setApiKey(parsed.data.api_key || '');
            setPassphrase(parsed.data.passphrase || '');
            setEnvironment(parsed.data.environment || 'testnet');
            setAllowedSymbols(parsed.data.allowed_symbols ?? POPULAR_SYMBOLS);
            

          }
          setLoading(false); // 🚀 Screen renders immediately here
        } catch (e) {}
      } else {
        setLoading(true);
      }
    }

    // 2. LIGHTNING AUTH: Read local JWT session instead of forcing a server ping
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      if (!isSilentRefresh) setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }
    const user = session.user;

    // 3. ONE SINGLE LIGHTNING FETCH VIA RPC
    const { data: dashboardData, error: rpcError } = await supabase.rpc('get_dashboard_data', {
      p_user_id: user.id,
      p_exchange_name: 'kraken'
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      setLoading(false);
      return;
    }

    // 4. DISTRIBUTE THE UNIFIED DATA
    if (!isSilentRefresh) {
      setUserTier(dashboardData.profile?.tier || 0);
      setUserId(user.id);
    }

    if (dashboardData.config && Object.keys(dashboardData.config).length > 0) {
      const config = dashboardData.config;
      setBotConfig(config);
      
      if (!isSilentRefresh) {
        setDailyRisk(config.daily_risk_wallet || 1000);
        setRiskPercent(config.risk_percentage || 1.0);
        setMinRR(config.rr || 1.2);
        setMaxConcurrent(config.max_concurrent_setups || 3);
        setIsBotEnabled(config.is_bot_enabled ?? true);
        setApiKey(config.api_key || '');
        setPassphrase(config.passphrase || '');
        setEnvironment(config.environment || 'testnet');
        setAllowedSymbols(config.allowed_symbols ?? POPULAR_SYMBOLS);
        

      }
      
      // Cache the config
      localStorage.setItem('kraken_data_cache', JSON.stringify({ userId: user.id, tier: dashboardData.profile?.tier || 0, data: config }));
    }

    // 5. HYDRATE THE TERMINAL LOGS INSTANTLY
    if (dashboardData.logs && dashboardData.logs.length > 0) {
      const formattedLogs = dashboardData.logs.map((log: any) => `[${new Date(log.created_at).toLocaleTimeString()}] ${log.message}`);
      
      setLogs((prev) => {
        // 🚨 THE FIX: Array.from(new Set(...)) instantly deletes any duplicate text strings!
        const uniqueLogs = Array.from(new Set([...formattedLogs.reverse(), ...prev]));
        const finalLogs = uniqueLogs.slice(-100); // Keep only the last 100
        
        localStorage.setItem('kraken_terminal_logs', JSON.stringify(finalLogs)); 
        return finalLogs;
      });
    }
    
    setLoading(false);
  };
  useEffect(() => {
    if (!MASTER_ENCRYPTION_KEY) {
        console.error("❌ CRITICAL: NEXT_PUBLIC_ENCRYPTION_KEY is missing from .env.local");
        addLog("❌ SECURITY ERROR: Encryption key missing.");
    }
    fetchBotData();

    const refreshInterval = setInterval(() => {
      fetchBotData(true);
    }, 30000);

    const channel = supabase
      .channel('kraken-auth-sync')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'exchange_auth', filter: 'exchange_name=eq.kraken' },
        (payload) => {
            setBotConfig(payload.new);
        }
      )
      .subscribe();

    return () => { 
      clearInterval(refreshInterval);
      supabase.removeChannel(channel); 
    }
  }, [addLog, supabase]);

  useEffect(() => {
    if (!userId) return;

    // 🚨 Notice there is no "fetchRecentLogs" function here anymore, because the RPC does it!

    const logChannel = supabase.channel(`kraken-logs-stream-${userId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'kraken_bot_logs', filter: `user_id=eq.${userId}` }, 
        (payload) => {
          if (payload.new.message) {
            setLogs(prev => {
              const newLog = `[${new Date().toLocaleTimeString()}] ${payload.new.message}`;
              // Use Set here too just in case!
              const newLogs = Array.from(new Set([...prev, newLog])).slice(-100);
              localStorage.setItem('kraken_terminal_logs', JSON.stringify(newLogs));
              return newLogs;
            });
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(logChannel); }
  }, [userId, supabase]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTo({
        top: terminalRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs]);

  const saveAllSettings = async () => {
    if (!botConfig) return;
    
    if (!MASTER_ENCRYPTION_KEY) {
        addLog("❌ CANNOT SAVE: Encryption key not configured in .env.local");
        return;
    }

    addLog("🔒 Encrypting & Syncing Kraken Credentials...");
    
    let encryptedSecret = botConfig.api_secret; 
    if (apiSecret) {
        try {
            encryptedSecret = CryptoJS.AES.encrypt(apiSecret, MASTER_ENCRYPTION_KEY).toString();
        } catch (e) {
            return addLog("❌ Encryption Error: Check your environment variables.");
        }
    }

    // NEW: Encrypt Passphrase for unified storage
    let encryptedPass = botConfig.passphrase;
    if (passphrase) {
        try {
            encryptedPass = CryptoJS.AES.encrypt(passphrase, MASTER_ENCRYPTION_KEY).toString();
        } catch (e) {}
    }

    const updates: any = { 
        daily_risk_wallet: dailyRisk, 
        risk_percentage: riskPercent,
        rr: minRR,
        max_concurrent_setups: maxConcurrent,
        is_bot_enabled: isBotEnabled,
        api_key: apiKey,
        api_secret: encryptedSecret,
        passphrase: encryptedPass, // SAVE ENCRYPTED PASSPHRASE
        environment: environment,
        allowed_symbols: allowedSymbols,

        updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('exchange_auth').update(updates).eq('id', botConfig.id);

    if (!error) {
        addLog(`✅ Kraken System Secured & Cloud Synced to ${environment.toUpperCase()}.`);
        setApiSecret(''); 
        setPassphrase(''); // Clear plaintext
    } else {
        addLog(`❌ Sync Failed: ${error.message}`);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Activity size={40} className="text-purple-500 mb-4 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-600">Initializing Kraken Terminal...</p>
      </div>
    </div>
  );

  if (error || (userTier !== null && userTier < 2)) {
    return (
      <div className="min-h-screen  flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter">Access Denied</h2>
        <p className="text-zinc-600 dark:text-zinc-500 text-sm mt-2 max-w-xs">{error || "This feature requires a PRO (Tier 2) subscription."}</p>
      </div>
    );
  }

  return (
    <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72  min-h-screen text-zinc-900 dark:text-white font-sans overflow-x-hidden transition-all duration-300">
      
      {/* Ambient Glowing Backgrounds - Kraken Purple */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-[1700px] mx-auto relative z-10 space-y-6 md:space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-zinc-900 dark:text-white">
              <img src="/kraken.png" alt="Kraken" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-[0_0_15px_rgba(147,51,234,0.5)]" />
              Kraken<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Terminal</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 dark:text-zinc-500 font-bold mt-3 leading-none">
              • KRAKEN {environment === 'live' ? 'LIVE' : 'SANDBOX'} EXECUTION ENGINE •
            </p>
          </div>
          
          <div className="flex items-center gap-3 px-5 py-2.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl backdrop-blur-md shadow-xl">
            {userId && <BotStatus userId={userId} exchangeName="kraken" cachedIsBotEnabled={isBotEnabled} />}
          </div>
        </div>

        {/* ============================================================ */}
        {/* AUTHENTIC REAL-TIME STATS BAR */}
        {/* ============================================================ */}
        {userId && <ExecutionStats userId={userId} exchange="kraken" />}
        {/* ============================================================ */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* SIDEBAR: CONTROLS */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8 order-2 lg:order-1">
            {/* AES VAULT */}
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-[var(--glass-border)] p-6 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
              <h2 className="text-[11px] font-black text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                <ShieldCheck size={16} /> Secure API Vault
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2 mb-2"><Activity size={10}/> Network Mode</label>
                  <div className="flex bg-[var(--glass-bg)] rounded-xl p-1.5 border border-[var(--glass-border)]">
                    <button 
                      onClick={() => setEnvironment('testnet')}
                      className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${environment === 'testnet' ? 'bg-purple-500 text-zinc-900 dark:text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:text-white'}`}
                    >
                      SANDBOX
                    </button>
                    <button 
                      onClick={() => setEnvironment('live')}
                      className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${environment === 'live' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                    >
                      LIVE
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2"><Settings2 size={10}/> Public API Key</label>
                  <input 
                    type="text" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3.5 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-purple-500/50 hover:border-white/20 transition-all"
                    placeholder="Kraken API Key..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2"><Lock size={10}/> Private Key (AES)</label>
                  <input 
                    type="password" 
                    value={apiSecret} 
                    onChange={(e) => setApiSecret(e.target.value)} 
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3.5 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-purple-500/50 hover:border-white/20 transition-all"
                    placeholder="••••••••••••"
                  />
                </div>

                {/* PASSPHRASE (Conditional display for parity) */}
                {botConfig?.exchange_name === 'kraken' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2"><Lock size={10}/> API Passphrase</label>
                    <input 
                      type="password" 
                      value={passphrase} 
                      onChange={(e) => setPassphrase(e.target.value)} 
                      className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3.5 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-[var(--glass-border)]0" 
                      placeholder="Passphrase..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* RISK PARAMETERS */}
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-[var(--glass-border)] p-6 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md space-y-6">
              <h2 className="text-[11px] font-black text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                <Target size={16} /> Risk Strategy
              </h2>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-1.5"><Wallet size={10}/> Wallet ($)</label>
                      <input 
                        type="number" 
                        value={dailyRisk} 
                        onChange={(e) => setDailyRisk(Number(e.target.value))} 
                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-purple-500/50 hover:border-white/20 transition-all"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-1.5"><Percent size={10}/> Risk (%)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={riskPercent} 
                        onChange={(e) => setRiskPercent(Number(e.target.value))} 
                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-purple-500/50 hover:border-white/20 transition-all"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2"><Activity size={10}/> Max Concurrent</label>
                      <input 
                        type="number" 
                        min="1"
                        max="20"
                        value={maxConcurrent} 
                        onChange={(e) => setMaxConcurrent(Number(e.target.value))} 
                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-purple-500/50 hover:border-white/20 transition-all"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2"><Target size={10}/> Min RR</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={minRR} 
                        onChange={(e) => setMinRR(Number(e.target.value))} 
                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-purple-500/50 hover:border-white/20 transition-all"
                      />
                  </div>
              </div>
              
              <div className="py-2">
                  <label className="flex items-center gap-3 cursor-pointer group bg-[var(--glass-bg)] p-4 rounded-xl border border-[var(--glass-border)] hover:border-purple-500/30 hover:bg-[var(--glass-bg)] transition-all">
                      <input 
                        type="checkbox" 
                        checked={isBotEnabled} 
                        onChange={() => setIsBotEnabled(!isBotEnabled)} 
                        className="accent-purple-500 w-5 h-5 cursor-pointer"
                      />
                      <span className="text-[11px] uppercase font-black tracking-widest text-zinc-700 dark:text-zinc-400 group-hover:text-purple-400 transition-colors">
                        Engine Execution Armed
                      </span>
                  </label>
              </div>



              {/* ALLOWED SYMBOLS */}
              <div className="relative">
                <h3 className="text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2 mb-3">
                  <Activity size={10} /> Allowed Symbols Filter
                </h3>
                <div 
                  className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3.5 text-xs font-mono text-zinc-900 dark:text-white flex justify-between items-center cursor-pointer hover:border-white/20 transition-all"
                  onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
                >
                  <span className="font-black tracking-widest uppercase text-[10px]">
                    {allowedSymbols.length === POPULAR_SYMBOLS.length ? 'ALL SYMBOLS SELECTED' : `${allowedSymbols.length} SYMBOLS SELECTED`}
                  </span>
                  <ChevronDown size={14} className={`transition-transform ${isSymbolDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isSymbolDropdownOpen && (
                  <div className="absolute z-50 top-[100%] left-0 w-full mt-2 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl shadow-2xl p-3 max-h-[250px] overflow-y-auto flex flex-col gap-1">
                    <div className="flex gap-2 mb-2 pb-2 border-b border-[var(--glass-border)]">
                      <button onClick={() => setAllowedSymbols(POPULAR_SYMBOLS)} className="text-[9px] bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded text-zinc-900 dark:text-white font-bold tracking-widest transition-all">ALL</button>
                      <button onClick={() => setAllowedSymbols([])} className="text-[9px] bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded text-zinc-900 dark:text-white font-bold tracking-widest transition-all">NONE</button>
                    </div>
                    {POPULAR_SYMBOLS.map(sym => (
                      <label key={sym} className="flex items-center gap-3 cursor-pointer group hover:bg-[var(--glass-bg)] p-2 rounded-lg transition-all border border-transparent hover:border-[var(--glass-border)]">
                        <input 
                          type="checkbox" 
                          checked={allowedSymbols.includes(sym)}
                          onChange={() => {
                            setAllowedSymbols(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
                          }}
                          className="accent-purple-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-800 dark:text-zinc-300 group-hover:text-purple-400">{sym}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={saveAllSettings} 
                className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 border border-[var(--glass-border)] ${
                  environment === 'live' 
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-zinc-900 dark:text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-500 text-zinc-900 dark:text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:shadow-[0_0_40px_rgba(147,51,234,0.5)]'
                }`}
              >
                <Save size={16} /> SAVE & SYNC KRAKEN {environment.toUpperCase()}
              </button>
            </div>
          </div>

          {/* MAIN TERMINAL AREA */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8 order-1 lg:order-2">
            
            {/* LOG TERMINAL */}
            <div className="bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-220px)] min-h-[500px] relative">
              <div className="absolute top-0 left-0 w-full h-full bg-purple-500/5 blur-[100px] pointer-events-none" />
              
              <div className="bg-[var(--glass-bg)] border-b border-[var(--glass-border)] px-6 py-4 flex justify-between items-center relative z-10 backdrop-blur-md">
                <div className="flex items-center gap-3 text-[10px] font-black text-zinc-700 dark:text-zinc-400 uppercase tracking-widest">
                  <Terminal size={14} className={environment === 'live' ? 'text-red-400' : 'text-purple-400'} /> KRAKEN_CLOUD_STREAM [{environment}]
                </div>
                <span className="hidden sm:block text-[9px] text-zinc-600 dark:text-zinc-500 font-mono bg-white/[0.05] border border-[var(--glass-border)] px-2.5 py-1 rounded-md tracking-widest">
                  UUID: {botConfig?.id?.slice(0,18)}
                </span>
              </div>
              
              <div ref={terminalRef} className="p-6 md:p-8 overflow-y-auto flex-1 font-mono text-[11px] md:text-[13px] leading-relaxed space-y-3 relative z-10 scroll-smooth">
                {logs.length === 0 && (
                  <div className="flex items-center justify-center h-full flex-col text-zinc-600 gap-4 opacity-50">
                    <Activity size={32} className="animate-pulse" />
                    <span className="uppercase tracking-widest font-black text-[10px]">Awaiting Kraken Data...</span>
                  </div>
                )}
                {logs.map((log, i) => {
                  const firstBracket = log.indexOf(']');
                  const timeStr = log.substring(0, firstBracket + 1);
                  const msgStr = log.substring(firstBracket + 2);
                  return (
                    <div key={i} className={`flex gap-4 ${log.includes('SIGNAL') ? 'bg-purple-500/5 border-l-2 border-purple-500 pl-3 py-1' : ''}`}>
                      <span className="text-zinc-600 shrink-0 select-none">{timeStr}</span>
                      <span className={`shrink-0 font-bold select-none ${environment === 'live' ? 'text-red-400' : 'text-purple-500'}`}>ENGINE:</span>
                      <span className={`break-words ${
                        log.includes('❌') ? 'text-red-400' : 
                        log.includes('🚀') ? 'text-purple-300 font-bold' : 
                        log.includes('✅') ? 'text-emerald-400' : 
                        'text-zinc-800 dark:text-zinc-300'
                      }`}>
                        {msgStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
