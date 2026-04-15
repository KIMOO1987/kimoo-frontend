'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import CryptoJS from 'crypto-js';
import { ShieldAlert, Terminal, Settings2, ShieldCheck, Activity, Wallet, Percent, Target, Lock, Save, ChevronDown } from 'lucide-react';
import BotStatus from '@/components/BotStatus';

const MASTER_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

export default function MEXCDashboard() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [loading, setLoading] = useState(true);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Settings State
  const [dailyRisk, setDailyRisk] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [minRR, setMinRR] = useState(1.2);
  const [maxConcurrent, setMaxConcurrent] = useState(3);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isBotEnabled, setIsBotEnabled] = useState(true);
  const [environment, setEnvironment] = useState<'testnet' | 'live'>('testnet');

  const AVAILABLE_GRADES = ['A++', 'A+', 'GOOD', 'NORMAL'];
  const [allowedGrades, setAllowedGrades] = useState<string[]>(['A++', 'A+', 'GOOD']);
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);

  const [allowedSymbols, setAllowedSymbols] = useState<string[]>([]);
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-100));
  }, []);

  const fetchBotData = async (isSilentRefresh = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setError("Authentication required.");
        setLoading(false);
        return;
    }

    if (!isSilentRefresh) {
        setUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('tier').eq('id', user.id).single();
        setUserTier(profile?.tier || 0);
    }

    // TARGET: exchange_auth table filtered by mexc
    const { data } = await supabase.from('exchange_auth')
        .select('*')
        .eq('user_id', user.id)
        .eq('exchange_name', 'mexc')
        .single();

    if (data) {
      setBotConfig(data);
      if (!isSilentRefresh) {
        setDailyRisk(data.daily_risk_wallet || 1000);
        setRiskPercent(data.risk_percentage || 1.0);
        setMinRR(data.rr || 1.2);
        setMaxConcurrent(data.max_concurrent_setups || 3);
        setIsBotEnabled(data.is_active ?? true);
        setApiKey(data.api_key || '');
        setEnvironment(data.environment || 'testnet');
        setAllowedSymbols(data.allowed_symbols ?? []);
        const dbGrades = [];
        if (data.allow_aplusplus ?? true) dbGrades.push('A++');
        if (data.allow_aplus ?? true) dbGrades.push('A+');
        if (data.allow_good ?? true) dbGrades.push('GOOD');
        if (data.allow_normal ?? false) dbGrades.push('NORMAL');
        setAllowedGrades(dbGrades);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBotData();
    const refreshInterval = setInterval(() => fetchBotData(true), 30000);
    return () => clearInterval(refreshInterval);
  }, [supabase]);

  // Real-time Logs for MEXC
  useEffect(() => {
    if (!userId) return;

    const logChannel = supabase
      .channel(`mexc-logs-${userId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'mexc_bot_logs', filter: `user_id=eq.${userId}` }, 
        (payload) => addLog(payload.new.message)
      ).subscribe();

    return () => { supabase.removeChannel(logChannel); }
  }, [userId, addLog, supabase]);

  const saveSettings = async () => {
    if (!MASTER_ENCRYPTION_KEY) return addLog("❌ Encryption Key Missing");
    
    let encryptedSecret = botConfig?.api_secret || '';
    if (apiSecret) {
        encryptedSecret = CryptoJS.AES.encrypt(apiSecret, MASTER_ENCRYPTION_KEY).toString();
    }

    const updates = {
        user_id: userId,
        exchange_name: 'mexc',
        daily_risk_wallet: dailyRisk,
        risk_percentage: riskPercent,
        rr: minRR,
        max_concurrent_setups: maxConcurrent,
        is_active: isBotEnabled,
        api_key: apiKey,
        api_secret: encryptedSecret,
        environment: environment,
        allow_aplusplus: allowedGrades.includes('A++'),
        allow_aplus: allowedGrades.includes('A+'),
        allow_good: allowedGrades.includes('GOOD'),
        allow_normal: allowedGrades.includes('NORMAL'),
    };

    const { error } = await supabase.from('exchange_auth').upsert(updates, { onConflict: 'user_id, exchange_name' });

    if (!error) {
        addLog(`✅ MEXC Configuration Synced to ${environment.toUpperCase()}`);
        setApiSecret('');
    } else {
        addLog(`❌ Save Error: ${error.message}`);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#030407] flex items-center justify-center">Loading MEXC Engine...</div>;

  return (
    <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white">
      {/* Branding for MEXC (Teal/Blue Accents) */}
      <div className="max-w-[1700px] mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase flex items-center gap-3">
               <Activity className="text-[#2070f3]" /> MEXC<span className="text-[#2070f3]">Terminal</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-2">• 0% FEE MAKER EXECUTION •</p>
          </div>
          {userId && <BotStatus userId={userId} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white/[0.03] border border-white/[0.05] p-8 rounded-[2rem] backdrop-blur-md">
                <h3 className="text-[11px] font-black text-[#2070f3] uppercase tracking-widest mb-6 flex items-center gap-2"><Lock size={14}/> API Credentials</h3>
                <div className="space-y-4">
                    <div className="flex bg-white/[0.05] p-1 rounded-lg">
                        <button onClick={() => setEnvironment('testnet')} className={`flex-1 py-2 text-[10px] font-black rounded ${environment === 'testnet' ? 'bg-[#2070f3] text-white' : 'text-zinc-500'}`}>TESTNET</button>
                        <button onClick={() => setEnvironment('live')} className={`flex-1 py-2 text-[10px] font-black rounded ${environment === 'live' ? 'bg-emerald-600 text-white' : 'text-zinc-500'}`}>LIVE</button>
                    </div>
                    <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs" placeholder="MEXC API Key" />
                    <input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs" placeholder="MEXC Secret Key" />
                </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.05] p-8 rounded-[2rem]">
                <h3 className="text-[11px] font-black text-[#2070f3] uppercase tracking-widest mb-6 flex items-center gap-2"><Target size={14}/> Risk & Filters</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <input type="number" value={dailyRisk} onChange={(e) => setDailyRisk(Number(e.target.value))} className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs" placeholder="Wallet $" />
                    <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))} className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs" placeholder="Risk %" />
                </div>
                <button onClick={saveSettings} className="w-full py-4 bg-[#2070f3] hover:bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"><Save size={16} className="inline mr-2"/> Save MEXC Settings</button>
            </div>
          </div>

          {/* Terminal Area */}
          <div className="lg:col-span-8">
            <div className="bg-black border border-white/10 rounded-[2.5rem] h-[600px] flex flex-col overflow-hidden shadow-2xl">
                <div className="bg-white/[0.05] px-6 py-4 border-b border-white/10 flex items-center gap-2">
                    <Terminal size={14} className="text-[#2070f3]" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">MEXC_CLOUD_ENGINE_v4.0</span>
                </div>
                <div ref={terminalRef} className="p-8 overflow-y-auto flex-1 font-mono text-xs space-y-2">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-4">
                            <span className="text-zinc-600">{log.split(']')[0]}]</span>
                            <span className="text-blue-400 font-bold">MEXC:</span>
                            <span className="text-zinc-300">{log.split(']')[1]}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
