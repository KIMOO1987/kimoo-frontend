"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Activity, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';

export default function PerformancePage() {
  const { loading: authLoading } = useAuth(); 
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Performance Stats State
  const [stats, setStats] = useState({
    winRate: "0",
    totalTrades: 0,
    profitFactor: "0.00",
    avgRR: "0.0"
  });

  useEffect(() => {
    const fetchPerformanceData = async () => {
      const { data } = await supabase
        .from('signals')
        .select('*')
        .in('status', ['SL', 'TP2', 'TP1 + SL (BE)']) 
        .order('created_at', { ascending: false });

      if (data) {
        setHistory(data);
        calculateStats(data);
      }
      setLoading(false);
    };

    fetchPerformanceData();
  }, []);

  const calculateStats = (data: any[]) => {
    const total = data.length;
    if (total === 0) return;

    const wins = data.filter(s => s.status === 'TP2').length;
    const partials = data.filter(s => s.status === 'TP1 + SL (BE)').length;
    const losses = data.filter(s => s.status === 'SL').length;

    // Assuming standard RR for calc (3:1 for TP2, 0.5:1 for Partial)
    const grossProfit = (wins * 3) + (partials * 0.5);
    const grossLoss = losses * 1;

    setStats({
      winRate: (((wins + partials) / total) * 100).toFixed(1),
      totalTrades: total,
      profitFactor: (grossProfit / (grossLoss || 1)).toFixed(2),
      avgRR: "3.0" // Based on CRT standards
    });
  };

  const filteredHistory = history.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <Activity size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic text-white uppercase">
            CRT <span className="text-blue-500">Performance</span>
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            Live Strategy Analytics & Execution Metrics
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input 
            type="text" 
            placeholder="Filter by Instrument..."
            className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl text-[11px] font-mono text-white focus:border-blue-500/50 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Win Rate" value={`${stats.winRate}%`} icon={<Target size={18}/>} color="text-purple-500" />
        <StatCard label="Profit Factor" value={stats.profitFactor} icon={<TrendingUp size={18}/>} color="text-green-500" />
        <StatCard label="Total Trades" value={stats.totalTrades} icon={<Zap size={18}/>} color="text-blue-500" />
        <StatCard label="Avg RR" value={stats.avgRR} icon={<Activity size={18}/>} color="text-orange-500" />
      </div>

      {/* Detailed Log Table */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] bg-black/40 border-b border-white/5">
                <th className="px-8 py-6">Instrument</th>
                <th className="py-6">Side</th>
                <th className="py-6">Outcome</th>
                <th className="py-6 hidden md:table-cell">Date</th>
                <th className="px-8 py-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredHistory.map((signal) => (
                <motion.tr 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  key={signal.id} 
                  className="group hover:bg-white/[0.01] transition-colors"
                >
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-white uppercase italic">{signal.symbol}</span>
                  </td>
                  <td className="py-5">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                      signal.side === 'BUY' ? 'text-green-500 border-green-500/10' : 'text-red-500 border-red-500/10'
                    }`}>
                      {signal.side}
                    </span>
                  </td>
                  <td className="py-5">
                    <ResultBadge status={signal.status} />
                  </td>
                  <td className="py-5 hidden md:table-cell text-[11px] font-mono text-zinc-500">
                    {new Date(signal.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <ChevronRight size={14} className="inline text-zinc-700 group-hover:text-blue-500 transition-colors" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl">
      <div className={`${color} mb-3 opacity-80`}>{icon}</div>
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-white italic tracking-tighter">{value}</p>
    </div>
  );
}

function ResultBadge({ status }: { status: string }) {
  const styles: any = {
    'TP2': { color: 'text-green-500', icon: <CheckCircle2 size={12} />, label: 'FULL TP' },
    'TP1 + SL (BE)': { color: 'text-yellow-500', icon: <AlertTriangle size={12} />, label: 'PARTIAL' },
    'SL': { color: 'text-red-500', icon: <XCircle size={12} />, label: 'STOP HIT' }
  };

  const style = styles[status] || { color: 'text-zinc-500', icon: <Clock size={12} />, label: status };

  return (
    <div className={`flex items-center gap-1.5 ${style.color} text-[9px] font-black uppercase`}>
      {style.icon} {style.label}
    </div>
  );
}