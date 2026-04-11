"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AccessGuard from '@/components/AccessGuard';
import SignalChart from '@/components/SignalChart';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Activity, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  ChevronLeft,
  X,
  Layout,
  Layers,
  AlertCircle
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

// --- HELPERS ---
const getSymbolData = (symbol: string) => {
  const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (upper.startsWith('XAU') || upper.startsWith('XAG') || upper.startsWith('XPT') || upper.startsWith('XCU')) return { category: 'METALS', provider: 'OANDA' };
  if (['US100', 'US30', 'US500', 'NAS100', 'DJI', 'SPX', 'GER40'].includes(upper)) return { category: 'INDICES', provider: 'CAPITALCOM' };
  const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'EURJPY', 'NZDUSD', 'CHFJPY'];
  if (forexPairs.includes(upper)) return { category: 'FOREX', provider: 'FOREXCOM' };
  return { category: 'CRYPTO', provider: 'BINANCE' };
};

const DetailBox = ({ label, value, color = "text-white", highlight = false }: any) => (
  <div className={`p-4 rounded-2xl border border-white/5 bg-white/[0.01] ${highlight ? 'border-blue-500/20 bg-blue-500/[0.02]' : ''}`}>
    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className={`text-[11px] font-bold truncate tracking-tight ${color}`}>{value}</p>
  </div>
);

const PriceRow = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
    <span className={`font-mono text-sm font-black ${color}`}>{Number(value || 0).toFixed(5)}</span>
  </div>
);

