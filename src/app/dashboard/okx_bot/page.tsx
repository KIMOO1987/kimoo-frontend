'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ShieldCheck, ShieldAlert, Zap, Lock, Save, Globe, 
  Percent, Settings2, Activity, Play, CheckCircle2, Copy, ExternalLink 
} from 'lucide-react';

export default function OKXBotDashboard() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // OKX Bot State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [signalToken, setSignalToken] = useState('');
  const [investPct, setInvestPct] = useState(5.0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [latestSignals, setLatestSignals] = useState<any[]>([]);

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'instructions' | 'signals'>('overview');

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Authentication required. Please log in first.");
        setLoading(false);
        return;
      }

      const user = session.user;
      setUserId(user.id);

      // Check Profile & Tier for Premium Gating
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, is_pro, expiry_date')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setError("User profile not found. Please contact support.");
        setLoading(false);
        return;
      }

      const isPro = profile.is_pro;
      const expiryDate = profile.expiry_date ? new Date(profile.expiry_date) : null;
      const isExpired = expiryDate ? new Date() > expiryDate : true;

      // Gatekeeping: require Tier 2 (CFD/Ultimate) minimum
      if (!isPro || isExpired || profile.tier < 2) {
        setUserTier(profile.tier);
        setLoading(false);
        return;
      }

      setUserTier(profile.tier);

      // Fetch existing OKX Bot config
      const { data: okxConfig } = await supabase
        .from('okx_bot_auth')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (okxConfig) {
        setWebhookUrl(okxConfig.webhook_url || '');
        setSignalToken(okxConfig.signal_token || '');
        setInvestPct(okxConfig.invest_pct ?? 5.0);
        setIsEnabled(okxConfig.is_enabled ?? true);
      }

      // Fetch Latest Signals for the user's dashboard view
      const { data: signals } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setLatestSignals(signals || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const handleSaveConfig = async () => {
    if (!userId) return;
    if (!webhookUrl || !signalToken) {
      alert("Please fill in both the Webhook URL and the Signal Token.");
      return;
    }

    setIsSaving(true);
    try {
      const { error: saveErr } = await supabase
        .from('okx_bot_auth')
        .upsert({
          user_id: userId,
          webhook_url: webhookUrl.trim(),
          signal_token: signalToken.trim(),
          invest_pct: Number(investPct),
          is_enabled: isEnabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (saveErr) {
        throw new Error(saveErr.message);
      }

      alert("🎉 OKX Native Signal Bot credentials saved successfully! Your bot is active.");
      fetchData();
    } catch (err: any) {
      alert("Error saving configuration: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center animate-pulse">
        <Activity size={40} className="text-[#37ac9a] mb-4 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Linking OKX Signal Bridge...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a]">
      <ShieldAlert className="text-red-500 mb-4" size={48} />
      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">System Error</h2>
      <p className="text-zinc-500 text-sm mt-2 max-w-md">{error}</p>
    </div>
  );

  if (userTier !== null && userTier < 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a]">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Access Denied</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-xs">OKX Native Signal Bot requires a Tier 2 (CFD / Ultimate) or higher subscription.</p>
      </div>
    );
  }

  return (
    <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 min-h-screen text-white font-sans overflow-x-hidden bg-[#0a0a0a]">
      
      {/* Ambient Glow background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#37ac9a]/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-[1700px] mx-auto relative z-10 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase">
              <Zap size={32} className="text-[#37ac9a] fill-[#37ac9a]" />
              OKX NATIVE<span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">SIGNAL BOT</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3">
              • High-Speed Webhook Dispatcher System •
            </p>
          </div>
          
          <div className="flex gap-2">
            {(['overview', 'instructions', 'signals'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${
                  activeTab === tab 
                  ? 'bg-[#37ac9a] border-[#37ac9a] text-black shadow-[0_0_20px_rgba(55,172,154,0.3)]' 
                  : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                }`}
              >
                {tab === 'instructions' ? 'How to Setup' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: SETTINGS PANEL */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl space-y-6">
              <h2 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3 text-[#37ac9a] border-b border-white/5 pb-4">
                <ShieldCheck size={16} /> Signal Credentials
              </h2>
              
              <div className="space-y-5">
                {/* WEBHOOK URL */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Globe size={11} /> OKX Webhook URL
                  </label>
                  <input 
                    type="text" 
                    value={webhookUrl} 
                    onChange={(e) => setWebhookUrl(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-mono outline-none focus:border-[#37ac9a]/50 focus:ring-1 focus:ring-[#37ac9a]/30 transition-all"
                    placeholder="https://www.okx.com/pap/algo/signal/trigger"
                  />
                  <p className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">
                    Use paper trading URL to test safely first!
                  </p>
                </div>

                {/* SIGNAL TOKEN */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Lock size={11} /> OKX Signal Token
                  </label>
                  <input 
                    type="password" 
                    value={signalToken} 
                    onChange={(e) => setSignalToken(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-mono outline-none focus:border-[#37ac9a]/50 focus:ring-1 focus:ring-[#37ac9a]/30 transition-all"
                    placeholder="••••••••••••••••••••••••••••••••••••••••"
                  />
                </div>

                {/* INVESTMENT SIZE */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Percent size={11} /> Entry Size (% of Balance)
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="number" 
                      step="0.5"
                      min="0.1"
                      max="100"
                      value={investPct} 
                      onChange={(e) => setInvestPct(Number(e.target.value))} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-mono outline-none focus:border-[#37ac9a]/50 focus:ring-1 focus:ring-[#37ac9a]/30 transition-all"
                    />
                    <div className="absolute right-4 text-xs font-bold text-zinc-500 font-mono pointer-events-none">%</div>
                  </div>
                  <p className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">
                    Percentage of your balance invested per entry signal.
                  </p>
                </div>

                {/* BOT TOGGLE */}
                <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider">Bot Integration State</h3>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest">Enable or disable bot operations</p>
                  </div>
                  <button 
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`w-12 h-6 rounded-full p-1 transition-all ${isEnabled ? 'bg-[#37ac9a]' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-black transition-all ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* SAVE BUTTON */}
                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full py-4 mt-2 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                  Save & Secure Bot
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONTENT DETAIL TABS */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl space-y-6">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-[#37ac9a] border-b border-white/5 pb-4 flex items-center gap-2">
                  <Play size={14} className="fill-[#37ac9a]" /> Bot Connectivity Overview
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Signal Status</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isEnabled && webhookUrl ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                      <p className="text-sm font-black uppercase tracking-wider">
                        {isEnabled && webhookUrl ? "Bridge Connected & Listening" : "Bridge Idle / Offline"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Asset Category Gating</p>
                    <p className="text-sm font-black uppercase tracking-wider mt-2 text-[#37ac9a]">USDT CRYPTO SWAPS ONLY</p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-white">System Operations Map</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={14} className="text-[#37ac9a] mt-0.5" />
                      <p className="text-xs text-zinc-400">
                        <strong className="text-white">Deduplication:</strong> Advanced 10-second deduplication guard is running live in the background.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={14} className="text-[#37ac9a] mt-0.5" />
                      <p className="text-xs text-zinc-400">
                        <strong className="text-white">Multi-stage TP:</strong> Sends a <span className="text-emerald-400 font-bold">50% exit</span> size signal on TP1 target hit, and closes <span className="text-red-400 font-bold">100% size</span> on TP2, SL, or manual exits.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={14} className="text-[#37ac9a] mt-0.5" />
                      <p className="text-xs text-zinc-400">
                        <strong className="text-white">Direct Execution:</strong> Zero third-party bridge delays. Signals go straight into the OKX low-latency execution pool.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INSTRUCTIONS TAB */}
            {activeTab === 'instructions' && (
              <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-[#37ac9a]">
                    📖 OKX Signal Bot Creation Guide
                  </h2>
                  <a 
                    href="https://www.okx.com/trade-market/bot/signal" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[9px] font-black text-zinc-500 uppercase tracking-widest hover:text-white flex items-center gap-1.5 transition-all"
                  >
                    Open OKX <ExternalLink size={10} />
                  </a>
                </div>

                <div className="space-y-6">
                  {/* STEP 1 */}
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#37ac9a] font-mono shrink-0">1</div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-wider">Navigate to OKX Trading Bots</h3>
                      <p className="text-xs text-zinc-400">
                        Log in to OKX, hover over <strong className="text-white">Trade</strong> in the top header, click <strong className="text-white">Trading Bots</strong>, and scroll down to select <strong className="text-white">Signal bot</strong> under the Futures tab.
                      </p>
                    </div>
                  </div>

                  {/* STEP 2 */}
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#37ac9a] font-mono shrink-0">2</div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-wider">Create a Custom Signal</h3>
                      <p className="text-xs text-zinc-400">
                        Click **Create**, and then click on <strong className="text-white">Add custom signal</strong>. Give your signal a descriptive name (e.g. *Kimoo Premium Signals*) and enter a description.
                      </p>
                    </div>
                  </div>

                  {/* STEP 3 */}
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#37ac9a] font-mono shrink-0">3</div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-wider">Retrieve and Copy Credentials</h3>
                      <p className="text-xs text-zinc-400">
                        OKX will display your custom Webhook specifications.
                      </p>
                      
                      {/* Interactive Visual Box */}
                      <div className="bg-[#141414] border border-white/5 rounded-xl p-4 mt-3 space-y-3 font-mono text-[10px]">
                        <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg">
                          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Demo/Paper Webhook URL</span>
                          <button 
                            onClick={() => copyText("https://www.okx.com/pap/algo/signal/trigger", 1)} 
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded flex items-center gap-1.5 transition-all text-[#37ac9a]"
                          >
                            {copiedIndex === 1 ? "Copied" : <Copy size={10} />}
                          </button>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg">
                          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Live Webhook URL</span>
                          <button 
                            onClick={() => copyText("https://www.okx.com/algo/signal/trigger", 2)} 
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded flex items-center gap-1.5 transition-all text-[#37ac9a]"
                          >
                            {copiedIndex === 2 ? "Copied" : <Copy size={10} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 4 */}
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#37ac9a] font-mono shrink-0">4</div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-wider">Save Credentials on Kimoo</h3>
                      <p className="text-xs text-zinc-400">
                        Copy the **Webhook URL** and the unique **Signal Token** shown on OKX, paste them into the input fields on the left settings panel, set your desired trade investment size, and click <strong className="text-white">Save & Secure Bot</strong>.
                      </p>
                    </div>
                  </div>

                  {/* STEP 5 */}
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#37ac9a] font-mono shrink-0">5</div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-wider">Complete Bot Configuration on OKX</h3>
                      <p className="text-xs text-zinc-400">
                        Once saved, click **Next** on the OKX page. Select the contracts you wish to trade (e.g. *USDT Perpetual Swap pairs*), configure your leverage, and finally click **Create Bot** to launch it live.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIGNALS TAB */}
            {activeTab === 'signals' && (
              <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
                <div className="p-8 border-b border-white/5 bg-white/5">
                  <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Settings2 size={14} /> Bridge Signals Logs
                  </h3>
                </div>
                <div className="p-6 space-y-3.5">
                  {latestSignals.length > 0 ? latestSignals.map((sig) => (
                    <div key={sig.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                         <div className={`w-2.5 h-2.5 rounded-full ${sig.side === 'BUY' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                         <div>
                           <p className="text-xs font-black uppercase tracking-wider">{sig.symbol}</p>
                           <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{sig.tf_alignment || "1H"} • {sig.grade || "A+"}</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold">${sig.entry_price || sig.price}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                          {new Date(sig.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs italic">
                      No system signals dispatched yet...
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
