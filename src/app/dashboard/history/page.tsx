"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AccessGuard from '@/components/AccessGuard';
import SignalChart from '@/components/SignalChart';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History as HistoryIcon, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertTriangle,
  Activity,
  ChevronLeft,
  X
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

// --- 1. HELPER COMPONENTS ---
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

// --- 1.5 DYNAMIC RR CALCULATION ---
const getDynamicRR = (signal: any) => {
  const entry = Number(signal.entry_price || 0);
  const sl = Number(signal.sl || 0);
  const tp2 = Number(signal.tp_secondary || 0);
  const tp1 = Number(signal.tp || 0);

  if (!entry || !sl || entry === sl) return '0.0R';

  const risk = Math.abs(entry - sl);
  
  // Realized RR based on Outcome
  if (signal.status === 'SL') return '-1.0R';
  
  if (signal.status === 'TP2' && tp2) {
    const reward = Math.abs(tp2 - entry);
    return `+${(reward / risk).toFixed(1)}R`;
  }
  
  if (signal.status === 'TP1 + SL (BE)' && tp1) {
    const reward = Math.abs(tp1 - entry);
    return `+${(reward / risk).toFixed(1)}R`;
  }

  // Fallback to Setup RR
  const targetTp = tp2 || tp1;
  const setupReward = Math.abs(targetTp - entry);
  return `1:${(setupReward / risk).toFixed(1)}`;
};

