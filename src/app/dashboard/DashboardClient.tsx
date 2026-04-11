"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  TrendingUp, Zap, Star, Activity, BarChart3, Target, Layers,
  Wallet, CheckCircle2, XCircle, MinusCircle, Percent, Save, Mail, TrendingDown,
  Info, AlertCircle, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardClientProps {
  tier: number; 
  expiryDate?: string | null;
  userProfile: any; 
}

export default function DashboardClient({ tier, expiryDate, userProfile }: DashboardClientProps) {
  const [accountSize, setAccountSize] = useState(userProfile?.account_size || 10000); 
  const [riskValue, setRiskValue] = useState(userProfile?.risk_value || 1.0); 
  const [rewardValue, setRewardValue] = useState(userProfile?.reward_value || 2.0); 
  const [timeframe, setTimeframe] = useState('all');
  const [assetClass, setAssetClass] = useState('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentSignals, setRecentSignals] = useState<any[]>([]);
  
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
    maxDrawdown: "0.00R",
    profitFactor: "0.00",
    expectancy: "0.00R",
    winStreak: 0,
    lossStreak: 0,
    longWR: "0%",
    shortWR: "0%"
  });

  // --- TIER DISPLAY LOGIC ---
  const getTierDisplay = () => {
    if (userProfile?.role === 'admin') return 'SYSTEM ADMIN';
    switch (tier) {
      case 3: return 'ULTIMATE';
      case 2: return 'PRO';
      case 1: return 'ALPHA';
      default: return 'FREE TRADER';
    }
  };

  useEffect(() => {
    if (userProfile) {
      setAccountSize(userProfile.account_size || 10000);
      setRiskValue(userProfile.risk_value || 1.0);
      setRewardValue(userProfile.reward_value || 2.0);
    }
  }, [userProfile]);

  const daysLeft = expiryDate 
    ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
    : 0;

  useEffect(() => {
    fetchData(); 
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, [accountSize, riskValue, rewardValue, timeframe, assetClass]);

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

  // --- STATS CALCULATION HELPER ---
  const calculateActualSignalRR = (signal: any): number => {
    const status = signal.status?.toUpperCase();

    // Project performance based on user's Risk/Reward profile
    if (['WIN', 'TP2'].includes(status)) {
      return rewardValue; 
    } else if (['TP1', 'TP1 + SL (BE)'].includes(status)) {
      return rewardValue * 0.5; // Project half the reward for partial wins
    } else if (status === 'SL' || status === 'LOSS') {
      return -1; // Assuming 1R risk
    } else if (status === 'BE') {
      return 0; 
    }
    return 0; 
  };

  // --- SYMBOL CATEGORY HELPER ---
  const getSymbolCategory = (symbol: string) => {
    if (!symbol) return 'CRYPTO';
    const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (upper.startsWith('XAU') || upper.startsWith('XAG') || upper.startsWith('XPT') || upper.startsWith('XCU')) return 'METALS';
    if (['US100', 'US30', 'US500'].includes(upper)) return 'INDICES';
    const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'EURJPY', 'NZDUSD', 'CHFJPY'];
    if (forexPairs.includes(upper)) return 'FOREX';
    return 'CRYPTO';
  };

  // --- MAIN DATA FETCH & PROCESS ---
  async function fetchData() {
    try {
      // 1. GET TOTAL COUNT FIRST (Bypasses the 1000 row limit for the counter)
      const { count: totalCount } = await supabase
        .from('signals')
        .select('*', { count: 'exact', head: true });

      // 2. FETCH SIGNAL DATA (Limited to 10k for stats processing)
      const { data: allSignals, error } = await supabase.from('signals')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(10000); 
        
      if (error) {
        setIsInitialLoad(false);
        throw error;
      }
      if (!allSignals || allSignals.length === 0) {
        setIsInitialLoad(false);
        return;
      }

      const now = new Date();
      const signals = allSignals.filter(s => {
        // 1. Asset Class Filter
        if (assetClass !== 'ALL' && getSymbolCategory(s.symbol) !== assetClass) {
          return false;
        }
        
        // 2. Timeframe Filter
        if (timeframe !== 'all') {
          const signalDate = new Date(s.created_at || s.timestamp);
          const diffInDays = (now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24);
          if (timeframe === 'daily' && diffInDays > 1) return false;
          if (timeframe === 'weekly' && diffInDays > 7) return false;
          if (timeframe === 'monthly' && diffInDays > 30) return false;
          if (timeframe === 'yearly' && diffInDays > 365) return false;
        }
        return true;
      });

      if (signals.length === 0) {
        setRealStats({
          total: (timeframe === 'all' && assetClass === 'ALL') ? (totalCount || 0) : 0, totalWins: 0, totalLosses: 0, totalBE: 0,
          winRate: "0%", totalRR: "0.00R", profitUSD: "$0.00",
          mostProfitable: "---", mostTraded: "---", highWRPair: "---",
          maxDrawdown: "0.00R",
        });
        return;
      }

      let totalWinsCount = 0;
      let totalLossesCount = 0;
      let totalBECount = 0;
      let totalRRCount = 0;
      let runningR = 0; 
      let peakR = 0;
      let maxDrawdown = 0;
      
      let grossProfit = 0;
      let grossLoss = 0;
      let longWins = 0, longTotal = 0;
      let shortWins = 0, shortTotal = 0;
      let currentWinStreak = 0, maxWinStreak = 0;
      let currentLossStreak = 0, maxLossStreak = 0;

      const newChartData: any[] = [];

      const riskAmountUSD = accountSize * (riskValue / 100); 
      const pairMap: Record<string, { symbol: string, count: number, profit: number, wins: number, losses: number, be: number, closed: number }> = {};

      signals.forEach((s, index) => {
        const sym = s.symbol?.toUpperCase() || "---";
        const side = s.side?.toUpperCase() || "BUY";
        if (!pairMap[sym]) pairMap[sym] = { symbol: sym, count: 0, profit: 0, wins: 0, losses: 0, be: 0, closed: 0 };
        pairMap[sym].count += 1;

        const signalRR = calculateActualSignalRR(s); 
        const status = s.status?.toUpperCase() || "";

        const isWin = signalRR > 0 && status !== 'TP1 + SL (BE)';
        const isLoss = signalRR < 0;
        const isBE = status === 'BE' || status === 'TP1 + SL (BE)';
        const isClosed = isWin || isLoss || isBE;

        if (isClosed) {
            if (side === 'BUY' || side === 'LONG') { 
                longTotal++; 
                if (isWin) longWins++; 
            } else { 
                shortTotal++; 
                if (isWin) shortWins++; 
            }
        }

        if (isWin) {
            grossProfit += signalRR;
            totalWinsCount++;
            pairMap[sym].wins++;
            currentWinStreak++;
            currentLossStreak = 0;
            if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
        } else if (isLoss) {
            grossLoss += Math.abs(signalRR);
            totalLossesCount++;
            pairMap[sym].losses++;
            currentLossStreak++;
            currentWinStreak = 0;
            if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
        } else if (isBE) {
            totalBECount++;
            pairMap[sym].be++;
            currentWinStreak = 0;
            currentLossStreak = 0;
        }
        
        runningR += signalRR;
        totalRRCount += signalRR;
        pairMap[sym].profit += signalRR;
        pairMap[sym].closed += 1;

        if (runningR > peakR) { peakR = runningR; }
        const currentDrawdown = peakR - runningR;
        if (currentDrawdown > maxDrawdown) { maxDrawdown = currentDrawdown; }
        
        // Populate Chart Data
        newChartData.push({
            name: `T${index + 1}`,
            date: new Date(s.created_at || s.timestamp).toLocaleDateString(),
            rr: parseFloat(runningR.toFixed(2)),
            tradeR: signalRR
        });
      });

      const sortedByProfit = Object.entries(pairMap).sort((a, b) => b[1].profit - a[1].profit);
      const sortedByTraded = Object.entries(pairMap).sort((a, b) => b[1].count - a[1].count);

      const decidedWandL = totalWinsCount + totalLossesCount;
      const winRate = decidedWandL > 0 ? ((totalWinsCount / decidedWandL) * 100).toFixed(1) + "%" : "0%";

      const highWRPairObj = Object.values(pairMap)
        .filter(p => (p.wins + p.losses) >= 2)
        .sort((a, b) => (b.wins / (b.wins + b.losses || 1)) - (a.wins / (a.wins + a.losses || 1)))[0];

      const profitFactorValue = grossLoss === 0 ? (grossProfit > 0 ? 99.9 : 0) : (grossProfit / grossLoss);
      const expectancyValue = decidedWandL > 0 ? (totalRRCount / decidedWandL) : 0;
      const longWR = longTotal > 0 ? ((longWins / longTotal) * 100).toFixed(1) + "%" : "0%";
      const shortWR = shortTotal > 0 ? ((shortWins / shortTotal) * 100).toFixed(1) + "%" : "0%";
      const recent = [...signals].reverse().slice(0, 5);

      setRealStats({
        total: (timeframe === 'all' && assetClass === 'ALL') ? (totalCount || signals.length) : signals.length,
        totalWins: totalWinsCount,
        totalLosses: totalLossesCount,
        totalBE: totalBECount,
        winRate: winRate,
        totalRR: totalRRCount.toFixed(2) + "R",
        profitUSD: `${totalRRCount >= 0 ? '$' : '-$'}${Math.abs(totalRRCount * riskAmountUSD).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`,
        mostProfitable: sortedByProfit[0]?.[0] || "---",
        mostTraded: sortedByTraded[0]?.[0] || "---",
        highWRPair: highWRPairObj?.symbol || "---",
        maxDrawdown: maxDrawdown.toFixed(2) + "R", 
        profitFactor: profitFactorValue.toFixed(2),
        expectancy: `${expectancyValue >= 0 ? '+' : ''}${expectancyValue.toFixed(2)}R`,
        winStreak: maxWinStreak,
        lossStreak: maxLossStreak,
        longWR: longWR,
        shortWR: shortWR
      });
      
      setChartData(newChartData);
      setRecentSignals(recent);
    } catch (err) { console.error("Sync Error:", err); } finally {
        setIsInitialLoad(false);
    }
  }

  return (
    <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden">
      
      {/* Ambient Glowing Backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-[1700px] mx-auto relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
              Client<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Dashboard</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
              • KIMOO CRT ENGINE PRO •
            </p>
          </div>
        </div>

        {/* Premium Settings & Profile Card */}
        <div className="flex flex-col mb-6 md:mb-10 p-6 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.4)] gap-8">
          <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-8 mb-8">
              <div>
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <h2 className="text-[7vw] md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                  {userProfile?.full_name || 'TRADER'}
                  </h2>
                  <span className={`text-white text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest h-fit border transition-all ${
                      tier >= 2 || userProfile?.role === 'admin' 
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                      : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'
                  }`}>
                  {getTierDisplay()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <Mail size={14} className="text-indigo-400" />
                  <span className="text-[10px] md:text-[11px] font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase font-mono truncate">
                    {userProfile?.email || 'OFFLINE'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-6 md:mt-0">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Activity size={20} className="text-emerald-400" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Status</span>
                    <span className="font-black text-lg uppercase tracking-tight text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">ONLINE</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              
              <div className="flex items-center gap-3">
                <Wallet size={18} className="text-emerald-400 shrink-0" />
                <div className="flex flex-col w-full">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Account Size</span>
                  <div className="flex items-center bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 focus-within:border-emerald-500/50 focus-within:bg-white/[0.05] transition-all hover:border-white/20">
                    <span className="text-emerald-500/70 font-black text-sm mr-2">$</span>
                    <input 
                      type="number" 
                      value={accountSize} 
                      onChange={(e) => setAccountSize(Number(e.target.value))} 
                      className="bg-transparent text-white font-black text-lg w-full outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Percent size={18} className="text-red-400 shrink-0" />
                <div className="flex flex-col w-full">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Risk per SL</span>
                  <div className="flex items-center bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 focus-within:border-red-500/50 focus-within:bg-white/[0.05] transition-all hover:border-white/20">
                    <input 
                      type="number" 
                      step="0.1"
                      value={riskValue} 
                      onChange={(e) => setRiskValue(Number(e.target.value))} 
                      className="bg-transparent text-white font-black text-lg w-full outline-none text-center" 
                    />
                    <span className="text-red-500/70 font-black text-sm ml-2">R</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TrendingUp size={18} className="text-blue-400 shrink-0" />
                <div className="flex flex-col w-full">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Reward per TP</span>
                  <div className="flex items-center bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 focus-within:border-blue-500/50 focus-within:bg-white/[0.05] transition-all hover:border-white/20">
                    <input 
                      type="number" 
                      step="0.1"
                      value={rewardValue} 
                      onChange={(e) => setRewardValue(Number(e.target.value))} 
                      className="bg-transparent text-white font-black text-lg w-full outline-none text-center" 
                    />
                    <span className="text-blue-500/70 font-black text-sm ml-2">R</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <BarChart3 size={18} className="text-indigo-400 shrink-0" />
                <div className="flex flex-col w-full">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Result Scope</span>
                  <div className="flex items-center bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 hover:border-white/20 transition-all">
                    <select 
                      value={timeframe} 
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="bg-transparent text-white font-black text-lg outline-none cursor-pointer hover:text-indigo-400 appearance-none w-full"
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

              <div className="flex items-center gap-3">
                <Layers size={18} className="text-purple-400 shrink-0" />
                <div className="flex flex-col w-full">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Asset Class</span>
                  <div className="flex items-center bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 hover:border-white/20 transition-all">
                    <select 
                      value={assetClass} 
                      onChange={(e) => setAssetClass(e.target.value)}
                      className="bg-transparent text-white font-black text-lg outline-none cursor-pointer hover:text-purple-400 appearance-none w-full"
                    >
                      <option value="ALL" className="bg-[#05070a]">All Assets</option>
                      <option value="CRYPTO" className="bg-[#05070a]">Crypto</option>
                      <option value="FOREX" className="bg-[#05070a]">Forex</option>
                      <option value="INDICES" className="bg-[#05070a]">Indices</option>
                      <option value="METALS" className="bg-[#05070a]">Metals</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-end h-full">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className={`flex w-full items-center justify-center gap-2 px-6 py-4 md:py-0 md:h-[50px] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 active:scale-95 ${
                    isSaving 
                      ? 'bg-white/[0.05] text-zinc-500 cursor-not-allowed border border-white/5' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]'
                  }`}
                >
                  <Save size={16} className={isSaving ? 'animate-spin' : ''} />
                  {isSaving ? 'Saving...' : 'Save Config'}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* PREMIUM DATA VISUALIZATION & STATS */}
        {isInitialLoad ? (
          <div className="w-full flex flex-col items-center justify-center py-20 border border-white/[0.05] rounded-[2.5rem] bg-white/[0.02] animate-pulse mb-12">
            <Activity size={40} className="text-zinc-700 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Loading Intelligence...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-32 border border-dashed border-white/[0.1] rounded-[2.5rem] bg-white/[0.01] mb-12">
            <AlertCircle size={48} className="text-zinc-600 mb-6" />
            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white mb-2">No Intelligence Found</h3>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Try adjusting your filters or timeframe.</p>
          </div>
        ) : (
          <>
            {/* Modern Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 mb-8">
              {/* Original Essential Stats */}
              <StatCard label="Total Signals" value={realStats.total} icon={<Activity size={18}/>} />
              <StatCard label="Total Wins" value={realStats.totalWins} icon={<CheckCircle2 size={18}/>} color="text-emerald-400" />
              <StatCard label="Total Losses" value={realStats.totalLosses} icon={<XCircle size={18}/>} color="text-red-500" />
              <StatCard label="Total BE" value={realStats.totalBE} icon={<MinusCircle size={18}/>} color="text-zinc-400" />
              <StatCard label="Win Rate" value={realStats.winRate} icon={<TrendingUp size={18}/>} color="text-emerald-400" />
              <StatCard label="Total R:R" value={realStats.totalRR} icon={<Zap size={18}/>} color="text-indigo-400" />
              <StatCard label="Net Profit" value={realStats.profitUSD} icon={<Wallet size={18}/>} color="text-emerald-500" />
              <StatCard label="Most Profitable" value={realStats.mostProfitable} sub="CRT Alpha Pair" />
              <StatCard label="Highest Win Rate" value={realStats.highWRPair} icon={<Target size={18}/>} color="text-blue-400" />
              <StatCard label="Max Drawdown" value={realStats.maxDrawdown} icon={<TrendingDown size={18}/>} color="text-red-500" tooltip="Largest peak-to-trough drop in R." />
              
              {/* Advanced Pro Metrics */}
              <StatCard label="Profit Factor" value={realStats.profitFactor} icon={<Star size={18}/>} color="text-blue-400" tooltip="Gross Profit / Gross Loss. >1.5 is Excellent." />
              <StatCard label="Expectancy" value={realStats.expectancy} icon={<Layers size={18}/>} color="text-indigo-400" tooltip="Average R per trade (Wins & Losses combined)." />
              <StatCard label="Long vs Short WR" value={`${realStats.longWR} / ${realStats.shortWR}`} icon={<BarChart3 size={18}/>} tooltip="Win Rate for Buy vs Sell signals." />
              <StatCard label="Max Win Streak" value={`${realStats.winStreak} Trades`} icon={<TrendingUp size={18}/>} color="text-emerald-400" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 md:mb-12">
                {/* Equity Curve */}
                <div className="lg:col-span-2 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] shadow-2xl">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-6">Cumulative Equity Curve</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRR" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" hide />
                                <YAxis stroke="#52525b" fontSize={10} tickFormatter={(val) => `${val}R`} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                                    itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="rr" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRR)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* Donut Chart */}
                <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] shadow-2xl flex flex-col">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-6">Win/Loss Split</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Wins', value: realStats.totalWins },
                                        { name: 'Losses', value: realStats.totalLosses },
                                        { name: 'Break Even', value: realStats.totalBE }
                                    ]}
                                    cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none"
                                >
                                    <Cell fill="#34d399" />
                                    <Cell fill="#ef4444" />
                                    <Cell fill="#52525b" />
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                                    itemStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="w-full mb-12 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">Recent Signals</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-zinc-500">
                      <th className="pb-3 font-bold">Asset</th>
                      <th className="pb-3 font-bold">Side</th>
                      <th className="pb-3 font-bold">Entry Price</th>
                      <th className="pb-3 font-bold">Status</th>
                      <th className="pb-3 font-bold">Net R:R</th>
                      <th className="pb-3 font-bold text-right pr-6">Date</th>
                      <th className="pb-3 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSignals.map((s, i) => (
                      <tr key={s.id || i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="py-4 font-black italic tracking-tight text-white">{s.symbol}</td>
                        <td className={`py-4 font-black text-[11px] uppercase tracking-widest ${s.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{s.side}</td>
                        <td className="py-4 text-[11px] font-bold text-zinc-400 font-mono">{Number(s.entry_price || 0).toFixed(5)}</td>
                        <td className="py-4 text-[11px] font-bold tracking-widest text-zinc-400">{s.status}</td>
                        <td className={`py-4 font-mono font-black ${calculateActualSignalRR(s) > 0 ? 'text-emerald-400' : calculateActualSignalRR(s) < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                          {calculateActualSignalRR(s) > 0 ? '+' : ''}{calculateActualSignalRR(s).toFixed(2)}R
                        </td>
                        <td className="py-4 text-xs text-zinc-500 font-mono text-right pr-6">{new Date(s.created_at || s.timestamp).toLocaleString()}</td>
                        <td className="py-4 text-center">
                          <button className="text-zinc-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/[0.05] inline-flex items-center justify-center">
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub, color = "text-white", tooltip }: any) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-5 md:p-8 rounded-[2rem] hover:border-white/[0.1] hover:bg-white/[0.06] transition-all duration-300 group shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
            <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
            {tooltip && (
                <div className="group/tooltip relative cursor-help">
                    <Info size={12} className="text-zinc-600 hover:text-white transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-white/10 rounded-lg text-[10px] text-zinc-400 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl text-center">
                        {tooltip}
                    </div>
                </div>
            )}
        </div>
        <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] ${color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          {icon}
        </div>
      </div>
      <p className={`relative z-10 text-2xl md:text-3xl font-black tracking-tight drop-shadow-md ${color}`}>{value}</p>
      {sub && <p className="relative z-10 text-[8px] font-bold text-zinc-600 mt-2 uppercase tracking-widest">{sub}</p>}
    </div>
  );
}
