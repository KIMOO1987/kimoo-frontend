"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
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

export default function SignalHistoryPage() {
  const { loading: authLoading } = useAuth(); 
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Date Filter State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('signals')
        .select('*')
        .in('status', ['SL', 'TP2', 'TP1 + SL (BE)']) 
        .order('created_at', { ascending: false });

      if (data) setHistory(data);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <Activity size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <AccessGuard requiredTier={1} tierName="Active Member">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 flex flex-col min-h-screen">
        
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
                  <th className="py-6">Result</th>
                  <th className="hidden md:table-cell px-8 py-6 text-right">Action</th>
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
                        className="group hover:bg-blue-500/[0.02] transition-colors"
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

                        <td className="py-5">
                          <ResultBadge status={signal.status} />
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
                        <td colSpan={7} className="py-32 text-center">
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
