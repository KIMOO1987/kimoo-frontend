"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  TrendingUp, Zap, Star, Activity, BarChart3, Target, 
  Clock, Wallet, Play, RotateCcw,
  CheckCircle2, XCircle, MinusCircle, Percent, ArrowRightLeft
} from 'lucide-react';

interface DashboardClientProps {
  isPro: boolean;
  expiryDate?: string | null;
  userProfile: any; 
}

export default function DashboardClient({ isPro, expiryDate, userProfile }: DashboardClientProps) {
  const [accountSize, setAccountSize] = useState(userProfile?.account_size || 100000); 
  const [riskValue, setRiskValue] = useState(1.0); // Custom Risk (e.g., 1R)
  const [rewardValue, setRewardValue] = useState(2.0); // Custom Reward (e.g., 2R)
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [realStats, setRealStats] = useState({
    total: 0,
    totalWins: 0,
    totalLosses: 0,
    totalBE: 0,
    winRate: "0%",
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
  }, [accountSize, riskValue, rewardValue]);

  async function fetchData() {
    try {
      const { data: signals } = await supabase.from('signals').select('*');
      if (!signals || signals.length === 0) return;

      const wins = signals.filter(s => s.status?.toUpperCase().includes('TP'));
      const losses = signals.filter(s => s.status?.toUpperCase() === 'SL');
      const bes = signals.filter(s => s.status?.toUpperCase().includes('BE'));
      
      const baseRiskUSD = accountSize * 0.01; 
      let totalRRCount = 0;
      const pairMap: Record<string, { count: number, profit: number, wins: number, closed: number }> = {};

      signals.forEach(s => {
        const sym = s.symbol || "---";
        if (!pairMap[sym]) pairMap[sym] = { count: 0, profit: 0, wins: 0, closed: 0 };
        pairMap[sym].count += 1;

        const status = s.status?.toUpperCase() || "";
        
        if (status.includes('TP2')) { 
          totalRRCount += rewardValue; 
          pairMap[sym].profit += rewardValue; 
          pairMap[sym].wins += 1; 
          pairMap[sym].closed += 1; 
        }
        else if (status.includes('TP1') && !status.includes('BE')) { 
          const halfReward = rewardValue / 2;
          totalRRCount += halfReward; 
          pairMap[sym].profit += halfReward; 
          pairMap[sym].wins += 1; 
          pairMap[sym].closed += 1; 
        }
        else if (status === 'SL') { 
          totalRRCount -= riskValue; 
          pairMap[sym].profit -= riskValue; 
          pairMap[sym].closed += 1; 
        }
        else if (status.includes('BE')) { 
          pairMap[sym].closed += 1; 
        }
      });

      const sortedByProfit = Object.entries(pairMap).sort((a, b) => b[1].profit - a[1].profit);
      const sortedByTraded = Object.entries(pairMap).sort((a, b) => b[1].count - a[1].count);

      setRealStats({
        total: signals.length,
        totalWins: wins.length,
        totalLosses: losses.length,
        totalBE: bes.length,
        winRate: (wins.length + losses.length) > 0 ? ((wins.length / (wins.length + losses.length)) * 100).toFixed(1) + "%" : "0%",
        totalRR: totalRRCount.toFixed(2) + "R",
        profitUSD: `$${(totalRRCount * baseRiskUSD).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        mostProfitable: sortedByProfit[0]?.[0] || "---",
        mostTraded: sortedByTraded[0]?.[0] || "---",
        highWRPair: "---",
      });
    } catch (err) { console.error("Sync Error:", err); }
  }

  return (
    <div className="p-6 md:p-12 lg:p-16 bg-[#05070a] min-h-screen text-white font-sans overflow-x-hidden">
      <div className="max-w-[1700px] mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase">
              Client<span className="text-blue-500">Dashboard</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-bold mt-3 leading-none">
              • KIMOO CRT Engine •
            </p>
          </div>
        </div>

        {/* PROFILE & DYNAMIC INPUTS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 p-6 md:p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md gap-8 shadow-2xl">
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <h2 className="text-[7vw] md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                {userProfile?.full_name || 'KALIM AHMED GILL'}
              </h2>
              <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-md italic uppercase tracking-widest h-fit">
                {userProfile?.role?.toUpperCase() || 'KIMOO ADMIN'}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-y-8 gap-x-10 border-t border-white/5 pt-8 md:border-none md:pt-0">
              {/* ACCOUNT SIZE */}
              <div className="flex items-center gap-3">
                <Wallet size={18} className="text-emerald-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Account Size</span>
                  <div className="flex items-center border-b border-white/10 pb-1">
                    <span className="text-white font-black text-xl mr-1">$</span>
                    <input 
                      type="number" 
                      value={accountSize} 
                      onChange={(e) => setAccountSize(Number(e.target.value))} 
                      className="bg-transparent text-white font-black text-xl w-28 outline-none focus:text-emerald-400" 
                    />
                  </div>
                </div>
              </div>

              {/* RISK INPUT */}
              <div className="flex items-center gap-3">
                <Percent size={18} className="text-red-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Risk per SL</span>
                  <div className="flex items-center border-b border-white/10 pb-1">
                    <input 
                      type="number" 
                      step="0.1"
                      value={riskValue} 
                      onChange={(e) => setRiskValue(Number(e.target.value))} 
                      className="bg-transparent text-white font-black text-xl w-14 outline-none focus:text-red-400 text-center" 
                    />
                    <span className="text-zinc-500 font-black text-xl ml-1">R</span>
                  </div>
                </div>
              </div>

              {/* REWARD INPUT */}
              <div className="flex items-center gap-3">
                <TrendingUp size={18} className="text-blue-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Reward per TP</span>
                  <div className="flex items-center border-b border-white/10 pb-1">
                    <input 
                      type="number" 
                      step="0.1"
                      value={rewardValue} 
                      onChange={(e) => setRewardValue(Number(e.target.value))} 
                      className="bg-transparent text-white font-black text-xl w-14 outline-none focus:text-blue-400 text-center" 
                    />
                    <span className="text-zinc-500 font-black text-xl ml-1">R</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-indigo-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Subscription</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white font-black text-xl italic uppercase tracking-tight">{currentTier}</span>
                    <span className="text-zinc-600 font-bold text-[10px] uppercase">({daysLeft} DAYS)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COMPACT ENGINE STATUS */}
          <div className="w-full xl:w-auto bg-black/40 border border-white/10 px-5 py-3 rounded-2xl flex flex-wrap items-center justify-center gap-4">
             <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest whitespace-nowrap">ENGINE: ONLINE</span>
             </div>
             <div className="hidden sm:block h-4 w-[1px] bg-white/10" />
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter font-mono whitespace-nowrap">
               {userProfile?.email || 'KALEEM.AHMAD87@ICLOUD.COM'}
             </p>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          <StatCard label="Total Signals" value={realStats.total} icon={<Activity size={18}/>} />
          <StatCard label="Total Wins" value={realStats.totalWins} icon={<CheckCircle2 size={18}/>} color="text-emerald-400" />
          <StatCard label="Total Losses" value={realStats.totalLosses} icon={<XCircle size={18}/>} color="text-red-500" />
          <StatCard label="Total BE" value={realStats.totalBE} icon={<MinusCircle size={18}/>} color="text-zinc-400" />
          
          <StatCard label="Win Rate" value={realStats.winRate} icon={<ArrowRightLeft size={18}/>} color="text-emerald-400" />
          <StatCard label="Total R:R" value={realStats.totalRR} icon={<Zap size={18}/>} color="text-indigo-400" />
          <StatCard label="Net Profit" value={realStats.profitUSD} icon={<Star size={18}/>} color="text-emerald-500" />
          <StatCard label="Most Profitable" value={realStats.mostProfitable} sub="Alpha Asset" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub, color = "text-white" }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-5 md:p-8 rounded-[2rem] shadow-xl hover:bg-white/[0.04] transition-all">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
        <div className="text-zinc-700">{icon}</div>
      </div>
      <p className={`text-xl md:text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
      {sub && <p className="text-[8px] font-bold text-zinc-800 mt-2 uppercase">{sub}</p>}
    </div>
  );
}
