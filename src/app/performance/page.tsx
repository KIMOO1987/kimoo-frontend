"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  LineChart, TrendingUp, Award, BarChart2, Zap, Target, 
  Settings2, Activity, LayoutGrid, History, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PerformancePage() {
  const [stats, setStats] = useState({
    winRate: 0, profitFactor: 0, totalSignals: 0, avgRR: 3.2, growth: 0, cashProfit: "$0.00"
  });
  const [recentTradeFlags, setRecentTradeFlags] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('ALL');

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      let query = supabase.from('signals').select('*').order('created_at', { ascending: false });
      if (selectedSymbol !== 'ALL') query = query.eq('symbol', selectedSymbol);
      
      const { data } = await query;
      if (data && data.length > 0) {
        const wins = data.filter(s => s.status === 'TP2').length;
        const partials = data.filter(s => s.status === 'TP1 + SL (BE)').length;
        const losses = data.filter(s => s.status === 'SL').length;
        const netR = (wins * 3.2) + (partials * 0.5) - (losses * 1);
        
        setRecentTradeFlags(data.slice(0, 10).map(s => s.status === 'TP2' ? 100 : s.status === 'SL' ? 20 : 50).reverse());
        setStats({
          totalSignals: data.length,
          winRate: Math.round(((wins + partials) / (wins + partials + losses)) * 100) || 0,
          profitFactor: Number(((wins * 3.2 + partials * 0.5) / (losses || 1)).toFixed(2)),
          avgRR: 3.2,
          growth: Number(netR.toFixed(1)),
          cashProfit: (netR * 1000).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        });
      }
      setLoading(false);
    };
    fetchPerformance();
  }, [selectedSymbol]);

  return (
    <div className="min-h-screen bg-[#05070a] text-white pb-24 md:pb-12">
      {/* Mobile Top Header */}
      <div className="p-6 md:p-12 flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">
            KIMOO <span className="text-blue-500 not-italic">CRT</span>
          </h2>
          <p className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Institutional Node</p>
        </div>
        <div className="bg-white/5 p-3 rounded-full border border-white/10">
          <Activity size={16} className={loading ? "animate-pulse text-blue-500" : "text-zinc-400"} />
        </div>
      </div>

      <div className="px-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Quick Filter - Horizontal Scroll on Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['ALL', 'XAUUSD', 'BTCUSD', 'NAS100'].map((sym) => (
            <button 
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase border transition-all whitespace-nowrap ${
                selectedSymbol === sym ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-zinc-500'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <StatCard title="Win Rate" value={`${stats.winRate}%`} icon={<Award size={14}/>} color="text-blue-500" />
          <StatCard title="Profit Factor" value={stats.profitFactor.toString()} icon={<TrendingUp size={14}/>} color="text-green-500" />
          <StatCard title="Total Growth" value={`${stats.growth}R`} icon={<Zap size={14}/>} color="text-yellow-500" />
          <StatCard title="Cash (Est)" value={stats.cashProfit} icon={<BarChart2 size={14}/>} color="text-purple-500" />
        </div>

        {/* Chart Section */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 md:p-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <LineChart size={14} className="text-blue-500" /> Edge Sequence
            </h3>
          </div>
          <div className="h-32 md:h-48 w-full flex items-end gap-1.5 px-2">
            {recentTradeFlags.map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className={`flex-1 rounded-t-md ${h === 100 ? 'bg-blue-500' : h === 50 ? 'bg-blue-500/30' : 'bg-white/5'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM NAVIGATION (MOBILE ONLY) */}
      <div className="fixed bottom-6 left-6 right-6 md:hidden">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 flex justify-between items-center shadow-2xl">
          <NavIcon icon={<LayoutGrid size={20} />} active />
          <NavIcon icon={<History size={20} />} />
          <NavIcon icon={<ShieldCheck size={20} />} />
          <NavIcon icon={<Settings2 size={20} />} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-[1.5rem] hover:border-white/10 transition-all">
      <div className={`p-2 w-fit rounded-lg bg-white/5 mb-3 ${color}`}>{icon}</div>
      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-tight mb-1">{title}</p>
      <p className="text-lg md:text-2xl font-black text-white italic truncate">{value}</p>
    </div>
  );
}

function NavIcon({ icon, active = false }: { icon: any, active?: boolean }) {
  return (
    <div className={`transition-all ${active ? 'text-blue-500 scale-110' : 'text-zinc-600'}`}>
      {icon}
    </div>
  );
}