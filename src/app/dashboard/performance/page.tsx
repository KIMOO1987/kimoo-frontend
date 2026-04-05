"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
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
  Layout
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

// --- HELPERS ---
const getSymbolData = (symbol: string) => {
  const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (upper.startsWith('XAU') || upper.startsWith('XAG')) return { category: 'METAL', provider: 'OANDA' };
  if (['US100', 'US30', 'US500', 'NAS100'].includes(upper)) return { category: 'INDICES', provider: 'CAPITALCOM' };
  const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD'];
  if (forexPairs.includes(upper)) return { category: 'FOREX', provider: 'FOREXCOM' };
  return { category: 'CRYPTO', provider: 'BINANCE' };
};

const DetailBox = ({ label, value, color = "text-white" }: any) => (
  <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#0d0f14] border border-white/10 w-full max-w-6xl rounded-[2rem] overflow-hidden flex flex-col lg:flex-row shadow-[0_0_80px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:w-[35%] p-8 overflow-y-auto max-h-[50vh] lg:max-h-none border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0a0c10]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">{signal.symbol}</h2>
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
          <SignalChart symbol={signal.symbol} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function PerformancePage() {
  const { loading: authLoading } = useAuth(); 
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);

  // Date Filter State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Performance Stats State
  const [stats, setStats] = useState({
    winRate: "0",
    totalTrades: 0,
    profitFactor: "0.00",
    totalNetR: "0.0",
    expectancy: "0.00"
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
      
      return symbolMatch && dateMatch;
    });

    // Recalculate stats based on the currently filtered view
    calculateStats(filtered);
    return filtered;
  }, [history, searchTerm, dateFrom, dateTo]);

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
  }, [searchTerm, dateFrom, dateTo]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <Activity size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <AccessGuard requiredTier={1} tierName="Active Member">
      <div className="p-4 md:p-8 lg:ml-72 space-y-8 flex flex-col min-h-screen">
        
        {/* Header with Date Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic text-white uppercase">
              CRT <span className="text-blue-500">Performance</span>
            </h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
              Live Strategy Analytics & Execution Metrics
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
             {/* Date Pickers */}
             <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 tracking-widest">From</label>
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-[#0a0a0a] border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none focus:border-blue-500/40 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 tracking-widest">To</label>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-[#0a0a0a] border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none focus:border-blue-500/40 transition-all"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button 
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="self-end mb-1 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative w-full md:w-64 self-end">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
              <input 
                type="text" 
                placeholder="Filter Symbol..."
                className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl text-[11px] font-mono text-white focus:border-blue-500/50 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Win Rate" value={`${stats.winRate}%`} icon={<Target size={18}/>} color="text-purple-500" />
          <StatCard label="Profit Factor" value={stats.profitFactor} icon={<TrendingUp size={18}/>} color="text-green-500" />
          <StatCard label="Total Net R" value={`+${stats.totalNetR}R`} icon={<Zap size={18}/>} color="text-blue-500" />
          <StatCard label="Expectancy" value={`${stats.expectancy}R`} icon={<Activity size={18}/>} color="text-orange-500" />
        </div>

        {/* Detailed Log Table */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden flex-grow shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] bg-black/40 border-b border-white/5">
                  <th className="px-8 py-6">Asset / Provider</th>
                  <th className="py-6">Side</th>
                  <th className="py-6">Outcome</th>
                  <th className="py-6">Realized R</th>
                  <th className="py-6 hidden md:table-cell">Execution</th>
                  <th className="px-8 py-6 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
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
                        className="group hover:bg-blue-500/[0.02] transition-colors cursor-pointer"
                      >
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-white uppercase italic tracking-tighter">{signal.symbol}</span>
                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{getSymbolData(signal.symbol).provider}</span>
                          </div>
                        </td>
                        <td className="py-5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                            signal.side?.toUpperCase() === 'BUY' || signal.side?.toUpperCase() === 'BULLISH' 
                            ? 'text-green-500 border-green-500/10 bg-green-500/5' 
                            : 'text-red-500 border-red-500/10 bg-red-500/5'
                          }`}>
                            {signal.side}
                          </span>
                        </td>
                        <td className="py-5">
                          <ResultBadge status={signal.status} />
                        </td>
                        <td className={`py-5 text-sm font-mono font-black ${
                          signal.status === 'TP2' ? 'text-green-500' : signal.status === 'SL' ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          {calculateSignalRR(signal)}
                        </td>
                        <td className="py-5 hidden md:table-cell text-[11px] font-mono text-zinc-500">
                          {new Date(signal.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <ChevronRight size={14} className="inline text-zinc-700 group-hover:text-blue-500 transition-colors" />
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                       <td colSpan={5} className="py-24 text-center">
                          <div className="flex flex-col items-center opacity-20">
                            <Activity size={40} className="mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">No History Found</p>
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
              className="p-3 rounded-full bg-[#0a0a0a] border border-white/5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                    ? 'bg-blue-500 border-blue-500 text-black shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                    : 'bg-[#0a0a0a] border-white/5 text-zinc-500 hover:border-white/20'
                  }`}
                >
                  {pageNum.toString().padStart(2, '0')}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-3 rounded-full bg-[#0a0a0a] border border-white/5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-[#0a0a0a] border border-white/5 p-5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-xl"
    >
      <div className={`${color} mb-3 opacity-80`}>{icon}</div>
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-white italic tracking-tighter">{value}</p>
    </motion.div>
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
    <div className={`flex items-center gap-1.5 ${style.color} text-[9px] font-black uppercase tracking-wider`}>
      {style.icon} {style.label}
    </div>
  );
}
