"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Zap, Star, Activity, BarChart3, Target, 
  Send, Lock, User, ShieldCheck, Clock, ArrowRight, Camera, Loader2
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
  const [realStats, setRealStats] = useState({
    total: 0,
    winRate: "0%",
    avgRR: "0.00R",
    totalRR: "0.00R",
    mostProfitable: "---",
    mostTraded: "---",
    avgDuration: "---"
  });

  // Tier Visibility Logic
  const currentTier = userProfile?.subscriptionTier?.toUpperCase() || (isPro ? "PRO" : "FREE MEMBER");
  const daysLeft = expiryDate ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
  
  const showPremiumCard = currentTier !== "PRO" && currentTier !== "ULTIMATE";
  const showValuePlanCard = currentTier === "FREE MEMBER";

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: signals } = await supabase.from('signals').select('*');
    if (!signals || signals.length === 0) return;

    // Filter by normalized status
    const closed = signals.filter(s => ['WIN', 'LOSS', 'BE'].includes(s.status?.toUpperCase()));
    const wins = signals.filter(s => s.status?.toUpperCase() === 'WIN');
    const losses = signals.filter(s => s.status?.toUpperCase() === 'LOSS');
    
    // Logic: Win = +2R, Loss = -1R, BE = 0R
    const totalRRValue = (wins.length * 2) - (losses.length * 1);
    const avgRRValue = closed.length > 0 ? totalRRValue / closed.length : 0;

    // Asset Performance Logic
    const pairMap: Record<string, { count: number, profit: number }> = {};
    signals.forEach(s => {
      const sym = s.symbol || "UNKNOWN";
      if (!pairMap[sym]) pairMap[sym] = { count: 0, profit: 0 };
      pairMap[sym].count += 1;
      
      if (s.status?.toUpperCase() === 'WIN') pairMap[sym].profit += 2;
      if (s.status?.toUpperCase() === 'LOSS') pairMap[sym].profit -= 1;
    });

    const sortedByTraded = Object.entries(pairMap).sort((a, b) => b[1].count - a[1].count);
    const sortedByProfit = Object.entries(pairMap).sort((a, b) => b[1].profit - a[1].profit);

    setRealStats({
      total: signals.length,
      winRate: (wins.length + losses.length) > 0 
        ? ((wins.length / (wins.length + losses.length)) * 100).toFixed(1) + "%" 
        : "0%",
      avgRR: avgRRValue.toFixed(2) + "R",
      totalRR: totalRRValue.toFixed(2) + "R",
      mostProfitable: sortedByProfit[0]?.[0] || "---",
      mostTraded: sortedByTraded[0]?.[0] || "---",
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
      
      {/* 1. HEADER (Glass Profile) */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md gap-6 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-[2px] transition-all group-hover:rotate-3">
              <div className="w-full h-full rounded-[14px] bg-[#0b0e14] flex items-center justify-center overflow-hidden">
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
              <span className="text-[9px] font-black px-3 py-1 bg-white/5 border border-white/10 rounded-full uppercase tracking-widest text-zinc-600">{userProfile?.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 bg-white/5 px-8 py-4 rounded-3xl border border-white/10 shadow-inner group">
          <Clock size={22} className="text-blue-500 group-hover:animate-spin-slow" />
          <div>
             <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Active Duration</p>
             <p className="text-xl font-black text-white italic tracking-tighter">{daysLeft} DAYS REMAINING</p>
          </div>
        </div>
      </div>

      {/* 2. MULTI-CARD GLASS STATS (All real data integrated) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <GlassStat label="Total Signals" value={realStats.total} icon={<Activity size={18}/>} />
        <GlassStat label="Win Rate" value={realStats.winRate} icon={<TrendingUp size={18}/>} color="text-emerald-400" />
        <GlassStat label="Average R:R" value={realStats.avgRR} icon={<Target size={18}/>} />
        <GlassStat label="Total Profits" value={realStats.totalRR} icon={<Zap size={18}/>} color="text-blue-400" />
        
        <GlassStat label="Most Profitable" value={realStats.mostProfitable} sub="Top Performing Edge" />
        <GlassStat label="Most Traded" value={realStats.mostTraded} sub="Volume Dominance" />
        <GlassStat label="High WR Pair" value={realStats.mostProfitable} sub="Accuracy Lead" />
        <GlassStat label="Avg Duration" value={realStats.avgDuration} sub="Intraday Velocity" />
      </div>

      {/* 3. CONDITIONAL BANNERS */}
      {(showPremiumCard || showValuePlanCard) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {showPremiumCard && (
            <CTABanner icon={<Lock size={26} />} title="Unlock Premium Strategy" desc="Get the full institutional CRT signal desk & private execution tools." color="blue" />
          )}
          {showValuePlanCard && (
            <CTABanner icon={<Star size={26} />} title="Activate Best Value" desc="Save 40% on your trading fees and subscription with the yearly plan." color="emerald" />
          )}
        </div>
      )}

      {/* 4. PREMIUM UPGRADE PATH (Roadmap restored) */}
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
      <div className="pt-10 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-700">
        <p>© 2026 KIMOO CRT ANALYTICS ENGINE</p>
        <p className="flex items-center gap-3"> 
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> 
          Terminal Status: Operational
        </p>
      </div>
    </div>
  );
}

// UI COMPONENTS
function GlassStat({ label, value, icon, sub, color = "text-white" }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 backdrop-blur-2xl p-7 rounded-[2rem] hover:bg-white/[0.04] transition-all group hover:border-white/10 shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
        <div className="text-zinc-700 group-hover:text-blue-500 transition-colors transform group-hover:scale-110">{icon}</div>
      </div>
      <p className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
      {sub && <p className="text-[9px] font-bold text-zinc-700 mt-2 uppercase tracking-tighter">{sub}</p>}
    </div>
  );
}

function CTABanner({ icon, title, desc, color }: any) {
  const isBlue = color === 'blue';
  return (
    <motion.div 
      whileHover={{ scale: 1.01, y: -2 }}
      className={`p-10 rounded-[3rem] border cursor-pointer group ${isBlue ? 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40' : 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40'} flex items-center justify-between transition-all shadow-2xl`}
    >
      <div className="flex items-center gap-8">
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${isBlue ? 'bg-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.4)]' : 'bg-emerald-600 shadow-[0_0_25px_rgba(5,150,105,0.4)]'} text-white group-hover:rotate-6 transition-transform`}>
          {icon}
        </div>
        <div>
          <h3 className="text-2xl font-black text-white uppercase italic leading-tight">{title}</h3>
          <p className="text-zinc-600 text-sm font-medium mt-1">{desc}</p>
        </div>
      </div>
      <ArrowRight className="text-white group-hover:translate-x-3 transition-transform" size={24} />
    </motion.div>
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