// --- 2. MODAL COMPONENT ---
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
              <p className="text-[10px] text-blue-500 font-bold tracking-[0.2em] mt-1">HISTORICAL CRT SETUP</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><X size={20} className="text-zinc-500" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <DetailBox label="Setup Time" value={new Date(signal.created_at).toLocaleTimeString()} />
            <DetailBox label="confluences" value={signal.confluences || 'Institutional Bias Confirmed'} />
          </div>
          <div className="space-y-3">
            <PriceRow label="ENTRY ZONE" value={signal.entry_price} color="text-blue-400" />
            <PriceRow label="STOP LOSS" value={signal.sl} color="text-red-400" />
            <PriceRow label="TP 1 (EQ)" value={signal.tp} color="text-green-400" />
            <PriceRow label="TP 2 (TARGET)" value={signal.tp_secondary} color="text-green-400" />
          </div>
        </div>
        <div className="lg:w-[65%] bg-black relative flex flex-col min-h-[450px]">
          <div className="absolute top-6 left-6 z-10 flex gap-2">
             <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest ${isBuy ? 'bg-green-500/20 text-green-500 border border-green-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/20'}`}>{isBuy ? 'LONG' : 'SHORT'}</span>
             <span className="px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest bg-zinc-500/20 text-zinc-400 border border-zinc-500/20 flex items-center gap-2"><Clock size={12} /> ARCHIVED</span>
          </div>
          <SignalChart symbol={signal.symbol} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function SignalHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);
  
  // Date Filter State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    // 1. Optimistic Cache Load: Instantly show previous history
    const cached = sessionStorage.getItem('history_signals_cache');
    if (cached) {
      try {
        setHistory(JSON.parse(cached));
        setLoading(false); // Instantly hide the loader
      } catch (e) {}
    } else {
      setLoading(true);
    }

    const fetchHistory = async () => {
      const { data } = await supabase
        .from('signals')
        .select('*')
        .in('status', ['SL', 'TP2', 'TP1 + SL (BE)']) 
        .order('created_at', { ascending: false });

      if (data) {
        setHistory(data);
        // 2. Save the fresh data to cache for the next refresh
        sessionStorage.setItem('history_signals_cache', JSON.stringify(data));
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  // Combined Filter Logic: Search + Date Range
  const filteredHistory = useMemo(() => {
    return history.filter(s => {
      const symbolMatch = s.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Extract YYYY-MM-DD from created_at timestamp
      const signalDate = new Date(s.created_at).toISOString().split('T')[0];
      const dateMatch = (!dateFrom || signalDate >= dateFrom) && 
                        (!dateTo || signalDate <= dateTo);
      
      return symbolMatch && dateMatch;
    });
  }, [history, searchTerm, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo]);

  return (
    <AccessGuard requiredTier={1} tierName="Active Member">
      <div className="p-4 md:p-8 lg:ml-72 space-y-8 flex flex-col min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic text-white uppercase">
              Signal <span className="text-blue-500">Archive</span>
            </h2>
            <p className="text-zinc-500 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] mt-2">
              Historical CRT Data & Outcome Logs
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            {/* Date Filters */}
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

            {/* Search Input */}
            <div className="relative flex-grow md:w-64 self-end">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
              <input 
                type="text" 
                placeholder="Instrument..."
                className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl text-[11px] font-mono text-white focus:border-blue-500/50 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden flex-grow shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] bg-black/40 border-b border-white/5">
                  <th className="hidden md:table-cell px-8 py-6">Timestamp</th>
                  <th className="px-4 md:px-0 py-6">Instrument</th>
                  <th className="py-6">Side</th>
                  <th className="py-6">Entry</th>
                  <th className="hidden md:table-cell py-6">Strategy</th>
                  <th className="hidden md:table-cell py-6">Confluences</th>
                  <th className="py-6">Result</th>
                  <th className="hidden md:table-cell py-6 text-center">R:R</th>
                  <th className="hidden md:table-cell px-8 py-6 text-right">Chart</th>
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
                        <td className="hidden md:table-cell px-8 py-5 text-[11px] font-mono text-zinc-500">
                          {new Date(signal.created_at).toLocaleDateString()}
                          <span className="block opacity-40 text-[9px]">
                            {new Date(signal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="px-4 md:px-0 py-5">
                          <span className="text-sm font-black text-white uppercase tracking-tighter italic">
                            {signal.symbol}
                          </span>
                        </td>

                        <td className="py-5">
                          <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded border ${
                            signal.side?.toUpperCase() === 'BUY' || signal.side?.toUpperCase() === 'BULLISH' 
                              ? 'text-green-500 border-green-500/10 bg-green-500/5' 
                              : 'text-red-500 border-red-500/10 bg-red-500/5'
                          }`}>
                            {signal.side}
                          </span>
                        </td>

                        <td className="py-5 text-xs md:text-sm font-mono font-bold text-zinc-300">
                          {signal.entry_price}
                        </td>

                        <td className="hidden md:table-cell py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {signal.strategy || 'CRT Alpha'}
                        </td>

                        <td className="hidden md:table-cell py-5 text-[10px] font-medium text-zinc-500 italic max-w-[180px] truncate">
                          {signal.confluences || 'Institutional Bias Confirmed'}
                        </td>

                        <td className="py-5">
                          <ResultBadge status={signal.status} />
                        </td>

                        <td className={`hidden md:table-cell py-5 text-[11px] font-mono font-black text-center ${
                          signal.status === 'TP2' ? 'text-green-400' : 
                          signal.status === 'SL' ? 'text-red-400' : 
                          signal.status === 'TP1 + SL (BE)' ? 'text-yellow-400' : 
                          'text-blue-400'
                        }`}>
                          {getDynamicRR(signal)}
                        </td>

                        <td className="hidden md:table-cell px-8 py-5 text-right">
                          <button className="p-2 rounded-xl hover:bg-white/5 text-zinc-600 hover:text-white transition-all">
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    !loading && (
                      <tr>
                        <td colSpan={9} className="py-32 text-center">
                          <div className="flex flex-col items-center opacity-20">
                            <HistoryIcon size={48} className="mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Data Found</p>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 mb-4 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-3 rounded-full bg-[#0a0a0a] border border-white/5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2 overflow-x-auto max-w-[200px] md:max-w-none no-scrollbar">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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

        {/* Modal Overlay */}
        <AnimatePresence>
          {selectedSignal && (
            <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
          )}
        </AnimatePresence>
      </div>
    </AccessGuard>
  );
}

function ResultBadge({ status }: { status: string }) {
  if (status === 'TP2') return (
    <div className="flex items-center gap-1.5 text-green-500 text-[9px] md:text-[10px] font-black uppercase">
      <CheckCircle2 size={12} /> Hit TP2
    </div>
  );

  if (status === 'TP1 + SL (BE)') return (
    <div className="flex items-center gap-1.5 text-yellow-500 text-[9px] md:text-[10px] font-black uppercase">
      <AlertTriangle size={12} /> Partial TP1
    </div>
  );

  if (status === 'SL') return (
    <div className="flex items-center gap-1.5 text-red-500 text-[9px] md:text-[10px] font-black uppercase">
      <XCircle size={12} /> Hit SL
    </div>
  );

  return (
    <div className="flex items-center gap-1.5 text-zinc-600 text-[9px] md:text-[10px] font-black uppercase">
      <Clock size={12} /> {status}
    </div>
  );
}
