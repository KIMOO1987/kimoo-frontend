"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Zap, Star, Activity, BarChart3, Target, 
  Send, Lock, User, ShieldCheck, Clock, ArrowRight, Camera, Loader2, Wallet
} from 'lucide-react';

interface DashboardClientProps {
  isPro: boolean;
  expiryDate?: string | null;
  userProfile: any; 
}

export default function DashboardClient({ isPro, expiryDate, userProfile }: DashboardClientProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || null);
  
  // Account Size State
  const [accountSize, setAccountSize] = useState(10000); 
  
  const [realStats, setRealStats] = useState({
    total: 0,
    winRate: "0%",
    avgRR: "0.00R",
    totalRR: "0.00R",
    profitUSD: "$0.00",
    mostProfitable: "---",
    mostTraded: "---",
    highWRPair: "---",
    avgDuration: "3.2h"
  });

  const currentTier = userProfile?.subscriptionTier?.toUpperCase() || (isPro ? "PRO" : "FREE MEMBER");
  const daysLeft = expiryDate ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
  
  const showPremiumCard = currentTier !== "PRO" && currentTier !== "ULTIMATE";
  const showValuePlanCard = currentTier === "FREE MEMBER";

  useEffect(() => {
    fetchData();
  }, [accountSize]);

  async function fetchData() {
    const { data: signals } = await supabase.from('signals').select('*');
    if (!signals || signals.length === 0) return;

    // Logic for your specific Supabase status labels
    const wins = signals.filter(s => s.status?.toUpperCase().includes('TP'));
    const losses = signals.filter(s => s.status?.toUpperCase() === 'SL');
    const be = signals.filter(s => s.status?.toUpperCase().includes('BE'));
    const closed = [...wins, ...losses, ...be];

    // Math: 1% risk per trade
    const riskAmount = accountSize * 0.01; 
    let totalRR = 0;
    const pairMap: Record<string, { count: number, profit: number, wins: number, closed: number }> = {};

    signals.forEach(s => {
      const sym = s.symbol || "UNKNOWN";
      if (!pairMap[sym]) pairMap[sym] = { count: 0, profit: 0, wins: 0, closed: 0 };
      pairMap[sym].count += 1;

      const status = s.status?.toUpperCase() || "";
      if (status.includes('TP2')) {
        totalRR += 2; 
        pairMap[sym].profit += 2;
        pairMap[sym].wins += 1;
        pairMap[sym].closed += 1;
      } else if (status.includes('TP1') && !status.includes('BE')) {
        totalRR += 1;
        pairMap[sym].profit += 1;
        pairMap[sym].wins += 1;
        pairMap[sym].closed += 1;
      } else if (status === 'SL') {
        totalRR -= 1;
        pairMap[sym].profit -= 1;
        pairMap[sym].closed += 1;
      } else if (status.includes('BE')) {
        pairMap[sym].closed += 1;
      }
    });

    const sortedByProfit = Object.entries(pairMap).sort((a, b) => b[1].profit - a[1].profit);
    const sortedByTraded = Object.entries(pairMap).sort((a, b) => b[1].count - a[1].count);
    const sortedByWR = Object.entries(pairMap)
      .filter(([_, data]) => data.closed > 0)
      .sort((a, b) => (b[1].wins / b[1].closed) - (a[1].wins / a[1].closed));

    setRealStats({
      total: signals.length,
      winRate: (wins.length + losses.length) > 0 
        ? ((wins.length / (wins.length + losses.length)) * 100).toFixed(1) + "%" 
        : "0%",
      totalRR: totalRR.toFixed(2) + "R",
      avgRR: closed.length > 0 ? (totalRR / closed.length).toFixed(2) + "R" : "0.00R",
      profitUSD: `$${(totalRR * riskAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
      mostProfitable: sortedByProfit[0]?.[0] || "---",
      mostTraded: sortedByTraded[0]?.[0] || "---",
      highWRPair: sortedByWR[0]?.[0] || "---",
      avgDuration: "3.2h"
    });
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files?.[0]) return;
      const file = event.target.files[0];
      const filePath = `${userProfile.id}/${Date.now()}.${file.name.split('.').pop()}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatarUrl: publicUrl }).eq('id', userProfile.id);
      setAvatarUrl(publicUrl);
    } catch (e) { console.error(e); } finally { setUploading(false); }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#0b0e14] min-h-screen text-zinc-400 font-sans selection:bg-blue-500/30">
      
      {/* 1. GLASS HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-10 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md gap-8 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-[2px] transition-all group-hover:rotate-3">
              <div className="w-full h-full rounded-[14px] bg-[#0b0e14] flex items-center justify-center overflow-hidden relative">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User size={30} className="text-zinc-800" />}
                <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                  {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
                </div>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-[#0b0e14] flex items-center justify-center shadow-lg">
              <ShieldCheck size={14} className="text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                {userProfile?.fullName || 'Trader'}
              </h1>
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded italic shadow-[0_0_15px_rgba(37,99,235,0.4)]">ADMIN</span>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="text-[9px] font-black px-3 py-1 bg-white/5 border border-white/10 rounded-full uppercase tracking-widest text-blue-400">{currentTier}</span>
              <span className="text-[9px] font-black px-3 py-1 bg-white/5 border border-white/10 rounded-full uppercase tracking-widest text-zinc-600 font-mono">{userProfile?.email}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
            <div className="bg-white/5 border border-white/10 p-4 px-6 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/30 transition-colors">
                <Wallet className="text-emerald-500" size={22} />
                <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Trading Capital</p>
                    <div className="flex items-center gap-1">
                        <span className="text-white font-black text-xl">$</span>
                        <input 
                            type="number" 
                            value={accountSize} 
                            onChange={(e) => setAccountSize(Number(e.target.value))}
                            className="bg-transparent text-white font-black text-xl w-28 outline-none focus:text-emerald-400 transition-colors"
                        />
                    </div>
                </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 px-6 rounded-2xl flex items-center gap-4">
                <Clock className="text-blue-500" size={22} />
                <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Subscription</p>
                    <p className="text-white font-black text-xl italic tracking-tighter">{daysLeft} DAYS LEFT</p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard label="Total Signals" value={realStats.total} icon={<Activity size={18}/>} />
        <StatCard label="Win Rate" value={realStats.winRate} icon={<TrendingUp size={18}/>} color="text-emerald-400" />
        <StatCard label="Total RR" value={realStats.totalRR} icon={<Zap size={18}/>} color="text-blue-400" />
        <StatCard label="Net Profit" value={realStats.profitUSD} icon={<Star size={18}/>} color="text-emerald-500" />
        
        <StatCard label="Most Profitable" value={realStats.mostProfitable} sub="Alpha Asset" />
        <StatCard label="Most Traded" value={realStats.mostTraded} sub="Volume Focus" />
        <StatCard label="High WR Pair" value={realStats.highWRPair} sub="Accuracy Leader" />
        <StatCard label="Avg Duration" value={realStats.avgDuration} sub="Intraday Velocity" />
      </div>

      {/* 3. CONDITIONAL BANNERS */}
      {(showPremiumCard || showValuePlanCard) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {showPremiumCard && (
            <div className="p-10 rounded-[3rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 flex justify-between items-center group cursor-pointer hover:border-blue-500/40 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20"><Lock size={24}/></div>
                <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Unlock Premium</h3>
                    <p className="text-sm text-zinc-500 mt-1">Get full CRT signal desk access.</p>
                </div>
              </div>
              <ArrowRight className="text-white group-hover:translate-x-2 transition-transform" />
            </div>
          )}
          {showValuePlanCard && (
            <div className="p-10 rounded-[3rem] bg-gradient-to-br from-emerald-600/10 to-transparent border border-emerald-500/20 flex justify-between items-center group cursor-pointer hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20"><Star size={24}/></div>
                <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Best Value Plan</h3>
                    <p className="text-sm text-zinc-500 mt-1">40% Off Yearly Subscriptions.</p>
                </div>
              </div>
              <ArrowRight className="text-white group-hover:translate-x-2 transition-transform" />
            </div>
          )}
        </div>
      )}

      {/* 4. PREMIUM ROADMAP */}
      <div className="max-w-5xl mb-24">
        <div className="flex items-center gap-3 text-amber-500 mb-6">
            <div className="h-px w-10 bg-amber-500/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Premium Roadmap</span>
        </div>
        <h2 className="text-5xl font-black text-white mb-12 tracking-tighter italic uppercase">
          Build your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 text-7xl">Execution Terminal.</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
          <FeatureItem icon={<Activity size={22}/>} title="Live Execution Visibility" desc="Track R:R growth in real-time as the market hits levels. See active exit progress live." />
          <FeatureItem icon={<BarChart3 size={22}/>} title="Strategy-Grade Validation" desc="Audit symbol performance across multiple timeframes. Open Backtest Simulator and Risk Command." />
          <FeatureItem icon={<Target size={22}/>} title="Radar + Diagnostics" desc="Identify symbol clustering and timing edge instantly. Inspect volatility behavior per asset." />
          <FeatureItem icon={<Send size={22}/>} title="Telegram Workflow" desc="Direct private signal routing to your mobile device. Turn the dashboard into an operational signal desk." />
        </div>
      </div>

      {/* 5. FOOTER */}
      <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-700 gap-4">
        <p>© 2026 KIMOO CRT ANALYTICS ENGINE</p>
        <p className="flex items-center gap-3"> 
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> 
          Terminal Status: Operational
        </p>
      </div>
    </div>
  );
}

// SUB-COMPONENTS
function StatCard({ label, value, icon, sub, color = "text-white" }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 backdrop-blur-2xl p-7 rounded-[2rem] hover:bg-white/[0.04] transition-all group hover:border-white/10 shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
        <div className="text-zinc-700 group-hover:text-blue-500 transition-colors transform group-hover:scale-110">{icon}</div>
      </div>
      <p className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
      {sub && <p className="text-[9px] font-bold text-zinc-800 mt-2 uppercase tracking-tighter">{sub}</p>}
    </div>
  );
}

function FeatureItem({ icon, title, desc }: any) {
  return (
    <div className="flex gap-6 group">
      <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-black uppercase italic text-xl mb-2 group-hover:text-blue-400 transition-colors">{title}</h4>
        <p className="text-zinc-500 text-sm leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
