"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
import { Search, Activity, Zap, TrendingUp, Layers, Target, Wallet, BarChart3, AlertCircle } from 'lucide-react';

/**
 * SUB-COMPONENT: Top Metric Cards
 * Matches the 4 cards at the top of image_c862a4.jpg
 */
function AnalysisCard({ title, symbol, value, subValue, colorClass, icon: Icon }: any) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2rem] hover:border-white/[0.1] hover:bg-white/[0.06] transition-all duration-300 group shadow-2xl flex flex-col justify-between">
      <div className={`absolute top-0 left-0 w-full h-[2px] ${colorClass.replace('text-', 'bg-')} opacity-50 group-hover:opacity-100 transition-opacity`} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex justify-between items-start mb-6">
        <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
        {Icon && <div className={`p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] ${colorClass} group-hover:scale-110 transition-transform duration-300 shadow-lg`}><Icon size={18}/></div>}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-2 drop-shadow-md">{symbol}</h3>
        <div className="flex items-baseline gap-3">
          <span className={`text-lg md:text-xl font-black tracking-tight ${colorClass}`}>{value}</span>
          {subValue && <span className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-widest">{subValue}</span>}
        </div>
      </div>
    </div>
  );
}

export default function SymbolAudit() {
  const { loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [globalData, setGlobalData] = useState({ winRate: 0, total: 0 });
  const [search, setSearch] = useState('');
  const [assetClass, setAssetClass] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // --- SYMBOL CATEGORY HELPER ---
  const getSymbolCategory = (symbol: string) => {
    if (!symbol) return 'CRYPTO';
    const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (upper.startsWith('XAU') || upper.startsWith('XAG') || upper.startsWith('XPT') || upper.startsWith('XCU')) return 'METALS';
    if (['US100', 'US30', 'US500', 'NAS100', 'DJI', 'SPX', 'GER40'].includes(upper)) return 'INDICES';
    const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'EURJPY', 'NZDUSD', 'CHFJPY'];
    if (forexPairs.includes(upper)) return 'FOREX';
    return 'CRYPTO';
  };

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

  // Dynamic Filter Logic
  const filteredStats = useMemo(() => {
    return stats.filter(s => {
      const searchMatch = s.symbol.includes(search.toUpperCase());
      const assetMatch = assetClass === 'ALL' || getSymbolCategory(s.symbol) === assetClass;
      return searchMatch && assetMatch;
    });
  }, [stats, search, assetClass]);

  // Dynamically derived metrics for Top Cards based on current filters
  const mostProfitable = useMemo(() => [...filteredStats].sort((a, b) => b.totalRR - a.totalRR)[0], [filteredStats]);
  const highestWinRate = useMemo(() => [...filteredStats].filter(s => s.trades >= 2).sort((a, b) => b.winRate - a.winRate)[0], [filteredStats]);
  const mostTraded = useMemo(() => [...filteredStats].sort((a, b) => b.trades - a.trades)[0], [filteredStats]);
  
  const filteredGlobalData = useMemo(() => {
    let gWins = 0;
    let gTotal = 0;
    filteredStats.forEach(s => {
      gWins += s.wins;
      gTotal += (s.wins + s.losses + s.be);
    });
    return {
      winRate: gTotal > 0 ? Number(((gWins / gTotal) * 100).toFixed(1)) : 0,
      total: gTotal
    };
  }, [filteredStats]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030407]">
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <Activity size={40} className="text-zinc-700 mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Aggregating Global Audit...</p>
        </div>
      </div>
    );
  }

  return (
    <AccessGuard requiredTier={3} tierName="Lifetime Pro">
      <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden">
        
        {/* Ambient Glowing Backgrounds */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-[1700px] mx-auto relative z-10 flex flex-col min-h-screen space-y-8">
          {/* HEADER SECTION */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
                Symbol<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Audit</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
                • INSTITUTIONAL PERFORMANCE BREAKDOWN BY PAIR •
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
              {/* Asset Class Filter */}
              <div className="flex flex-col gap-1 w-full md:w-48">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest">Asset Class</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <select 
                    value={assetClass} 
                    onChange={(e) => setAssetClass(e.target.value)}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer appearance-none w-full"
                  >
                    <option value="ALL" className="bg-[#05070a]">ALL ASSETS</option>
                    <option value="CRYPTO" className="bg-[#05070a]">CRYPTO</option>
                    <option value="FOREX" className="bg-[#05070a]">FOREX</option>
                    <option value="INDICES" className="bg-[#05070a]">INDICES</option>
                    <option value="METALS" className="bg-[#05070a]">METALS</option>
                  </select>
                </div>
              </div>

              <div className="relative flex-grow md:w-64 self-end h-[42px] mb-0.5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text" placeholder="Search symbol..."
                  className="w-full h-full pl-12 pr-4 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs font-mono text-white focus:border-blue-500/50 hover:border-white/20 outline-none transition-all"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TOP METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
            <AnalysisCard 
              title="Most Profitable" 
              symbol={mostProfitable?.symbol || "---"} 
              value={mostProfitable ? `+${mostProfitable.totalRR.toFixed(2)}R` : "0.00R"} 
              colorClass="text-emerald-400" icon={Wallet}
            />
            <AnalysisCard 
              title="Highest Win Rate" 
              symbol={highestWinRate?.symbol || "---"} 
              value={highestWinRate ? `${highestWinRate.winRate}%` : "0%"} 
              subValue={highestWinRate ? `(${highestWinRate.wins}W - ${highestWinRate.losses}L)` : ""} 
              colorClass="text-blue-400" icon={Target}
            />
            <AnalysisCard 
              title="Most Traded" 
              symbol={mostTraded?.symbol || "---"} 
              value={mostTraded ? `${mostTraded.trades} Executions` : "0 Executions"} 
              colorClass="text-indigo-400" icon={BarChart3}
            />
            <AnalysisCard 
              title="Filtered Win Rate" 
              symbol={`${filteredGlobalData.winRate}%`} 
              value={`Across ${filteredGlobalData.total} Trades`} 
              colorClass="text-amber-400" icon={Activity}
            />
          </div>

          {/* DATA TABLE */}
          <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] rounded-2xl md:rounded-[2.5rem] overflow-hidden flex-grow shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-white/[0.02] border-b border-white/[0.05]">
                    {['Symbol', 'Trades', 'Wins', 'Losses', 'BE', 'Win Rate', 'Net R:R'].map((h, i) => (
                      <th key={h} className={`py-6 ${i === 0 ? 'px-6 md:px-8' : 'px-4'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredStats.length > 0 ? (
                    filteredStats.map((item) => (
                      <tr key={item.symbol} className="hover:bg-white/[0.03] transition-colors group">
                        <td className="px-6 md:px-8 py-6">
                          <span className="text-base font-black text-white uppercase tracking-tighter italic drop-shadow-sm">{item.symbol}</span>
                        </td>
                        <td className="px-4 py-6 text-[13px] font-mono font-bold text-zinc-400">{item.trades}</td>
                        <td className="px-4 py-6 text-[13px] font-mono font-black text-emerald-400/80">{item.wins}</td>
                        <td className="px-4 py-6 text-[13px] font-mono font-black text-red-400/80">{item.losses}</td>
                        <td className="px-4 py-6 text-[13px] font-mono font-bold text-zinc-500">{item.be}</td>
                        <td className="px-4 py-6 text-[13px] font-mono font-black text-blue-400">{item.winRate}%</td>
                        <td className={`px-4 py-6 text-[14px] font-mono font-black ${item.totalRR >= 0 ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}>
                          {item.totalRR >= 0 ? `+${item.totalRR.toFixed(2)}R` : `${item.totalRR.toFixed(2)}R`}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle size={40} className="text-zinc-700 mb-4" />
                          <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-2">No Audit Data Found</h3>
                          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Adjust asset class or search term.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
}
