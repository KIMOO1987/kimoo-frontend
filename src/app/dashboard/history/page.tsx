"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
import { motion, AnimatePresence } from 'framer-motion';
import SignalChart from '@/components/SignalChart';
import { 
  Search, Activity, Target, Shield, Clock, Zap, 
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  ArrowUpRight, Layout, X, AlertCircle
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;

// ... (Keep your DetailBox, PriceRow, TradeDataRow, getTimeAgo, getDisplayStatus, 
// calculateTargetRR, getDynamicRR, and SignalModal exactly as they are) ...

export default function SignalsPage() {
  const { user, loading: authLoading } = useAuth();
  
  // 1. INSTANT HYDRATION: Initialize from cache
  const [signals, setSignals] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('history_page_1_cache');
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });

  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('history_page_1_cache');
    }
    return true;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [assetClass, setAssetClass] = useState('ALL');

  // 2. SERVER-SIDE FETCHING LOGIC
  const fetchSignals = useCallback(async (page: number, isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);

    const { data, error } = await supabase.rpc('get_paginated_signals', {
      p_user_id: user.id,
      p_search: searchTerm,
      p_asset_class: assetClass,
      p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
      p_date_to: dateTo ? new Date(dateTo).toISOString() : null,
      p_page: page,
      p_page_size: ITEMS_PER_PAGE
    });

    if (data) {
      setSignals(data.signals);
      setTotalCount(data.totalCount);
      
      // Cache page 1 for instant loading next time
      if (page === 1 && searchTerm === '' && assetClass === 'ALL') {
        localStorage.setItem('history_page_1_cache', JSON.stringify(data.signals));
      }
    }
    setLoading(false);
  }, [user, searchTerm, assetClass, dateFrom, dateTo]);

  // 3. TRIGGER FETCH ON INPUT CHANGE
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSignals(currentPage);
    }, 400); // Debounce search to prevent database spam

    return () => clearTimeout(delayDebounce);
  }, [fetchSignals, currentPage]);

  // Reset to page 1 on filter change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, dateFrom, dateTo, assetClass]);

  // 4. REALTIME LISTENER
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('history_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, () => {
        fetchSignals(currentPage, true); // Silent update
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, currentPage, fetchSignals]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (authLoading || (loading && signals.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030407]">
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <Activity size={40} className="text-zinc-700 mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Loading Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <AccessGuard requiredTier={1} tierName="PRO">
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
                Alpha<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Terminal</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
                • CRT PROTOCOL • REAL-TIME INSTITUTIONAL SIGNALS •
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
              {/* Date Filters */}
              <div className="flex gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest">From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest">To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer" />
                </div>
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
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search symbol..." className="w-full h-full pl-12 pr-4 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs font-mono text-white focus:border-blue-500/50 hover:border-white/20 outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* Signals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 flex-grow">
            <AnimatePresence mode="popLayout">
              {signals.length > 0 ? (
                signals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} onClick={() => setSelectedSignal(signal)} />
                ))
              ) : (
                <div className="col-span-full w-full flex flex-col items-center justify-center py-40 border border-dashed border-white/[0.1] rounded-[2.5rem] bg-white/[0.01]">
                  <AlertCircle size={48} className="text-zinc-700 mb-6" />
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white mb-2">No Intelligence Found</h3>
                  <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Adjust filters or timeframe.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 mb-4 flex justify-center items-center gap-4">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-zinc-500 hover:bg-white/[0.05] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft size={20} /></button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Page {currentPage} of {totalPages}</span>
              </div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-zinc-500 hover:bg-white/[0.05] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight size={20} /></button>
            </div>
          )}

          {/* Modal Overlay */}
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
