'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import CryptoJS from 'crypto-js';
import { 
  ShieldAlert, Terminal, Settings2, ShieldCheck, Activity, 
  Wallet, Percent, Target, Lock, Save, ChevronDown,
  LayoutDashboard, History, Zap, BarChart3, Globe
} from 'lucide-react';

// Internal Components (assuming they are in the component folder)
import BotStatus from '@/components/BotStatus';

const MASTER_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

export default function ThreeCommasDashboard() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // 3Commas Specific State
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'smart_trades' | 'signals' | 'history'>('overview');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedTradingAccountId, setSelectedTradingAccountId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [smartTrades, setSmartTrades] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  
  // API Vault State
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Risk Settings State
  const [dailyRisk, setDailyRisk] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1.0);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError("Authentication required.");
      setLoading(false);
      return;
    }

    const user = session.user;
    setUserId(user.id);

    // Check Profile & Tier
    const { data: profile } = await supabase.from('profiles').select('tier, is_pro, expiry_date').eq('id', user.id).single();
    
    if (!profile) {
      setError("User profile not found.");
      setLoading(false);
      return;
    }

    // Subscription Check (Tier 1 Minimum)
    const isPro = profile.is_pro;
    const expiryDate = profile.expiry_date ? new Date(profile.expiry_date) : null;
    const isExpired = expiryDate ? new Date() > expiryDate : true;

    if (!isPro || isExpired || profile.tier < 1) {
      setUserTier(profile.tier);
      setLoading(false);
      return;
    }

    setUserTier(profile.tier);

    // Fetch Latest Signals
    const { data: latestSignals } = await supabase.from('signals').select('*').order('created_at', { ascending: false }).limit(10);
    setSignals(latestSignals || []);

    // Fetch 3Commas Auth
    const { data: auth } = await supabase.from('three_commas_auth').select('*').eq('user_id', user.id).single();
    if (auth) {
      setApiKey(auth.api_key);
      setSelectedTradingAccountId(auth.selected_account_id);
      if (auth.risk_settings) {
        setDailyRisk(auth.risk_settings.daily_risk_wallet || 1000);
        setRiskPercent(auth.risk_settings.risk_percentage || 1.0);
      }
      
      // If we have keys, fetch live data from our backend proxy
      // Note: In a real app, this would be a call to your FastAPI /three-commas/accounts endpoint
      // For this demo, we'll simulate the call
      try {
        const ports = [8080, 8000];
        let res = null;
        let successfulPort = 8080;

        for (const port of ports) {
          try {
            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || `http://localhost:${port}`}/signals/3commas/accounts?user_id=${user.id}`;
            const testRes = await fetch(url);
            if (testRes.ok || testRes.status === 404 || testRes.status === 403) {
              res = testRes;
              successfulPort = port;
              break;
            }
          } catch (e) {
            continue; 
          }
        }

        if (!res) throw new Error("Could not connect to backend on port 8080 or 8000. Ensure your FastAPI server is running.");

        const accountData = await res.json();
        
        if (res.ok && Array.isArray(accountData)) {
          setAccounts(accountData);
          setApiError(null);
        } else {
          setApiError(accountData.message || accountData.error || `Server Error (${res.status})`);
          setAccounts([]);
        }
      } catch (e: any) {
        setApiError("Connection Error: " + e.message);
        console.error("Failed to fetch 3Commas accounts", e);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const saveAuth = async () => {
    if (!userId || !apiKey || !apiSecret) return;
    setIsSyncing(true);

    // Encrypt secret
    const encryptedSecret = CryptoJS.AES.encrypt(apiSecret, MASTER_ENCRYPTION_KEY!).toString();

    const { error: saveErr } = await supabase.from('three_commas_auth').upsert({
      user_id: userId,
      api_key: apiKey,
      api_secret: encryptedSecret,
      selected_account_id: selectedTradingAccountId,
      risk_settings: { daily_risk_wallet: dailyRisk, risk_percentage: riskPercent },
      updated_at: new Date().toISOString()
    });

    if (saveErr) {
      alert("Error saving credentials: " + saveErr.message);
    } else {
      alert("3Commas Credentials Secured!");
      setApiSecret(''); // Clear plaintext
      fetchData();
    }
    setIsSyncing(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center animate-pulse">
        <Activity size={40} className="text-[#37ac9a] mb-4 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Connecting to 3Commas Bridge...</p>
      </div>
    </div>
  );

  if (userTier !== null && userTier < 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a]">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Access Denied</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-xs">3Commas Integration requires a Tier 1 (Pro) subscription.</p>
      </div>
    );
  }

  return (
    <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 min-h-screen text-white font-sans overflow-x-hidden bg-[#0a0a0a]">
      
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#37ac9a]/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-[1700px] mx-auto relative z-10 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase">
              <Zap size={32} className="text-[#37ac9a] fill-[#37ac9a]" />
              3Commas<span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">Bridge</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3">
              • Unified Multi-Exchange Execution Engine •
            </p>
          </div>
          
          <div className="flex gap-2">
            {selectedAccountId && (
              <button 
                onClick={() => setSelectedAccountId(null)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all"
              >
                Exit Exchange
              </button>
            )}
            {['overview', 'deals', 'smart_trades', 'signals', 'history'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${
                  activeTab === tab 
                  ? 'bg-[#37ac9a] border-[#37ac9a] text-black shadow-[0_0_20px_rgba(55,172,154,0.3)]' 
                  : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SIDEBAR: VAULT & RISK */}
          <div className="lg:col-span-4 space-y-8">
            {/* VAULT */}
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl">
              <h2 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-[#37ac9a]">
                <ShieldCheck size={16} /> API Vault
              </h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Settings2 size={10}/> API Key</label>
                  <input 
                    type="text" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-mono outline-none focus:border-[#37ac9a]/50"
                    placeholder="3Commas API Key..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Lock size={10}/> API Secret</label>
                  <input 
                    type="password" 
                    value={apiSecret} 
                    onChange={(e) => setApiSecret(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-mono outline-none focus:border-[#37ac9a]/50"
                    placeholder="••••••••••••"
                  />
                </div>
                <button 
                  onClick={saveAuth}
                  disabled={isSyncing}
                  className="w-full py-4 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                >
                  {isSyncing ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                  Save & Connect
                </button>
              </div>
            </div>

            {/* RISK SETTINGS */}
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl">
              <h2 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-[#37ac9a]">
                <Target size={16} /> Global Risk
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Wallet size={10}/> Wallet ($)</label>
                  <input 
                    type="number" 
                    value={dailyRisk} 
                    onChange={(e) => setDailyRisk(Number(e.target.value))} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Percent size={10}/> Risk (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={riskPercent} 
                    onChange={(e) => setRiskPercent(Number(e.target.value))} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {apiError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-500 text-[11px] font-black uppercase tracking-widest animate-pulse">
                    <ShieldAlert size={16} /> {apiError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accounts.length > 0 ? accounts
                  .filter(acc => !selectedAccountId || acc.id === selectedAccountId)
                  .map((acc) => (
                  <div 
                    key={acc.id} 
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`bg-white/[0.03] border border-white/10 p-6 rounded-3xl transition-all cursor-pointer ${
                      selectedAccountId === acc.id ? 'border-[#37ac9a] bg-[#37ac9a]/5' : 'hover:border-[#37ac9a]/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider">{acc.name}</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{acc.market_code}</p>
                      </div>
                      <Globe size={16} className={selectedAccountId === acc.id ? 'text-white' : 'text-[#37ac9a]'} />
                    </div>
                    <div className="mt-4">
                      <p className="text-[9px] text-zinc-500 uppercase font-black">Equity</p>
                      <p className="text-xl font-mono font-bold">${parseFloat(acc.equity_usd || 0).toLocaleString()}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTradingAccountId(acc.id);
                        }}
                        className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          selectedTradingAccountId === acc.id 
                          ? 'bg-[#37ac9a] text-black shadow-[0_0_15px_rgba(55,172,154,0.4)]' 
                          : 'bg-white/5 text-zinc-500 hover:text-white border border-white/10'
                        }`}
                      >
                        {selectedTradingAccountId === acc.id ? 'Active Trading Target' : 'Set as Trading Target'}
                      </button>
                    </div>

                    {selectedAccountId === acc.id && (
                       <div className="mt-4 pt-4 border-t border-white/10 text-[10px] font-black uppercase tracking-widest text-[#37ac9a]">
                         Viewing Detailed Account Data
                       </div>
                    )}
                  </div>
                )) : (
                  <div className="col-span-full py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center">
                    <BarChart3 size={40} className="text-zinc-700 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No linked exchanges found</p>
                  </div>
                )}
              </div>
            </div>
          )}

            {activeTab === 'signals' && (
              <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/5">
                  <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14} /> Live KimooCRT Signals
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {signals.length > 0 ? signals.map((sig) => (
                    <div key={sig.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                         <div className={`w-2 h-2 rounded-full ${sig.side === 'BUY' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                         <div>
                           <p className="text-xs font-black uppercase tracking-wider">{sig.symbol}</p>
                           <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{sig.tf_alignment} • {sig.grade}</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold">${sig.entry_price}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{new Date(sig.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 flex flex-col items-center opacity-30 italic">
                      No signals detected...
                    </div>
                  )}
                </div>
              </div>
            )}

            {(activeTab === 'deals' || activeTab === 'smart_trades' || activeTab === 'history') && (
              <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                    <LayoutDashboard size={14} /> {activeTab.replace('_', ' ')}
                  </h3>
                </div>
                <div className="p-8 flex flex-col items-center justify-center h-full text-zinc-600 italic text-sm">
                   Awaiting live stream from 3Commas...
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