// --- MODAL COMPONENT ---
const SignalModal = ({ signal, onClose }: { signal: any, onClose: () => void }) => {
  if (!signal) return null;
  const isBuy = signal.side?.toUpperCase() === 'BUY' || signal.side?.toUpperCase() === 'BULLISH';

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-[#030407]/80 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-gradient-to-br from-[#0a0c10] to-[#030407] border border-white/[0.08] w-full max-w-6xl rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:w-[35%] p-8 overflow-y-auto max-h-[50vh] lg:max-h-none border-b lg:border-b-0 lg:border-r border-white/[0.05] relative">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 blur-[100px] pointer-events-none" />
          <div className="flex justify-between items-start mb-8">
            <div className="relative z-10">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-md">{signal.symbol}</h2>
              <p className="text-[10px] text-blue-500 font-bold tracking-[0.2em] mt-1">PERFORMANCE AUDIT</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><X size={20} className="text-zinc-500" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <DetailBox label="Execution Date" value={new Date(signal.created_at).toLocaleDateString()} />
            <DetailBox label="Confluences" value={signal.confluences || 'Institutional Bias Confirmed'} />
          </div>
          <div className="space-y-3">
            <PriceRow label="ENTRY" value={signal.entry_price} color="text-blue-400" />
            <PriceRow label="STOP LOSS" value={signal.sl} color="text-red-400" />
            <PriceRow label="TP 1" value={signal.tp} color="text-green-400" />
            <PriceRow label="TP 2" value={signal.tp_secondary} color="text-green-400" />
          </div>
        </div>
        <div className="lg:w-[65%] bg-black relative flex flex-col min-h-[450px]">
          <div className="absolute top-6 left-6 z-10 flex gap-2">
             <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest shadow-lg ${isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>{isBuy ? 'LONG' : 'SHORT'}</span>
             <span className="px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 flex items-center gap-2 shadow-lg"><Clock size={12} /> ARCHIVED</span>
          </div>
          <SignalChart symbol={signal.symbol} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function PerformancePage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);

  // Date Filter State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [assetClass, setAssetClass] = useState('ALL');

  // Performance Stats State
  const [stats, setStats] = useState({
    winRate: "0",
    totalTrades: 0,
    profitFactor: "0.00",
    totalNetR: "0.0",
    expectancy: "0.00"
  });

  useEffect(() => {
    // 1. Optimistic Cache Load: Instantly show previous performance data
    const cached = sessionStorage.getItem('performance_history_cache');
    if (cached) {
      try {
        setHistory(JSON.parse(cached));
        setLoading(false); // Instantly hide loader
      } catch (e) {}
    } else {
      setLoading(true);
    }

    const fetchPerformanceData = async () => {
      const { data } = await supabase
        .from('signals')
        .select('*')
        .in('status', ['SL', 'TP2', 'TP1 + SL (BE)']) 
        .order('created_at', { ascending: false });

      if (data) {
        setHistory(data);
        // 2. Save the fresh data to cache for the next refresh
        sessionStorage.setItem('performance_history_cache', JSON.stringify(data));
      }
      setLoading(false);
    };

    fetchPerformanceData();
  }, []);

  // Filter and Stats Recalculation Logic
  const filteredHistory = useMemo(() => {
    const filtered = history.filter(s => {
      const symbolMatch = s.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const signalDate = new Date(s.created_at).toISOString().split('T')[0];
      const dateMatch = (!dateFrom || signalDate >= dateFrom) && 
                        (!dateTo || signalDate <= dateTo);
      
      const assetMatch = assetClass === 'ALL' || getSymbolData(s.symbol).category === assetClass;

      return symbolMatch && dateMatch && assetMatch;
    });

    // Recalculate stats based on the currently filtered view
    calculateStats(filtered);
    return filtered;
  }, [history, searchTerm, dateFrom, dateTo, assetClass]);

  function calculateStats(data: any[]) {
    const total = data.length;
    if (total === 0) {
      setStats({ winRate: "0", totalTrades: 0, profitFactor: "0.00", totalNetR: "0.0", expectancy: "0.00" });
      return;
    }

    let grossProfit = 0;
    let grossLoss = 0;
    let wins = 0;
    let partials = 0;

    data.forEach(s => {
      const entry = Number(s.entry_price || 0);
      const sl = Number(s.sl || 0);
      const risk = Math.abs(entry - sl);
      
      if (risk > 0) {
        if (s.status === 'TP2') {
          const rValue = Math.abs(Number(s.tp_secondary || 0) - entry) / risk;
          grossProfit += rValue;
          wins++;
        } else if (s.status === 'TP1 + SL (BE)' || s.status === 'TP1') {
          const rValue = Math.abs(Number(s.tp || 0) - entry) / risk;
          grossProfit += rValue;
          partials++;
        } else if (s.status === 'SL') {
          grossLoss += 1;
        }
      }
    });

    const totalNetR = grossProfit - grossLoss;

    setStats({
      winRate: (((wins + partials) / total) * 100).toFixed(1),
      totalTrades: total,
      profitFactor: (grossProfit / (grossLoss || 1)).toFixed(2),
      totalNetR: totalNetR.toFixed(1),
      expectancy: (totalNetR / total).toFixed(2)
    });
  }

  // Calculate totalPages here to be accessible throughout the component
  const totalPages = useMemo(() => Math.ceil(filteredHistory.length / ITEMS_PER_PAGE), [filteredHistory.length]);
  const paginatedHistory = useMemo(() => filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredHistory, currentPage]);
  

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo, assetClass]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030407]">
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <Activity size={40} className="text-zinc-700 mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Loading Performance Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <AccessGuard requiredTier={1} tierName="Active Member">
      <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden">
        
        {/* Ambient Glowing Backgrounds */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-[1700px] mx-auto relative z-10 flex flex-col min-h-screen space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
                CRT<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Performance</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
                • LIVE STRATEGY ANALYTICS & EXECUTION METRICS •
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
             {/* Date Pickers */}
             <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest">From</label>
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest">To</label>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button 
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="self-end mb-1 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Asset Class Filter */}
            <div className="flex flex-col gap-1 w-full md:w-48">
              <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest">Asset Class</label>
              <select 
                value={assetClass} 
                onChange={(e) => setAssetClass(e.target.value)}
                className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer appearance-none w-full"
              >
                <option value="ALL" className="bg-[#05070a]">ALL ASSETS</option>
                <option value="CRYPTO" className="bg-[#05070a]">CRYPTO</option>
                <option value="FOREX" className="bg-[#05070a]">FOREX</option>
                <option value="INDICES" className="bg-[#05070a]">INDICES</option>
                <option value="METALS" className="bg-[#05070a]">METALS</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-grow md:w-64 self-end h-[42px] mb-0.5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Filter Symbol..."
                className="w-full h-full pl-12 pr-4 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs font-mono text-white focus:border-blue-500/50 hover:border-white/20 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard label="Win Rate" value={`${stats.winRate}%`} icon={<Target size={18}/>} color="text-indigo-400" />
          <StatCard label="Profit Factor" value={stats.profitFactor} icon={<TrendingUp size={18}/>} color="text-emerald-400" />
          <StatCard label="Total Net R" value={`+${stats.totalNetR}R`} icon={<Zap size={18}/>} color="text-blue-400" />
          <StatCard label="Expectancy" value={`${stats.expectancy}R`} icon={<Activity size={18}/>} color="text-amber-400" />
        </div>

        {/* Detailed Log Table */}
        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] rounded-2xl md:rounded-[2.5rem] overflow-hidden flex-grow shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-white/[0.02] border-b border-white/[0.05]">
                  <th className="px-6 md:px-8 py-6">Asset / Provider</th>
                  <th className="py-6">Side</th>
                  <th className="py-6">Outcome</th>
                  <th className="py-6">Realized R</th>
                  <th className="py-6 hidden md:table-cell">Execution</th>
                  <th className="px-6 md:px-8 py-6 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                <AnimatePresence mode="popLayout">
                  {paginatedHistory.length > 0 ? (
                    paginatedHistory.map((signal) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={signal.id} 
                        onClick={() => setSelectedSignal(signal)}
                        className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <td className="px-6 md:px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-base font-black text-white uppercase tracking-tighter italic drop-shadow-sm">{signal.symbol}</span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{getSymbolData(signal.symbol).provider}</span>
                          </div>
                        </td>
                        <td className="py-6">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border tracking-widest ${
                            signal.side?.toUpperCase() === 'BUY' || signal.side?.toUpperCase() === 'BULLISH' 
                              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_10px_rgba(52,211,153,0.1)]' 
                              : 'text-red-400 border-red-500/20 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                          }`}>
                            {signal.side}
                          </span>
                        </td>
                        <td className="py-6">
                          <ResultBadge status={signal.status} />
                        </td>
                        <td className={`py-6 text-[14px] font-mono font-black ${
                          signal.status === 'TP2' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 
                          signal.status === 'SL' ? 'text-red-400' : 
                          signal.status === 'TP1 + SL (BE)' ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.3)]' : 
                          'text-indigo-400'
                        }`}>
                          {calculateSignalRR(signal)}
                        </td>
                        <td className="py-6 hidden md:table-cell text-xs font-mono text-zinc-500">
                          {new Date(signal.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 md:px-8 py-6 text-center">
                          <button className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-zinc-500 hover:bg-white/[0.08] hover:text-white transition-all group-hover:border-white/20">
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle size={40} className="text-zinc-700 mb-4" />
                          <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-2">No History Found</h3>
                          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Adjust asset class or search term.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) > 1 && (
          <div className="mt-8 mb-4 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-zinc-500 hover:bg-white/[0.05] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2 overflow-x-auto max-w-[200px] md:max-w-none no-scrollbar">
              {Array.from({ length: Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[40px] h-10 rounded-xl text-[10px] font-black transition-all border ${
                    currentPage === pageNum 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500/50 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                    : 'bg-white/[0.02] border-white/[0.05] text-zinc-500 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  {pageNum.toString().padStart(2, '0')}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-zinc-500 hover:bg-white/[0.05] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {selectedSignal && (
            <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
          )}
        </AnimatePresence>
      </div>
      </div>
    </AccessGuard>
  );
}

// Sub-components
function calculateSignalRR(signal: any) {
  const entry = Number(signal.entry_price || 0);
  const sl = Number(signal.sl || 0);
  const risk = Math.abs(entry - sl);
  if (!risk) return "0.0R";

  if (signal.status === 'TP2') {
    return `+${(Math.abs(Number(signal.tp_secondary || 0) - entry) / risk).toFixed(1)}R`;
  }
  if (signal.status === 'TP1 + SL (BE)' || signal.status === 'TP1') {
    return `+${(Math.abs(Number(signal.tp || 0) - entry) / risk).toFixed(1)}R`;
  }
  if (signal.status === 'SL') return "-1.0R";
  return "0.0R";
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2rem] hover:border-white/[0.1] hover:bg-white/[0.06] transition-all duration-300 group shadow-2xl flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex justify-between items-start mb-4 md:mb-6">
        <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
        <div className={`p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] ${color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          {icon}
        </div>
      </div>
      
      <div className="relative z-10">
        <p className={`text-2xl md:text-3xl font-black italic tracking-tighter drop-shadow-md ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function ResultBadge({ status }: { status: string }) {
  if (status === 'TP2') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/5">
      <CheckCircle2 size={12} /> Full TP
    </span>
  );

  if (status === 'TP1 + SL (BE)') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-500/5">
      <AlertTriangle size={12} /> Partial Win
    </span>
  );

  if (status === 'SL') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/5">
      <XCircle size={12} /> Stopped Out
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-500/20 bg-white/[0.02] text-zinc-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">
      <Clock size={12} /> {status}
    </span>
  );
}
