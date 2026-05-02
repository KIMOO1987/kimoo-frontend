"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  TrendingUp, Zap, Star, Activity, BarChart3, Target, 
  ShieldCheck, Clock, Wallet, MessageSquare, Menu, X
} from 'lucide-react';

interface DashboardClientProps {
  isPro: boolean;
  expiryDate?: string | null;
  userProfile: any; 
}

export default function DashboardClient({ isPro, expiryDate, userProfile }: DashboardClientProps) {
  const [accountSize, setAccountSize] = useState(userProfile?.account_size || 100000); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [realStats, setRealStats] = useState({
    total: 0,
    winRate: "0%",
    avgRR: "0.00R",
    totalRR: "0.00R",
    profitUSD: "$0.00",
    mostProfitable: "---",
    mostTraded: "---",
    highWRPair: "---",
  });

  const daysLeft = expiryDate 
    ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
    : 0;
  
  const currentTier = (userProfile?.plan_type || userProfile?.subscription_status || "ALPHA").toUpperCase();

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
      const netR = (wins.length * 2) - losses.length; // Simplified logic for demo

      setRealStats({
        total: signals.length,
        winRate: (wins.length + losses.length) > 0 ? ((wins.length / (wins.length + losses.length)) * 100).toFixed(1) + "%" : "0%",
        totalRR: netR.toFixed(2) + "R",
        avgRR: "2.1R",
        profitUSD: `$${(netR * (accountSize * 0.01)).toLocaleString()}`,
        mostProfitable: "XAUUSD",
        mostTraded: "NAS100",
        highWRPair: "US30",
      });
    } catch (err) { console.error(err); }
  }

  return (
    <div className="flex min-h-screen  text-zinc-700 dark:text-zinc-400 font-sans overflow-x-hidden">
      
      {/* MOBILE MENU TOGGLE */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-6 left-6 z-[100] p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 w-full max-w-[100vw]">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-white/[0.02] border border-white/5 backdrop-blur-md gap-8 shadow-2xl mt-12 lg:mt-0">
          
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <h1 className="text-2xl md:text-5xl font-black text-zinc-900 dark:text-white italic uppercase tracking-tighter leading-none break-words">
                {userProfile?.full_name || 'KALIM AHMED GILL'}
              </h1>
              <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-md italic uppercase tracking-widest h-fit">
                {userProfile?.role?.toUpperCase() || 'ADMIN'}
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
              <div className="flex items-center gap-3">
                <Wallet size={20} className="text-emerald-500 shrink-0" />
                <div className="flex items-center border-b border-white/10 pb-1">
                   <span className="text-zinc-900 dark:text-white font-black text-lg md:text-2xl mr-1">$</span>
                   <input 
                     type="number" 
                     value={accountSize} 
                     onChange={(e) => setAccountSize(Number(e.target.value))} 
                     className="bg-transparent text-zinc-900 dark:text-white font-black text-lg md:text-2xl w-32 outline-none focus:text-emerald-400" 
                   />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-indigo-500 shrink-0" />
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <span className="text-zinc-900 dark:text-white font-black text-lg md:text-2xl italic uppercase">{currentTier}</span>
                    <span className="hidden md:block text-zinc-700">|</span>
                    <span className="text-zinc-600 dark:text-zinc-500 font-bold text-xs md:text-sm uppercase tracking-tighter">
                      REMAINING: <span className="text-indigo-400">{daysLeft} DAYS</span>
                    </span>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS BOX */}
          <div className="w-full xl:w-auto bg-[var(--input-bg)]/40 border border-white/10 px-6 py-4 rounded-3xl flex flex-col sm:flex-row items-center gap-4">
             <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ENGINE: ONLINE</span>
             </div>
             <div className="hidden sm:block h-6 w-[1px] bg-white/10" />
             <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight truncate max-w-[200px]">
               {userProfile?.email || 'SYSTEM@KIMOOCRT.APP'}
             </p>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          <StatCard label="Total Signals" value={realStats.total} icon={<Activity size={18}/>} />
          <StatCard label="Win Rate" value={realStats.winRate} icon={<TrendingUp size={18}/>} color="text-emerald-400" />
          <StatCard label="Total R:R" value={realStats.totalRR} icon={<Zap size={18}/>} color="text-indigo-400" />
          <StatCard label="Profit" value={realStats.profitUSD} icon={<Star size={18}/>} color="text-emerald-500" />
        </div>

        {/* ROADMAP / FEATURES */}
        <div className="w-full border-t border-white/5 pt-12 mb-20">
          <h2 className="text-3xl md:text-6xl font-black text-zinc-900 dark:text-white mb-12 tracking-tighter italic uppercase leading-tight">
            Institutional <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">CRT Intelligence.</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            <FeatureItem title="Live Visibility" desc="Track R:R growth in real-time as market hits levels." />
            <FeatureItem title="Strategy Validation" desc="Audit symbol performance across timeframes." />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color = "text-zinc-900 dark:text-white" }: any) {
  return (
    <div className="bg-white/[0.03] border border-white/5 p-6 md:p-8 rounded-[2rem] shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
        <div className="text-zinc-600 dark:text-zinc-500">{icon}</div>
      </div>
      <p className={`text-2xl md:text-4xl font-black italic tracking-tighter ${color}`}>{value}</p>
    </div>
  );
}

function FeatureItem({ title, desc }: any) {
  return (
    <div className="flex flex-col gap-2 p-6 rounded-3xl bg-white/[0.01] border border-white/5">
      <h4 className="text-zinc-900 dark:text-white font-black uppercase italic text-lg md:text-xl tracking-tighter">{title}</h4>
      <p className="text-zinc-600 dark:text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
