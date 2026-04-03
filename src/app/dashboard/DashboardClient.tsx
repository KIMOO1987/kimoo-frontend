"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  TrendingUp, Zap, Star, Activity, BarChart3, Target, 
  ShieldCheck, Clock, Wallet, MessageSquare, Play, RotateCcw,
  CheckCircle2, XCircle, MinusCircle, Percent, Save, Mail
} from 'lucide-react';

interface DashboardClientProps {
  tier: number; // Updated to match our numeric tier system
  expiryDate?: string | null;
  userProfile: any; 
}

export default function DashboardClient({ tier, expiryDate, userProfile }: DashboardClientProps) {
  const [accountSize, setAccountSize] = useState(userProfile?.account_size || 10000); 
  const [riskValue, setRiskValue] = useState(userProfile?.risk_value || 1.0); 
  const [rewardValue, setRewardValue] = useState(userProfile?.reward_value || 2.0); 
  const [timeframe, setTimeframe] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  
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

  // --- NEW TIER LOGIC ---
  const getTierDisplay = () => {
    if (userProfile?.role === 'admin') return 'SYSTEM ADMIN';
    switch (tier) {
      case 3: return 'ULTIMATE';
      case 2: return 'PRO';
      case 1: return 'ALPHA';
      default: return 'FREE TRADER';
    }
  };

  const daysLeft = expiryDate 
    ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
    : 0;

  useEffect(() => {
    fetchData(); 
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, [accountSize, riskValue, rewardValue, timeframe]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_size: accountSize,
          risk_value: riskValue,
          reward_value: rewardValue
        })
        .eq('id', userProfile.id);

      if (error) throw error;
    } catch (err) {
      console.error("Save Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  async function fetchData() {
    try {
      const { data: allSignals } = await supabase.from('signals').select('*');
      if (!allSignals || allSignals.length === 0) return;

      const now = new Date();
      const signals = allSignals.filter(s => {
        if (timeframe === 'all') return true;
        const signalDate = new Date(s.created_at || s.timestamp);
        const diffInDays = (now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (timeframe) {
          case 'daily': return diffInDays <= 1;
          case 'weekly': return diffInDays <= 7;
          case 'monthly': return diffInDays <= 30;
          case 'yearly': return diffInDays <= 365;
          default: return true;
        }
      });

      if (signals.length === 0) {
        setRealStats({
          total: 0, totalWins: 0, totalLosses: 0, totalBE: 0,
          winRate: "0%", totalRR: "0.00R", profitUSD: "$0.00",
          mostProfitable: "---", mostTraded: "---", highWRPair: "---",
        });
        return;
      }

      const wins = signals.filter(s => s.status?.toUpperCase().includes('TP'));
      const losses = signals.filter(s => s.status?.toUpperCase() === 'SL');
      const bes = signals.filter(s => s.status?.toUpperCase().includes('BE'));
      
      const riskAmountUSD = accountSize * (riskValue / 100); 
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
          const partialReward = rewardValue / 2;
          totalRRCount += partialReward; 
          pairMap[sym].profit += partialReward; 
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
        profitUSD: `$${(totalRRCount * (accountSize * 0.01)).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
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
            <h1 className="text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
              Client<span className="text-blue-500">Dashboard</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-bold mt-3 leading-none italic">
              • KIMOO CRT ENGINE PRO •
            </p>
          </div>
        </div>

        {/* PROFILE & DYNAMIC INPUTS */}
        <div className="flex flex-col mb-10 p-6 md:p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md gap-8 shadow-2xl">
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <h2 className="text-[7vw] md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                  {userProfile?.full_name || 'TRADER'}
              </h2>
              {/* UPDATED BADGE LOGIC */}
              <span className={`text-white text-[10px] font-black px-3 py-1 rounded-md italic uppercase tracking-widest h-fit shadow-lg transition-colors ${
                  tier >= 2 || userProfile?.role === 'admin' 
                  ? 'bg-blue-600 shadow-blue-500/20' 
                  : 'bg-zinc-700 shadow-black/10'
              }`}>
                  {getTierDisplay()}
              </span>
            </div>

            {/* EMAIL ADDRESS */}
            <div className="flex items-center gap-2 mb-10 text-zinc-500">
              <Mail size={14} className="text-blue-500" />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase font-mono">
                {userProfile?.email || 'OFFLINE'}
              </span>
            </div>
            
            <div className="space-y-10">
              {/* ROW 1: PLAN INFO & ENGINE STATUS */}
              <div className="flex flex-wrap gap-y-6 gap-x-12 border-b border-white/5 pb-10">
                {/* 1. PLAN TYPE SECTION */}
                <div className="flex items-center gap-3">
                  <Star size={18} className="text-yellow-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Plan Type</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-xl italic uppercase tracking-tight text-white">
                        {userProfile?.plan_type?.toUpperCase() || (tier === 3 ? 'ULTIMATE' : tier === 2 ? 'PRO' : tier === 1 ? 'ALPHA' : 'FREE')}
                      </span>
                    </div>
                  </div>
                </div>
              
                {/* 2. PLAN VALIDITY SECTION */}
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-indigo-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Plan Validity</span>
                    <div className="flex flex-wrap items-baseline gap-2">
                        <span className={`font-black text-xl italic uppercase tracking-tight ${tier > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {tier > 0 ? 'ACTIVE' : 'EXPIRED'}
                        </span>
                        {tier > 0 && (
                          <span className="text-zinc-600 font-bold text-[10px] uppercase">
                            ({daysLeft} REMAINING DAYS)
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                {/* 3. ENGINE STATUS SECTION */}
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Activity size={18} className="text-emerald-500" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Engine Status</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-xl italic uppercase tracking-tight text-emerald-500">ONLINE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 2: DYNAMIC INPUTS & CONTROLS */}
              <div className="flex flex-wrap items-end gap-y-6 gap-x-12">
              {/* ACCOUNT SIZE INPUT */}
              <div className="flex items-center gap-3">
                <Wallet size={18} className="text-emerald-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Account</span>
                  <div className="flex items-center border-b border-white/10 pb-0.5">
                    <span className="text-white font-black text-xl mr-1">$</span>
                    <input 
                      type="number" 
                      value={accountSize} 
                      onChange={(e) => setAccountSize(Number(e.target.value))} 
                      className="bg-transparent text-white font-black text-xl w-28 md:w-32 outline-none focus:text-emerald-400" 
                    />
                  </div>
                </div>
              </div>

              {/* RISK INPUT */}
              <div className="flex items-center gap-3">
                <Percent size={18} className="text-red-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Risk per SL</span>
                  <div className="flex items-center border-b border-white/10 pb-0.5">
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
                  <div className="flex items-center border-b border-white/10 pb-0.5">
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
              
              {/* TIMEFRAME SELECTOR */}
              <div className="flex items-center gap-3">
                <BarChart3 size={18} className="text-blue-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Result Scope</span>
                  <div className="flex items-center border-b border-white/10 pb-0.5">
                    <select 
                      value={timeframe} 
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="bg-transparent text-white font-black text-xl outline-none cursor-pointer hover:text-blue-400 appearance-none pr-4"
                    >
                      <option value="all" className="bg-[#05070a]">All Time</option>
                      <option value="daily" className="bg-[#05070a]">Daily</option>
                      <option value="weekly" className="bg-[#05070a]">Weekly</option>
                      <option value="monthly" className="bg-[#05070a]">Monthly</option>
                      <option value="yearly" className="bg-[#05070a]">Yearly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="flex items-end pb-1">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                    isSaving 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                  }`}
                >
                  <Save size={14} className={isSaving ? 'animate-spin' : ''} />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          <StatCard label="Total Signals" value={realStats.total} icon={<Activity size={18}/>} />
          <StatCard label="Total Wins" value={realStats.totalWins} icon={<CheckCircle2 size={18}/>} color="text-emerald-400" />
          <StatCard label="Total Losses" value={realStats.totalLosses} icon={<XCircle size={18}/>} color="text-red-500" />
          <StatCard label="Total BE" value={realStats.totalBE} icon={<MinusCircle size={18}/>} color="text-zinc-400" />
          
          <StatCard label="Win Rate" value={realStats.winRate} icon={<TrendingUp size={18}/>} color="text-emerald-400" />
          <StatCard label="Total R:R" value={realStats.totalRR} icon={<Zap size={18}/>} color="text-indigo-400" />
          <StatCard label="Net Profit" value={realStats.profitUSD} icon={<Star size={18}/>} color="text-emerald-500" />
          <StatCard label="Most Profitable" value={realStats.mostProfitable} sub="CRT Alpha Pair" />
        </div>

        {/* FOOTER FEATURES */}
        <div className="w-full border-t border-white/5 pt-16 mb-20">
          <h2 className="text-3xl md:text-6xl font-black text-white mb-12 tracking-tighter italic uppercase leading-tight">
            Institutional <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">CRT Intelligence (+Pro).</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            <FeatureItem icon={<Activity size={24}/>} title="Real-Time Trade Intelligence" desc="Track every active position with precision—monitor live R:R evolution, dynamic exit flow, and instantly review your latest closed trades." />
            <FeatureItem icon={<BarChart3 size={24}/>} title="Audit-Grade Analytics" desc="Dissect symbol performance across multiple timeframes with precision—identify strengths and high-probability opportunities." />
            <FeatureItem icon={<Target size={24}/>} title="Radar Technology" desc="Instantly detect symbol clustering and timing inefficiencies—pinpoint where smart money is aligning." />
            <FeatureItem icon={<TrendingUp size={24}/>} title="Exclusive Indicator Access" desc="Unlock a full suite of advanced indicators—reserved for Premium users seeking precision and edge." />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub, color = "text-white" }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-5 md:p-8 rounded-[2rem] shadow-xl hover:bg-white/[0.04] transition-all">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">{label}</p>
        <div className="text-zinc-700">{icon}</div>
      </div>
      <p className={`text-xl md:text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
      {sub && <p className="text-[8px] font-bold text-zinc-800 mt-2 uppercase tracking-widest">{sub}</p>}
    </div>
  );
}

function FeatureItem({ icon, title, desc }: any) {
  return (
    <div className="flex gap-4 p-6 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-blue-500/20 transition-all group">
      <div className="text-blue-500 shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <h4 className="text-white font-black uppercase italic text-lg tracking-tighter">{title}</h4>
        <p className="text-zinc-500 text-xs md:text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
