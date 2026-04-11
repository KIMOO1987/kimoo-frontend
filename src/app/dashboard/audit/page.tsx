"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
import { Search, Activity, Zap, TrendingUp } from 'lucide-react';

/**
 * SUB-COMPONENT: Top Metric Cards
 * Matches the 4 cards at the top of image_c862a4.jpg
 */
function AnalysisCard({ title, symbol, value, subValue, borderColor }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-xl relative overflow-hidden shadow-2xl">
      <div className={`absolute top-0 left-0 w-full h-[2px] ${borderColor}`} />
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">{title}</p>
      <h3 className="text-xl font-black text-white italic uppercase mb-1">{symbol}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-md font-bold text-white opacity-90">{value}</span>
        {subValue && <span className="text-[10px] text-blue-400 font-medium">{subValue}</span>}
      </div>
    </div>
  );
}

export default function SymbolAudit() {
  const { loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [globalData, setGlobalData] = useState({ winRate: 0, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Optimistic Cache Load: Instantly show previous audit data
    const cachedStats = sessionStorage.getItem('audit_stats_cache');
    const cachedGlobal = sessionStorage.getItem('audit_global_cache');
    
    if (cachedStats && cachedGlobal) {
      try {
        setStats(JSON.parse(cachedStats));
        setGlobalData(JSON.parse(cachedGlobal));
        setLoading(false); // Instantly hide loader
      } catch (e) {}
    } else {
      setLoading(true);
    }

    const fetchPerformance = async () => {
      const { data, error } = await supabase.from('signals').select('*');

      if (data) {
        const map: any = {};
        let gWins = 0;
        let gTotal = 0;

        data.forEach(s => {
          const sym = s.symbol?.toUpperCase();
          if (!sym) return;
          if (!map[sym]) map[sym] = { symbol: sym, trades: 0, wins: 0, losses: 0, be: 0, totalRR: 0 };
          
          map[sym].trades++;
          const status = s.status?.toUpperCase();
          
          // Calculate Realized RR for this specific signal
          const entry = Number(s.entry_price || 0);
          const sl = Number(s.sl || 0);
          const risk = Math.abs(entry - sl);
          let signalRR = 0;

          if (risk > 0) {
            if (['WIN', 'TP2'].includes(status)) {
              signalRR = Math.abs(Number(s.tp_secondary || s.tp || 0) - entry) / risk;
            } else if (['TP1', 'TP1 + SL (BE)'].includes(status)) {
              signalRR = Math.abs(Number(s.tp || 0) - entry) / risk;
            } else if (status === 'SL') {
              signalRR = -1;
            }
          }

          if (['WIN', 'TP1', 'TP2'].includes(status) && status !== 'TP1 + SL (BE)') {
            map[sym].wins++;
            gWins++;
            gTotal++;
          } else if (['LOSS', 'SL'].includes(status)) {
            map[sym].losses++;
            gTotal++;
          } else if (status === 'BE' || status === 'TP1 + SL (BE)') {
            map[sym].be++;
            gTotal++;
          }
          map[sym].totalRR += signalRR;
        });

        const formatted = Object.values(map).map((item: any) => ({
          ...item,
          winRate: Number(((item.wins / (item.wins + item.losses || 1)) * 100).toFixed(1))
        })).sort((a: any, b: any) => b.totalRR - a.totalRR);

        const globalObj = { 
          winRate: gTotal > 0 ? Number(((gWins / gTotal) * 100).toFixed(1)) : 0, 
          total: gTotal 
        };

        setStats(formatted);
        setGlobalData(globalObj);
        
        // 2. Save the fresh data to cache for the next refresh
        sessionStorage.setItem('audit_stats_cache', JSON.stringify(formatted));
        sessionStorage.setItem('audit_global_cache', JSON.stringify(globalObj));
      }
      setLoading(false);
    };
    fetchPerformance();
  }, []);

  // Derived metrics for Top Cards (Calculated once per state change)
  const mostProfitable = useMemo(() => [...stats].sort((a, b) => b.totalRR - a.totalRR)[0], [stats]);
  const highestWinRate = useMemo(() => 
    [...stats]
      .filter(s => s.trades >= 2) // Filter for significance (at least 2 trades)
      .sort((a, b) => b.winRate - a.winRate)[0], 
  [stats]);
  const mostTraded = useMemo(() => [...stats].sort((a, b) => b.trades - a.trades)[0], [stats]);

  const filtered = stats.filter(s => s.symbol.includes(search.toUpperCase()));

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#05070a]"><Activity className="text-blue-500 animate-spin" /></div>;

  return (
    <AccessGuard requiredTier={3} tierName="Lifetime Pro">
      <div className="p-4 md:p-8 lg:ml-72 space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tighter italic text-white uppercase">Symbol Audit</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Performance breakdown by trading pair</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
            <input 
              type="text" placeholder="Search symbol..."
              className="w-full pl-10 py-2.5 bg-[#0a0a0a] border border-white/5 rounded-lg text-[11px] text-white outline-none focus:border-blue-500/50 transition-all"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        

        {/* TOP METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalysisCard 
            title="Most Profitable" 
            symbol={mostProfitable?.symbol || "---"} 
            value={mostProfitable ? `+${mostProfitable.totalRR.toFixed(2)}R` : "0.00R"} 
            borderColor="bg-indigo-500" 
          />
          <AnalysisCard 
            title="Highest Win Rate" 
            symbol={highestWinRate?.symbol || "---"} 
            value={highestWinRate ? `${highestWinRate.winRate}%` : "0%"} 
            subValue={highestWinRate ? `(${highestWinRate.wins}W - ${highestWinRate.losses}L)` : ""} 
            borderColor="bg-emerald-500" 
          />
          <AnalysisCard 
            title="Most Traded" 
            symbol={mostTraded?.symbol || "---"} 
            value={mostTraded ? `${mostTraded.trades} signals` : "0 signals"} 
            borderColor="bg-sky-500" 
          />
          <AnalysisCard title="Global Win Rate" symbol={`${globalData.winRate}%`} value={`Across ${globalData.total} decided trades`} borderColor="bg-amber-500" />
        </div>

        {/* DATA TABLE */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  {['Symbol', 'Trades', 'Wins', 'Losses', 'BE', 'Win Rate', 'Total R:R'].map((h) => (
                    <th key={h} className="p-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[11px] font-bold">
                {filtered.map((item) => (
                  <tr key={item.symbol} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 text-white uppercase tracking-wider">{item.symbol}</td>
                    <td className="p-4 text-zinc-400">{item.trades}</td>
                    <td className="p-4 text-emerald-500/80">{item.wins}</td>
                    <td className="p-4 text-red-500/80">{item.losses}</td>
                    <td className="p-4 text-zinc-600">{item.be}</td>
                    <td className="p-4 text-emerald-400">{item.winRate}%</td>
                    <td className={`p-4 font-black ${item.totalRR >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {item.totalRR >= 0 ? `+${item.totalRR.toFixed(2)}R` : `${item.totalRR.toFixed(2)}R`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Activity className="animate-spin text-blue-500" size={24} />
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Aggregating Global CRT Data...</p>
            </div>
          )}
        </div>
      </div>
    </AccessGuard>
  );
}