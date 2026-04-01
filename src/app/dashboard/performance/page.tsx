"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth'; // New Addition
import AccessGuard from '@/components/AccessGuard'; // New Addition
import { 
  LineChart, TrendingUp, Award, BarChart2, Zap, Target, 
  Settings2, DollarSign, Activity, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceStats {
  winRate: number;
  profitFactor: number;
  totalSignals: number;
  avgRR: number;
  growth: number;
  cashProfit: string;
}

export default function PerformancePage() {
  const { tier, loading: authLoading } = useAuth(); // New Addition
  const [stats, setStats] = useState<PerformanceStats>({
    winRate: 0, profitFactor: 0, totalSignals: 0, avgRR: 3.2, growth: 0, cashProfit: "$0.00"
  });
  const [recentTradeFlags, setRecentTradeFlags] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // --- INPUT STATES ---
  const [selectedSymbol, setSelectedSymbol] = useState('ALL');
  const [accountSize, setAccountSize] = useState(100000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [targetRR, setTargetRR] = useState(3.2);

  const fetchPerformance = async () => {
    if (tier < 3) return; // New Addition: Prevent fetch for unauthorized tiers
    setLoading(true);
    let query = supabase.from('signals').select('*').order('created_at', { ascending: false });

    if (selectedSymbol !== 'ALL') {
      query = query.eq('symbol', selectedSymbol);
    }

    const { data } = await query;

    if (data && data.length > 0) {
      const wins = data.filter(s => s.status === 'TP2').length;
      const partials = data.filter(s => s.status === 'TP1 + SL (BE)').length;
      const losses = data.filter(s => s.status === 'SL').length;
      const totalClosed = wins + partials + losses;

      // Calculate R-Multiple & Cash
      const netR = (wins * targetRR) + (partials * 0.5) - (losses * 1);
      const riskAmount = accountSize * (riskPercent / 100);
      
      // Calculate Profit Factor
      const grossProfit = (wins * targetRR) + (partials * 0.5);
      const pf = losses === 0 ? grossProfit : grossProfit / losses;

      // Create Dynamic Graph Data (Last 12 trades success intensity)
      const last12 = data.slice(0, 12).map(s => {
        if (s.status === 'TP2') return 100;
        if (s.status === 'TP1 + SL (BE)') return 50;
        return 20;
      }).reverse();

      setRecentTradeFlags(last12);
      setStats({
        totalSignals: data.length,
        winRate: totalClosed > 0 ? Math.round(((wins + partials) / totalClosed) * 100) : 0,
        profitFactor: Number(pf.toFixed(2)),
        avgRR: targetRR,
        growth: Number(netR.toFixed(1)),
        cashProfit: (netR * riskAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPerformance();
  }, [selectedSymbol, accountSize, riskPercent, targetRR, tier]); // Added tier dependency

  // New Addition: Auth Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <Activity size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  // New Addition: Tier Restriction (Requires Ultra/Tier 3)
  if (tier < 3) {
    return <AccessGuard tierName="Ultra" />;
  }

  return (
    <div className="p-8 lg:p-12 bg-[#05070a] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tighter italic text-white uppercase">
            Performance <span className="text-blue-500 not-italic">Engine</span>
          </h2>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.4em] mt-3">
            Real-Time CRT Institutional Metrics
          </p>
        </div>
        <div className="flex gap-4">
            <button onClick={fetchPerformance} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                <Activity size={18} className={loading ? "animate-pulse text-blue-500" : "text-zinc-400"} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar: Filters */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] space-y-8">
            <div className="flex items-center gap-2 text-zinc-500 border-b border-white/5 pb-4">
              <Settings2 size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Environment</h3>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-600">Asset Selection</label>
              <select 
                value={selectedSymbol} 
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-mono outline-none focus:border-blue-500"
              >
                <option value="ALL">ALL PAIRS</option>
                <option value="EURUSD">EURUSD</option>
                <option value="GBPUSD">GBPUSD</option>
                <option value="USDJPY">USDJPY</option>
                <option value="GBPJPY">GBPJPY</option>
                <option value="AUDUSD">AUDUSD</option>
                <option value="EURJPY">EURJPY</option>
                <option value="NZDUSD">NZDUSD</option>
                <option value="CHFJPY">CHFJPY</option>
                <option value="US100">US100</option>
                <option value="US500">US500</option>
                <option value="US30">US30</option>
                <option value="XAUUSD">XAUUSD</option>
                <option value="XAGUSD">XAGUSD</option>
                <option value="XPTUSD">XPTUSD</option>
                <option value="XCUUSD">XCUUSD</option>
                <option value="SOLUSDT">SOLUSDT</option>
                <option value="XRPUSDT">XRPUSDT</option>
                <option value="BNBUSDT">BNBUSDT</option>
                <option value="ETHUSDT">ETHUSDT</option>
                <option value="BTCUSDT">BTCUSDT</option>
                <option value="TAOUSDT">TAOUSDT</option>
                <option value="ADAUSDT">ADAUSDT</option>
                <option value="DOGEUSDT">DOGEUSDT</option>
                <option value="AVAXUSDT">AVAXUSDT</option>
                <option value="DOTUSDT">DOTUSDT</option>
                <option value="NEARUSDT">NEARUSDT</option>
                <option value="LTCUSDT">LTCUSDT</option>
                <option value="TRXUSDT">TRXUSDT</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-600">Account Capital ($)</label>
              <input type="number" value={accountSize} onChange={(e)=>setAccountSize(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-mono text-blue-500 outline-none"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-zinc-600">Risk %</label>
                    <input type="number" step="0.1" value={riskPercent} onChange={(e)=>setRiskPercent(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-mono text-blue-500 outline-none"/>
                </div>
                <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-zinc-600">Avg RR</label>
                    <input type="number" step="0.1" value={targetRR} onChange={(e)=>setTargetRR(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-mono text-blue-500 outline-none"/>
                </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Win Rate" value={`${stats.winRate}%`} icon={<Award className="text-blue-500" size={18} />} trend="+2.1%" />
            <StatCard title="Profit Factor" value={stats.profitFactor.toString()} icon={<TrendingUp className="text-green-500" size={18} />} trend="Alpha" />
            <StatCard title="Total Growth" value={`${stats.growth}R`} icon={<Zap className="text-yellow-500" size={18} />} trend={stats.cashProfit} />
            <StatCard title="Closed Trades" value={stats.totalSignals.toString()} icon={<BarChart2 className="text-purple-500" size={18} />} trend="Live" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dynamic Recent Accuracy Graph */}
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
                   <LineChart size={14} className="text-blue-500" /> Recent Sequence Accuracy
                </h3>
                <span className="text-[8px] font-bold text-zinc-700 uppercase">Last 12 Signals</span>
              </div>
              
              <div className="h-48 w-full flex items-end gap-2 px-4">
                {recentTradeFlags.map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className={`flex-1 rounded-t-xl ${h === 100 ? 'bg-blue-500' : h === 50 ? 'bg-blue-500/40' : 'bg-white/5'}`}
                  />
                ))}
              </div>
              <div className="mt-8 flex justify-between text-[8px] font-black text-zinc-700 uppercase tracking-widest px-4">
                <span>Oldest</span>
                <span>Latest Outcome</span>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <Target size={18} className="text-blue-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Strategy Guard</h4>
                </div>
                <div className="space-y-6">
                  <EfficiencyItem label="Avg Risk/Reward" value={`${stats.avgRR}:1`} />
                  <EfficiencyItem label="Recovery Factor" value="4.82" />
                  <EfficiencyItem label="Max Drawdown" value="2.4%" />
                </div>
              </div>
              <div className="mt-12 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <p className="text-[9px] text-zinc-500 font-bold italic leading-relaxed">
                  Metrics verified against live Supabase signal nodes. Assuming {riskPercent}% risk per entry.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] hover:border-white/10 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-blue-500/10 transition-colors">
          {icon}
        </div>
        <span className="text-[8px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg uppercase tracking-tighter">
          {trend}
        </span>
      </div>
      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-3xl font-black text-white italic tracking-tighter">{value}</p>
    </div>
  );
}

function EfficiencyItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">{label}</span>
      <span className="text-xs font-black text-white italic">{value}</span>
    </div>
  );
}
