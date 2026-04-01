"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Zap, Star, Activity, BarChart3, Target, 
  Lock, User, ShieldCheck, Clock, ArrowRight, Camera, Loader2, Wallet, MessageSquare, AlertCircle
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

  // --- AUTO REFRESH LOGIC ---
  useEffect(() => {
    fetchData(); // Run on mount
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 second refresh
    return () => clearInterval(interval);
  }, [accountSize]);

  async function fetchData() {
    try {
      const { data: signals, error } = await supabase.from('signals').select('*');
      if (error || !signals || signals.length === 0) return;

      // Filter based on your Supabase status values
      const wins = signals.filter(s => s.status?.toUpperCase().includes('TP'));
      const losses = signals.filter(s => s.status?.toUpperCase() === 'SL');
      const be = signals.filter(s => s.status?.toUpperCase().includes('BE'));
      const closed = [...wins, ...losses, ...be];

      const riskAmount = accountSize * 0.01; // 1% Risk
      let totalRR = 0;
      const pairMap: Record<string, { count: number, profit: number, wins: number, closed: number }> = {};

      signals.forEach(s => {
        const sym = s.symbol || "---";
        if (!pairMap[sym]) pairMap[sym] = { count: 0, profit: 0, wins: 0, closed: 0 };
        pairMap[sym].count += 1;

        const status = s.status?.toUpperCase() || "";
        if (status.includes('TP2')) { 
            totalRR += 2; pairMap[sym].profit += 2; pairMap[sym].wins += 1; pairMap[sym].closed += 1; 
        } else if (status.includes('TP1') && !status.includes('BE')) { 
            totalRR += 1; pairMap[sym].profit += 1; pairMap[sym].wins += 1; pairMap[sym].closed += 1; 
        } else if (status === 'SL') { 
            totalRR -= 1; pairMap[sym].profit -= 1; pairMap[sym].closed += 1; 
        } else if (status.includes('BE')) { 
            pairMap[sym].closed += 1; 
        }
      });

      const sortedByProfit = Object.entries(pairMap).sort((a, b) => b[1].profit - a[1].profit);
      const sortedByTraded = Object.entries(pairMap).sort((a, b) => b[1].count - a[1].count);
      const sortedByWR = Object.entries(pairMap).filter(([_, d]) => d.closed > 0).sort((a, b) => (b[1].wins/b[1].closed) - (a[1].wins/a[1].closed));

      setRealStats({
        total: signals.length,
        winRate: (wins.length + losses.length) > 0 ? ((wins.length / (wins.length + losses.length)) * 100).toFixed(1) + "%" : "0%",
        totalRR: totalRR.toFixed(2) + "R",
        avgRR: closed.length > 0 ? (totalRR / closed.length).toFixed(2) + "R" : "0.00R",
        profitUSD: `$${(totalRR * riskAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        mostProfitable: sortedByProfit[0]?.[0] || "---",
        mostTraded: sortedByTraded[0]?.[0] || "---",
        highWRPair: sortedByWR[0]?.[0] || "---",
        avgDuration: "3.2h"
      });
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }

  // --- SUPABASE IMAGE PERSISTENCE ---
  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files?.[0]) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userProfile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Save the URL to the profile table
      const { error: updateError } = await supabase.from('profiles').update({ avatarUrl: publicUrl }).eq('id', userProfile.id);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
    } catch (e: any) { 
        alert("Upload Error: " + e.message);
    } finally { 
        setUploading(false); 
    }
  }

  return (
    <div className="p-4 md:p-12 max-w-[1800px] mx-auto bg-[#0b0e14] min-h-screen text-zinc-400 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-16 p-10 rounded-[3.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl gap-10 shadow-2xl">
        <div className="flex items-center gap-10">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 p-[3px] transition-all group-hover:rotate-6 shadow-2xl">
              <div className="w-full h-full rounded-[1.8rem] bg-[#0b0e14] flex items-center justify-center overflow-hidden">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User size={45} className="text-zinc-800" />}
                <div className="absolute inset-0 bg-indigo-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                  {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera size={28} className="text-white" />}
                </div>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-[#0b0e14] flex items-center justify-center shadow-xl">
              <ShieldCheck size={20} className="text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-5">
              <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">{userProfile?.fullName || 'Trader'}</h1>
              <span className="bg-indigo-600 text-white text-[11px] font-black px-4 py-1.5 rounded-full italic shadow-xl uppercase tracking-widest">Master Admin</span>
            </div>
            <p className="text-sm font-bold text-zinc-600 mt-4 tracking-[0.4em] uppercase font-mono">{userProfile?.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 items-center">
            <div className="bg-white/5 border border-white/10 p-6 px-10 rounded-[2rem] flex items-center gap-6 group hover:border-emerald-500/30 transition-all shadow-inner">
                <Wallet className="text-emerald-500" size={32} />
                <div>
                    <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest mb-1">Trading Capital</p>
                    <div className="flex items-center gap-1">
                        <span className="text-white font-black text-3xl">$</span>
                        <input type="number" value={accountSize} onChange={(e) => setAccountSize(Number(e.target.value))} className="bg-transparent text-white font-black text-3xl w-40 outline-none focus:text-emerald-400 transition-colors" />
                    </div>
                </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 px-10 rounded-[2rem] flex items-center gap-6">
                <Clock className="text-indigo-500" size={32} />
                <div>
                    <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest mb-1">Service Status</p>
                    <p className="text-white font-black text-3xl italic tracking-tighter uppercase">{daysLeft} Days Active</p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. MAIN ANALYTICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        <StatCard label="Live Signals Managed" value={realStats.total} icon={<Activity size={24}/>} />
        <StatCard label="Success Rate" value={realStats.winRate} icon={<TrendingUp size={24}/>} color="text-emerald-400" />
        <StatCard label="Accumulated R:R" value={realStats.totalRR} icon={<Zap size={24}/>} color="text-indigo-400" />
        <StatCard label="Net Profit Yield" value={realStats.profitUSD} icon={<Star size={24}/>} color="text-emerald-500" />
        
        <StatCard label="Dominant Alpha Asset" value={realStats.mostProfitable} sub="Best Edge Performance" />
        <StatCard label="High Frequency Pair" value={realStats.mostTraded} sub="Volume Concentration" />
        <StatCard label="Accuracy Leader" value={realStats.highWRPair} sub="Highest Probability Symbol" />
        <StatCard label="Engine Latency" value="Optimal" color="text-emerald-500" sub="30s Auto-Sync Enabled" />
      </div>

      {/* 3. EXPANDED DISCORD ROADMAP */}
      <div className="w-full mb-32 bg-white/[0.01] border-y border-white/5 p-20 rounded-[5rem]">
        <div className="flex items-center gap-5 text-indigo-500 mb-10">
            <div className="h-[3px] w-16 bg-indigo-500" />
            <span className="text-sm font-black uppercase tracking-[0.8em]">KIMOO CRT ENTERPRISE SOLUTIONS</span>
        </div>
        <h2 className="text-7xl md:text-9xl font-black text-white mb-24 tracking-tighter italic uppercase leading-[0.85]">
          Upgrade to the <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-500 to-purple-600">Institutional Desk.</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-40 gap-y-32">
          <FeatureItem icon={<Activity size={35}/>} title="Real-Time Ticker Visibility" desc="Gain live execution feeds. Track every pip of R:R growth as the market hits levels. See active exit progress live on a dedicated performance ticker." />
          <FeatureItem icon={<BarChart3 size={35}/>} title="Institutional Backtesting" desc="Audit symbol performance across multiple timeframes. Open the Backtest Simulator to stress-test your strategy against historical volatility." />
          <FeatureItem icon={<Target size={35}/>} title="Liquidity Diagnostics" desc="Identify symbol clustering and timing edge instantly. Inspect institutional liquidity zones and volatility behavior per asset." />
          <FeatureItem icon={<MessageSquare size={35}/>} title="Discord API Workflow" desc="Direct private signal routing to your Enterprise Discord. Turn this dashboard into a fully automated operational signal desk for your community." />
        </div>
      </div>

      {/* 4. FOOTER */}
      <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[12px] font-bold uppercase tracking-[0.8em] text-zinc-800 gap-8">
        <p>© 2026 KIMOO CRT ANALYTICS ENGINE — SYNC_V4_STABLE</p>
        <div className="flex items-center gap-5 bg-white/5 px-6 py-2 rounded-full border border-white/5"> 
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]" /> 
          <span className="text-emerald-500">Live Server Connected</span>
        </div>
      </div>
    </div>
  );
}

// --- REUSABLE UI COMPONENTS ---

function StatCard({ label, value, icon, sub, color = "text-white" }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] hover:bg-white/[0.04] transition-all group hover:border-white/10 shadow-2xl hover:-translate-y-2">
      <div className="flex justify-between items-start mb-10">
        <p className="text-[12px] font-black text-zinc-600 uppercase tracking-[0.3em]">{label}</p>
        <div className="text-zinc-800 group-hover:text-indigo-500 transition-colors transform group-hover:scale-150 duration-500">{icon}</div>
      </div>
      <p className={`text-5xl font-black italic tracking-tighter ${color} mb-3`}>{value}</p>
      {sub && <p className="text-[11px] font-bold text-zinc-800 uppercase tracking-widest">{sub}</p>}
    </div>
  );
}

function FeatureItem({ icon, title, desc }: any) {
  return (
    <div className="flex gap-12 group max-w-3xl">
      <div className="w-24 h-24 shrink-0 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xl group-hover:rotate-6 duration-500">
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <h4 className="text-white font-black uppercase italic text-3xl mb-5 group-hover:text-indigo-400 transition-colors tracking-tighter">{title}</h4>
        <p className="text-zinc-500 text-lg leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
