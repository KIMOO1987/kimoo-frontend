'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import CryptoJS from 'crypto-js';
import { ShieldAlert, Terminal, Settings2, ShieldCheck, Activity, Wallet, Percent, Target, Lock, Save, ChevronDown } from 'lucide-react';

// Internal Components
import BotStatus from '@/components/BotStatus';

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
  const [userTier, setUserTier] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Settings & Credentials State
  const [dailyRisk, setDailyRisk] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);
    const [minRR, setMinRR] = useState(1.2);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isBotEnabled, setIsBotEnabled] = useState(true);
  
  // NEW: Grade Filters (Dropdown style)
  const AVAILABLE_GRADES = ['A++', 'A+', 'GOOD', 'NORMAL'];
  const [allowedGrades, setAllowedGrades] = useState<string[]>(['A++', 'A+', 'GOOD']);
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);

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

  const fetchBotData = async () => {
    // Optimistic Cache Load (Stale-While-Revalidate) to skip loading screen
    const cached = localStorage.getItem('binance_data_cache');
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
          setIsBotEnabled(parsed.data.is_bot_enabled ?? true);
          setApiKey(parsed.data.api_key || '');
          setEnvironment(parsed.data.environment || 'testnet');
          setAllowedSymbols(parsed.data.allowed_symbols ?? POPULAR_SYMBOLS);
          const parsedGrades = [];
          if (parsed.data.allow_aplusplus ?? true) parsedGrades.push('A++');
          if (parsed.data.allow_aplus ?? true) parsedGrades.push('A+');
          if (parsed.data.allow_good ?? true) parsedGrades.push('GOOD');
          if (parsed.data.allow_normal ?? false) parsedGrades.push('NORMAL');
          setAllowedGrades(parsedGrades);
        }
        setLoading(false); // Instantly hide initialization screen
      } catch (e) {}
    } else {
      setLoading(true);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    // Fetch User Tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();
    
    setUserTier(profile?.tier || 0);
    setUserId(user.id);
    
    const { data } = await supabase.from('binance_auth').select('*').eq('user_id', user.id).single();
    if (data) {
      setBotConfig(data);
      setDailyRisk(data.daily_risk_wallet || 1000);
      setRiskPercent(data.risk_percentage || 1.0);
      setMinRR(data.rr || 1.2);
      setIsBotEnabled(data.is_bot_enabled ?? true);
      setApiKey(data.api_key || '');
      setEnvironment(data.environment || 'testnet');
      setAllowedSymbols(data.allowed_symbols ?? POPULAR_SYMBOLS);
      const dbGrades = [];
      if (data.allow_aplusplus ?? true) dbGrades.push('A++');
      if (data.allow_aplus ?? true) dbGrades.push('A+');
      if (data.allow_good ?? true) dbGrades.push('GOOD');
      if (data.allow_normal ?? false) dbGrades.push('NORMAL');
      setAllowedGrades(dbGrades);
      
      sessionStorage.setItem('binance_data_cache', JSON.stringify({ userId: user.id, tier: profile?.tier || 0, data }));
    } else {
      sessionStorage.setItem('binance_data_cache', JSON.stringify({ userId: user.id, tier: profile?.tier || 0, data: null }));
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
        setLogs(history.reverse()); // Reverse to make chronological (oldest to newest)
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

  // Auto-refresh the page and clear caches every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      // Clear standard browser caches
      if ('caches' in window) {
        try {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(key => caches.delete(key)));
        } catch (e) {
          console.error("Failed to clear browser caches:", e);
        }
      }
      // Clear optimistic local storage cache
      localStorage.removeItem('binance_data_cache');
      sessionStorage.removeItem('binance_data_cache');
      
      window.location.reload();
    }, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

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
        allowed_symbols: allowedSymbols,
        allow_aplusplus: allowedGrades.includes('A++'),
        allow_aplus: allowedGrades.includes('A+'),
        allow_good: allowedGrades.includes('GOOD'),
        allow_normal: allowedGrades.includes('NORMAL'),
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
    <div className="min-h-screen flex items-center justify-center bg-[#030407]">
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Activity size={40} className="text-yellow-500 mb-4 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-600">Initializing Guardian Terminal...</p>
      </div>
    </div>
  );

  if (error || (userTier !== null && userTier < 3)) {
    return (
      <div className="min-h-screen bg-[#030407] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Access Denied</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-xs">{error || "This feature requires a Lifetime Pro (Tier 3) subscription."}</p>
      </div>
    );
  }

  return (
    <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden transition-all duration-300">
      
      {/* Ambient Glowing Backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-yellow-500/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-[1700px] mx-auto relative z-10 space-y-6 md:space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
              <img src="/binance-logo.png" alt="Binance" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
              Binance<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Terminal</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
              • Binance {environment === 'live' ? 'LIVE' : 'TESTNET'} EXECUTION ENGINE •
            </p>
          </div>
          
          <div className="flex items-center gap-3 px-5 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl backdrop-blur-md shadow-xl">
            {userId && <BotStatus userId={userId} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* SIDEBAR: CONTROLS */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8 order-2 lg:order-1">
            {/* AES VAULT */}
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
              <h2 className="text-[11px] font-black text-yellow-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                <ShieldCheck size={16} /> Secure API Vault
              </h2>
              <div className="space-y-6">
                {/* NEW: ENVIRONMENT TOGGLE */}
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2 mb-2"><Activity size={10}/> Network Mode</label>
                  <div className="flex bg-white/[0.02] rounded-xl p-1.5 border border-white/[0.08]">
                    <button 
                      onClick={() => setEnvironment('testnet')}
                      className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${environment === 'testnet' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                    >
                      TESTNET
                    </button>
                    <button 
                      onClick={() => setEnvironment('live')}
                      className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${environment === 'live' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                    >
                      LIVE
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2"><Settings2 size={10}/> Public API Key</label>
                  <input 
                    type="text" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3.5 text-xs font-mono text-white outline-none focus:border-yellow-500/50 hover:border-white/20 transition-all"
                    placeholder="Binance API Key..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2"><Lock size={10}/> Secret Key (AES)</label>
                  <input 
                    type="password" 
                    value={apiSecret} 
                    onChange={(e) => setApiSecret(e.target.value)} 
                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3.5 text-xs font-mono text-white outline-none focus:border-yellow-500/50 hover:border-white/20 transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>

            {/* RISK PARAMETERS */}
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md space-y-6">
              <h2 className="text-[11px] font-black text-yellow-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                <Target size={16} /> Risk Strategy
              </h2>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-1.5"><Wallet size={10}/> Wallet ($)</label>
                      <input 
                        type="number" 
                        value={dailyRisk} 
                        onChange={(e) => setDailyRisk(Number(e.target.value))} 
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-yellow-500/50 hover:border-white/20 transition-all"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-1.5"><Percent size={10}/> Risk (%)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={riskPercent} 
                        onChange={(e) => setRiskPercent(Number(e.target.value))} 
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-yellow-500/50 hover:border-white/20 transition-all"
                      />
                  </div>
                  <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2"><Target size={10}/> Min RR (Risk/Reward)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={minRR} 
                        onChange={(e) => setMinRR(Number(e.target.value))} 
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-yellow-500/50 hover:border-white/20 transition-all"
                      />
                  </div>
              </div>
              
              <div className="py-2">
                  <label className="flex items-center gap-3 cursor-pointer group bg-white/[0.02] p-4 rounded-xl border border-white/[0.05] hover:border-yellow-500/30 hover:bg-white/[0.04] transition-all">
                      <input 
                        type="checkbox" 
                        checked={isBotEnabled} 
                        onChange={() => setIsBotEnabled(!isBotEnabled)} 
                        className="accent-yellow-500 w-5 h-5 cursor-pointer"
                      />
                      <span className="text-[11px] uppercase font-black tracking-widest text-zinc-400 group-hover:text-yellow-400 transition-colors">
                        Engine Execution Armed
                      </span>
                  </label>
              </div>

              {/* SETUP FILTERS */}
              <div className="relative">
                <h3 className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2 mb-3">
                  <ShieldCheck size={10} /> Setup Filters
                </h3>
                <div 
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3.5 text-xs font-mono text-white flex justify-between items-center cursor-pointer hover:border-white/20 transition-all"
                  onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}
                >
                  <span className="font-black tracking-widest uppercase text-[10px]">
                    {allowedGrades.length === AVAILABLE_GRADES.length ? 'ALL GRADES SELECTED' : `${allowedGrades.length} GRADES SELECTED`}
                  </span>
                  <ChevronDown size={14} className={`transition-transform ${isGradeDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isGradeDropdownOpen && (
                  <div className="absolute z-50 top-[100%] left-0 w-full mt-2 bg-[#0a0a0a] border border-white/[0.08] rounded-xl shadow-2xl p-3 max-h-[250px] overflow-y-auto flex flex-col gap-1">
                    <div className="flex gap-2 mb-2 pb-2 border-b border-white/[0.05]">
                      <button onClick={() => setAllowedGrades(AVAILABLE_GRADES)} className="text-[9px] bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded text-white font-bold tracking-widest transition-all">ALL</button>
                      <button onClick={() => setAllowedGrades([])} className="text-[9px] bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded text-white font-bold tracking-widest transition-all">NONE</button>
                    </div>
                    {AVAILABLE_GRADES.map(grade => (
                      <label key={grade} className="flex items-center gap-3 cursor-pointer group hover:bg-white/[0.02] p-2 rounded-lg transition-all border border-transparent hover:border-white/[0.05]">
                        <input 
                          type="checkbox" 
                          checked={allowedGrades.includes(grade)}
                          onChange={() => {
                            setAllowedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]);
                          }}
                          className="accent-yellow-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-300 group-hover:text-yellow-400">{grade} Setup</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* ALLOWED SYMBOLS */}
              <div className="relative">
                <h3 className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-2 mb-3">
                  <Activity size={10} /> Allowed Symbols Filter
                </h3>
                <div 
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3.5 text-xs font-mono text-white flex justify-between items-center cursor-pointer hover:border-white/20 transition-all"
                  onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
                >
                  <span className="font-black tracking-widest uppercase text-[10px]">
                    {allowedSymbols.length === POPULAR_SYMBOLS.length ? 'ALL SYMBOLS SELECTED' : `${allowedSymbols.length} SYMBOLS SELECTED`}
                  </span>
                  <ChevronDown size={14} className={`transition-transform ${isSymbolDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isSymbolDropdownOpen && (
                  <div className="absolute z-50 top-[100%] left-0 w-full mt-2 bg-[#0a0a0a] border border-white/[0.08] rounded-xl shadow-2xl p-3 max-h-[250px] overflow-y-auto flex flex-col gap-1">
                    <div className="flex gap-2 mb-2 pb-2 border-b border-white/[0.05]">
                      <button onClick={() => setAllowedSymbols(POPULAR_SYMBOLS)} className="text-[9px] bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded text-white font-bold tracking-widest transition-all">ALL</button>
                      <button onClick={() => setAllowedSymbols([])} className="text-[9px] bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded text-white font-bold tracking-widest transition-all">NONE</button>
                    </div>
                    {POPULAR_SYMBOLS.map(sym => (
                      <label key={sym} className="flex items-center gap-3 cursor-pointer group hover:bg-white/[0.02] p-2 rounded-lg transition-all border border-transparent hover:border-white/[0.05]">
                        <input 
                          type="checkbox" 
                          checked={allowedSymbols.includes(sym)}
                          onChange={() => {
                            setAllowedSymbols(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
                          }}
                          className="accent-yellow-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-300 group-hover:text-yellow-400">{sym}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={saveAllSettings} 
                className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 border border-white/10 ${
                  environment === 'live' 
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]' 
                    : 'bg-gradient-to-r from-yellow-600 to-orange-500 text-white shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)]'
                }`}
              >
                <Save size={16} /> SAVE & SYNC {environment.toUpperCase()}
              </button>
            </div>
          </div>

          {/* MAIN TERMINAL AREA */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8 order-1 lg:order-2">
            
            {/* LOG TERMINAL */}
            <div className="bg-[#020305] border border-white/[0.08] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-220px)] min-h-[500px] relative">
              <div className="absolute top-0 left-0 w-full h-full bg-yellow-500/5 blur-[100px] pointer-events-none" />
              
              <div className="bg-white/[0.02] border-b border-white/[0.05] px-6 py-4 flex justify-between items-center relative z-10 backdrop-blur-md">
                <div className="flex items-center gap-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <Terminal size={14} className={environment === 'live' ? 'text-red-400' : 'text-yellow-400'} /> BINANCE_CLOUD_STREAM [{environment}]
                </div>
                <span className="hidden sm:block text-[9px] text-zinc-500 font-mono bg-white/[0.05] border border-white/[0.05] px-2.5 py-1 rounded-md tracking-widest">
                  UUID: {botConfig?.id?.slice(0,18)}
                </span>
              </div>
              
              <div ref={terminalRef} className="p-6 md:p-8 overflow-y-auto flex-1 font-mono text-[11px] md:text-[13px] leading-relaxed space-y-3 relative z-10 scroll-smooth">
                {logs.length === 0 && (
                  <div className="flex items-center justify-center h-full flex-col text-zinc-600 gap-4 opacity-50">
                    <Activity size={32} className="animate-pulse" />
                    <span className="uppercase tracking-widest font-black text-[10px]">Awaiting Data Stream...</span>
                  </div>
                )}
                {logs.map((log, i) => {
                  const firstBracket = log.indexOf(']');
                  const timeStr = log.substring(0, firstBracket + 1);
                  const msgStr = log.substring(firstBracket + 2);
                  return (
                    <div key={i} className={`flex gap-4 ${log.includes('SIGNAL') ? 'bg-yellow-500/5 border-l-2 border-yellow-500 pl-3 py-1' : ''}`}>
                      <span className="text-zinc-600 shrink-0 select-none">{timeStr}</span>
                      <span className={`shrink-0 font-bold select-none ${environment === 'live' ? 'text-red-400' : 'text-yellow-500'}`}>ENGINE:</span>
                      <span className={`break-words ${
                        log.includes('❌') ? 'text-red-400' : 
                        log.includes('🚀') ? 'text-yellow-300 font-bold' : 
                        log.includes('✅') ? 'text-emerald-400' : 
                        'text-zinc-300'
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
