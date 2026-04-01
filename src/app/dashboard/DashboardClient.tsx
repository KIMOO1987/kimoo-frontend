"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, ExternalLink, RefreshCcw, Calendar, Zap, Bell,
  ArrowRight, Target, Shield, TrendingUp, Star, Clock, X,
  Activity, BarChart3, Layers, ZapOff
} from 'lucide-react';
import ErrorModal from '@/components/ErrorModal';

interface DashboardClientProps {
  isPro: boolean;
  expiryDate?: string | null;
  userProfile: {
    fullName: string;
    country: string;
    address: string;
    email: string;
    subscriptionTier?: string; 
  };
}

export default function DashboardClient({ isPro, expiryDate, userProfile }: DashboardClientProps) {
  const [signals, setSignals] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const router = useRouter();

  const [errorState, setErrorState] = useState({ isOpen: false, title: '', message: '' });

  const daysLeft = (() => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const fetchSignals = async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('signals') 
      .select('*')
      .gt('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) console.error("Fetch Error:", error);
    else if (data) setSignals(data);
  };

  useEffect(() => {
    fetchSignals();
    const refreshInterval = setInterval(fetchSignals, 30000);
    const channel = supabase.channel('live_signals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, 
      (payload) => {
        if (payload.eventType === 'INSERT') setSignals((prev) => [payload.new, ...prev]);
        else if (payload.eventType === 'UPDATE') setSignals(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
      }).subscribe();

    return () => { 
      clearInterval(refreshInterval);
      supabase.removeChannel(channel); 
    };
  }, []);

  const handleSync = () => {
    setIsRefreshing(true);
    fetchSignals();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#050505] min-h-screen text-zinc-300 font-sans">
      <ErrorModal 
        isOpen={errorState.isOpen}
        onClose={() => setErrorState(prev => ({ ...prev, isOpen: false }))}
        title={errorState.title}
        message={errorState.message}
      />

      {/* TOP ANALYTICS HEADER (Reference Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="TOTAL SIGNALS (24H)" value={signals.length.toString()} icon={<Activity size={14}/>} />
        <StatCard label="WIN RATE EST." value="64.2%" icon={<TrendingUp size={14}/>} color="text-green-500" />
        <StatCard label="AVG. DURATION" value="1.4h" icon={<Clock size={14}/>} />
        <StatCard label="STRATEGY EDGE" value="KIMOO CRT PRO" icon={<Layers size={14}/>} color="text-blue-500" />
      </div>

      {/* UPGRADE BANNERS (Reference Style) */}
      {!isPro && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 to-indigo-600/10 border border-blue-500/30 p-6 rounded-2xl flex justify-between items-center group cursor-pointer">
            <div className="relative z-10">
              <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                <Shield size={18} className="text-blue-400"/> Unlock Premium CRT
              </h3>
              <p className="text-zinc-400 text-xs">Open execution tools, hidden analytics, and 1m bias alerts.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <ArrowRight size={20} />
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600/20 to-teal-600/10 border border-emerald-500/30 p-6 rounded-2xl flex justify-between items-center group cursor-pointer">
            <div className="relative z-10">
              <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                <Star size={18} className="text-emerald-400"/> Activate Yearly Edge
              </h3>
              <p className="text-zinc-400 text-xs">The best value plan for full institutional CRT dashboard access.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <ArrowRight size={20} />
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONSOLE AREA */}
      <div className="bg-[#0a0a0b] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Zap size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
                Active <span className="text-blue-500">Signal Console</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Real-time Node Active</span>
              </div>
            </div>
          </div>
          <button onClick={handleSync} className="p-2.5 bg-zinc-900 rounded-xl border border-white/5 hover:bg-zinc-800 transition-all">
            <RefreshCcw size={16} className={`${isRefreshing ? "animate-spin text-blue-500" : "text-zinc-400"}`} />
          </button>
        </div>

        {/* LIST TABLE */}
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] px-4">
                <th className="pb-2 pl-6">Pair / Direction</th>
                <th className="pb-2">Strategy Node</th>
                <th className="pb-2">Entry Region</th>
                <th className="pb-2">Current Status</th>
                <th className="pb-2 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => (
                <tr 
                  key={signal.id} 
                  onClick={() => setSelectedSignal(signal)}
                  className="bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group rounded-2xl"
                >
                  <td className="py-4 pl-6 rounded-l-2xl border-y border-l border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-1 h-8 rounded-full ${signal.side === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-lg font-black text-white tracking-tighter leading-none">{signal.symbol}</p>
                        <span className={`text-[10px] font-black ${signal.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                          {signal.side} • {signal.tf_alignment || '5m'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 border-y border-white/5">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">
                      {signal.strategy || 'KIMOO CRT PRO'}
                    </p>
                    <p className="text-[9px] text-zinc-600 font-mono italic">NodeID: {signal.id.slice(0, 8)}</p>
                  </td>
                  <td className="py-4 border-y border-white/5">
                    <p className="text-sm font-mono font-bold text-blue-400">
                      {signal.entry_price ? Number(signal.entry_price).toFixed(4) : 'MARKET'}
                    </p>
                  </td>
                  <td className="py-4 border-y border-white/5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${
                      signal.status === 'WIN' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      signal.status === 'LOSS' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {signal.status || 'PENDING'}
                    </span>
                  </td>
                  <td className="py-4 pr-6 rounded-r-2xl border-y border-r border-white/5 text-right">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ExternalLink size={14} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {signals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 opacity-20">
              <ZapOff size={48} className="mb-4" />
              <p className="text-sm font-black uppercase tracking-widest italic">Syncing with Market Liquidity...</p>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL (Redesigned for the new aesthetic) */}
      <AnimatePresence>
        {selectedSignal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0d0f14] border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <div className="p-8">
                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border ${selectedSignal.side === 'BUY' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {selectedSignal.symbol.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white italic">{selectedSignal.symbol}</h3>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest italic">CRT Institutional Setup</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSignal(null)} className="p-2.5 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <DetailBox label="ENTRY REGION" value={Number(selectedSignal.entry_price || 0).toFixed(4)} sub="Institutional Entry" />
                  <DetailBox label="RISK SHIELD (SL)" value={Number(selectedSignal.sl || 0).toFixed(4)} sub="Protective Bias" />
                  <DetailBox label="TARGET 01 (EQ)" value={Number(selectedSignal.tp || 0).toFixed(4)} sub="Profit Objective" />
                  <DetailBox label="TARGET 02 (FINAL)" value={Number(selectedSignal.tp_secondary || 0).toFixed(4)} sub="Extended Liquidity" />
                </div>

                <div className="mt-8 grid grid-cols-3 gap-2">
                  <Badge icon={<Star size={10}/>} label="GRADE" value={selectedSignal.grade || 'A+'} />
                  <Badge icon={<Clock size={10}/>} label="TIME" value={new Date(selectedSignal.created_at).toLocaleTimeString()} />
                  <Badge icon={<Target size={10}/>} label="PHASE" value={selectedSignal.phase || 'EXP'} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// SUPPORTING UI COMPONENTS
function StatCard({ label, value, icon, color = "text-white" }: any) {
  return (
    <div className="bg-[#0a0a0b] border border-white/5 p-4 rounded-xl flex flex-col gap-1">
      <div className="flex items-center gap-2 text-zinc-600 text-[9px] font-black tracking-widest uppercase">
        {icon} {label}
      </div>
      <div className={`text-xl font-black tracking-tighter ${color}`}>{value}</div>
    </div>
  );
}

function DetailBox({ label, value, sub }: any) {
  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-mono font-bold text-white leading-none">{value}</p>
      <p className="text-[9px] text-zinc-600 italic mt-1">{sub}</p>
    </div>
  );
}

function Badge({ icon, label, value }: any) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <span className="text-[8px] font-black text-zinc-500 uppercase mb-1 flex items-center gap-1">{icon} {label}</span>
      <span className="text-xs font-bold text-white">{value}</span>
    </div>
  );
}
