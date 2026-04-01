"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Zap, 
  Star,
  Activity,
  BarChart3,
  Target,
  MousePointer2,
  Send,
  Lock,
  User,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DashboardClientProps {
  isPro: boolean;
  expiryDate?: string | null;
  userProfile: {
    fullName: string;
    email: string;
    subscriptionTier?: string; 
    avatarUrl?: string; 
  };
}

export default function DashboardClient({ isPro, expiryDate, userProfile }: DashboardClientProps) {
  const [stats, setStats] = useState({
    total: 0,
    winRate: "0%",
    avgRR: "+0.24R", // Placeholder for logic
    totalRR: "+27.38R", // Placeholder for logic
  });

  // Calculate Days Remaining
  const daysLeft = (() => {
    if (!expiryDate) return 0;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  useEffect(() => {
    const fetchRealStats = async () => {
      // 1. Get Total Signals
      const { count } = await supabase.from('signals').select('*', { count: 'exact', head: true });
      
      // 2. Calculate Win Rate from closed signals
      const { data: winData } = await supabase.from('signals').select('status');
      const wins = winData?.filter(s => s.status === 'WIN').length || 0;
      const totalClosed = winData?.filter(s => s.status !== 'PENDING').length || 0;
      const wr = totalClosed > 0 ? ((wins / totalClosed) * 100).toFixed(1) : "0";

      setStats(prev => ({
        ...prev,
        total: count || 0,
        winRate: `${wr}%`,
      }));
    };

    fetchRealStats();
  }, []);

  // --- HIDE/SHOW LOGIC ---
  const currentTier = userProfile.subscriptionTier?.toLowerCase() || 'free';
  
  // Show "Premium Strategy" card if NOT Pro and NOT Ultimate (shows for Free and Alpha)
  const showPremiumCard = currentTier !== 'pro' && currentTier !== 'ultimate';
  
  // Show "Best Value Plan" card ONLY if they have no subscription (Free)
  const showValuePlanCard = currentTier === 'free' || !userProfile.subscriptionTier;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#0b0e14] min-h-screen text-zinc-400 font-sans selection:bg-blue-500/30">
      
      {/* 1. USER PROFILE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-white/5 gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[2px]">
              <div className="w-full h-full rounded-[14px] bg-[#0f121a] flex items-center justify-center overflow-hidden text-zinc-500">
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} />
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0b0e14] flex items-center justify-center shadow-lg">
              <ShieldCheck size={12} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase italic">{userProfile.fullName || 'Trader'}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${isPro ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' : 'text-zinc-500 border-zinc-500/20 bg-zinc-500/10'} uppercase`}>
                {userProfile.subscriptionTier || 'Free Member'}
              </span>
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{userProfile.email}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0f121a] border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Active Time</p>
            <p className="text-sm font-black text-white italic uppercase tracking-tighter">
              {daysLeft} Days <span className="text-zinc-500 not-italic ml-1 font-bold">Remaining</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. ANALYTICS GRID (Real Data Integrated) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/5 border border-white/5 rounded-xl overflow-hidden mb-6 shadow-2xl">
        <StatItem label="TOTAL SIGNALS" value={stats.total.toString()} />
        <StatItem label="WIN RATE" value={stats.winRate} />
        <StatItem label="AVG R:R" value={stats.avgRR} />
        <StatItem label="TOTAL R:R" value={stats.totalRR} />
        <StatItem label="MOST PROFITABLE" value="BCHUSDT" sub="+9.00R" color="text-emerald-400" />
        <StatItem label="HIGH WR PAIR" value="BCHUSDT" sub="100.0%" color="text-emerald-400" />
        <StatItem label="MOST TRADED" value="APTUSDT" sub="11 trades" />
        <StatItem label="AVG DURATION" value="3.2h" sub="Market Filter Active" />
      </div>

      {/* 3. CONDITIONAL CTA CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-16">
        {showPremiumCard && (
          <CTABanner 
            icon={<Lock size={24} fill="currentColor" />}
            title="Unlock Premium Strategy Access"
            desc="Open the full terminal, execution tools, and hidden analytics now."
            color="blue"
          />
        )}
        {showValuePlanCard && (
          <CTABanner 
            icon={<Star size={24} fill="currentColor" />}
            title="Activate the Best Value Plan"
            desc="Jump straight into the strongest premium offer with one click."
            color="emerald"
          />
        )}
      </div>

      {/* 4. FEATURE GRID */}
      <div className="max-w-5xl">
        <div className="flex items-center gap-3 text-amber-500 mb-4">
            <div className="h-px w-8 bg-amber-500/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Premium Upgrade Path</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter italic">
          Turn this preview into a <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">full execution terminal.</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 mt-12">
          <FeatureItem icon={<Activity className="text-blue-500" size={20} />} title="Live execution visibility" desc="See every active trade, live R:R development, exit progress, and recent closed positions." />
          <FeatureItem icon={<BarChart3 className="text-blue-500" size={20} />} title="Strategy-grade validation" desc="Open Backtest Simulator, Symbol Audit, and Risk Command to validate the edge." />
          <FeatureItem icon={<MousePointer2 className="text-blue-500" size={20} />} title="Radar + diagnostics" desc="Inspect symbol clustering, timing edge, volatility behavior, and key-level performance." />
          <FeatureItem icon={<Send className="text-blue-500" size={20} />} title="Private Telegram workflow" desc="Route filtered premium signals directly to your Telegram desk." />
        </div>
      </div>
    </div>
  );
}

// Support UI Components
function StatItem({ label, value, sub, color = "" }: any) {
  return (
    <div className="bg-[#0f121a] p-5 flex flex-col justify-between min-h-[105px] hover:bg-[#161a23] transition-colors border-r border-b border-white/5 last:border-0">
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
      <div>
        <p className={`text-xl font-black text-zinc-100 tracking-tight ${color}`}>{value}</p>
        {sub && <p className={`text-[11px] font-bold ${color || 'text-zinc-600'}`}>{sub}</p>}
      </div>
    </div>
  );
}

function CTABanner({ icon, title, desc, color }: any) {
  const isBlue = color === 'blue';
  return (
    <motion.button 
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden bg-gradient-to-br ${isBlue ? 'from-blue-600/20' : 'from-emerald-600/20'} to-[#0f121a] border ${isBlue ? 'border-blue-500/30' : 'border-emerald-500/30'} p-8 rounded-[2rem] flex items-center justify-between text-left group shadow-xl`}
    >
      <div className="flex items-center gap-6 relative z-10">
        <div className={`w-14 h-14 rounded-2xl ${isBlue ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'} flex items-center justify-center border border-current opacity-80 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <h3 className="text-white font-black text-xl tracking-tight mb-1 uppercase italic">{title}</h3>
          <p className={`${isBlue ? 'text-blue-200/40' : 'text-emerald-200/40'} text-xs font-medium max-w-sm`}>{desc}</p>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 group-hover:bg-zinc-100 group-hover:text-black transition-all">
        <ArrowRight size={20} />
      </div>
    </motion.button>
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
