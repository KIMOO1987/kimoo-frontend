"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
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
    avgDuration: "---"
  });

  // 1. Fix Subscription Display Logic
  // We check the database value directly. If it says 'Ultimate', we show 'Ultimate'.
  const currentTier = userProfile?.subscriptionTier?.toUpperCase() || (isPro ? "PRO" : "FREE MEMBER");
  const daysLeft = expiryDate ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: signals } = await supabase.from('signals').select('*');
    if (!signals || signals.length === 0) return;

    const closedTrades = signals.filter(s => s.status === 'WIN' || s.status === 'LOSS');
    const wins = signals.filter(s => s.status === 'WIN').length;
    
    // Calculate R:R and Pair Performance
    let totalRR = 0;
    const pairStats: Record<string, { count: number, profit: number }> = {};

    signals.forEach(s => {
      if (!pairStats[s.symbol]) pairStats[s.symbol] = { count: 0, profit: 0 };
      pairStats[s.symbol].count += 1;

      if (s.status === 'WIN') {
        const gain = s.tp_rr || 2.0; // Use database RR if available, else 2
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

  // 2. Handle Image Upload Logic
  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userProfile.id}-${Math.random()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update User Profile in Database
      const { error: updateError } = await supabase
        .from('profiles') // Adjust if your table is named 'users'
        .update({ avatarUrl: publicUrl })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      alert("Profile picture updated!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  const showPremiumCard = currentTier !== "PRO" && currentTier !== "ULTIMATE";
  const showValuePlanCard = currentTier === "FREE MEMBER";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#0b0e14] min-h-screen text-zinc-400 font-sans selection:bg-blue-500/30">
      
      {/* 1. HEADER & PROFILE SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-white/5 gap-6">
        <div className="flex items-center gap-6">
          <div 
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-indigo-600 p-[3px] shadow-2xl transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-[1.8rem] bg-[#0f121a] flex items-center justify-center overflow-hidden relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-zinc-800" />
                )}
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                  {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera size={24} className="text-white" />}
                  <span className="text-[8px] font-black text-white mt-1 uppercase">Update</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#0b0e14] flex items-center justify-center shadow-lg">
              <ShieldCheck size={16} className="text-white" />
            </div>
            {/* Hidden Input */}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} disabled={uploading} className="hidden" accept="image/*" />
          </div>

          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                {userProfile?.fullName || 'Trader'}
              </h1>
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded italic">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[10px] font-black px-3 py-1 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-400 uppercase tracking-[0.2em]">
                {currentTier}
              </span>
              <span className="text-zinc-600 text-xs font-bold font-mono">{userProfile?.email}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0f121a] border border-white/5 px-8 py-5 rounded-3xl flex items-center gap-5 shadow-2xl group hover:border-blue-500/20 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Subscription Remaining</p>
            <p className="text-xl font-black text-white italic tracking-tight">{daysLeft} DAYS</p>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC ANALYTICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/5 border border-white/5 rounded-2xl overflow-hidden mb-8 shadow-2xl">
        <StatBox label="TOTAL SIGNALS" value={realStats.total} />
        <StatBox label="WIN RATE" value={realStats.winRate} color="text-emerald-400" />
        <StatBox label="AVG R:R" value={realStats.avgRR} />
        <StatBox label="TOTAL R:R" value={realStats.totalRR} color="text-blue-400" />
        <StatBox label="MOST PROFITABLE" value={realStats.mostProfitable} color="text-emerald-500" />
        <StatBox label="HIGHEST WR PAIR" value={realStats.mostProfitable} />
        <StatBox label="MOST TRADED" value={realStats.mostTraded} />
        <StatBox label="AVG DURATION" value={realStats.avgDuration} />
      </div>

      {/* 3. CONDITIONAL UPGRADE BANNERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
        {showPremiumCard && (
          <CTABanner icon={<Lock size={26} />} title="Unlock Premium Strategy" desc="Get the full institutional CRT signal desk & private execution tools." color="blue" />
        )}
        {showValuePlanCard && (
          <CTABanner icon={<Star size={26} />} title="Activate Best Value" desc="Save 40% on your trading fees and subscription with the yearly plan." color="emerald" />
        )}
      </div>

      {/* 4. FOOTER INFO */}
      <div className="max-w-4xl opacity-50 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-4">System Terminal v2.1.0</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
                <h4 className="text-white font-bold text-xs mb-1 italic uppercase">Server Time</h4>
                <p className="text-[10px] font-mono">{new Date().toLocaleTimeString()}</p>
            </div>
            <div>
                <h4 className="text-white font-bold text-xs mb-1 italic uppercase">Status</h4>
                <p className="text-[10px] text-emerald-500 font-mono">ENCRYPTED/LIVE</p>
            </div>
        </div>
      </div>
    </div>
  );
}

// Sub-Components
function StatBox({ label, value, color = "" }: any) {
  return (
    <div className="bg-[#0f121a] p-6 flex flex-col justify-between min-h-[120px] hover:bg-[#131721] transition-colors">
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-black tracking-tighter italic ${color || 'text-white'}`}>{value}</p>
    </div>
  );
}

function CTABanner({ icon, title, desc, color }: any) {
  const isBlue = color === 'blue';
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className={`p-10 rounded-[2.5rem] border ${isBlue ? 'border-blue-500/20 bg-blue-500/5' : 'border-emerald-500/20 bg-emerald-500/5'} flex items-center justify-between cursor-pointer group shadow-xl`}
    >
      <div className="flex items-center gap-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isBlue ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-emerald-600 shadow-[0_0_20px_rgba(5,150,105,0.4)]'} text-white`}>
          {icon}
        </div>
        <div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{title}</h3>
          <p className="text-zinc-500 text-sm font-medium mt-1">{desc}</p>
        </div>
      </div>
      <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all">
        <ArrowRight size={24} />
      </div>
    </motion.div>
  );
}
