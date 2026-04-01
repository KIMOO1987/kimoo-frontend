"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  Zap, 
  Shield, 
  ArrowRight, 
  Star,
  Activity,
  BarChart3,
  Target,
  MousePointer2,
  Send,
  Lock
} from 'lucide-react';

interface DashboardClientProps {
  isPro: boolean;
  expiryDate?: string | null;
  userProfile: {
    fullName: string;
    subscriptionTier?: string; 
  };
}

export default function DashboardClient({ isPro, expiryDate, userProfile }: DashboardClientProps) {
  const [signalCount, setSignalCount] = useState(0);

  // Fetch real count from Supabase to keep the "Total Signals" accurate
  useEffect(() => {
    const getStats = async () => {
      const { count } = await supabase
        .from('signals')
        .select('*', { count: 'exact', head: true });
      if (count) setSignalCount(count);
    };
    getStats();
  }, []);

  // Structural Stats matching your screenshot layout
  const stats = [
    { label: "TOTAL SIGNALS", value: signalCount > 0 ? signalCount.toString() : "113", icon: null },
    { label: "WIN RATE", value: "53.1% (23W / 53L / 37BE)", icon: null },
    { label: "AVG R:R", value: "+0.24R", icon: null },
    { label: "TOTAL R:R", value: "+27.38R", icon: null },
    { label: "MOST PROFITABLE PAIR", value: "BCHUSDT", sub: "+9.00R", color: "text-emerald-400" },
    { label: "HIGHEST WIN RATE PAIR", value: "BCHUSDT", sub: "100.0%", color: "text-emerald-400" },
    { label: "MOST TRADED PAIR", value: "APTUSDT", sub: "11 trades" },
    { label: "AVG DURATION", value: "3.2h", sub: "Selected keylevels filter" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#0b0e14] min-h-screen text-zinc-400 font-sans selection:bg-blue-500/30">
      
      {/* 1. TOP ANALYTICS GRID - 8 BOXES */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-[1px] bg-white/5 border border-white/5 rounded-xl overflow-hidden mb-6 shadow-2xl">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#0f121a] p-4 flex flex-col justify-between min-h-[100px] hover:bg-[#161a23] transition-colors">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">{stat.label}</p>
            <div>
              <p className={`text-xl font-black text-zinc-100 tracking-tight ${stat.color || ''}`}>{stat.value}</p>
              {stat.sub && <p className={`text-[11px] font-bold ${stat.color || 'text-zinc-500'}`}>{stat.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* 2. MIDDLE HIGHLIGHT CARDS (3 COLUMN) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0f121a] border border-white/5 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Highest Win Streak</p>
          <p className="text-5xl font-black text-white italic">10</p>
        </div>

        <div className="bg-[#0f121a] border border-white/5 p-6 rounded-2xl shadow-lg group">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Best Week</p>
          <p className="text-4xl font-black text-white uppercase tracking-tighter">
            2026-W14 <span className="text-emerald-500 ml-2">(+35.30R)</span>
          </p>
        </div>

        <div className="bg-[#0f121a] border border-white/5 p-6 rounded-2xl shadow-lg group">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Top Symbol Edge</p>
          <p className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            AAVEUSDT <span className="text-blue-500 text-2xl font-bold">(+1.16R)</span>
          </p>
        </div>
      </div>

      {/* 3. CALL TO ACTION BUTTONS (The Two Large Banners) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-16">
        <motion.button 
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600/30 to-[#0f121a] border border-blue-500/30 p-8 rounded-[2rem] flex items-center justify-between text-left group shadow-xl"
        >
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Lock size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tight mb-1">Unlock Premium Strategy Access</h3>
              <p className="text-blue-200/50 text-xs font-medium max-w-sm">Open the full terminal, execution tools, and hidden analytics now.</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 group-hover:bg-blue-500 transition-all">
            <ArrowRight size={20} />
          </div>
        </motion.button>

        <motion.button 
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-600/30 to-[#0f121a] border border-emerald-500/30 p-8 rounded-[2rem] flex items-center justify-between text-left group shadow-xl"
        >
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tight mb-1">Activate the Best Value Plan</h3>
              <p className="text-emerald-200/50 text-xs font-medium max-w-sm">Jump straight into the strongest premium offer with one click.</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 group-hover:bg-emerald-500 transition-all">
            <ArrowRight size={20} />
          </div>
        </motion.button>
      </div>

      {/* 4. UPGRADE PATH / FEATURE LIST SECTION */}
      <div className="max-w-5xl">
        <div className="flex items-center gap-3 text-amber-500 mb-4">
            <div className="h-px w-8 bg-amber-500/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Premium Upgrade Path</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter italic">
          Turn this free preview into a <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">full execution terminal.</span>
        </h2>
        <p className="text-zinc-500 text-sm md:text-base mb-16 max-w-3xl leading-relaxed font-medium">
          The system is already surfacing <span className="text-zinc-300 font-bold">{signalCount || '113'} completed signals</span> and a <span className="text-zinc-300 font-bold">53.1% win rate profile</span>. 
          Premium opens the full symbol list, execution path, and validation tools behind that edge.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          <FeatureItem 
            icon={<Activity className="text-blue-500" size={20} />} 
            title="Live execution visibility" 
            desc="See every active trade, live R:R development, exit progress, and recent closed positions without waiting for a teaser refresh." 
          />
          <FeatureItem 
            icon={<BarChart3 className="text-blue-500" size={20} />} 
            title="Strategy-grade validation" 
            desc="Open Backtest Simulator, Symbol Audit, WoE Analytics, and Risk Command to validate the edge before you commit capital." 
          />
          <FeatureItem 
            icon={<MousePointer2 className="text-blue-500" size={20} />} 
            title="Radar + diagnostics" 
            desc="Inspect symbol clustering, timing edge, volatility behavior, and key-level performance instead of trading from a single summary card." 
          />
          <FeatureItem 
            icon={<Send className="text-blue-500" size={20} />} 
            title="Private Telegram workflow" 
            desc="Route filtered premium signals directly to your Telegram, connect exchange referral premium, and turn the dashboard into an operational signal desk." 
          />
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-600">
        <p>© KIMOO CRT ANALYTICS ENGINE 2026</p>
        <p>INTERNAL ACCESS ONLY</p>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-5 group">
      <div className="mt-1 w-12 h-12 shrink-0 bg-[#161a23] border border-white/5 rounded-2xl flex items-center justify-center group-hover:border-blue-500/30 transition-colors shadow-lg">
        {icon}
      </div>
      <div>
        <h4 className="text-zinc-100 font-black text-lg tracking-tight mb-2 uppercase italic">{title}</h4>
        <p className="text-zinc-500 text-xs md:text-sm leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
