"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Activity, Star, Target, Shield, Clock, Zap, CheckCircle2, XCircle } from 'lucide-react';

// The High-Fidelity Signal Card Component
const SignalCard = ({ signal }: { signal: any }) => {
  const isBuy = signal.side?.toUpperCase() === 'BUY' || signal.side?.toUpperCase() === 'BULLISH';

  // NEW: Helper to get the real-time status labels
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
      className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 shadow-2xl hover:border-blue-500/20 transition-all group"
    >
      {/* Header: Status and Symbol */}
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
        
        {/* Real-time Status Badge */}
        {getStatusBadge(signal.status)}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mb-6" />

      {/* Grid Data Items */}
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

      {/* Footer: Confluences */}
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
  const [signals, setSignals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

    // LIVE REALTIME UPDATES
    const channel = supabase.channel('terminal_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, (payload) => {
        setSignals(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'signals' }, (payload) => {
        // When status changes to TP1, TP2, or SL in DB, this updates the card instantly
        setSignals(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredSignals = signals.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen bg-[#05070a] space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black tracking-tighter italic text-white uppercase">
            Alpha <span className="text-blue-500">Terminal</span>
          </h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2 leading-none">
            CRT Protocol • Real-Time Institutional Signals
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Terminal (e.g. BTCUSD)..." 
            className="w-full bg-[#0a0a0a] border border-white/5 rounded-[1.5rem] pl-12 pr-4 py-4 text-[11px] font-mono text-white focus:border-blue-500/40 outline-none transition-all shadow-2xl shadow-black" 
          />
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredSignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </AnimatePresence>
      </div>

      {filteredSignals.length === 0 && !loading && (
        <div className="py-32 flex flex-col items-center justify-center space-y-4 border border-dashed border-white/5 rounded-[3rem]">
          <Activity size={40} className="text-zinc-800 animate-pulse" />
          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">
            Waiting for Market Delivery...
          </p>
        </div>
      )}
    </div>
  );
}