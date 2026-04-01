"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  TrendingUp, Zap, Star, Activity, BarChart3, Target, 
  ShieldCheck, Clock, Wallet, MessageSquare, Play, RotateCcw
} from 'lucide-react';

interface DashboardClientProps {
  isPro: boolean;
  expiryDate?: string | null;
  userProfile: any; 
}

export default function DashboardClient({ isPro, expiryDate, userProfile }: DashboardClientProps) {
  const [accountSize, setAccountSize] = useState(userProfile?.account_size || 100000); 
  const [isSimulating, setIsSimulating] = useState(false);
  
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
      });

      const sortedByProfit = Object.entries(pairMap).sort((a, b) => b[1].profit - a[1].profit);
      const sortedByTraded = Object.entries(pairMap).sort((a, b) => b[1].count - a[1].count);

      setRealStats({
        total: signals.length,
        winRate: (wins.length + losses.length) > 0 ? ((wins.length / (wins.length + losses.length)) * 100).toFixed(1) + "%" : "0%",
        totalRR: totalRR.toFixed(2) + "R",
        avgRR: "0.00R", // Simplified for this view
        profitUSD: `$${(totalRR * riskAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        mostProfitable: sortedByProfit[0]?.[0] || "---",
        mostTraded: sortedByTraded[0]?.[0] || "---",
        highWRPair: "---",
        avgDuration: "3.2h"
      });
    } catch (err) { console.error("Sync Error:", err); }
  }

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 2000);
  };

  return (
    <div className="p-6 md:p-12 lg:p-16 bg-[#05070a] min-h-screen text-white font-sans overflow-x-hidden">
      <div className="max-w-[1700px] mx-auto">
        
        {/* NEW HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase">
              Client<span className="text-blue-500">Dashboard</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-bold mt-3 leading-none">
              Real-Time Equity Simulation • KIMOO CRT Engine
            </p>
          </div>
          <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black italic tracking-widest transition-all shadow-xl shadow-blue-500/10 active:scale-95"
          >
            {isSimulating ? <RotateCcw className="animate-spin" size={16} /> : <Play size={16} />}
            {isSimulating ? "COMPUTING..." : "GENERATE GROWTH GRAPH"}
          </button>
        </div>

        {/* USER PROFILE & ACCOUNT SECTION */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 p-6 md:p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md gap-8 shadow-2xl">
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <h2 className="text-[7vw] md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none break-words">
                {userProfile?.full_name || 'KALIM AHMED GILL'}
              </h2>
              <span className="bg-indigo-600 text-white text-[9px] md:text-[10px] font-black px-3 py-1 rounded-md italic uppercase tracking-widest h-fit shadow-lg shadow-indigo-500/20">
                {userProfile?.role?.toUpperCase() || 'KIMOO ADMIN'}
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12 border-t border-white/5 pt-6 md:border-none md:pt-0">
              <div className="flex items-center gap-3">
                <Wallet size={18} className="text-emerald-500 shrink-0" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">ACCOUNT:</span>
                <div className="flex items-center border-b border-white/10 pb-0.5">
                   <span className="text-white font-black text-xl mr-1">$</span>
                   <input 
                     type="number" 
                     value={accountSize} 
                     onChange={(e) => setAccountSize(Number(e.target.value))} 
                     className="bg-transparent text-white font-black text-xl w-32 outline-none focus:text-emerald-400" 
                   />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-indigo-500 shrink-0" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">PLAN:</span>
                <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-white font-black text-xl italic uppercase tracking-tight">{currentTier}</span>
                    <span className="text-zinc-600 font-bold text-[10px] uppercase">
                      ({daysLeft.toLocaleString()} DAYS LEFT)
                    </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full xl:w-auto bg-black/40 border border-white/10 px-6 py-4 rounded-3xl flex flex-col sm:flex-row items-center gap-4">
             <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ENGINE: ONLINE</span>
             </div>
             <div className="hidden sm:block h-6 w-[1px] bg-white/10" />
             <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight truncate max-w-[200px] font-mono">
               {userProfile?.email || 'KALEEM.AHMAD87@ICLOUD.COM'}
             </p>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          <StatCard label="Total Signals" value={realStats.total} icon={<Activity size={18}/>} />
          <StatCard label="Win Rate" value={realStats.winRate} icon={<TrendingUp size={18}/>} color="text-emerald-400" />
          <StatCard label="Total R:R" value={realStats.totalRR} icon={<Zap size={18}/>} color="text-indigo-400" />
          <StatCard label="Net Profit" value={realStats.profitUSD} icon={<Star size={18}/>} color="text-emerald-500" />
          
          <StatCard label="Most Profitable" value={realStats.mostProfitable} sub="Alpha Asset" />
          <StatCard label="Most Traded" value={realStats.mostTraded} sub="Volume Dominance" />
          <StatCard label="High WR Symbol" value={realStats.highWRPair} sub="Accuracy Lead" />
          <StatCard label="Live Sync" value="30s" color="text-emerald-500" sub="Server Active" />
        </div>

        {/* ROADMAP SECTION */}
        <div className="w-full border-t border-white/5 pt-16 mb-20">
          <h2 className="text-3xl md:text-6xl font-black text-white mb-12 tracking-tighter italic uppercase leading-tight">
            Institutional <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">CRT Intelligence.</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            <FeatureItem icon={<Activity size={24}/>} title="Live Execution" desc="Track R:R growth in real-time as market hits levels." />
            <FeatureItem icon={<BarChart3 size={24}/>} title="Audit Grade" desc="Audit symbol performance across timeframes." />
            <FeatureItem icon={<Target size={24}/>} title="Radar Tech" desc="Identify symbol clustering and timing edge instantly." />
            <FeatureItem icon={<MessageSquare size={24}/>} title="API Routing" desc="Route premium signals directly to your Private Discord." />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub, color = "text-white" }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-5 md:p-8 rounded-[2rem] shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
        <div className="text-zinc-700">{icon}</div>
      </div>
      <p className={`text-xl md:text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
      {sub && <p className="text-[8px] font-bold text-zinc-800 mt-2 uppercase">{sub}</p>}
    </div>
  );
}

function FeatureItem({ icon, title, desc }: any) {
  return (
    <div className="flex gap-4 p-6 rounded-3xl bg-white/[0.01] border border-white/5">
      <div className="text-indigo-500 shrink-0">{icon}</div>
      <div>
        <h4 className="text-white font-black uppercase italic text-lg tracking-tighter">{title}</h4>
        <p className="text-zinc-500 text-xs md:text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
