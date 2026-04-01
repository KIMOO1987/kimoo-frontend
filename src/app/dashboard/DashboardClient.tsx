"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Zap, Star, Activity, BarChart3, Target, 
  Lock, User, ShieldCheck, Clock, ArrowRight, Camera, Loader2, Wallet, MessageSquare
} from 'lucide-react';

interface DashboardClientProps {
  isPro: boolean;
  expiryDate?: string | null;
  userProfile: any; 
}

export default function DashboardClient({ isPro, expiryDate, userProfile }: DashboardClientProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // This state now looks for the new 'avatar_url' column we just created
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || null);
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

  // --- AUTO REFRESH (30S) ---
  useEffect(() => {
    fetchData(); 
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, [accountSize]);

  async function fetchData() {
    try {
      const { data: signals } = await supabase.from('signals').select('*');
      if (!signals || signals.length === 0) return;

      const wins = signals.filter(s => s.status?.toUpperCase().includes('TP'));
      const losses = signals.filter(s => s.status?.toUpperCase() === 'SL');
      const be = signals.filter(s => s.status?.toUpperCase().includes('BE'));
      const closed = [...wins, ...losses, ...be];

      const riskAmount = accountSize * 0.01; 
      let totalRR = 0;
      const pairMap: Record<string, { count: number, profit: number, wins: number, closed: number }> = {};

      signals.forEach(s => {
        const sym = s.symbol || "---";
        if (!pairMap[sym]) pairMap[sym] = { count: 0, profit: 0, wins: 0, closed: 0 };
        pairMap[sym].count += 1;

        const status = s.status?.toUpperCase() || "";
        if (status.includes('TP2')) { totalRR += 2; pairMap[sym].profit += 2; pairMap[sym].wins += 1; pairMap[sym].closed += 1; }
        else if (status.includes('TP1') && !status.includes('BE')) { totalRR += 1; pairMap[sym].profit += 1; pairMap[sym].wins += 1; pairMap[sym].closed += 1; }
        else if (status === 'SL') { totalRR -= 1; pairMap[sym].profit -= 1; pairMap[sym].closed += 1; }
        else if (status.includes('BE')) { pairMap[sym].closed += 1; }
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
    } catch (err) { console.error(err); }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files?.[0]) return;
      
      const file = event.target.files[0];
      const filePath = `avatars/${userProfile.id}-${Date.now()}.${file.name.split('.').pop()}`;

      // 1. Storage Upload
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // 3. Database Save (to the column you just added)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl }) 
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      // 4. Update UI
      setAvatarUrl(publicUrl);
      
    } catch (e: any) { 
      alert("Error: " + e.message); 
    } finally { 
      setUploading(false); 
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto bg-[#0b0e14] min-h-screen text-zinc-400 font-sans">
      
      {/* 1. HEADER - Original Size, Maximum Spread */}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-10 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md gap-6 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] group-hover:rotate-3 transition-all">
              <div className="w-full h-full rounded-[14px] bg-[#0b0e14] flex items-center justify-center overflow-hidden">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User size={30} className="text-zinc-800" />}
                <div className="absolute inset-0 bg-indigo-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
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
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{userProfile?.fullName || 'Trader'}</h1>
              <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded italic uppercase tracking-widest">ADMIN</span>
            </div>
            <p className="text-[10px] font-bold text-zinc-600 mt-2 tracking-[0.3em] uppercase">{userProfile?.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
            <div className="bg-white/5 border border-white/10 p-4 px-6 rounded-2xl flex items-center gap-4 transition-all">
                <Wallet className="text-emerald-500" size={24} />
                <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Capital</p>
                    <div className="flex items-center gap-1">
                        <span className="text-white font-black text-xl">$</span>
                        <input type="number" value={accountSize} onChange={(e) => setAccountSize(Number(e.target.value))} className="bg-transparent text-white font-black text-xl w-28 outline-none focus:text-emerald-400" />
                    </div>
                </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 px-6 rounded-2xl flex items-center gap-4">
                <Clock className="text-indigo-500" size={24} />
                <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Access</p>
                    <p className="text-white font-black text-xl italic uppercase">{daysLeft} Days</p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. STATS GRID - Original Proportion, Spread out */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard label="Total Signals" value={realStats.total} icon={<Activity size={18}/>} />
        <StatCard label="Win Rate" value={realStats.winRate} icon={<TrendingUp size={18}/>} color="text-emerald-400" />
        <StatCard label="Total R:R" value={realStats.totalRR} icon={<Zap size={18}/>} color="text-indigo-400" />
        <StatCard label="Net Profit" value={realStats.profitUSD} icon={<Star size={18}/>} color="text-emerald-500" />
        
        <StatCard label="Most Profitable" value={realStats.mostProfitable} sub="Alpha Asset" />
        <StatCard label="Most Traded" value={realStats.mostTraded} sub="Volume focus" />
        <StatCard label="High WR Symbol" value={realStats.highWRPair} sub="Accuracy Lead" />
        <StatCard label="Engine" value="Live" color="text-emerald-500" sub="Synced" />
      </div>

      {/* 3. ROADMAP - Filling the empty area via spacing */}
      <div className="w-full mb-24 border-t border-white/5 pt-16">
        <div className="flex items-center gap-3 text-indigo-500 mb-6">
            <div className="h-[2px] w-10 bg-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">KIMOO CRT PREMIUM ROADMAP</span>
        </div>
        <h2 className="text-5xl font-black text-white mb-16 tracking-tighter italic uppercase leading-none">
          Build your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600 text-6xl">Execution Terminal.</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-16">
          <FeatureItem icon={<Activity size={24}/>} title="Live Execution Visibility" desc="Track R:R growth in real-time as market hits levels. See active exit progress live on performance ticker." />
          <FeatureItem icon={<BarChart3 size={24}/>} title="Strategy-Grade Validation" desc="Audit symbol performance across multiple timeframes. Open the Simulator to stress-test your strategy." />
          <FeatureItem icon={<Target size={24}/>} title="Radar + Diagnostics" desc="Identify symbol clustering and timing edge instantly. Inspect institutional liquidity zones." />
          <FeatureItem icon={<MessageSquare size={24}/>} title="Discord API Workflow" desc="Route filtered premium signals directly to your Private Discord. Turn dashboard into an operational desk." />
        </div>
      </div>

      {/* 4. FOOTER */}
      <div className="pt-10 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-700">
        <p>© 2026 KIMOO CRT ENGINE</p>
        <p className="flex items-center gap-3"> 
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> 
          Server Status: Online
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub, color = "text-white" }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 backdrop-blur-2xl p-7 rounded-[2rem] hover:bg-white/[0.04] transition-all group shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
        <div className="text-zinc-700 group-hover:text-indigo-500 transition-colors transform group-hover:scale-110">{icon}</div>
      </div>
      <p className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
      {sub && <p className="text-[9px] font-bold text-zinc-800 mt-2 uppercase tracking-tighter">{sub}</p>}
    </div>
  );
}

function FeatureItem({ icon, title, desc }: any) {
  return (
    <div className="flex gap-6 group">
      <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-black uppercase italic text-xl mb-2 group-hover:text-indigo-400 transition-colors">{title}</h4>
        <p className="text-zinc-500 text-sm leading-relaxed font-medium max-w-md">{desc}</p>
      </div>
    </div>
  );
}
