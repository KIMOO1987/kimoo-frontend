"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Activity, Zap, ArrowUpRight, TrendingUp, 
  TrendingDown, Layout, Target, Shield, Lock 
} from 'lucide-react';

export default function ActiveSignalsPage() {
  const { tier, loading: authLoading } = useAuth();
  const [activeSignals, setActiveSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View Setup Handler
  const handleViewSetup = (symbol: string) => {
    const myLayoutId = "TWlqcP20"; 
    const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
    const tvUrl = `https://www.tradingview.com/chart/${myLayoutId}/?symbol=${cleanSymbol.toUpperCase()}`;
    window.open(tvUrl, '_blank');
  };

  // Status Formatter
  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'PENDING': return 'In Progress';
      case 'TP1': return 'TP1 / --';
      case 'SL': return 'SL';
      case 'TP2': return 'TP1 / TP2';
      default: return 'In Progress';
    }
  };

  // Data Fetching
  useEffect(() => {
    if (tier < 1) return; // Block data fetch for Free users

    const fetchActive = async () => {
      setLoading(true);
      const timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .gt('created_at', timeLimit)
        .not('status', 'in', '("SL","TP2")') 
        .order('created_at', { ascending: false });

      if (error) console.error("Database Error:", error.message);
      if (data) setActiveSignals(data);
      setLoading(false);
    };

    fetchActive();
    const channel = supabase.channel('active_signals_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, () => {
        fetchActive();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tier]);

  // 1. LOADING STATE
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <Activity size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  // 2. LOCKED STATE (Tier 0)
  if (tier < 1) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[80vh] text-center">
        <div className="bg-white/[0.02] border border-white/5 p-12 rounded-[3rem] backdrop-blur-xl max-w-md border-blue-500/20">
          <div className="bg-blue-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-blue-500" />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">
            Alpha <span className="text-blue-500">Locked</span>
          </h2>
          <p className="text-zinc-500 text-[10px] mb-8 leading-relaxed uppercase font-bold tracking-[0.2em]">
            Institutional active trade monitoring is reserved for Alpha members.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard/payments'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl uppercase italic tracking-widest transition-all shadow-lg shadow-blue-500/20"
          >
            Upgrade Account
          </button>
        </div>
      </div>
    );
  }

  // 3. MAIN PAGE CONTENT (Tier 1+)
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter italic text-white uppercase">
            Active <span className="text-blue-500 text-3xl not-italic">Signals</span>
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2 italic">
            Streaming Live KIMOO CRT Chart Analytics
          </p>
        </div>
        <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/10 px-5 py-2.5 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Institutional Flow Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {activeSignals.length > 0 ? (
            activeSignals.map((signal) => (
              <motion.div
                key={signal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[450px]"
              >
                <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[100px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity ${
                  signal.side === 'BUY' ? 'bg-green-500' : 'bg-red-500'
                }`} />

                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase">{signal.symbol}</h3>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                        {signal.strategy || 'KIMOO CRT PRO'} • {signal.tf_alignment || '5M'}
                      </p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase flex items-center gap-2 ${
                      signal.side === 'BUY' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                      {signal.side === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {signal.side}
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <TradeDataRow icon={<Activity size={12} className="text-blue-500"/>} label="Status" value={getDisplayStatus(signal.status)} valueClass="text-blue-400 animate-pulse" />
                    <TradeDataRow icon={<Zap size={12}/>} label="Entry Region" value={Number(signal.entry_price || 0).toFixed(5)} />
                    <TradeDataRow icon={<Target size={12} className="text-green-500"/>} label="Price Target" value={Number(signal.tp || 0).toFixed(5)} valueClass="text-green-500" />
                    <TradeDataRow icon={<Shield size={12} className="text-red-500"/>} label="Invalidation" value={Number(signal.sl || 0).toFixed(5)} valueClass="text-red-500" />
                    
                    <div className="flex justify-between items-center py-3 border-t border-white/5 mt-4">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Signal Age</span>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase flex items-center gap-2">
                        <Clock size={12} /> {getTimeAgo(signal.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleViewSetup(signal.symbol)}
                  className="w-full bg-white text-black py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-black/20"
                >
                  <Layout size={16} /> Open Live Setup <ArrowUpRight size={16} />
                </button>
              </motion.div>
            ))
          ) : !loading && (
            <motion.div className="col-span-full py-32 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
              <Activity size={48} className="text-zinc-800 mb-6 animate-pulse" />
              <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.5em]">Awaiting Order Block Displacement...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helpers
function TradeDataRow({ icon, label, value, valueClass = "text-white" }: any) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5">
      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
        {icon} <span>{label}:</span>
      </div>
      <span className={`text-sm font-mono font-black ${valueClass}`}>{value}</span>
    </div>
  );
}

function getTimeAgo(timestamp: string) {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diff < 1) return 'JUST NOW';
  if (diff < 60) return `${diff}M AGO`;
  const hrs = Math.floor(diff / 60);
  return `${hrs}H ${diff % 60}M AGO`;
}
