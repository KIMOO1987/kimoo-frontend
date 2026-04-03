"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Activity, 
  Target, 
  Shield, 
  Clock, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  X 
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;

const SignalCard = ({ signal }: { signal: any }) => {
  const isBuy = signal.side?.toUpperCase() === 'BUY' || signal.side?.toUpperCase() === 'BULLISH';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[8px] font-black tracking-widest uppercase animate-pulse">
            <Activity size={10} /> In Progress
          </div>
        );
      case 'TP1':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[8px] font-black tracking-widest uppercase">
            <CheckCircle2 size={10} /> TP1 Hit
          </div>
        );
      case 'TP2':
      case 'WIN':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500 text-black text-[8px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            <CheckCircle2 size={10} /> TP1/TP2 Hit
          </div>
        );
      case 'SL':
      case 'LOSS':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[8px] font-black tracking-widest uppercase">
            <XCircle size={10} /> SL Hit
          </div>
        );
      default:
        return (
          <div className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[8px] font-black tracking-widest uppercase">
            {status}
          </div>
        );
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#0a0a0a] border border-white/5 rounded-2xl md:rounded-[2rem] p-5 md:p-6 shadow-2xl hover:border-blue-500/20 transition-all group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${isBuy ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'}`}></div>
          <div>
            <h3 className="text-xl font-black tracking-tighter text-white italic uppercase">
              {isBuy ? 'BULLISH' : 'BEARISH'} CRT | {signal.symbol}
            </h3>
            <span className="text-[9px] text-zinc-500 font-bold tracking-[0.2em] uppercase">
              {signal.strategy || 'Neural Delivery'}
            </span>
          </div>
        </div>
        {getStatusBadge(signal.status)}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mb-6" />

      <div className="space-y-4 text-[11px] font-medium">
        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-blue-500" /> <strong>TF Alignment:</strong>
          </div>
          <span className="text-white font-mono">{signal.tf_alignment || '5m-1H'}</span>
        </div>

        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-2 text-blue-400">
            <Zap size={14} className="text-blue-500" /> <strong>Entry Zone:</strong>
          </div>
          <span className="text-white font-mono font-bold">{Number(signal.entry_price || 0).toFixed(5)}</span>
        </div>

        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-2 text-red-400">
            <Shield size={14} /> <strong>Stop Loss:</strong>
          </div>
          <span className="text-red-400 font-mono font-bold">{Number(signal.sl || 0).toFixed(5)}</span>
        </div>

        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-2 text-green-400">
            <Target size={14} /> <strong>TP 1 (EQ):</strong>
          </div>
          <span className="text-green-400 font-mono font-bold">{Number(signal.tp || 0).toFixed(5)}</span>
        </div>

        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-2 text-green-400">
            <span>🚀</span> <strong>TP 2 (Target):</strong>
          </div>
          <span className="text-green-400 font-mono font-bold">{Number(signal.tp_secondary || 0).toFixed(5)}</span>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent my-6" />

      <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
        <p className="text-[9px] text-zinc-500 italic flex gap-2">
          <span className="not-italic text-blue-500">📝</span> 
          <strong>Confluences:</strong> {signal.confluences || 'Institutional Bias Confirmed'}
        </p>
      </div>

      <div className="mt-4 text-right">
        <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-tighter">
          Created: {new Date(signal.created_at).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
};

export default function SignalsPage() {
  const { loading: authLoading } = useAuth(); 
  const [signals, setSignals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Date Filter State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchSignals = async () => {
      const { data } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setSignals(data);
      setLoading(false);
    };

    fetchSignals();

    const channel = supabase.channel('terminal_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, (payload) => {
        setSignals(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'signals' }, (payload) => {
        setSignals(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Filter logic: Search + Date Range
  const filteredSignals = useMemo(() => {
    return signals.filter(s => {
      const symbolMatch = s.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const signalDate = new Date(s.created_at).toISOString().split('T')[0];
      const dateMatch = (!dateFrom || signalDate >= dateFrom) && 
                        (!dateTo || signalDate <= dateTo);
      
      return symbolMatch && dateMatch;
    });
  }, [signals, searchTerm, dateFrom, dateTo]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSignals.length / ITEMS_PER_PAGE);
  const paginatedSignals = filteredSignals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
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
      <div className="p-4 md:p-8 lg:ml-72 min-h-screen bg-[#05070a] flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
          <div className="text-left">
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic text-white uppercase">
              Alpha <span className="text-blue-500">Terminal</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2 leading-none">
              CRT Protocol • Real-Time Institutional Signals
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search symbol..." 
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-[1.2rem] pl-10 pr-4 py-3 text-[11px] font-mono text-white focus:border-blue-500/40 outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        {/* Signals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-grow">
          <AnimatePresence mode="popLayout">
            {paginatedSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredSignals.length === 0 && !loading && (
          <div className="py-20 md:py-32 flex flex-col items-center justify-center space-y-4 border border-dashed border-white/5 rounded-3xl md:rounded-[3rem]">
            <Activity size={40} className="text-zinc-800 animate-pulse" />
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">
              No Signal Data Found
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-16 mb-4 flex justify-center items-center gap-4">
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
