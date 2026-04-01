"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Zap, Star, Activity, BarChart3, Target, 
  MousePointer2, Send, Lock, User, ShieldCheck, Clock, ArrowRight, Camera, Loader2
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
    avgDuration: "3.2h"
  });

  // Logic for Tiers and Visibility
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

    const closedTrades = signals.filter(s => s.status === 'WIN' || s.status === 'LOSS');
    const wins = signals.filter(s => s.status === 'WIN').length;
    
    let totalRR = 0;
    const pairStats: Record<string, { count: number, profit: number }> = {};

    signals.forEach(s => {
      if (!pairStats[s.symbol]) pairStats[s.symbol] = { count: 0, profit: 0 };
      pairStats[s.symbol].count += 1;

      if (s.status === 'WIN') {
        const gain = s.tp_rr || 2.0; 
        totalRR += gain;
        pairStats[s.symbol].profit += gain;
      } else if (s.status === 'LOSS') {
        totalRR -= 1.0;
        pairStats[s.symbol].profit -= 1.0;
      }
    });

    const sortedByCount = Object.entries(pairStats).sort((a, b) => b[1].count - a[1].count);
    const sortedByProfit = Object.entries(pairStats).sort((a, b) => b[1].profit - a[1].profit);

    setRealStats({
      total: signals.length,
      winRate: closedTrades.length > 0 ? ((wins / closedTrades.length) * 100).toFixed(1) + "%" : "0%",
      avgRR: closedTrades.length > 0 ? (totalRR / closedTrades.length).toFixed(2) + "R" : "0.00R",
      totalRR: totalRR.toFixed(2) + "R",
      mostProfitable: sortedByProfit[0]?.[0] || "---",
      mostTraded: sortedByCount[0]?.[0] || "---",
      avgDuration: "3.2h" 
    });
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userProfile.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatarUrl: publicUrl }).eq('id', userProfile.id);

      setAvatarUrl(publicUrl);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#0b0e14] min-h-screen text-zinc-400 font-sans selection:bg-blue-500/30">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-white/5 gap-6">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[2px]">
              <div className="w-full h-full rounded-[14px] bg-[#0f121a] flex items-center justify-center overflow-hidden relative">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User size={32} className="text-zinc-800" />}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-[#0b0e14] flex items-center justify-center shadow-lg">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">{userProfile?.fullName || 'Trader'}</h1>
               {userProfile?.email === 'your-admin-email@gmail.com' && (
                 <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded italic">ADMIN</span>
               )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-black px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">{currentTier}</span>
              <span className="text-zinc-600 text-xs font-bold">{userProfile?.email}</span>
            </div>
          </div>
        </div>
        <div className="bg-[#0f121a] border border-white/5 px-8 py-4 rounded-2xl flex items-center gap-4 shadow-xl">
          <Clock size={20} className="text-blue-500" />
          <div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Subscription Life</p>
            <p className="text-lg font-black text-white italic">{daysLeft} Days Remaining</p>
          </div>
        </div>
      </div>

      {/* 2. ANALYTICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/5 border border-white/5 rounded-xl overflow-hidden mb-8 shadow-2xl">
        <StatBox label="TOTAL SIGNALS" value={realStats.total} />
        <StatBox label="WIN RATE" value={realStats.winRate} color="text-emerald-400" />
        <StatBox label="AVG R:R" value={realStats.avgRR} />
        <StatBox label="TOTAL R:R" value={realStats.totalRR} color="text-blue-400" />
        <StatBox label="MOST PROFITABLE" value={realStats.mostProfitable} color="text-emerald-500" />
        <StatBox label="HIGH WR PAIR" value={realStats.mostProfitable} />
        <StatBox label="MOST TRADED" value={realStats.mostTraded} />
        <StatBox label="AVG DURATION" value={realStats.avgDuration} />
      </div>

      {/* 3. CONDITIONAL CTA CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
        {showPremiumCard && (
          <CTABanner icon={<Lock size={24} />} title="Unlock Premium Strategy" desc="Get full CRT signals and institutional execution tools." color="blue" />
        )}
        {showValuePlanCard && (
          <CTABanner icon={<Star size={24} />} title="Best Value Plan" desc="Save 40% with the yearly ultimate license." color="emerald" />
        )}
      </div>

      {/* 4. PREMIUM UPGRADE PATH SECTION */}
      <div className="max-w-5xl mb-20">
        <div className="flex items-center gap-3 text-amber-500 mb-4">
            <div className="h-px w-8 bg-amber-500/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Premium Upgrade Path</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter italic uppercase">
          Turn this preview into a <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 text-6xl">full execution terminal.</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 mt-12">
          <FeatureItem icon={<Activity className="text-blue-500" size={20} />} title="Live execution visibility" desc="See every active trade, live R:R development, exit progress, and recent closed positions." />
          <FeatureItem icon={<BarChart3 className="text-blue-500" size={20} />} title="Strategy-grade validation" desc="Open Backtest Simulator, Symbol Audit, and Risk Command to validate the edge." />
          <FeatureItem icon={<Target className="text-blue-500" size={20} />} title="Radar + diagnostics" desc="Inspect symbol clustering, timing edge, volatility behavior, and key-level performance." />
          <FeatureItem icon={<Send className="text-blue-500" size={20} />} title="Private Telegram workflow" desc="Route filtered premium signals directly to your Telegram desk." />
        </div>
      </div>

      {/* 5. FOOTER */}
      <div className="pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-600">
        <p>© KIMOO CRT ANALYTICS ENGINE 2026</p>
        <p className="flex items-center gap-2"> <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Terminal Status: Optimal</p>
      </div>
    </div>
  );
}

function StatBox({ label, value, color = "" }: any) {
  return (
    <div className="bg-[#0f121a] p-6 flex flex-col justify-between min-h-[110px] hover:bg-[#151922] transition-colors">
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-black tracking-tighter italic ${color || 'text-white'}`}>{value}</p>
    </div>
  );
}

function CTABanner({ icon, title, desc, color }: any) {
  const isBlue = color === 'blue';
  return (
    <div className={`p-8 rounded-[2rem] border cursor-pointer group ${isBlue ? 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10' : 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'} flex items-center justify-between transition-all`}>
      <div className="flex items-center gap-6">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isBlue ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-emerald-600 shadow-[0_0_15px_rgba(5,150,105,0.3)]'} text-white group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <h3 className="text-white font-black text-xl uppercase italic leading-tight">{title}</h3>
          <p className="text-zinc-500 text-xs mt-1">{desc}</p>
        </div>
      </div>
      <ArrowRight className="text-white group-hover:translate-x-2 transition-transform" />
    </div>
  );
}

function FeatureItem({ icon, title, desc }: any) {
  return (
    <div className="flex gap-5 group">
      <div className="mt-1 w-12 h-12 shrink-0 bg-[#161a23] border border-white/5 rounded-2xl flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
        {icon}
      </div>
      <div>
        <h4 className="text-zinc-100 font-black text-lg tracking-tight mb-2 uppercase italic leading-none">{title}</h4>
        <p className="text-zinc-500 text-xs md:text-sm leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
