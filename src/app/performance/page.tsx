"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  LineChart, TrendingUp, Award, BarChart2, Zap, Target, 
  Settings2, Activity, LayoutGrid, History, ShieldCheck,
  ChevronRight
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
      try {
        let query = supabase.from('signals').select('*').order('created_at', { ascending: false });
        if (selectedSymbol !== 'ALL') query = query.eq('symbol', selectedSymbol);
        
        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          const wins = data.filter(s => s.status === 'TP2').length;
          const partials = data.filter(s => s.status === 'TP1 + SL (BE)').length;
          const losses = data.filter(s => s.status === 'SL').length;
          const netR = (wins * 3.2) + (partials * 0.5) - (losses * 1);
          
          setRecentTradeFlags(data.slice(0, 15).map(s => 
            s.status === 'TP2' ? 100 : s.status === 'SL' ? 25 : 60
          ).reverse());

          setStats({
            totalSignals: data.length,
            winRate: Math.round(((wins + partials) / (wins + partials + losses)) * 100) || 0,
            profitFactor: Number(((wins * 3.2 + partials * 0.5) / (losses || 1)).toFixed(2)),
            avgRR: 3.2,
            growth: Number(netR.toFixed(1)),
            cashProfit: (netR * 1000).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
          });
        }
      } catch (err) {
        console.error("Error fetching signals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [selectedSymbol]);

  return (
    <div className="min-h-screen bg-[#05070a] text-white pb-32 md:pb-12 selection:bg-blue-500/30">
      
      {/* HEADER SECTION */}
      <div className="p-6 md:p-12 flex justify-between items-center max-w-7xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            KIMOO <span className="text-blue-500 not-italic">CRT</span>
            <span className="text-[10px] not-italic bg-blue-500 text-white px-2 py-0.5 rounded-md h-fit mb-4">PRO</span>
          </h2>
          <p className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] -mt-1">Institutional Signal Node</p>
        </motion.div>
        
        <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
          <Activity size={18} className={`${loading ? "animate-pulse text-blue-500" : "text-blue-400"}`} />
        </div>
      </div>

      <div className="px-6 space-y-8 max-w-7xl mx-auto">
        
        {/* ASSET SELECTOR */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
          {['ALL', 'XAUUSD', 'BTCUSD', 'NAS100', 'US30'].map((sym) => (
            <button 
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase border transition-all duration-300 whitespace-nowrap ${
                selectedSymbol === sym 
                ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* CORE STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <StatCard title="Win Rate" value={`${stats.winRate}%`} icon={<Award size={16}/>} trend="+2.4%" />
          <StatCard title="Profit Factor" value={stats.profitFactor.toString()} icon={<TrendingUp size={16}/>} trend="Stable" />
          <StatCard title="Growth" value={`${stats.growth}R`} icon={<Zap size={16}/>} trend="High" />
          <StatCard title="Net Est." value={stats.cashProfit} icon={<BarChart2 size={16}/>} trend="Live" />
        </div>

        {/* EDGE SEQUENCE CHART */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <LineChart size={120} />
          </div>

          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                <Target size={14} className="text-blue-500" /> Sequence Analysis
              </h3>
              <p className="text-[9px] text-zinc-600 font-medium uppercase mt-1">Last 15 verified CRT entries</p>
            </div>
            <button className="text-[10px] font-bold text-blue-500 flex items-center gap-1 hover:underline">
              Full History <ChevronRight size={12}/>
            </button>
          </div>

          <div className="h-40 md:h-56 w-full flex items-end gap-2 px-2 relative z-10">
            {recentTradeFlags.map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05 }}
                className={`flex-1 rounded-t-xl transition-all duration-500 ${
                  h === 100 ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 
                  h === 60 ? 'bg-white/10' : 'bg-white/5'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* FIXED BOTTOM NAVIGATION (MOBILE ONLY) */}
      <div className="fixed bottom-0 left-0 right-0 z-[999] md:hidden px-6 pb-10 pt-4 bg-gradient-to-t from-[#05070a] via-[#05070a] to-transparent">
        <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] px-8 py-5 flex justify-between items-center shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <NavIcon icon={<LayoutGrid size={22} />} label="Node" active />
          <NavIcon icon={<History size={22} />} label="Signals" />
          <NavIcon icon={<ShieldCheck size={22} />} label="Verify" />
          <NavIcon icon={<Settings2 size={22} />} label="Admin" />
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner code
function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-6 md:p-10 rounded-[2rem] hover:bg-white/[0.02] transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 rounded-2xl bg-white/5 text-blue-500 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[7px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg uppercase tracking-tighter">
          {trend}
        </span>
      </div>
      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">{title}</p>
      <p className="text-xl md:text-3xl font-black text-white italic tracking-tighter truncate">{value}</p>
    </div>
  );
}

function NavIcon({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${active ? 'text-blue-500' : 'text-zinc-500'}`}>
      {icon}
      <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-50'}`}>
        {label}
      </span>
    </button>
  );
}
